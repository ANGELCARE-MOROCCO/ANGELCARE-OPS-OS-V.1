import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { IncidentCommand } from '@/angelcare-marketplace/operations-execution/components/IncidentCommand'
import { listMissions } from '@/angelcare-marketplace/operations-execution/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.view');void await listMissions(context);return <IncidentCommand incidents={[]}/>}
