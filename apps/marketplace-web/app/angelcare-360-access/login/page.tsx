import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import {
  APP_SESSION_COOKIE,
  generateSessionToken,
} from '@/lib/ac360-portability/auth-session'

type LoginUser = {
  id: string
  role?: string | null
  permissions?: string[] | null
}

const OPERATOR_ROLES = new Set([
  'ceo',
  'owner',
  'super_admin',
  'operator_admin',
  'account_manager',
  'finance_operator',
  'support_operator',
  'implementation_manager',
])

function normalizeNext(value: string | undefined) {
  if (!value) return ''
  if (!value.startsWith('/')) return ''
  if (value.startsWith('//')) return ''
  if (value.includes('://')) return ''
  return value
}

function hasOperatorPermission(permissions: string[]) {
  return permissions.some((raw) => {
    const permission = String(raw || '').trim()
    return (
      permission === '*' ||
      permission === 'operator.*' ||
      permission === 'angelcare360.operator.*' ||
      permission.startsWith('operator.') ||
      permission.startsWith('angelcare360.operator.')
    )
  })
}

function defaultInternalRoute(user: LoginUser) {
  const role = String(user.role || '').trim().toLowerCase()
  const permissions = Array.isArray(user.permissions) ? user.permissions : []

  if (OPERATOR_ROLES.has(role) || hasOperatorPermission(permissions)) {
    return '/angelcare-360-operator'
  }

  return '/angelcare-360-command-center'
}

function errorHref(error: 'missing' | 'invalid' | 'server', next: string) {
  const suffix = next ? `&next=${encodeURIComponent(next)}` : ''
  return `/angelcare-360-access/login?error=${error}${suffix}`
}

export default async function Angelcare360InternalLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string | string[]
    next?: string | string[]
  }>
}) {
  const params = searchParams ? await searchParams : {}
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next
  const safeNext = normalizeNext(nextParam)

  const loginError =
    errorCode === 'missing'
      ? 'Veuillez saisir votre nom utilisateur et votre mot de passe.'
      : errorCode === 'invalid'
        ? 'Identifiants internes incorrects.'
        : errorCode === 'server'
          ? 'Connexion interne indisponible pour le moment. Réessayez.'
          : null

  async function loginAction(formData: FormData) {
    'use server'

    const username = String(formData.get('username') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')
    const requestedNext = normalizeNext(String(formData.get('next') || '').trim())

    if (!username || !password) {
      redirect(errorHref('missing', requestedNext))
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc('login_app_user', {
      input_username: username,
      input_password: password,
    })

    if (error) {
      redirect(errorHref('invalid', requestedNext))
    }

    const rpcRow = Array.isArray(data) ? data[0] : data

    const rpcUserId =
      typeof rpcRow === 'string'
        ? rpcRow
        : rpcRow && typeof rpcRow === 'object' && 'id' in rpcRow
          ? String((rpcRow as LoginUser).id || '')
          : ''

    if (!rpcUserId) {
      redirect(errorHref('invalid', requestedNext))
    }

    const user: LoginUser = {
      id: rpcUserId,
      role:
        rpcRow && typeof rpcRow === 'object' && 'role' in rpcRow
          ? String((rpcRow as LoginUser).role || '')
          : null,
      permissions:
        rpcRow &&
        typeof rpcRow === 'object' &&
        Array.isArray((rpcRow as LoginUser).permissions)
          ? (rpcRow as LoginUser).permissions
          : [],
    }

    const token = generateSessionToken()
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000)

    const { error: sessionError } = await supabase.from('app_sessions').insert({
      user_id: user.id,
      session_token: token,
      expires_at: expiresAt.toISOString(),
    })

    if (sessionError) {
      redirect(errorHref('server', requestedNext))
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

    redirect(requestedNext || defaultInternalRoute(user))
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px 20px',
        background:
          'radial-gradient(circle at top left, rgba(16,67,118,.08), transparent 34%), linear-gradient(180deg,#f7fafc 0%,#eef4f8 100%)',
        color: '#122033',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 470,
          border: '1px solid #dce6ee',
          borderRadius: 22,
          background: '#fff',
          boxShadow: '0 24px 70px rgba(21,44,68,.12)',
          padding: 34,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 999,
            background: '#eef5fa',
            border: '1px solid #d8e6f0',
            padding: '7px 11px',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '.08em',
            color: '#29577c',
          }}
        >
          ANGELCARE 360 · INTERNAL ACCESS
        </div>

        <h1 style={{ margin: '22px 0 8px', fontSize: 31, lineHeight: 1.1 }}>
          Connexion opérateur
        </h1>

        <p style={{ margin: '0 0 26px', lineHeight: 1.55, color: '#637387' }}>
          Accès interne réservé aux utilisateurs AngelCare autorisés. Utilisez
          votre nom utilisateur OpsOS — par exemple <strong>ceo</strong> — et
          votre mot de passe interne.
        </p>

        {loginError ? (
          <div
            style={{
              marginBottom: 18,
              borderRadius: 12,
              border: '1px solid #efcaca',
              background: '#fff4f4',
              padding: '11px 13px',
              color: '#9d2929',
              fontSize: 14,
            }}
          >
            {loginError}
          </div>
        ) : null}

        <form action={loginAction} style={{ display: 'grid', gap: 17 }}>
          <input type="hidden" name="next" value={safeNext} />

          <label style={{ display: 'grid', gap: 7 }}>
            <span style={{ fontSize: 13, fontWeight: 750 }}>Nom utilisateur</span>
            <input
              name="username"
              autoComplete="username"
              placeholder="ex: ceo"
              required
              style={{
                height: 48,
                borderRadius: 12,
                border: '1px solid #cfdce6',
                padding: '0 14px',
                fontSize: 15,
                outline: 'none',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 7 }}>
            <span style={{ fontSize: 13, fontWeight: 750 }}>Mot de passe</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              style={{
                height: 48,
                borderRadius: 12,
                border: '1px solid #cfdce6',
                padding: '0 14px',
                fontSize: 15,
                outline: 'none',
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              marginTop: 3,
              height: 50,
              border: 0,
              borderRadius: 12,
              background: '#173f63',
              color: '#fff',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Ouvrir AngelCare 360
          </button>
        </form>

        <div
          style={{
            marginTop: 22,
            borderTop: '1px solid #edf1f4',
            paddingTop: 17,
            color: '#778695',
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          Session interne AngelCare · rôle contrôlé · cookie sécurisé
          <br />
          Cette page est distincte de la connexion client Marketplace.
        </div>
      </section>
    </main>
  )
}
