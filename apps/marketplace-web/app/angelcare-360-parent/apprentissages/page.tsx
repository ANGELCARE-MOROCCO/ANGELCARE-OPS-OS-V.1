import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentApprentissagesPage() {
  const snapshot = await getParentPortalSnapshot('learning')
  return <PortalExperience kind="parent" view="learning" snapshot={snapshot} />
}
