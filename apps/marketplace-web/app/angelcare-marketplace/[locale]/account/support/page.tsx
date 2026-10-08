import { requireCustomerPageContext } from '@/angelcare-marketplace/customer-commerce/customer-auth'
import { getCustomerPortfolio } from '@/angelcare-marketplace/customer-commerce/repository'
import { getFamilyDashboard } from '@/angelcare-marketplace/family-experience/repository'
import { CustomerSupportWorkspace } from '@/angelcare-marketplace/customer-commerce/components/CustomerSupportWorkspace'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string}>}){const{locale:raw}=await params;const locale=(raw==='en'||raw==='ar'?raw:'fr') as CatalogLocale;const context=await requireCustomerPageContext(locale);const[portfolio,family]=await Promise.all([getCustomerPortfolio(context,'all',locale),getFamilyDashboard(context.marketplace)]);return <CustomerSupportWorkspace initialTickets={family.tickets} journeys={portfolio.journeys} locale={locale}/>}
