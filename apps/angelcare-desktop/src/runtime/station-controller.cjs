"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { createCorporateBrowser } = require("./corporate-browser.cjs");
const { DEFAULT_STATION_POLICY, normalizeStationPolicy } = require("./station-policy.cjs");
const { createStationUnlockController } = require("./station-unlock.cjs");

const REMOTE_STATION_COMMANDS = new Set([
  "ENTER_STANDARD_MODE", "ENTER_FOCUS_MODE", "ENTER_LOCKED_MODE", "LOCK_NOW",
  "UNLOCK_TEMPORARILY", "RELOCK", "OPEN_URL", "OPEN_TAB_TEMPLATE",
  "CLOSE_CORPORATE_TABS", "CLOSE_SPECIFIC_TAB", "REFRESH_STATION_POLICY",
  "RELOAD_ACTIVE_TAB", "RESTART_BROWSER_RUNTIME", "RESTART_DESKTOP_RUNTIME",
  "CLEAR_CORPORATE_BROWSER_CACHE", "CLEAR_CORPORATE_BROWSER_DATA",
  "REQUEST_STATION_DIAGNOSTICS", "SHOW_ADMINISTRATOR_MESSAGE",
  "ROTATE_STATION_CREDENTIAL", "PROVISION_OFFLINE_RECOVERY",
]);

function nowIso() { return new Date().toISOString(); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function safeString(value, max = 2000) { return String(value ?? "").trim().slice(0, max); }
function modeRank(mode) { return { standard: 0, focus: 1, locked: 2 }[mode] ?? 0; }

function createStationController(options) {
  const {
    app,
    mainWindow,
    runtime,
    logger,
    dialog,
    shell,
    saasSession,
    getInstallationId,
    getDeviceId,
    getUserId,
    getCorporateBounds,
    onStationState = () => {},
    onCorporateState = () => {},
    onActivateSystemTab = () => {},
    onActivateCorporateTab = () => {},
    requestDiagnostics = async () => null,
    restartDesktop = () => app.relaunch() || app.exit(0),
  } = options;

  const statePath = path.join(app.getPath("userData"), "corporate-station-state.json");
  let policy = normalizeStationPolicy(DEFAULT_STATION_POLICY);
  let refreshPromise = null;
  let refreshTimer = null;
  let relockTimer = null;
  let inactivityTimer = null;
  let lastActivityAt = Date.now();
  let currentMode = "standard";
  let requiredMode = "standard";
  let lastAppliedPolicyVersion = 0;
  let lastPolicySyncAt = null;
  let lastPolicyErrorAt = null;
  let temporaryUnlockUntil = null;
  let lastUnlockAt = null;
  let lastModeTransitionAt = null;
  let kioskState = false;
  let policyAcknowledged = false;
  let applyingMode = false;
  let destroyed = false;

  function readLocal() {
    try { return JSON.parse(fs.readFileSync(statePath, "utf8")); } catch { return {}; }
  }
  const persisted = readLocal();
  const processedCommandIds = new Set(Array.isArray(persisted?.processedCommandIds) ? persisted.processedCommandIds.slice(-200) : []);
  const pendingEvents = Array.isArray(persisted?.pendingEvents) ? persisted.pendingEvents.slice(-500) : [];
  if (persisted.policy) policy = normalizeStationPolicy(persisted.policy, policy);
  requiredMode = ["standard", "focus", "locked"].includes(persisted.requiredMode) ? persisted.requiredMode : policy.mode;
  currentMode = ["standard", "focus", "locked"].includes(persisted.currentMode) ? persisted.currentMode : requiredMode;
  lastAppliedPolicyVersion = Number(persisted.lastAppliedPolicyVersion || 0);
  lastPolicySyncAt = persisted.lastPolicySyncAt || null;

  function writeLocal() {
    fs.mkdirSync(path.dirname(statePath), { recursive: true, mode: 0o700 });
    const temporary = `${statePath}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify({
      schemaVersion: 1,
      policy,
      requiredMode,
      currentMode,
      lastAppliedPolicyVersion,
      lastPolicySyncAt,
      lastUnlockAt,
      lastModeTransitionAt,
      temporaryUnlockUntil,
      processedCommandIds: [...processedCommandIds].slice(-200),
      pendingEvents: pendingEvents.slice(-500),
      updatedAt: nowIso(),
    }, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temporary, statePath);
  }

  async function api(relativePath, init = {}) {
    const url = new URL(relativePath, `${runtime.appOrigin}/`).href;
    const response = await saasSession.fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-AngelCare-Desktop": "1",
        "X-AngelCare-Desktop-Version": app.getVersion(),
        "X-AngelCare-Desktop-Installation": getInstallationId(),
        ...(init.headers || {}),
      },
    });
    let payload = null;
    try { payload = await response.json(); } catch { payload = { ok: false, error: `HTTP_${response.status}` }; }
    if (!response.ok || !payload?.ok) {
      const error = new Error(payload?.error || `HTTP_${response.status}`);
      error.status = response.status;
      throw error;
    }
    return payload.data;
  }

  function stationStatus(patch = {}) {
    const browserState = corporateBrowser?.getState?.() || null;
    const unlockState = unlockController?.getStatus?.() || null;
    return Object.freeze({
      available: true,
      contractVersion: "6.0.0",
      stationVersion: "1.5.0",
      installationId: getInstallationId(),
      deviceId: getDeviceId?.() || null,
      userId: getUserId?.() || null,
      platform: process.platform,
      architecture: process.arch,
      operatingSystemVersion: os.release(),
      currentMode,
      requiredMode,
      kioskState,
      locked: currentMode === "locked",
      focus: currentMode === "focus",
      standard: currentMode === "standard",
      policyVersion: policy.policy_version,
      lastAppliedPolicyVersion,
      policyAcknowledged,
      lastPolicySyncAt,
      lastPolicyErrorAt,
      lastModeTransitionAt,
      lastUnlockAt,
      temporaryUnlockUntil,
      maximumTabs: policy.maximum_tabs,
      activeTabType: browserState?.activeTabType || null,
      tabCount: browserState?.totalTabCount || 2,
      browserHealth: browserState?.browserHealth || "initializing",
      unlock: unlockState,
      policy: clone(policy),
      ...patch,
      timestamp: nowIso(),
    });
  }

  function publish(patch = {}) {
    const status = stationStatus(patch);
    onStationState(clone(status));
    return status;
  }

  function queuePendingEvent(event) {
    pendingEvents.push(event);
    while (pendingEvents.length > 500) pendingEvents.shift();
    writeLocal();
  }

  async function flushPendingEvents() {
    if (!pendingEvents.length) return 0;
    let flushed = 0;
    while (pendingEvents.length) {
      const event = pendingEvents[0];
      try {
        await api("/api/desktop-stations/runtime/events", { method: "POST", body: JSON.stringify(event) });
        pendingEvents.shift();
        flushed += 1;
      } catch (error) {
        logger.warn("station_pending_event_flush_failed", { eventType: event?.event_type, message: error.message, remaining: pendingEvents.length });
        break;
      }
    }
    if (flushed) writeLocal();
    return flushed;
  }

  async function reportEvent(eventType, detail = {}) {
    const event = {
      event_id: crypto.randomUUID(),
      installation_id: getInstallationId(),
      device_id: getDeviceId?.() || null,
      event_type: eventType,
      mode: currentMode,
      policy_version: policy.policy_version,
      desktop_version: app.getVersion(),
      detail,
      occurred_at: nowIso(),
    };
    logger.info(`station_${eventType}`, event);
    try {
      await api("/api/desktop-stations/runtime/events", { method: "POST", body: JSON.stringify(event) });
    } catch (error) {
      queuePendingEvent(event);
      logger.warn("station_event_sync_failed", { eventType, message: error.message, queued: pendingEvents.length });
    }
  }

  const corporateBrowser = createCorporateBrowser({
    app,
    mainWindow,
    logger,
    dialog,
    shell,
    getBounds: getCorporateBounds,
    getPolicy: () => policy,
    onState: onCorporateState,
    onEvent: (event) => void reportEvent(event.event_type || "browser_event", event),
    onActivateSystemTab,
    onActivateCorporateTab,
    allowDevTools: runtime.isDevelopment && currentMode !== "locked",
  });

  const unlockController = createStationUnlockController({
    app,
    parentWindow: mainWindow,
    logger,
    getPolicy: () => policy,
    verifyOnline: async ({ method, secret, reason }) => {
      try {
        const result = await api("/api/desktop-stations/unlock/verify", {
          method: "POST",
          body: JSON.stringify({ installation_id: getInstallationId(), device_id: getDeviceId?.() || null, method, secret, reason, desktop_version: app.getVersion() }),
        });
        return { ...result, ok: result?.verified === true };
      } catch (error) {
        if (Number(error?.status || 0) >= 400 && Number(error?.status || 0) < 500) return { ok: false, reason: error.message || "UNLOCK_DENIED", explicitDenial: true };
        throw error;
      }
    },
    onAttempt: async (attempt) => reportEvent("unlock_attempt", attempt),
    onUnlocked: async (result) => {
      lastUnlockAt = nowIso();
      const duration = Math.max(0, Number(policy.auto_relock_minutes || 0));
      temporaryUnlockUntil = duration ? new Date(Date.now() + duration * 60_000).toISOString() : null;
      await applyMode("standard", { source: "administrator-unlock", allowDowngrade: true, temporary: true });
      scheduleRelock();
      writeLocal();
      await reportEvent("station_unlocked", result);
    },
    onCancelled: () => void applyMode("locked", { source: "unlock-cancelled", allowDowngrade: false }),
  });

  function safeWindowCall(method, ...args) {
    try {
      if (typeof mainWindow?.[method] === "function") return mainWindow[method](...args);
    } catch (error) { logger.warn("station_window_operation_failed", { method, message: error.message }); }
    return undefined;
  }

  function applyWindowMode(mode) {
    if (mode === "standard") {
      safeWindowCall("setAlwaysOnTop", false);
      safeWindowCall("setKiosk", false);
      safeWindowCall("setFullScreen", false);
      safeWindowCall("setResizable", true);
      safeWindowCall("setMinimizable", true);
      safeWindowCall("setMaximizable", true);
      kioskState = false;
    } else if (mode === "focus") {
      safeWindowCall("setKiosk", false);
      safeWindowCall("setFullScreen", false);
      safeWindowCall("setResizable", true);
      safeWindowCall("setMinimizable", false);
      safeWindowCall("setMaximizable", true);
      safeWindowCall("maximize");
      safeWindowCall("setAlwaysOnTop", Boolean(policy.always_on_top), "floating");
      kioskState = false;
    } else {
      safeWindowCall("setResizable", false);
      safeWindowCall("setMinimizable", false);
      safeWindowCall("setMaximizable", false);
      safeWindowCall("setAlwaysOnTop", true, "screen-saver");
      if (policy.kiosk_enforcement !== false) safeWindowCall("setKiosk", true);
      else safeWindowCall("setFullScreen", true);
      safeWindowCall("show");
      safeWindowCall("focus");
      kioskState = true;
    }
  }

  async function applyMode(requestedMode, options = {}) {
    const target = ["standard", "focus", "locked"].includes(requestedMode) ? requestedMode : "standard";
    if (applyingMode) return stationStatus();
    if (currentMode === target && !options.force) return stationStatus();
    if (modeRank(target) < modeRank(currentMode) && options.allowDowngrade !== true) {
      throw new Error("ADMINISTRATOR_UNLOCK_REQUIRED");
    }
    applyingMode = true;
    try {
      const previous = currentMode;
      currentMode = target;
      if (!options.temporary) requiredMode = target;
      applyWindowMode(target);
      lastModeTransitionAt = nowIso();
      if (target === "locked") temporaryUnlockUntil = null;
      writeLocal();
      publish();
      await reportEvent("mode_transition", { previous_mode: previous, current_mode: target, source: options.source || "policy" });
      return stationStatus();
    } finally {
      applyingMode = false;
    }
  }

  async function requestMode(target, source = "renderer") {
    const normalized = ["standard", "focus", "locked"].includes(target) ? target : null;
    if (!normalized) throw new Error("INVALID_STATION_MODE");
    if (modeRank(normalized) >= modeRank(currentMode)) return applyMode(normalized, { source, allowDowngrade: false });
    await unlockController.requestUnlock({ source: `${source}:${currentMode}->${normalized}` });
    return stationStatus();
  }

  function shouldBlockClose() {
    return !destroyed && ((currentMode === "locked") || (currentMode === "focus" && policy.confirm_before_quit));
  }

  async function requestCloseAuthorization(source = "window-close") {
    if (currentMode === "locked") return unlockController.requestUnlock({ source });
    if (currentMode === "focus" && policy.confirm_before_quit) {
      const result = await dialog.showMessageBox({
        type: "question",
        title: "Quitter ANGELCARE Corporate Station",
        message: "Confirmer la fermeture du poste corporate ?",
        detail: policy.pin_required ? "Un code administrateur sera demandé." : "La fermeture met fin à la session de travail active.",
        buttons: ["Annuler", "Continuer"],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
      });
      if (result.response !== 1) return { ok: false, cancelled: true };
      if (policy.pin_required) return unlockController.requestUnlock({ source });
      return applyMode("standard", { source, allowDowngrade: true, temporary: true });
    }
    return { ok: true };
  }

  function scheduleRelock() {
    clearTimeout(relockTimer);
    if (!temporaryUnlockUntil) return;
    const delay = Math.max(0, new Date(temporaryUnlockUntil).getTime() - Date.now());
    relockTimer = setTimeout(() => void applyMode(requiredMode === "locked" ? "locked" : policy.mode, { source: "temporary-unlock-expired", allowDowngrade: false, force: true }), delay);
  }

  function resetInactivityTimer() {
    lastActivityAt = Date.now();
    clearTimeout(inactivityTimer);
    const minutes = Number(policy.relock_after_inactivity_minutes || 0);
    if (!minutes || requiredMode !== "locked" || currentMode === "locked") return;
    inactivityTimer = setTimeout(() => void applyMode("locked", { source: "inactivity-relock", allowDowngrade: false }), minutes * 60_000);
  }

  async function acknowledgePolicy() {
    try {
      await api("/api/desktop-stations/policies/acknowledge", {
        method: "POST",
        body: JSON.stringify({ installation_id: getInstallationId(), device_id: getDeviceId?.() || null, policy_version: policy.policy_version, applied_mode: currentMode, applied_at: nowIso() }),
      });
      policyAcknowledged = true;
    } catch (error) {
      policyAcknowledged = false;
      logger.warn("station_policy_acknowledge_failed", { message: error.message, policyVersion: policy.policy_version });
    }
    publish();
  }

  async function applyPolicy(nextPolicy, source = "remote") {
    const normalized = normalizeStationPolicy(nextPolicy, policy);
    policy = normalized;
    requiredMode = normalized.mode;
    lastAppliedPolicyVersion = normalized.policy_version;
    lastPolicySyncAt = nowIso();
    lastPolicyErrorAt = null;
    policyAcknowledged = false;
    await corporateBrowser.applyPolicy(policy);
    const target = temporaryUnlockUntil && new Date(temporaryUnlockUntil).getTime() > Date.now() ? currentMode : requiredMode;
    await applyMode(target, { source: `policy:${source}`, allowDowngrade: true, force: true });
    if (policy.start_at_login && typeof app.setLoginItemSettings === "function") {
      try { app.setLoginItemSettings({ openAtLogin: true, openAsHidden: false }); } catch (error) { logger.warn("station_login_item_failed", { message: error.message }); }
    }
    resetInactivityTimer();
    writeLocal();
    await acknowledgePolicy();
    await reportEvent("policy_applied", { policy_version: policy.policy_version, source });
    return stationStatus();
  }

  async function refreshPolicy(options = {}) {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      try {
        const installationId = encodeURIComponent(getInstallationId());
        const data = await api(`/api/desktop-stations/policies/effective?installationId=${installationId}`);
        await applyPolicy(data?.policy || data || DEFAULT_STATION_POLICY, options.source || "refresh");
        return stationStatus();
      } catch (error) {
        lastPolicyErrorAt = nowIso();
        logger.warn("station_policy_refresh_failed", { message: error.message });
        if (!lastPolicySyncAt) await applyPolicy(policy, "local-fallback");
        publish({ policyError: error.message });
        return stationStatus();
      } finally {
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  }

  async function heartbeat() {
    const browser = corporateBrowser.getState();
    const unlock = unlockController.getStatus();
    const payload = {
      installation_id: getInstallationId(),
      device_id: getDeviceId?.() || null,
      desktop_version: app.getVersion(),
      station_mode: currentMode,
      required_mode: requiredMode,
      kiosk_state: kioskState,
      active_tab_type: browser.activeTabType,
      tab_count: browser.totalTabCount,
      policy_version: policy.policy_version,
      browser_health: browser.browserHealth,
      unlock_state: unlock,
      runtime_health: { policyAcknowledged, lastPolicySyncAt, lastActivityAt: new Date(lastActivityAt).toISOString() },
    };
    try {
      const result = await api("/api/desktop-stations/runtime/heartbeat", { method: "POST", body: JSON.stringify(payload) });
      await flushPendingEvents();
      if (result?.effective_policy && Number(result.effective_policy.policy_version || 0) > Number(policy.policy_version || 0)) await applyPolicy(result.effective_policy, "heartbeat");
      if (Array.isArray(result?.commands)) {
        for (const command of result.commands) {
          const commandId = safeString(command?.id, 100);
          if (!commandId || processedCommandIds.has(commandId)) continue;
          try {
            await acknowledgeCommand(commandId, "received", "Commande reçue par Corporate Station OS");
            await acknowledgeCommand(commandId, "executing", "Exécution démarrée");
            const executionResult = await executeRemoteCommand(command);
            processedCommandIds.add(commandId);
            while (processedCommandIds.size > 200) processedCommandIds.delete(processedCommandIds.values().next().value);
            writeLocal();
            await acknowledgeCommand(commandId, "completed", "Commande exécutée", executionResult);
          } catch (error) {
            await acknowledgeCommand(commandId, "failed", error instanceof Error ? error.message : String(error)).catch(() => null);
            logger.warn("station_remote_command_failed", { commandId, commandType: command?.command_type, message: error instanceof Error ? error.message : String(error) });
          }
        }
      }
      return result;
    } catch (error) {
      logger.warn("station_heartbeat_failed", { message: error.message });
      return null;
    }
  }


  async function acknowledgeCommand(commandId, state, detail, result = null) {
    return api(`/api/desktop-stations/commands/${encodeURIComponent(commandId)}/acknowledge`, {
      method: "POST",
      body: JSON.stringify({
        installation_id: getInstallationId(),
        state,
        detail: safeString(detail, 2000),
        evidence: result && typeof result === "object" ? { result } : {},
      }),
    });
  }

  async function executeRemoteCommand(command) {
    const type = safeString(command?.command_type, 100).toUpperCase();
    if (!REMOTE_STATION_COMMANDS.has(type)) throw new Error("UNSUPPORTED_STATION_COMMAND");
    const payload = command?.payload && typeof command.payload === "object" ? command.payload : {};
    switch (type) {
      case "ENTER_STANDARD_MODE": return applyMode("standard", { source: "remote-command", allowDowngrade: true });
      case "ENTER_FOCUS_MODE": return applyMode("focus", { source: "remote-command", allowDowngrade: true });
      case "ENTER_LOCKED_MODE":
      case "LOCK_NOW":
      case "RELOCK": return applyMode("locked", { source: "remote-command", allowDowngrade: false });
      case "UNLOCK_TEMPORARILY": {
        const minutes = Math.max(1, Math.min(240, Number(payload.minutes || 15)));
        temporaryUnlockUntil = new Date(Date.now() + minutes * 60_000).toISOString();
        const result = await applyMode("standard", { source: "remote-temporary-unlock", allowDowngrade: true, temporary: true });
        scheduleRelock();
        return result;
      }
      case "OPEN_URL": return corporateBrowser.createTab({ url: payload.url, title: payload.title, activate: payload.activate !== false });
      case "OPEN_TAB_TEMPLATE": return corporateBrowser.createTab({ ...payload, type: "pinned-template", activate: payload.activate !== false });
      case "CLOSE_CORPORATE_TABS": {
        for (const tab of corporateBrowser.getState().tabs.filter((entry) => !entry.protected && !entry.mandatory)) await corporateBrowser.closeTab(tab.id, { force: true });
        return corporateBrowser.getState();
      }
      case "CLOSE_SPECIFIC_TAB": return corporateBrowser.closeTab(payload.tab_id, { force: true });
      case "REFRESH_STATION_POLICY": return refreshPolicy({ source: "remote-command" });
      case "RELOAD_ACTIVE_TAB": return corporateBrowser.reload();
      case "RESTART_BROWSER_RUNTIME": {
        const snapshots = corporateBrowser.getState().tabs.filter((entry) => !entry.protected).map((entry) => ({ ...entry }));
        for (const tab of snapshots) await corporateBrowser.recoverTab(tab.id);
        return corporateBrowser.getState();
      }
      case "RESTART_DESKTOP_RUNTIME": return restartDesktop();
      case "CLEAR_CORPORATE_BROWSER_CACHE": return corporateBrowser.clearCache();
      case "CLEAR_CORPORATE_BROWSER_DATA": return corporateBrowser.clearData();
      case "REQUEST_STATION_DIAGNOSTICS": return requestDiagnostics();
      case "SHOW_ADMINISTRATOR_MESSAGE": return dialog.showMessageBox({ type: payload.severity === "critical" ? "warning" : "info", title: safeString(payload.title || "Message administrateur", 180), message: safeString(payload.message || command.reason || "Instruction ANGELCARE", 1000), detail: safeString(payload.detail || "", 2000), buttons: ["Compris"], defaultId: 0, noLink: true });
      case "ROTATE_STATION_CREDENTIAL": return unlockController.rotateCredential();
      case "PROVISION_OFFLINE_RECOVERY": return unlockController.provisionRecoveryCodes(Array.isArray(payload.codes) ? payload.codes : [], { expiresAt: payload.expires_at, credentialVersion: payload.credential_version });
      default: throw new Error("UNSUPPORTED_STATION_COMMAND");
    }
  }

  async function initialize() {
    await corporateBrowser.restore();
    if (persisted.requiredMode === "locked" && policy.relock_after_restart !== false) requiredMode = "locked";
    await applyMode(requiredMode, { source: "startup-restore", allowDowngrade: true, force: true });
    await refreshPolicy({ source: "startup" });
    clearInterval(refreshTimer);
    refreshTimer = setInterval(() => void refreshPolicy({ source: "scheduled" }).then(() => heartbeat()), 60_000);
    scheduleRelock();
    resetInactivityTimer();
    return stationStatus();
  }

  function noteActivity() { resetInactivityTimer(); }
  function resize() { corporateBrowser.resize(); }

  function destroy() {
    destroyed = true;
    clearInterval(refreshTimer);
    clearTimeout(relockTimer);
    clearTimeout(inactivityTimer);
    corporateBrowser.destroy();
    unlockController.destroy();
  }

  return Object.freeze({
    REMOTE_STATION_COMMANDS,
    initialize,
    destroy,
    resize,
    noteActivity,
    getStatus: stationStatus,
    getPolicy: () => clone(policy),
    refreshPolicy,
    applyPolicy,
    requestMode,
    applyMode,
    requestUnlock: (source = "station-ui") => unlockController.requestUnlock({ source }),
    requestCloseAuthorization,
    shouldBlockClose,
    heartbeat,
    executeRemoteCommand,
    flushPendingEvents,
    corporateBrowser,
    unlockController,
  });
}

module.exports = { REMOTE_STATION_COMMANDS, createStationController };
