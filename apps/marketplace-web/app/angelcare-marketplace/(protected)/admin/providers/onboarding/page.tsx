import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { OnboardingRegistry } from '@/angelcare-marketplace/provider-workforce/components/OnboardingRegistry'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.providers.view');void context;return <OnboardingRegistry/>}
