import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase1e_production_policy_enforcement.sql',
  'lib/ac360/policy-enforcement.ts',
  'hooks/useAc360BlockedAction.ts',
  'app/(protected)/angelcare-360/policy-lock/page.tsx',
  'app/api/ac360/policy-center/route.ts',
  'app/api/ac360/policy/preflight/route.ts',
  'app/api/ac360/policy/override/route.ts',
  'app/api/ac360/policy/events/route.ts',
  'app/api/ac360/route-coverage/scan/route.ts',
]

const requiredSqlTokens = [
  'ac360_policy_locks',
  'ac360_policy_override_requests',
  'ac360_policy_events',
  'ac360_route_coverage_audits',
  'ac360_blocked_action_messages',
  'ac360_resolve_policy_safety',
  'ac360_request_policy_override',
  'ac360_decide_policy_override',
  'ac360_reconcile_policy_safety',
  'ac360_policy_safety_dashboard',
  'phase1e.policy.fail_closed',
  'phase1e.policy.override_control',
  'phase1e.policy.route_coverage',
  'phase1e.policy.audit_visibility',
]

const requiredLibTokens = [
  'AC360_PHASE1E_POLICY_DOCTRINE',
  'AC360_PHASE1E_ROUTE_COVERAGE',
  'resolveAc360PolicySafety',
  'recordAc360PolicyEvent',
  'requestAc360PolicyOverride',
  'decideAc360PolicyOverride',
  'scanAc360RouteCoverage',
  'reconcileAc360PolicySafety',
  'getAc360PolicyCenter',
  'buildAc360BlockedActionUx',
]

const requiredWiringTokens = [
  'resolveAc360PolicySafety',
  'recordAc360PolicyEvent',
  'ac360PolicyToGuardResult',
  'ac360.policy.preflight',
  'ac360.policy.override.request',
  'ac360.policy.override.decide',
  'ac360.policy.events.record',
  'ac360.policy.reconcile',
  'ac360.route_coverage.scan',
  'phase_1e_policy_enforcement_preflight',
  'phase_1e_policy_locked_action_wiring',
]

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`)
    process.exit(1)
  }
}

for (const file of requiredFiles) assert(existsSync(file), `Missing required Phase 1E file: ${file}`)

const sql = readFileSync(requiredFiles[0], 'utf8')
for (const token of requiredSqlTokens) assert(sql.includes(token), `Migration missing token: ${token}`)

const lib = readFileSync('lib/ac360/policy-enforcement.ts', 'utf8')
for (const token of requiredLibTokens) assert(lib.includes(token), `Policy library missing token: ${token}`)

const wiring = readFileSync('lib/ac360/action-wiring.ts', 'utf8')
for (const token of requiredWiringTokens) assert(wiring.includes(token), `Action wiring missing Phase 1E token: ${token}`)

const guardCheck = readFileSync('app/api/ac360/guard/check/route.ts', 'utf8')
assert(guardCheck.includes('resolveAc360PolicySafety'), 'Guard check route is not Phase 1E policy preflighted')

const guardExecute = readFileSync('app/api/ac360/guard/execute/route.ts', 'utf8')
assert(guardExecute.includes('resolveAc360PolicySafety'), 'Guard execute route is not Phase 1E policy preflighted')

const page = readFileSync('app/(protected)/angelcare-360/policy-lock/page.tsx', 'utf8')
assert(page.includes('AngelCare 360 Policy Lock'), 'Policy lock page title missing')
assert(page.includes('Phase 1E'), 'Policy lock page does not expose Phase 1E label')

console.log('✅ AC360 Phase 1E production policy enforcement verification passed.')
