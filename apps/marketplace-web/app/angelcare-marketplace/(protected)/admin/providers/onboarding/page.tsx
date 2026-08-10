import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ProviderLifecycleDesk } from '@/angelcare-marketplace/provider-workforce/components/ProviderActionClient'
import { listProviders } from '@/angelcare-marketplace/provider-workforce/repository'

export default async function Page(){
  const context=await requireMarketplacePageContext('marketplace.providers.view')
  return <ProviderLifecycleDesk providers={await listProviders(context)}/>
}
