import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStaffPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StaffEquipePage() {
  const snapshot = await getStaffPortalSnapshot('team')
  return <PortalExperience kind="staff" view="team" snapshot={snapshot} />
}
