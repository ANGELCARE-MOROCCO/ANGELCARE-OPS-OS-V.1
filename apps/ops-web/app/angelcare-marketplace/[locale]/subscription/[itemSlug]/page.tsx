import {notFound} from 'next/navigation'
import {PartnerSubscriptionExperience} from '@/angelcare-marketplace/conversion-universe/components/PartnerSubscriptionExperience'
import {getConversionItem,getConversionOptions} from '@/angelcare-marketplace/conversion-universe/repository'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'
export default async function Page({params}:{params:Promise<{locale:string;itemSlug:string}>}){const {locale,itemSlug}=await params;if(!['fr','en','ar'].includes(locale))notFound();const item=await getConversionItem({locale:locale as CatalogLocale,slug:itemSlug});if(!item)notFound();return <PartnerSubscriptionExperience item={item} locale={locale as CatalogLocale} plans={await getConversionOptions({item,journey:'partner_subscription'})}/>}
