import { requireMarketplacePageContext } from '../auth/context'
import { commerceStudioData, getCommerceResource } from './repository'
import type { CatalogAdminItem, CatalogCategoryAdmin } from './types'
import { CatalogRegistryStudio } from './components/CatalogRegistryStudio'
import { CategoryStudio } from './components/CategoryStudio'
import { CommerceStudioCommand } from './components/CommerceStudioCommand'
import { HomepageComposerStudio } from './components/HomepageComposerStudio'
import { HeroCampaignStudio } from './components/HeroCampaignStudio'
import { CollectionStudio } from './components/CollectionStudio'
import { MediaLibraryStudio } from './components/MediaLibraryStudio'
import { MerchandisingStudio } from './components/MerchandisingStudio'
import { NavigationStudio } from './components/NavigationStudio'
import { ProductStudio } from './components/ProductStudio'
import { PublicationStudio } from './components/PublicationStudio'

export async function CommerceCommandPage() {
  const context = await requireMarketplacePageContext('marketplace.commerce.view')
  return <CommerceStudioCommand data={await commerceStudioData(context)}/>
}
export async function MediaPage({ mode = 'library' }: { mode?: string }) {
  const context = await requireMarketplacePageContext('marketplace.media.view')
  const data = await commerceStudioData(context)
  return <MediaLibraryStudio initialMedia={data.media} mode={mode}/>
}
export async function HomepageComposerPage({ mode = 'composer' }: { mode?: string }) {
  const context = await requireMarketplacePageContext('marketplace.homepage.view')
  const data = await commerceStudioData(context)
  if (mode === 'hero') return <HeroCampaignStudio initialCampaigns={data.campaigns} media={data.media}/>
  if (mode === 'collections') return <CollectionStudio initialCollections={data.collections} items={data.catalogItems} media={data.media}/>
  return <HomepageComposerStudio initialSections={data.sections} collections={data.collections} mode={mode}/>
}
export async function NavigationPage({ mode = 'header' }: { mode?: string }) {
  const context = await requireMarketplacePageContext('marketplace.navigation.view')
  const data = await commerceStudioData(context)
  return <NavigationStudio initialMenus={data.menus} media={data.media} mode={mode}/>
}
export async function CatalogRegistryPage() {
  const context = await requireMarketplacePageContext('marketplace.catalog.view')
  const data = await commerceStudioData(context)
  return <CatalogRegistryStudio items={data.catalogItems}/>
}
export async function ProductPage({ itemId, section = 'overview' }: { itemId?: string; section?: string }) {
  const context = await requireMarketplacePageContext('marketplace.catalog.view')
  const data = await commerceStudioData(context)
  const item = itemId ? await getCommerceResource('catalog-items', itemId) as CatalogAdminItem | null : null
  return <ProductStudio
    item={item}
    categories={data.categories}
    media={data.media}
    priceBooks={data.priceBooks}
    territories={data.territories}
    catalogItems={data.catalogItems}
    publicationEvents={data.publicationEvents}
    initialTab={section}
  />
}
export async function CategoryPage({ categoryId }: { categoryId?: string }) {
  const context = await requireMarketplacePageContext('marketplace.catalog.view')
  const data = await commerceStudioData(context)
  const category = categoryId ? await getCommerceResource('catalog-categories', categoryId) as CatalogCategoryAdmin | null : null
  return <CategoryStudio initialCategories={data.categories} items={data.catalogItems} media={data.media} category={category}/>
}
export async function MerchandisingPage({ mode = 'merchandising' }: { mode?: string }) {
  const context = await requireMarketplacePageContext('marketplace.merchandising.view')
  const data = await commerceStudioData(context)
  if (mode === 'collections') return <CollectionStudio initialCollections={data.collections} items={data.catalogItems} media={data.media}/>
  return <MerchandisingStudio items={data.catalogItems} initialPlacements={data.placements} collections={data.collections} mode={mode}/>
}
export async function PublicationPage() {
  const context = await requireMarketplacePageContext('marketplace.publication.manage')
  const data = await commerceStudioData(context)
  return <PublicationStudio versions={data.versions} events={data.publicationEvents}/>
}
