import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = path.resolve(process.argv[2] || process.cwd())
const app = root.endsWith(path.join('apps', 'marketplace-web')) ? root : path.join(root, 'apps', 'marketplace-web')

const files = {
  page: 'app/angelcare-360-access/login/page.tsx',
  api: 'app/api/angelcare360/customer-broadcasts/route.ts',
  component: 'components/angelcare360/auth/Angelcare360CustomerLoginExperience.tsx',
  css: 'components/angelcare360/auth/Angelcare360CustomerLoginExperience.module.css',
  feed: 'lib/angelcare360/customer-broadcasts.ts',
  logo: 'public/brand/angelcare-official-user-transparent.png',
  hero: 'public/angelcare360/login/angelcare360-executive-morocco.webp',
  tsconfig: 'tsconfig.angelcare360-customer-login-final.json',
}

let passed = 0
const failures = []

function read(key) {
  return fs.readFileSync(path.join(app, files[key]), 'utf8')
}
function check(label, condition) {
  if (condition) {
    passed += 1
    console.log(`PASS  ${label}`)
  } else {
    failures.push(label)
    console.error(`FAIL  ${label}`)
  }
}

for (const [key, rel] of Object.entries(files)) {
  check(`required file exists: ${rel}`, fs.existsSync(path.join(app, rel)))
}

if (!failures.length) {
  const page = read('page')
  const api = read('api')
  const component = read('component')
  const css = read('css')
  const feed = read('feed')

  check('customer login replaces internal-access wording', !page.includes('INTERNAL ACCESS') && !page.includes('Connexion opérateur'))
  check('authentication RPC remains authoritative', page.includes("supabase.rpc('login_app_user'"))
  check('secure app session creation remains present', page.includes("from('app_sessions').insert"))
  check('secure cookie authority remains present', page.includes('APP_SESSION_COOKIE') && page.includes("httpOnly: true"))
  check('operator/customer post-login routing remains present', page.includes("'/angelcare-360-operator'") && page.includes("'/angelcare-360-command-center'"))
  check('MFA/protected boundary was not replaced by client auth', !component.includes('login_app_user') && !component.includes('app_sessions'))

  check('official user logo is rendered', component.includes('/brand/angelcare-official-user-transparent.png'))
  check('approved executive hero is rendered', component.includes('/angelcare360/login/angelcare360-executive-morocco.webp'))
  check('SANILA identity present', component.includes('SANILA Operating System'))
  check('AngelCare 360 product identity present', component.includes('ANGELCARE 360'))
  check('school-pilotage descriptor present', component.includes('Pilotage établissement scolaire'))
  check('2026 copyright present', component.includes('© 2026 ANGELCARE 360'))
  check('obsolete 2024 copyright absent', !component.includes('© 2024'))

  check('clock uses browser Intl formatter', component.includes("new Intl.DateTimeFormat('fr-FR'"))
  check('clock has no one-second interval', !component.includes('setInterval('))
  check('clock aligns by timeout/minute boundary', component.includes('60_000 - (now.getSeconds() * 1000 + now.getMilliseconds())'))

  check('four-hour refresh constant exact', component.includes('4 * 60 * 60 * 1000'))
  check('visibility-aware refresh present', component.includes("document.addEventListener('visibilitychange'"))
  check('feed has no short polling loop', !component.includes('setInterval(') && !component.includes('requestAnimationFrame('))
  check('ticker is CSS compositor driven', css.includes('@keyframes angelcare360Ticker') && css.includes('translate3d('))
  check('ticker duplicates content for seamless motion', component.includes('aria-hidden="true"') && component.includes('tickerGroup'))
  check('reduced-motion fallback present', css.includes('@media (prefers-reduced-motion:reduce)'))

  check('feed only reads global operator broadcasts', feed.includes(".is('client_id', null)") && feed.includes(".is('tenant_id', null)") && feed.includes(".like('event_type', 'customer_broadcast.%')"))
  check('customer feed does not read tenant admissions/finance/attendance', !feed.includes('admission') && !feed.includes('payment') && !feed.includes('attendance'))
  check('broadcast endpoint supports conditional ETag', api.includes("request.headers.get('if-none-match')") && api.includes('ETag'))
  check('broadcast endpoint prevents stale browser caching', api.includes("'Cache-Control': 'private, max-age=0, must-revalidate'"))
  check('login remains independent if broadcast source fails', feed.includes('catch') && feed.includes("source: 'fallback'"))

  check('password visibility interaction present', component.includes('showPassword') && component.includes('EyeOff'))
  check('remember-me stores identifier only', component.includes("localStorage.setItem('angelcare360.login.identifier'"))
  check('invitation access reuses activation authority', component.includes('/angelcare-360-access/activate?token='))
  check('no client password/session persistence', !component.includes("localStorage.setItem('password'") && !component.includes('session_token'))

  check('desktop layout supports 1366–1920 adaptive range', css.includes('@media (max-width:1480px)') && css.includes('@media (max-width:1120px)'))
  check('hero/main stage avoids screenshot-as-whole-page hack', component.includes('heroPanel') && component.includes('loginCard') && component.includes('productBlock'))
  check('login inputs are real DOM controls', component.includes('name="username"') && component.includes('name="password"'))
}

console.log('')
if (failures.length) {
  console.error(`${failures.length} verification check(s) failed.`)
  process.exit(1)
}
console.log(`${passed} checks passed. AngelCare 360 desktop customer login is statically accepted.`)
