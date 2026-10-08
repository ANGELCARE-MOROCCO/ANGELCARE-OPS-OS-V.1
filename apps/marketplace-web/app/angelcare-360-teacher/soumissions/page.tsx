import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getTeacherPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function TeacherSoumissionsPage() {
  const snapshot = await getTeacherPortalSnapshot('submissions')
  return <PortalExperience kind="teacher" view="submissions" snapshot={snapshot} />
}
