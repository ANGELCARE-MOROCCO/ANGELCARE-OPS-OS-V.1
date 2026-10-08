import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentProfilPage() {
  const snapshot = await getStudentPortalSnapshot('profile')
  return <PortalExperience kind="student" view="profile" snapshot={snapshot} />
}
