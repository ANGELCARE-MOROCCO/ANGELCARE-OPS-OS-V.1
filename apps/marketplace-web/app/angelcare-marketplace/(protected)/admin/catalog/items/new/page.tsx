import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { commerceProductAtelierSnapshot } from '@/angelcare-marketplace/commerce-product-atelier/repository'
import { ProductMasterRegistry } from '@/angelcare-marketplace/commerce-product-atelier/components/ProductMasterRegistry'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const context = await requireMarketplacePageContext('marketplace.catalog.view')
  return <ProductMasterRegistry snapshot={await commerceProductAtelierSnapshot(context)} openCreate />
}
