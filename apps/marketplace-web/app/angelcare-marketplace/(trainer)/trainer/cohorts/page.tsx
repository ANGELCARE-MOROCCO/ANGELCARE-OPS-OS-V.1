import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { TrainerWorkspace } from '@/angelcare-marketplace/academy-engine/components/TrainerWorkspace'
export default async function Page(){await requireMarketplacePageContext('marketplace.academy.trainer.access');return <TrainerWorkspace/>}
