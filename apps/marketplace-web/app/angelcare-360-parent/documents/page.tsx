import PortalExperience from '@/components/angelcare360/role-portals/PortalExperience'
import { getParentPortalSnapshot } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function ParentDocumentsPage() {
  const snapshot = await getParentPortalSnapshot('documents')
  return <PortalExperience kind="parent" view="documents" snapshot={snapshot} />
}
