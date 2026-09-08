import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStaffPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StaffTicketsPage() {
  const snapshot = await getStaffPortalSnapshot('tickets')
  return <PortalExperience kind="staff" view="tickets" snapshot={snapshot} />
}
