import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ChecklistCommand } from '@/angelcare-marketplace/operations-execution/components/ChecklistCommand'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.view');void context;return <ChecklistCommand/>}
