"use strict";
const { contextBridge, ipcRenderer } = require("electron");
const submitChannel = "angelcare-desktop:station-unlock-submit";
const cancelChannel = "angelcare-desktop:station-unlock-cancel";
const statusChannel = "angelcare-desktop:station-unlock-status";
contextBridge.exposeInMainWorld("angelcareUnlock", Object.freeze({
  submit: (payload) => ipcRenderer.invoke(submitChannel, {
    method: payload?.method === "recovery" ? "recovery" : "pin",
    secret: String(payload?.secret || "").slice(0, 256),
    reason: String(payload?.reason || "").slice(0, 1000),
  }),
  cancel: () => ipcRenderer.invoke(cancelChannel),
  onStatus: (listener) => {
    if (typeof listener !== "function") return () => {};
    const wrapped = (_event, status) => listener(status);
    ipcRenderer.on(statusChannel, wrapped);
    return () => ipcRenderer.removeListener(statusChannel, wrapped);
  },
}));
