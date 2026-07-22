"use strict";

const { contextBridge, ipcRenderer } = require("electron");

function argumentValue(prefix, fallback = "") {
  const value = process.argv.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

const runtime = Object.freeze({
  isDesktop: true,
  productName: "ANGELCARE Desktop",
  version: argumentValue("--angelcare-desktop-version=", "0.0.0"),
  contractVersion: argumentValue("--angelcare-desktop-contract=", "6.0.0"),
  releaseChannel: argumentValue("--angelcare-desktop-channel=", "stable"),
  platform: process.platform,
  capabilities: Object.freeze({
    whatsappWebContentsView: true,
    whatsappPersistentSession: true,
    whatsappSessionControl: true,
    whatsappGovernance: true,
    whatsappDeviceRegistration: true,
    whatsappAuthorizationLeases: true,
    whatsappRemoteCommands: true,
    whatsappBusinessContext: true,
    whatsappOutcomeCapture: true,
    productionDiagnostics: true,
    controlledUpdates: true,
    crashLoopRecovery: true,
    signedInstallerReady: true,
    corporateStationOS: true,
    corporateMultiTabBrowser: true,
    corporateBrowserPartition: true,
    stationModes: true,
    nativeStationUnlock: true,
    stationRemoteCommands: true,
    perTabZoom: true,
    whatsappAutomation: false,
    whatsappDomAccess: false,
  }),
});

const allowedCommands = new Set(["get-status", "show", "hide", "reload", "hard-reload", "go-back", "go-forward", "focus", "open-external", "navigate", "restart", "clear-cache", "clear-session", "open-downloads", "set-layout"]);
const governanceCommands = new Set(["get-status", "register", "heartbeat", "refresh", "select-workspace"]);
const releaseCommands = new Set(["get-status", "check", "download", "restart-to-update", "reveal-download"]);
const diagnosticsCommands = new Set(["get-status", "export", "get-production-status"]);
const corporateCommands = new Set(["list", "get-status", "create", "close", "close-others", "activate", "duplicate", "pin", "reorder", "reopen-closed", "navigate", "back", "forward", "reload", "reload-no-cache", "stop", "home", "zoom-in", "zoom-out", "zoom-reset", "set-zoom", "fit-workspace", "recover", "clear-cache", "clear-data", "open-downloads"]);
const stationCommands = new Set(["get-status", "get-policy", "refresh-policy", "request-mode", "request-unlock", "get-lockout-status", "get-diagnostics"]);

function invoke(channel, allowed, action, payload = {}) {
  if (!allowed.has(action)) return Promise.reject(new Error("Unsupported ANGELCARE Desktop command."));
  return ipcRenderer.invoke(channel, action, payload);
}
function subscribe(channel, listener) {
  if (typeof listener !== "function") throw new TypeError("Listener must be a function.");
  const wrapped = (_event, payload) => listener(payload);
  ipcRenderer.on(channel, wrapped);
  return () => ipcRenderer.removeListener(channel, wrapped);
}

const api = Object.freeze({
  ...runtime,
  whatsapp: Object.freeze({
    getStatus: () => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "get-status"),
    show: () => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "show"),
    hide: () => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "hide"),
    reload: () => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "reload"),
    hardReload: () => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "hard-reload"),
    goBack: () => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "go-back"),
    goForward: () => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "go-forward"),
    focus: () => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "focus"),
    openExternal: () => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "open-external"),
    navigate: (payload) => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "navigate", payload),
    restart: () => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "restart"),
    clearCache: () => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "clear-cache"),
    clearSession: () => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "clear-session"),
    openDownloads: () => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "open-downloads"),
    setLayout: (layout) => invoke("angelcare-desktop:whatsapp-command", allowedCommands, "set-layout", { layout }),
    setBounds: (bounds) => ipcRenderer.invoke("angelcare-desktop:whatsapp-bounds", { x: Number(bounds?.x || 0), y: Number(bounds?.y || 0), width: Number(bounds?.width || 0), height: Number(bounds?.height || 0) }),
    onStatus: (listener) => subscribe("angelcare-desktop:whatsapp-state", listener),
  }),
  governance: Object.freeze({
    getStatus: () => invoke("angelcare-desktop:governance-command", governanceCommands, "get-status"),
    register: () => invoke("angelcare-desktop:governance-command", governanceCommands, "register"),
    heartbeat: () => invoke("angelcare-desktop:governance-command", governanceCommands, "heartbeat"),
    refresh: () => invoke("angelcare-desktop:governance-command", governanceCommands, "refresh"),
    selectWorkspace: (workspaceId, workspaceName = "") => invoke("angelcare-desktop:governance-command", governanceCommands, "select-workspace", { workspaceId, workspaceName }),
    onStatus: (listener) => subscribe("angelcare-desktop:governance-state", listener),
  }),
  release: Object.freeze({
    getStatus: () => invoke("angelcare-desktop:release-command", releaseCommands, "get-status"),
    check: () => invoke("angelcare-desktop:release-command", releaseCommands, "check"),
    download: () => invoke("angelcare-desktop:release-command", releaseCommands, "download"),
    restartToUpdate: () => invoke("angelcare-desktop:release-command", releaseCommands, "restart-to-update"),
    revealDownload: () => invoke("angelcare-desktop:release-command", releaseCommands, "reveal-download"),
    onStatus: (listener) => subscribe("angelcare-desktop:release-state", listener),
  }),
  corporateTabs: Object.freeze({
    list: () => invoke("angelcare-desktop:corporate-command", corporateCommands, "list"),
    getStatus: () => invoke("angelcare-desktop:corporate-command", corporateCommands, "get-status"),
    create: (input = {}) => invoke("angelcare-desktop:corporate-command", corporateCommands, "create", input),
    close: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "close", { id }),
    closeOthers: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "close-others", { id }),
    activate: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "activate", { id }),
    duplicate: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "duplicate", { id }),
    pin: (id, pinned = true) => invoke("angelcare-desktop:corporate-command", corporateCommands, "pin", { id, pinned }),
    reorder: (id, targetIndex) => invoke("angelcare-desktop:corporate-command", corporateCommands, "reorder", { id, targetIndex }),
    reopenClosed: () => invoke("angelcare-desktop:corporate-command", corporateCommands, "reopen-closed"),
    navigate: (id, input) => invoke("angelcare-desktop:corporate-command", corporateCommands, "navigate", { id, input }),
    back: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "back", { id }),
    forward: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "forward", { id }),
    reload: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "reload", { id }),
    reloadWithoutCache: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "reload-no-cache", { id }),
    stop: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "stop", { id }),
    home: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "home", { id }),
    zoomIn: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "zoom-in", { id }),
    zoomOut: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "zoom-out", { id }),
    zoomReset: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "zoom-reset", { id }),
    setZoom: (id, zoom) => invoke("angelcare-desktop:corporate-command", corporateCommands, "set-zoom", { id, zoom }),
    fitWorkspace: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "fit-workspace", { id }),
    recover: (id) => invoke("angelcare-desktop:corporate-command", corporateCommands, "recover", { id }),
    clearCache: () => invoke("angelcare-desktop:corporate-command", corporateCommands, "clear-cache"),
    clearData: () => invoke("angelcare-desktop:corporate-command", corporateCommands, "clear-data"),
    openDownloads: () => invoke("angelcare-desktop:corporate-command", corporateCommands, "open-downloads"),
    onStatus: (listener) => subscribe("angelcare-desktop:corporate-state", listener),
  }),
  station: Object.freeze({
    getStatus: () => invoke("angelcare-desktop:station-command", stationCommands, "get-status"),
    getPolicy: () => invoke("angelcare-desktop:station-command", stationCommands, "get-policy"),
    refreshPolicy: () => invoke("angelcare-desktop:station-command", stationCommands, "refresh-policy"),
    requestMode: (mode) => invoke("angelcare-desktop:station-command", stationCommands, "request-mode", { mode }),
    requestUnlock: () => invoke("angelcare-desktop:station-command", stationCommands, "request-unlock"),
    getLockoutStatus: () => invoke("angelcare-desktop:station-command", stationCommands, "get-lockout-status"),
    getDiagnostics: () => invoke("angelcare-desktop:station-command", stationCommands, "get-diagnostics"),
    onStatus: (listener) => subscribe("angelcare-desktop:station-state", listener),
  }),
  diagnostics: Object.freeze({
    getStatus: () => invoke("angelcare-desktop:diagnostics-command", diagnosticsCommands, "get-status"),
    exportBundle: () => invoke("angelcare-desktop:diagnostics-command", diagnosticsCommands, "export"),
    getProductionStatus: () => invoke("angelcare-desktop:diagnostics-command", diagnosticsCommands, "get-production-status"),
  }),
});

contextBridge.exposeInMainWorld("angelcareDesktop", api);

window.addEventListener("DOMContentLoaded", () => {
  document.documentElement.dataset.angelcareDesktop = "true";
  document.documentElement.dataset.angelcareDesktopPlatform = runtime.platform;
  document.documentElement.dataset.angelcareDesktopVersion = runtime.version;
  document.documentElement.dataset.angelcareWhatsappRuntime = "available";
  document.documentElement.dataset.angelcareProductionRuntime = "available";
  document.documentElement.dataset.angelcareCorporateStation = "available";
  window.dispatchEvent(new CustomEvent("angelcare:desktop-ready", { detail: api }));
});
