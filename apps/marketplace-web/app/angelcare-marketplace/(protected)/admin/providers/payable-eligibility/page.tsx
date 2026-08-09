import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PayableEligibilityBoard } from '@/angelcare-marketplace/provider-workforce/components/PayableEligibilityBoard'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.providers.view');void context;return <PayableEligibilityBoard/>}
