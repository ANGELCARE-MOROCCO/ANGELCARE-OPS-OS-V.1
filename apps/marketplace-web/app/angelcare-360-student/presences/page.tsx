import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentPresencesPage() {
  const snapshot = await getStudentPortalSnapshot('attendance')
  return <PortalExperience kind="student" view="attendance" snapshot={snapshot} />
}
