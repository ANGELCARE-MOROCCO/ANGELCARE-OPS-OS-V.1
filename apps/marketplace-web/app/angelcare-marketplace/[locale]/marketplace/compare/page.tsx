import { CategoryNativeCompare } from '@/angelcare-marketplace/category-native-experience/components/CategoryNativeCompare'
import { compareCategoryNativeItems } from '@/angelcare-marketplace/category-native-experience/repository'
import { categoryNativeLocale } from '@/angelcare-marketplace/category-native-experience/validation'
export const dynamic = 'force-dynamic'
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const {locale}=await params;const query=await searchParams;const raw=query.items||query.item||[];const slugs=(Array.isArray(raw)?raw:[raw]).flatMap((value)=>String(value||'').split(',')).filter(Boolean);const result=await compareCategoryNativeItems({locale:categoryNativeLocale(locale),slugs});return <CategoryNativeCompare result={result}/>}
