import { requireCustomerPageContext } from '@/angelcare-marketplace/customer-commerce/customer-auth'
import { getFamilyDashboard } from '@/angelcare-marketplace/family-experience/repository'
import { CustomerFamilyWorkspace } from '@/angelcare-marketplace/customer-commerce/components/CustomerFamilyWorkspace'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string}>}){const{locale:raw}=await params;const locale=(raw==='en'||raw==='ar'?raw:'fr') as CatalogLocale;const context=await requireCustomerPageContext(locale);return <CustomerFamilyWorkspace data={await getFamilyDashboard(context.marketplace)} locale={locale}/>}
