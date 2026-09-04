import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const files = {
  page: path.join(root, 'app/angelcare-360-access/page.tsx'),
  component: path.join(root, 'components/angelcare360/gateway/SanilaMasterGateway.tsx'),
  css: path.join(root, 'components/angelcare360/gateway/SanilaMasterGateway.module.css'),
  broadcast: path.join(root, 'lib/angelcare360/customer-broadcasts.ts'),
  api: path.join(root, 'app/api/angelcare360/customer-broadcasts/route.ts'),
  logo: path.join(root, 'public/sanila/sanila-operating-system-logo-white.png'),
}
const authorityFiles = {
  portalLogin: path.join(root, 'app/angelcare-360-portal/login/page.tsx'),
  rolePortals: path.join(root, 'data/angelcare360/role-portals.ts'),
  rolePortalTypes: path.join(root, 'types/angelcare360/role-portals.ts'),
  authSession: path.join(root, 'lib/ac360-portability/auth-session.ts'),
}
const assets = ['admin','teacher','staff','parent','student'].map((name) =>
  path.join(root, `public/sanila/gateway/sanila-gateway-${name}.webp`),
)

let checks = 0
let failures = 0
function check(label, condition) {
  checks += 1
  if (condition) console.log(`PASS  ${label}`)
  else { failures += 1; console.error(`FAIL  ${label}`) }
}
function text(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '' }

const page = text(files.page)
const component = text(files.component)
const css = text(files.css)
const broadcast = text(files.broadcast)
const api = text(files.api)

check('canonical role portal login authority exists', fs.existsSync(authorityFiles.portalLogin))
check('canonical role mapping authority exists', fs.existsSync(authorityFiles.rolePortals))
check('canonical role portal types exist', fs.existsSync(authorityFiles.rolePortalTypes))
check('canonical auth session authority exists', fs.existsSync(authorityFiles.authSession))
const portalLogin = text(authorityFiles.portalLogin)
const rolePortals = text(authorityFiles.rolePortals)
check('role portal login uses login_app_user authority', portalLogin.includes("rpc('login_app_user'"))
check('role portal login creates protected app session', portalLogin.includes("from('app_sessions').insert"))
check('role portal login resolves portal role server-side', portalLogin.includes('roleKind(') && portalLogin.includes('PORTAL_ROLE_KEYS'))
check('staff role mapping is explicitly supported', rolePortals.includes("staff: ['staff','administration','reception','finance','rh','transport','bibliotheque','qualite']"))
check('gateway public route exists', fs.existsSync(files.page))
check('gateway client experience exists', fs.existsSync(files.component))
check('gateway CSS exists', fs.existsSync(files.css))
check('official white-transparent SANILA logo exists', fs.existsSync(files.logo))
check('all five signed role portraits exist', assets.every(fs.existsSync))
check('server page reuses broadcast authority', page.includes('getAngelcare360CustomerBroadcastSnapshot'))
check('server page renders SanilaMasterGateway', page.includes('<SanilaMasterGateway'))
check('SANILA Operating System is master title', component.includes('<h1>SANILA <span>Operating System</span></h1>'))
check('legacy ANGELCARE 360 title is absent from gateway heading', !component.includes('<h1>ANGELCARE 360'))
check('2026 SANILA copyright present', component.includes('© 2026 SANILA Operating System. Tous droits réservés.'))
check('five doors declared', (component.match(/key: '(administration|teacher|staff|parent|student)',/g) || []).length === 5)
check('administration door present', component.includes("title: 'Établissement / Administration'"))
check('teacher door present', component.includes("title: 'Espace Enseignant'"))
check('staff door present', component.includes("title: 'Espace Équipe'"))
check('parent door present', component.includes("title: 'Espace Parent / Tuteur'"))
check('student door present', component.includes("title: 'Espace Élève'"))
check('administration links to school login', component.includes("href: '/angelcare-360-access/login'"))
check('teacher routes through existing role login authority', component.includes('audience=teacher'))
check('staff routes through existing role login authority', component.includes('audience=staff'))
check('parent routes through existing role login authority', component.includes('audience=parent'))
check('student routes through existing role login authority', component.includes('audience=student'))
check('official white SANILA logo wired in fixed live bar', component.includes('/sanila/sanila-operating-system-logo-white.png'))
check('browser clock uses Intl.DateTimeFormat', component.includes("new Intl.DateTimeFormat('fr-FR'"))
check('clock updates by timeout not page rebuild', component.includes('60_000 - (now.getSeconds() * 1000 + now.getMilliseconds())'))
check('no setInterval in gateway', !component.includes('setInterval('))
check('no requestAnimationFrame in gateway', !component.includes('requestAnimationFrame('))
check('four-hour refresh constant present', component.includes('4 * 60 * 60 * 1000'))
check('visibility-aware refresh present', component.includes("document.addEventListener('visibilitychange'"))
check('broadcast refresh is conditional ETag', component.includes("'If-None-Match'"))
check('broadcast source is not polled rapidly', !component.includes('setInterval') && !component.includes('30_000') && !component.includes('60_000, refresh'))
check('ticker duplicates content for seamless loop', component.includes('aria-hidden="true"') && component.includes("key={`b-${item.id}`}"))
check('ticker is compositor transform driven', css.includes('translate3d') && css.includes('linear infinite'))
check('ticker uses will-change transform', css.includes('will-change:transform'))
check('reduced-motion fallback exists', css.includes('@media (prefers-reduced-motion:reduce)'))
check('desktop five-column architecture exists', css.includes('grid-template-columns:1.18fr repeat(4,1fr)'))
check('tablet layout exists', css.includes('@media (max-width:820px)'))
check('mobile purpose-built layout exists', css.includes('@media (max-width:560px)'))
check('mobile doors switch to horizontal media/card composition', css.includes('grid-template-columns:116px minmax(0,1fr)'))
check('mobile has no forced horizontal door rail', css.includes('flex-direction:column'))
check('door hover remains restrained', css.includes('translateY(-5px)'))
check('portraits use real Next Image assets', component.includes('<Image') && component.includes('door.image'))
check('no screenshot-as-whole-page technique', !component.includes('backgroundImage:') && !component.includes('tableau_de_bord_sanila'))
check('broadcast authority remains global-only', broadcast.includes(".is('client_id', null)") && broadcast.includes(".is('tenant_id', null)"))
check('broadcast authority only accepts customer_broadcast events', broadcast.includes(".like('event_type', 'customer_broadcast.%')"))
check('broadcast API supports ETag', api.includes('ETag') && api.includes('304'))
check('gateway sanitizes old visible AngelCare 360 feed label', component.includes("replace(/AngelCare\\s*360/gi, 'SANILA Operating System')"))
check('gateway contains no password/session handling', !/password|session_token|login_app_user/.test(component))
check('gateway does not modify auth/session authority', !component.includes('generateSessionToken') && !component.includes('APP_SESSION_COOKIE'))
check('support and help affordances present', component.includes('Support technique disponible 24/7') && component.includes("Centre d’aide"))
check('no production build logic inside gateway files', !/next build|npm run build|RUN_PRODUCTION_BUILD/.test(component + css + page))

console.log(`\n${checks - failures}/${checks} checks passed.`)
if (failures) process.exit(1)
console.log('SANILA Master Gateway hybrid desktop/mobile is statically accepted.')
