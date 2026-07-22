"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { session, WebContentsView } = require("electron");
const {
  DEFAULT_STATION_POLICY,
  downloadDecision,
  evaluateUrl,
  normalizeStationPolicy,
  permissionRuleFor,
} = require("./station-policy.cjs");

const CORPORATE_PARTITION = "persist:angelcare-corporate-browser";
const SYSTEM_TABS = Object.freeze([
  { id: "angelcare-system", type: "angelcare-system", title: "ANGELCARE", protected: true, pinned: true, url: null, position: 0 },
  { id: "whatsapp-system", type: "whatsapp-system", title: "WhatsApp", protected: true, pinned: true, url: "https://web.whatsapp.com/", position: 1 },
]);

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function safeString(value, max = 2048) { return String(value ?? "").trim().slice(0, max); }
function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || min)); }
function nowIso() { return new Date().toISOString(); }

function createCorporateBrowser(options) {
  const {
    app,
    mainWindow,
    logger,
    dialog,
    shell,
    getBounds,
    getPolicy = () => DEFAULT_STATION_POLICY,
    onState = () => {},
    onEvent = () => {},
    onActivateSystemTab = () => {},
    onActivateCorporateTab = () => {},
    newTabUrl = "angelcare-desktop://newtab/index.html",
  } = options;

  const statePath = path.join(app.getPath("userData"), "corporate-tabs.json");
  const closedTabs = [];
  const tabs = new Map();
  let activeTabId = "angelcare-system";
  let corporateSession = null;
  let downloadSequence = 0;
  let recentDownloads = [];
  let recentPermissions = [];
  let currentPolicy = normalizeStationPolicy(getPolicy());
  let restoring = false;

  function readPersisted() {
    try { return JSON.parse(fs.readFileSync(statePath, "utf8")); } catch { return {}; }
  }

  function atomicWrite(value) {
    fs.mkdirSync(path.dirname(statePath), { recursive: true, mode: 0o700 });
    const temporary = `${statePath}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temporary, statePath);
  }

  function safeTab(tab) {
    return {
      id: tab.id,
      type: tab.type,
      title: tab.title,
      url: tab.url,
      favicon: tab.favicon || null,
      pinned: Boolean(tab.pinned),
      mandatory: Boolean(tab.mandatory),
      protected: Boolean(tab.protected),
      position: Number(tab.position || 0),
      zoom: Number(tab.zoom || 1),
      phase: tab.phase || "idle",
      canGoBack: Boolean(tab.canGoBack),
      canGoForward: Boolean(tab.canGoForward),
      trust: tab.trust || "corporate",
      blockedReason: tab.blockedReason || null,
      lastOpenedAt: tab.lastOpenedAt || null,
      lastCrashAt: tab.lastCrashAt || null,
      rendererStatus: tab.rendererStatus || "not-created",
    };
  }

  function orderedTabs() {
    const dynamic = [...tabs.values()].sort((left, right) => Number(left.position) - Number(right.position));
    return [...SYSTEM_TABS.map((tab) => ({ ...tab, active: activeTabId === tab.id })), ...dynamic.map((tab) => ({ ...safeTab(tab), active: activeTabId === tab.id }))];
  }

  function getState() {
    const active = tabs.get(activeTabId);
    return Object.freeze({
      available: true,
      partition: CORPORATE_PARTITION,
      activeTabId,
      activeTabType: SYSTEM_TABS.find((tab) => tab.id === activeTabId)?.type || active?.type || null,
      tabs: orderedTabs(),
      maximumTabs: currentPolicy.maximum_tabs,
      dynamicTabCount: tabs.size,
      totalTabCount: tabs.size + SYSTEM_TABS.length,
      browserHealth: active?.rendererStatus || (activeTabId.includes("system") ? "system-surface" : "idle"),
      downloads: clone(recentDownloads),
      permissions: clone(recentPermissions),
      policyVersion: currentPolicy.policy_version,
      timestamp: nowIso(),
    });
  }

  function publish(patch = {}) {
    const state = { ...getState(), ...patch };
    onState(clone(state));
    return state;
  }

  function persist() {
    if (restoring || currentPolicy.restore_tabs === false) return;
    const eligible = [...tabs.values()].filter((tab) => {
      const decision = evaluateUrl(tab.url || newTabUrl, currentPolicy, { allowLocalPages: true, newTabUrl });
      return decision.allowed;
    }).map((tab) => ({
      id: tab.id,
      type: tab.type,
      title: tab.title,
      url: tab.url,
      pinned: Boolean(tab.pinned),
      mandatory: Boolean(tab.mandatory),
      position: tab.position,
      zoom: tab.zoom,
      lastOpenedAt: tab.lastOpenedAt,
    }));
    atomicWrite({ schemaVersion: 1, activeTabId, tabs: eligible, updatedAt: nowIso() });
  }

  function setVisible(view, visible) {
    if (!view || view.webContents.isDestroyed()) return;
    view.setVisible(Boolean(visible));
    if (visible) {
      const bounds = getBounds();
      if (bounds) view.setBounds(bounds);
    }
  }

  function hideAllCorporateViews() {
    for (const tab of tabs.values()) setVisible(tab.view, false);
  }

  function updateTabNavigation(tab, patch = {}) {
    if (!tab || !tab.view || tab.view.webContents.isDestroyed()) return;
    const wc = tab.view.webContents;
    tab.url = wc.getURL() || tab.url;
    tab.title = safeString(wc.getTitle() || tab.title || "Nouvel onglet", 180);
    tab.canGoBack = wc.navigationHistory.canGoBack();
    tab.canGoForward = wc.navigationHistory.canGoForward();
    Object.assign(tab, patch);
    persist();
    publish();
  }

  function recordEvent(type, detail = {}) {
    const payload = { event_type: type, ...detail, occurred_at: nowIso() };
    logger.info(`corporate_browser_${type}`, payload);
    onEvent(payload);
  }

  function configureSession() {
    if (corporateSession) return corporateSession;
    corporateSession = session.fromPartition(CORPORATE_PARTITION, { cache: true });

    corporateSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
      const origin = details?.requestingUrl || webContents.getURL();
      const decision = evaluateUrl(origin, currentPolicy, { allowLocalPages: true, newTabUrl });
      let rule = decision.allowed ? permissionRuleFor(permission, currentPolicy, origin) : "deny";
      const mediaTypes = Array.isArray(details?.mediaTypes) ? details.mediaTypes : [];
      if (permission === "media") {
        const audioRule = mediaTypes.includes("audio") ? permissionRuleFor("microphone", currentPolicy, origin) : "allow";
        const videoRule = mediaTypes.includes("video") ? permissionRuleFor("camera", currentPolicy, origin) : "allow";
        rule = audioRule === "deny" || videoRule === "deny" ? "deny" : audioRule === "ask" || videoRule === "ask" ? "ask" : "allow";
      }
      const finish = (allowed) => {
        recentPermissions = [{ permission, origin: decision.normalizedUrl || origin, allowed, rule, mediaTypes, at: nowIso() }, ...recentPermissions].slice(0, 50);
        recordEvent("permission_decision", { permission, origin: decision.normalizedUrl || origin, allowed, rule });
        publish();
        callback(Boolean(allowed));
      };
      if (rule === "allow") return finish(true);
      if (rule !== "ask") return finish(false);
      void dialog.showMessageBox({
        type: "question",
        title: "Permission du navigateur corporate",
        message: `Autoriser ${permission} pour ${decision.host || "ce site"} ?`,
        detail: "Cette autorisation s’applique uniquement à cette demande et reste gouvernée par la politique ANGELCARE.",
        buttons: ["Refuser", "Autoriser"],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
      }).then((result) => finish(result.response === 1)).catch(() => finish(false));
    });

    corporateSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
      const origin = requestingOrigin || webContents?.getURL?.() || "";
      const decision = evaluateUrl(origin, currentPolicy, { allowLocalPages: true, newTabUrl });
      return decision.allowed && permissionRuleFor(permission, currentPolicy, origin) === "allow";
    });
    corporateSession.setDevicePermissionHandler(() => false);
    corporateSession.setDisplayMediaRequestHandler((_request, callback) => callback({}));

    corporateSession.on("will-download", (event, item, webContents) => {
      const tab = [...tabs.values()].find((candidate) => candidate.view?.webContents.id === webContents.id);
      const sourceUrl = item.getURL();
      const sourceDecision = evaluateUrl(sourceUrl, currentPolicy, { allowLocalPages: false, newTabUrl });
      const filename = path.basename(safeString(item.getFilename() || "download", 240));
      const policyDecision = downloadDecision(filename, item.getTotalBytes(), currentPolicy);
      const id = `CDL-${Date.now()}-${++downloadSequence}`;
      if (!tab || !sourceDecision.allowed || !policyDecision.allowed) {
        event.preventDefault();
        recentDownloads = [{ id, tabId: tab?.id || null, filename, sourceDomain: sourceDecision.host || null, state: "blocked", reason: sourceDecision.allowed ? policyDecision.reason : sourceDecision.reason, receivedBytes: 0, totalBytes: item.getTotalBytes(), at: nowIso() }, ...recentDownloads].slice(0, 50);
        recordEvent("download_blocked", { tab_id: tab?.id || null, filename, source_url: sourceUrl, reason: sourceDecision.allowed ? policyDecision.reason : sourceDecision.reason });
        publish();
        return;
      }

      const directory = path.join(app.getPath("downloads"), currentPolicy.browser.safe_download_directory);
      fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
      const parsed = path.parse(filename);
      const savePath = path.join(directory, `${parsed.name}-${crypto.randomBytes(3).toString("hex")}${parsed.ext}`);
      item.setSavePath(savePath);
      const record = { id, tabId: tab.id, filename, sourceDomain: sourceDecision.host || null, mimeType: item.getMimeType(), state: "progressing", reason: null, receivedBytes: 0, totalBytes: item.getTotalBytes(), savePath, at: nowIso() };
      recentDownloads = [record, ...recentDownloads].slice(0, 50);
      item.pause();

      const continueDownload = async () => {
        let approved = true;
        if (policyDecision.confirmation) {
          const result = await dialog.showMessageBox({
            type: "question",
            title: "Téléchargement corporate",
            message: `Télécharger ${filename} ?`,
            detail: `Source approuvée : ${sourceDecision.host || "inconnue"}\nDestination : ${directory}`,
            buttons: ["Annuler", "Télécharger"],
            defaultId: 1,
            cancelId: 0,
            noLink: true,
          });
          approved = result.response === 1;
        }
        if (!approved) {
          item.cancel();
          recentDownloads = recentDownloads.map((entry) => entry.id === id ? { ...entry, state: "cancelled", reason: "USER_DECLINED", completedAt: nowIso() } : entry);
          recordEvent("download_cancelled", { tab_id: tab.id, filename });
          publish();
          return;
        }
        item.resume();
        recordEvent("download_started", { tab_id: tab.id, filename, source_url: sourceUrl, save_path: savePath });
        publish();
      };
      void continueDownload().catch((error) => {
        item.cancel();
        logger.warn("corporate_download_confirmation_failed", { message: error.message, filename });
      });

      item.on("updated", (_downloadEvent, downloadState) => {
        recentDownloads = recentDownloads.map((entry) => entry.id === id ? { ...entry, state: downloadState === "interrupted" ? "interrupted" : "progressing", receivedBytes: item.getReceivedBytes(), totalBytes: item.getTotalBytes() } : entry);
        publish();
      });
      item.once("done", (_downloadEvent, downloadState) => {
        recentDownloads = recentDownloads.map((entry) => entry.id === id ? { ...entry, state: downloadState, receivedBytes: item.getReceivedBytes(), totalBytes: item.getTotalBytes(), completedAt: nowIso() } : entry);
        recordEvent("download_finished", { tab_id: tab.id, filename, state: downloadState });
        publish();
      });
    });
    return corporateSession;
  }

  function configureView(tab) {
    const wc = tab.view.webContents;
    wc.setWindowOpenHandler(({ url }) => {
      const decision = evaluateUrl(url, currentPolicy, { allowLocalPages: false, newTabUrl });
      if (decision.allowed && ["angelcare", "whatsapp"].includes(decision.trust)) {
        activateTab(decision.trust === "whatsapp" ? "whatsapp-system" : "angelcare-system");
        recordEvent("popup_routed_to_protected_system_tab", { tab_id: tab.id, url: decision.normalizedUrl, trust: decision.trust });
      } else if (decision.allowed && currentPolicy.browser.popups === "internal-tab") {
        void createTab({ url: decision.normalizedUrl, title: "Nouvel onglet", activate: true });
        recordEvent("popup_converted", { tab_id: tab.id, url: decision.normalizedUrl });
      } else {
        recordEvent("popup_blocked", { tab_id: tab.id, url, reason: decision.reason || "POPUPS_DISABLED" });
      }
      return { action: "deny" };
    });
    wc.on("will-navigate", (event, url) => {
      const decision = evaluateUrl(url, currentPolicy, { allowLocalPages: true, newTabUrl });
      if (decision.allowed) return;
      event.preventDefault();
      tab.blockedReason = decision.reason;
      recordEvent("navigation_blocked", { tab_id: tab.id, url, reason: decision.reason });
      publish({ notification: { tone: "blocked", message: `Navigation bloquée : ${decision.reason}`, url } });
    });
    wc.on("did-start-loading", () => updateTabNavigation(tab, { phase: "loading", rendererStatus: "loading", blockedReason: null }));
    wc.on("did-stop-loading", () => updateTabNavigation(tab, { phase: "ready", rendererStatus: "responsive", lastOpenedAt: nowIso() }));
    wc.on("did-navigate", (_event, url) => {
      const decision = evaluateUrl(url, currentPolicy, { allowLocalPages: true, newTabUrl });
      updateTabNavigation(tab, { url: decision.normalizedUrl || url, trust: decision.trust || "corporate", blockedReason: null });
    });
    wc.on("did-navigate-in-page", (_event, url) => updateTabNavigation(tab, { url }));
    wc.on("page-title-updated", (_event, title) => updateTabNavigation(tab, { title: safeString(title, 180) || tab.title }));
    wc.on("page-favicon-updated", (_event, favicons) => updateTabNavigation(tab, { favicon: Array.isArray(favicons) ? favicons[0] || null : null }));
    wc.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
      if (!isMainFrame || errorCode === -3) return;
      updateTabNavigation(tab, { phase: "error", rendererStatus: "load-failed", blockedReason: `${errorDescription} (${errorCode})`, url: validatedUrl || tab.url });
      recordEvent("tab_load_failed", { tab_id: tab.id, url: validatedUrl || tab.url, error_code: errorCode, error_description: errorDescription });
    });
    wc.on("unresponsive", () => {
      updateTabNavigation(tab, { phase: "unresponsive", rendererStatus: "unresponsive" });
      recordEvent("tab_unresponsive", { tab_id: tab.id, url: tab.url });
    });
    wc.on("responsive", () => updateTabNavigation(tab, { phase: "ready", rendererStatus: "responsive" }));
    wc.on("render-process-gone", (_event, details) => {
      updateTabNavigation(tab, { phase: "crashed", rendererStatus: "crashed", lastCrashAt: nowIso() });
      recordEvent("tab_crashed", { tab_id: tab.id, url: tab.url, reason: details.reason, exit_code: details.exitCode });
      if (currentPolicy.restore_after_crash) setTimeout(() => void recoverTab(tab.id), 1000);
    });
    wc.on("before-input-event", (event, input) => {
      const modifier = process.platform === "darwin" ? input.meta : input.control;
      if (!modifier || input.type !== "keyDown") return;
      if (["+", "=", "add"].includes(String(input.key).toLowerCase())) { event.preventDefault(); zoomIn(tab.id); }
      else if (["-", "subtract"].includes(String(input.key).toLowerCase())) { event.preventDefault(); zoomOut(tab.id); }
      else if (String(input.key) === "0") { event.preventDefault(); zoomReset(tab.id); }
      else if (String(input.key).toLowerCase() === "l") { event.preventDefault(); publish({ focusAddressBar: true }); }
      else if (String(input.key).toLowerCase() === "t") { event.preventDefault(); void createTab({ activate: true }); }
      else if (String(input.key).toLowerCase() === "w") { event.preventDefault(); void closeTab(tab.id); }
    });
  }

  async function createTab(input = {}) {
    currentPolicy = normalizeStationPolicy(getPolicy(), currentPolicy);
    if (tabs.size + SYSTEM_TABS.length >= currentPolicy.maximum_tabs) {
      publish({ notification: { tone: "blocked", message: `Limite de ${currentPolicy.maximum_tabs} onglets atteinte.` } });
      throw new Error("MAXIMUM_TAB_LIMIT_REACHED");
    }
    const decision = evaluateUrl(input.url || newTabUrl, currentPolicy, { allowLocalPages: true, newTabUrl });
    if (!decision.allowed) {
      recordEvent("navigation_blocked", { url: input.url || "", reason: decision.reason, source: "create-tab" });
      throw new Error(decision.reason || "URL_BLOCKED_BY_POLICY");
    }
    if (["angelcare", "whatsapp"].includes(decision.trust)) {
      const systemId = decision.trust === "whatsapp" ? "whatsapp-system" : "angelcare-system";
      activateTab(systemId);
      recordEvent("protected_destination_routed", { url: decision.normalizedUrl, system_tab_id: systemId, source: "create-tab" });
      return { ...SYSTEM_TABS.find((entry) => entry.id === systemId), active: true };
    }
    const id = safeString(input.id, 120) || crypto.randomUUID();
    if (tabs.has(id) || SYSTEM_TABS.some((tab) => tab.id === id)) throw new Error("TAB_ID_ALREADY_EXISTS");
    const position = Number.isFinite(Number(input.position)) ? Number(input.position) : tabs.size + SYSTEM_TABS.length;
    const tab = {
      id,
      type: input.type === "administrator-tool" ? "administrator-tool" : input.type === "pinned-template" ? "pinned-template" : "corporate-web",
      title: safeString(input.title || "Nouvel onglet", 180),
      url: decision.normalizedUrl,
      favicon: null,
      pinned: Boolean(input.pinned),
      mandatory: Boolean(input.mandatory),
      protected: false,
      position,
      zoom: clamp(input.zoom || 1, 0.6, 2),
      phase: "created",
      rendererStatus: "created",
      trust: decision.trust,
      blockedReason: null,
      lastOpenedAt: nowIso(),
      lastCrashAt: null,
      canGoBack: false,
      canGoForward: false,
      view: new WebContentsView({
        webPreferences: {
          session: configureSession(),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webSecurity: true,
          allowRunningInsecureContent: false,
          devTools: Boolean(options.allowDevTools),
          spellcheck: true,
          safeDialogs: true,
          safeDialogsMessage: "ANGELCARE a bloqué des dialogues répétés provenant de ce site.",
        },
      }),
    };
    tab.view.setBackgroundColor("#ffffff");
    tab.view.setVisible(false);
    mainWindow.contentView.addChildView(tab.view);
    configureView(tab);
    tabs.set(id, tab);
    try {
      await tab.view.webContents.loadURL(tab.url);
      tab.view.webContents.setZoomFactor(tab.zoom);
    } catch (error) {
      tab.phase = "error";
      tab.rendererStatus = "load-failed";
      tab.blockedReason = safeString(error.message, 500);
      logger.warn("corporate_tab_initial_load_failed", { id, url: tab.url, message: error.message });
    }
    recordEvent("tab_created", { tab_id: id, url: tab.url, type: tab.type, pinned: tab.pinned, mandatory: tab.mandatory });
    if (input.activate !== false) activateTab(id);
    else { persist(); publish(); }
    return safeTab(tab);
  }

  function activateTab(id) {
    const system = SYSTEM_TABS.find((tab) => tab.id === id);
    if (system) {
      hideAllCorporateViews();
      activeTabId = system.id;
      onActivateSystemTab(system.type);
      persist();
      return publish();
    }
    const tab = tabs.get(id);
    if (!tab) throw new Error("TAB_NOT_FOUND");
    hideAllCorporateViews();
    activeTabId = id;
    onActivateCorporateTab(safeTab(tab));
    setVisible(tab.view, true);
    tab.view.webContents.focus();
    persist();
    recordEvent("tab_activated", { tab_id: id, url: tab.url });
    return publish();
  }

  async function closeTab(id, options = {}) {
    const system = SYSTEM_TABS.find((tab) => tab.id === id);
    if (system) throw new Error("PROTECTED_SYSTEM_TAB");
    const tab = tabs.get(id);
    if (!tab) return getState();
    if ((tab.pinned || tab.mandatory) && options.force !== true) throw new Error("PINNED_OR_MANDATORY_TAB");
    closedTabs.unshift({ ...safeTab(tab), closedAt: nowIso() });
    closedTabs.splice(20);
    setVisible(tab.view, false);
    mainWindow.contentView.removeChildView(tab.view);
    if (!tab.view.webContents.isDestroyed()) tab.view.webContents.close();
    tabs.delete(id);
    const remaining = orderedTabs().filter((candidate) => candidate.id !== id);
    if (activeTabId === id) activateTab(remaining[Math.max(0, remaining.length - 1)]?.id || "angelcare-system");
    persist();
    recordEvent("tab_closed", { tab_id: id, url: tab.url, forced: options.force === true });
    return publish();
  }

  async function closeOtherTabs(id) {
    for (const tab of [...tabs.values()]) {
      if (tab.id !== id && !tab.pinned && !tab.mandatory) await closeTab(tab.id, { force: true });
    }
    return activateTab(id);
  }

  async function duplicateTab(id) {
    const tab = tabs.get(id);
    if (!tab) throw new Error("TAB_NOT_FOUND_OR_PROTECTED");
    return createTab({ url: tab.url, title: `${tab.title} — copie`, zoom: tab.zoom, activate: true });
  }

  function pinTab(id, pinned = true) {
    const tab = tabs.get(id);
    if (!tab) throw new Error("TAB_NOT_FOUND_OR_PROTECTED");
    if (tab.mandatory && !pinned) throw new Error("MANDATORY_TAB_CANNOT_BE_UNPINNED");
    tab.pinned = Boolean(pinned);
    persist();
    recordEvent("tab_pin_changed", { tab_id: id, pinned: tab.pinned });
    return publish();
  }

  function reorderTab(id, targetIndex) {
    const tab = tabs.get(id);
    if (!tab) throw new Error("TAB_NOT_FOUND_OR_PROTECTED");
    const dynamic = [...tabs.values()].sort((a, b) => a.position - b.position).filter((entry) => entry.id !== id);
    const index = Math.max(0, Math.min(dynamic.length, Math.round(Number(targetIndex) || 0)));
    dynamic.splice(index, 0, tab);
    dynamic.forEach((entry, position) => { entry.position = SYSTEM_TABS.length + position; });
    persist();
    recordEvent("tab_reordered", { tab_id: id, target_index: index });
    return publish();
  }

  async function reopenClosed() {
    const previous = closedTabs.shift();
    if (!previous) throw new Error("NO_RECENTLY_CLOSED_TAB");
    return createTab({ ...previous, id: undefined, activate: true });
  }

  async function navigate(id, input) {
    const tab = tabs.get(id || activeTabId);
    if (!tab) throw new Error("ACTIVE_CORPORATE_TAB_REQUIRED");
    const decision = evaluateUrl(input, currentPolicy, { allowLocalPages: true, newTabUrl });
    if (!decision.allowed) {
      tab.blockedReason = decision.reason;
      recordEvent("navigation_blocked", { tab_id: tab.id, url: safeString(input, 2048), reason: decision.reason });
      publish({ notification: { tone: "blocked", message: `Navigation bloquée : ${decision.reason}` } });
      throw new Error(decision.reason || "URL_BLOCKED_BY_POLICY");
    }
    if (["angelcare", "whatsapp"].includes(decision.trust)) {
      const systemId = decision.trust === "whatsapp" ? "whatsapp-system" : "angelcare-system";
      activateTab(systemId);
      recordEvent("protected_destination_routed", { tab_id: tab.id, url: decision.normalizedUrl, system_tab_id: systemId, source: "navigate" });
      return publish();
    }
    tab.blockedReason = null;
    await tab.view.webContents.loadURL(decision.normalizedUrl);
    return publish();
  }

  function navigationAction(id, action) {
    const tab = tabs.get(id || activeTabId);
    if (!tab) throw new Error("ACTIVE_CORPORATE_TAB_REQUIRED");
    const wc = tab.view.webContents;
    if (action === "back" && wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
    else if (action === "forward" && wc.navigationHistory.canGoForward()) wc.navigationHistory.goForward();
    else if (action === "reload") wc.reload();
    else if (action === "reload-no-cache") wc.reloadIgnoringCache();
    else if (action === "stop") wc.stop();
    else if (action === "home") void wc.loadURL(newTabUrl);
    return publish();
  }

  function setZoom(id, value) {
    const tab = tabs.get(id || activeTabId);
    if (!tab) throw new Error("ACTIVE_CORPORATE_TAB_REQUIRED");
    tab.zoom = Math.round(clamp(value, 0.6, 2) * 10) / 10;
    tab.view.webContents.setZoomFactor(tab.zoom);
    persist();
    recordEvent("tab_zoom_changed", { tab_id: tab.id, zoom: tab.zoom });
    return publish();
  }
  function zoomIn(id) { const tab = tabs.get(id || activeTabId); return setZoom(id, (tab?.zoom || 1) + 0.1); }
  function zoomOut(id) { const tab = tabs.get(id || activeTabId); return setZoom(id, (tab?.zoom || 1) - 0.1); }
  function zoomReset(id) { return setZoom(id, 1); }
  function fitWorkspace(id) { return setZoom(id, 0.9); }

  async function recoverTab(id) {
    const tab = tabs.get(id);
    if (!tab) throw new Error("TAB_NOT_FOUND");
    const shouldActivate = activeTabId === id;
    const snapshot = { ...safeTab(tab), id };
    await closeTab(id, { force: true });
    return createTab({ ...snapshot, activate: shouldActivate });
  }

  function resize() {
    const bounds = getBounds();
    if (!bounds) return;
    const active = tabs.get(activeTabId);
    if (active?.view?.getVisible()) active.view.setBounds(bounds);
  }

  async function applyPolicy(rawPolicy) {
    currentPolicy = normalizeStationPolicy(rawPolicy, currentPolicy);
    for (const tab of [...tabs.values()]) {
      const decision = evaluateUrl(tab.url, currentPolicy, { allowLocalPages: true, newTabUrl });
      if (!decision.allowed && !tab.mandatory) await closeTab(tab.id, { force: true });
      else if (!decision.allowed) {
        tab.blockedReason = decision.reason;
        setVisible(tab.view, false);
      }
    }
    const templates = [
      ...currentPolicy.browser.mandatory_tabs.map((tab) => ({ ...tab, mandatory: true, pinned: true })),
      ...currentPolicy.browser.pinned_tabs.map((tab) => ({ ...tab, pinned: true })),
      ...currentPolicy.browser.default_tabs,
    ].filter((tab) => !tab.allowed_modes?.length || tab.allowed_modes.includes(currentPolicy.mode));
    for (const template of templates.sort((a, b) => Number(a.order || 0) - Number(b.order || 0))) {
      const existing = [...tabs.values()].find((tab) => tab.url === evaluateUrl(template.url, currentPolicy, { allowLocalPages: true, newTabUrl }).normalizedUrl);
      if (existing) {
        existing.pinned = existing.pinned || template.pinned || template.mandatory;
        existing.mandatory = existing.mandatory || template.mandatory;
        continue;
      }
      if (tabs.size + SYSTEM_TABS.length >= currentPolicy.maximum_tabs) break;
      try { await createTab({ ...template, type: "pinned-template", activate: false }); } catch (error) { logger.warn("corporate_template_open_failed", { url: template.url, message: error.message }); }
    }
    persist();
    recordEvent("policy_applied", { policy_version: currentPolicy.policy_version, maximum_tabs: currentPolicy.maximum_tabs });
    return publish();
  }

  async function clearCache() {
    await configureSession().clearCache();
    recentDownloads = [];
    recordEvent("cache_cleared");
    return publish();
  }

  async function clearData() {
    await configureSession().clearStorageData({ storages: ["cookies", "localstorage", "indexdb", "serviceworkers", "cachestorage", "websql", "shadercache"] });
    await configureSession().clearCache();
    recordEvent("browser_data_cleared");
    return publish();
  }

  async function openDownloads() {
    const directory = path.join(app.getPath("downloads"), currentPolicy.browser.safe_download_directory);
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    const error = await shell.openPath(directory);
    if (error) throw new Error(error);
    return { ok: true, directory };
  }

  async function restore() {
    restoring = true;
    try {
      const persisted = readPersisted();
      const candidates = currentPolicy.restore_tabs !== false && Array.isArray(persisted.tabs) ? persisted.tabs : [];
      for (const snapshot of candidates.slice(0, Math.max(0, currentPolicy.maximum_tabs - SYSTEM_TABS.length))) {
        try { await createTab({ ...snapshot, activate: false }); } catch (error) { logger.warn("corporate_tab_restore_skipped", { url: snapshot?.url, message: error.message }); }
      }
      await applyPolicy(currentPolicy);
      const desired = persisted.activeTabId;
      if (desired && (tabs.has(desired) || SYSTEM_TABS.some((tab) => tab.id === desired))) activateTab(desired);
      else activateTab(currentPolicy.startup_surface || "angelcare-system");
    } finally {
      restoring = false;
      persist();
    }
    return publish();
  }

  function destroy() {
    for (const tab of tabs.values()) {
      try {
        setVisible(tab.view, false);
        mainWindow.contentView.removeChildView(tab.view);
        if (!tab.view.webContents.isDestroyed()) tab.view.webContents.close();
      } catch (error) { logger.warn("corporate_tab_destroy_failed", { tabId: tab.id, message: error.message }); }
    }
    tabs.clear();
  }

  return Object.freeze({
    partition: CORPORATE_PARTITION,
    getState,
    createTab,
    closeTab,
    closeOtherTabs,
    duplicateTab,
    activateTab,
    pinTab,
    reorderTab,
    reopenClosed,
    navigate,
    back: (id) => navigationAction(id, "back"),
    forward: (id) => navigationAction(id, "forward"),
    reload: (id) => navigationAction(id, "reload"),
    reloadIgnoringCache: (id) => navigationAction(id, "reload-no-cache"),
    stop: (id) => navigationAction(id, "stop"),
    home: (id) => navigationAction(id, "home"),
    setZoom,
    zoomIn,
    zoomOut,
    zoomReset,
    fitWorkspace,
    recoverTab,
    resize,
    restore,
    applyPolicy,
    clearCache,
    clearData,
    openDownloads,
    destroy,
  });
}

module.exports = { CORPORATE_PARTITION, SYSTEM_TABS, createCorporateBrowser };
