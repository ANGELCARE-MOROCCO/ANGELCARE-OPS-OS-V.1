import { requireAngelcare360OperatorPermission } from '@/lib/angelcare360/operator/access'
import OperatorDemoControl from './OperatorDemoControl'

export const dynamic = 'force-dynamic'

export default async function OperatorDemoEnvironmentPage() {
  await requireAngelcare360OperatorPermission('operator.demo.environment.view')
  return <OperatorDemoControl />
}
