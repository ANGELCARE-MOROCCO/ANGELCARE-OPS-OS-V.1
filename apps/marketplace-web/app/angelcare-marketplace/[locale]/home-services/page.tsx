import {notFound} from 'next/navigation'
import {GlobalPublicShell} from '@/angelcare-marketplace/public-universe/components/GlobalPublicShell'
import {Storefront} from '@/angelcare-marketplace/catalog-discovery/components/Storefront'
import {storefrontExperience} from '@/angelcare-marketplace/catalog-discovery/repository'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'
export const dynamic='force-dynamic'
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const [{locale},query]=await Promise.all([params,searchParams])
 if(!['fr','en','ar'].includes(locale))notFound()
 const territory=typeof query.territory==='string'&&/^[A-Za-z0-9_-]{2,60}$/.test(query.territory)?query.territory:'MA-MASTER'
 const discoveryState=Object.fromEntries(['q','group','duration','available','max','sort','view','page'].map(key=>[key,typeof query[key]==='string'?query[key] as string:'']))
 return <GlobalPublicShell locale={locale as CatalogLocale} navigation={[]} variant="marketplace"><Storefront experience={await storefrontExperience({locale:locale as CatalogLocale,key:'home-services',territoryCode:territory})} discoveryState={discoveryState}/></GlobalPublicShell>
}
