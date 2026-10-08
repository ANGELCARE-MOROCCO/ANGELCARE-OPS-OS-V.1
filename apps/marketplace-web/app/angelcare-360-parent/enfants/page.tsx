import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentEnfantsPage() {
  const snapshot = await getParentPortalSnapshot('children')
  return <PortalExperience kind="parent" view="children" snapshot={snapshot} />
}
