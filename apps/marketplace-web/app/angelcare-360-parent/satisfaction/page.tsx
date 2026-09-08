import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentSatisfactionPage() {
  const snapshot = await getParentPortalSnapshot('satisfaction')
  return <PortalExperience kind="parent" view="satisfaction" snapshot={snapshot} />
}
