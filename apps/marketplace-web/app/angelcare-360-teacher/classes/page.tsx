import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getTeacherPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function TeacherClassesPage() {
  const snapshot = await getTeacherPortalSnapshot('classes')
  return <PortalExperience kind="teacher" view="classes" snapshot={snapshot} />
}
