import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { MediaStorageOperations } from '@/angelcare-marketplace/commerce-studio/components/MediaStorageOperations'
import { marketplaceMediaStorageOperations } from '@/angelcare-marketplace/commerce-studio/media-storage-api'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Marketplace Media Storage' }
export default async function Page() {
  await requireMarketplacePageContext('marketplace.media.view')
  return <MediaStorageOperations initial={await marketplaceMediaStorageOperations()}/>
}
