import { requireAccess } from '@/lib/auth/requireAccess'
import { StrategyStudioWorkspace } from './_components/StrategyStudioWorkspace'

export const dynamic = 'force-dynamic'

export default async function StrategyStudioPage() {
  await requireAccess(['revenue_os.strategy_studio.view', 'revenue_os.strategy_studio.review', 'revenue_os.manage'])
  return <div data-revenue-workspace="strategy-studio"><StrategyStudioWorkspace /></div>
}
