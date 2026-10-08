import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { customerRelationshipOverview } from '@/angelcare-marketplace/customer-relationship-command/repository'
import { CustomerRelationshipCommandCenter } from '@/angelcare-marketplace/customer-relationship-command/components/CustomerRelationshipCommandCenter'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <CustomerRelationshipCommandCenter snapshot={await customerRelationshipOverview()}/>}
