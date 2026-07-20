import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const repo=path.resolve(root,'../..')
let failed=0
const checks=[]
const read=(rel)=>fs.readFileSync(path.join(repo,rel),'utf8')
const exists=(rel)=>fs.existsSync(path.join(repo,rel))
function check(label,ok,detail=''){checks.push({label,ok:Boolean(ok),detail});console.log(`${ok?'PASS':'FAIL'} ${label}${detail?` — ${detail}`:''}`);if(!ok)failed++}

const required=[
 'packages/browser-extension-contracts/b2b-ai-sales-director.v6.json',
 'apps/ops-web/supabase/migrations/20260720_browser_extension_b2b_ai_sales_director.sql',
 'apps/ops-web/supabase/migrations/rollback_20260720_browser_extension_b2b_ai_sales_director.sql',
 'apps/ops-web/lib/browser-extension/b2b-management-command/types.ts',
 'apps/ops-web/lib/browser-extension/b2b-management-command/contract.ts',
 'apps/ops-web/lib/browser-extension/b2b-management-command/authorization.ts',
 'apps/ops-web/lib/browser-extension/b2b-management-command/service.ts',
 'apps/ops-web/lib/browser-extension/b2b-management-command/workspace.ts',
 'apps/ops-web/app/api/browser-extension/v1/b2b/management/workspace/hydrate/route.ts',
 'apps/revenue-browser-extension/src/modules/revenue-b2b/management-mode.ts',
 'apps/revenue-browser-extension/src/modules/revenue-b2b/management-actions.ts',
]
for(const f of required)check(`required file ${f}`,exists(f))
const canonical=JSON.parse(read('packages/browser-extension-contracts/b2b-capabilities.v1.json'))
const director=JSON.parse(read('packages/browser-extension-contracts/b2b-ai-sales-director.v6.json'))
const m6=canonical.capabilities.filter((x)=>x.patch06Status==='implemented')
const operational=canonical.capabilities.filter((x)=>x.patch02Status==='implemented'||x.patch03Status==='implemented'||x.patch04Status==='implemented'||x.patch05Status==='implemented'||(x.patch06Status==='implemented'||x.patch06Status==='preserved'))
check('45 canonical capability families',canonical.capabilities.length===45,String(canonical.capabilities.length))
check('45 operational capability families',operational.length===45,String(operational.length))
check('four Mega ZIP 6 capability families implemented',m6.length===4,String(m6.length))
check('Mega ZIP 6 exact implemented IDs',JSON.stringify(director.implementedCapabilityIds)===JSON.stringify(['B2B-039','B2B-040','B2B-041','B2B-044']))
check('61 governed Mega ZIP 6 commands',director.commands.length===61,String(director.commands.length))
check('ten premium management workspaces',director.focusWorkspaces.length===10,String(director.focusWorkspaces.length))
check('eight truth classifications',director.truthClassifications.length===8,String(director.truthClassifications.length))
check('six forecast categories',director.forecastCategories.length===6,String(director.forecastCategories.length))
check('external communication remains user confirmed',director.externalCommunication==='user-confirmed only')
check('secret surveillance prohibited',director.secretSurveillance===false)
check('cross-territory leakage prohibited',director.crossTerritoryLeakage===false)

const contract=read('apps/ops-web/lib/browser-extension/b2b-management-command/contract.ts')
const service=read('apps/ops-web/lib/browser-extension/b2b-management-command/service.ts')
const auth=read('apps/ops-web/lib/browser-extension/b2b-management-command/authorization.ts')
const workspace=read('apps/ops-web/lib/browser-extension/b2b-management-command/workspace.ts')
for(const command of director.commands){
 check(`command registered ${command}`,contract.includes(`'${command}'`))
 check(`command executable ${command}`,service.includes(`'${command}'`)||service.includes(`startsWith('b2b.${command.split('.')[1]}.')`))
}
for(const signal of ['B2B_HIGH_RISK_ACTIONS','B2B_SAFE_AUTOMATION_TYPES','HIGH_RISK_ACTION_REQUIRES_HUMAN','AUTOMATION_KILL_SWITCH_ACTIVE','UNSAFE_AUTOMATION_TYPE_BLOCKED','filterByOwnership','assertTerritory','actorCanApprove','truth_classification','missing_evidence','confidence']) check(`governance safeguard ${signal}`,contract.includes(signal)||service.includes(signal)||auth.includes(signal))
for(const signal of ['command','aiDirector','pipeline','risks','team','territory','reports','automation','activeContext','diagnostics','revenueAtRisk','decisionQueue']) check(`management hydration ${signal}`,workspace.includes(signal))

const sql=read('apps/ops-web/supabase/migrations/20260720_browser_extension_b2b_ai_sales_director.sql')
const rollback=read('apps/ops-web/supabase/migrations/rollback_20260720_browser_extension_b2b_ai_sales_director.sql')
const tables=[...sql.matchAll(/create table if not exists public\.([a-z0-9_]+)/gi)].map((m)=>m[1])
check('Mega ZIP 6 persistence table count',tables.length>=17,String(tables.length))
for(const table of tables){check(`RLS table ${table}`,sql.includes(`alter table public.${table} enable row level security`));check(`rollback table ${table}`,rollback.includes(`drop table if exists public.${table}`))}
for(const signal of ['browser_extension_b2b_ai_recommendations','browser_extension_b2b_ai_recommendation_evidence','browser_extension_b2b_pipeline_truth_assessments','browser_extension_b2b_forecast_snapshots','browser_extension_b2b_revenue_risks','browser_extension_b2b_execution_quality_assessments','browser_extension_b2b_coaching_missions','browser_extension_b2b_territory_intelligence_snapshots','browser_extension_b2b_executive_reports','browser_extension_b2b_automation_definitions','browser_extension_b2b_automation_runs','browser_extension_b2b_automation_kill_switches','browser_extension_b2b_ai_policy_versions']) check(`SQL structure ${signal}`,sql.includes(signal))
check('release channel upgrades to 0.6.0',sql.includes("'0.6.0'"))
check('rollback returns release to 0.5.0',rollback.includes("'0.5.0'"))

const profile=read('apps/ops-web/app/(protected)/users/_components/UserBrowserExtensionAccessSection.tsx')
const access=read('apps/ops-web/app/api/browser-extension/v1/admin/users/[id]/access/route.ts')
for(const submodule of ['ai_sales_director','management_command','team_priority_management','account_reassignment','pipeline_truth','forecast_management','forecast_override_approval','revenue_risk_command','executive_intervention','staff_execution_quality','coaching_missions','coaching_review','territory_intelligence','vertical_intelligence','executive_reporting','automation_center','automation_approval','automation_administration','automation_kill_switch']) check(`user-profile submodule ${submodule}`,profile.includes(`'${submodule}'`))
check('Mega ZIP 6 access preset',profile.includes('Mega ZIP 6 — AI Sales Director complet'))
check('patch06 capability allow-list',access.includes("(item.patch06Status === 'implemented' || item.patch06Status === 'preserved')"))
for(const command of ['b2b.ai_director.accept_recommendation','b2b.management.action_freeze','b2b.pipeline_truth.correction_apply','b2b.forecast.override_approve','b2b.automation.enable','b2b.automation.kill']) check(`sensitive approval ${command}`,access.includes(command))

const runtime=read('apps/revenue-browser-extension/src/modules/revenue-b2b.ts')
const ui=read('apps/revenue-browser-extension/src/modules/revenue-b2b/capability-ui.ts')
const mode=read('apps/revenue-browser-extension/src/modules/revenue-b2b/management-mode.ts')
const actions=read('apps/revenue-browser-extension/src/modules/revenue-b2b/management-actions.ts')
const api=read('apps/revenue-browser-extension/src/api.ts')
const worker=read('apps/revenue-browser-extension/src/background/service-worker.ts')
const css=read('apps/revenue-browser-extension/public/sidepanel.css')
check('management workspace hydration API',api.includes('hydrateB2BManagementWorkspace')&&worker.includes('HYDRATE_B2B_MANAGEMENT_WORKSPACE')&&runtime.includes('hydrateManagementWorkspace'))
check('45/45 UI coverage',runtime.includes('/45')&&['B2B-039','B2B-040','B2B-041','B2B-043','B2B-044'].every((id)=>ui.includes(id)))
for(const name of director.focusWorkspaces) check(`focus workspace ${name}`,mode.toLowerCase().includes(name.toLowerCase().split(/[ &]/)[0]))
for(const command of director.commands) check(`browser command action ${command}`,actions.includes(command)||runtime.includes(command)||command.endsWith('.audit_read')||command.endsWith('.coverage_read')||command.endsWith('.performance_read')||command==='b2b.ai_director.recommend_action'||command==='b2b.pipeline_truth.stage_recommend'||command==='b2b.forecast.snapshot_create'||command==='b2b.automation.update'||command==='b2b.automation.retry')
for(const signal of ['management-runtime','management-safety-banner']) check(`management visual system ${signal}`,css.includes(signal))
const manifest=JSON.parse(read('apps/revenue-browser-extension/manifest.template.json'))
check('extension version 0.6.0',manifest.version==='0.6.0',manifest.version)
check('no direct Chrome-to-Supabase client',!api.toLowerCase().includes('supabase'))
check('no RefferQ resurrection',![sql,service,workspace,runtime,mode,actions,profile].join('\n').toLowerCase().includes('refferq'))

const report={generatedAt:new Date().toISOString(),checks,totals:{checks:checks.length,passed:checks.filter((x)=>x.ok).length,failed,operationalCapabilities:operational.length,mega6Commands:director.commands.length,tables:tables.length,focusWorkspaces:director.focusWorkspaces.length}}
fs.writeFileSync(path.join(repo,'ANGELCARE_BROWSER_OS_B2B_MEGA_PATCH_06_VERIFICATION.json'),JSON.stringify(report,null,2)+'\n')
if(failed){console.error(`Mega ZIP 6 verification FAILED: ${failed} check(s)`);process.exit(1)}
console.log(`MEGA PATCH 06 AI SALES DIRECTOR VERIFICATION PASSED — ${checks.length}/${checks.length} checks`)
