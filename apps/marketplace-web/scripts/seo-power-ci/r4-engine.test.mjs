import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseScaleR4,isEligibleLinks,isEligibleIndexNow} from '../../angelcare-marketplace/seo-power/scale-r4.ts';
const root='apps/marketplace-web/';
const read=(x)=>readFileSync(root+x,'utf8');
test('R4 defaults remain inactive without explicit database activation',()=>{
 const parsed=parseScaleR4({});
 assert.equal(parsed.enabled,false);
 assert.equal(parsed.requestTimeoutSeconds,30);
 assert.equal(parsed.globalConcurrency,16);
 assert.equal(parsed.queueLimitPerProject,100000);
 assert.equal(parseScaleR4({enabled:true,capacity:{workersPerTick:999}}).workersPerTick,4);
});
test('Prerequisites prohibit invalid links and IndexNow operations',()=>{
 assert.equal(isEligibleLinks(null),false);
 assert.equal(isEligibleLinks({links:[]}),true);
 assert.equal(isEligibleIndexNow(false,200,true),false);
 assert.equal(isEligibleIndexNow(true,404,true),false);
 assert.equal(isEligibleIndexNow(true,200,true),true);
});
test('R4 is backend-only, with compatibility and rollback gates',()=>{
 const runner=read('angelcare-marketplace/seo-power/runner.ts');
 const migration=read('supabase/migrations/20261114012000_seo_power_scale_engine_r4.sql');
 const net=read('angelcare-marketplace/seo-power/network.ts');
 assert.match(runner,/resolveScaleR4/);
 assert.match(runner,/ac_seo_power_r4_claim/);
 assert.match(runner,/ac_seo_power_r4_finish/);
 assert.match(runner,/ac_seo_power_r4_heartbeat/);
 assert.match(net,/Math\.min\(options\.timeoutMs \|\| 8000, 45000\)/);
 assert.match(migration,/enabled boolean not null default false/i);
 assert.match(migration,/ac_seo_power_r4_schedule_due/);
 assert.match(migration,/ac_seo_power_r4_claim/);
 assert.match(migration,/ac_seo_power_r4_enqueue/);
 assert.match(migration,/ac_seo_power_r4_heartbeat/);
 assert.match(migration,/ac_seo_power_r4_finish/);
 assert.match(migration,/create index if not exists ac_seo_power_r4_due_idx/i);
 assert.doesNotMatch(migration,/drop table|truncate table|delete from public\.ac_seo_power_/i);
});
