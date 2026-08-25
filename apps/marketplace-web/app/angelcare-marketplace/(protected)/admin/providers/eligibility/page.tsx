import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { EligibilityCommand } from '@/angelcare-marketplace/provider-workforce/components/EligibilityCommand'
import { ProviderLifecycleDesk } from '@/angelcare-marketplace/provider-workforce/components/ProviderActionClient'
import { listProviders } from '@/angelcare-marketplace/provider-workforce/repository'

export default async function Page(){
  const context=await requireMarketplacePageContext('marketplace.providers.view')
  const providers=await listProviders(context)
  return <><EligibilityCommand providers={providers}/><ProviderLifecycleDesk providers={providers}/></>
}
