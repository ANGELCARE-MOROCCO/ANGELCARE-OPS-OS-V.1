import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listLaunchApprovals } from '@/angelcare-marketplace/launch-assurance/repository'
import { ApprovalAuthority } from '@/angelcare-marketplace/launch-assurance/components/LaunchRegisters'
export default async function Page(){await requireMarketplacePageContext('marketplace.launch.view');return <ApprovalAuthority items={await listLaunchApprovals()}/>}