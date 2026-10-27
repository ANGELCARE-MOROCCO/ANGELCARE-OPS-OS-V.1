import { storefrontMetadata,storefrontNativeMetadata } from '@/angelcare-marketplace/seo-power/storefronts'
import {PublicCorporateExperience} from '@/angelcare-marketplace/b2b-verticals/components/PublicCorporateExperience'
import {publicVerticalSnapshot} from '@/angelcare-marketplace/b2b-verticals/repository'
import {getPublishedSurface} from '@/angelcare-marketplace/total-commerce-control/repository'
import {Storefront} from '@/angelcare-marketplace/catalog-discovery/components/Storefront'
import {storefrontExperience} from '@/angelcare-marketplace/catalog-discovery/repository'
import {surfaceContext} from '@/angelcare-marketplace/storefront-immersive/native-context'

export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale:raw}=await params
 const locale=raw==='ar'?'ar':raw==='en'?'en':'fr'
 const [snapshot,experience,storefront]=await Promise.all([
  publicVerticalSnapshot('corporate'),
  getPublishedSurface('corporates',{locale}).catch(()=>null),
  storefrontExperience({locale,key:'corporates'}),
 ])
 return <Storefront experience={storefront} nativeContext={surfaceContext(experience)} nativeFallback={<PublicCorporateExperience locale={locale} mode="corporates" activePrograms={snapshot.activePrograms} organizations={snapshot.organizations} experience={experience}/>}/>
}

export async function generateMetadata({params,searchParams}:{params:Promise<{locale:string}>;searchParams?:Promise<Record<string,string|string[]|undefined>>}){const {locale}=await params;return storefrontMetadata('corporates',locale,await searchParams||{});}
