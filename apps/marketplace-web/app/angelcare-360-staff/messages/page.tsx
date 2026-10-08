import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStaffPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StaffMessagesPage() {
  const snapshot = await getStaffPortalSnapshot('messages')
  return <PortalExperience kind="staff" view="messages" snapshot={snapshot} />
}
