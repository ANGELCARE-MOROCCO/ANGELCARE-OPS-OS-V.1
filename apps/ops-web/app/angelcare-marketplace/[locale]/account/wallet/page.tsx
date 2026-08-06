import { requireCustomerPageContext } from '@/angelcare-marketplace/customer-commerce/customer-auth'
import { getWalletSummary } from '@/angelcare-marketplace/customer-commerce/repository'
import { WalletDashboard } from '@/angelcare-marketplace/customer-commerce/components/WalletDashboard'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string}>}){const{locale:raw}=await params;const locale=(raw==='en'||raw==='ar'?raw:'fr') as CatalogLocale;const context=await requireCustomerPageContext(locale);return <WalletDashboard data={await getWalletSummary(context)} locale={locale}/>}
