import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getTeacherPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function TeacherHomePage() {
  const snapshot = await getTeacherPortalSnapshot('today')
  return <PortalExperience kind="teacher" view="today" snapshot={snapshot} />
}
