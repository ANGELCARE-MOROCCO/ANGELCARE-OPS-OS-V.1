"use strict";

const { contextBridge, ipcRenderer } = require("electron");

const corporateCommands = new Set(["list", "get-status", "create-ac-plus", "close", "close-others", "activate", "pin", "reorder", "reopen-closed", "back", "forward", "reload", "reload-no-cache", "stop", "home", "zoom-in", "zoom-out", "zoom-reset", "set-zoom", "fit-workspace", "recover", "open-split-selector", "close-split-selector", "activate-split", "exit-split", "focus-pane", "replace-pane", "swap-panes", "maximize-pane", "restore-pane", "open-downloads"]);
const stationCommands = new Set(["get-status", "get-policy", "refresh-policy", "request-mode", "request-unlock", "get-lockout-status", "get-diagnostics"]);
function invoke(channel, allowlist, action, payload = {}) {
  if (!allowlist.has(action)) return Promise.reject(new Error("Unsupported ANGELCARE Corporate Station command."));
  return ipcRenderer.invoke(channel, action, payload);
}
function subscribe(channel, listener) {
  if (typeof listener !== "function") return () => {};
  const handler = (_event, state) => listener(state);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld("angelcareShell", Object.freeze({
  getRuntime: () => ipcRenderer.invoke("angelcare-desktop:get-runtime"),
  action: (action) => ipcRenderer.invoke("angelcare-desktop:shell-action", String(action || "")),
  corporate: Object.freeze({
    command: (action, payload = {}) => invoke("angelcare-desktop:corporate-command", corporateCommands, String(action || ""), payload),
    onStatus: (listener) => subscribe("angelcare-desktop:corporate-state", listener),
  }),
  station: Object.freeze({
    command: (action, payload = {}) => invoke("angelcare-desktop:station-command", stationCommands, String(action || ""), payload),
    onStatus: (listener) => subscribe("angelcare-desktop:station-state", listener),
  }),
  onState: (listener) => subscribe("angelcare-desktop:state", listener),
}));
