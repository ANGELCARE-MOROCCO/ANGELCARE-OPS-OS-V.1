import RevenueExecutiveCommand from '@/components/angelcare360/operator/wave1/RevenueExecutiveCommand'
import { loadWave1ExecutiveData } from '@/components/angelcare360/operator/wave1/Wave1ExecutiveData'
import { requireAngelcare360OperatorPermission } from '@/lib/angelcare360/operator/access'

export const dynamic = 'force-dynamic'

export default async function RevenueExecutivePage() {
  await requireAngelcare360OperatorPermission('operator.billing.view')
  return <RevenueExecutiveCommand data={await loadWave1ExecutiveData()} />
}
