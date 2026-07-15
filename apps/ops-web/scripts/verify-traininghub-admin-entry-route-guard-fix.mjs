import fs from 'node:fs'

const route = 'app/api/traininghub/auth/entry-route/route.ts'
const guard = 'components/traininghub/auth/TrainingHubPartnerRouteGuard.tsx'
const diagnose = 'scripts/traininghub-diagnose-entry-route.mjs'

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
const routeText = read(route)
const guardText = read(guard)
const diagnoseText = read(diagnose)

const checks = [
  ['entry-route exists', fs.existsSync(route)],
  ['entry-route reads core_user_profiles', routeText.includes('core_user_profiles')],
  ['entry-route reads memberships', routeText.includes('core_memberships')],
  ['entry-route reads organizations', routeText.includes('core_organizations')],
  ['entry-route reads roles/RBAC', routeText.includes('authz_user_role_assignments') && routeText.includes('authz_roles')],
  ['entry-route recognizes internal admin', routeText.includes('looksInternalOrg') && routeText.includes('looksAdminRole')],
  ['entry-route sends internal admin to /traininghub', routeText.includes("'/traininghub'")],
  ['entry-route gives admin priority over partner', routeText.includes('Internal admin wins over partner')],
  ['diagnose script exists', fs.existsSync(diagnose) && diagnoseText.includes('expectedEntryRoute')],
  ['guard is compatible or absent', !fs.existsSync(guard) || guardText.includes('entry-route')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub admin entry-route guard verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub admin entry-route guard verification PASSED.')
