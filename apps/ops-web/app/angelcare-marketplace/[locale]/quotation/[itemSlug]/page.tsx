import {notFound} from 'next/navigation'
import {B2BQuotationExperience} from '@/angelcare-marketplace/conversion-universe/components/B2BQuotationExperience'
import {QualityAssessmentExperience} from '@/angelcare-marketplace/conversion-universe/components/QualityAssessmentExperience'
import {getConversionItem,getConversionOptions} from '@/angelcare-marketplace/conversion-universe/repository'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'
export default async function Page({params}:{params:Promise<{locale:string;itemSlug:string}>}){const {locale,itemSlug}=await params;if(!['fr','en','ar'].includes(locale))notFound();const item=await getConversionItem({locale:locale as CatalogLocale,slug:itemSlug});if(!item)notFound();if(item.kind==='audit'||item.category_key==='quality-check')return <QualityAssessmentExperience item={item} locale={locale as CatalogLocale} frameworks={await getConversionOptions({item,journey:'quality_assessment'})}/>;return <B2BQuotationExperience item={item} locale={locale as CatalogLocale}/>}
