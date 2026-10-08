import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { marketplaceCommandCenterSnapshot } from '@/angelcare-marketplace/enterprise-command/command-center-repository'
import { MarketplaceCommandCenter } from '@/angelcare-marketplace/enterprise-command/components/MarketplaceCommandCenter'

export const dynamic='force-dynamic'

export default async function Page(){
 await requireMarketplacePageContext('marketplace.admin.access')
 const snapshot=await marketplaceCommandCenterSnapshot()
 return <MarketplaceCommandCenter initialSnapshot={snapshot}/>
}
