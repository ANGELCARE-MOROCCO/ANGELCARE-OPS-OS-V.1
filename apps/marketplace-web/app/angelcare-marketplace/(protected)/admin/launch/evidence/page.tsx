import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listLaunchEvidence } from '@/angelcare-marketplace/launch-assurance/repository'
import { EvidenceAuthority } from '@/angelcare-marketplace/launch-assurance/components/LaunchRegisters'
export default async function Page(){await requireMarketplacePageContext('marketplace.launch.view');return <EvidenceAuthority items={await listLaunchEvidence()}/>}
