import fs from 'node:fs'

const loginPath = 'app/traininghub/login/page.tsx'
const adminPath = 'app/traininghub/page.tsx'

const login = fs.existsSync(loginPath) ? fs.readFileSync(loginPath, 'utf8') : ''
const admin = fs.existsSync(adminPath) ? fs.readFileSync(adminPath, 'utf8') : ''

const checks = [
  ['login page exists', fs.existsSync(loginPath)],
  ['admin page exists', fs.existsSync(adminPath)],
  ['login has post-login resolver', login.includes('resolveTrainingHubPostLoginHref')],
  ['login detects partner metadata', login.includes('trainingHubHasPartnerSignal(metadata.traininghub_role')],
  ['login checks memberships/profile variants', login.includes("query.eq('profile_id', profileId)") && login.includes("query.eq('auth_user_id', authUserId)")],
  ['login no longer unconditionally redirects admin', !login.includes("    redirect('/traininghub')")],
  ['login redirects to resolver result', login.includes("redirect(await resolveTrainingHubPostLoginHref(supabase, data.user, email))")],
  ['admin page imports server context guard', admin.includes("requireTrainingHubPageContext")],
  ['admin page awaits server context guard', admin.includes("await requireTrainingHubPageContext()")],
  ['admin page no longer relies only on client route guard', !admin.includes('TrainingHubPartnerRouteGuard')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub login redirect + server guard verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub login redirect + server guard verification PASSED.')
