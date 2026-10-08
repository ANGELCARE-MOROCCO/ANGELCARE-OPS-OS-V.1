import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStaffPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StaffWorkflowsPage() {
  const snapshot = await getStaffPortalSnapshot('workflows')
  return <PortalExperience kind="staff" view="workflows" snapshot={snapshot} />
}
