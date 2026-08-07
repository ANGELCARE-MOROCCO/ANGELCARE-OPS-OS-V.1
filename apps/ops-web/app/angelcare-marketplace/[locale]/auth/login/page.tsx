import { CustomerAuthExperience } from '@/angelcare-marketplace/customer-commerce/components/CustomerAuthExperience'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
export const dynamic='force-dynamic'
export default async function Page({params,searchParams}:{params:Promise<{locale:string}> ;searchParams:Promise<Record<string,string|string[]|undefined>>}){const{locale:raw}=await params;const query=await searchParams;const locale=(raw==='en'||raw==='ar'?raw:'fr') as CatalogLocale;const returnTo=typeof query.returnTo==='string'?query.returnTo:`/angelcare-marketplace/${locale}/account`;return <CustomerAuthExperience locale={locale} mode="login" returnTo={returnTo}/>}
