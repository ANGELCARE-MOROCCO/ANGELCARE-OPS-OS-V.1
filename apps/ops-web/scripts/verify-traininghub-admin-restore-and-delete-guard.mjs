import fs from 'node:fs'

const restore = 'scripts/traininghub-restore-internal-admin-access.mjs'
const route = 'app/api/traininghub/internal/partners/[organizationId]/route.ts'
const hardRoute = 'app/api/traininghub/internal/partners/[organizationId]/hard-delete/route.ts'

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
const restoreText = read(restore)
const routeText = read(route)
const hardRouteText = read(hardRoute)

const checks = [
  ['restore script exists', fs.existsSync(restore)],
  ['restore script can create/update Supabase Auth user', restoreText.includes('admin.auth.admin.createUser') && restoreText.includes('admin.auth.admin.updateUserById')],
  ['restore script repairs core_user_profiles', restoreText.includes('core_user_profiles')],
  ['restore script repairs core_memberships', restoreText.includes('core_memberships')],
  ['restore script repairs authz_user_role_assignments', restoreText.includes('authz_user_role_assignments')],
  ['restore script binds to internal organization', restoreText.includes('ensureInternalOrganization')],
  ['restore script tests password login', restoreText.includes('signInWithPassword')],
  ['hard-delete route blocks deleting current admin org', hardRouteText.includes('TRAININGHUB_DELETE_CURRENT_ADMIN_ORG_REFUSED')],
  ['base partner DELETE route blocks deleting current admin org', routeText.includes('TRAININGHUB_DELETE_CURRENT_ADMIN_ORG_REFUSED')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub admin restore/delete guard verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub admin restore/delete guard verification PASSED.')
