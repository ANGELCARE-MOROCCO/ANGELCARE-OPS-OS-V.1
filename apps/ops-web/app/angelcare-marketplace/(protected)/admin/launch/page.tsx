import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { launchSummary,listLaunchGates,listReleaseCandidates } from '@/angelcare-marketplace/launch-assurance/repository'
import { LaunchCommand } from '@/angelcare-marketplace/launch-assurance/components/LaunchCommand'
export default async function Page(){await requireMarketplacePageContext('marketplace.launch.view');const [summary,gates,releases]=await Promise.all([launchSummary(),listLaunchGates(),listReleaseCandidates()]);return <LaunchCommand summary={summary} gates={gates} releases={releases}/>}