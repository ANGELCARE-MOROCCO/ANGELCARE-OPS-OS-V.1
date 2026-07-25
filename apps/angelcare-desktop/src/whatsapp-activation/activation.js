"use strict";
const el=(id)=>document.getElementById(id);
const open=el("open"), refresh=el("refresh");
function text(value,fallback){const normalized=String(value||"").trim();return normalized||fallback;}
function render(state={}){
  const governance=state.governance||{};
  const activated=state.activated===true;
  const checking=["checking","authorizing","opening"].includes(state.phase);
  const blocked=["access-blocked","revoked","expired","missing-authorization","degraded"].includes(state.phase)||state.blockedReason;
  el("status-dot").className=`status-dot ${activated?"ready":blocked?"blocked":checking?"checking":"dormant"}`;
  el("status-title").textContent=activated?"Ouvert":blocked?"Ouverture bloquée":checking?"Vérification en cours":"Non ouvert";
  el("status-badge").textContent=activated?"Actif":blocked?"Action requise":checking?"Contrôle sécurisé":"En attente d’ouverture";
  el("status-message").textContent=text(state.message,activated?"WhatsApp professionnel est ouvert.":"WhatsApp reste dormant. Aucune connexion n’est établie tant que vous ne l’ouvrez pas.");
  el("authorization").textContent=text(governance.authorizationLabel||state.authorizationLabel,blocked?"Refusée":"À vérifier");
  el("workspace").textContent=text(governance.workspaceLabel||state.workspaceLabel,"Non résolu");
  el("device").textContent=text(governance.deviceLabel||state.deviceLabel,"Non résolu");
  el("session").textContent=activated?"Connectée sur demande":"Conservée, non connectée";
  const reason=text(state.blockedReason||state.detail,"");
  el("safe-reason").hidden=!reason; el("safe-reason").textContent=reason;
  open.disabled=activated||checking;
  open.textContent=activated?"WhatsApp ouvert":checking?"Ouverture…":"Ouvrir WhatsApp";
  refresh.disabled=checking;
}
open.addEventListener("click",()=>{open.disabled=true;window.angelcareWhatsappActivation.command("open").catch((e)=>render({phase:"access-blocked",message:"Ouverture impossible.",blockedReason:String(e?.message||e)}));});
refresh.addEventListener("click",()=>window.angelcareWhatsappActivation.command("refresh").catch((e)=>render({phase:"access-blocked",message:"Vérification impossible.",blockedReason:String(e?.message||e)})));
window.angelcareWhatsappActivation.onStatus(render);
window.angelcareWhatsappActivation.command("get-status").then(render).catch(()=>render());
