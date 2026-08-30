import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listLaunchGates, listReleaseCandidates } from '@/angelcare-marketplace/launch-assurance/repository'
import { GateAuthority } from '@/angelcare-marketplace/launch-assurance/components/LaunchRegisters'
import { LaunchDecisionDesk } from '@/angelcare-marketplace/launch-assurance/components/LaunchGovernanceDesk'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.launch.view');const[gates,releases]=await Promise.all([listLaunchGates(),listReleaseCandidates()]);return <><GateAuthority items={gates}/><LaunchDecisionDesk gates={gates} releases={releases} canManageGates={hasMarketplacePermission(context,'marketplace.launch.gates.manage')} canApproveRelease={hasMarketplacePermission(context,'marketplace.launch.release.approve')}/></>}
