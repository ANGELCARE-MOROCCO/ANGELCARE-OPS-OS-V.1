import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listAssessments } from '@/angelcare-marketplace/trust-quality/repository'
import { Quality360Command } from '@/angelcare-marketplace/trust-quality/components/Quality360Command'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.quality.view');return <Quality360Command items={await listAssessments(context)}/>}