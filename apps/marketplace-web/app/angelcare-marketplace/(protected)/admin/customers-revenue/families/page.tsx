import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { customerRelationshipOverview } from '@/angelcare-marketplace/customer-relationship-command/repository'
import { FamilyRelationshipWorkspace } from '@/angelcare-marketplace/customer-relationship-command/components/FamilyRelationshipWorkspace'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <FamilyRelationshipWorkspace snapshot={await customerRelationshipOverview()}/>}
