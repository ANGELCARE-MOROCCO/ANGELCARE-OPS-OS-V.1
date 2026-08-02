import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { loadFactoryCatalogue } from '@/lib/homeservice-factory/server/catalogue'
import { DoctrineImportStudio } from '@/components/carelink/service-design/factory/DoctrineImportStudio'

export const dynamic = 'force-dynamic'
export default async function Page() {
  await requireHomeServiceAccess(['homeservice_design.import_configuration', 'homeservice_design.admin'])
  return <DoctrineImportStudio catalogue={await loadFactoryCatalogue()} />
}
