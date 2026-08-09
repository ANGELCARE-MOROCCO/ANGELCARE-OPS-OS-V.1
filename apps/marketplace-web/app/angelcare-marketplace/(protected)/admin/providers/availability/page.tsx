import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { AvailabilityRoster } from '@/angelcare-marketplace/provider-workforce/components/AvailabilityRoster'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.providers.view');void context;return <AvailabilityRoster/>}
