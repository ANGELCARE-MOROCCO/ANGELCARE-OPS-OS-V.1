import { notFound, redirect } from 'next/navigation'
import { createUserClient } from '@/lib/supabase/server'
import { getCustomerContext } from '@/angelcare-marketplace/customer-commerce/customer-auth'
import { customerReturnTo } from '@/angelcare-marketplace/customer-commerce/auth-navigation'
import { CustomerVerifiedExperience } from '@/angelcare-marketplace/customer-commerce/components/CustomerVerifiedExperience'
import type { CustomerAccessPageProps } from '@/angelcare-marketplace/customer-commerce/customer-access-page'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'

export const dynamic = 'force-dynamic'
export default async function Page({ params, searchParams }: CustomerAccessPageProps) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams])
  if (!['fr', 'en', 'ar'].includes(raw)) notFound()
  const locale = raw as CatalogLocale
  if (typeof query.code === 'string' || typeof query.token_hash === 'string') {
    const values = new URLSearchParams({ locale, flow: 'signup', returnTo: customerReturnTo(query.returnTo, locale) })
    for (const key of ['code', 'token_hash', 'type']) if (typeof query[key] === 'string') values.set(key, query[key])
    redirect(`/angelcare-marketplace/auth/callback?${values}`)
  }
  let state: 'confirmed' | 'invalid' | 'pending' = 'invalid'
  let destination = customerReturnTo(query.returnTo, locale)
  if (query.state !== 'invalid' && !query.error) {
    try {
      const client = await createUserClient(), { data: { user }, error } = await client.auth.getUser()
      if (!error && user?.email_confirmed_at) {
        destination = customerReturnTo(query.returnTo || user.user_metadata?.marketplace_return_to, locale)
        state = await getCustomerContext() && query.state !== 'pending' ? 'confirmed' : 'pending'
      }
    } catch { state = 'pending' }
  }
  return <CustomerVerifiedExperience locale={locale} returnTo={destination} state={state}/>
}
