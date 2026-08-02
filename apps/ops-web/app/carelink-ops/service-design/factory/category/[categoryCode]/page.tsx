import { notFound } from 'next/navigation'
import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { loadFactoryCatalogue } from '@/lib/homeservice-factory/server/catalogue'
import { loadCategoryBlueprint } from '@/lib/homeservice-factory/server/blueprints'
import { CategoryMasterExperienceWorkspace } from '@/components/carelink/service-design/factory/CategoryMasterExperienceWorkspace'
import type { FactoryMode } from '@/types/homeservice-factory'

export const dynamic = 'force-dynamic'
export default async function Page({ params, searchParams }: { params: Promise<{ categoryCode: string }>; searchParams: Promise<{ mode?: string }> }) {
  await requireHomeServiceAccess('homeservice_design.view')
  const { categoryCode } = await params
  const { mode } = await searchParams
  const decoded = decodeURIComponent(categoryCode)
  const [catalogue, blueprint] = await Promise.all([loadFactoryCatalogue(), loadCategoryBlueprint(decoded)])
  const category = catalogue.categories.find((item) => item.code === decoded)
  if (!category || !blueprint) notFound()
  const initialMode = ['single_mission', 'multi_mission', 'commercial_package'].includes(String(mode)) ? String(mode) as FactoryMode : undefined
  return <CategoryMasterExperienceWorkspace category={category} blueprint={blueprint} initialMode={initialMode} />
}
