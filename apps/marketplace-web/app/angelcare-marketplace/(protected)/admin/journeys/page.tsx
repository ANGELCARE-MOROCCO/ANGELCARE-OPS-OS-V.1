import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { JourneyAdminCommand } from '@/angelcare-marketplace/journey-control/components/JourneyAdminCommand'
import { getJourneyAdminSummary } from '@/angelcare-marketplace/journey-control/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.journeys.view');return <JourneyAdminCommand data={await getJourneyAdminSummary(context)}/> }
