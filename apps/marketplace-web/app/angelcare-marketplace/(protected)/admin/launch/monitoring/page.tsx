import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listPostLaunchReviews } from '@/angelcare-marketplace/launch-assurance/repository'
import { PostLaunchAuthority } from '@/angelcare-marketplace/launch-assurance/components/LaunchRegisters'
export default async function Page(){await requireMarketplacePageContext('marketplace.launch.view');return <PostLaunchAuthority items={await listPostLaunchReviews()}/>}
