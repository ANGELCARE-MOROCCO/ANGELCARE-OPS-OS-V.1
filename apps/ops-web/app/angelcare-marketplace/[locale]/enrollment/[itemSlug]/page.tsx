import {notFound} from 'next/navigation'
import {AcademyEnrollmentExperience} from '@/angelcare-marketplace/conversion-universe/components/AcademyEnrollmentExperience'
import {getConversionItem,getConversionOptions} from '@/angelcare-marketplace/conversion-universe/repository'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'
export default async function Page({params}:{params:Promise<{locale:string;itemSlug:string}>}){const {locale,itemSlug}=await params;if(!['fr','en','ar'].includes(locale))notFound();const item=await getConversionItem({locale:locale as CatalogLocale,slug:itemSlug});if(!item)notFound();return <AcademyEnrollmentExperience item={item} locale={locale as CatalogLocale} cohorts={await getConversionOptions({item,journey:'academy_enrollment'})}/>}
