import { requireCustomerPageContext } from '@/angelcare-marketplace/customer-commerce/customer-auth'
import { getCustomerPortfolio } from '@/angelcare-marketplace/customer-commerce/repository'
import { CustomerPaymentsWorkspace } from '@/angelcare-marketplace/customer-commerce/components/CustomerPaymentsWorkspace'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string}>}){const{locale:raw}=await params;const locale=(raw==='en'||raw==='ar'?raw:'fr') as CatalogLocale;const context=await requireCustomerPageContext(locale);const data=await getCustomerPortfolio(context,'all',locale);return <CustomerPaymentsWorkspace payments={data.pendingPayments} locale={locale}/>}
