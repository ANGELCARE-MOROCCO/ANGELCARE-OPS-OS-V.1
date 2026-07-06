import fs from 'node:fs'

const files = [
  'scripts/traininghub-diagnose-partner-login-binding.mjs',
  'scripts/traininghub-repair-partner-login-binding.mjs',
]

const repair = fs.existsSync(files[1]) ? fs.readFileSync(files[1], 'utf8') : ''
const diagnose = fs.existsSync(files[0]) ? fs.readFileSync(files[0], 'utf8') : ''

const checks = [
  ['diagnose script exists', fs.existsSync(files[0])],
  ['repair script exists', fs.existsSync(files[1])],
  ['diagnose checks auth users', diagnose.includes('auth.admin.listUsers')],
  ['diagnose checks profiles', diagnose.includes('core_user_profiles')],
  ['diagnose checks memberships', diagnose.includes('core_memberships')],
  ['diagnose checks organizations', diagnose.includes('core_organizations')],
  ['diagnose checks role assignments', diagnose.includes('authz_user_role_assignments')],
  ['repair activates organization', repair.includes("status: 'active'") && repair.includes("stage: 'active'")],
  ['repair sets auth_user_id', repair.includes('auth_user_id: authUser.id')],
  ['repair creates/updates membership', repair.includes('core_memberships')],
  ['repair creates/updates role assignment', repair.includes('authz_user_role_assignments')],
  ['repair has dry-run guard', repair.includes("has('--execute') && has('--yes')")],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub partner login binding repair verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub partner login binding repair verification PASSED.')
