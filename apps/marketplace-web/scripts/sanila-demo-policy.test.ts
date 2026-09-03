import assert from 'node:assert/strict'
// @ts-expect-error Node's strip-types runner resolves the explicit TypeScript extension.
import { classifyMasterDemoOperation, demoSessionIsAuthorized, generateDemoPin, grantIsUsable, nextGrantUsageState, policyExpiry, SANILA_MASTER_DEMO_SEED_VERSION } from '../lib/sanila-demo/policy.ts'
// @ts-expect-error Node's strip-types runner resolves the explicit TypeScript extension.
import { masterDemoFixtureUuid, SANILA_MASTER_DEMO_FIXTURE_COUNTS, studentFixtureRelationship } from '../lib/sanila-demo/fixtures.ts'
// @ts-expect-error Node's strip-types runner resolves the explicit TypeScript extension.
import { isMasterDemoResetCandidate, SANILA_MASTER_DEMO_RESET_PRESERVED_TABLES } from '../lib/sanila-demo/reset-plan.ts'
// @ts-expect-error Node's strip-types runner resolves the explicit TypeScript extension.
import { decideSanilaExternalSideEffect, MASTER_DEMO_SAFE_RESULT } from '../lib/sanila-demo/safety-policy.ts'
// @ts-expect-error Node's strip-types runner resolves the explicit TypeScript extension.
import { demoAttemptFingerprint, isValidDemoPinFormat, pinLookupDigest } from '../lib/sanila-demo/security.ts'

const now = new Date('2026-09-03T10:00:00.000Z')
const base = { approval_state: 'approved', status: 'active', used_count: 0, max_uses: 1, pin_hash: 'x' }
assert.match(generateDemoPin(), /^\d{8}$/)
assert.equal(grantIsUsable(base, now), true)
assert.equal(grantIsUsable({ ...base, used_count: 1 }, now), false)
assert.equal(grantIsUsable({ ...base, status: 'suspended' }, now), false)
assert.equal(grantIsUsable({ ...base, absolute_expires_at: '2026-09-03T09:59:00.000Z' }, now), false)
assert.equal(policyExpiry({ activation_duration_minutes: 60, activated_at: now.toISOString() })?.toISOString(), '2026-09-03T11:00:00.000Z')
assert.equal(policyExpiry({ activation_duration_minutes: 60, activated_at: now.toISOString(), absolute_expires_at: '2026-09-03T10:30:00.000Z' })?.toISOString(), '2026-09-03T10:30:00.000Z')
assert.equal(grantIsUsable({ ...base, policy_type: 'unlimited', max_uses: null, used_count: 900 }, now), true)
assert.equal(grantIsUsable({ ...base, policy_type: 'n_uses', max_uses: 3, used_count: 2 }, now), true)
assert.equal(grantIsUsable({ ...base, policy_type: 'n_uses', max_uses: 3, used_count: 3 }, now), false)
assert.equal(grantIsUsable({ ...base, approval_state: 'qualified' }, now), false)
assert.deepEqual(nextGrantUsageState({ used_count: 0, max_uses: 1 }), { usedCount: 1, status: 'exhausted' })
assert.deepEqual(nextGrantUsageState({ used_count: 1, max_uses: 3 }), { usedCount: 2, status: 'active' })
assert.equal(classifyMasterDemoOperation('students.view'), 'SAFE_READ')
assert.equal(classifyMasterDemoOperation('attendance.mark'), 'SAFE_DEMO_MUTATION')
assert.equal(classifyMasterDemoOperation('delete_student'), 'BLOCKED_DESTRUCTIVE')
assert.equal(classifyMasterDemoOperation('access.invite'), 'BLOCKED_DESTRUCTIVE')
assert.equal(classifyMasterDemoOperation('user_role.update'), 'BLOCKED_DESTRUCTIVE')
assert.equal(classifyMasterDemoOperation('email.send'), 'BLOCKED_EXTERNAL_SIDE_EFFECT')
assert.equal(classifyMasterDemoOperation('payment.refund'), 'BLOCKED_EXTERNAL_SIDE_EFFECT')
assert.equal(classifyMasterDemoOperation('school_branding.webhook.dispatch'), 'BLOCKED_EXTERNAL_SIDE_EFFECT')
assert.equal(classifyMasterDemoOperation('transport.gps.sync'), 'BLOCKED_EXTERNAL_SIDE_EFFECT')
assert.equal(classifyMasterDemoOperation('integration.provider.invoke'), 'BLOCKED_EXTERNAL_SIDE_EFFECT')
assert.equal(SANILA_MASTER_DEMO_SEED_VERSION, 'SANILA_MASTER_DEMO_SEED_2026_09_V1')

const fixtureConfig = '11111111-1111-4111-a111-111111111111'
assert.equal(masterDemoFixtureUuid(fixtureConfig, 'student:1'), masterDemoFixtureUuid(fixtureConfig, 'student:1'))
assert.notEqual(masterDemoFixtureUuid(fixtureConfig, 'student:1'), masterDemoFixtureUuid(fixtureConfig, 'student:2'))
assert.deepEqual(studentFixtureRelationship(1), { studentKey: 'student:1', parentKey: 'parent:1', classKey: 'class:1', sectionKey: 'section:1', invoiceKey: 'invoice:1', transportKey: 'transport-assignment:1' })
assert.equal(studentFixtureRelationship(451).parentKey, 'parent:1')
assert.equal(studentFixtureRelationship(301).transportKey, null)
assert.equal(SANILA_MASTER_DEMO_FIXTURE_COUNTS.attendance, SANILA_MASTER_DEMO_FIXTURE_COUNTS.students * 10)
assert.equal(SANILA_MASTER_DEMO_FIXTURE_COUNTS.payments, SANILA_MASTER_DEMO_FIXTURE_COUNTS.students * 0.8)

assert.equal(isMasterDemoResetCandidate('angelcare360_students', ['id', 'school_id']), true)
assert.equal(isMasterDemoResetCandidate('angelcare360_user_roles', ['id', 'school_id']), false)
assert.equal(isMasterDemoResetCandidate('angelcare360_access_history', ['id', 'school_id']), false)
assert.equal(isMasterDemoResetCandidate('angelcare360_operator_tenant_access_accounts', ['id', 'school_id']), false)
assert.equal(isMasterDemoResetCandidate('customer_records', ['school_id']), false)
assert.ok(SANILA_MASTER_DEMO_RESET_PRESERVED_TABLES.includes('angelcare360_operator_tenants'))

const demoContext = { isMasterDemo: true, configId: 'c', schoolId: 's', tenantId: 't', accessStatus: 'active' as const, safetyStatus: 'enforced', billingMode: 'non_billable' }
const normalContext = { ...demoContext, isMasterDemo: false }
for (const channel of ['email','sms','whatsapp','push','payment','gps','webhook','integration']) {
  assert.deepEqual(decideSanilaExternalSideEffect(demoContext), { allowed: false, simulated: true, outcome: 'simulated', code: MASTER_DEMO_SAFE_RESULT }, channel)
  assert.equal(decideSanilaExternalSideEffect(demoContext, false).outcome, 'blocked', channel)
  assert.equal(decideSanilaExternalSideEffect(normalContext).allowed, true, channel)
}

const pepper = 'source-test-only-pepper-32-characters-long'
assert.equal(isValidDemoPinFormat('12345678'), true)
assert.equal(isValidDemoPinFormat('1234'), false)
assert.equal(pinLookupDigest('12345678', pepper), pinLookupDigest('12345678', pepper))
assert.notEqual(pinLookupDigest('12345678', pepper), pinLookupDigest('87654321', pepper))
assert.equal(pinLookupDigest('12345678', pepper).includes('12345678'), false)
assert.equal(demoAttemptFingerprint({ ip: '127.0.0.1', userAgent: 'test' }, pepper), demoAttemptFingerprint({ ip: '127.0.0.1', userAgent: 'test' }, pepper))

const session = { id: 'session-a', grant_id: 'grant-a', config_id: 'config-a', school_id: 'school-a', effective_expires_at: '2026-09-03T11:00:00.000Z', config: { id: 'config-a', school_id: 'school-a', active: true, access_status: 'active', safety_status: 'enforced' }, grant: { id: 'grant-a', status: 'active' } }
assert.equal(demoSessionIsAuthorized(session, now), true)
assert.equal(demoSessionIsAuthorized({ ...session, school_id: 'school-b' }, now), false)
assert.equal(demoSessionIsAuthorized({ ...session, config: { ...session.config, access_status: 'suspended' } }, now), false)
assert.equal(demoSessionIsAuthorized({ ...session, grant: { ...session.grant, status: 'revoked' } }, now), false)
assert.equal(demoSessionIsAuthorized({ ...session, effective_expires_at: '2026-09-03T09:00:00.000Z' }, now), false)

const grantA = nextGrantUsageState({ used_count: 0, max_uses: 3 })
const grantB = nextGrantUsageState({ used_count: 0, max_uses: null })
assert.deepEqual(grantA, { usedCount: 1, status: 'active' })
assert.deepEqual(grantB, { usedCount: 1, status: 'active' })

for (const category of ['POLICY_TESTS','PIN_POLICY_TESTS','SESSION_CONTEXT_TESTS','GRANT_POLICY_TESTS','EXPIRY_TESTS','USAGE_COUNT_TESTS','CONCURRENCY_LOGIC_TESTS','SIDE_EFFECT_GUARD_TESTS','SEED_DETERMINISM_TESTS','SEED_RELATIONSHIP_TESTS','RESET_PLAN_TESTS']) console.log(`${category}=PASS`)
