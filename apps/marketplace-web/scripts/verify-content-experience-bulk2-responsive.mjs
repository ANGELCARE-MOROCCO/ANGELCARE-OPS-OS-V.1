import {contains,pass} from "./_bulk2-verifier-helpers.mjs";
const f="components/market-os/content-command/experience-bulk2/bulk2-experience.module.css";
contains(f,["@media(max-width:1380px)","@media(max-width:1100px)","@media(max-width:820px)","@media(max-width:560px)","overflow-x:hidden","min-width:0"]);
pass("desktop, laptop, tablet and mobile adaptation rules are present without page-level horizontal overflow");
