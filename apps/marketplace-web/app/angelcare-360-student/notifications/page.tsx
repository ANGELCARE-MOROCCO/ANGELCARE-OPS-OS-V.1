import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentNotificationsPage() {
  const snapshot = await getStudentPortalSnapshot('notifications')
  return <PortalExperience kind="student" view="notifications" snapshot={snapshot} />
}
