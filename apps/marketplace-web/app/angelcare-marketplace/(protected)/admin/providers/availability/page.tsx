import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ProviderAvailabilityDesk } from '@/angelcare-marketplace/provider-workforce/components/ProviderActionClient'
import { listProviderAvailabilityAdmin,listProviderAvailabilityExceptionsAdmin,listProviders } from '@/angelcare-marketplace/provider-workforce/repository'

export default async function Page(){
  const context=await requireMarketplacePageContext('marketplace.providers.view')
  const [providers,rules,exceptions]=await Promise.all([
    listProviders(context),
    listProviderAvailabilityAdmin(context),
    listProviderAvailabilityExceptionsAdmin(context),
  ])
  return <ProviderAvailabilityDesk providers={providers} rules={rules} exceptions={exceptions}/>
}
