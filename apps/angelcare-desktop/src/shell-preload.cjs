"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("angelcareShell", Object.freeze({
  getRuntime: () => ipcRenderer.invoke("angelcare-desktop:get-runtime"),
  action: (action) => ipcRenderer.invoke("angelcare-desktop:shell-action", String(action || "")),
  onState: (listener) => {
    if (typeof listener !== "function") return () => {};
    const handler = (_event, state) => listener(state);
    ipcRenderer.on("angelcare-desktop:state", handler);
    return () => ipcRenderer.removeListener("angelcare-desktop:state", handler);
  },
}));
