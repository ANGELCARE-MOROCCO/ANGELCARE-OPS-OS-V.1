import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentTransportPage() {
  const snapshot = await getParentPortalSnapshot('transport')
  return <PortalExperience kind="parent" view="transport" snapshot={snapshot} />
}
