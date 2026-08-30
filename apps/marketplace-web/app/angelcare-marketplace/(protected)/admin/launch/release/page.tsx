import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { launchSummary, listLaunchGates, listReleaseCandidates } from '@/angelcare-marketplace/launch-assurance/repository'
import { LaunchCommand } from '@/angelcare-marketplace/launch-assurance/components/LaunchCommand'
import { LaunchDecisionDesk } from '@/angelcare-marketplace/launch-assurance/components/LaunchGovernanceDesk'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.launch.view');const[summary,gates,releases]=await Promise.all([launchSummary(),listLaunchGates(),listReleaseCandidates()]);return <><LaunchCommand summary={summary} gates={gates} releases={releases}/><LaunchDecisionDesk gates={gates} releases={releases} canManageGates={hasMarketplacePermission(context,'marketplace.launch.gates.manage')} canApproveRelease={hasMarketplacePermission(context,'marketplace.launch.release.approve')}/></>}
