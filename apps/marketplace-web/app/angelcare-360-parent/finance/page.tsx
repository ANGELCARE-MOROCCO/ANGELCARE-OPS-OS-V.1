import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentFinancePage() {
  const snapshot = await getParentPortalSnapshot('finance')
  return <PortalExperience kind="parent" view="finance" snapshot={snapshot} />
}
