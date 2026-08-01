import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { getServiceDesignSnapshot } from '@/lib/homeservice-design/server/repository'
import { CategoryRegistryWorkspace } from '@/components/carelink/service-design/workspaces/CategoryRegistryWorkspace'

export const dynamic = 'force-dynamic'
export default async function Page() {
  await requireHomeServiceAccess('homeservice_design.view')
  const snapshot = await getServiceDesignSnapshot()
  return <CategoryRegistryWorkspace snapshot={snapshot} />
}
