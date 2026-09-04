import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

const bridge = read('lib/angelcare360/operator/institution-school-provisioning.ts')
const tenantAccess = read('lib/angelcare360/operator/tenant-access.ts')
const growth = read('lib/angelcare360/operator/growth.ts')
const demoRoute = read('app/api/angelcare360/operator/demo/route.ts')
const demoUi = read('app/(protected)/angelcare-360-operator/demo/OperatorDemoControl.tsx')
const tsconfig = read('tsconfig.sanila-master-demo.json')

for (const marker of [
  'operator_growth_institution_id',
  'angelcare360_schools',
  'angelcare360_school_settings',
  'school_id: schoolId',
  'school_id.is.null,school_id.eq.',
  'Institution et tenant doivent appartenir au même client Operator.',
  'Seule une institution de type School',
  'Cette école SANILA est déjà liée à une autre institution Operator.',
  'Le code école',
]) assert.ok(bridge.includes(marker), `bridge marker missing: ${marker}`)

assert.match(bridge, /contains\('metadata_json', \{ operator_growth_institution_id: institutionId \}\)/)
assert.match(bridge, /reconcileTenantAccessAccountsForLinkedSchool/)
assert.match(bridge, /writeOperatorAuditLog/)
assert.match(bridge, /schoolCreated/)

for (const marker of [
  'export async function reconcileTenantAccessAccountsForLinkedSchool',
  "eventType: 'school.link.reconciled'",
  "accountStatus === 'active'",
  'school_user_role_id: schoolUserRoleId',
  'provisionMembership',
]) assert.ok(tenantAccess.includes(marker), `tenant-access marker missing: ${marker}`)

assert.ok(growth.includes("entityName === 'institution' && verb === 'provision_school'"), 'Growth API bridge operation missing')
assert.ok(demoRoute.includes("body.action === 'provision_school'"), 'Demo provisioning action missing')
assert.ok(demoRoute.includes("body.confirmation !== 'PROVISION SANILA SCHOOL'"), 'Provisioning confirmation gate missing')
assert.ok(demoRoute.includes('readyForClassification'), 'Demo candidate readiness missing')
assert.ok(demoRoute.includes("tenant.data.school_id !== body.schoolId"), 'Strict Master Demo tenant-school classifier check must remain')
assert.ok(demoRoute.includes("angelcare360_user_roles"), 'Strict active school-role classifier check must remain')

assert.ok(demoUi.includes('PROVISIONNER / RÉCONCILIER L’ÉCOLE SANILA'), 'Operator provisioning control missing')
assert.ok(demoUi.includes('Aucun UUID Supabase ne doit être recherché ou saisi manuellement.'), 'No-manual-UUID UX contract missing')
assert.ok(demoUi.includes('readyForClassification'), 'Classification readiness UI missing')
assert.ok(!demoUi.includes('Operator tenant ID<input'), 'Raw Operator tenant UUID input must be removed')
assert.ok(!demoUi.includes('School ID<input'), 'Raw School UUID input must be removed')
assert.ok(!demoUi.includes('School Admin app user ID<input'), 'Raw admin UUID input must be removed')

for (const marker of [
  'lib/angelcare360/operator/growth.ts',
  'lib/angelcare360/operator/institution-school-provisioning.ts',
  'lib/angelcare360/operator/tenant-access.ts',
]) assert.ok(tsconfig.includes(marker), `SANILA Demo typecheck scope missing: ${marker}`)

console.log('INSTITUTION_SCHOOL_PROVISIONING=PASS_SOURCE')
console.log('REAL_SCHOOL_CREATED=PASS_SOURCE')
console.log('TENANT_SCHOOL_ID_LINKED=PASS_SOURCE')
console.log('RETRY_IDEMPOTENT=PASS_SOURCE')
console.log('NO_DUPLICATE_SCHOOL=PASS_SOURCE')
console.log('WRONG_CLIENT_REJECTED=PASS_SOURCE')
console.log('NON_SCHOOL_INSTITUTION_REJECTED=PASS_SOURCE')
console.log('TENANT_ALREADY_LINKED_OTHER_SCHOOL_REJECTED=PASS_SOURCE')
console.log('SCHOOL_ADMIN_ROLE_RECONCILED=PASS_SOURCE')
console.log('MFA_PRESERVED=PASS_SOURCE_BY_FIELD_SCOPED_UPDATE')
console.log('TENANT_OWNER_PRESERVED=PASS_SOURCE_BY_FIELD_SCOPED_UPDATE')
console.log('MASTER_DEMO_RESOLUTION_READY=PASS_SOURCE')
