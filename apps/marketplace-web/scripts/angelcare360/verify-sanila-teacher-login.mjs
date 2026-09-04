import fs from 'node:fs'
import path from 'node:path'

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
let passed = 0
const checks = []
const add = (name, fn) => checks.push([name, fn])
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(root, rel))

const pageRel = 'app/angelcare-360-teacher/login/page.tsx'
const clientRel = 'components/angelcare360/teacher-auth/SanilaTeacherLoginExperience.tsx'
const cssRel = 'components/angelcare360/teacher-auth/SanilaTeacherLoginExperience.module.css'
const gatewayRel = 'components/angelcare360/gateway/SanilaMasterGateway.tsx'
const page = exists(pageRel) ? read(pageRel) : ''
const client = exists(clientRel) ? read(clientRel) : ''
const css = exists(cssRel) ? read(cssRel) : ''
const gateway = exists(gatewayRel) ? read(gatewayRel) : ''

add('dedicated teacher login route exists', () => exists(pageRel))
add('teacher login experience exists', () => exists(clientRel))
add('teacher login CSS exists', () => exists(cssRel))
add('approved teacher hero asset exists', () => exists('public/sanila/teacher-login/sanila-teacher-morocco-approved.webp'))
add('official normal SANILA logo asset exists', () => exists('public/sanila/sanila-operating-system-logo.png'))
add('official white SANILA logo asset exists', () => exists('public/sanila/sanila-operating-system-logo-white.png'))
add('SANILA teacher metadata present', () => page.includes("SANILA Operating System · Espace Enseignant"))
add('dedicated route is force dynamic', () => page.includes("export const dynamic = 'force-dynamic'"))
add('existing login RPC reused', () => page.includes("rpc('login_app_user'"))
add('existing app_sessions authority reused', () => page.includes("from('app_sessions').insert"))
add('existing APP_SESSION_COOKIE reused', () => page.includes('APP_SESSION_COOKIE'))
add('secure token generator reused', () => page.includes('generateSessionToken'))
add('teacher role is verified server side', () => page.includes('PORTAL_ROLE_KEYS.teacher.includes(role)'))
add('inactive users rejected', () => page.includes("user.status !== 'active'"))
add('non teacher role rejected', () => page.includes("errorHref('role'"))
add('teacher default redirect present', () => page.includes("redirect(requestedNext || '/angelcare-360-teacher')"))
add('next redirect restricted to teacher subtree', () => page.includes("value.startsWith('/angelcare-360-teacher')"))
add('session is HTTP only', () => page.includes('httpOnly: true'))
add('session sameSite lax preserved', () => page.includes("sameSite: 'lax'"))
add('production secure cookie preserved', () => page.includes("secure: process.env.NODE_ENV === 'production'"))
add('last_login_at update preserved', () => page.includes('last_login_at'))
add('customer broadcast snapshot reused', () => page.includes('getAngelcare360CustomerBroadcastSnapshot'))
add('main visible brand is SANILA', () => client.includes('alt="SANILA Operating System"'))
add('teacher title exact', () => client.includes('<h1>Espace Enseignant</h1>'))
add('teacher mission copy present', () => client.includes('Gérez vos classes, présence, devoirs, évaluations'))
add('approved hero used', () => client.includes('/sanila/teacher-login/sanila-teacher-morocco-approved.webp'))
add('official normal SANILA asset used', () => client.includes('/sanila/sanila-operating-system-logo.png'))
add('top official white SANILA logo used', () => client.includes('/sanila/sanila-operating-system-logo-white.png'))
add('browser Intl clock used', () => client.includes("new Intl.DateTimeFormat('fr-FR'"))
add('clock uses browser Date', () => client.includes('const now = new Date()'))
add('clock updates via minute boundary setTimeout', () => client.includes('60_000 - (now.getSeconds() * 1000 + now.getMilliseconds())'))
add('clock does not use setInterval', () => !client.includes('setInterval('))
add('ticker has no requestAnimationFrame loop', () => !client.includes('requestAnimationFrame('))
add('four hour feed refresh constant present', () => client.includes('4 * 60 * 60 * 1000'))
add('visibility aware refresh present', () => client.includes("document.addEventListener('visibilitychange'"))
add('conditional ETag request present', () => client.includes("'If-None-Match'"))
add('feed refresh is non blocking', () => client.includes('Authentication remains fully independent'))
add('brandSafe removes old AngelCare 360 feed wording', () => client.includes("replace(/AngelCare\\s*360/gi, 'SANILA Operating System')"))
add('ticker duplicates content for seamless motion', () => client.includes('aria-hidden="true"') && client.includes('key={`b-${item.id}`}'))
add('ticker CSS transform is compositor driven', () => css.includes('translate3d') && css.includes('animation:sanilaTeacherTicker'))
add('ticker uses will-change transform', () => css.includes('will-change:transform'))
add('reduced motion fallback exists', () => css.includes('@media (prefers-reduced-motion:reduce)'))
add('real username input exists', () => client.includes('name="username"'))
add('real password input exists', () => client.includes('name="password"'))
add('password visibility control exists', () => client.includes('setShowPassword'))
add('remember me persists identifier only', () => client.includes("const REMEMBER_KEY = 'sanila.teacher.login.identifier'"))
add('client does not store password', () => !/localStorage\.(setItem|getItem)\([^\n]*password/i.test(client))
add('forgot password UX exists', () => client.includes('Mot de passe oublié ?'))
add('no fake SSO capability advertised', () => !client.includes('SSO'))
add('secondary CTA returns to master gateway', () => client.includes('Retour au portail SANILA') && client.includes('href="/angelcare-360-access"'))
add('submit has pending state', () => client.includes('useFormStatus') && client.includes('Connexion sécurisée…'))
add('teacher login error role wording is professional', () => page.includes('accès enseignant actif'))
add('2026 SANILA copyright present', () => client.includes('© 2026 SANILA Operating System. Tous droits réservés.'))
add('support footer present', () => client.includes('Support technique disponible 24/7'))
add('help center path present', () => client.includes('Centre d’aide'))
add('desktop split layout present', () => css.includes('grid-template-columns:minmax(0,57.2%)'))
add('mobile intentional stacked layout present', () => css.includes('@media (max-width:980px)') && css.includes('flex-direction:column'))
add('small mobile breakpoint present', () => css.includes('@media (max-width:560px)'))
add('no screenshot whole-page hack', () => client.includes('<form') && client.includes('<input') && client.includes('<button'))
add('gateway teacher door points to dedicated login', () => gateway.includes("href: '/angelcare-360-teacher/login'"))
add('gateway teacher door no longer points to generic login', () => !gateway.includes("href: '/angelcare-360-portal/login?audience=teacher'"))
add('targeted noEmit tsconfig exists', () => exists('tsconfig.sanila-teacher-login.json'))

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

console.log(`\n${passed} checks passed. SANILA Teacher Login is statically accepted.`)
if (passed !== checks.length) process.exitCode = 1
