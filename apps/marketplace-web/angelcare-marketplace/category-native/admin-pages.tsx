import { hasMarketplacePermission, requireMarketplacePageContext } from '../auth/context'
import { commerceStudioData } from '../commerce-studio/repository'
import { categoryNativeStudioData, getExperienceSchema } from './repository'
import { CategoryNativeCommand } from './components/CategoryNativeCommand'
import { SchemaArchitectureStudio } from './components/SchemaArchitectureStudio'
import { ArchetypeStudio } from './components/ArchetypeStudio'
import { CsvTemplateFactory } from './components/CsvTemplateFactory'
import { CsvImportStudio } from './components/CsvImportStudio'
import { HomepageDesigner2 } from './components/HomepageDesigner2'

export async function CategoryNativeCommandPage() {
  await requireMarketplacePageContext('marketplace.experience_schema.view')
  return <CategoryNativeCommand data={await categoryNativeStudioData()}/>
}

export async function SchemaArchitecturePage() {
  const context = await requireMarketplacePageContext('marketplace.experience_schema.view')
  return <SchemaArchitectureStudio initialData={await categoryNativeStudioData()} canManage={hasMarketplacePermission(context, 'marketplace.experience_schema.manage')}/>
}

export async function ArchetypePage({ schemaKey }: { schemaKey?: string }) {
  const context = await requireMarketplacePageContext('marketplace.experience_schema.view')
  const data = await categoryNativeStudioData()
  const selected = schemaKey ? await getExperienceSchema(schemaKey) : data.schemas[0] || null
  return <ArchetypeStudio schemas={data.schemas} initialSchema={selected} canCreate={hasMarketplacePermission(context, 'marketplace.catalog.manage')}/>
}

export async function CsvTemplateFactoryPage() {
  await requireMarketplacePageContext('marketplace.category_native_import.view')
  return <CsvTemplateFactory schemas={(await categoryNativeStudioData()).schemas}/>
}

export async function CsvImportPage() {
  const context = await requireMarketplacePageContext('marketplace.category_native_import.view')
  const data = await categoryNativeStudioData()
  return <CsvImportStudio schemas={data.schemas} initialImports={data.imports} canManage={hasMarketplacePermission(context, 'marketplace.category_native_import.manage')}/>
}

export async function HomepageDesigner2Page() {
  const context = await requireMarketplacePageContext('marketplace.homepage.view')
  const commerce = await commerceStudioData(context)
  const categoryNative = await categoryNativeStudioData()
  return <HomepageDesigner2 initialSections={commerce.sections} collections={commerce.collections} blocks={categoryNative.homepageBlocks} schemas={categoryNative.schemas} canManage={hasMarketplacePermission(context, 'marketplace.homepage.manage')} canViewHistory={hasMarketplacePermission(context, 'marketplace.publication.manage')}/>
}
