import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listProviders,providerSummary } from '@/angelcare-marketplace/provider-workforce/repository'
import { ProviderCommand } from '@/angelcare-marketplace/provider-workforce/components/ProviderCommand'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.providers.view');const [summary,providers]=await Promise.all([providerSummary(context),listProviders(context)]);return <ProviderCommand summary={summary} providers={providers}/>}
