import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getTeacherPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function TeacherNotesPage() {
  const snapshot = await getTeacherPortalSnapshot('marks')
  return <PortalExperience kind="teacher" view="marks" snapshot={snapshot} />
}
