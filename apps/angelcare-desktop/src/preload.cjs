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
  contractVersion: argumentValue("--angelcare-desktop-contract=", "5.0.0"),
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
    whatsappAutomation: false,
    whatsappDomAccess: false,
  }),
});

const allowedCommands = new Set(["get-status", "show", "hide", "reload", "hard-reload", "go-back", "go-forward", "focus", "open-external", "navigate", "restart", "clear-cache", "clear-session", "open-downloads", "set-layout"]);
const governanceCommands = new Set(["get-status", "register", "heartbeat", "refresh", "select-workspace"]);
const releaseCommands = new Set(["get-status", "check", "download", "restart-to-update", "reveal-download"]);
const diagnosticsCommands = new Set(["get-status", "export", "get-production-status"]);

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
  window.dispatchEvent(new CustomEvent("angelcare:desktop-ready", { detail: api }));
});
