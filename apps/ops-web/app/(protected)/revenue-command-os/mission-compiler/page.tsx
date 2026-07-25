import { requireAccess } from '@/lib/auth/requireAccess'
import RevenueOperatingSpine from '../_components/operating-spine/RevenueOperatingSpine'

export const dynamic = 'force-dynamic'

export default async function MissionCompilerPage() {
  await requireAccess(['revenue_os.mission_compiler.view', 'revenue_os.mission_compiler.compile', 'revenue_os.manage'])
  return <RevenueOperatingSpine focus="compilation" />
}
