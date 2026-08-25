import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { customerRelationshipOverview } from '@/angelcare-marketplace/customer-relationship-command/repository'
import { CustomerCasesWorkspace } from '@/angelcare-marketplace/customer-relationship-command/components/CustomerCasesWorkspace'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <CustomerCasesWorkspace snapshot={await customerRelationshipOverview()}/>}
