import { requireMarketplacePageContext, hasMarketplacePermission } from '@/angelcare-marketplace/auth/context'
import { TerritoryRegistryClient } from '@/angelcare-marketplace/territory-os/components/TerritoryRegistryClient'
import { listTerritories } from '@/angelcare-marketplace/territory-os/repository'
export const metadata={title:'Registre des territoires'}
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.territories.view');return <TerritoryRegistryClient territories={await listTerritories(context)} canExport={hasMarketplacePermission(context,'marketplace.territories.export')}/>}
