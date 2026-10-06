import { requireCustomerPageContext } from '@/angelcare-marketplace/customer-commerce/customer-auth'
import { getCustomerPortfolio } from '@/angelcare-marketplace/customer-commerce/repository'
import { CustomerActionCenterWorkspace } from '@/angelcare-marketplace/customer-commerce/components/CustomerActionCenterWorkspace'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string}>}){const{locale:raw}=await params;const locale=(raw==='en'||raw==='ar'?raw:'fr') as CatalogLocale;const context=await requireCustomerPageContext(locale);return <CustomerActionCenterWorkspace data={await getCustomerPortfolio(context,'all',locale)}/>}
