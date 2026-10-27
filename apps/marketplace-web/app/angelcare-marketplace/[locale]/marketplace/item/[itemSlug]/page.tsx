import { seoMetadata } from '@/angelcare-marketplace/seo-power/public'
import { notFound } from 'next/navigation'
import { PublicCatalogExperience } from '@/angelcare-marketplace/studio-public-runtime/components/PublicCatalogExperience'
import { getAdaptiveExperience } from '@/angelcare-marketplace/category-native-experience/repository'
import { categoryNativeLocale } from '@/angelcare-marketplace/category-native-experience/validation'
import { resolveStudioTemplateForCatalogItem } from '@/angelcare-marketplace/studio-template-assignment/resolver'
export const dynamic = 'force-dynamic'
export default async function Page({params,searchParams}:{params:Promise<{locale:string;itemSlug:string}>;searchParams:Promise<{collection?:string;placement?:string;campaign?:string;audience?:string}>}){const {locale,itemSlug}=await params;const query=await searchParams;const safe=categoryNativeLocale(locale);const [data,templateResolution]=await Promise.all([getAdaptiveExperience({locale:safe,slug:itemSlug}),resolveStudioTemplateForCatalogItem({locale:safe,slug:itemSlug,collectionId:query.collection||null,placementId:query.placement||null})]);if(!data){notFound()}return <PublicCatalogExperience data={data} templateResolution={templateResolution} collectionId={query.collection||null} placementId={query.placement||null} campaignId={query.campaign||null} audienceId={query.audience||null}/>}

export async function generateMetadata({params}:{params:Promise<{locale:string;itemSlug:string}>}){const {locale,itemSlug}=await params;const safe=categoryNativeLocale(locale),data=await getAdaptiveExperience({locale:safe,slug:itemSlug});const base=data?{title:data.item.name,description:data.item.description||undefined}:{robots:{index:false,follow:false}};return seoMetadata('angelcare',`/angelcare-marketplace/${safe}/marketplace/item/${encodeURIComponent(itemSlug)}`,base);}
