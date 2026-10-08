import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStaffPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StaffCongesPage() {
  const snapshot = await getStaffPortalSnapshot('leave')
  return <PortalExperience kind="staff" view="leave" snapshot={snapshot} />
}
