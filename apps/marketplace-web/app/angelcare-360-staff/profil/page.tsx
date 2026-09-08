import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getStaffPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StaffProfilPage() {
  const snapshot = await getStaffPortalSnapshot('profile')
  return <PortalExperience kind="staff" view="profile" snapshot={snapshot} />
}
