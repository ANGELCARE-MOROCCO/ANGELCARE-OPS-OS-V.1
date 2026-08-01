import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listMissions,operationsSummary } from '@/angelcare-marketplace/operations-execution/repository'
import { OperationsCommand } from '@/angelcare-marketplace/operations-execution/components/OperationsCommand'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.view');const [summary,missions]=await Promise.all([operationsSummary(context),listMissions(context)]);return <OperationsCommand summary={summary} missions={missions}/>}
