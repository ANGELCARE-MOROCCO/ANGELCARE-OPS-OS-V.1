import ServiceExecutiveCommand from '@/components/angelcare360/operator/wave1/ServiceExecutiveCommand'
import { loadWave1ExecutiveData } from '@/components/angelcare360/operator/wave1/Wave1ExecutiveData'
import { requireAngelcare360OperatorPermission } from '@/lib/angelcare360/operator/access'

export const dynamic = 'force-dynamic'

export default async function ServiceExecutivePage() {
  await requireAngelcare360OperatorPermission('operator.service.view')
  return <ServiceExecutiveCommand data={await loadWave1ExecutiveData()} />
}
