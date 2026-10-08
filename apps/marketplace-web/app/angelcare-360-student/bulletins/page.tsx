import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentBulletinsPage() {
  const snapshot = await getStudentPortalSnapshot('bulletins')
  return <PortalExperience kind="student" view="bulletins" snapshot={snapshot} />
}
