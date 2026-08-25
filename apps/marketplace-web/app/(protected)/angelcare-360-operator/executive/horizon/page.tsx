import ForwardHorizon from '@/components/angelcare360/operator/wave1/ForwardHorizon'
import { loadWave1ExecutiveData } from '@/components/angelcare360/operator/wave1/Wave1ExecutiveData'
import { requireAngelcare360OperatorPermission } from '@/lib/angelcare360/operator/access'

export const dynamic = 'force-dynamic'

export default async function ForwardHorizonPage() {
  await requireAngelcare360OperatorPermission('operator.renewals.view')
  return <ForwardHorizon data={await loadWave1ExecutiveData()} />
}
