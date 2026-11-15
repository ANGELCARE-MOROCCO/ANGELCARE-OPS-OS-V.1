import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root="apps/marketplace-web/";
const read=p=>readFileSync(root+p,"utf8");
const ui=read("angelcare-marketplace/seo-power/Command360.tsx");
const css=read("angelcare-marketplace/seo-power/command360.module.css");
const api=read("angelcare-marketplace/seo-power/command-r5-api.ts");
test("R6 replaces large yellow activation banner with compact, honest status",()=>{
 assert.match(ui,/className=\{s\.activationCompact\}/);
 assert.doesNotMatch(ui,/className=\{s\.activation\}/);
 assert.match(ui,/r4Deployment,r4Database,r5Deployment,r5Database/);
 assert.match(css,/\.activationCompact\{/);
 assert.match(css,/background:#f7faf8/);
 assert.match(css,/\.activationMiniChecks/);
 assert.match(ui,/Activer R4 \+ R5/);
});
test("Activation is not available until both real deployed runtime flags report enabled",()=>{
 assert.match(ui,/canGovern&&r4Deployment&&r5Deployment/);
 assert.match(api,/process\.env\.SEO_POWER_ENGINE_R4_ENABLED!=="1"/);
 assert.match(api,/SEO_POWER_COMMAND360_R5_ENABLED/);
 assert.match(api,/if\(!access\(ctx\)\.publish\)/);
 assert.match(api,/expectedR4UpdatedAt/);
 assert.match(api,/expectedRevision/);
});
test("R4 handover refuses active legacy jobs, preserves audit and read-back",()=>{
 assert.match(api,/ac_seo_power_jobs/);
 assert.match(api,/\.eq\("state","running"\)/);
 assert.match(api,/R4_LEASES_PRESENT/);
 assert.match(api,/R4_SWITCH_CONFLICT/);
 assert.match(api,/ac_seo_power_r5_activate/);
 assert.match(api,/ac_seo_power_r5_dashboard/);
 assert.match(api,/ACTIVATION_INCOMPLETE/);
 assert.match(api,/r4_activated/);
});
test("Core SEO command paths remain connected to legacy worker and governed campaigns",()=>{
 for (const name of ["campaign-start","campaign-pause","campaign-resume","campaign-cancel","schedule-save","capacity-save","job-retry","recover-group"])
  assert.ok(api.includes(name),name);
 assert.match(ui,/LegacyWorkspace/);
 assert.match(ui,/GrowthWorkspace/);
 assert.match(ui,/RecoveryTable/);
 assert.match(ui,/Command Tower/);
});
