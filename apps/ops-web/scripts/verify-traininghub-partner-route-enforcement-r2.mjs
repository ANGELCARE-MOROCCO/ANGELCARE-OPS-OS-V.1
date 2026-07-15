import fs from 'node:fs'

const files = {
  page: 'app/traininghub/page.tsx',
  guard: 'components/traininghub/auth/TrainingHubPartnerRouteGuard.tsx',
  route: 'app/api/traininghub/auth/entry-route/route.ts',
}

const page = fs.existsSync(files.page) ? fs.readFileSync(files.page, 'utf8') : ''
const guard = fs.existsSync(files.guard) ? fs.readFileSync(files.guard, 'utf8') : ''
const route = fs.existsSync(files.route) ? fs.readFileSync(files.route, 'utf8') : ''

const checks = [
  ['admin page exists', fs.existsSync(files.page)],
  ['route guard component exists', fs.existsSync(files.guard)],
  ['entry route API exists', fs.existsSync(files.route)],
  ['admin page imports guard', page.includes('TrainingHubPartnerRouteGuard')],
  ['admin page renders guard', page.includes('<TrainingHubPartnerRouteGuard />')],
  ['guard checks session and user', guard.includes('getSession') && guard.includes('getUser')],
  ['guard has metadata direct redirect', guard.includes('partner metadata detected') && guard.includes("window.location.replace('/traininghub/partner')")],
  ['guard calls no-store entry route', guard.includes('/api/traininghub/auth/entry-route') && guard.includes("cache: 'no-store'")],
  ['API checks Auth user metadata', route.includes('user_metadata') && route.includes('metadataPartner')],
  ['API resolves profiles', route.includes('core_user_profiles') && route.includes('auth_user_id') && route.includes('ilike')],
  ['API resolves memberships', route.includes('core_memberships') && route.includes('profile_id')],
  ['API resolves organizations', route.includes('core_organizations')],
  ['API resolves role assignments and role rows', route.includes('authz_user_role_assignments') && route.includes('resolveRoleRows')],
  ['partner always redirects portal', route.includes("redirectTo: '/traininghub/partner'") && route.includes('partner_context_precedence_over_admin_page')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub partner route enforcement R2 verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub partner route enforcement R2 verification PASSED.')
