import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { IncidentAuthorityClient } from '@/angelcare-marketplace/operations-execution/components/IncidentAuthorityClient'
import { listOperationsIncidents } from '@/angelcare-marketplace/operations-execution/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.view');return <IncidentAuthorityClient incidents={await listOperationsIncidents(context)}/>}
