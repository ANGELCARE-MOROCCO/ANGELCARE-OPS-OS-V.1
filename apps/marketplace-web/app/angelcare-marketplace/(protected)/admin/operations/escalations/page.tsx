import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { IncidentAuthorityClient } from '@/angelcare-marketplace/operations-execution/components/IncidentAuthorityClient'
import { listOperationsIncidents } from '@/angelcare-marketplace/operations-execution/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.view');const incidents=(await listOperationsIncidents(context)).filter(i=>['high','critical','emergency'].includes(i.severity)||!['resolved','closed'].includes(i.status));return <IncidentAuthorityClient incidents={incidents}/>}
