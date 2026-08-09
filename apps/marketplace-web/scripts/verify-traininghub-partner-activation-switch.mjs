import fs from 'node:fs'

const component = 'components/traininghub/internal/ExistingPartnerSyncedModal.tsx'
const route = 'app/api/traininghub/internal/partner-dossier/[id]/route.ts'

const componentText = fs.existsSync(component) ? fs.readFileSync(component, 'utf8') : ''
const routeText = fs.existsSync(route) ? fs.readFileSync(route, 'utf8') : ''

const checks = [
  ['existing partner modal exists', fs.existsSync(component)],
  ['partner dossier API route exists', fs.existsSync(route)],
  ['inactive state is explicit', componentText.includes('const inactive =')],
  ['inactive badge visible', componentText.includes('Dossier inactif')],
  ['activate button exists', componentText.includes('Activer dossier')],
  ['activatePartner function exists', componentText.includes('async function activatePartner()')],
  ['activate API action called', componentText.includes("action: 'activate'")],
  ['suspend button disabled when inactive', componentText.includes('disabled={busy || inactive}')),
  ['server activate action exists', routeText.includes("action === 'activate'")],
  ['server activates organization', routeText.includes("status: 'active'") && routeText.includes("stage: 'active'")),
  ['server activates profiles', routeText.includes("'core_user_profiles'") && routeText.includes("access_status: 'active'")),
  ['server activates memberships', routeText.includes("'core_memberships'")),
  ['server activates role assignments', routeText.includes("'authz_user_role_assignments'")),
  ['activation activity logged', routeText.includes('partner_activated')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub partner activation switch verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub partner activation switch verification PASSED.')
