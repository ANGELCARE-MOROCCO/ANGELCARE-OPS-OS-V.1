import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentAidePage() {
  const snapshot = await getParentPortalSnapshot('support')
  return <PortalExperience kind="parent" view="support" snapshot={snapshot} />
}
