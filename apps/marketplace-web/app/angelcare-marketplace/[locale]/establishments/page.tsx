import {businessTerritoryFromSearch, prepareBusinessStorefront} from '@/angelcare-marketplace/business-worlds/repository'
import {EstablishmentsExperience} from '@/angelcare-marketplace/establishments-world/Experience'
import {GlobalPublicShell} from '@/angelcare-marketplace/public-universe/components/GlobalPublicShell'
import { storefrontMetadata,storefrontNativeMetadata } from '@/angelcare-marketplace/seo-power/storefronts'
import {PublicEstablishmentsExperience} from '@/angelcare-marketplace/b2b-verticals/components/PublicEstablishmentsExperience'
import {publicVerticalSnapshot} from '@/angelcare-marketplace/b2b-verticals/repository'
import {getPublishedSurface} from '@/angelcare-marketplace/total-commerce-control/repository'
import {Storefront} from '@/angelcare-marketplace/catalog-discovery/components/Storefront'
import {storefrontExperience} from '@/angelcare-marketplace/catalog-discovery/repository'
import {surfaceContext} from '@/angelcare-marketplace/storefront-immersive/native-context'

export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams?:Promise<Record<string,string|string[]|undefined>>}){
 const territoryCode=businessTerritoryFromSearch(await searchParams)

 const {locale:raw}=await params
 const locale=raw==='ar'?'ar':raw==='en'?'en':'fr'
 // The approved reference pages concern the French Établissements body only.
 // Shared shell, other storefronts and existing EN/AR runtime keep their authority.
 if(locale==='fr'){
  const catalogue=await prepareBusinessStorefront(await storefrontExperience({locale,key:'establishments',territoryCode}),'establishments')
  return <GlobalPublicShell locale={locale} navigation={[]} variant="marketplace"><EstablishmentsExperience experience={catalogue}/></GlobalPublicShell>
 }
 const [snapshot,experience,storefront]=await Promise.all([
  publicVerticalSnapshot('establishment'),
  getPublishedSurface('establishments',{locale}).catch(()=>null),
  storefrontExperience({locale,key:'establishments',territoryCode}),
 ])
 return <Storefront experience={storefront} nativeContext={surfaceContext(experience)} nativeFallback={<PublicEstablishmentsExperience locale={locale} mode="establishments" activePrograms={snapshot.activePrograms} organizations={snapshot.organizations} experience={experience}/>}/>
}

export async function generateMetadata({params,searchParams}:{params:Promise<{locale:string}>;searchParams?:Promise<Record<string,string|string[]|undefined>>}){const {locale}=await params;return storefrontMetadata('establishments',locale,await searchParams||{});}
