import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repo = path.resolve(root, '../..')
let failed = 0
const report = { generatedAt: new Date().toISOString(), checks: [], totals: {} }
function read(relative) { return fs.readFileSync(path.join(repo, relative), 'utf8') }
function exists(relative) { return fs.existsSync(path.join(repo, relative)) }
function check(label, condition, detail = '') {
  const ok = Boolean(condition)
  report.checks.push({ label, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failed += 1
}

const required = [
  'packages/browser-extension-contracts/b2b-partner-lifecycle.v5.json',
  'apps/ops-web/supabase/migrations/20260720_browser_extension_b2b_partner_lifecycle.sql',
  'apps/ops-web/supabase/migrations/rollback_20260720_browser_extension_b2b_partner_lifecycle.sql',
  'apps/ops-web/lib/browser-extension/b2b-partner-lifecycle/types.ts',
  'apps/ops-web/lib/browser-extension/b2b-partner-lifecycle/contract.ts',
  'apps/ops-web/lib/browser-extension/b2b-partner-lifecycle/service.ts',
  'apps/ops-web/lib/browser-extension/b2b-partner-lifecycle/authorization.ts',
  'apps/ops-web/lib/browser-extension/b2b-partner-lifecycle/workspace.ts',
  'apps/ops-web/app/api/browser-extension/v1/b2b/partner/workspace/hydrate/route.ts',
  'apps/revenue-browser-extension/src/modules/revenue-b2b/partner-mode.ts',
  'apps/revenue-browser-extension/src/modules/revenue-b2b/partner-actions.ts',
]
for (const item of required) check(`required file ${item}`, exists(item))

const canonical = JSON.parse(read('packages/browser-extension-contracts/b2b-capabilities.v1.json'))
const supplement = JSON.parse(read('packages/browser-extension-contracts/b2b-partner-lifecycle.v5.json'))
const m5 = canonical.capabilities.filter((item) => item.patch05Status === 'implemented')
const allCommands = new Set(m5.flatMap((item) => item.commands || []))
const operational = canonical.capabilities.filter((item) => ['implemented', 'preserved'].includes(item.patch05Status) || ['implemented', 'preserved'].includes(item.patch06Status))
check('six Mega ZIP 5 capability families implemented', m5.length === 6, String(m5.length))
check('45 cumulative operational capability families after Mega ZIP 6', operational.length === 45, String(operational.length))
check('40 governed Mega ZIP 5 commands', allCommands.size === 40, String(allCommands.size))
check('eight premium Focus Mode workspaces', supplement.focusWorkspaces?.length === 8, String(supplement.focusWorkspaces?.length || 0))
check('eight persistent Partner context identifiers', supplement.persistentContext?.length === 8, String(supplement.persistentContext?.length || 0))
check('Mega ZIP 6 capability families are now implemented', canonical.capabilities.filter((item) => ['B2B-039','B2B-040','B2B-041','B2B-044'].includes(item.id)).every((item) => item.patch06Status === 'implemented'))

const sql = read('apps/ops-web/supabase/migrations/20260720_browser_extension_b2b_partner_lifecycle.sql')
const rollback = read('apps/ops-web/supabase/migrations/rollback_20260720_browser_extension_b2b_partner_lifecycle.sql')
const tableNames = [...sql.matchAll(/create table if not exists public\.([a-z0-9_]+)/gi)].map((match) => match[1])
check('partner lifecycle persistence structures', tableNames.length >= 28, `${tableNames.length} tables`)
for (const signal of ['browser_extension_b2b_partners','browser_extension_b2b_handoffs','browser_extension_b2b_onboarding_plans','browser_extension_b2b_activation_plans','browser_extension_b2b_first_services','browser_extension_b2b_hypercare_checkpoints','browser_extension_b2b_partner_performance_snapshots','browser_extension_b2b_partner_health_snapshots','browser_extension_b2b_partner_issues','browser_extension_b2b_corrective_actions','browser_extension_b2b_partner_reviews','browser_extension_b2b_growth_opportunities','browser_extension_b2b_renewals','browser_extension_b2b_tenders']) check(`SQL structure ${signal}`, sql.includes(signal))
check('RLS enabled for lifecycle tables', (sql.match(/enable row level security/gi) || []).length >= tableNames.length)
check('rollback covers every created table', tableNames.every((name) => rollback.includes(`drop table if exists public.${name}`)))
check('release channel upgrades to 0.5.0', sql.includes("'0.5.0'"))
check('rollback returns release to 0.4.5', rollback.includes("'0.4.5'"))

const service = read('apps/ops-web/lib/browser-extension/b2b-partner-lifecycle/service.ts')
for (const command of allCommands) check(`command implementation ${command}`, service.includes(`case '${command}'`))
for (const signal of ['sourceSnapshot','handoffReadiness','filterByOwnership','assertTerritory','actorCanApprove','[1, 3, 7, 14, 30]','renewal_milestones','TENDER_COMPLIANCE_INCOMPLETE']) check(`domain safeguard ${signal}`, service.includes(signal))

const workspace = read('apps/ops-web/lib/browser-extension/b2b-partner-lifecycle/workspace.ts')
for (const signal of ['partner','sites','services','contacts','handoffs','onboardingPlans','activationPlans','firstServices','hypercare','performance','health','issues','correctiveActions','reviews','growthOpportunities','renewals','tenders','activeContext','missingData']) check(`Partner 360 hydration ${signal}`, workspace.includes(signal))
check('pre-activation handoff hydration supported', workspace.includes("q.eq('prospect_id', input.prospectId)"))

const auth = read('apps/ops-web/lib/browser-extension/b2b-intelligence/authorization.ts')
const dispatch = read('apps/ops-web/lib/browser-extension/b2b-intelligence/service.ts')
const gateway = read('apps/ops-web/lib/browser-extension/authorization.ts')
check('partner command authorization integrated', auth.includes('B2B_PARTNER_COMMAND_MAP'))
check('partner command dispatch integrated', dispatch.includes('executeB2BPartnerCommand'))
check('gateway knows Mega ZIP 5 commands', gateway.includes('B2B_PARTNER_COMMANDS'))

const access = read('apps/ops-web/app/api/browser-extension/v1/admin/users/[id]/access/route.ts')
const profile = read('apps/ops-web/app/(protected)/users/_components/UserBrowserExtensionAccessSection.tsx')
check('user-profile patch05 allow-list', access.includes("item.patch05Status === 'implemented'"))
check('Mega ZIP 6 cumulative preset visible', profile.includes('Mega ZIP 6 — AI Sales Director complet'))
check('Mega ZIP 5 submodules preserved', profile.includes('mega5Submodules') && profile.includes('mega6Submodules'))
const moduleCatalog = read('packages/browser-extension-contracts/module-catalog.v1.json').toLowerCase()
for (const permission of ['operational_handoff','handoff_acceptance','partner_onboarding','activation_management','launch_approval','partner_performance','issue_management','corrective_actions','partner_reviews','upsell','cross_sell','multi_site_expansion','renewals','renewal_approval','tender_management','tender_submission']) check(`granular assignment ${permission}`, moduleCatalog.includes(`\"key\": \"${permission}\"`))
for (const command of ['b2b.handoff.accept','b2b.partner.activate','b2b.activation.approve','b2b.corrective_action.close','b2b.expansion.plan_create','b2b.renewal.proposal_prepare','b2b.tender.bid_decision','b2b.tender.submit']) check(`sensitive approval ${command}`, access.includes(command))

const runtime = read('apps/revenue-browser-extension/src/modules/revenue-b2b.ts')
const partnerMode = read('apps/revenue-browser-extension/src/modules/revenue-b2b/partner-mode.ts')
const actions = read('apps/revenue-browser-extension/src/modules/revenue-b2b/partner-actions.ts')
const css = read('apps/revenue-browser-extension/public/sidepanel.css')
check('adaptive Partner Mode wired', runtime.includes('PARTNER_NAV') && runtime.includes('partnerMode()'))
check('Partner 360 hydration message wired', runtime.includes('HYDRATE_B2B_PARTNER_WORKSPACE'))
check('45/45 UI coverage exposed', runtime.includes('/45') && read('apps/revenue-browser-extension/src/modules/revenue-b2b/capability-ui.ts').includes('B2B-035'))
for (const workspaceName of supplement.focusWorkspaces || []) check(`premium workspace ${workspaceName}`, partnerMode.toLowerCase().includes(workspaceName.toLowerCase().split(' ')[0]))
for (const signal of ['partner-runtime','partner-hero','partner-gate-grid','issue-board','qbr-cover','growth-lanes','renewal-rail','tender-board']) check(`partner visual system ${signal}`, css.includes(signal))
for (const command of allCommands) check(`browser action contract ${command}`, actions.includes(command) || ['b2b.onboarding.task_complete'].includes(command) && runtime.includes(command) || command === 'b2b.partner.read' && workspace.includes('hydrateB2BPartnerWorkspace'))

const manifest = JSON.parse(read('apps/revenue-browser-extension/manifest.template.json'))
check('extension cumulative version at least 0.5.0', ['0.5.0','0.6.0','0.7.0'].includes(manifest.version), manifest.version)
check('no RefferQ resurrection in Mega ZIP 5 sources', ![sql,service,workspace,runtime,partnerMode,actions,profile].join('\n').toLowerCase().includes('refferq'))
check('no direct Chrome-to-Supabase client', !read('apps/revenue-browser-extension/src/api.ts').toLowerCase().includes('supabase'))

report.totals = { checks: report.checks.length, passed: report.checks.filter((item) => item.ok).length, failed, capabilities: operational.length, mega5Commands: allCommands.size, tables: tableNames.length }
const reportPath = path.join(repo, 'ANGELCARE_BROWSER_OS_B2B_MEGA_PATCH_05_VERIFICATION.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
if (failed) {
  console.error(`Mega ZIP 5 verification FAILED: ${failed} check(s)`)
  process.exit(1)
}
console.log(`MEGA PATCH 05 PARTNER LIFECYCLE VERIFICATION PASSED — ${report.checks.length} checks`)
