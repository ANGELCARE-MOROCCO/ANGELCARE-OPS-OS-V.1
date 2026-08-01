#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const appRoot=path.resolve(process.argv[2]||process.cwd())
let checks=0
function fail(message){console.error(`FAIL — ${message}`);process.exit(1)}
function file(rel){const p=path.join(appRoot,rel);if(!fs.existsSync(p))fail(`missing ${rel}`);checks+=1;return fs.readFileSync(p,'utf8')}
function has(rel,pattern,label){const text=file(rel);const ok=pattern instanceof RegExp?pattern.test(text):text.includes(pattern);if(!ok)fail(`${label||pattern} missing in ${rel}`);checks+=1}
function lacks(rel,pattern,label){const text=file(rel);const bad=pattern instanceof RegExp?pattern.test(text):text.includes(pattern);if(bad)fail(`${label||pattern} must not exist in ${rel}`);checks+=1}

const route='app/(protected)/market-os/content-command-center/production-operations/page.tsx'
const home='app/(protected)/market-os/content-command-center/my-home/page.tsx'
const api='app/api/market-os/content-command-headquarters/production-operations/route.ts'
const service='lib/market-os/content-command-headquarters/production-operations-service.ts'
const types='lib/market-os/content-command-headquarters/production-operations-types.ts'
const workspace='components/market-os/content-command/production-operations/ProductionOperationsWorkspace.tsx'
const css='components/market-os/content-command/production-operations/production-operations.module.css'
const sql='supabase/migrations/20260801_0300_content_command_production_operations_release_control.sql'
const gateway='lib/market-os/ai-runtime/gateway.ts'
const nav='components/market-os/content-command/content-command-navigation.tsx'

for(const rel of [route,home,api,service,types,workspace,css,`${css}.d.ts`,sql,gateway,nav,'lib/market-os/content-command-headquarters/market-scan.ts','lib/market-os/content-command-headquarters/opportunity-intelligence-service.ts','lib/market-os/content-command-headquarters/publication-release-service.ts','app/api/market-os/content-command/research-control/cron/route.ts','app/api/market-os/content-command/marketing-ai/cron/route.ts'])file(rel)

for(const token of ['Production Operations','production-operations','ServerCog','my-role-home','Mon poste'])has(nav,token,`navigation ${token}`)
for(const token of ['maintenanceMode','manualOnlyMode','aiAutomationPaused','tavilyPaused','openRouterPaused','scheduledScansPaused','scheduledPublishingPaused','criticalAuthorityId','criticalAuthorityName'])has(types,token,`type ${token}`)
for(const token of ['getProductionOperationsSnapshot','updateProductionControls','governProductionRelease','updateBudgetPolicy','updateInternationalDefault','updateRoleHome','updateNotificationRule','refreshOperationalIncidents','actOnOperationalIncident','applyProductionHygiene','assertProductionCapability','recordAiUsage','recordProductionIncident','claimCriticalAuthority','getGlobalOperatingDefaults'])has(service,token,`service ${token}`)
for(const token of ['update_controls','release_create','release_activate','budget_update','defaults_update','role_home_update','notification_update','incidents_refresh','incident_action','hygiene_apply','claim_critical_authority'])has(api,token,`API action ${token}`)
for(const token of ['PRODUCTION SWITCHBOARD','FAILED-OPERATION COMMAND QUEUE','AI COST & QUOTA GOVERNANCE','INTERNATIONAL OPERATING DEFAULTS','ROLE-BASED OPERATING HOMES','NOTIFICATION & ESCALATION DOCTRINE','FORMAL PRODUCTION VERSION','PRODUCTION DATA HYGIENE'])has(workspace,token,`workspace section ${token}`)
for(const token of ['Switchboard','Failures','AI Cost','International','Role Homes','Notifications','Release 1.0','Data Hygiene'])has(workspace,token,`tab ${token}`)
for(const token of ['assertProductionCapability(\'ai\')','assertProductionCapability(\'tavily\')','assertProductionCapability(\'openrouter\')','recordAiUsage','recordProductionIncident'])has(gateway,token,`runtime integration ${token}`)
has('lib/market-os/content-command-headquarters/market-scan.ts',"assertProductionCapability(input.reason?.startsWith('scheduled') ? 'scheduled_scan' : 'tavily')",'market scan switchboard')
has('lib/market-os/content-command-headquarters/opportunity-intelligence-service.ts','getGlobalOperatingDefaults','international defaults integration')
has('lib/market-os/content-command-headquarters/publication-release-service.ts',"assertProductionCapability('publishing')",'publishing switchboard')
has('app/api/market-os/content-command/research-control/cron/route.ts',"assertProductionCapability('scheduled_scan')",'research cron pause')
has('app/api/market-os/content-command/marketing-ai/cron/route.ts',"assertProductionCapability('ai')",'autopilot cron pause')

for(const table of ['market_content_production_controls','market_content_release_versions','market_content_operational_incidents','market_content_ai_cost_ledger','market_content_budget_policies','market_content_international_defaults','market_content_role_home_profiles','market_content_notification_rules'])has(sql,`create table if not exists public.${table}`,`SQL table ${table}`)
for(const token of ['Aissaoui Ilyass','AC-CCC-DOC-1.0','AC-CCC-SKL-1.0','AC-CCC-CMD-1.0','AC-CCC-AI-1.0','Africa/Casablanca','fr-MA','Dh'])has(sql,token,`seed ${token}`)
for(const token of ['publication.failed','provider.unavailable','budget.threshold','critical.override','permanent.deletion'])has(sql,token,`notification ${token}`)
for(const token of ['content_officer','copywriter','designer','marketing_manager','marketing_director','admin'])has(sql,token,`role ${token}`)
for(const token of ['alter table public.%I enable row level security','revoke all on table public.%I from anon, authenticated','grant all on table public.%I to service_role'])has(sql,token,`security ${token}`)

lacks(workspace,/localStorage\s*\(/,'business localStorage')
lacks(workspace,/Gemini/i,'Gemini legacy')
lacks(service,/SUPABASE_SERVICE_ROLE_KEY/,'direct secret access')
lacks(api,/createServiceClient/,'API direct database bypass')

const changed=[route,home,api,service,types,workspace,gateway,nav,'lib/market-os/content-command-headquarters/market-scan.ts','lib/market-os/content-command-headquarters/opportunity-intelligence-service.ts','lib/market-os/content-command-headquarters/publication-release-service.ts','app/api/market-os/content-command/research-control/cron/route.ts','app/api/market-os/content-command/marketing-ai/cron/route.ts']
const importRe=/(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g
const exts=['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.css']
for(const rel of changed){const text=file(rel);for(const match of text.matchAll(importRe)){const spec=match[1];if(!(spec.startsWith('.')||spec.startsWith('@/')))continue;const base=spec.startsWith('@/')?path.join(appRoot,spec.slice(2)):path.resolve(path.dirname(path.join(appRoot,rel)),spec);const candidates=[base,...exts.map(ext=>base+ext),...exts.map(ext=>path.join(base,`index${ext}`))];if(!candidates.some(p=>fs.existsSync(p)))fail(`unresolved import ${spec} in ${rel}`);checks+=1}}

console.log(`PASS — ${checks} Production Operations, release-control, cost, international, role-home, notification and switchboard checks passed.`)
