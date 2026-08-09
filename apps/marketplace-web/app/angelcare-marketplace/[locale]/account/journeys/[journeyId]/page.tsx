import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { JourneyExperience } from '@/angelcare-marketplace/journey-control/components/JourneyExperience'
import { getCustomerJourney } from '@/angelcare-marketplace/journey-control/repository'
export default async function JourneyPage({params}:{params:Promise<{journeyId:string}>}){const {journeyId}=await params;const context=await requireMarketplacePageContext();return <JourneyExperience journey={await getCustomerJourney(journeyId,context)}/> }
