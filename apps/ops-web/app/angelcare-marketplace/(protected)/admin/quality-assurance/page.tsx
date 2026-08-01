import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listDefects,listTestRuns,qaSummary } from '@/angelcare-marketplace/launch-assurance/repository'
import { QaCommand } from '@/angelcare-marketplace/launch-assurance/components/QaCommand'
export default async function Page(){await requireMarketplacePageContext('marketplace.qa.view');const [summary,runs,defects]=await Promise.all([qaSummary(),listTestRuns(),listDefects()]);return <QaCommand summary={summary} runs={runs} defects={defects}/>}