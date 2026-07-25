import { requireAccess } from '@/lib/auth/requireAccess'
import RevenueOperatingSpine from '../_components/operating-spine/RevenueOperatingSpine'

export const dynamic = 'force-dynamic'

export default async function StrategyStudioPage() {
  await requireAccess(['revenue_os.strategy_studio.view', 'revenue_os.strategy_studio.review', 'revenue_os.manage'])
  return <RevenueOperatingSpine focus="decision" />
}
