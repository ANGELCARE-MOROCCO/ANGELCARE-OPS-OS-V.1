import { requireAccess } from '@/lib/auth/requireAccess'
import RevenueOperatingSpine from '../_components/operating-spine/RevenueOperatingSpine'

export const dynamic = 'force-dynamic'

export default async function MegaProductionPage() {
  await requireAccess(['revenue_os.mega_production.view', 'revenue_os.mega_production.manage', 'revenue_os.manage'])
  return <RevenueOperatingSpine focus="learning" />
}
