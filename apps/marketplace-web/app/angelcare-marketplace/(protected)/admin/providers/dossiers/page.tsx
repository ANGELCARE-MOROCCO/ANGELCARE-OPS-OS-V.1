import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ProviderCommand } from '@/angelcare-marketplace/provider-workforce/components/ProviderCommand'
import { listProviders,providerSummary } from '@/angelcare-marketplace/provider-workforce/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.providers.view');const [summary,providers]=await Promise.all([providerSummary(context),listProviders(context)]);return <ProviderCommand summary={summary} providers={providers} canCreate={hasMarketplacePermission(context,'marketplace.providers.create')}/>}
