import { requireAccess } from '@/lib/auth/requireAccess'
import ExecutionAutopilotWorkspace from './_components/ExecutionAutopilotWorkspace'

export const dynamic = 'force-dynamic'

export default async function ExecutionAutopilotPage() {
  await requireAccess(['revenue_os.execution.view', 'revenue_os.execution.operate', 'revenue_os.manage'])
  return <ExecutionAutopilotWorkspace />
}
