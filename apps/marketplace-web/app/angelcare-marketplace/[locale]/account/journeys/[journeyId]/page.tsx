import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { CustomerPortalNavigation } from '@/angelcare-marketplace/customer-commerce/components/CustomerPortalNavigation'
import customerStyles from '@/angelcare-marketplace/customer-commerce/customer-commerce.module.css'
import { JourneyExperience } from '@/angelcare-marketplace/journey-control/components/JourneyExperience'
import { getCustomerJourney } from '@/angelcare-marketplace/journey-control/repository'
export const dynamic='force-dynamic'
export default async function JourneyPage({params}:{params:Promise<{journeyId:string}>}){const {journeyId}=await params;const context=await requireMarketplacePageContext();const journey=await getCustomerJourney(journeyId,context);return <><div className={customerStyles.journeyCustomerNav} dir={journey.locale==='ar'?'rtl':'ltr'}><div className={customerStyles.journeyCustomerNavInner}><span className={customerStyles.eyebrow}>MON ANGELCARE · PARCOURS CLIENT</span><CustomerPortalNavigation locale={journey.locale}/></div></div><JourneyExperience journey={journey}/></>}
