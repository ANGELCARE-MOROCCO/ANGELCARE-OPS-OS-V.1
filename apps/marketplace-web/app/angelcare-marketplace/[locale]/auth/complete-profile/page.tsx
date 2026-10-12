import {notFound} from 'next/navigation'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'
import {customerReturnTo} from '@/angelcare-marketplace/customer-commerce/auth-navigation'
import {CustomerSocialProfile} from '@/angelcare-marketplace/customer-commerce/components/CustomerSocialProfile'
export const dynamic='force-dynamic'
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const [{locale},query]=await Promise.all([params,searchParams]);if(!['fr','en','ar'].includes(locale))notFound()
 return <CustomerSocialProfile locale={locale as CatalogLocale} returnTo={customerReturnTo(query.returnTo,locale as CatalogLocale)}/>
}
