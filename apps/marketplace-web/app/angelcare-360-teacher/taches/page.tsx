import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getTeacherPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function TeacherTachesPage() {
  const snapshot = await getTeacherPortalSnapshot('tasks')
  return <PortalExperience kind="teacher" view="tasks" snapshot={snapshot} />
}
