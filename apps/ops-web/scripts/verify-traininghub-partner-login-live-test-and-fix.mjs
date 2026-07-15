import fs from 'node:fs'

const file = 'scripts/traininghub-partner-login-live-test-and-fix.mjs'
const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''

const checks = [
  ['live test script exists', fs.existsSync(file)],
  ['uses signInWithPassword', text.includes('signInWithPassword')],
  ['checks Supabase Auth admin users', text.includes('auth.admin.listUsers')],
  ['checks core_user_profiles', text.includes('core_user_profiles')],
  ['checks core_memberships', text.includes('core_memberships')],
  ['checks core_organizations', text.includes('core_organizations')],
  ['checks authz_user_role_assignments', text.includes('authz_user_role_assignments')],
  ['has execute yes safety', text.includes("has('--execute')") && text.includes("has('--yes')")],
  ['writes report', text.includes('traininghub-partner-login-live-test-and-fix-report.json')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub partner login live test and fix verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub partner login live test and fix verification PASSED.')
