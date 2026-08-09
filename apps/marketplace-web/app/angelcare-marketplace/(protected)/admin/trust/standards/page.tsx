import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listStandards } from '@/angelcare-marketplace/trust-quality/repository'
import { StandardsAuthority } from '@/angelcare-marketplace/trust-quality/components/TrustRegisters'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.trust.view');return <StandardsAuthority items={await listStandards(context)}/>}