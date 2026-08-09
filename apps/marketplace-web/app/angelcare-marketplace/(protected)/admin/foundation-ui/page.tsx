import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { FoundationGallery } from '@/angelcare-marketplace/features/admin/FoundationGallery'

export const metadata = { title: 'Fondation UI' }

export default async function MarketplaceFoundationUiPage() {
  await requireMarketplacePageContext('marketplace.foundation.view')
  return <FoundationGallery />
}
