import { requireCustomerPageContext } from '@/angelcare-marketplace/customer-commerce/customer-auth'
import { walletEntries } from '@/angelcare-marketplace/customer-commerce/repository'
import { WalletTransactions } from '@/angelcare-marketplace/customer-commerce/components/WalletTransactions'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string}>}){const{locale:raw}=await params;const locale=(raw==='en'||raw==='ar'?raw:'fr') as CatalogLocale;const context=await requireCustomerPageContext(locale);return <WalletTransactions entries={await walletEntries(context,250)} locale={locale}/>}
