import { requireCustomerPageContext } from '@/angelcare-marketplace/customer-commerce/customer-auth'
import { getOrCreateWallet } from '@/angelcare-marketplace/customer-commerce/repository'
import { WalletTopUpStudio } from '@/angelcare-marketplace/customer-commerce/components/WalletTopUpStudio'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string}>}){const{locale:raw}=await params;const locale=(raw==='en'||raw==='ar'?raw:'fr') as CatalogLocale;const context=await requireCustomerPageContext(locale);const wallet=await getOrCreateWallet(context);return <WalletTopUpStudio locale={locale} currentBalance={wallet.available_balance}/>}
