import {PublicEstablishmentsExperience} from '@/angelcare-marketplace/b2b-verticals/components/PublicEstablishmentsExperience'
import {publicVerticalSnapshot} from '@/angelcare-marketplace/b2b-verticals/repository'
import {getPublishedSurface} from '@/angelcare-marketplace/total-commerce-control/repository'
import {Storefront} from '@/angelcare-marketplace/catalog-discovery/components/Storefront'
import {storefrontExperience} from '@/angelcare-marketplace/catalog-discovery/repository'
import {surfaceContext} from '@/angelcare-marketplace/storefront-immersive/native-context'

export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale:raw}=await params
 const locale=raw==='ar'?'ar':raw==='en'?'en':'fr'
 const [snapshot,experience,storefront]=await Promise.all([
  publicVerticalSnapshot('establishment'),
  getPublishedSurface('establishments',{locale}).catch(()=>null),
  storefrontExperience({locale,key:'establishments'}),
 ])
 return <Storefront experience={storefront} nativeContext={surfaceContext(experience)} nativeFallback={<PublicEstablishmentsExperience locale={locale} mode="establishments" activePrograms={snapshot.activePrograms} organizations={snapshot.organizations} experience={experience}/>}/>
}
