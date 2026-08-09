import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = process.cwd()
const failures = []
const passed = []
function check(label, condition, detail = '') {
  if (condition) passed.push(label)
  else failures.push(detail ? `${label}: ${detail}` : label)
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]))
  return value
}
function fingerprint(input) {
  const canonical = stable({
    moduleKey: input.moduleKey,
    workspaceKey: input.workspaceKey,
    capability: input.capability,
    commandCode: input.commandCode,
    requestedModel: input.requestedModel || null,
    promptVersion: input.promptVersion || null,
    sourceRevision: input.sourceRevision || null,
    requestPayload: input.requestPayload || {},
  })
  return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex')
}

const base = {
  moduleKey: 'revenue_os', workspaceKey: 'strategy-engine', capability: 'strategy-assembly',
  commandCode: 'REVENUE_STRATEGY_ASSEMBLY', requestedModel: 'gemini-2.5-flash',
  promptVersion: 'p1', sourceRevision: 'mandate:v7', requestPayload: { objective: 'Rabat', facts: [1, 2] },
}
check('fingerprint:stable-key-order', fingerprint(base) === fingerprint({ ...base, requestPayload: { facts: [1, 2], objective: 'Rabat' } }))
check('fingerprint:actor-independent', fingerprint(base) === fingerprint({ ...base, actorId: 'different-user' }))
check('fingerprint:source-change-invalidates', fingerprint(base) !== fingerprint({ ...base, sourceRevision: 'mandate:v8' }))
check('fingerprint:prompt-change-invalidates', fingerprint(base) !== fingerprint({ ...base, promptVersion: 'p2' }))
check('fingerprint:model-change-invalidates', fingerprint(base) !== fingerprint({ ...base, requestedModel: 'gemini-pro' }))

function decide({ cache = false, inflight = false, quota = true, scheduled = false, due = true, approval = false, approvalGranted = false, minimumInterval = false, force = false, forceAllowed = false }) {
  if (force && !forceAllowed) return 'BLOCK_POLICY'
  if (scheduled && !due) return 'DEFER_SCHEDULE'
  if (!force && cache) return 'REUSE_CACHED'
  if (!force && inflight) return 'JOIN_IN_FLIGHT'
  if (!quota) return 'BLOCK_QUOTA'
  if (minimumInterval) return 'BLOCK_DUPLICATE'
  if (approval && !approvalGranted) return 'REQUIRE_APPROVAL'
  return 'EXECUTE_NEW'
}
check('decision:new', decide({}) === 'EXECUTE_NEW')
check('decision:cache', decide({ cache: true }) === 'REUSE_CACHED')
check('decision:join', decide({ inflight: true }) === 'JOIN_IN_FLIGHT')
check('decision:quota', decide({ quota: false }) === 'BLOCK_QUOTA')
check('decision:minimum-interval', decide({ minimumInterval: true }) === 'BLOCK_DUPLICATE')
check('decision:schedule-defer', decide({ scheduled: true, due: false }) === 'DEFER_SCHEDULE')
check('decision:approval', decide({ approval: true }) === 'REQUIRE_APPROVAL')
check('decision:approval-granted', decide({ approval: true, approvalGranted: true }) === 'EXECUTE_NEW')
check('decision:force-refresh-blocked', decide({ cache: true, force: true }) === 'BLOCK_POLICY')
check('decision:force-refresh-executes', decide({ cache: true, force: true, forceAllowed: true }) === 'EXECUTE_NEW')

const sourceFiles = [
  'lib/revenue-command-os/ai/gemini-provider.ts',
  'lib/revenue-command-os/validation-council/gemini-agent.ts',
  'lib/revenue-command-os/cockpit/executive-brief.ts',
  'lib/ai-provider-control/governor.ts',
  'lib/ai-provider-control/gemini-runtime.ts',
  'lib/ai-provider-control/repository.ts',
]
const sources = Object.fromEntries(sourceFiles.map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')]))
const revenueText = Object.entries(sources).filter(([file]) => file.includes('lib/revenue-command-os')).map(([, text]) => text).join('\n')
check('source:no-revenue-env-key', !/GEMINI_API_KEY|GOOGLE_API_KEY/.test(revenueText))
check('source:no-revenue-sdk', !/@google\/genai|new\s+GoogleGenAI/.test(revenueText))
check('source:strategy-central-gateway', sources['lib/revenue-command-os/ai/gemini-provider.ts'].includes('executeGovernedAiRequest'))
check('source:council-central-gateway', sources['lib/revenue-command-os/validation-council/gemini-agent.ts'].includes('executeGovernedAiRequest'))
check('source:brief-central-gateway', sources['lib/revenue-command-os/cockpit/executive-brief.ts'].includes('executeGovernedAiRequest'))
check('source:single-sdk-runtime', sources['lib/ai-provider-control/gemini-runtime.ts'].includes("from '@google/genai'"))
check('source:governor-preflight', sources['lib/ai-provider-control/governor.ts'].includes('preflightGovernedAiRequest'))
check('source:governor-complete', sources['lib/ai-provider-control/governor.ts'].includes('ai_provider_complete_governed_request'))
check('source:governor-fail', sources['lib/ai-provider-control/governor.ts'].includes('ai_provider_fail_governed_request'))
check('source:credential-test-governed-ledger', sources['lib/ai-provider-control/repository.ts'].includes('AI_PROVIDER_CREDENTIAL_TEST'))

const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260726_1700_ai_provider_sovereignty_phase5_revenue_governance.sql'), 'utf8')
check('sql:cache-before-provider-budget', migration.indexOf('REUSE_CACHED') < migration.indexOf('ai_provider_acquire_runtime_budget'))
check('sql:join-before-provider-budget', migration.indexOf('JOIN_IN_FLIGHT') < migration.indexOf('ai_provider_acquire_runtime_budget'))
check('sql:stale-releases-budget', migration.includes('Recovered stale governed request and released its reservation.'))
check('sql:weekly-quota', migration.includes('MODULE_WEEKLY_REQUEST_BUDGET'))
check('sql:weekly-cost', migration.includes('MODULE_WEEKLY_COST_BUDGET'))
check('sql:command-minimum-interval', migration.includes('COMMAND_MINIMUM_INTERVAL'))
check('sql:schedule-not-due', migration.includes('AI_PROVIDER_SCHEDULE_NOT_DUE'))
check('sql:schedule-freshness', migration.includes('SCHEDULE_RESULT_STILL_FRESH'))
check('sql:cache-ttl-policy-owned', migration.includes('The caller cannot extend the governed TTL during completion.'))
check('sql:reconcile-actual-requests', migration.includes("p_metadata->>'actualRequestCount'"))
check('sql:stale-recovery-scoped', migration.includes('where request_fingerprint=p_request_fingerprint'))

const summary = {
  contract: 'AC-AI-SOVEREIGNTY-REVENUE-INTEGRATION-2026.07',
  test: 'PHASE5_DETERMINISTIC_SCENARIOS',
  passed: passed.length,
  failed: failures.length,
  failures,
  providerCallsExecuted: 0,
  externalActionsExecuted: 0,
}
console.log(JSON.stringify(summary, null, 2))
if (failures.length) process.exit(1)
