import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStaffPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StaffHomePage() {
  const snapshot = await getStaffPortalSnapshot('today')
  return <PortalExperience kind="staff" view="today" snapshot={snapshot} />
}
