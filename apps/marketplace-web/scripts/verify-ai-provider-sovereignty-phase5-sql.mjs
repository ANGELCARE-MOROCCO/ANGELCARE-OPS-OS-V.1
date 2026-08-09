import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const migrationPath = path.join(root, 'supabase/migrations/20260726_1700_ai_provider_sovereignty_phase5_revenue_governance.sql')
const diagnosticPath = path.join(root, 'docs/ai-provider-control/phase5/DIAGNOSTIC.sql')
const verifyPath = path.join(root, 'docs/ai-provider-control/phase5/VERIFY.sql')
const rollbackPath = path.join(root, 'docs/ai-provider-control/phase5/ROLLBACK.sql')
const failures = []
const passed = []

function expect(label, condition) {
  if (condition) passed.push(label)
  else failures.push(label)
}
function read(file) {
  expect(`file:${path.relative(root, file)}`, fs.existsSync(file))
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
}
function occurrences(text, token) {
  return text.split(token).length - 1
}

const sql = read(migrationPath)
const diagnostic = read(diagnosticPath)
const verification = read(verifyPath)
const rollback = read(rollbackPath)

expect('transaction:begin', /^\s*begin\s*;/im.test(sql))
expect('transaction:commit', /\bcommit\s*;\s*$/im.test(sql))
expect('dollar-quotes-balanced', occurrences(sql, '$$') % 2 === 0)
expect('no-auto-application-token', /intentionally NOT auto-applied/i.test(sql))
expect('no-destructive-drop-in-migration', !/^\s*drop\s+(table|column|function)/im.test(sql))

for (const table of [
  'ai_provider_command_policies',
  'ai_provider_command_schedules',
  'ai_provider_governed_requests',
  'ai_provider_structured_result_cache',
  'ai_provider_reuse_events',
  'ai_provider_policy_overrides',
]) expect(`table:${table}`, sql.includes(`create table if not exists public.${table}`))

const signatures = [
  ['preflight', 'create or replace function public.ai_provider_preflight_governed_request('],
  ['begin', 'create or replace function public.ai_provider_begin_governed_request('],
  ['complete', 'create or replace function public.ai_provider_complete_governed_request('],
  ['fail', 'create or replace function public.ai_provider_fail_governed_request('],
  ['invalidate', 'create or replace function public.ai_provider_invalidate_structured_cache('],
  ['restore', 'create or replace function public.ai_provider_restore_sovereign_configuration('],
]
for (const [label, token] of signatures) expect(`function:${label}`, occurrences(sql, token) === 1)

for (const token of [
  'max_requests_per_week',
  'max_input_tokens_per_week',
  'max_output_tokens_per_week',
  'max_total_tokens_per_week',
  'max_estimated_cost_usd_per_day',
  'max_estimated_cost_usd_per_week',
  'max_estimated_cost_usd_per_month',
  'reserved_cost_usd',
  'request_fingerprint',
  'governed_request_id',
]) expect(`column:${token}`, sql.includes(token))

for (const decision of [
  'EXECUTE_NEW', 'REUSE_CACHED', 'JOIN_IN_FLIGHT', 'BLOCK_QUOTA',
  'BLOCK_DUPLICATE', 'BLOCK_POLICY', 'DEFER_SCHEDULE', 'REQUIRE_APPROVAL',
]) expect(`decision:${decision}`, sql.includes(`'${decision}'`))

for (const command of [
  'REVENUE_STRATEGY_ASSEMBLY',
  'REVENUE_COUNCIL_*',
  'REVENUE_EXECUTIVE_BRIEF',
  'REVENUE_PROVIDER_HEALTH_ACTIVE',
  'AI_PROVIDER_CREDENTIAL_TEST',
]) expect(`seed:${command}`, sql.includes(command))

for (const token of [
  'pg_advisory_xact_lock',
  'ai_provider_one_active_fingerprint_idx',
  'STALE_RUNTIME_REQUEST',
  'ai_provider_fail_runtime_budget',
  'minimum_interval_seconds',
  'max_runs_per_week',
  'max_cost_usd_per_week',
  'cache_mode',
  'force_refresh_allowed',
  'approval_class',
  'next_run_at',
  'SCHEDULE_RESULT_STILL_FRESH',
  'effectiveCacheTtlSeconds',
]) expect(`governance:${token}`, sql.includes(token))

expect('cache-ttl-is-policy-owned', sql.includes('The caller cannot extend the governed TTL during completion.'))
expect('reconciliation-uses-actual-request-count', sql.includes("p_metadata->>'actualRequestCount'"))
expect('reconciliation-uses-actual-grounded-count', sql.includes("p_metadata->>'actualGroundedRequestCount'"))
expect('stale-recovery-fingerprint-scoped', sql.includes('where request_fingerprint=p_request_fingerprint') && sql.includes('Recovered stale governed request and released its reservation.'))

expect('reuse-module-attribution', /insert into public\.ai_provider_reuse_events\([^)]*module_key[^)]*workspace_key[^)]*command_code/is.test(sql))
expect('phase4-acquisition-used', sql.includes('public.ai_provider_acquire_runtime_budget'))
expect('phase4-reconciliation-used', sql.includes('public.ai_provider_reconcile_runtime_budget'))
expect('phase4-failure-release-used', sql.includes('public.ai_provider_fail_runtime_budget'))
expect('service-role-grants', /grant execute on function public\.ai_provider_begin_governed_request[\s\S]*service_role/i.test(sql))
expect('rls-enabled', occurrences(sql.toLowerCase(), 'enable row level security') >= 6)

expect('diagnostic-is-read-only', !/\b(insert|update|delete|alter|drop|create)\b/i.test(diagnostic.replace(/^--.*$/gm, '')))
expect('diagnostic-phase4-fail-release', diagnostic.includes('ai_provider_fail_runtime_budget'))
expect('verify-revenue-and-control-quotas', verification.includes("scope_key in ('revenue_os','ai_provider_control')"))
expect('verify-reuse-module-filter', verification.includes("where module_key='revenue_os'"))
expect('rollback-is-explicit-manual', /MANUAL destructive rollback/i.test(rollback))
expect('rollback-drops-phase5-tables', rollback.includes('drop table if exists public.ai_provider_governed_requests'))

const summary = {
  contract: 'AC-AI-SOVEREIGNTY-REVENUE-INTEGRATION-2026.07',
  verifier: 'PHASE5_SQL_STATIC_ACCEPTANCE',
  passed: passed.length,
  failed: failures.length,
  failures,
  migrationAutoApplied: false,
  destructiveStatementsInMigration: 0,
}
console.log(JSON.stringify(summary, null, 2))
if (failures.length) process.exit(1)
