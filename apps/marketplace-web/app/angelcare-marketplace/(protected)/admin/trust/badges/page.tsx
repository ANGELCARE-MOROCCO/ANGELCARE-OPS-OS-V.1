import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listBadges } from '@/angelcare-marketplace/trust-quality/repository'
import { BadgeAuthority } from '@/angelcare-marketplace/trust-quality/components/TrustRegisters'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.trust.view');return <BadgeAuthority items={await listBadges(context)}/>}