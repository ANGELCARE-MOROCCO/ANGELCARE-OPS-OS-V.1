import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStudentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentDevoirsPage() {
  const snapshot = await getStudentPortalSnapshot('homework')
  return <PortalExperience kind="student" view="homework" snapshot={snapshot} />
}
