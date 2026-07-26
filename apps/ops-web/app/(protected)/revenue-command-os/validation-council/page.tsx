import { requireAccess } from '@/lib/auth/requireAccess'
import { CouncilWorkspace } from './_components/CouncilWorkspace'

export const dynamic = 'force-dynamic'

export default async function ValidationCouncilPage() {
  await requireAccess(['revenue_os.council.view', 'revenue_os.council.run', 'revenue_os.manage'])
  return <div data-revenue-workspace="validation-council"><CouncilWorkspace /></div>
}
