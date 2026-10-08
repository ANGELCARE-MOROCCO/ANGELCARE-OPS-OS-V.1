import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getTeacherPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function TeacherMonTravailPage() {
  const snapshot = await getTeacherPortalSnapshot('work')
  return <PortalExperience kind="teacher" view="work" snapshot={snapshot} />
}
