import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listMissions } from '@/angelcare-marketplace/operations-execution/repository'
import { DispatchBoard } from '@/angelcare-marketplace/operations-execution/components/DispatchBoard'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.dispatch.manage');return <DispatchBoard missions={await listMissions(context)}/>}
