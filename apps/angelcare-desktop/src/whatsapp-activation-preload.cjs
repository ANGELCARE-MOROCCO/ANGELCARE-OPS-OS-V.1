"use strict";
const { contextBridge, ipcRenderer } = require("electron");
const commands=new Set(["get-status","refresh","open"]);
contextBridge.exposeInMainWorld("angelcareWhatsappActivation",Object.freeze({
  command:(action)=>commands.has(action)?ipcRenderer.invoke("angelcare-desktop:whatsapp-activation-command",action):Promise.reject(new Error("Unsupported WhatsApp activation command.")),
  onStatus:(listener)=>{if(typeof listener!=="function")return()=>{};const handler=(_event,state)=>listener(state);ipcRenderer.on("angelcare-desktop:whatsapp-state",handler);return()=>ipcRenderer.removeListener("angelcare-desktop:whatsapp-state",handler);}
}));
