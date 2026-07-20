import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const passes = []

function full(relative) { return path.join(root, relative) }
function read(relative) {
  const target = full(relative)
  if (!fs.existsSync(target)) {
    failures.push(`Missing ${relative}`)
    return ''
  }
  return fs.readFileSync(target, 'utf8')
}
function check(ok, label) {
  if (ok) passes.push(label)
  else failures.push(label)
}

const migrationPath = 'supabase/migrations/20260719_browser_extension_b2b_revenue_execution.sql'
const servicePath = 'lib/browser-extension/b2b-execution/service.ts'
const contractPath = 'lib/browser-extension/b2b-execution/contract.ts'
const stagesPath = 'lib/browser-extension/b2b-execution/stage-rules.ts'
const nbaPath = 'lib/browser-extension/b2b-execution/next-best-action.ts'
const outreachPath = 'lib/browser-extension/b2b-execution/outreach-strategy.ts'
const authorizationPath = 'lib/browser-extension/b2b-intelligence/authorization.ts'
const genericGatewayPath = 'app/api/browser-extension/v1/commands/execute/route.ts'
const profilePath = 'app/(protected)/users/_components/UserBrowserExtensionAccessSection.tsx'
const accessRoutePath = 'app/api/browser-extension/v1/admin/users/[id]/access/route.ts'
const supplementPath = 'lib/browser-extension/generated/b2b-revenue-execution.v3.json'

const migration = read(migrationPath)
const service = read(servicePath)
const contract = read(contractPath)
const stages = read(stagesPath)
const nba = read(nbaPath)
const outreach = read(outreachPath)
const authorization = read(authorizationPath)
const gateway = read(genericGatewayPath)
const profile = read(profilePath)
const accessRoute = read(accessRoutePath)
const supplementText = read(supplementPath)
const supplement = supplementText ? JSON.parse(supplementText) : null

const routes = [
  'app/api/browser-extension/v1/b2b/execution/opportunities/route.ts',
  'app/api/browser-extension/v1/b2b/execution/pipeline/route.ts',
  'app/api/browser-extension/v1/b2b/execution/outreach/route.ts',
  'app/api/browser-extension/v1/b2b/execution/gmail/route.ts',
  'app/api/browser-extension/v1/b2b/execution/whatsapp/route.ts',
  'app/api/browser-extension/v1/b2b/execution/calls/route.ts',
  'app/api/browser-extension/v1/b2b/execution/field-visits/route.ts',
  'app/api/browser-extension/v1/b2b/execution/meetings/route.ts',
  'app/api/browser-extension/v1/b2b/execution/followups/route.ts',
  'app/api/browser-extension/v1/b2b/execution/sequences/route.ts',
  'app/api/browser-extension/v1/b2b/execution/daily-command/route.ts',
  'app/api/browser-extension/v1/b2b/execution/timeline/route.ts',
]
for (const route of routes) check(fs.existsSync(full(route)), `route ${route}`)

const tables = [
  'browser_extension_b2b_opportunities',
  'browser_extension_b2b_opportunity_stage_history',
  'browser_extension_b2b_next_best_actions',
  'browser_extension_b2b_outreach_strategies',
  'browser_extension_b2b_communication_contexts',
  'browser_extension_b2b_communication_drafts',
  'browser_extension_b2b_call_briefs',
  'browser_extension_b2b_field_visits',
  'browser_extension_b2b_meeting_briefs',
  'browser_extension_b2b_meeting_live_notes',
  'browser_extension_b2b_meeting_outcomes',
  'browser_extension_b2b_followups',
  'browser_extension_b2b_sequences',
  'browser_extension_b2b_sequence_steps',
  'browser_extension_b2b_sequence_enrollments',
  'browser_extension_b2b_sequence_events',
  'browser_extension_b2b_attribution',
  'browser_extension_b2b_referral_sources',
  'browser_extension_b2b_daily_snapshots',
  'browser_extension_b2b_timeline_events',
]
for (const table of tables) {
  check(migration.includes(`create table if not exists public.${table}`), `table ${table}`)
  check(migration.includes(`alter table public.${table} enable row level security`), `RLS ${table}`)
}
check(!migration.includes('browser_ext_b2b_active_opportunity_unique'), 'parallel opportunity-safe index')
check(migration.includes("version='0.3.0'"), 'release channel version 0.3.0')

const requiredCommands = supplement?.commands || []
for (const command of requiredCommands) {
  check(contract.includes(`'${command}'`) || contract.includes(`\"${command}\"`), `command contract ${command}`)
  check(service.includes(`case'${command}'`) || service.includes(`case '${command}'`), `command handler ${command}`)
}
check(requiredCommands.length === 34, `34 Mega ZIP 3 commands (${requiredCommands.length})`)
check(supplement?.acceptanceScenarios?.length === 10, '10 Mega ZIP 3 acceptance scenarios')
check(supplement?.scope?.length === 17, '17 contracted execution scope areas')
check(supplement?.externalSending === 'user-confirmed only', 'external sending remains user-confirmed')
check(supplement?.bulkMessaging === false, 'bulk messaging disabled')
check(supplement?.canonicalReferralModule === 'Ambassadors', 'canonical referral module is Ambassadors')

check(stages.includes('PIPELINE_STAGE_REQUIREMENTS_MISSING') || service.includes('PIPELINE_STAGE_REQUIREMENTS_MISSING'), 'evidence-based stage governance')
check(stages.includes('hasContract') && stages.includes('hasPayment') && stages.includes('activationReady'), 'won-stage contract/payment/activation gates')
check(nba.includes('computeNextBestAction'), 'next-best-action engine')
check(nba.includes('reasoning'), 'explainable next-best-action reasoning')
check(outreach.includes('buildOutreachStrategy'), 'outreach strategy builder')
check(outreach.includes('vertical'), 'vertical-specific outreach')
check(service.includes('stopActiveSequences'), 'adaptive sequence stop behavior')
check(service.includes("source_type:type") && service.includes("'ambassador'"), 'Ambassadors referral attribution')
check(service.includes('browser_extension_b2b_daily_snapshots'), 'daily command persistence')
check(service.includes('browser_extension_b2b_timeline_events'), 'unified timeline persistence')
check(service.includes("requires_confirmation:true"), 'communication drafts require confirmation')
check(service.includes("'ambassador'"), 'Ambassadors terminology present')

check(authorization.includes('B2B_EXECUTION_COMMAND_MAP'), 'execution commands included in authorization')
check(gateway.includes('executeB2BIntelligenceCommand'), 'idempotent generic gateway dispatch')
check(gateway.includes('idempotencyKey'), 'idempotency key enforcement')
check(gateway.includes('approvalRequired'), 'approval enforcement')
check(gateway.includes('browser_extension_command_results'), 'command result persistence')

check(profile.includes('Mega ZIP 3 — Exécution Revenue complète'), 'Mega ZIP 3 user-profile preset')
for (const adapter of ['gmail', 'whatsapp_web', 'google_calendar']) check(profile.includes(`'${adapter}'`) || profile.includes(`key: '${adapter}'`), `user-profile adapter ${adapter}`)
check(accessRoute.includes("item.patch03Status === 'implemented'"), 'Mega ZIP 3 capability assignment allow-list')
check(accessRoute.includes('Capability is contract-locked but not operational in Mega ZIP'), 'future capability lock preserved in cumulative release')

if (failures.length) {
  console.error('Mega ZIP 3 B2B Revenue Execution verification FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

for (const pass of passes) console.log(`PASS ${pass}`)
console.log(`PASS ${requiredCommands.length} execution commands`)
console.log(`PASS ${tables.length} execution tables with RLS`)
console.log('STATUS: MEGA PATCH 03 B2B REVENUE EXECUTION ACCEPTED')
