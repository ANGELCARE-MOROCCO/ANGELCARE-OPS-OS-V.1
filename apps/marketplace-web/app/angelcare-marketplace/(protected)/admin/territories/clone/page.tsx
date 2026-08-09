import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { CloneTerritoryWizard } from '@/angelcare-marketplace/territory-os/components/CloneTerritoryWizard'
import { listTerritories } from '@/angelcare-marketplace/territory-os/repository'
export const metadata={title:'Cloner un territoire'}
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.territories.clone');const territories=await listTerritories(context);return <CloneTerritoryWizard territories={territories}/>}
