import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentAujourdhuiPage() {
  const snapshot = await getParentPortalSnapshot('today')
  return <PortalExperience kind="parent" view="today" snapshot={snapshot} />
}
