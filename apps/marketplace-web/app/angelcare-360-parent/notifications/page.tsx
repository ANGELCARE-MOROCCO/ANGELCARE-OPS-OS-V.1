import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentNotificationsPage() {
  const snapshot = await getParentPortalSnapshot('notifications')
  return <PortalExperience kind="parent" view="notifications" snapshot={snapshot} />
}
