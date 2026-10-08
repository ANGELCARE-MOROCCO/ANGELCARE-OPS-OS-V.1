import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentDocumentsPage() {
  const snapshot = await getStudentPortalSnapshot('documents')
  return <PortalExperience kind="student" view="documents" snapshot={snapshot} />
}
