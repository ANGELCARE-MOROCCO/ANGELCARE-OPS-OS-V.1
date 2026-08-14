import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { OperatorWorkspace } from '@/angelcare-marketplace/enterprise-command/components/OperatorWorkspace'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <OperatorWorkspace/>}
