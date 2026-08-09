import fs from 'node:fs'

const component = 'components/traininghub/internal/ExistingPartnerSyncedModal.tsx'
const route = 'app/api/traininghub/internal/partner-dossier/[id]/route.ts'

const componentText = fs.existsSync(component) ? fs.readFileSync(component, 'utf8') : ''
const routeText = fs.existsSync(route) ? fs.readFileSync(route, 'utf8') : ''

const checks = [
  ['existing partner modal component exists', fs.existsSync(component)],
  ['synced API route exists', fs.existsSync(route)],
  ['access password step exists', componentText.includes('Accès, login & mot de passe')],
  ['temporary password generator exists', componentText.includes('generatePassword')],
  ['copy password button exists', componentText.includes('Copier')],
  ['set password action exists in modal', componentText.includes("action: 'set_password'")],
  ['auth user/profile fields exist', componentText.includes('Auth user ID') && componentText.includes('Dernière réinitialisation')],
  ['portal login field exists', componentText.includes('Email login portail')],
  ['password status/readiness tags exist', componentText.includes('Mot de passe défini') && componentText.includes('Mot de passe à définir')],
  ['server set_password action exists', routeText.includes("action === 'set_password'")],
  ['server uses Supabase auth admin create/update', routeText.includes('auth.admin.createUser') && routeText.includes('auth.admin.updateUserById')],
  ['server does not store plaintext password field in organization metadata', !routeText.includes('plain_password') && !routeText.includes('passwordPlaintext')],
  ['GET/PATCH/DELETE still exist', routeText.includes('export async function GET') && routeText.includes('export async function PATCH') && routeText.includes('export async function DELETE')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub existing partner access/password completion verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub existing partner access/password completion verification PASSED.')
