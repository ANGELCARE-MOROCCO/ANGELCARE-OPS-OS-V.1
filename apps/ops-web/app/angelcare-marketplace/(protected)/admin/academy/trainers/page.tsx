import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { TrainerWorkspace } from '@/angelcare-marketplace/academy-engine/components/TrainerWorkspace'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.academy.view');void context;return <TrainerWorkspace />}
