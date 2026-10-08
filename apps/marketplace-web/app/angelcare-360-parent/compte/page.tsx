import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentComptePage() {
  const snapshot = await getParentPortalSnapshot('account')
  return <PortalExperience kind="parent" view="account" snapshot={snapshot} />
}
