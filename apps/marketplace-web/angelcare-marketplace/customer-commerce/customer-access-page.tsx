import { notFound, redirect } from 'next/navigation'
import { createUserClient, createServiceClient } from '@/lib/supabase/server'
import { supportedSocialIdentity, completionHref } from './customer-social/contracts'
import type { CatalogLocale } from '../catalog-discovery/types'
import { customerReturnTo, type CustomerAuthMode } from './auth-navigation'
import { CustomerAuthExperience } from './components/CustomerAuthExperience'

export type CustomerAccessPageProps = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }
export async function CustomerAccessPage({ params, searchParams, mode }: CustomerAccessPageProps & { mode: CustomerAuthMode }) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams])
  if (!['fr', 'en', 'ar'].includes(raw)) notFound()
  const locale = raw as CatalogLocale, destination = customerReturnTo(query.returnTo, locale)
  if (typeof query.code === 'string' || typeof query.token_hash === 'string') {
    const values = new URLSearchParams({ locale, flow: mode === 'reset' ? 'recovery' : 'signup', returnTo: destination })
    for (const key of ['code', 'token_hash', 'type']) if (typeof query[key] === 'string') values.set(key, query[key])
    redirect(`/angelcare-marketplace/auth/callback?${values}`)
  }
  if (mode === 'login' || mode === 'register') {
    const client = await createUserClient(), auth = await client.auth.getUser(), user = auth.data.user
    if (!auth.error && user?.email_confirmed_at && supportedSocialIdentity(user)) {
      const db = await createServiceClient(), account = await db.from('angelcare_marketplace_customer_accounts').select('id').eq('auth_user_id', user.id).maybeSingle()
      if (!account.error && !account.data) redirect(completionHref(locale, destination))
    }
  }
  return <CustomerAuthExperience locale={locale} mode={mode} returnTo={destination} initialError={query.state === 'invalid' || typeof query.error === 'string' || query.socialError === '1'}/>
}
