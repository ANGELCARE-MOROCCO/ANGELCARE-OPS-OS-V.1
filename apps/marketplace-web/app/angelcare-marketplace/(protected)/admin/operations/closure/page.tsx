import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { DailyClosureBoard } from '@/angelcare-marketplace/operations-execution/components/DailyClosureBoard'
import { operationsSummary } from '@/angelcare-marketplace/operations-execution/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.view');return <DailyClosureBoard summary={await operationsSummary(context)} canApprove={hasMarketplacePermission(context,'marketplace.operations.closure.approve')}/>}
