import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { APP_SESSION_COOKIE } from '@/lib/auth/session'
import { getFirstAllowedRoute } from '@/lib/auth/permissions'
import OpsosLoginSessionCleaner from '@/components/auth/OpsosLoginSessionCleaner'
import { SecurePasswordField, SecureSubmitButton } from '@/components/auth/SecureAccessControls'
import styles from './login.module.css'

type LoginUser = {
  id: string
  role?: string | null
  permissions?: string[] | null
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[]; next?: string | string[] }>
}) {
  const params = searchParams ? await searchParams : {}
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error
  const requestedNext = Array.isArray(params.next) ? params.next[0] : params.next
  const safeNext =
    typeof requestedNext === 'string' &&
    requestedNext.startsWith('/') &&
    !requestedNext.startsWith('//') &&
    !requestedNext.includes('://')
      ? requestedNext
      : ''
  const loginError =
    errorCode === 'missing'
      ? 'Veuillez saisir le nom utilisateur et le mot de passe.'
      : errorCode === 'invalid'
        ? 'Identifiants incorrects.'
        : errorCode === 'server'
          ? 'Connexion indisponible pour le moment. Réessayez.'
          : null

  async function loginAction(formData: FormData) {
    'use server'

    const username = String(formData.get('username') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')
    const next = String(formData.get('next') || '').trim()
    const safeNext =
      next.startsWith('/') &&
      !next.startsWith('//') &&
      !next.includes('://')
        ? next
        : ''

    if (!username || !password) {
      redirect('/login?error=missing')
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc('login_app_user', {
      input_username: username,
      input_password: password,
    })

    if (error) {
      redirect('/login?error=invalid')
    }

    const rpcRow = Array.isArray(data) ? data[0] : data
    const rpcUserId =
      typeof rpcRow === 'string'
        ? rpcRow
        : rpcRow && typeof rpcRow === 'object' && 'id' in rpcRow
          ? String((rpcRow as LoginUser).id || '')
          : ''

    if (!rpcUserId) {
      redirect('/login?error=invalid')
    }

    const user = {
      id: rpcUserId,
      role: rpcRow && typeof rpcRow === 'object' && 'role' in rpcRow ? String((rpcRow as any).role || '') : null,
      permissions:
        rpcRow && typeof rpcRow === 'object' && Array.isArray((rpcRow as any).permissions)
          ? (rpcRow as any).permissions
          : [],
    } as LoginUser

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000)

    const { error: sessionError } = await supabase.from('app_sessions').insert({
      user_id: user.id,
      session_token: token,
      expires_at: expiresAt.toISOString(),
    })

    if (sessionError) {
      redirect('/login?error=server')
    }

    await supabase
      .from('app_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    const cookieStore = await cookies()

    cookieStore.set(APP_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    })

    const redirectTo = safeNext || getFirstAllowedRoute(user)
    redirect(redirectTo)
  }

  return (
    <>
      <OpsosLoginSessionCleaner />
      <main className={styles.page}>
        <div className={styles.background} aria-hidden="true" />
        <div className={styles.atmosphere} aria-hidden="true" />
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.orbitField} aria-hidden="true" />
        <div className={styles.scanline} aria-hidden="true" />

        <section className={styles.stage} aria-label="AngelCare SANILA OS secure access">
          <section className={styles.card}>
            <span className={`${styles.corner} ${styles.cornerTL}`} aria-hidden="true" />
            <span className={`${styles.corner} ${styles.cornerTR}`} aria-hidden="true" />
            <span className={`${styles.corner} ${styles.cornerBL}`} aria-hidden="true" />
            <span className={`${styles.corner} ${styles.cornerBR}`} aria-hidden="true" />

            <div className={styles.logoWrap}>
              <img
                className={styles.logo}
                src="/brand/angelcare-login-white.png"
                alt="AngelCare Kindergarten & Preschool"
              />
            </div>

            <p className={styles.systemName}>AngelCare SANILA OS</p>
            <h1 className={styles.title}>Secure Access Gateway</h1>

            <div className={styles.securityDivider} aria-hidden="true">
              <span className={styles.lockOrb}>
                <svg viewBox="0 0 24 24">
                  <rect x="6" y="10" width="12" height="10" rx="2" />
                  <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
                  <path d="M12 14v2.5" />
                </svg>
              </span>
            </div>

            {loginError ? <div className={styles.error}>{loginError}</div> : null}

            <form action={loginAction} className={styles.form}>
              <input type="hidden" name="next" value={safeNext} />

              <label className={styles.fieldShell}>
                <span className={styles.srOnly}>Username</span>
                <span className={styles.fieldIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="7.5" r="3.5" />
                    <path d="M5 20c.8-4.1 3.1-6.2 7-6.2s6.2 2.1 7 6.2" />
                  </svg>
                </span>
                <input
                  className={styles.fieldInput}
                  name="username"
                  placeholder="Username"
                  autoComplete="username"
                  aria-label="Username"
                />
                <span className={styles.fieldEnd} aria-hidden="true">•••</span>
              </label>

              <SecurePasswordField />
              <SecureSubmitButton />
            </form>

            <div className={styles.telemetry} aria-label="Access controls">
              <div className={styles.telemetryItem}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3 19 6v5c0 4.6-2.8 8-7 10-4.2-2-7-5.4-7-10V6l7-3Z" />
                  <path d="m9.5 12 1.7 1.7 3.5-4" />
                </svg>
                <div><strong>Session</strong><span>12H controlled</span></div>
              </div>
              <div className={styles.telemetryItem}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M4 12h16M12 4a13 13 0 0 1 0 16M12 4a13 13 0 0 0 0 16" />
                </svg>
                <div><strong>Internal</strong><span>Team gateway</span></div>
              </div>
              <div className={styles.telemetryItem}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="9" cy="8" r="3" />
                  <path d="M4 19c.7-3.7 2.4-5.5 5-5.5 1.5 0 2.7.5 3.6 1.5" />
                  <path d="M16 11.5 20 13v3c0 2.5-1.3 4.3-4 5.5-2.7-1.2-4-3-4-5.5v-3l4-1.5Z" />
                </svg>
                <div><strong>Role-aware</strong><span>Permission gated</span></div>
              </div>
            </div>

            <div className={styles.status}>
              <span className={styles.statusDot} aria-hidden="true" />
              <span>Access node ready</span>
            </div>
          </section>
        </section>

        <footer className={styles.footer} aria-hidden="true">
          <span>SANILA OS</span>
          <span>Copyright 2026</span>
        </footer>
      </main>
    </>
  )
}
