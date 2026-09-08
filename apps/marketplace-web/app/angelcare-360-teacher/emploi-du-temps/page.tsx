import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getTeacherPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function TeacherEmploiDuTempsPage() {
  const snapshot = await getTeacherPortalSnapshot('timetable')
  return <PortalExperience kind="teacher" view="timetable" snapshot={snapshot} />
}
