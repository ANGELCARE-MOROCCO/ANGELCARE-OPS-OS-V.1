import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentEmploiDuTempsPage() {
  const snapshot = await getStudentPortalSnapshot('timetable')
  return <PortalExperience kind="student" view="timetable" snapshot={snapshot} />
}
