"use strict";
const clock = document.getElementById("clock");
function renderClock(){ if(clock) clock.textContent=new Intl.DateTimeFormat("fr-FR",{dateStyle:"full",timeStyle:"short"}).format(new Date()); }
renderClock(); setInterval(renderClock,30000);
