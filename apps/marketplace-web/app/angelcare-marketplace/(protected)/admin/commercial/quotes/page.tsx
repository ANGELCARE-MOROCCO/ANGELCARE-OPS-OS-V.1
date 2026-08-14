import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { QuoteRegistry } from '@/angelcare-marketplace/commercial-pipeline/components/QuoteRegistry'
import { listOpportunities, listQuotes } from '@/angelcare-marketplace/commercial-pipeline/repository'
export default async function Page(){await requireMarketplacePageContext('marketplace.crm.quotes.view');const [quotes,opportunities]=await Promise.all([listQuotes(),listOpportunities()]);return <QuoteRegistry quotes={quotes} opportunities={opportunities}/>}
