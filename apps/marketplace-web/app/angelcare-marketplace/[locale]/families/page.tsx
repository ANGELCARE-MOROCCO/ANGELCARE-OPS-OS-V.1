import {GlobalPublicShell} from '@/angelcare-marketplace/public-universe/components/GlobalPublicShell'
import {notFound} from 'next/navigation'
import {Storefront} from '@/angelcare-marketplace/catalog-discovery/components/Storefront'
import {storefrontExperience} from '@/angelcare-marketplace/catalog-discovery/repository'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const [{locale},query]=await Promise.all([params,searchParams])
 if(!['fr','en','ar'].includes(locale))notFound()
 const territory=typeof query.territory==='string'&&/^[A-Za-z0-9_-]{2,60}$/.test(query.territory)?query.territory:'MA-MASTER'
 return <GlobalPublicShell locale={locale as CatalogLocale} navigation={[]} variant="marketplace"><Storefront experience={await storefrontExperience({locale:locale as CatalogLocale,key:'families',territoryCode:territory})}/></GlobalPublicShell>
}
