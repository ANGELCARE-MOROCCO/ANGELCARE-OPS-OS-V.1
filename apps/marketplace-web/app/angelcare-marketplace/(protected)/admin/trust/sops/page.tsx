import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listSops } from '@/angelcare-marketplace/trust-quality/repository'
import { SopAuthority } from '@/angelcare-marketplace/trust-quality/components/SopAuthority'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.trust.view');return <SopAuthority items={await listSops(context)}/>}