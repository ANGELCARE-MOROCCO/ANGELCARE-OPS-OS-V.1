import ManagementAccountability from '@/components/angelcare360/operator/wave1/ManagementAccountability'
import { loadWave1ExecutiveData } from '@/components/angelcare360/operator/wave1/Wave1ExecutiveData'
import { requireAngelcare360OperatorPermission } from '@/lib/angelcare360/operator/access'

export const dynamic = 'force-dynamic'

export default async function ManagementAccountabilityPage() {
  await requireAngelcare360OperatorPermission('operator.service.view')
  return <ManagementAccountability data={await loadWave1ExecutiveData()} />
}
