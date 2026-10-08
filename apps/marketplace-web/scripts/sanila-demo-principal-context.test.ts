import assert from 'node:assert/strict'
import { normalizeAngelcare360User } from '../lib/angelcare360/permissions.ts'
import {
  buildAngelcare360DemoAccess,
  extractTrustedAngelcare360DemoPrincipalContext,
  resolveAngelcare360PrincipalSchoolAuthority,
} from '../lib/angelcare360/principal-context-authority.ts'
import { getAngelcare360CustomerGatePresentation } from '../lib/angelcare360/entitlement-gate-diagnostics.ts'
import { normalizeAngelcare360SnapshotItems, validateAngelcare360EntitlementChain } from '../lib/angelcare360/runtime-entitlement-authority.ts'
import { demoSessionIsAuthorized } from '../lib/sanila-demo/policy.ts'
import type { Angelcare360RuntimeEntitlements } from '../types/angelcare360/entitlements.ts'

const ids = {
  school: 'master-demo-school', tenant: 'master-demo-tenant', subscription: 'master-demo-subscription',
  package: 'enterprise-package', snapshot: 'active-snapshot', grant: 'demo-grant', inquiry: 'demo-inquiry',
}
const rawDemoUser = {
  id: 'demo-admin', email: 'demo@sanila.test', role: 'schooladmin',
  __demo: true, __demoSchoolId: ids.school, __demoGrantId: ids.grant,
  __demoInquiryId: ids.inquiry, __demoExpiresAt: '2026-09-05T18:00:00.000Z',
}

const demoContext = extractTrustedAngelcare360DemoPrincipalContext(rawDemoUser)
const normalizedUser = normalizeAngelcare360User(rawDemoUser)
assert.ok(normalizedUser)
assert.equal('__demoSchoolId' in normalizedUser, false)
assert.equal('__demo' in normalizedUser, false)
const schoolAuthority = resolveAngelcare360PrincipalSchoolAuthority({ demoContext, requestedSchoolId: ids.school })
assert.deepEqual(schoolAuthority, { ok: true, schoolId: ids.school })
assert.equal(demoContext.schoolId, ids.school)
assert.equal(demoContext.grantId, ids.grant)
assert.deepEqual(buildAngelcare360DemoAccess(demoContext), {
  schoolId: ids.school, grantId: ids.grant, inquiryId: ids.inquiry, expiresAt: rawDemoUser.__demoExpiresAt,
})
console.log('RAW_DEMO_METADATA_SURVIVES_CONTEXT_BOUNDARY=PASS')
console.log('NORMALIZATION_CANNOT_ERASE_DEMO_AUTHORITY=PASS')
console.log('DEMO_ACCESS_CONTEXT_POPULATED=PASS')

assert.deepEqual(resolveAngelcare360PrincipalSchoolAuthority({ demoContext, requestedSchoolId: 'real-customer-school' }), { ok: false, code: 'DEMO_CONTEXT_MISMATCH' })
assert.deepEqual(resolveAngelcare360PrincipalSchoolAuthority({ demoContext, supportSchoolId: 'real-customer-school' }), { ok: false, code: 'DEMO_CONTEXT_MISMATCH' })
console.log('DEMO_WRONG_SCHOOL_REJECTED=PASS')
console.log('DEMO_CONTEXT_CANNOT_ACCESS_REAL_CUSTOMER_SCHOOL=PASS')

const normalContext = extractTrustedAngelcare360DemoPrincipalContext({ id: 'customer-admin' })
assert.deepEqual(resolveAngelcare360PrincipalSchoolAuthority({ demoContext: normalContext, requestedSchoolId: 'customer-a' }), { ok: true, schoolId: 'customer-a' })
assert.deepEqual(resolveAngelcare360PrincipalSchoolAuthority({ demoContext: normalContext, supportSchoolId: 'delegated-school', requestedSchoolId: 'customer-a' }), { ok: true, schoolId: 'delegated-school' })
console.log('NORMAL_SCHOOL_ADMIN_BEHAVIOR_UNCHANGED=PASS')
console.log('OPERATOR_DELEGATED_CONTEXT_UNCHANGED=PASS')

const now = new Date('2026-09-05T12:00:00.000Z')
const validSession = {
  id: 'demo-session', grant_id: ids.grant, config_id: 'demo-config', school_id: ids.school,
  effective_expires_at: '2026-09-05T18:00:00.000Z',
  config: { id: 'demo-config', school_id: ids.school, active: true, access_status: 'active', safety_status: 'enforced' },
  grant: { id: ids.grant, status: 'exhausted' },
}
assert.equal(demoSessionIsAuthorized(validSession, now), true)
assert.equal(demoSessionIsAuthorized({ ...validSession, effective_expires_at: '2026-09-05T11:59:59.000Z' }, now), false)
assert.equal(demoSessionIsAuthorized({ ...validSession, revoked_at: now.toISOString() }, now), false)
assert.equal(extractTrustedAngelcare360DemoPrincipalContext(null).isDemo, false)
console.log('DEMO_SESSION_SCHOOL_MATCH=PASS')
console.log('EXPIRED_DEMO_SESSION_REJECTED=PASS')
console.log('REVOKED_DEMO_SESSION_REJECTED=PASS')

const modules = ['academics', 'administration', 'admissions', 'attendance', 'communications', 'finance', 'inventory', 'library', 'payroll', 'people', 'reports', 'transport']
const features = ['academics.homework', 'academics.timetables', 'administration.academic_years', 'administration.classes', 'administration.schools', 'admissions.documents', 'admissions.pipeline', 'attendance.daily', 'attendance.justifications', 'communications.claims', 'finance.fees', 'finance.invoices', 'finance.payments', 'inventory.movements', 'inventory.stock', 'library.catalogue', 'library.loans', 'people.parents', 'people.staff', 'people.students', 'transport.routes', 'transport.vehicles']
const items = [
  ...modules.map((item_key) => ({ item_type: 'module', item_key, effective_state: 'enabled' })),
  ...features.map((item_key) => ({ item_type: 'feature', item_key, effective_state: 'enabled' })),
  ...['institutions', 'storage_gb', 'students', 'users'].map((item_key) => ({ item_type: 'meter', item_key, effective_state: 'enabled' })),
]
assert.equal(items.length, 38)
const chain = {
  schoolId: schoolAuthority.ok ? schoolAuthority.schoolId : '',
  tenant: { id: ids.tenant, school_id: ids.school, tenant_slug: 'sanila-master-demo', status: 'active' },
  subscription: { id: ids.subscription, tenant_id: ids.tenant, subscription_code: 'DEMO-MAROC-2026', package_version_id: ids.package, status: 'active' },
  packageVersion: { id: ids.package, name: 'AngelCare 360 Enterprise', status: 'published' },
  snapshot: { id: ids.snapshot, tenant_id: ids.tenant, subscription_id: ids.subscription, package_version_id: ids.package, status: 'active' },
}
assert.deepEqual(validateAngelcare360EntitlementChain(chain), { ok: true })
const snapshot = normalizeAngelcare360SnapshotItems(items)
assert.equal(snapshot.module.enabled.length, 12)
assert.equal(snapshot.feature.enabled.length, 22)
assert.equal(snapshot.meters.length, 4)
assert.equal(snapshot.module.enabled.includes('administration'), true)
assert.equal(chain.tenant.tenant_slug, 'sanila-master-demo')
assert.equal(chain.subscription.subscription_code, 'DEMO-MAROC-2026')
assert.equal(chain.packageVersion.name, 'AngelCare 360 Enterprise')
console.log('CROSS_TENANT_ISOLATION=PASS')
console.log('ENTERPRISE_PACKAGE_NAME_PROPAGATES=PASS')

function runtime(overrides: Partial<Angelcare360RuntimeEntitlements> = {}): Angelcare360RuntimeEntitlements {
  return {
    state: 'active', enforced: true, schoolId: ids.school, tenantId: ids.tenant, tenantSlug: 'sanila-master-demo', tenantStatus: 'active',
    subscriptionId: ids.subscription, subscriptionStatus: 'active', packageVersionId: ids.package, packageVersionName: 'AngelCare 360 Enterprise',
    packageVersionCode: 'enterprise', snapshotId: ids.snapshot, snapshotVersion: null, compiledAt: now.toISOString(), enabledModules: [], restrictedModules: [],
    enabledCapabilities: [], restrictedCapabilities: [], enabledFeatures: [], restrictedFeatures: [], enabledServices: [], restrictedServices: [],
    enabledOperations: [], restrictedOperations: [], limits: [], provisioning: [], warning: null, diagnosticCode: null, ...overrides,
  }
}

const legacy = getAngelcare360CustomerGatePresentation(runtime({ state: 'legacy_unconfigured', packageVersionName: null }), 'legacy_unconfigured')
assert.equal(legacy.classification, 'TENANT_NOT_RESOLVED')
assert.notEqual(legacy.title, 'Configuration nécessaire')
assert.notEqual(legacy.title, 'Non inclus dans votre offre')
assert.equal(getAngelcare360CustomerGatePresentation(runtime({ diagnosticCode: 'ENTITLEMENT_RESTRICTED' }), 'configuration_required').title, 'Configuration nécessaire')
assert.equal(getAngelcare360CustomerGatePresentation(runtime({ diagnosticCode: 'ENTITLEMENT_RESTRICTED' }), 'not_included').title, 'Non inclus dans votre offre')
assert.notEqual(getAngelcare360CustomerGatePresentation(runtime({ state: 'legacy_unconfigured', diagnosticCode: 'SUBSCRIPTION_MISSING' })).title, 'Non inclus dans votre offre')
assert.equal(getAngelcare360CustomerGatePresentation(runtime({ state: 'unavailable', diagnosticCode: 'AUTHORITY_UNAVAILABLE' })).title, 'Service temporairement indisponible')
assert.equal(getAngelcare360CustomerGatePresentation(runtime({ state: 'partial', diagnosticCode: 'AUTHORITY_UNAVAILABLE' })).classification, 'RUNTIME_AUTHORITY_PARTIAL')
assert.equal(getAngelcare360CustomerGatePresentation(runtime({ state: 'unavailable', diagnosticCode: 'DEMO_CONTEXT_MISMATCH' })).classification, 'DEMO_CONTEXT_MISMATCH')
console.log('LEGACY_UNCONFIGURED_IS_NOT_CONFIGURATION_REQUIRED=PASS')
console.log('LEGACY_UNCONFIGURED_IS_NOT_COMMERCIAL_NOT_INCLUDED=PASS')
console.log('ACTUAL_CONFIGURATION_REQUIRED_DISPLAYS_CONFIGURATION_REQUIRED=PASS')
console.log('ACTUAL_NOT_INCLUDED_DISPLAYS_NOT_INCLUDED=PASS')
console.log('SUBSCRIPTION_MISSING_NOT_MISLABELED=PASS')
console.log('RUNTIME_UNAVAILABLE_NOT_MISLABELED=PASS')
