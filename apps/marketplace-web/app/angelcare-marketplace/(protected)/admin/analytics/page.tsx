import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { getStoreXraySnapshot } from '@/angelcare-marketplace/store-xray/repository'
import { StoreXrayCommand } from '@/angelcare-marketplace/store-xray/StoreXrayCommand'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const context = await requireMarketplacePageContext('marketplace.analytics.view')
  const initial = await getStoreXraySnapshot(context, 30)
  return <StoreXrayCommand initial={initial}/>
}
