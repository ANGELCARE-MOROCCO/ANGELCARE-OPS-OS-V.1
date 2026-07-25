import { requireAccess } from '@/lib/auth/requireAccess'
import RevenueOperatingSpine from '../_components/operating-spine/RevenueOperatingSpine'

export const dynamic = 'force-dynamic'

export default async function ExecutionAutopilotPage() {
  await requireAccess(['revenue_os.execution.view', 'revenue_os.execution.operate', 'revenue_os.manage'])
  return <RevenueOperatingSpine focus="execution" />
}
