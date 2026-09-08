import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentSoumissionsPage() {
  const snapshot = await getStudentPortalSnapshot('submissions')
  return <PortalExperience kind="student" view="submissions" snapshot={snapshot} />
}
