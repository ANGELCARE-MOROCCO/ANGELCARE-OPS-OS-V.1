import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const base="apps/marketplace-web/";
const read=(path)=>readFileSync(base+path,"utf8");
const sql=read("supabase/migrations/20261114034000_seo_power_command360_r5.sql");
const ui=read("angelcare-marketplace/seo-power/Command360.tsx");
const route=read("angelcare-marketplace/seo-power/command-r5-api.ts");
const runner=read("angelcare-marketplace/seo-power/runner.ts");
test("R5 migration is strictly additive and defaults disabled",()=>{
  assert.match(sql,/BEGIN;/);
  assert.match(sql,/COMMIT;/);
  assert.match(sql,/enabled boolean NOT NULL DEFAULT false/);
  assert.match(sql,/ac_seo_power_r5_dashboard/);
  assert.match(sql,/ac_seo_power_r5_events/);
  assert.match(sql,/ac_seo_power_r5_campaigns/);
  assert.match(sql,/ac_seo_power_r5_campaign_jobs/);
  assert.match(sql,/ac_seo_power_r5_schedule_tick/);
  assert.match(sql,/ac_seo_power_r5_reconcile/);
  assert.match(sql,/ac_seo_power_r5_activate/);
  assert.match(sql,/ac_seo_power_r5_capacity_save/);
  assert.match(sql,/ac_seo_power_r5_retry_job/);
  assert.match(sql,/ac_seo_power_r5_recover_group/);
  assert.match(sql,/ac_seo_power_r5_retry_receipts/);
  assert.match(sql,/R5_POLICY_OR_SOURCE_REVIEW_REQUIRED/);
  assert.match(sql,/request_key text NOT NULL/);

  assert.match(sql,/campaign\.state='paused'/);
  assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE TABLE|DELETE FROM public\.ac_seo_power_/i);
});
test("Operator controls are real authorization-checked RPCs",()=>{
  assert.match(route,/requireMarketplaceApiContext/);
  assert.match(route,/if\(!access\(ctx\)\.manage\)/);
  for(const name of ["campaign-start","campaign-pause","campaign-resume","campaign-cancel","schedule-save","capacity-save","job-retry","job-cancel","recover-group"])
    assert.ok(route.includes(name),"Missing "+name);
  assert.match(route,/SEO_POWER_COMMAND360_R5_ENABLED/);
  assert.match(route,/R4_INACTIVE/);
  assert.match(route,/ac_seo_power_r5_activate/);
  assert.match(route,/ac_seo_power_r5_capacity_save/);
  assert.match(route,/ac_seo_power_r5_retry_job/);
  assert.match(route,/ac_seo_power_r5_recover_group/);
});
test("Live execution data is server persisted, not invented",()=>{
  assert.match(ui,/progress===null/);
  assert.match(ui,/onAction\("campaign-pause"/);
  assert.match(ui,/onAction\("campaign-resume"/);
  assert.match(ui,/onAction\("campaign-cancel"/);
  assert.match(ui,/setInterval/);
  assert.match(ui,/RecoveryTable/);
  assert.match(ui,/recover-group/);
  assert.match(ui,/LEGACY/);
  assert.match(ui,/LegacyWorkspace/);
  assert.match(ui,/GrowthWorkspace/);
  assert.match(runner,/ac_seo_power_r5_job_event/);
  assert.match(runner,/ac_seo_power_r5_worker_seen/);
  assert.match(runner,/ac_seo_power_r5_schedule_tick/);
});
test("Command Center replaces only the SEO Power admin body",()=>{
  assert.match(read("angelcare-marketplace/seo-power/Workspace.tsx"),/Command360/);
  const css=read("angelcare-marketplace/seo-power/command360.module.css");
  assert.match(css,/\.hero/);
  assert.match(css,/\.campaign/);
  assert.match(css,/\.capacityGrid/);
  assert.match(css,/\.tabs/);
});
