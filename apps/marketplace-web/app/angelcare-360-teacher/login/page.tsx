import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SanilaTeacherLoginExperience from '@/components/angelcare360/teacher-auth/SanilaTeacherLoginExperience'
import { APP_SESSION_COOKIE, generateSessionToken } from '@/lib/ac360-portability/auth-session'
import { PORTAL_ROLE_KEYS } from '@/data/angelcare360/role-portals'
import { getAngelcare360CustomerBroadcastSnapshot } from '@/lib/angelcare360/customer-broadcasts'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'SANILA Operating System · Espace Enseignant',
  description: 'Connexion sécurisée à votre espace enseignant SANILA.',
}

function normalizeTeacherNext(value: string | undefined) {
  if (!value) return ''
  if (!value.startsWith('/angelcare-360-teacher')) return ''
  if (value.startsWith('//') || value.includes('://')) return ''
  return value
}

function errorHref(error: 'missing' | 'invalid' | 'inactive' | 'role' | 'server', next: string) {
  const suffix = next ? `&next=${encodeURIComponent(next)}` : ''
  return `/angelcare-360-teacher/login?error=${error}${suffix}`
}

export default async function SanilaTeacherLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[]; next?: string | string[] }>
}) {
  const params = searchParams ? await searchParams : {}
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next
  const safeNext = normalizeTeacherNext(nextParam)

  const loginError =
    errorCode === 'missing'
      ? 'Veuillez saisir votre identifiant et votre mot de passe.'
      : errorCode === 'invalid'
        ? 'Identifiant ou mot de passe incorrect.'
        : errorCode === 'inactive'
          ? 'Ce compte enseignant est suspendu ou inactif.'
          : errorCode === 'role'
            ? 'Ce compte ne dispose pas d’un accès enseignant actif.'
            : errorCode === 'server'
              ? 'La connexion sécurisée est momentanément indisponible. Réessayez dans quelques instants.'
              : null

  async function loginAction(formData: FormData) {
    'use server'

    const username = String(formData.get('username') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')
    const requestedNext = normalizeTeacherNext(String(formData.get('next') || '').trim())

    if (!username || !password) redirect(errorHref('missing', requestedNext))

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('login_app_user', {
      input_username: username,
      input_password: password,
    })

    if (error) redirect(errorHref('invalid', requestedNext))

    const row = Array.isArray(data) ? data[0] : data
    const userId =
      typeof row === 'string'
        ? row
        : row && typeof row === 'object' && 'id' in row
          ? String((row as { id?: string }).id || '')
          : ''

    if (!userId) redirect(errorHref('invalid', requestedNext))

    const { data: user } = await supabase
      .from('app_users')
      .select('id,role,status')
      .eq('id', userId)
      .maybeSingle()

    if (!user || user.status !== 'active') redirect(errorHref('inactive', requestedNext))

    const role = String(user.role || '').trim().toLowerCase()
    if (!PORTAL_ROLE_KEYS.teacher.includes(role)) redirect(errorHref('role', requestedNext))

    const token = generateSessionToken()
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000)
    const { error: sessionError } = await supabase.from('app_sessions').insert({
      user_id: userId,
      session_token: token,
      expires_at: expiresAt.toISOString(),
    })

    if (sessionError) redirect(errorHref('server', requestedNext))

    await supabase.from('app_users').update({ last_login_at: new Date().toISOString() }).eq('id', userId)

    const cookieStore = await cookies()
    cookieStore.set(APP_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    })

    redirect(requestedNext || '/angelcare-360-teacher')
  }

  const initialBroadcasts = await getAngelcare360CustomerBroadcastSnapshot()

  return (
    <SanilaTeacherLoginExperience
      loginAction={loginAction}
      loginError={loginError}
      safeNext={safeNext}
      initialBroadcasts={initialBroadcasts}
    />
  )
}
