import { requireAccess } from '@/lib/auth/requireAccess'
import RevenueOperatingSpine from '../_components/operating-spine/RevenueOperatingSpine'

export const dynamic = 'force-dynamic'

export default async function StrategyEnginePage() {
  await requireAccess(['revenue_os.strategy.view', 'revenue_os.strategy.manage', 'revenue_os.manage'])
  return <RevenueOperatingSpine focus="strategy" />
}
