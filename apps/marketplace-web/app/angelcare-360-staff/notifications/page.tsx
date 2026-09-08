import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStaffPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StaffNotificationsPage() {
  const snapshot = await getStaffPortalSnapshot('notifications')
  return <PortalExperience kind="staff" view="notifications" snapshot={snapshot} />
}
