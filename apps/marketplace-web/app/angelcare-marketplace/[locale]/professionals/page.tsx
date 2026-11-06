import {businessTerritoryFromSearch} from '@/angelcare-marketplace/business-worlds/repository'
import { storefrontMetadata,storefrontNativeMetadata } from '@/angelcare-marketplace/seo-power/storefronts'
import {notFound} from 'next/navigation'
import {Storefront} from '@/angelcare-marketplace/catalog-discovery/components/Storefront'
import {storefrontExperience} from '@/angelcare-marketplace/catalog-discovery/repository'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'
export const dynamic='force-dynamic'
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams?:Promise<Record<string,string|string[]|undefined>>}){
 const territoryCode=businessTerritoryFromSearch(await searchParams)
const{locale}=await params;if(!['fr','en','ar'].includes(locale))notFound();return <Storefront experience={await storefrontExperience({locale:locale as CatalogLocale,key:'professionals',territoryCode})}/>}

export async function generateMetadata({params,searchParams}:{params:Promise<{locale:string}>;searchParams?:Promise<Record<string,string|string[]|undefined>>}){const {locale}=await params;return storefrontMetadata('professionals',locale,await searchParams||{});}
