import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { QuoteRegistry } from '@/angelcare-marketplace/commercial-pipeline/components/QuoteRegistry'
import { listOpportunities, listQuotes } from '@/angelcare-marketplace/commercial-pipeline/repository'
import { listQuoteBaskets } from '@/angelcare-marketplace/marketplace-core/repository'

export default async function Page() {
  const context = await requireMarketplacePageContext('marketplace.crm.quotes.view')
  const [quotes, opportunities, baskets] = await Promise.all([
    listQuotes(),
    listOpportunities(),
    listQuoteBaskets(context),
  ])

  return (
    <QuoteRegistry
      quotes={quotes}
      opportunities={opportunities}
      baskets={baskets}
      canManage={hasMarketplacePermission(context, 'marketplace.crm.quotes.manage')}
      canApprove={hasMarketplacePermission(context, 'marketplace.crm.quotes.approve')}
    />
  )
}
