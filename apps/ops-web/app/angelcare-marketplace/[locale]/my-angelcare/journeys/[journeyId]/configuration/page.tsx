import { notFound } from 'next/navigation'
import { categoryNativeJourneyContinuity } from '@/angelcare-marketplace/category-native-experience/repository'
import { categoryNativeLocale } from '@/angelcare-marketplace/category-native-experience/validation'
import styles from '@/angelcare-marketplace/category-native-experience/experience.module.css'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{locale:string;journeyId:string}>}){const {locale,journeyId}=await params;const safe=categoryNativeLocale(locale);const data=await categoryNativeJourneyContinuity({journeyId,locale:safe});if(!data)notFound();return <main className={styles.continuity} dir={safe==='ar'?'rtl':'ltr'}><header><span>MON ANGELCARE · CONFIGURATION CONTINUITY</span><h1>{safe==='ar'?'اختياراتكم محفوظة':safe==='en'?'Your selections remain intact':'Vos choix restent intacts'}</h1></header><pre>{JSON.stringify(data,null,2)}</pre></main>}
