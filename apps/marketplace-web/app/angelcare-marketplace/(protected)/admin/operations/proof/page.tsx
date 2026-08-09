import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ProofCommand } from '@/angelcare-marketplace/operations-execution/components/ProofCommand'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.view');void context;return <ProofCommand/>}
