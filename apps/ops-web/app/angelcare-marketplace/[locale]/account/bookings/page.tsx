import { requireCustomerPageContext } from '@/angelcare-marketplace/customer-commerce/customer-auth'
import { getCustomerPortfolio } from '@/angelcare-marketplace/customer-commerce/repository'
import { CustomerPortfolioWorkspace } from '@/angelcare-marketplace/customer-commerce/components/CustomerPortfolioWorkspace'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string}>}){const{locale:raw}=await params;const locale=(raw==='en'||raw==='ar'?raw:'fr') as CatalogLocale;const context=await requireCustomerPageContext(locale);return <CustomerPortfolioWorkspace data={await getCustomerPortfolio(context,'family_booking' as any,locale)}/>}
