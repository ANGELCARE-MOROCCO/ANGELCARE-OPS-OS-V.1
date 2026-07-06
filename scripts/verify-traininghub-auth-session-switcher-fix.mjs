import fs from 'node:fs'

const files = {
  login: 'app/traininghub/login/page.tsx',
  cleaner: 'components/traininghub/auth/TrainingHubLoginSessionCleaner.tsx',
  logoutClient: 'components/traininghub/auth/TrainingHubLogoutClient.tsx',
  logoutPage: 'app/traininghub/logout/page.tsx',
  logoutApi: 'app/api/traininghub/auth/logout/route.ts',
}

const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''
const text = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, read(path)]))

const checks = [
  ['login page exists', fs.existsSync(files.login)],
  ['session cleaner component exists', fs.existsSync(files.cleaner)],
  ['logout client exists', fs.existsSync(files.logoutClient)],
  ['logout page exists', fs.existsSync(files.logoutPage)],
  ['logout API exists', fs.existsSync(files.logoutApi)],
  ['login imports cleaner', text.login.includes('TrainingHubLoginSessionCleaner')],
  ['login renders cleaner', text.login.includes('<TrainingHubLoginSessionCleaner />')],
  ['login signs out before sign-in', text.login.includes('traininghub_session_switcher_pre_signin') && text.login.includes('await supabase.auth.signOut()')],
  ['cleaner clears supabase local/session storage', text.cleaner.includes('localStorage') && text.cleaner.includes('sessionStorage') && text.cleaner.includes('sb-')],
  ['cleaner clears auth cookies', text.cleaner.includes('document.cookie') && text.cleaner.includes('Max-Age=0')],
  ['logout client calls server logout and browser signOut', text.logoutClient.includes('/api/traininghub/auth/logout') && text.logoutClient.includes('supabase?.auth.signOut')],
  ['logout API calls Supabase signOut', text.logoutApi.includes('supabase.auth.signOut')],
  ['logout page redirects back to login', text.logoutPage.includes("'/traininghub/login'")],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('TrainingHub auth session switcher fix verification FAILED.')
  process.exit(1)
}

console.log('TrainingHub auth session switcher fix verification PASSED.')
