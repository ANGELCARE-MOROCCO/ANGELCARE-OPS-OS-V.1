import CustomerValueCommand from '@/components/angelcare360/operator/wave1/CustomerValueCommand'
import { loadWave1ExecutiveData } from '@/components/angelcare360/operator/wave1/Wave1ExecutiveData'
import { requireAngelcare360OperatorPermission } from '@/lib/angelcare360/operator/access'

export const dynamic = 'force-dynamic'

export default async function CustomerValueExecutivePage() {
  await requireAngelcare360OperatorPermission('operator.clients.view')
  return <CustomerValueCommand data={await loadWave1ExecutiveData()} />
}
