import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentResultatsPage() {
  const snapshot = await getStudentPortalSnapshot('results')
  return <PortalExperience kind="student" view="results" snapshot={snapshot} />
}
