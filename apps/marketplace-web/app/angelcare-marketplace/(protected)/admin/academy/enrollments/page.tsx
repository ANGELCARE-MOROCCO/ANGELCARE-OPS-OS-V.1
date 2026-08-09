import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { CohortCommand } from '@/angelcare-marketplace/academy-engine/components/CohortCommand'
import { listCohorts } from '@/angelcare-marketplace/academy-engine/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.academy.view');void context;return <CohortCommand cohorts={await listCohorts(context)}/>}
