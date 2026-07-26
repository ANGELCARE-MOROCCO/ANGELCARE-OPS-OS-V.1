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

// SYSTEM_TAB_ZOOM_PARITY_V1
const CORPORATE_PARTITION = "persist:angelcare-corporate-browser";
const ANGELCARE_WORKSPACE_TYPE = "angelcare-workspace";
const PERSISTENCE_SCHEMA_VERSION = 3;
const SYSTEM_TABS = Object.freeze([
  { id: "angelcare-system", type: "angelcare-system", title: "ANGELCARE", protected: true, pinned: true, url: null, position: 0, trust: "angelcare" },
  { id: "whatsapp-system", type: "whatsapp-system", title: "WhatsApp", protected: true, pinned: true, url: "https://web.whatsapp.com/", position: 1, trust: "whatsapp" },
]);

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function safeString(value, max = 2048) { return String(value ?? "").trim().slice(0, max); }
function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || min)); }
function nowIso() { return new Date().toISOString(); }
function unique(values) { return [...new Set(Array.isArray(values) ? values.filter(Boolean) : [])]; }

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
    onDividerLayout = () => {},
    getSystemTabWebContents = () => null,
    getSystemTabView = () => null,
    getSystemTabStatus = () => ({}),
    trustedAngelcareSession = null,
    trustedPreloadPath = null,
    angelcareOrigin = "",
    angelcareDashboardUrl = "",
    newTabUrl = "angelcare-desktop://newtab/index.html",
    initialOperatingMode = null,
  } = options;

  const statePath = path.join(app.getPath("userData"), "corporate-tabs.json");
  const closedTabs = [];
  const tabs = new Map();
  const systemZooms = new Map(SYSTEM_TABS.map((tab) => [tab.id, 1]));
  let activeTabId = "angelcare-system";
  let corporateSession = null;
  let downloadSequence = 0;
  let recentDownloads = [];
  let recentPermissions = [];
  let currentPolicy = normalizeStationPolicy(getPolicy());
  let operatingMode = ["standard", "focus", "locked"].includes(String(initialOperatingMode || "").toLowerCase())
    ? String(initialOperatingMode).toLowerCase()
    : currentPolicy.mode;
  let restoring = false;
  let persistenceCorrupt = false;
  let lastDividerLayout = [];
  let split = {
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    mode: 1,
    paneTabIds: [],
    focusedPaneId: null,
    maximizedPaneId: null,
    ratios: { columns: [0.5, 0.6667], rows: [0.5] },
    selector: { open: false, requestedMode: null, targetPaneId: null, selectedTabIds: [] },
  };

  function readPersisted() {
    try {
      const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
      persistenceCorrupt = false;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      if (error?.code !== "ENOENT") {
        persistenceCorrupt = true;
        logger.warn("workspace_persistence_corrupt_fallback", { path: statePath, message: error.message });
      }
      return {};
    }
  }

  function atomicWrite(value) {
    fs.mkdirSync(path.dirname(statePath), { recursive: true, mode: 0o700 });
    const temporary = `${statePath}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temporary, statePath);
  }

  function policyMode() { return operatingMode || currentPolicy.mode || "standard"; }
  function acPlusAllowed() {
    const modes = Array.isArray(currentPolicy.ac_plus_allowed_modes) ? currentPolicy.ac_plus_allowed_modes : ["standard", "focus", "locked"];
    return currentPolicy.ac_plus_enabled !== false && modes.includes(policyMode());
  }
  function splitAllowed() {
    const modes = Array.isArray(currentPolicy.split_allowed_modes) ? currentPolicy.split_allowed_modes : ["standard", "focus", "locked"];
    return currentPolicy.split_enabled !== false && modes.includes(policyMode());
  }
  function acPlusDisabledReason() {
    if (currentPolicy.ac_plus_enabled === false) return "AC+ est désactivé par la politique de la station.";
    if (!acPlusAllowed()) return `AC+ n’est pas autorisé en mode ${policyMode()}.`;
    if (workspaceTabs().length >= maximumAcPlusTabs()) return `Limite de ${maximumAcPlusTabs()} espaces AC+ atteinte.`;
    return null;
  }
  function splitDisabledReason() {
    if (currentPolicy.split_enabled === false) return "Les écrans divisés sont désactivés par la politique de la station.";
    if (!splitAllowed()) return `Les écrans divisés ne sont pas autorisés en mode ${policyMode()}.`;
    if (eligibleTabs().length < 2) return "Ouvrez au moins deux espaces éligibles.";
    return null;
  }
  function maximumAcPlusTabs() {
    return Math.max(1, Number(currentPolicy.maximum_ac_plus_tabs || Math.max(1, Number(currentPolicy.maximum_tabs || 14) - SYSTEM_TABS.length)));
  }
  function totalMaximumTabs() {
    return Math.max(SYSTEM_TABS.length + 1, Number(currentPolicy.maximum_tabs || (maximumAcPlusTabs() + SYSTEM_TABS.length)));
  }

  function workspaceTabs() { return [...tabs.values()].filter((tab) => tab.type === ANGELCARE_WORKSPACE_TYPE); }
  function getDynamicTab(id) { return tabs.get(String(id || "")) || null; }
  function getTabView(id) {
    const dynamic = getDynamicTab(id);
    if (dynamic) return dynamic.view;
    return getSystemTabView(String(id || "")) || null;
  }
  function getTabWebContents(id) {
    const dynamic = getDynamicTab(id);
    if (dynamic) return dynamic.view?.webContents || null;
    return getSystemTabWebContents(String(id || "")) || null;
  }
  function tabExists(id) { return Boolean(getDynamicTab(id) || SYSTEM_TABS.some((tab) => tab.id === id)); }
  function isTrustedAngelcareSender(webContentsId) {
    return workspaceTabs().some((tab) => tab.view?.webContents?.id === Number(webContentsId));
  }

  function systemSnapshot(system) {
    const wc = getSystemTabWebContents(system.id);
    const status = getSystemTabStatus(system.id) || {};
    const history = wc && !wc.isDestroyed?.() ? wc.navigationHistory : null;
    const whatsappDormant = system.id === "whatsapp-system" && status.activated !== true;
    return {
      ...system,
      title: safeString(status.title || system.title, 180),
      url: system.id === "angelcare-system" ? (wc?.getURL?.() || status.url || null) : WHATSAPP_SYSTEM_URL,
      zoom: Number(systemZooms.get(system.id) || 1),
      phase: whatsappDormant ? (status.phase || "dormant") : (status.phase || "ready"),
      rendererStatus: whatsappDormant ? "dormant-placeholder" : (status.rendererStatus || "system-surface"),
      active: activeTabId === system.id,
      splitMember: split.paneTabIds.includes(system.id),
      focusedPane: focusedTabId() === system.id,
      canGoBack: system.id === "angelcare-system" ? Boolean(history?.canGoBack?.()) : false,
      canGoForward: system.id === "angelcare-system" ? Boolean(history?.canGoForward?.()) : false,
      dormant: whatsappDormant,
      activated: status.activated === true,
      blockedReason: status.blockedReason || status.detail || null,
    };
  }

  const WHATSAPP_SYSTEM_URL = "https://web.whatsapp.com/";

  function safeTab(tab) {
    return {
      id: tab.id,
      type: tab.type,
      title: tab.title,
      url: tab.url,
      favicon: tab.favicon || null,
      pinned: Boolean(tab.pinned),
      mandatory: Boolean(tab.mandatory),
      protected: false,
      position: Number(tab.position || 0),
      zoom: Number(tab.zoom || 1),
      phase: tab.phase || "idle",
      canGoBack: Boolean(tab.canGoBack),
      canGoForward: Boolean(tab.canGoForward),
      trust: tab.trust || (tab.type === ANGELCARE_WORKSPACE_TYPE ? "angelcare" : "corporate"),
      blockedReason: tab.blockedReason || null,
      lastOpenedAt: tab.lastOpenedAt || null,
      lastCrashAt: tab.lastCrashAt || null,
      rendererStatus: tab.rendererStatus || "not-created",
      splitMember: split.paneTabIds.includes(tab.id),
      focusedPane: focusedTabId() === tab.id,
      active: activeTabId === tab.id,
    };
  }

  function orderedTabs() {
    const dynamic = [...tabs.values()].sort((left, right) => Number(left.position) - Number(right.position));
    return [...SYSTEM_TABS.map(systemSnapshot), ...dynamic.map(safeTab)];
  }

  function paneIdsForMode(mode = split.mode) {
    return Array.from({ length: Math.max(0, Number(mode) || 0) }, (_unused, index) => `pane-${index + 1}`);
  }
  function focusedPaneIndex() {
    const ids = paneIdsForMode();
    const index = ids.indexOf(split.focusedPaneId);
    return index >= 0 ? index : 0;
  }
  function focusedTabId() {
    if (split.mode > 1) return split.paneTabIds[focusedPaneIndex()] || activeTabId;
    return activeTabId;
  }

  function isEligibleTab(tab) {
    if (!tab || tab.phase === "crashed" || tab.rendererStatus === "crashed") return false;
    if (tab.id === "whatsapp-system") return tab.activated === true;
    if (tab.type === "angelcare-system" || tab.type === ANGELCARE_WORKSPACE_TYPE) return true;
    return ["corporate-web", "pinned-template", "administrator-tool"].includes(tab.type);
  }
  function eligibleTabs() { return orderedTabs().filter(isEligibleTab); }
  function availableSplitModes() {
    const count = eligibleTabs().length;
    const policyModes = Array.isArray(currentPolicy.split_modes) ? currentPolicy.split_modes : [2, 3, 4];
    return [2, 3, 4].filter((mode) => policyModes.includes(mode) && count >= mode && splitAllowed());
  }

  function safeSplitState() {
    const eligible = eligibleTabs();
    return {
      schemaVersion: PERSISTENCE_SCHEMA_VERSION,
      mode: split.mode,
      paneTabIds: [...split.paneTabIds],
      paneIds: paneIdsForMode(),
      focusedPaneId: split.focusedPaneId,
      focusedTabId: focusedTabId(),
      maximizedPaneId: split.maximizedPaneId,
      ratios: clone(split.ratios),
      selector: clone(split.selector),
      eligibleTabs: eligible.map((tab) => ({ id: tab.id, title: tab.title, type: tab.type, url: tab.url, active: tab.active, splitMember: tab.splitMember, dormant: tab.dormant === true })),
      eligibleCount: eligible.length,
      availableModes: availableSplitModes(),
      enabled: splitAllowed(),
      disabledReason: splitDisabledReason(),
      dividerCount: lastDividerLayout.length,
    };
  }

  function getState() {
    const active = getDynamicTab(activeTabId);
    return Object.freeze({
      available: true,
      partition: CORPORATE_PARTITION,
      trustedAngelcarePartition: trustedAngelcareSession ? "persist:angelcare-saas" : null,
      activeTabId,
      activeTabType: SYSTEM_TABS.find((tab) => tab.id === activeTabId)?.type || active?.type || null,
      tabs: orderedTabs(),
      maximumTabs: totalMaximumTabs(),
      maximumAcPlusTabs: maximumAcPlusTabs(),
      dynamicTabCount: tabs.size,
      acPlusTabCount: workspaceTabs().length,
      totalTabCount: tabs.size + SYSTEM_TABS.length,
      browserHealth: active?.rendererStatus || (activeTabId.includes("system") ? "system-surface" : "idle"),
      downloads: clone(recentDownloads),
      permissions: clone(recentPermissions),
      policyVersion: currentPolicy.policy_version,
      policyMode: currentPolicy.mode || "standard",
      operatingMode: policyMode(),
      acPlus: { enabled: acPlusAllowed() && !acPlusDisabledReason(), disabledReason: acPlusDisabledReason(), label: "AC+" },
      split: safeSplitState(),
      persistence: { schemaVersion: PERSISTENCE_SCHEMA_VERSION, corruptFallback: persistenceCorrupt },
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
      if (tab.type === ANGELCARE_WORKSPACE_TYPE) return isAllowedAngelcareUrl(tab.url);
      return evaluateUrl(tab.url || newTabUrl, currentPolicy, { allowLocalPages: true, newTabUrl }).allowed;
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
    atomicWrite({
      schemaVersion: PERSISTENCE_SCHEMA_VERSION,
      activeTabId,
      systemZooms: Object.fromEntries(systemZooms),
      tabs: eligible,
      split: {
        schemaVersion: PERSISTENCE_SCHEMA_VERSION,
        mode: split.mode,
        paneTabIds: [...split.paneTabIds],
        focusedPaneId: split.focusedPaneId,
        maximizedPaneId: split.maximizedPaneId,
        ratios: clone(split.ratios),
      },
      updatedAt: nowIso(),
    });
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
      if (policyDecision.confirmation) item.pause();
      const continueDownload = async () => {
        if (!policyDecision.confirmation) return;
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
        if (result.response !== 1) {
          item.cancel();
          recentDownloads = recentDownloads.map((entry) => entry.id === id ? { ...entry, state: "cancelled", reason: "USER_DECLINED", completedAt: nowIso() } : entry);
          recordEvent("download_cancelled", { tab_id: tab.id, filename });
          publish();
          return;
        }
        item.resume();
      };
      void continueDownload().catch((error) => { item.cancel(); logger.warn("corporate_download_confirmation_failed", { message: error.message, filename }); });
      item.on("updated", (_event, state) => {
        recentDownloads = recentDownloads.map((entry) => entry.id === id ? { ...entry, state: state === "interrupted" ? "interrupted" : "progressing", receivedBytes: item.getReceivedBytes(), totalBytes: item.getTotalBytes() } : entry);
        publish();
      });
      item.once("done", (_event, state) => {
        recentDownloads = recentDownloads.map((entry) => entry.id === id ? { ...entry, state, receivedBytes: item.getReceivedBytes(), totalBytes: item.getTotalBytes(), completedAt: nowIso() } : entry);
        recordEvent("download_finished", { tab_id: tab.id, filename, state });
        publish();
      });
    });
    return corporateSession;
  }

  function isAllowedAngelcareUrl(rawUrl) {
    try {
      const url = new URL(rawUrl, angelcareDashboardUrl || `${angelcareOrigin}/`);
      if (url.protocol !== "https:" && !(options.allowDevelopmentHttp && url.protocol === "http:")) return false;
      if (url.origin !== angelcareOrigin) return false;
      const decision = evaluateUrl(url.href, currentPolicy, { allowLocalPages: false, newTabUrl });
      return decision.allowed && decision.trust === "angelcare";
    } catch { return false; }
  }

  function configureView(tab) {
    const wc = tab.view.webContents;
    wc.setWindowOpenHandler(({ url }) => {
      const decision = tab.type === ANGELCARE_WORKSPACE_TYPE
        ? { allowed: isAllowedAngelcareUrl(url), normalizedUrl: url, trust: "angelcare" }
        : evaluateUrl(url, currentPolicy, { allowLocalPages: false, newTabUrl });
      if (decision.allowed && currentPolicy.browser.external_open === true && decision.trust !== "angelcare") void shell.openExternal(decision.normalizedUrl || url);
      recordEvent("popup_blocked", { tab_id: tab.id, url, reason: "PAGE_CONTROLLED_TAB_CREATION_DISABLED" });
      return { action: "deny" };
    });
    wc.on("will-navigate", (event, url) => {
      const allowed = tab.type === ANGELCARE_WORKSPACE_TYPE
        ? isAllowedAngelcareUrl(url)
        : evaluateUrl(url, currentPolicy, { allowLocalPages: true, newTabUrl }).allowed;
      if (allowed) return;
      event.preventDefault();
      tab.blockedReason = "URL_BLOCKED_BY_STATION_POLICY";
      recordEvent("navigation_blocked", { tab_id: tab.id, url, reason: tab.blockedReason });
      publish({ notification: { tone: "blocked", message: "Navigation bloquée par la politique ANGELCARE.", url } });
    });
    wc.on("did-start-loading", () => updateTabNavigation(tab, { phase: "loading", rendererStatus: "loading", blockedReason: null }));
    wc.on("did-stop-loading", () => updateTabNavigation(tab, { phase: "ready", rendererStatus: "responsive", lastOpenedAt: nowIso() }));
    wc.on("did-navigate", (_event, url) => updateTabNavigation(tab, { url, trust: tab.type === ANGELCARE_WORKSPACE_TYPE ? "angelcare" : (evaluateUrl(url, currentPolicy, { allowLocalPages: true, newTabUrl }).trust || "corporate"), blockedReason: null }));
    wc.on("did-navigate-in-page", (_event, url) => updateTabNavigation(tab, { url }));
    wc.on("page-title-updated", (_event, title) => updateTabNavigation(tab, { title: safeString(title, 180) || tab.title }));
    wc.on("page-favicon-updated", (_event, favicons) => updateTabNavigation(tab, { favicon: Array.isArray(favicons) ? favicons[0] || null : null }));
    wc.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
      if (!isMainFrame || errorCode === -3) return;
      updateTabNavigation(tab, { phase: "error", rendererStatus: "load-failed", blockedReason: `${errorDescription} (${errorCode})`, url: validatedUrl || tab.url });
      recordEvent("tab_load_failed", { tab_id: tab.id, url: validatedUrl || tab.url, error_code: errorCode, error_description: errorDescription });
    });
    wc.on("unresponsive", () => updateTabNavigation(tab, { phase: "unresponsive", rendererStatus: "unresponsive" }));
    wc.on("responsive", () => updateTabNavigation(tab, { phase: "ready", rendererStatus: "responsive" }));
    wc.on("render-process-gone", (_event, details) => {
      updateTabNavigation(tab, { phase: "crashed", rendererStatus: "crashed", lastCrashAt: nowIso() });
      recordEvent("tab_crashed_isolated", { tab_id: tab.id, url: tab.url, reason: details.reason, exit_code: details.exitCode });
      applyLayout();
    });
    wc.on("focus", () => {
      if (split.mode <= 1) return;
      const index = split.paneTabIds.indexOf(tab.id);
      if (index < 0 || focusedTabId() === tab.id) return;
      focusPane(`pane-${index + 1}`);
    });
    wc.on("before-input-event", (event, input) => {
      const modifier = process.platform === "darwin" ? input.meta : input.control;
      if (!modifier || input.type !== "keyDown") return;
      const key = String(input.key).toLowerCase();
      if (["+", "=", "add"].includes(key)) { event.preventDefault(); zoomIn(tab.id); }
      else if (["-", "subtract"].includes(key)) { event.preventDefault(); zoomOut(tab.id); }
      else if (key === "0") { event.preventDefault(); zoomReset(tab.id); }
      else if (key === "w") { event.preventDefault(); void closeTab(tab.id); }
      else if (key === "t" && input.shift) { event.preventDefault(); void createAngelcareWorkspace(); }
    });
  }

  function updateTabNavigation(tab, patch = {}) {
    if (!tab || !tab.view || tab.view.webContents.isDestroyed()) return;
    const wc = tab.view.webContents;
    tab.url = wc.getURL() || tab.url;
    tab.title = safeString(wc.getTitle() || tab.title || (tab.type === ANGELCARE_WORKSPACE_TYPE ? "Espace ANGELCARE" : "Nouvel onglet"), 180);
    tab.canGoBack = wc.navigationHistory.canGoBack();
    tab.canGoForward = wc.navigationHistory.canGoForward();
    Object.assign(tab, patch);
    persist();
    publish();
  }

  function hideAllViews() {
    for (const system of SYSTEM_TABS) {
      const view = getSystemTabView(system.id);
      if (view && !view.webContents.isDestroyed()) view.setVisible(false);
    }
    for (const tab of tabs.values()) if (!tab.view.webContents.isDestroyed()) tab.view.setVisible(false);
  }

  function setViewBounds(view, bounds, visible = true) {
    if (!view || view.webContents.isDestroyed()) return false;
    view.setBounds({ x: Math.round(bounds.x), y: Math.round(bounds.y), width: Math.max(0, Math.round(bounds.width)), height: Math.max(0, Math.round(bounds.height)) });
    view.setVisible(Boolean(visible));
    return true;
  }

  function normalizeRatios() {
    const min = 0.18;
    if (split.mode === 2) split.ratios.columns = [clamp(split.ratios.columns?.[0] || 0.5, min, 1 - min)];
    else if (split.mode === 3) {
      let first = clamp(split.ratios.columns?.[0] || 0.3333, min, 1 - (2 * min));
      let second = clamp(split.ratios.columns?.[1] || 0.6667, first + min, 1 - min);
      if (second - first < min) second = Math.min(1 - min, first + min);
      split.ratios.columns = [first, second];
    } else if (split.mode === 4) {
      split.ratios.columns = [clamp(split.ratios.columns?.[0] || 0.5, min, 1 - min)];
      split.ratios.rows = [clamp(split.ratios.rows?.[0] || 0.5, min, 1 - min)];
    }
  }

  function calculateLayout() {
    const bounds = getBounds();
    if (!bounds || split.mode <= 1) return { panes: [], dividers: [] };
    normalizeRatios();
    const gap = 10;
    const panes = [];
    const dividers = [];
    if (split.mode === 2) {
      const cut = Math.round(bounds.width * split.ratios.columns[0]);
      panes.push({ x: bounds.x, y: bounds.y, width: cut - gap / 2, height: bounds.height });
      panes.push({ x: bounds.x + cut + gap / 2, y: bounds.y, width: bounds.width - cut - gap / 2, height: bounds.height });
      dividers.push({ index: 0, orientation: "vertical", x: bounds.x + cut - gap / 2, y: bounds.y, width: gap, height: bounds.height });
    } else if (split.mode === 3) {
      const first = Math.round(bounds.width * split.ratios.columns[0]);
      const second = Math.round(bounds.width * split.ratios.columns[1]);
      panes.push({ x: bounds.x, y: bounds.y, width: first - gap / 2, height: bounds.height });
      panes.push({ x: bounds.x + first + gap / 2, y: bounds.y, width: second - first - gap, height: bounds.height });
      panes.push({ x: bounds.x + second + gap / 2, y: bounds.y, width: bounds.width - second - gap / 2, height: bounds.height });
      dividers.push({ index: 0, orientation: "vertical", x: bounds.x + first - gap / 2, y: bounds.y, width: gap, height: bounds.height });
      dividers.push({ index: 1, orientation: "vertical", x: bounds.x + second - gap / 2, y: bounds.y, width: gap, height: bounds.height });
    } else if (split.mode === 4) {
      const cutX = Math.round(bounds.width * split.ratios.columns[0]);
      const cutY = Math.round(bounds.height * split.ratios.rows[0]);
      panes.push({ x: bounds.x, y: bounds.y, width: cutX - gap / 2, height: cutY - gap / 2 });
      panes.push({ x: bounds.x + cutX + gap / 2, y: bounds.y, width: bounds.width - cutX - gap / 2, height: cutY - gap / 2 });
      panes.push({ x: bounds.x, y: bounds.y + cutY + gap / 2, width: cutX - gap / 2, height: bounds.height - cutY - gap / 2 });
      panes.push({ x: bounds.x + cutX + gap / 2, y: bounds.y + cutY + gap / 2, width: bounds.width - cutX - gap / 2, height: bounds.height - cutY - gap / 2 });
      dividers.push({ index: 0, orientation: "vertical", x: bounds.x + cutX - gap / 2, y: bounds.y, width: gap, height: bounds.height });
      dividers.push({ index: 1, orientation: "horizontal", x: bounds.x, y: bounds.y + cutY - gap / 2, width: bounds.width, height: gap });
    }
    return { panes, dividers };
  }

  function applyLayout({ focus = false } = {}) {
    hideAllViews();
    if (split.selector.open) {
      lastDividerLayout = [];
      onDividerLayout([]);
      publish();
      return;
    }
    if (split.mode <= 1) {
      const bounds = getBounds();
      const view = getTabView(activeTabId);
      if (bounds) setViewBounds(view, bounds, true);
      lastDividerLayout = [];
      onDividerLayout([]);
      if (focus) getTabWebContents(activeTabId)?.focus?.();
      return;
    }
    sanitizeSplitAssignments({ allowDormantWhatsappPlaceholder: true });
    if (split.mode <= 1) return applyLayout({ focus });
    const { panes, dividers } = calculateLayout();
    const paneIds = paneIdsForMode();
    const maximizedIndex = split.maximizedPaneId ? paneIds.indexOf(split.maximizedPaneId) : -1;
    if (maximizedIndex >= 0) {
      const view = getTabView(split.paneTabIds[maximizedIndex]);
      const bounds = getBounds();
      if (bounds) setViewBounds(view, bounds, true);
      lastDividerLayout = [];
      onDividerLayout([]);
    } else {
      split.paneTabIds.forEach((tabId, index) => {
        const view = getTabView(tabId);
        if (panes[index]) setViewBounds(view, panes[index], true);
      });
      lastDividerLayout = dividers;
      onDividerLayout(clone(dividers));
    }
    if (focus) getTabWebContents(focusedTabId())?.focus?.();
  }

  function notifyActivation(tabId) {
    const system = SYSTEM_TABS.find((tab) => tab.id === tabId);
    if (system) onActivateSystemTab(system.type);
    else {
      const tab = getDynamicTab(tabId);
      if (tab) onActivateCorporateTab(safeTab(tab));
    }
  }

  async function createTab(input = {}) {
    currentPolicy = normalizeStationPolicy(getPolicy(), currentPolicy);
    const requestedType = input.type === ANGELCARE_WORKSPACE_TYPE ? ANGELCARE_WORKSPACE_TYPE
      : input.type === "administrator-tool" ? "administrator-tool"
        : input.type === "pinned-template" ? "pinned-template" : "corporate-web";
    if (requestedType === ANGELCARE_WORKSPACE_TYPE) return createAngelcareWorkspace(input);
    if (tabs.size + SYSTEM_TABS.length >= totalMaximumTabs()) throw new Error("MAXIMUM_TAB_LIMIT_REACHED");
    const decision = evaluateUrl(input.url || newTabUrl, currentPolicy, { allowLocalPages: true, newTabUrl });
    if (!decision.allowed || ["angelcare", "whatsapp"].includes(decision.trust)) throw new Error("CORPORATE_TAB_DESTINATION_NOT_ALLOWED");
    return createDynamicTab({ ...input, type: requestedType, url: decision.normalizedUrl, trust: decision.trust, session: configureSession(), preload: null });
  }

  async function createAngelcareWorkspace(input = {}) {
    currentPolicy = normalizeStationPolicy(getPolicy(), currentPolicy);
    const disabled = acPlusDisabledReason();
    if (disabled) { publish({ notification: { tone: "blocked", message: disabled } }); throw new Error("AC_PLUS_DISABLED_BY_POLICY"); }
    if (!trustedAngelcareSession) throw new Error("TRUSTED_ANGELCARE_SESSION_UNAVAILABLE");
    const url = safeString(input.url || angelcareDashboardUrl, 2048);
    if (!isAllowedAngelcareUrl(url)) throw new Error("AC_PLUS_URL_OUTSIDE_ANGELCARE_ORIGIN");
    const index = workspaceTabs().length + 1;
    return createDynamicTab({
      ...input,
      type: ANGELCARE_WORKSPACE_TYPE,
      title: safeString(input.title || `AC+ ${index}`, 180),
      url,
      trust: "angelcare",
      session: trustedAngelcareSession,
      preload: trustedPreloadPath,
      activate: input.activate !== false,
    });
  }

  async function createDynamicTab(input) {
    const id = safeString(input.id, 120) || crypto.randomUUID();
    if (tabs.has(id) || SYSTEM_TABS.some((tab) => tab.id === id)) throw new Error("TAB_ID_ALREADY_EXISTS");
    const position = Number.isFinite(Number(input.position)) ? Number(input.position) : tabs.size + SYSTEM_TABS.length;
    const webPreferences = {
      session: input.session,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: Boolean(options.allowDevTools),
      spellcheck: true,
      safeDialogs: true,
      safeDialogsMessage: "ANGELCARE a bloqué des dialogues répétés provenant de cette page.",
    };
    if (input.preload) webPreferences.preload = input.preload;
    const tab = {
      id,
      type: input.type,
      title: safeString(input.title || (input.type === ANGELCARE_WORKSPACE_TYPE ? "Espace ANGELCARE" : "Nouvel onglet"), 180),
      url: input.url,
      favicon: null,
      pinned: Boolean(input.pinned),
      mandatory: Boolean(input.mandatory),
      position,
      zoom: clamp(input.zoom || 1, 0.6, 2),
      phase: "created",
      rendererStatus: "created",
      trust: input.trust,
      blockedReason: null,
      lastOpenedAt: nowIso(),
      lastCrashAt: null,
      canGoBack: false,
      canGoForward: false,
      view: new WebContentsView({ webPreferences }),
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
    recordEvent(tab.type === ANGELCARE_WORKSPACE_TYPE ? "ac_plus_workspace_created" : "tab_created", { tab_id: id, url: tab.url, type: tab.type });
    if (input.activate !== false) {
      if (tab.type === ANGELCARE_WORKSPACE_TYPE && split.mode > 1 && split.focusedPaneId) {
        replacePane(split.focusedPaneId, id);
        recordEvent("ac_plus_workspace_inserted_into_focused_pane", { tab_id: id, pane_id: split.focusedPaneId });
      } else activateTab(id);
    } else { persist(); publish(); }
    return safeTab(tab);
  }

  function activateTab(id) {
    if (!tabExists(id)) throw new Error("TAB_NOT_FOUND");
    if (split.mode > 1) {
      const paneIndex = split.paneTabIds.indexOf(id);
      if (paneIndex >= 0) return focusPane(`pane-${paneIndex + 1}`);
      exitSplit({ activeTabId: id, reason: "tab-outside-current-split" });
      return getState();
    }
    activeTabId = id;
    notifyActivation(id);
    applySystemZoom(id);
    applyLayout({ focus: true });
    persist();
    recordEvent("tab_activated", { tab_id: id });
    return publish();
  }

  async function closeTab(id, closeOptions = {}) {
    if (SYSTEM_TABS.some((tab) => tab.id === id)) throw new Error("PROTECTED_SYSTEM_TAB");
    const tab = tabs.get(id);
    if (!tab) return getState();
    if ((tab.pinned || tab.mandatory) && closeOptions.force !== true) throw new Error("PINNED_OR_MANDATORY_TAB");
    closedTabs.unshift({ ...safeTab(tab), closedAt: nowIso() });
    closedTabs.splice(20);
    tab.view.setVisible(false);
    mainWindow.contentView.removeChildView(tab.view);
    if (!tab.view.webContents.isDestroyed()) tab.view.webContents.close();
    tabs.delete(id);
    const splitIndex = split.paneTabIds.indexOf(id);
    if (splitIndex >= 0) rebalanceAfterTabClosure(splitIndex);
    if (activeTabId === id) activeTabId = focusedTabId() && tabExists(focusedTabId()) ? focusedTabId() : "angelcare-system";
    if (!tabExists(activeTabId)) activeTabId = "angelcare-system";
    notifyActivation(activeTabId);
    applyLayout({ focus: true });
    persist();
    recordEvent("tab_closed", { tab_id: id, url: tab.url, forced: closeOptions.force === true });
    return publish();
  }

  function rebalanceAfterTabClosure(index) {
    split.paneTabIds.splice(index, 1);
    if (split.mode <= 2 || split.paneTabIds.length < 2) {
      const survivor = split.paneTabIds[0] || "angelcare-system";
      split = { ...split, mode: 1, paneTabIds: [], focusedPaneId: null, maximizedPaneId: null, selector: { open: false, requestedMode: null, targetPaneId: null, selectedTabIds: [] } };
      activeTabId = survivor;
      recordEvent("split_closed_tab_exit", { survivor_tab_id: survivor });
      return;
    }
    split.mode = split.paneTabIds.length;
    split.focusedPaneId = `pane-${Math.min(index + 1, split.mode)}`;
    split.maximizedPaneId = null;
    activeTabId = focusedTabId();
    recordEvent("split_rebalanced_after_tab_close", { mode: split.mode, pane_tab_ids: split.paneTabIds });
  }

  async function closeOtherTabs(id) {
    for (const tab of [...tabs.values()]) if (tab.id !== id && !tab.pinned && !tab.mandatory) await closeTab(tab.id, { force: true });
    return activateTab(id);
  }
  async function duplicateTab(id) {
    const tab = tabs.get(id);
    if (!tab) throw new Error("TAB_NOT_FOUND_OR_PROTECTED");
    if (tab.type === ANGELCARE_WORKSPACE_TYPE) return createAngelcareWorkspace({ url: tab.url, title: `${tab.title} — copie`, zoom: tab.zoom, activate: true });
    return createTab({ url: tab.url, title: `${tab.title} — copie`, zoom: tab.zoom, activate: true });
  }
  function pinTab(id, pinned = true) {
    const tab = tabs.get(id);
    if (!tab) throw new Error("TAB_NOT_FOUND_OR_PROTECTED");
    if (tab.mandatory && !pinned) throw new Error("MANDATORY_TAB_CANNOT_BE_UNPINNED");
    tab.pinned = Boolean(pinned);
    persist();
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
    return publish();
  }
  async function reopenClosed() {
    const previous = closedTabs.shift();
    if (!previous) throw new Error("NO_RECENTLY_CLOSED_TAB");
    return previous.type === ANGELCARE_WORKSPACE_TYPE ? createAngelcareWorkspace({ ...previous, id: undefined, activate: true }) : createTab({ ...previous, id: undefined, activate: true });
  }

  async function navigate(id, input) {
    const tab = tabs.get(id || focusedTabId());
    if (!tab) throw new Error("ACTIVE_DYNAMIC_TAB_REQUIRED");
    if (tab.type === ANGELCARE_WORKSPACE_TYPE) {
      const target = new URL(String(input || ""), tab.url).href;
      if (!isAllowedAngelcareUrl(target)) throw new Error("AC_PLUS_URL_OUTSIDE_ANGELCARE_ORIGIN");
      await tab.view.webContents.loadURL(target);
      return publish();
    }
    const decision = evaluateUrl(input, currentPolicy, { allowLocalPages: true, newTabUrl });
    if (!decision.allowed || ["angelcare", "whatsapp"].includes(decision.trust)) throw new Error("URL_BLOCKED_BY_POLICY");
    await tab.view.webContents.loadURL(decision.normalizedUrl);
    return publish();
  }

  function navigationAction(id, action) {
    const targetId = id || focusedTabId();
    if (targetId === "whatsapp-system" && ["back", "forward"].includes(action)) throw new Error("WHATSAPP_HISTORY_NAVIGATION_DISABLED");
    const wc = getTabWebContents(targetId);
    if (!wc || wc.isDestroyed?.()) throw new Error("ACTIVE_NAVIGABLE_TAB_REQUIRED");
    if (targetId === "whatsapp-system" && action === "reload" && getSystemTabStatus(targetId)?.activated !== true) throw new Error("WHATSAPP_NOT_ACTIVATED");
    if (action === "back" && wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
    else if (action === "forward" && wc.navigationHistory.canGoForward()) wc.navigationHistory.goForward();
    else if (action === "reload") wc.reload();
    else if (action === "reload-no-cache" && targetId !== "whatsapp-system") wc.reloadIgnoringCache();
    else if (action === "stop") wc.stop();
    else if (action === "home") {
      if (targetId === "angelcare-system") void wc.loadURL(angelcareDashboardUrl || `${angelcareOrigin}/`);
      else {
        const tab = tabs.get(targetId);
        if (tab?.type === ANGELCARE_WORKSPACE_TYPE) void wc.loadURL(angelcareDashboardUrl);
        else if (tab) void wc.loadURL(newTabUrl);
      }
    }
    return publish();
  }

  function currentZoom(id) {
    const targetId = id || focusedTabId();
    if (SYSTEM_TABS.some((tab) => tab.id === targetId)) return Number(systemZooms.get(targetId) || 1);
    return Number(tabs.get(targetId)?.zoom || 1);
  }
  function applySystemZoom(id) {
    if (!SYSTEM_TABS.some((tab) => tab.id === id)) return false;
    const wc = getSystemTabWebContents(id);
    if (!wc || wc.isDestroyed?.()) return false;
    wc.setZoomFactor(Number(systemZooms.get(id) || 1));
    return true;
  }
  function setZoom(id, value) {
    const targetId = id || focusedTabId();
    const zoom = Math.round(clamp(value, 0.6, 2) * 10) / 10;
    if (SYSTEM_TABS.some((tab) => tab.id === targetId)) {
      if (targetId === "whatsapp-system" && getSystemTabStatus(targetId)?.activated !== true) throw new Error("WHATSAPP_NOT_ACTIVATED");
      systemZooms.set(targetId, zoom);
      applySystemZoom(targetId);
    } else {
      const tab = tabs.get(targetId);
      if (!tab) throw new Error("ACTIVE_ZOOMABLE_TAB_REQUIRED");
      tab.zoom = zoom;
      tab.view.webContents.setZoomFactor(zoom);
    }
    persist();
    recordEvent("tab_zoom_changed", { tab_id: targetId, zoom });
    return publish();
  }
  function zoomIn(id) { return setZoom(id, currentZoom(id) + 0.1); }
  function zoomOut(id) { return setZoom(id, currentZoom(id) - 0.1); }
  function zoomReset(id) { return setZoom(id, 1); }
  function fitWorkspace(id) { return setZoom(id, 0.9); }

  async function recoverTab(id) {
    const tab = tabs.get(id);
    if (!tab) throw new Error("TAB_NOT_FOUND");
    const wasSplit = split.paneTabIds.includes(id);
    const index = split.paneTabIds.indexOf(id);
    const snapshot = { ...safeTab(tab), id };
    tab.view.setVisible(false);
    mainWindow.contentView.removeChildView(tab.view);
    if (!tab.view.webContents.isDestroyed()) tab.view.webContents.close();
    tabs.delete(id);
    const restored = snapshot.type === ANGELCARE_WORKSPACE_TYPE
      ? await createAngelcareWorkspace({ ...snapshot, activate: false })
      : await createTab({ ...snapshot, activate: false });
    if (wasSplit && index >= 0) split.paneTabIds[index] = restored.id;
    activeTabId = wasSplit ? focusedTabId() : restored.id;
    applyLayout({ focus: true });
    persist();
    recordEvent("tab_recovered_isolated", { tab_id: id, replacement_tab_id: restored.id });
    return publish();
  }

  function openSplitSelector(mode = null, targetPaneId = null) {
    const reason = splitDisabledReason();
    if (reason) throw new Error("SPLIT_DISABLED_BY_POLICY");
    const requestedMode = mode === null ? null : Number(mode);
    if (requestedMode !== null && !availableSplitModes().includes(requestedMode)) throw new Error("SPLIT_MODE_NOT_AVAILABLE");
    split.selector = { open: true, requestedMode, targetPaneId: targetPaneId || null, selectedTabIds: [] };
    hideAllViews();
    onDividerLayout([]);
    persist();
    recordEvent("split_selector_opened", { requested_mode: requestedMode, target_pane_id: targetPaneId || null });
    return publish();
  }
  function closeSplitSelector() {
    split.selector = { open: false, requestedMode: null, targetPaneId: null, selectedTabIds: [] };
    applyLayout({ focus: true });
    persist();
    return publish();
  }
  function activateSplit(mode, tabIds) {
    const numericMode = Number(mode);
    if (!availableSplitModes().includes(numericMode)) throw new Error("SPLIT_MODE_NOT_AVAILABLE");
    const selected = unique(tabIds);
    if (selected.length !== numericMode) throw new Error(`SPLIT_MODE_${numericMode}_REQUIRES_EXACT_SELECTION`);
    const eligibleIds = new Set(eligibleTabs().map((tab) => tab.id));
    if (selected.some((id) => !eligibleIds.has(id))) throw new Error("SPLIT_SELECTION_CONTAINS_INELIGIBLE_TAB");
    split.mode = numericMode;
    split.paneTabIds = selected;
    split.focusedPaneId = `pane-${Math.max(1, selected.indexOf(activeTabId) + 1)}`;
    split.maximizedPaneId = null;
    split.selector = { open: false, requestedMode: null, targetPaneId: null, selectedTabIds: [] };
    split.ratios = numericMode === 3 ? { columns: [0.3333, 0.6667], rows: [0.5] } : { columns: [0.5], rows: [0.5] };
    activeTabId = focusedTabId();
    notifyActivation(activeTabId);
    applyLayout({ focus: true });
    persist();
    recordEvent("split_activated", { mode: numericMode, pane_tab_ids: selected });
    return publish();
  }
  function exitSplit(exitOptions = {}) {
    const selected = exitOptions.activeTabId || focusedTabId() || "angelcare-system";
    split.mode = 1;
    split.paneTabIds = [];
    split.focusedPaneId = null;
    split.maximizedPaneId = null;
    split.selector = { open: false, requestedMode: null, targetPaneId: null, selectedTabIds: [] };
    activeTabId = tabExists(selected) ? selected : "angelcare-system";
    notifyActivation(activeTabId);
    applyLayout({ focus: true });
    persist();
    recordEvent("split_exited_without_closing_tabs", { active_tab_id: activeTabId, reason: exitOptions.reason || "user" });
    return publish();
  }
  function focusPane(paneId) {
    if (split.mode <= 1) return getState();
    const index = paneIdsForMode().indexOf(String(paneId || ""));
    if (index < 0 || !split.paneTabIds[index]) throw new Error("SPLIT_PANE_NOT_FOUND");
    split.focusedPaneId = `pane-${index + 1}`;
    activeTabId = split.paneTabIds[index];
    notifyActivation(activeTabId);
    getTabWebContents(activeTabId)?.focus?.();
    persist();
    recordEvent("split_pane_focused", { pane_id: split.focusedPaneId, tab_id: activeTabId });
    return publish();
  }
  function replacePane(paneId, tabId) {
    if (split.mode <= 1) throw new Error("SPLIT_NOT_ACTIVE");
    const index = paneIdsForMode().indexOf(String(paneId || ""));
    if (index < 0) throw new Error("SPLIT_PANE_NOT_FOUND");
    const eligibleIds = new Set(eligibleTabs().map((tab) => tab.id));
    if (!eligibleIds.has(tabId)) throw new Error("REPLACEMENT_TAB_NOT_ELIGIBLE");
    if (split.paneTabIds.includes(tabId) && split.paneTabIds[index] !== tabId) throw new Error("TAB_ALREADY_ASSIGNED_TO_ANOTHER_PANE");
    split.paneTabIds[index] = tabId;
    split.focusedPaneId = `pane-${index + 1}`;
    activeTabId = tabId;
    split.selector = { open: false, requestedMode: null, targetPaneId: null, selectedTabIds: [] };
    notifyActivation(tabId);
    applyLayout({ focus: true });
    persist();
    recordEvent("split_pane_replaced", { pane_id: split.focusedPaneId, tab_id: tabId });
    return publish();
  }
  function swapPanes(firstPaneId, secondPaneId = null) {
    if (split.mode <= 1) throw new Error("SPLIT_NOT_ACTIVE");
    const ids = paneIdsForMode();
    const first = ids.indexOf(firstPaneId || split.focusedPaneId);
    const second = secondPaneId ? ids.indexOf(secondPaneId) : (first + 1) % split.mode;
    if (first < 0 || second < 0 || first === second) throw new Error("INVALID_PANE_SWAP");
    [split.paneTabIds[first], split.paneTabIds[second]] = [split.paneTabIds[second], split.paneTabIds[first]];
    split.focusedPaneId = ids[second];
    activeTabId = split.paneTabIds[second];
    applyLayout({ focus: true });
    persist();
    recordEvent("split_panes_swapped", { first_pane_id: ids[first], second_pane_id: ids[second] });
    return publish();
  }
  function maximizePane(paneId = split.focusedPaneId) {
    if (split.mode <= 1 || !paneIdsForMode().includes(paneId)) throw new Error("SPLIT_PANE_NOT_FOUND");
    split.maximizedPaneId = paneId;
    split.focusedPaneId = paneId;
    activeTabId = split.paneTabIds[paneIdsForMode().indexOf(paneId)];
    applyLayout({ focus: true });
    persist();
    recordEvent("split_pane_temporarily_maximized", { pane_id: paneId, tab_id: activeTabId });
    return publish();
  }
  function restorePane() {
    split.maximizedPaneId = null;
    applyLayout({ focus: true });
    persist();
    recordEvent("split_restored");
    return publish();
  }
  function resizeSplitDivider(index, deltaPixels) {
    if (split.mode <= 1 || split.maximizedPaneId) return getState();
    const bounds = getBounds();
    const divider = lastDividerLayout[Number(index)];
    if (!bounds || !divider) throw new Error("SPLIT_DIVIDER_NOT_FOUND");
    const delta = Number(deltaPixels) / (divider.orientation === "vertical" ? Math.max(1, bounds.width) : Math.max(1, bounds.height));
    if (split.mode === 2) split.ratios.columns[0] += delta;
    else if (split.mode === 3) split.ratios.columns[Number(index)] += delta;
    else if (split.mode === 4 && divider.orientation === "vertical") split.ratios.columns[0] += delta;
    else if (split.mode === 4) split.ratios.rows[0] += delta;
    normalizeRatios();
    applyLayout();
    persist();
    return publish();
  }

  function sanitizeSplitAssignments({ allowDormantWhatsappPlaceholder = false } = {}) {
    if (![2, 3, 4].includes(Number(split.mode))) {
      split.mode = 1;
      split.paneTabIds = [];
      split.focusedPaneId = null;
      split.maximizedPaneId = null;
      return;
    }
    const valid = unique(split.paneTabIds).filter((id) => {
      if (!tabExists(id)) return false;
      if (id === "whatsapp-system" && allowDormantWhatsappPlaceholder) return true;
      const tab = orderedTabs().find((entry) => entry.id === id);
      return isEligibleTab(tab);
    });
    if (valid.length < 2) {
      activeTabId = valid[0] || (tabExists(activeTabId) ? activeTabId : "angelcare-system");
      split.mode = 1;
      split.paneTabIds = [];
      split.focusedPaneId = null;
      split.maximizedPaneId = null;
      return;
    }
    split.mode = Math.min(Number(split.mode), valid.length, 4);
    split.paneTabIds = valid.slice(0, split.mode);
    const paneIds = paneIdsForMode();
    if (!paneIds.includes(split.focusedPaneId)) split.focusedPaneId = paneIds[0];
    if (split.maximizedPaneId && !paneIds.includes(split.maximizedPaneId)) split.maximizedPaneId = null;
    activeTabId = focusedTabId();
  }

  function resize() { applyLayout(); }
  function refreshSystemTabState() { applyLayout(); return publish(); }

  function applyOperatingMode(nextMode, options = {}) {
    const normalized = ["standard", "focus", "locked"].includes(String(nextMode || "").toLowerCase())
      ? String(nextMode).toLowerCase()
      : "standard";
    const previous = operatingMode;
    operatingMode = normalized;
    if (!splitAllowed() && split.mode > 1) {
      recordEvent("split_closed_for_operating_mode", { previous_mode: previous, operating_mode: operatingMode, source: options.source || "station-mode" });
      return exitSplit({ reason: `operating-mode:${operatingMode}` });
    }
    applyLayout();
    recordEvent("operating_mode_applied", { previous_mode: previous, operating_mode: operatingMode, source: options.source || "station-mode" });
    return publish();
  }

  async function applyPolicy(rawPolicy) {
    currentPolicy = normalizeStationPolicy(rawPolicy, currentPolicy);
    for (const tab of [...tabs.values()]) {
      const allowed = tab.type === ANGELCARE_WORKSPACE_TYPE ? isAllowedAngelcareUrl(tab.url) : evaluateUrl(tab.url, currentPolicy, { allowLocalPages: true, newTabUrl }).allowed;
      if (!allowed && !tab.mandatory) await closeTab(tab.id, { force: true });
      else if (!allowed) tab.blockedReason = "URL_BLOCKED_BY_POLICY";
    }
    while (workspaceTabs().length > maximumAcPlusTabs()) {
      const removable = workspaceTabs().filter((tab) => !tab.pinned && !tab.mandatory).sort((a, b) => b.position - a.position)[0];
      if (!removable) break;
      await closeTab(removable.id, { force: true });
    }
    if (!splitAllowed() && split.mode > 1) exitSplit({ reason: "station-policy" });
    sanitizeSplitAssignments({ allowDormantWhatsappPlaceholder: true });
    applyLayout();
    persist();
    recordEvent("policy_applied", { policy_version: currentPolicy.policy_version, maximum_tabs: totalMaximumTabs(), maximum_ac_plus_tabs: maximumAcPlusTabs() });
    return publish();
  }

  async function clearCache() { await configureSession().clearCache(); recentDownloads = []; return publish(); }
  async function clearData() {
    await configureSession().clearStorageData({ storages: ["cookies", "localstorage", "indexdb", "serviceworkers", "cachestorage", "websql", "shadercache"] });
    await configureSession().clearCache();
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
      if (persisted.systemZooms && typeof persisted.systemZooms === "object") {
        for (const system of SYSTEM_TABS) {
          const saved = Number(persisted.systemZooms[system.id]);
          if (Number.isFinite(saved)) systemZooms.set(system.id, Math.round(clamp(saved, 0.6, 2) * 10) / 10);
        }
      }
      const candidates = currentPolicy.restore_tabs !== false && Array.isArray(persisted.tabs) ? persisted.tabs : [];
      for (const snapshot of candidates.slice(0, Math.max(0, totalMaximumTabs() - SYSTEM_TABS.length))) {
        try {
          if (snapshot.type === ANGELCARE_WORKSPACE_TYPE) await createAngelcareWorkspace({ ...snapshot, activate: false });
          else await createTab({ ...snapshot, activate: false });
        } catch (error) { logger.warn("corporate_tab_restore_skipped", { url: snapshot?.url, message: error.message }); }
      }
      const persistedSplit = persisted.schemaVersion >= PERSISTENCE_SCHEMA_VERSION ? persisted.split : null;
      if (persistedSplit && typeof persistedSplit === "object") {
        split.mode = Number(persistedSplit.mode || 1);
        split.paneTabIds = unique(persistedSplit.paneTabIds);
        split.focusedPaneId = safeString(persistedSplit.focusedPaneId, 40) || null;
        split.maximizedPaneId = safeString(persistedSplit.maximizedPaneId, 40) || null;
        split.ratios = persistedSplit.ratios && typeof persistedSplit.ratios === "object" ? clone(persistedSplit.ratios) : split.ratios;
      }
      activeTabId = tabExists(persisted.activeTabId) ? persisted.activeTabId : (currentPolicy.startup_surface || "angelcare-system");
      sanitizeSplitAssignments({ allowDormantWhatsappPlaceholder: true });
      if (activeTabId === "whatsapp-system") {
        // Restore application state != reconnect WhatsApp automatically.
        recordEvent("whatsapp_restored_as_dormant_placeholder");
      }
      await applyPolicy(currentPolicy);
    } finally {
      restoring = false;
      notifyActivation(activeTabId);
      applyLayout();
      persist();
    }
    return publish();
  }

  function destroy() {
    onDividerLayout([]);
    for (const tab of tabs.values()) {
      try {
        tab.view.setVisible(false);
        mainWindow.contentView.removeChildView(tab.view);
        if (!tab.view.webContents.isDestroyed()) tab.view.webContents.close();
      } catch (error) { logger.warn("corporate_tab_destroy_failed", { tabId: tab.id, message: error.message }); }
    }
    tabs.clear();
  }

  return Object.freeze({
    partition: CORPORATE_PARTITION,
    getState,
    getTabView,
    getTabWebContents,
    isTrustedAngelcareSender,
    createTab,
    createAngelcareWorkspace,
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
    applySystemZoom,
    recoverTab,
    openSplitSelector,
    closeSplitSelector,
    activateSplit,
    exitSplit,
    focusPane,
    replacePane,
    swapPanes,
    maximizePane,
    restorePane,
    resizeSplitDivider,
    refreshSystemTabState,
    resize,
    restore,
    applyPolicy,
    applyOperatingMode,
    clearCache,
    clearData,
    openDownloads,
    destroy,
  });
}

module.exports = {
  ANGELCARE_WORKSPACE_TYPE,
  CORPORATE_PARTITION,
  PERSISTENCE_SCHEMA_VERSION,
  SYSTEM_TABS,
  createCorporateBrowser,
};
