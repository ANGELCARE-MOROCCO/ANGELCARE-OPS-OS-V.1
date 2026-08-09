import { redirect } from 'next/navigation'

import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
import { requireCustomerPageContext } from '@/angelcare-marketplace/customer-commerce/customer-auth'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale = (rawLocale === 'en' || rawLocale === 'ar' ? rawLocale : 'fr') as CatalogLocale
  const returnTo = `/angelcare-marketplace/${locale}/family/diagnostic`
  await requireCustomerPageContext(locale, returnTo)
  redirect('/angelcare-marketplace/family/diagnostic')
}
