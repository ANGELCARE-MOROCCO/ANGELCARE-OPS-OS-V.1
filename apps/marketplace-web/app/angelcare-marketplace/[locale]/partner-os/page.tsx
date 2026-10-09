import {notFound} from 'next/navigation'
import {PublicPartnerOs} from '@/angelcare-marketplace/partner-os/components/PublicPartnerOs'
import {listPlans} from '@/angelcare-marketplace/partner-os/repository'
import {Storefront} from '@/angelcare-marketplace/catalog-discovery/components/Storefront'
import {storefrontExperience} from '@/angelcare-marketplace/catalog-discovery/repository'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'
import {partnerContext} from '@/angelcare-marketplace/storefront-immersive/native-context'

export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params
 if(!['fr','en','ar'].includes(locale))notFound()
 const safe=locale as CatalogLocale
 const [plans,storefront]=await Promise.all([listPlans(),storefrontExperience({locale:safe,key:'partner-os'})])
 return <Storefront experience={storefront} nativeContext={partnerContext(safe,plans)} nativeFallback={<PublicPartnerOs locale={safe} plans={plans}/>}/>
}
