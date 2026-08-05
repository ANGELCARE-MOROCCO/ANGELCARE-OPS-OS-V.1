import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { loadFactoryCatalogue } from '@/lib/homeservice-factory/server/catalogue'
import { DoctrineImportStudio } from '@/components/carelink/service-design/factory/DoctrineImportStudio'

export const dynamic = 'force-dynamic'

export default async function Page({ searchParams }: { searchParams: Promise<{ category?: string; type?: string }> }) {
  await requireHomeServiceAccess(['homeservice_design.import_configuration', 'homeservice_design.admin'])
  const [catalogue, params] = await Promise.all([loadFactoryCatalogue(), searchParams])
  const requestedCategory = String(params.category || '')
  const category = catalogue.categories.find((item) => item.id === requestedCategory || item.code === requestedCategory)
  return <DoctrineImportStudio catalogue={catalogue} initialCategoryId={category?.id} initialImportType={String(params.type || 'doctrine_rules')} />
}
