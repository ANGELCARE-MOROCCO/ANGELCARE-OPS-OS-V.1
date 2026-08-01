import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { B2BTrainingBoard } from '@/angelcare-marketplace/academy-engine/components/B2BTrainingBoard'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.academy.view');void context;return <B2BTrainingBoard />}
