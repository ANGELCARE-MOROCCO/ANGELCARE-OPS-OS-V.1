import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { CatalogRegistry } from '@/angelcare-marketplace/academy-engine/components/CatalogRegistry'
import { listPrograms } from '@/angelcare-marketplace/academy-engine/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.academy.view');void context;return <CatalogRegistry programs={await listPrograms(context)}/>}
