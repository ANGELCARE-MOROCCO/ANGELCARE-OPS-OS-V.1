import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { getServiceDesignSnapshot } from '@/lib/homeservice-design/server/repository'
import { TaxonomyArchitectWorkspace } from '@/components/carelink/service-design/workspaces/TaxonomyArchitectWorkspace'

export const dynamic = 'force-dynamic'
export default async function Page() {
  await requireHomeServiceAccess('homeservice_design.manage_categories')
  const snapshot = await getServiceDesignSnapshot()
  return <TaxonomyArchitectWorkspace snapshot={snapshot} />
}
