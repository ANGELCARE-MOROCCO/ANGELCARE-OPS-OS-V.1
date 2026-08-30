import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listDefects,listTestRuns,qaSummary } from '@/angelcare-marketplace/launch-assurance/repository'
import { QaCommand } from '@/angelcare-marketplace/launch-assurance/components/QaCommand'
import { QaDefectDecisionDesk } from '@/angelcare-marketplace/launch-assurance/components/LaunchGovernanceDesk'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.qa.view');const [summary,runs,defects]=await Promise.all([qaSummary(),listTestRuns(),listDefects()]);return <><QaCommand summary={summary} runs={runs} defects={defects}/><QaDefectDecisionDesk defects={defects} canManage={hasMarketplacePermission(context,'marketplace.qa.defects.manage')}/></>}
