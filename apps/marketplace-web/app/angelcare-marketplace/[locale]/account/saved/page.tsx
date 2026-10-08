import { requireCustomerPageContext } from '@/angelcare-marketplace/customer-commerce/customer-auth'
import { CustomerSavedWorkspace } from '@/angelcare-marketplace/customer-commerce/components/CustomerSavedWorkspace'
import { listCustomerSavedItems } from '@/angelcare-marketplace/customer-commerce/repository'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string}>}){const{locale:raw}=await params;const locale=(raw==='en'||raw==='ar'?raw:'fr') as CatalogLocale;const context=await requireCustomerPageContext(locale);return <CustomerSavedWorkspace initialItems={await listCustomerSavedItems(context,locale)} locale={locale}/>}
