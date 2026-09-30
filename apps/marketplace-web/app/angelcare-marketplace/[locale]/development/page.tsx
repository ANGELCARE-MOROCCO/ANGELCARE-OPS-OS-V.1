import {notFound} from 'next/navigation'
import {PublicDevelopmentExperience} from '@/angelcare-marketplace/development-engine/components/PublicDevelopmentExperience'
import {listDevelopmentActivities,listDevelopmentCategories,listDevelopmentKits} from '@/angelcare-marketplace/development-engine/repository'
import {getPublishedSurface} from '@/angelcare-marketplace/total-commerce-control/repository'
import {Storefront} from '@/angelcare-marketplace/catalog-discovery/components/Storefront'
import {storefrontExperience} from '@/angelcare-marketplace/catalog-discovery/repository'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'

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
 return <Storefront experience={storefront} nativeFallback={<PublicDevelopmentExperience locale={safe} categories={categories} activities={activities} kits={kits} experience={experience}/>}/>
}
