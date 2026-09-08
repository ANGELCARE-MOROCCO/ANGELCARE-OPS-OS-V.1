import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStaffPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StaffApprobationsPage() {
  const snapshot = await getStaffPortalSnapshot('approvals')
  return <PortalExperience kind="staff" view="approvals" snapshot={snapshot} />
}
