import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentPresencesPage() {
  const snapshot = await getParentPortalSnapshot('attendance')
  return <PortalExperience kind="parent" view="attendance" snapshot={snapshot} />
}
