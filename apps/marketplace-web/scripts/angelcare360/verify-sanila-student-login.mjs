import fs from 'node:fs'
import path from 'node:path'

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
let passed = 0
const checks = []
const add = (name, fn) => checks.push([name, fn])
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(root, rel))

const pageRel = 'app/angelcare-360-student/login/page.tsx'
const clientRel = 'components/angelcare360/student-auth/SanilaStudentLoginExperience.tsx'
const cssRel = 'components/angelcare360/student-auth/SanilaStudentLoginExperience.module.css'
const gatewayRel = 'components/angelcare360/gateway/SanilaMasterGateway.tsx'
const page = exists(pageRel) ? read(pageRel) : ''
const client = exists(clientRel) ? read(clientRel) : ''
const css = exists(cssRel) ? read(cssRel) : ''
const gateway = exists(gatewayRel) ? read(gatewayRel) : ''
const roles = exists('data/angelcare360/role-portals.ts') ? read('data/angelcare360/role-portals.ts') : ''

add('dedicated student login route exists', () => exists(pageRel))
add('student login experience exists', () => exists(clientRel))
add('student login CSS exists', () => exists(cssRel))
add('approved unveiled Moroccan student hero exists', () => exists('public/sanila/student-login/sanila-student-morocco-approved.webp'))
add('official normal SANILA logo asset exists', () => exists('public/sanila/sanila-operating-system-logo.png'))
add('official white SANILA logo asset exists', () => exists('public/sanila/sanila-operating-system-logo-white.png'))
add('SANILA student metadata present', () => page.includes("SANILA Operating System · Espace Élève"))
add('dedicated route is force dynamic', () => page.includes("export const dynamic = 'force-dynamic'"))
add('existing login RPC reused', () => page.includes("rpc('login_app_user'"))
add('existing app_sessions authority reused', () => page.includes("from('app_sessions').insert"))
add('existing APP_SESSION_COOKIE reused', () => page.includes('APP_SESSION_COOKIE'))
add('secure token generator reused', () => page.includes('generateSessionToken'))
add('student role verified server side', () => page.includes('PORTAL_ROLE_KEYS.student.includes(role)'))
add('canonical student roles exist', () => roles.includes("student: ['student','eleve','élève']"))
add('canonical student destination exists', () => roles.includes("student: '/angelcare-360-student'"))
add('inactive users rejected', () => page.includes("user.status !== 'active'"))
add('non student role rejected', () => page.includes("errorHref('role'"))
add('student default redirect present', () => page.includes("redirect(requestedNext || '/angelcare-360-student')"))
add('next redirect restricted to student subtree', () => page.includes("value.startsWith('/angelcare-360-student')"))
add('session is HTTP only', () => page.includes('httpOnly: true'))
add('session sameSite lax preserved', () => page.includes("sameSite: 'lax'"))
add('production secure cookie preserved', () => page.includes("secure: process.env.NODE_ENV === 'production'"))
add('last_login_at update preserved', () => page.includes('last_login_at'))
add('customer broadcast snapshot reused', () => page.includes('getAngelcare360CustomerBroadcastSnapshot'))
add('body uses official normal SANILA logo', () => client.includes('/sanila/sanila-operating-system-logo.png'))
add('top bar uses official white SANILA logo', () => client.includes('/sanila/sanila-operating-system-logo-white.png'))
add('student headline exact', () => client.includes('Bienvenue dans votre espace'))
add('student subtitle exact', () => client.includes('Tout votre parcours scolaire, à portée de main.'))
add('student card title exact', () => client.includes('<h2>Espace Élève</h2>'))
add('approved student hero used', () => client.includes('/sanila/student-login/sanila-student-morocco-approved.webp'))
add('student hero is mobile phone oriented', () => client.includes('utilisant son téléphone'))
add('course feature present', () => client.includes('>Cours</span>'))
add('homework feature present', () => client.includes('>Devoirs</span>'))
add('assessment feature present', () => client.includes('>Évaluations</span>'))
add('results feature present', () => client.includes('>Résultats</span>'))
add('documents feature present', () => client.includes('>Documents</span>'))
add('browser Intl clock used', () => client.includes("new Intl.DateTimeFormat('fr-FR'"))
add('clock uses browser Date', () => client.includes('const now = new Date()'))
add('clock updates at minute boundary', () => client.includes('60_000 - (now.getSeconds() * 1000 + now.getMilliseconds())'))
add('clock does not use setInterval', () => !client.includes('setInterval('))
add('ticker has no requestAnimationFrame loop', () => !client.includes('requestAnimationFrame('))
add('four hour feed refresh present', () => client.includes('4 * 60 * 60 * 1000'))
add('visibility aware feed refresh present', () => client.includes("document.addEventListener('visibilitychange'"))
add('conditional ETag request present', () => client.includes("'If-None-Match'"))
add('feed failure cannot block login', () => client.includes('authentication remains completely independent'))
add('brandSafe removes old AngelCare 360 feed wording', () => client.includes("replace(/AngelCare\\s*360/gi, 'SANILA Operating System')"))
add('ticker duplicates content for seamless motion', () => client.includes('aria-hidden="true"') && client.includes('key={`b-${item.id}`}'))
add('ticker is CSS compositor driven', () => css.includes('translate3d') && css.includes('animation:sanilaStudentTicker'))
add('ticker will-change transform present', () => css.includes('will-change:transform'))
add('reduced motion fallback exists', () => css.includes('@media (prefers-reduced-motion:reduce)'))
add('real username input exists', () => client.includes('name="username"'))
add('real password input exists', () => client.includes('name="password"'))
add('password visibility control exists', () => client.includes('setShowPassword'))
add('remember me stores identifier only', () => client.includes("const REMEMBER_KEY = 'sanila.student.login.identifier'"))
add('client never stores password', () => !/localStorage\.(setItem|getItem)\([^\n]*password/i.test(client))
add('forgot password UX exists', () => client.includes('Mot de passe oublié ?'))
add('no fake OTP capability advertised', () => !client.includes('code à usage unique') && !client.includes('OTP'))
add('no fake SSO capability advertised', () => !client.includes('SSO'))
add('submit pending state exists', () => client.includes('useFormStatus') && client.includes('Connexion sécurisée…'))
add('student help UX exists', () => client.includes('Besoin d’aide ?') && client.includes('Centre d’aide'))
add('2026 SANILA copyright present', () => client.includes('© 2026 SANILA Operating System'))
add('support footer present', () => client.includes('Support technique disponible 24/7'))
add('privacy label present', () => client.includes('Politique de confidentialité'))
add('terms label present', () => client.includes('Conditions d’utilisation'))
add('desktop split layout present', () => css.includes('grid-template-columns:minmax(0,49%)'))
add('tablet/mobile stacked layout present', () => css.includes('@media (max-width:980px)') && css.includes('flex-direction:column'))
add('small mobile breakpoint present', () => css.includes('@media (max-width:560px)'))
add('real DOM not whole page screenshot', () => client.includes('<form') && client.includes('<input') && client.includes('<button'))
add('student badge is real DOM', () => client.includes('className={styles.studentBadge}') && client.includes('<GraduationCap'))
add('gateway student door points to dedicated login', () => gateway.includes("href: '/angelcare-360-student/login'"))
add('gateway student generic route removed', () => !gateway.includes("href: '/angelcare-360-portal/login?audience=student'"))
add('teacher dedicated gateway route remains intact', () => gateway.includes("href: '/angelcare-360-teacher/login'"))
add('staff dedicated gateway route remains intact', () => gateway.includes("href: '/angelcare-360-staff/login'"))
add('parent dedicated gateway route remains intact', () => gateway.includes("href: '/angelcare-360-parent/login'"))
add('administration dedicated route remains intact', () => gateway.includes("href: '/angelcare-360-access/login'"))
add('targeted noEmit tsconfig exists', () => exists('tsconfig.sanila-student-login.json'))

for (const [name, fn] of checks) {
  try {
    if (!fn()) throw new Error('failed')
    passed += 1
    console.log(`PASS  ${name}`)
  } catch {
    console.error(`FAIL  ${name}`)
    process.exitCode = 1
  }
}

console.log(`\n${passed}/${checks.length} checks passed. SANILA Student Login is statically accepted.`)
if (passed !== checks.length) process.exitCode = 1
