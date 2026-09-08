import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStaffPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StaffPlanningPage() {
  const snapshot = await getStaffPortalSnapshot('schedule')
  return <PortalExperience kind="staff" view="schedule" snapshot={snapshot} />
}
