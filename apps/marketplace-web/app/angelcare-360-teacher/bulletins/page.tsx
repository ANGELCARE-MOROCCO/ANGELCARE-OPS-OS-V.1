import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getTeacherPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function TeacherBulletinsPage() {
  const snapshot = await getTeacherPortalSnapshot('bulletins')
  return <PortalExperience kind="teacher" view="bulletins" snapshot={snapshot} />
}
