import { requireAccess } from '@/lib/auth/requireAccess'
import { StrategyStudioWorkspace } from './_components/StrategyStudioWorkspace'

export const dynamic = 'force-dynamic'

export default async function StrategyStudioPage() {
  await requireAccess(['revenue_os.strategy_studio.view', 'revenue_os.strategy_studio.review', 'revenue_os.manage'])
  return <main className="min-h-screen bg-slate-50 p-5 text-slate-950 lg:p-8"><StrategyStudioWorkspace /></main>
}
