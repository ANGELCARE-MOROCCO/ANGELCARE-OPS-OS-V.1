import { requireCustomerPageContext } from '@/angelcare-marketplace/customer-commerce/customer-auth'
import { CustomerSettingsWorkspace } from '@/angelcare-marketplace/customer-commerce/components/CustomerSettingsWorkspace'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string}>}){const{locale:raw}=await params;const locale=(raw==='en'||raw==='ar'?raw:'fr') as CatalogLocale;const context=await requireCustomerPageContext(locale);return <CustomerSettingsWorkspace account={context.account} locale={locale}/>}
