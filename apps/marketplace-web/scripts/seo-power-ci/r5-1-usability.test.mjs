import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root="apps/marketplace-web/angelcare-marketplace/seo-power/";
const read=(f)=>readFileSync(root+f,"utf8");
test("Truthful activation has four independent signals",()=>{
 const api=read("command-r5-api.ts");
 const ui=read("Command360.tsx");
 for(const prop of ["r4Deployment","r4Database","r5Deployment","r5Database"]){
  assert.match(api,new RegExp(prop));
  assert.match(ui,new RegExp(prop));
 }
 assert.match(api,/SEO_POWER_ENGINE_R4_ENABLED/);
 assert.match(api,/SEO_POWER_COMMAND360_R5_ENABLED/);
 assert.match(ui,/four|quatre|autorisations/i);
});
test("Unavailable R5 never hides history or actionable diagnostics",()=>{
 const ui=read("Command360.tsx");
 assert.match(ui,/DERNIÈRES EXÉCUTIONS ENREGISTRÉES/);
 assert.match(ui,/executions\.slice\(0,8\)/);
 assert.match(ui,/selectTab\("capacity"\)/);
 assert.match(ui,/selectTab\("queue"\)/);
 assert.match(ui,/canOperate=active&&canManage&&ready&&!busy/);
});
test("Desktop layout cannot stretch empty panels or clip navigation",()=>{
 const css=read("command360.module.css");
 assert.match(css,/\.tabs\{flex-wrap:wrap;overflow-x:visible;/);
 assert.match(css,/\.twoColumns\{align-items:start;/);
 assert.match(css,/\.activationChecks\{/);
 assert.match(css,/\.legacyRun\{/);
 assert.match(css,/\.root\{width:100%;max-width:100%;overflow-x:clip;/);
});
