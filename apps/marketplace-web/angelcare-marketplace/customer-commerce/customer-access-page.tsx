import { notFound, redirect } from 'next/navigation'
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
  return <CustomerAuthExperience locale={locale} mode={mode} returnTo={destination} initialError={query.state === 'invalid' || typeof query.error === 'string'}/>
}
