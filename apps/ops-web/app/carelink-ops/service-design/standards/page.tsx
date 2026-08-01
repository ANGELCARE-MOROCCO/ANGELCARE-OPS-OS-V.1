import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { getServiceDesignSnapshot } from '@/lib/homeservice-design/server/repository'
import { StandardsCommandWorkspace } from '@/components/carelink/service-design/workspaces/StandardsCommandWorkspace'

export const dynamic = 'force-dynamic'
export default async function Page() {
  await requireHomeServiceAccess('homeservice_design.view')
  const snapshot = await getServiceDesignSnapshot()
  return <StandardsCommandWorkspace snapshot={snapshot} />
}
