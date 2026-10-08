import { createServiceClient, createUserClient } from '@/lib/supabase/server'
import type { CatalogLocale } from '../catalog-discovery/types'
import { customerAuthHref, customerReturnTo } from './auth-navigation'
import { localeValue } from './validation'
import { cookies } from 'next/headers'
import { claimGuestCommerce, getCustomerContext } from './customer-auth'

export function customerPublicOrigin(request: Request): string {
  for (const configured of [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_APP_URL]) {
    if (!configured?.trim()) continue
    try { const candidate = new URL(configured.trim()); if (candidate.protocol === 'https:' || candidate.protocol === 'http:') return candidate.origin } catch { /* try the next configured origin */ }
  }
  return new URL(request.url).origin
}
export function customerCallbackUrl(request: Request, locale: CatalogLocale, flow: 'signup' | 'recovery' | 'magic', returnTo: unknown): string {
  const url = new URL('/angelcare-marketplace/auth/callback', customerPublicOrigin(request))
  url.searchParams.set('locale', locale); url.searchParams.set('flow', flow); url.searchParams.set('returnTo', customerReturnTo(returnTo, locale))
  return url.toString()
}
/** Only Auth-verified identity can activate a customer record; never reopen suspended/closed accounts. */
export async function syncCustomerConfirmation(user: { id: string; email_confirmed_at?: string; user_metadata?: Record<string, unknown> }): Promise<boolean> {
  if (!user.email_confirmed_at) return false
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_customer_accounts').update({ status: 'active', email_verified_at: user.email_confirmed_at, updated_at: new Date().toISOString() }).eq('auth_user_id', user.id).in('status', ['active', 'pending_verification']).select('id').maybeSingle()
  return !error && Boolean(data)
}
export async function handleCustomerConfirmation(request: Request): Promise<Response> {
  const url = new URL(request.url)
  let locale = localeValue(url.searchParams.get('locale'))
  const flow = url.searchParams.get('flow') || (url.searchParams.get('type') === 'recovery' ? 'recovery' : url.searchParams.get('type') === 'magiclink' ? 'magic' : 'signup')
  const invalid = () => {
    const target = new URL(customerAuthHref(locale, flow === 'recovery' ? 'recover' : flow === 'magic' ? 'login' : 'verified', url.searchParams.get('returnTo')), customerPublicOrigin(request))
    target.searchParams.set('state', 'invalid')
    return new Response(null, { status: 303, headers: { Location: target.toString(), 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } })
  }
  if (url.searchParams.has('error')) return invalid()
  try {
    const client = await createUserClient()
    const code = url.searchParams.get('code'), tokenHash = url.searchParams.get('token_hash'), type = url.searchParams.get('type')
    let user: { id: string; email_confirmed_at?: string; user_metadata?: Record<string, unknown> } | null = null
    if (code) {
      const result = await client.auth.exchangeCodeForSession(code)
      if (result.error) return invalid()
      user = result.data.user
    } else if (tokenHash && (type === 'email' || type === 'recovery' || type === 'magiclink' || type === 'signup')) {
      const result = await client.auth.verifyOtp({ token_hash: tokenHash, type })
      if (result.error) return invalid()
      user = result.data.user
    } else return invalid()
    if (!user?.id) return invalid()
    if (!url.searchParams.has('locale')) locale = localeValue(user.user_metadata?.locale)
    const destination = customerReturnTo(url.searchParams.get('returnTo') || url.searchParams.get('next') || (flow === 'signup' ? user.user_metadata?.marketplace_return_to : null), locale)
    let ready = await syncCustomerConfirmation(user)
    if (ready) {
      try {
        const context = await getCustomerContext()
        const visitor = (await cookies()).get('ac_marketplace_visitor')?.value
        if (context && visitor && /^[a-f\d-]{36}$/i.test(visitor)) await claimGuestCommerce({ visitorReference: visitor, account: context.account })
      } catch { ready = false }
    }
    const target = new URL(flow === 'recovery' && ready ? customerAuthHref(locale, 'reset', destination) : flow === 'magic' && ready ? destination : customerAuthHref(locale, 'verified', destination), customerPublicOrigin(request))
    if (flow !== 'magic' || !ready) target.searchParams.set('state', ready ? 'confirmed' : 'pending')
    const response = new Response(null, { status: 303, headers: { Location: target.toString(), 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } })
    return response
  } catch { return invalid() }
}
