import { APP_SESSION_COOKIE_DOMAIN } from '@/lib/auth/session'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Angelcare360CustomerLoginExperience from '@/components/angelcare360/auth/Angelcare360CustomerLoginExperience'
import {
  APP_SESSION_COOKIE,
  generateSessionToken,
} from '@/lib/ac360-portability/auth-session'
import { getAngelcare360CustomerBroadcastSnapshot } from '@/lib/angelcare360/customer-broadcasts'
import { createClient } from '@/lib/supabase/server'

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

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'AngelCare 360 · Connexion établissement',
  description: 'SANILA Operating System · Pilotage établissement scolaire.',
}


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

export default async function Angelcare360CustomerLoginPage({
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
      ? 'Veuillez saisir votre identifiant et votre mot de passe.'
      : errorCode === 'invalid'
        ? 'Identifiant ou mot de passe incorrect.'
        : errorCode === 'server'
          ? 'La connexion sécurisée est momentanément indisponible. Réessayez dans quelques instants.'
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

    // Remove the legacy host-only session before issuing the shared session.
    cookieStore.set(APP_SESSION_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    })
    cookieStore.set(APP_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      ...(APP_SESSION_COOKIE_DOMAIN
        ? { domain: APP_SESSION_COOKIE_DOMAIN }
        : {}),
      expires: expiresAt,
    })

    redirect(requestedNext || defaultInternalRoute(user))
  }

  const initialBroadcasts = await getAngelcare360CustomerBroadcastSnapshot()

  return (
    <Angelcare360CustomerLoginExperience
      loginAction={loginAction}
      loginError={loginError}
      safeNext={safeNext}
      initialBroadcasts={initialBroadcasts}
    />
  )
}
