import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { customerRelationshipOverview } from '@/angelcare-marketplace/customer-relationship-command/repository'
import { SegmentIntelligenceWorkspace } from '@/angelcare-marketplace/customer-relationship-command/components/SegmentIntelligenceWorkspace'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <SegmentIntelligenceWorkspace snapshot={await customerRelationshipOverview()}/>}
