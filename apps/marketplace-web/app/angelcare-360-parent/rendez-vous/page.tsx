import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentRendezVousPage() {
  const snapshot = await getParentPortalSnapshot('meetings')
  return <PortalExperience kind="parent" view="meetings" snapshot={snapshot} />
}
