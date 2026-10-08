import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { authenticatePortalCredentials } from '@/lib/angelcare360/portal/auth'
import SanilaStaffLoginExperience from '@/components/angelcare360/staff-auth/SanilaStaffLoginExperience'
import { getAngelcare360CustomerBroadcastSnapshot } from '@/lib/angelcare360/customer-broadcasts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'SANILA Operating System · Espace Équipe',
  description: 'Connexion sécurisée à votre espace professionnel SANILA.',
}

function normalizeStaffNext(value: string | undefined) {
  if (!value) return ''
  if (!value.startsWith('/angelcare-360-staff')) return ''
  if (value.startsWith('//') || value.includes('://')) return ''
  return value
}

function errorHref(error: 'missing' | 'invalid' | 'inactive' | 'role' | 'server', next: string) {
  const suffix = next ? `&next=${encodeURIComponent(next)}` : ''
  return `/angelcare-360-staff/login?error=${error}${suffix}`
}

export default async function SanilaStaffLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[]; next?: string | string[] }>
}) {
  const params = searchParams ? await searchParams : {}
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next
  const safeNext = normalizeStaffNext(nextParam)

  const loginError =
    errorCode === 'missing'
      ? 'Veuillez saisir votre identifiant et votre mot de passe.'
      : errorCode === 'invalid'
        ? 'Identifiant ou mot de passe incorrect.'
        : errorCode === 'inactive'
          ? 'Ce compte professionnel est suspendu ou inactif.'
          : errorCode === 'role'
            ? 'Ce compte ne dispose pas d’un accès Équipe actif.'
            : errorCode === 'server'
              ? 'La connexion sécurisée est momentanément indisponible. Réessayez dans quelques instants.'
              : null

  async function loginAction(formData: FormData) {
    'use server'
    const username = String(formData.get('username') || '')
    const password = String(formData.get('password') || '')
    const requestedNext = normalizeStaffNext(String(formData.get('next') || '').trim())
    const result = await authenticatePortalCredentials({
      username,
      password,
      requestedKind: 'staff',
      next: requestedNext,
    })
    if (!result.ok) redirect(errorHref(result.error, requestedNext))
    redirect(result.redirectTo)
  }

  const initialBroadcasts = await getAngelcare360CustomerBroadcastSnapshot()

  return (
    <SanilaStaffLoginExperience
      loginAction={loginAction}
      loginError={loginError}
      safeNext={safeNext}
      initialBroadcasts={initialBroadcasts}
    />
  )
}
