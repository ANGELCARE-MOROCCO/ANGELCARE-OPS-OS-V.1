import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentMessagesPage() {
  const snapshot = await getParentPortalSnapshot('messages')
  return <PortalExperience kind="parent" view="messages" snapshot={snapshot} />
}
