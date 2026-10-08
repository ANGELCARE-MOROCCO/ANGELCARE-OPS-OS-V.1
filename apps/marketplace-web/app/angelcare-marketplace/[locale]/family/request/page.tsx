import { redirect } from 'next/navigation'
import { familyRequestHref, familyRequestNeed } from '@/angelcare-marketplace/families-storefront/experience'

import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
import { requireCustomerPageContext } from '@/angelcare-marketplace/customer-commerce/customer-auth'

export const dynamic = 'force-dynamic'

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams])
  const need = familyRequestNeed(query.need)
  const locale = (rawLocale === 'en' || rawLocale === 'ar' ? rawLocale : 'fr') as CatalogLocale
  const returnTo = familyRequestHref(locale, need || undefined)
  await requireCustomerPageContext(locale, returnTo)
  redirect('/angelcare-marketplace/family/request' + (need ? '?need=' + encodeURIComponent(need) : ''))
}
