import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentDemandesPage() {
  const snapshot = await getParentPortalSnapshot('requests')
  return <PortalExperience kind="parent" view="requests" snapshot={snapshot} />
}
