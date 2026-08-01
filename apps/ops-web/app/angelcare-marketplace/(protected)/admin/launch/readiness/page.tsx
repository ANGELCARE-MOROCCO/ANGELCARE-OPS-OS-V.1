import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listLaunchGates } from '@/angelcare-marketplace/launch-assurance/repository'
import { GateAuthority } from '@/angelcare-marketplace/launch-assurance/components/LaunchRegisters'
export default async function Page(){await requireMarketplacePageContext('marketplace.launch.view');return <GateAuthority items={await listLaunchGates()}/>}