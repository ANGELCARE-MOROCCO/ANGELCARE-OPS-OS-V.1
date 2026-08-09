import fs from 'node:fs'

const files = {
  login: 'app/login/page.tsx',
  cleaner: 'components/auth/OpsosLoginSessionCleaner.tsx',
  logoutPage: 'app/opsos/logout/page.tsx',
  logoutClient: 'components/auth/OpsosLogoutClient.tsx',
  logoutApi: 'app/api/opsos/auth/logout/route.ts',
  persistence: 'app/api/persistence/local-storage/route.ts',
}

const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''
const text = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, read(path)]))

const checks = [
  ['main login page exists', fs.existsSync(files.login)],
  ['login cleaner exists', fs.existsSync(files.cleaner)],
  ['login imports cleaner', text.login.includes('OpsosLoginSessionCleaner')],
  ['login renders cleaner', text.login.includes('<OpsosLoginSessionCleaner />')],
  ['cleaner clears localStorage/sessionStorage', text.cleaner.includes('localStorage') && text.cleaner.includes('sessionStorage')],
  ['cleaner targets OpsOS/AngelCare/auth/supabase keys', text.cleaner.includes('/opsos/i') && text.cleaner.includes('/angelcare/i') && text.cleaner.includes('/supabase/i')],
  ['cleaner clears cookies', text.cleaner.includes('document.cookie') && text.cleaner.includes('Max-Age=0')],
  ['opsos logout page exists', fs.existsSync(files.logoutPage)],
  ['opsos logout client exists', fs.existsSync(files.logoutClient)],
  ['opsos logout api exists', fs.existsSync(files.logoutApi)],
  ['logout page uses /login fallback', text.logoutPage.includes("'/login'")],
  ['logout client clears browser storage', text.logoutClient.includes('localStorage') && text.logoutClient.includes('sessionStorage')],
  ['persistence route is non-blocking', text.persistence.includes('non_blocking_login_safe') && !text.persistence.includes('throw new Error')],
]

console.table(checks.map(([name, pass]) => ({ name, pass })))

if (checks.some(([, pass]) => !pass)) {
  console.error('OpsOS main login session hardening verification FAILED.')
  process.exit(1)
}

console.log('OpsOS main login session hardening verification PASSED.')
