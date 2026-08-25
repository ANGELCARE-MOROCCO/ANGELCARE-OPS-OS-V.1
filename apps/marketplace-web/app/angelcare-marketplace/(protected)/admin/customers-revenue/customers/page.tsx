import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { customerRelationshipOverview } from '@/angelcare-marketplace/customer-relationship-command/repository'
import { CustomerRegistryWorkspace } from '@/angelcare-marketplace/customer-relationship-command/components/CustomerRegistryWorkspace'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <CustomerRegistryWorkspace snapshot={await customerRelationshipOverview()}/>}
