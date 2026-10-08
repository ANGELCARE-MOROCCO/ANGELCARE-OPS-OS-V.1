import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { customerRelationshipOverview } from '@/angelcare-marketplace/customer-relationship-command/repository'
import { CRMRelationshipWorkspace } from '@/angelcare-marketplace/customer-relationship-command/components/CRMRelationshipWorkspace'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <CRMRelationshipWorkspace snapshot={await customerRelationshipOverview()}/>}
