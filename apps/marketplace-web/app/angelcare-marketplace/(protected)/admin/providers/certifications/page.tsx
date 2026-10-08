import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ProviderDocumentDesk } from '@/angelcare-marketplace/provider-workforce/components/ProviderActionClient'
import { listProviderCertificationsAdmin,listProviderDocumentsAdmin,listProviders } from '@/angelcare-marketplace/provider-workforce/repository'

export default async function Page(){
  const context=await requireMarketplacePageContext('marketplace.providers.view')
  const [providers,documents,certifications]=await Promise.all([
    listProviders(context),
    listProviderDocumentsAdmin(context),
    listProviderCertificationsAdmin(context),
  ])
  return <ProviderDocumentDesk providers={providers} documents={documents} certifications={certifications}/>
}
