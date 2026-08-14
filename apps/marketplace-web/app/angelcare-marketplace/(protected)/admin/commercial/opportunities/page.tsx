import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { OpportunityBoard } from '@/angelcare-marketplace/commercial-pipeline/components/CommercialCommand'
import { listAccounts, listOpportunities } from '@/angelcare-marketplace/commercial-pipeline/repository'
export default async function Page(){await requireMarketplacePageContext('marketplace.crm.view');const [opportunities,accounts]=await Promise.all([listOpportunities(),listAccounts()]);return <OpportunityBoard opportunities={opportunities} accounts={accounts}/>}
