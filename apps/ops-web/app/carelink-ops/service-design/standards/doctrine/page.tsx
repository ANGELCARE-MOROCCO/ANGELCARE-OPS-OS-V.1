import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { getServiceDesignSnapshot } from '@/lib/homeservice-design/server/repository'
import { DoctrineStandardsWorkspace } from '@/components/carelink/service-design/workspaces/DoctrineStandardsWorkspace'

export const dynamic = 'force-dynamic'
export default async function Page() {
  await requireHomeServiceAccess('homeservice_design.manage_doctrine')
  const snapshot = await getServiceDesignSnapshot()
  return <DoctrineStandardsWorkspace snapshot={snapshot} />
}
