import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ProviderPerformanceDesk } from '@/angelcare-marketplace/provider-workforce/components/ProviderActionClient'
import { listProviderPerformanceAdmin,listProviders } from '@/angelcare-marketplace/provider-workforce/repository'

export default async function Page(){
  const context=await requireMarketplacePageContext('marketplace.providers.view')
  const [providers,events]=await Promise.all([listProviders(context),listProviderPerformanceAdmin(context)])
  return <ProviderPerformanceDesk providers={providers} events={events}/>
}
