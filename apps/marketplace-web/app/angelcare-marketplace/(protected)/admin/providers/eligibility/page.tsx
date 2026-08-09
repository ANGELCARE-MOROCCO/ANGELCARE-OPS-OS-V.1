import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { EligibilityCommand } from '@/angelcare-marketplace/provider-workforce/components/EligibilityCommand'
import { listProviders,providerSummary } from '@/angelcare-marketplace/provider-workforce/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.providers.view');void context;return <EligibilityCommand providers={await listProviders(context)}/>}
