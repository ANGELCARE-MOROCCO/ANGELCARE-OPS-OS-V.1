import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { getServiceDesignSnapshot } from '@/lib/homeservice-design/server/repository'
import { ExecutiveCommandWorkspace } from '@/components/carelink/service-design/workspaces/ExecutiveCommandWorkspace'

export const dynamic = 'force-dynamic'
export default async function Page() {
  await requireHomeServiceAccess('homeservice_design.view')
  return <ExecutiveCommandWorkspace snapshot={await getServiceDesignSnapshot()} />
}
