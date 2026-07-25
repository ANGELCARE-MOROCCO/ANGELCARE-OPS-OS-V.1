import { requireAccess } from '@/lib/auth/requireAccess'
import RevenueOperatingSpine from '../_components/operating-spine/RevenueOperatingSpine'

export const dynamic = 'force-dynamic'

export default async function RevenueCommandCockpitPage() {
  await requireAccess(['revenue_os.cockpit.view', 'revenue_os.cockpit.executive_view', 'revenue_os.manage'])
  return <RevenueOperatingSpine focus="cockpit" />
}
