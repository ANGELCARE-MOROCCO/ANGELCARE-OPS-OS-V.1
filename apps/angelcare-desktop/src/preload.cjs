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
  contractVersion: argumentValue("--angelcare-desktop-contract=", "4.0.0"),
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
    whatsappAutomation: false,
    whatsappDomAccess: false,
  }),
});

const allowedCommands = new Set([
  "get-status",
  "show",
  "hide",
  "reload",
  "hard-reload",
  "go-back",
  "go-forward",
  "focus",
  "open-external",
  "navigate",
  "restart",
  "clear-cache",
  "clear-session",
  "open-downloads",
  "set-layout",
]);

function invokeWhatsapp(action, payload = {}) {
  if (!allowedCommands.has(action)) return Promise.reject(new Error("Unsupported ANGELCARE WhatsApp command."));
  return ipcRenderer.invoke("angelcare-desktop:whatsapp-command", action, payload);
}

function setWhatsappBounds(bounds) {
  const safeBounds = {
    x: Number(bounds?.x || 0),
    y: Number(bounds?.y || 0),
    width: Number(bounds?.width || 0),
    height: Number(bounds?.height || 0),
  };
  return ipcRenderer.invoke("angelcare-desktop:whatsapp-bounds", safeBounds);
}

const governanceCommands = new Set(["get-status", "register", "heartbeat", "refresh", "select-workspace"]);
function invokeGovernance(action, payload = {}) {
  if (!governanceCommands.has(action)) return Promise.reject(new Error("Unsupported ANGELCARE governance command."));
  return ipcRenderer.invoke("angelcare-desktop:governance-command", action, payload);
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
    getStatus: () => invokeWhatsapp("get-status"),
    show: () => invokeWhatsapp("show"),
    hide: () => invokeWhatsapp("hide"),
    reload: () => invokeWhatsapp("reload"),
    hardReload: () => invokeWhatsapp("hard-reload"),
    goBack: () => invokeWhatsapp("go-back"),
    goForward: () => invokeWhatsapp("go-forward"),
    focus: () => invokeWhatsapp("focus"),
    openExternal: () => invokeWhatsapp("open-external"),
    navigate: (payload) => invokeWhatsapp("navigate", payload),
    restart: () => invokeWhatsapp("restart"),
    clearCache: () => invokeWhatsapp("clear-cache"),
    clearSession: () => invokeWhatsapp("clear-session"),
    openDownloads: () => invokeWhatsapp("open-downloads"),
    setLayout: (layout) => invokeWhatsapp("set-layout", { layout }),
    setBounds: setWhatsappBounds,
    onStatus: (listener) => subscribe("angelcare-desktop:whatsapp-state", listener),
  }),
  governance: Object.freeze({
    getStatus: () => invokeGovernance("get-status"),
    register: () => invokeGovernance("register"),
    heartbeat: () => invokeGovernance("heartbeat"),
    refresh: () => invokeGovernance("refresh"),
    selectWorkspace: (workspaceId, workspaceName = "") => invokeGovernance("select-workspace", { workspaceId, workspaceName }),
    onStatus: (listener) => subscribe("angelcare-desktop:governance-state", listener),
  }),
});

contextBridge.exposeInMainWorld("angelcareDesktop", api);

window.addEventListener("DOMContentLoaded", () => {
  document.documentElement.dataset.angelcareDesktop = "true";
  document.documentElement.dataset.angelcareDesktopPlatform = runtime.platform;
  document.documentElement.dataset.angelcareDesktopVersion = runtime.version;
  document.documentElement.dataset.angelcareWhatsappRuntime = "available";
  window.dispatchEvent(new CustomEvent("angelcare:desktop-ready", { detail: api }));
});
