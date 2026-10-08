import { requireCustomerPageContext } from '@/angelcare-marketplace/customer-commerce/customer-auth'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
import { notFound } from 'next/navigation'
import { CustomerPortalNavigation } from '@/angelcare-marketplace/customer-commerce/components/CustomerPortalNavigation'
import customerStyles from '@/angelcare-marketplace/customer-commerce/customer-commerce.module.css'
import { JourneyExperience } from '@/angelcare-marketplace/journey-control/components/JourneyExperience'
import { getCustomerJourney } from '@/angelcare-marketplace/journey-control/repository'
export const dynamic='force-dynamic'
export default async function JourneyPage({params}:{params:Promise<{journeyId:string;locale:string}>}){const {journeyId,locale:raw}=await params;if(!['fr','en','ar'].includes(raw))notFound();const locale=raw as CatalogLocale;const customer=await requireCustomerPageContext(locale,`/angelcare-marketplace/${locale}/account/journeys/${encodeURIComponent(journeyId)}`);const journey=await getCustomerJourney(journeyId,customer.marketplace);return <><div className={customerStyles.journeyCustomerNav} dir={locale==='ar'?'rtl':'ltr'}><div className={customerStyles.journeyCustomerNavInner}><span className={customerStyles.eyebrow}>MON ANGELCARE · PARCOURS CLIENT</span><CustomerPortalNavigation locale={locale}/></div></div><JourneyExperience journey={journey}/></>}
