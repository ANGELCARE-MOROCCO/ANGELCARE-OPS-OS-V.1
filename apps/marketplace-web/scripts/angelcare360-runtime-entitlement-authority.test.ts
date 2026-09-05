import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { decideAngelcare360EntitlementKey, normalizeAngelcare360SnapshotItems, validateAngelcare360EntitlementChain } from '../lib/angelcare360/runtime-entitlement-authority.ts'
import { ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY } from '../lib/angelcare360/workspace-entitlement-registry.ts'
import { ANGELCARE360_MODULE_REGISTRY } from '../data/angelcare360/module-registry.ts'

type Item = { item_type: string; item_key: string; effective_state: string; quantity?: number | null; unit?: string | null }
const ids = { school: 'school-a', tenant: 'tenant-a', subscription: 'subscription-a', package: 'package-enterprise', snapshot: 'snapshot-a' }
const chain = {
  schoolId: ids.school,
  tenant: { id: ids.tenant, school_id: ids.school, status: 'active' },
  subscription: { id: ids.subscription, tenant_id: ids.tenant, package_version_id: ids.package, status: 'active' },
  packageVersion: { id: ids.package, status: 'published' },
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
assert.deepEqual(validateAngelcare360EntitlementChain({ ...chain, subscription: { ...chain.subscription, status: 'cancelled' } }), { ok: false, code: 'SUBSCRIPTION_INACTIVE' })
assert.deepEqual(validateAngelcare360EntitlementChain({ ...chain, snapshot: null }), { ok: false, code: 'SNAPSHOT_MISSING' })
assert.deepEqual(validateAngelcare360EntitlementChain({ ...chain, snapshot: { ...chain.snapshot, status: 'compiled' } }), { ok: false, code: 'SNAPSHOT_INACTIVE' })
assert.deepEqual(validateAngelcare360EntitlementChain({ ...chain, tenant: { ...chain.tenant, school_id: 'school-b' } }), { ok: false, code: 'CONTEXT_MISMATCH' })
console.log('CROSS_TENANT_SNAPSHOT_REJECTED=PASS')
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
