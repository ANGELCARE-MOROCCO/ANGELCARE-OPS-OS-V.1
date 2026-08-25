import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { customerRelationshipOverview } from '@/angelcare-marketplace/customer-relationship-command/repository'
import { CustomerActivityWorkspace } from '@/angelcare-marketplace/customer-relationship-command/components/CustomerActivityWorkspace'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <CustomerActivityWorkspace snapshot={await customerRelationshipOverview()}/>}
