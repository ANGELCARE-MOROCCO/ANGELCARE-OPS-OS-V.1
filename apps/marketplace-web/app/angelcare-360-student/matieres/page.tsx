import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentMatieresPage() {
  const snapshot = await getStudentPortalSnapshot('subjects')
  return <PortalExperience kind="student" view="subjects" snapshot={snapshot} />
}
