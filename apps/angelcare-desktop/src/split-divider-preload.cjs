"use strict";
const { contextBridge, ipcRenderer }=require("electron");
contextBridge.exposeInMainWorld("angelcareSplitDivider",Object.freeze({
  getConfig:()=>ipcRenderer.invoke("angelcare-desktop:split-divider-command","get-config"),
  move:(delta)=>ipcRenderer.send("angelcare-desktop:split-divider-move",Number(delta)||0),
  onConfig:(listener)=>{if(typeof listener!=="function")return()=>{};const handler=(_event,state)=>listener(state);ipcRenderer.on("angelcare-desktop:split-divider-config",handler);return()=>ipcRenderer.removeListener("angelcare-desktop:split-divider-config",handler);}
}));
