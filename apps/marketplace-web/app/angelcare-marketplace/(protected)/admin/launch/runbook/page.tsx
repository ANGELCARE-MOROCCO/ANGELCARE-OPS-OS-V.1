import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listRunbooks } from '@/angelcare-marketplace/launch-assurance/repository'
import { RunbookAuthority } from '@/angelcare-marketplace/launch-assurance/components/LaunchRegisters'
export default async function Page(){await requireMarketplacePageContext('marketplace.launch.view');return <RunbookAuthority items={await listRunbooks()}/>}