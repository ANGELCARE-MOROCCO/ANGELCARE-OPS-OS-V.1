import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { getServiceDesignSnapshot } from '@/lib/homeservice-design/server/repository'
import { SafetySafeguardingWorkspace } from '@/components/carelink/service-design/workspaces/SafetySafeguardingWorkspace'

export const dynamic = 'force-dynamic'
export default async function Page() {
  await requireHomeServiceAccess('homeservice_design.manage_safety')
  const snapshot = await getServiceDesignSnapshot()
  return <SafetySafeguardingWorkspace snapshot={snapshot} />
}
