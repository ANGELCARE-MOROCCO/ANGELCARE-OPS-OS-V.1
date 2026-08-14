import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { SegmentBuilder } from '@/angelcare-marketplace/enterprise-command/components/SegmentBuilder'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <SegmentBuilder/>}
