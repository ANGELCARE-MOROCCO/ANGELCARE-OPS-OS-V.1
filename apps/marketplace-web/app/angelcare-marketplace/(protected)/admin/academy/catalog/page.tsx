import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listPrograms } from '@/angelcare-marketplace/academy-engine/repository'
import { CatalogRegistry } from '@/angelcare-marketplace/academy-engine/components/CatalogRegistry'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.academy.view');return <CatalogRegistry programs={await listPrograms(context)}/>}
