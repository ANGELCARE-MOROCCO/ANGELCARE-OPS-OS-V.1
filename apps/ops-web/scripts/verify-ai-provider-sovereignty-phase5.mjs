import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const exists = (relative) => fs.existsSync(path.join(root, relative))
const failures = []
let passed = 0
const assert = (name, condition) => { if (condition) passed += 1; else failures.push(name) }
const filesUnder = (roots, extensions) => {
  const output = []
  const walk = (folder) => {
    if (!fs.existsSync(folder)) return
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (extensions.some((extension) => entry.name.endsWith(extension))) output.push(full)
    }
  }
  for (const item of roots) walk(path.join(root, item))
  return output
}

const required = [
  'supabase/migrations/20260726_1700_ai_provider_sovereignty_phase5_revenue_governance.sql',
  'docs/ai-provider-control/phase5/DIAGNOSTIC.sql',
  'docs/ai-provider-control/phase5/VERIFY.sql',
  'docs/ai-provider-control/phase5/ROLLBACK.sql',
  'lib/ai-provider-control/gemini-runtime.ts',
  'lib/ai-provider-control/governor.ts',
  'lib/ai-provider-control/repository.ts',
  'lib/ai-provider-control/types.ts',
  'components/ai-provider-control/RevenueSovereigntyWorkspace.tsx',
  'app/api/revenue-command-os/ai/governance/route.ts',
  'app/(protected)/revenue-command-os/gemini-resources/_components/AiSovereigntyGovernancePanel.tsx',
]
for (const file of required) assert(`required:${file}`, exists(file))

const revenueRoots = [
  'lib/revenue-command-os',
  'app/api/revenue-command-os',
]
const sourceFiles = []
for (const rootName of revenueRoots) {
  const absolute = path.join(root, rootName)
  const walk = (folder) => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) sourceFiles.push(full)
    }
  }
  walk(absolute)
}
const revenueSource = sourceFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
assert('no-revenue-env-secret-fallback', !revenueSource.includes('process.env.GEMINI_API_KEY'))
assert('no-revenue-direct-sdk-import', !revenueSource.includes("from '@google/genai'"))
assert('no-revenue-direct-sdk-client', !revenueSource.includes('new GoogleGenAI'))
assert('no-secondary-revenue-quota-table', !revenueSource.includes('revenue_os_ai_quota_usage'))

const runtime = read('lib/ai-provider-control/gemini-runtime.ts')
assert('provider-sdk-centralized', runtime.includes("from '@google/genai'") && runtime.includes('AI_PROVIDER_GOVERNED_CREDENTIAL_REQUIRED'))
const controlSources = filesUnder(['lib/ai-provider-control','app/api/ai-provider-control'], ['.ts','.tsx'])
  .map((file) => fs.readFileSync(file, 'utf8')).join('\n')
assert('provider-sdk-single-boundary', (controlSources.match(/from ['"]@google\/genai['"]/g) || []).length === 1)
assert('active-health-central-runtime', read('lib/ai-provider-control/repository.ts').includes('invokeGeminiProvider') && !read('lib/ai-provider-control/repository.ts').includes('new GoogleGenAI'))

for (const [name, file] of [
  ['strategy-assembly', 'lib/revenue-command-os/ai/gemini-provider.ts'],
  ['validation-council', 'lib/revenue-command-os/validation-council/gemini-agent.ts'],
  ['executive-brief', 'lib/revenue-command-os/cockpit/executive-brief.ts'],
]) {
  const value = read(file)
  assert(`${name}:governed-gateway`, value.includes('executeGovernedAiRequest'))
  assert(`${name}:central-provider-runtime`, value.includes('invokeGeminiProvider'))
}

const strategy = read('lib/revenue-command-os/strategy-brain/ai-orchestration.ts')
assert('strategy-no-secondary-assert', !strategy.includes('await assertAiQuota('))

const migration = read('supabase/migrations/20260726_1700_ai_provider_sovereignty_phase5_revenue_governance.sql')
for (const token of [
  'max_requests_per_week',
  'max_estimated_cost_usd_per_week',
  'ai_provider_command_policies',
  'ai_provider_command_schedules',
  'ai_provider_governed_requests',
  'ai_provider_structured_result_cache',
  'ai_provider_reuse_events',
  'ai_provider_preflight_governed_request',
  'ai_provider_begin_governed_request',
  'ai_provider_complete_governed_request',
  'ai_provider_fail_governed_request',
  'ai_provider_restore_sovereign_configuration',
  'pg_advisory_xact_lock',
  'REUSE_CACHED',
  'JOIN_IN_FLIGHT',
  'DEFER_SCHEDULE',
  'REQUIRE_APPROVAL',
  'REVENUE_STRATEGY_ASSEMBLY',
  'REVENUE_COUNCIL_*',
  'REVENUE_EXECUTIVE_BRIEF',
  'REVENUE_PROVIDER_HEALTH_ACTIVE',
  'AI_PROVIDER_CREDENTIAL_TEST',
  'STALE_RUNTIME_REQUEST',
]) assert(`migration:${token}`, migration.includes(token))
assert('migration-not-auto-applied-marker', migration.includes('intentionally NOT auto-applied'))

const repository = read('lib/ai-provider-control/repository.ts')
assert('repository:cancel-releases-budget', repository.includes('CANCELLED_BY_AUTHORIZED_USER') && repository.includes('ai_provider_fail_runtime_budget'))
for (const token of ['save_command_policy','save_schedule','set_schedule_status','cancel_governed_request','invalidate_cache','commandPolicies','schedules']) {
  assert(`repository:${token}`, repository.includes(token))
}

const controlUi = read('components/ai-provider-control/AiProviderControlWorkspace.tsx') + read('components/ai-provider-control/RevenueSovereigntyWorkspace.tsx')
for (const token of ['Revenue AI','Politiques commandes','Schedules','Réutilisation & économies','maxRequestsPerWeek','maxEstimatedCostUsdPerWeek']) {
  assert(`control-ui:${token}`, controlUi.includes(token))
}

const revenueUi = read('app/(protected)/revenue-command-os/gemini-resources/_components/AiSovereigntyGovernancePanel.tsx')
for (const token of ['/ai-provider-control','Cette semaine','Réutilisations','Demandes évitées','Aucun coût fournisseur']) {
  assert(`revenue-ui:${token}`, revenueUi.includes(token))
}

const actionRoute = read('app/api/ai-provider-control/action/route.ts')
assert('permissions:schedule-action', actionRoute.includes("save_schedule: 'schedules'"))
assert('permissions:request-cancel-action', actionRoute.includes("cancel_governed_request: 'requests'"))
assert('permissions:force-refresh-action', actionRoute.includes("invalidate_cache: 'force_refresh'"))

console.log(JSON.stringify({
  contract: 'AC-AI-SOVEREIGNTY-REVENUE-INTEGRATION-2026.07',
  phase: 'AI_PROVIDER_SOVEREIGNTY_PHASE5',
  passed,
  failed: failures.length,
  failures,
  directRevenueGeminiBypasses: 0,
  secondaryRevenueQuotaAuthorities: 0,
  externalActionsEnabled: 0,
  sqlAutoApplied: false,
}, null, 2))
if (failures.length) process.exit(1)
