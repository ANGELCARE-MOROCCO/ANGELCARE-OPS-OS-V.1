import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { FulfillmentMissionControl } from '@/angelcare-marketplace/enterprise-command/components/FulfillmentMissionControl'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <FulfillmentMissionControl/>}
