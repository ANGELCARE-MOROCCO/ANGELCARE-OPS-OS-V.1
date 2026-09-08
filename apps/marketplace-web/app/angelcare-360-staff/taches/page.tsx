import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStaffPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StaffTachesPage() {
  const snapshot = await getStaffPortalSnapshot('tasks')
  return <PortalExperience kind="staff" view="tasks" snapshot={snapshot} />
}
