import BoardCommandMode from '@/components/angelcare360/operator/wave1/BoardCommandMode'
import { loadWave1ExecutiveData } from '@/components/angelcare360/operator/wave1/Wave1ExecutiveData'
import { requireAngelcare360OperatorPermission } from '@/lib/angelcare360/operator/access'

export const dynamic = 'force-dynamic'

export default async function BoardCommandPage() {
  await requireAngelcare360OperatorPermission('operator.audit.view')
  return <BoardCommandMode data={await loadWave1ExecutiveData()} />
}
