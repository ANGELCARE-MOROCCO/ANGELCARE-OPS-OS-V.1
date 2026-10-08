import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentMessagesPage() {
  const snapshot = await getStudentPortalSnapshot('messages')
  return <PortalExperience kind="student" view="messages" snapshot={snapshot} />
}
