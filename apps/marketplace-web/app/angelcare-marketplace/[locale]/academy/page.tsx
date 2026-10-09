import type {MarketplaceRequestContext} from '@/angelcare-marketplace/domain/types'
import {listPrograms} from '@/angelcare-marketplace/academy-engine/repository'
import {getMarketplaceContext} from '@/angelcare-marketplace/auth/context'
import {PublicAcademyExperience} from '@/angelcare-marketplace/academy-engine/components/PublicAcademyExperience'
import {getPublishedSurface} from '@/angelcare-marketplace/total-commerce-control/repository'
import {Storefront} from '@/angelcare-marketplace/catalog-discovery/components/Storefront'
import {storefrontExperience} from '@/angelcare-marketplace/catalog-discovery/repository'
import {academyContext} from '@/angelcare-marketplace/storefront-immersive/native-context'

export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params
 const context=await getMarketplaceContext()
 const safeLocale=locale==='ar'||locale==='en'?locale:'fr'
 const fallback:MarketplaceRequestContext={actor:{id:'public',email:null,displayName:'Public',sourceRole:'public'},roleKeys:[],permissions:[],assignments:[],territoryId:null,tenantId:null,locale:safeLocale,sessionReference:null}
 const [programs,experience,storefront]=await Promise.all([
  listPrograms(context||fallback),
  getPublishedSurface('academy',{locale:safeLocale}).catch(()=>null),
  storefrontExperience({locale:safeLocale,key:'academy'}),
 ])
 return <Storefront experience={storefront} nativeContext={academyContext(safeLocale,programs,experience)} nativeFallback={<PublicAcademyExperience programs={programs} locale={safeLocale} experience={experience}/>}/>
}
