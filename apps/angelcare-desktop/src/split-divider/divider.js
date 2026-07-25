"use strict";
const grip=document.getElementById("grip");
let orientation="vertical",dragging=false,last=0;
function apply(config={}){orientation=config.orientation==="horizontal"?"horizontal":"vertical";grip.className=`grip ${orientation}`;}
window.angelcareSplitDivider.onConfig(apply);
window.angelcareSplitDivider.getConfig().then(apply).catch(()=>{});
grip.addEventListener("pointerdown",(event)=>{dragging=true;last=orientation==="vertical"?event.screenX:event.screenY;grip.setPointerCapture(event.pointerId);});
grip.addEventListener("pointermove",(event)=>{if(!dragging)return;const current=orientation==="vertical"?event.screenX:event.screenY;const delta=current-last;if(delta){last=current;window.angelcareSplitDivider.move(delta);}});
function stop(){dragging=false;}grip.addEventListener("pointerup",stop);grip.addEventListener("pointercancel",stop);
