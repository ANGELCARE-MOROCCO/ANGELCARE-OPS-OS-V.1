import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ProviderPayableDesk } from '@/angelcare-marketplace/provider-workforce/components/ProviderActionClient'
import { listProviderPayablesAdmin } from '@/angelcare-marketplace/provider-workforce/repository'

export default async function Page(){
  const context=await requireMarketplacePageContext('marketplace.providers.view')
  return <ProviderPayableDesk items={await listProviderPayablesAdmin(context)}/>
}
