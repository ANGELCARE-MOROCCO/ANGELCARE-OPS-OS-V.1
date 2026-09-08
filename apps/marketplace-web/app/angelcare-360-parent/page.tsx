import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentHomePage() {
  const snapshot = await getParentPortalSnapshot('home')
  return <PortalExperience kind="parent" view="home" snapshot={snapshot} />
}
