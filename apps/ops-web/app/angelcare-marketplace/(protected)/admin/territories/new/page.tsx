import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { CreateTerritoryWizard } from '@/angelcare-marketplace/territory-os/components/CreateTerritoryWizard'
import { listTerritoryTemplates } from '@/angelcare-marketplace/territory-os/repository'
export const metadata={title:'Créer un territoire'}
export default async function Page(){await requireMarketplacePageContext('marketplace.territories.create');return <CreateTerritoryWizard templates={await listTerritoryTemplates()}/>}
