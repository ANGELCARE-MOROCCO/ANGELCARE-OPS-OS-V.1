import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listCohorts } from '@/angelcare-marketplace/academy-engine/repository'
import { CohortCommand } from '@/angelcare-marketplace/academy-engine/components/CohortCommand'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.academy.view');return <CohortCommand cohorts={await listCohorts(context)}/>}
