import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { SegmentBuilder } from '@/angelcare-marketplace/enterprise-command/components/SegmentBuilder'
export const dynamic='force-dynamic'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.admin.access');return <SegmentBuilder canManage={hasMarketplacePermission(context,'marketplace.admin.access')} canActivate={hasMarketplacePermission(context,'marketplace.merchandising.manage')}/>}
