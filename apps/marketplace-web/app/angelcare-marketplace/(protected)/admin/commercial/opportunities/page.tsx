import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { OpportunityBoard } from '@/angelcare-marketplace/commercial-pipeline/components/CommercialCommand'
import { OpportunityLifecycleDesk } from '@/angelcare-marketplace/commercial-pipeline/components/CommercialActionClient'
import { listOpportunities } from '@/angelcare-marketplace/commercial-pipeline/repository'
export default async function Page(){await requireMarketplacePageContext('marketplace.crm.view');const opportunities=await listOpportunities();return <><OpportunityLifecycleDesk opportunities={opportunities}/><OpportunityBoard opportunities={opportunities}/></>}
