import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { JourneyAdminDetail } from '@/angelcare-marketplace/journey-control/components/JourneyAdminDetail'
import { getAdminJourney } from '@/angelcare-marketplace/journey-control/repository'
export default async function Page({params}:{params:Promise<{journeyId:string}>}){const {journeyId}=await params;const context=await requireMarketplacePageContext('marketplace.journeys.view');return <JourneyAdminDetail journey={await getAdminJourney(journeyId,context)} canManage={hasMarketplacePermission(context,'marketplace.journeys.manage')}/> }
