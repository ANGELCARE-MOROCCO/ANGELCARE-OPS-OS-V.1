import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { QuoteRegistry } from '@/angelcare-marketplace/commercial-pipeline/components/QuoteRegistry'
import { QuoteLifecycleDesk } from '@/angelcare-marketplace/commercial-pipeline/components/CommercialActionClient'
import { listOpportunities,listQuotes } from '@/angelcare-marketplace/commercial-pipeline/repository'
export default async function Page(){await requireMarketplacePageContext('marketplace.crm.quotes.view');const [quotes,opportunities]=await Promise.all([listQuotes(),listOpportunities()]);return <><QuoteLifecycleDesk quotes={quotes} opportunities={opportunities}/><QuoteRegistry quotes={quotes}/></>}
