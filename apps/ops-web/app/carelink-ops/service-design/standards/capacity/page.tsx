import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { getServiceDesignSnapshot } from '@/lib/homeservice-design/server/repository'
import { CapacityFeasibilityWorkspace } from '@/components/carelink/service-design/workspaces/CapacityFeasibilityWorkspace'

export const dynamic = 'force-dynamic'
export default async function Page() {
  await requireHomeServiceAccess('homeservice_design.manage_capabilities')
  const snapshot = await getServiceDesignSnapshot()
  return <CapacityFeasibilityWorkspace snapshot={snapshot} />
}
