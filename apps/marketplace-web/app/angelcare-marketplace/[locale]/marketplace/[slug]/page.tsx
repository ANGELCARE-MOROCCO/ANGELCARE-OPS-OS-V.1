import { notFound } from 'next/navigation'
import { AdaptiveExperience } from '@/angelcare-marketplace/category-native-experience/components/AdaptiveExperience'
import { getAdaptiveExperience } from '@/angelcare-marketplace/category-native-experience/repository'
import { categoryNativeLocale } from '@/angelcare-marketplace/category-native-experience/validation'
export const dynamic = 'force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string;slug:string}>}){const {locale,slug}=await params;const data=await getAdaptiveExperience({locale:categoryNativeLocale(locale),slug});if(!data){notFound()}return <AdaptiveExperience data={data}/>}
