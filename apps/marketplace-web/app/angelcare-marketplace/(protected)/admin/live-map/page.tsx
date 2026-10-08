import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { LiveVisitorSpatialCommand } from '@/angelcare-marketplace/enterprise-command/components/LiveVisitorSpatialCommand'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <LiveVisitorSpatialCommand/>}
