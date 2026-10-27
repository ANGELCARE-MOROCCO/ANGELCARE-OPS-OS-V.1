import { storefrontMetadata,storefrontNativeMetadata } from '@/angelcare-marketplace/seo-power/storefronts'
import {notFound} from 'next/navigation'
import {PublicDevelopmentExperience} from '@/angelcare-marketplace/development-engine/components/PublicDevelopmentExperience'
import {listDevelopmentActivities,listDevelopmentCategories,listDevelopmentKits} from '@/angelcare-marketplace/development-engine/repository'
import {getPublishedSurface} from '@/angelcare-marketplace/total-commerce-control/repository'
import {Storefront} from '@/angelcare-marketplace/catalog-discovery/components/Storefront'
import {storefrontExperience} from '@/angelcare-marketplace/catalog-discovery/repository'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'
import {developmentContext} from '@/angelcare-marketplace/storefront-immersive/native-context'

export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params
 if(!['fr','en','ar'].includes(locale))notFound()
 const safe=locale as CatalogLocale
 const [categories,activities,kits,experience,storefront]=await Promise.all([
  listDevelopmentCategories(),
  listDevelopmentActivities({status:'published'}),
  listDevelopmentKits(),
  getPublishedSurface('development',{locale:safe}).catch(()=>null),
  storefrontExperience({locale:safe,key:'development'}),
 ])
 return <Storefront experience={storefront} nativeContext={developmentContext(safe,categories,activities,kits,experience)} nativeFallback={<PublicDevelopmentExperience locale={safe} categories={categories} activities={activities} kits={kits} experience={experience}/>}/>
}

export async function generateMetadata({params,searchParams}:{params:Promise<{locale:string}>;searchParams?:Promise<Record<string,string|string[]|undefined>>}){const {locale}=await params;return storefrontMetadata('development',locale,await searchParams||{});}
