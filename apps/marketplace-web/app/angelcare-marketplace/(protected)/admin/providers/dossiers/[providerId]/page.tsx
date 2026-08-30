import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { providerDossier } from '@/angelcare-marketplace/provider-workforce/repository'
import { ProviderDossier } from '@/angelcare-marketplace/provider-workforce/components/ProviderDossier'
export default async function Page({params}:{params:Promise<{providerId:string}>}){const context=await requireMarketplacePageContext('marketplace.providers.view');const {providerId}=await params;return <ProviderDossier data={await providerDossier(providerId,context)} canManage={hasMarketplacePermission(context,'marketplace.providers.manage')} canReviewEligibility={hasMarketplacePermission(context,'marketplace.providers.eligibility.review')}/>}
