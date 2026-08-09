import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ValidationBoard } from '@/angelcare-marketplace/operations-execution/components/ValidationBoard'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.view');void context;return <ValidationBoard/>}
