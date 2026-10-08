import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getTeacherPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function TeacherRelationFamillesPage() {
  const snapshot = await getTeacherPortalSnapshot('families')
  return <PortalExperience kind="teacher" view="families" snapshot={snapshot} />
}
