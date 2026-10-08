import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { BusinessPulseCommand } from '@/angelcare-marketplace/enterprise-command/components/BusinessPulseCommand'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.admin.access');return <BusinessPulseCommand/>}
