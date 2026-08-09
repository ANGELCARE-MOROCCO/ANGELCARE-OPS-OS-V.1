import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { JourneyAdminCommand } from '@/angelcare-marketplace/journey-control/components/JourneyAdminCommand'
import { getJourneyAdminSummary } from '@/angelcare-marketplace/journey-control/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.journeys.view');const data=await getJourneyAdminSummary(context);const allowed:string[]=['partner_activation'];const selected=allowed.length?data.journeys.filter(j=>allowed.includes(j.journey_type)):data.journeys;return <JourneyAdminCommand data={{...data,journeys:selected,total:selected.length}}/> }
