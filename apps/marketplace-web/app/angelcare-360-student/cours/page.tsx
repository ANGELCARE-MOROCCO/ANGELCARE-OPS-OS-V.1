import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentCoursPage() {
  const snapshot = await getStudentPortalSnapshot('lessons')
  return <PortalExperience kind="student" view="lessons" snapshot={snapshot} />
}
