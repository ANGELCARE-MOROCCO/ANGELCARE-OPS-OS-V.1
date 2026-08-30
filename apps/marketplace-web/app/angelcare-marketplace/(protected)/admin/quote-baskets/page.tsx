import { redirect } from 'next/navigation'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'

export default async function Page() {
  await requireMarketplacePageContext('marketplace.quote_basket.view')
  redirect('/angelcare-marketplace/admin/commercial/quotes#quote-baskets')
}
