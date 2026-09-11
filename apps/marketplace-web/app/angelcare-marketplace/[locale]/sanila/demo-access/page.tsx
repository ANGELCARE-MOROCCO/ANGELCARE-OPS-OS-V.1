import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { authorizeDemoPin, DEMO_COOKIE } from '@/lib/sanila-demo/authority'
import { APP_SESSION_COOKIE, APP_SESSION_COOKIE_DOMAIN } from '@/lib/auth/session'
import SanilaDemoAccessExperience from '@/components/angelcare360/auth/SanilaDemoAccessExperience'
import { getAngelcare360CustomerBroadcastSnapshot } from '@/lib/angelcare360/customer-broadcasts'

export const dynamic = 'force-dynamic'

export default async function SanilaDemoAccessPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const error = (await searchParams)?.error
  async function submit(formData: FormData) {
    'use server'
    const pin = String(formData.get('pin') || '').replace(/\s+/g, '')
    if (!/^\d{8}$/.test(pin)) redirect('/angelcare-marketplace/fr/sanila/demo-access?error=invalid')
    const requestHeaders = await headers()
    const result = await authorizeDemoPin(pin, { ip: requestHeaders.get('x-forwarded-for'), userAgent: requestHeaders.get('user-agent') })
    if (!result.ok) redirect('/angelcare-marketplace/fr/sanila/demo-access?error=invalid')
    const store = await cookies()
    const expired = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', expires: new Date(0) }
    // Entering Master Demo is an explicit principal switch. Remove any previous
    // password-authenticated or delegated context so it cannot reappear when
    // the demo cookie expires or is revoked.
    store.set(APP_SESSION_COOKIE, '', expired)
    if (APP_SESSION_COOKIE_DOMAIN) store.set(APP_SESSION_COOKIE, '', { ...expired, domain: APP_SESSION_COOKIE_DOMAIN })
    store.delete('sanila_portal_kind')
    store.delete('sanila_portal_person')
    store.delete('sanila_portal_school')
    store.set('angelcare360_support_access', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/angelcare-360-command-center', expires: new Date(0) })
    store.set(DEMO_COOKIE, result.sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', priority: 'high', path: '/', maxAge: Math.max(60, Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000)) })
    redirect('/angelcare-360-command-center')
  }
  const initialBroadcasts = await getAngelcare360CustomerBroadcastSnapshot()
  return <SanilaDemoAccessExperience demoAction={submit} hasError={Boolean(error)} initialBroadcasts={initialBroadcasts} />
}
