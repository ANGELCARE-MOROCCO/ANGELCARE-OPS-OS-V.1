import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStaffPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StaffHistoriquePage() {
  const snapshot = await getStaffPortalSnapshot('history')
  return <PortalExperience kind="staff" view="history" snapshot={snapshot} />
}
