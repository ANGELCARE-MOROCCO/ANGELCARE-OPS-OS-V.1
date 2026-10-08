import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentHomePage() {
  const snapshot = await getStudentPortalSnapshot('today')
  return <PortalExperience kind="student" view="today" snapshot={snapshot} />
}
