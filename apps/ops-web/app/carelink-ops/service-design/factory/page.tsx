import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { loadFactoryCatalogue } from '@/lib/homeservice-factory/server/catalogue'
import { loadAllCategoryBlueprints } from '@/lib/homeservice-factory/server/blueprints'
import { CategoryGatewayWorkspace } from '@/components/carelink/service-design/factory/CategoryGatewayWorkspace'

export const dynamic = 'force-dynamic'
export default async function Page() {
  await requireHomeServiceAccess('homeservice_design.view')
  const [catalogue, blueprints] = await Promise.all([loadFactoryCatalogue(), loadAllCategoryBlueprints()])
  return <CategoryGatewayWorkspace catalogue={catalogue} blueprints={blueprints} />
}
