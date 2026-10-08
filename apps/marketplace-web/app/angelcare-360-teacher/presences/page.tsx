import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getTeacherPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function TeacherPresencesPage() {
  const snapshot = await getTeacherPortalSnapshot('attendance')
  return <PortalExperience kind="teacher" view="attendance" snapshot={snapshot} />
}
