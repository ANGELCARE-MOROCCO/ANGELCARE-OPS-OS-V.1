import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listNonConformities } from '@/angelcare-marketplace/trust-quality/repository'
import { NonConformityAuthority } from '@/angelcare-marketplace/trust-quality/components/TrustRegisters'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.quality.view');return <NonConformityAuthority items={await listNonConformities(context)}/>}