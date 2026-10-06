import { requireCustomerPageContext, customerSessionSummary } from '@/angelcare-marketplace/customer-commerce/customer-auth'
import { listCustomerAddresses } from '@/angelcare-marketplace/customer-commerce/repository'
import { getFamilyDashboard } from '@/angelcare-marketplace/family-experience/repository'
import { CustomerSettingsWorkspace } from '@/angelcare-marketplace/customer-commerce/components/CustomerSettingsWorkspace'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string}>}){const{locale:raw}=await params;const locale=(raw==='en'||raw==='ar'?raw:'fr') as CatalogLocale;const context=await requireCustomerPageContext(locale);const[family,addresses,session]=await Promise.all([getFamilyDashboard(context.marketplace),listCustomerAddresses(context),customerSessionSummary()]);return <CustomerSettingsWorkspace account={context.account} family={family.account} initialAddresses={addresses} session={session} locale={locale}/>}
