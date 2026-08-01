import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { TerritoryPreview } from '@/angelcare-marketplace/territory-os/components/TerritoryPreview'
import { getTerritoryDetailBundle } from '@/angelcare-marketplace/territory-os/repository'
export default async function Page({params}:{params:Promise<{territoryCode:string}>}){const context=await requireMarketplacePageContext('marketplace.territories.preview');const {territoryCode}=await params;return <TerritoryPreview bundle={await getTerritoryDetailBundle(context,territoryCode)}/>}
