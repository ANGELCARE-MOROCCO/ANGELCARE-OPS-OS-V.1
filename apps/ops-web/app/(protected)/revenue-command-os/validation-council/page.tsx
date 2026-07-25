import { requireAccess } from '@/lib/auth/requireAccess'
import RevenueOperatingSpine from '../_components/operating-spine/RevenueOperatingSpine'

export const dynamic = 'force-dynamic'

export default async function ValidationCouncilPage() {
  await requireAccess(['revenue_os.council.view', 'revenue_os.council.run', 'revenue_os.manage'])
  return <RevenueOperatingSpine focus="council" />
}
