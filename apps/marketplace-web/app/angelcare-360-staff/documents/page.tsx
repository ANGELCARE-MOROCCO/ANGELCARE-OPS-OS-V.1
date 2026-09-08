import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStaffPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StaffDocumentsPage() {
  const snapshot = await getStaffPortalSnapshot('documents')
  return <PortalExperience kind="staff" view="documents" snapshot={snapshot} />
}
