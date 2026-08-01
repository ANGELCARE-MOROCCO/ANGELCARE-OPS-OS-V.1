import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listEvidence } from '@/angelcare-marketplace/trust-quality/repository'
import { EvidenceAuthority } from '@/angelcare-marketplace/trust-quality/components/EvidenceAuthority'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.trust.view');return <EvidenceAuthority items={await listEvidence(context)}/>}