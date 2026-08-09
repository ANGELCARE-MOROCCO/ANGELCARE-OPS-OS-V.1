import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ProviderPortal } from '@/angelcare-marketplace/provider-workforce/components/ProviderPortal'
export default async function Page(){await requireMarketplacePageContext('marketplace.providers.self.access');return <ProviderPortal/>}
