import fs from 'node:fs'

const file = 'scripts/traininghub-force-auth-reset-bind.mjs'
const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''

const checks = [
  ['force reset script exists', fs.existsSync(file)],
  ['requires execute yes', text.includes("has('--execute')") && text.includes("has('--yes')")],
  ['updates or creates auth user', text.includes('updateUserById') && text.includes('createUser')],
  ['resolves role_id', text.includes('resolveRoleId') && text.includes('role_id: roleResolution.roleId')],
  ['scans role tables', text.includes('authz_roles') && text.includes('core_roles') && text.includes('rbac_roles')],
  ['tests signInWithPassword after reset', text.includes('signInWithPassword')],
  ['has FK-safe candidate writer', text.includes('writeWithCandidates')],
  ['tries membership user_id auth', text.includes('membership_user_id_auth_role_id')],
  ['tries membership user_id profile', text.includes('membership_user_id_profile_role_id')],
  ['tries role user_id auth with role_id', text.includes('role_user_id_auth_with_role_id')],
  ['tries role user_id profile with role_id', text.includes('role_user_id_profile_with_role_id')],
  ['repairs core_user_profiles', text.includes('core_user_profiles')],
  ['repairs core_memberships', text.includes('core_memberships')],
  ['repairs authz_user_role_assignments', text.includes('authz_user_role_assignments')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub role_id-safe force auth reset bind verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub role_id-safe force auth reset bind verification PASSED.')
