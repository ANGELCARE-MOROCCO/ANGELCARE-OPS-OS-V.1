import { notFound } from 'next/navigation'
import { AdaptiveExperience } from '@/angelcare-marketplace/category-native-experience/components/AdaptiveExperience'
import { getAdaptiveExperience } from '@/angelcare-marketplace/category-native-experience/repository'
import { categoryNativeLocale } from '@/angelcare-marketplace/category-native-experience/validation'
export const dynamic = 'force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string;itemSlug:string}>}){const {locale,itemSlug}=await params;const safe=categoryNativeLocale(locale);const data=await getAdaptiveExperience({locale:safe,slug:itemSlug});if(!data){notFound()}return <AdaptiveExperience data={data}/>}
