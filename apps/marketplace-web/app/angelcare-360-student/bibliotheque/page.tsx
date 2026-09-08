import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentBibliothequePage() {
  const snapshot = await getStudentPortalSnapshot('library')
  return <PortalExperience kind="student" view="library" snapshot={snapshot} />
}
