import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentEvaluationsPage() {
  const snapshot = await getStudentPortalSnapshot('assessments')
  return <PortalExperience kind="student" view="assessments" snapshot={snapshot} />
}
