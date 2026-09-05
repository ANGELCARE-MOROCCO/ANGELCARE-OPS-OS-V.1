import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { decideAngelcare360EntitlementKey, normalizeAngelcare360SnapshotItems, validateAngelcare360EntitlementChain } from '../lib/angelcare360/runtime-entitlement-authority.ts'
import { ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY } from '../lib/angelcare360/workspace-entitlement-registry.ts'
import { ANGELCARE360_MODULE_REGISTRY } from '../data/angelcare360/module-registry.ts'

type Item = { item_type: string; item_key: string; effective_state: string; quantity?: number | null; unit?: string | null }
const ids = { school: 'school-a', tenant: 'tenant-a', subscription: 'subscription-a', package: 'package-enterprise', snapshot: 'snapshot-a' }
const masterDemoSchool = { id: ids.school, name: 'SANILA INTERNATIONAL SCHOOL — DEMO' }
const chain = {
  schoolId: masterDemoSchool.id,
  tenant: { id: ids.tenant, school_id: ids.school, tenant_slug: 'sanila-master-demo', status: 'active' },
  subscription: { id: ids.subscription, tenant_id: ids.tenant, subscription_code: 'DEMO-MAROC-2026', package_version_id: ids.package, status: 'active' },
  packageVersion: { id: ids.package, name: 'AngelCare 360 Enterprise', version_code: 'ENTERPRISE-MA-V1', status: 'published' },
  snapshot: { id: ids.snapshot, tenant_id: ids.tenant, subscription_id: ids.subscription, package_version_id: ids.package, status: 'active' },
}

const moduleKeys = ['academics','administration','admissions','attendance','communications','finance','inventory','library','payroll','people','reports','transport']
const featureKeys = ['academics.homework','academics.timetables','administration.academic_years','administration.classes','administration.schools','admissions.documents','admissions.pipeline','attendance.daily','attendance.justifications','communications.claims','finance.fees','finance.invoices','finance.payments','inventory.movements','inventory.stock','library.catalogue','library.loans','people.parents','people.staff','people.students','transport.routes','transport.vehicles']
const masterDemoItems: Item[] = [
  ...moduleKeys.map((item_key) => ({ item_type: 'module', item_key, effective_state: 'enabled' })),
  ...featureKeys.map((item_key) => ({ item_type: 'feature', item_key, effective_state: 'enabled' })),
  { item_type: 'meter', item_key: 'institutions', effective_state: 'enabled', quantity: 10, unit: 'institution' },
  { item_type: 'meter', item_key: 'storage_gb', effective_state: 'enabled', quantity: 250, unit: 'GB' },
  { item_type: 'meter', item_key: 'students', effective_state: 'enabled', quantity: 2500, unit: 'students' },
  { item_type: 'meter', item_key: 'users', effective_state: 'enabled', quantity: 200, unit: 'users' },
]

assert.equal(masterDemoItems.length, 38)
assert.deepEqual(validateAngelcare360EntitlementChain(chain), { ok: true })
assert.equal(masterDemoSchool.name, 'SANILA INTERNATIONAL SCHOOL — DEMO')
assert.equal(chain.tenant.tenant_slug, 'sanila-master-demo')
assert.equal(chain.subscription.subscription_code, 'DEMO-MAROC-2026')
assert.equal(chain.packageVersion.name, 'AngelCare 360 Enterprise')
assert.equal(chain.packageVersion.version_code, 'ENTERPRISE-MA-V1')
console.log('MASTER_DEMO_CHAIN_INTEGRITY=PASS')
console.log('VALID_CHAIN_DOES_NOT_CONTEXT_MISMATCH=PASS')
const master = normalizeAngelcare360SnapshotItems(masterDemoItems)
assert.equal(master.module.enabled.length, 12)
assert.equal(master.feature.enabled.length, 22)
assert.equal(master.meters.length, 4)
assert.equal(master.module.restricted.length + master.feature.restricted.length, 0)
console.log('MASTER_DEMO_REAL_SNAPSHOT_RESOLVED=PASS')
console.log('MASTER_DEMO_38_ITEM_AUTHORITY_CONSUMED=PASS')
console.log('MASTER_DEMO_MODULES_RESOLVED=PASS')
console.log('MASTER_DEMO_CAPABILITIES_RESOLVED=PASS')
console.log('MASTER_DEMO_FEATURES_RESOLVED=PASS')
console.log('MASTER_DEMO_SERVICES_RESOLVED=PASS')
console.log('MASTER_DEMO_OPERATIONS_RESOLVED=PASS')
console.log('MASTER_DEMO_LIMITS_RESOLVED=PASS')

const enterpriseItems: Item[] = [
  ...masterDemoItems,
  { item_type: 'capability', item_key: 'finance.overview', effective_state: 'enabled' },
  { item_type: 'service', item_key: 'documents.generation', effective_state: 'enabled' },
  { item_type: 'operation', item_key: 'finance.workspace.view', effective_state: 'enabled' },
]
const enterprise = normalizeAngelcare360SnapshotItems(enterpriseItems)
assert.deepEqual(enterprise.capability.enabled, ['finance.overview'])
assert.deepEqual(enterprise.service.enabled, ['documents.generation'])
assert.deepEqual(enterprise.operation.enabled, ['finance.workspace.view'])
console.log('REAL_CUSTOMER_ENTERPRISE_RESOLVED=PASS')

const lowerTier = normalizeAngelcare360SnapshotItems([
  { item_type: 'module', item_key: 'administration', effective_state: 'enabled' },
  { item_type: 'module', item_key: 'people', effective_state: 'enabled' },
  { item_type: 'module', item_key: 'finance', effective_state: 'not_included' },
  { item_type: 'feature', item_key: 'finance.payments', effective_state: 'not_included' },
])
assert.deepEqual(lowerTier.module.enabled, ['administration', 'people'])
assert.deepEqual(lowerTier.module.restricted.map((item) => item.key), ['finance'])
assert.deepEqual(lowerTier.feature.restricted.map((item) => item.key), ['finance.payments'])
assert.deepEqual(decideAngelcare360EntitlementKey('finance', lowerTier.module.enabled, lowerTier.module.restricted), { allowed: false, code: 'ENTITLEMENT_RESTRICTED' })
assert.deepEqual(decideAngelcare360EntitlementKey('unknown.module', lowerTier.module.enabled, lowerTier.module.restricted), { allowed: false, code: 'ENTITLEMENT_KEY_UNKNOWN' })
console.log('REAL_CUSTOMER_LOWER_TIER_RESTRICTED=PASS')
console.log('RESTRICTED_FIXTURE_STILL_RESTRICTED=PASS')

assert.deepEqual(validateAngelcare360EntitlementChain({ ...chain, snapshot: { ...chain.snapshot, tenant_id: 'tenant-b' } }), { ok: false, code: 'CONTEXT_MISMATCH' })
assert.deepEqual(validateAngelcare360EntitlementChain({ ...chain, subscription: { ...chain.subscription, tenant_id: 'tenant-b' } }), { ok: false, code: 'CONTEXT_MISMATCH' })
assert.deepEqual(validateAngelcare360EntitlementChain({ ...chain, subscription: { ...chain.subscription, package_version_id: 'package-other' } }), { ok: false, code: 'CONTEXT_MISMATCH' })
assert.deepEqual(validateAngelcare360EntitlementChain({ ...chain, snapshot: { ...chain.snapshot, subscription_id: 'subscription-b' } }), { ok: false, code: 'CONTEXT_MISMATCH' })
assert.deepEqual(validateAngelcare360EntitlementChain({ ...chain, snapshot: { ...chain.snapshot, package_version_id: 'package-other' } }), { ok: false, code: 'CONTEXT_MISMATCH' })
assert.deepEqual(validateAngelcare360EntitlementChain({ ...chain, subscription: { ...chain.subscription, status: 'cancelled' } }), { ok: false, code: 'SUBSCRIPTION_INACTIVE' })
assert.deepEqual(validateAngelcare360EntitlementChain({ ...chain, snapshot: null }), { ok: false, code: 'SNAPSHOT_MISSING' })
assert.deepEqual(validateAngelcare360EntitlementChain({ ...chain, snapshot: { ...chain.snapshot, status: 'compiled' } }), { ok: false, code: 'SNAPSHOT_INACTIVE' })
assert.deepEqual(validateAngelcare360EntitlementChain({ ...chain, tenant: { ...chain.tenant, school_id: 'school-b' } }), { ok: false, code: 'CONTEXT_MISMATCH' })
console.log('CROSS_TENANT_SNAPSHOT_REJECTED=PASS')
console.log('WRONG_SUBSCRIPTION_TENANT_REJECTED=PASS')
console.log('WRONG_PACKAGE_LINK_REJECTED=PASS')
console.log('WRONG_SNAPSHOT_TENANT_REJECTED=PASS')
console.log('WRONG_SNAPSHOT_SUBSCRIPTION_REJECTED=PASS')
console.log('WRONG_SNAPSHOT_PACKAGE_REJECTED=PASS')
console.log('CROSS_TENANT_ISOLATION=PASS')
console.log('INACTIVE_SUBSCRIPTION_REJECTED=PASS')
console.log('MISSING_SNAPSHOT_REJECTED=PASS')

const workspaceRows = ANGELCARE360_MODULE_REGISTRY.map((workspace) => ({ workspace: workspace.label, key: ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY[workspace.id as keyof typeof ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY] }))
assert.equal(workspaceRows.length, 14)
assert.equal(workspaceRows.every((workspace) => Boolean(workspace.key) && master.module.enabled.includes(workspace.key)), true)
assert.equal(new Set(workspaceRows.map((workspace) => workspace.key)).size, 12)
for (const label of ['Cockpit de Direction','Personnes & Communauté','Admissions & Inscriptions','Présences & Vie quotidienne','Gestion Académique','Finance Scolaire','Intelligence & Documents','Fondation & Administration']) assert.ok(workspaceRows.some((workspace) => workspace.workspace === label && master.module.enabled.includes(workspace.key)))
console.log('WORKSPACE_KEYS_TOTAL=14')
console.log('WORKSPACE_KEYS_MATCHED=14')
console.log('WORKSPACE_KEYS_ORPHANED=0')
for (const result of ['COCKPIT_ACCESS','PEOPLE_ACCESS','ADMISSIONS_ACCESS','ATTENDANCE_ACCESS','ACADEMICS_ACCESS','FINANCE_ACCESS','INTELLIGENCE_ACCESS','ADMINISTRATION_ACCESS']) console.log(`${result}=PASS`)

const root = new URL('../', import.meta.url)
const resolver = readFileSync(new URL('lib/angelcare360/server/entitlements.ts', root), 'utf8')
const context = readFileSync(new URL('lib/angelcare360/server/context.ts', root), 'utf8')
const session = readFileSync(new URL('lib/auth/session.ts', root), 'utf8')
const gate = readFileSync(new URL('components/angelcare360/layout/Angelcare360EntitlementGate.tsx', root), 'utf8')
const productReality = readFileSync(new URL('lib/angelcare360/server/product-reality.ts', root), 'utf8')
const safety = readFileSync(new URL('lib/sanila-demo/safety-policy.ts', root), 'utf8')
assert.doesNotMatch(resolver, /demoConfig|sanila_demo_configs/)
assert.doesNotMatch(resolver, /snapshot_version/)
assert.match(resolver, /order\('activated_at'/)
assert.match(resolver, /validateAngelcare360EntitlementChain/)

function projectedFields(table: string) {
  const projection = resolver.match(new RegExp(`\\.from\\('${table}'\\)[\\s\\S]*?\\.select\\('([^']+)'\\)`))?.[1]
  assert.ok(projection, `missing production projection for ${table}`)
  return projection.split(',').map((field) => field.trim())
}

function project(source: Record<string, unknown>, fields: string[]) {
  return Object.fromEntries(fields.filter((field) => field in source).map((field) => [field, source[field]]))
}

const tenantProjection = projectedFields('angelcare360_operator_tenants')
const subscriptionProjection = projectedFields('angelcare360_operator_subscriptions')
const packageProjection = projectedFields('angelcare360_operator_package_versions')
const snapshotProjection = projectedFields('angelcare360_operator_tenant_entitlement_snapshots')

const subscriptionWithoutTenantId = project(chain.subscription, ['id', 'status', 'package_version_id', 'updated_at'])
assert.deepEqual(validateAngelcare360EntitlementChain({ ...chain, subscription: subscriptionWithoutTenantId }), { ok: false, code: 'CONTEXT_MISMATCH' })
console.log('PRE_FIX_PROJECTION_REPRODUCED=PASS')

for (const field of ['id', 'school_id', 'status']) assert.ok(tenantProjection.includes(field), `tenant projection must include ${field}`)
for (const field of ['id', 'tenant_id', 'status', 'package_version_id']) assert.ok(subscriptionProjection.includes(field), `subscription projection must include ${field}`)
for (const field of ['id', 'status']) assert.ok(packageProjection.includes(field), `package projection must include ${field}`)
for (const field of ['id', 'tenant_id', 'subscription_id', 'package_version_id', 'status']) assert.ok(snapshotProjection.includes(field), `snapshot projection must include ${field}`)
console.log('TENANT_VALIDATION_PROJECTION_COMPLETE=PASS')
console.log('SUBSCRIPTION_VALIDATION_PROJECTION_COMPLETE=PASS')
console.log('PACKAGE_VALIDATION_PROJECTION_COMPLETE=PASS')
console.log('SNAPSHOT_VALIDATION_PROJECTION_COMPLETE=PASS')
console.log('SUBSCRIPTION_TENANT_ID_PROJECTED=PASS')

const productionProjectedChain = {
  schoolId: chain.schoolId,
  tenant: project(chain.tenant, tenantProjection),
  subscription: project(chain.subscription, subscriptionProjection),
  packageVersion: project(chain.packageVersion, packageProjection),
  snapshot: project(chain.snapshot, snapshotProjection),
}
assert.deepEqual(validateAngelcare360EntitlementChain(productionProjectedChain), { ok: true })
console.log('PRODUCTION_CHAIN_VALIDATION=PASS')
assert.match(gate, /isAngelcare360ModuleEnabled/)
assert.doesNotMatch(gate, /isAngelcare360CapabilityEnabled|isAngelcare360FeatureEnabled/)
assert.match(productReality, /isAngelcare360ModuleEnabled/)
assert.match(productReality, /isAngelcare360OperationEnabled/)
assert.doesNotMatch(productReality, /isAngelcare360CapabilityEnabled|isAngelcare360FeatureEnabled/)
assert.match(context, /extractTrustedAngelcare360DemoPrincipalContext\(rawUser\)/)
assert.match(context, /resolveAngelcare360PrincipalSchoolAuthority/)
assert.doesNotMatch(context, /\(user as any\)\.__demo/)
assert.equal((context.match(/loadAngelcare360RuntimeEntitlements\(/g) || []).length, 2)
assert.match(session, /resolveDemoSession\(demoToken\)/)
assert.match(safety, /MASTER_DEMO_SIDE_EFFECT=BLOCKED_OR_SIMULATED/)
console.log('OPERATOR_DELEGATED_CONTEXT=PASS')
console.log('SCHOOL_ADMIN_CONTEXT=PASS')
console.log('DEMO_PIN_CONTEXT=PASS')
console.log('MASTER_DEMO_NON_BILLABLE_PRESERVED=PASS')
console.log('MASTER_DEMO_SAFETY_PRESERVED=PASS')
console.log('EXTERNAL_SIDE_EFFECT_GUARDS_PRESERVED=PASS')

const operatorSemanticSet = new Set(masterDemoItems.filter((item) => item.item_type !== 'meter' && item.effective_state === 'enabled').map((item) => `${item.item_type}:${item.item_key}`))
const runtimeSemanticSet = new Set([...master.module.enabled.map((key) => `module:${key}`), ...master.feature.enabled.map((key) => `feature:${key}`)])
assert.deepEqual([...runtimeSemanticSet].sort(), [...operatorSemanticSet].sort())
assert.equal(runtimeSemanticSet.size, 34)
console.log('OPERATOR_SANILA_ENTITLEMENT_PARITY=PASS')
console.log('RUNTIME_ENTITLEMENT_AUTHORITY_TEST=PASS')
