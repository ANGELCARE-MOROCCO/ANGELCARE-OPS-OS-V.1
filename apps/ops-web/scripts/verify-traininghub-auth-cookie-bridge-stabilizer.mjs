import fs from 'node:fs'

const files = {
  browser: 'lib/traininghub/browser-client.ts',
  login: 'app/traininghub/login/page.tsx',
  partnerLogin: 'app/traininghub/partner/login/page.tsx',
  guard: 'components/traininghub/auth/TrainingHubPartnerRouteGuard.tsx',
  modal: 'components/traininghub/internal/ExistingPartnerSyncedModal.tsx',
  adminPage: 'app/traininghub/page.tsx',
}

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
const text = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]))

const checks = [
  ['browser client exists', fs.existsSync(files.browser)],
  ['browser client uses @supabase/ssr createBrowserClient', text.browser.includes("from '@supabase/ssr'") && text.browser.includes('createBrowserClient')],
  ['login imports SSR-compatible browser client', text.login.includes("from '@/lib/traininghub/browser-client'")],
  ['login does not import supabase-js createClient directly', !text.login.includes("from '@supabase/supabase-js'")],
  ['login has no auto redirect useEffect', !text.login.includes('useEffect')],
  ['login uses full navigation after sign-in', text.login.includes('window.location.assign(route)')],
  ['partner login redirects to canonical login', text.partnerLogin.includes("redirect('/traininghub/login')")],
  ['partner route guard is inert', text.guard.includes('return null') && !text.guard.includes('router.replace(')],
  ['admin page does not render partner guard', !text.adminPage.includes('TrainingHubPartnerRouteGuard')],
  ['modal uses shared TrainingHub browser client', !fs.existsSync(files.modal) || text.modal.includes("from '@/lib/traininghub/browser-client'")],
  ['modal no longer imports supabase-js createClient directly', !fs.existsSync(files.modal) || !text.modal.includes("from '@supabase/supabase-js'")],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub auth cookie bridge stabilizer verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub auth cookie bridge stabilizer verification PASSED.')
