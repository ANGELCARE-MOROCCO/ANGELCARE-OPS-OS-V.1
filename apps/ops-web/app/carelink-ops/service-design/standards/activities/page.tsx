import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { getServiceDesignSnapshot } from '@/lib/homeservice-design/server/repository'
import { ActivityLibraryWorkspace } from '@/components/carelink/service-design/workspaces/ActivityLibraryWorkspace'

export const dynamic = 'force-dynamic'
export default async function Page() {
  await requireHomeServiceAccess('homeservice_design.manage_activity_library')
  const snapshot = await getServiceDesignSnapshot()
  return <ActivityLibraryWorkspace snapshot={snapshot} />
}
