import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { loadFactoryCatalogue } from '@/lib/homeservice-factory/server/catalogue'
import { DoctrineCommandWorkspace } from '@/components/carelink/service-design/factory/DoctrineCommandWorkspace'

export const dynamic = 'force-dynamic'
export default async function Page() {
  await requireHomeServiceAccess('homeservice_design.view')
  return <DoctrineCommandWorkspace catalogue={await loadFactoryCatalogue()} />
}
