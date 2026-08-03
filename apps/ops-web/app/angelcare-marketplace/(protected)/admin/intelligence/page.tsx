import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {ExecutiveIntelligenceCockpit} from '@/angelcare-marketplace/final-authority/components/ExecutiveIntelligenceCockpit'
import {executiveAuthoritySummary} from '@/angelcare-marketplace/final-authority/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.intelligence.view');return <ExecutiveIntelligenceCockpit data={await executiveAuthoritySummary(c)}/>}
