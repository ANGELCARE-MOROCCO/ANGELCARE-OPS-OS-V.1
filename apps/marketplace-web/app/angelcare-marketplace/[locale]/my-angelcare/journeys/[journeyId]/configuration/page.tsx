import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import {notFound} from 'next/navigation'
import {Sparkles,ArrowLeft} from 'lucide-react'
import {requireCustomerPageContext} from '@/angelcare-marketplace/customer-commerce/customer-auth'
import {getCustomerJourney} from '@/angelcare-marketplace/journey-control/repository'
import {categoryNativeJourneyContinuity} from '@/angelcare-marketplace/category-native-experience/repository'
import {categoryNativeLocale} from '@/angelcare-marketplace/category-native-experience/validation'
import {CATEGORY_NATIVE_SCHEMA_BLUEPRINTS} from '@/angelcare-marketplace/category-native/registry'
import styles from '@/angelcare-marketplace/customer-experience/commerce.module.css'
export const dynamic='force-dynamic'
const object=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}
export default async function Page({params}:{params:Promise<{locale:string;journeyId:string}>}) {
 const {locale,journeyId}=await params,safe=categoryNativeLocale(locale)
 const context=await requireCustomerPageContext(safe,`/angelcare-marketplace/${safe}/my-angelcare/journeys/${encodeURIComponent(journeyId)}/configuration`)
 const journey=await getCustomerJourney(journeyId,context.marketplace)
 const data=await categoryNativeJourneyContinuity({journeyId:journey.canonical_object_id||journey.id,locale:safe});if(!data)notFound()
 const session=object(data.session),configuration=object(session.configuration)
 const schema=CATEGORY_NATIVE_SCHEMA_BLUEPRINTS.find(schema=>schema.schema_key===session.schema_key)
 const fields=(schema?.fields||[]).filter(field=>field.public_visible&&!['identity','publication','seo'].includes(field.section_key)&&configuration[field.field_key]!=null&&configuration[field.field_key]!=='')
 const title=safe==='fr'?'Vos choix, conservés avec votre demande.':safe==='ar'?'اختياراتك محفوظة مع طلبك.':'Your choices, retained with your request.'
 return <main className={styles.root} dir={safe==='ar'?'rtl':'ltr'}><header className={styles.hero}><div><span className={styles.eyebrow}><Sparkles size={16}/> MON ANGELCARE</span><h1>{title}</h1><p>{journey.title} · {journey.public_reference}</p><Link className={styles.secondary} href={`/angelcare-marketplace/${safe}/account/journeys/${journey.id}`}><ArrowLeft size={16}/>{safe==='fr'?'Retour au parcours':safe==='ar'?'العودة إلى المسار':'Back to journey'}</Link></div></header><section className={styles.panel} style={{marginTop:24}}><h2>{safe==='fr'?'Votre configuration enregistrée':safe==='ar'?'الإعداد المسجل':'Your recorded configuration'}</h2><div className={styles.review}>{fields.map(field=><article key={field.field_key}><span>{safe==='fr'?field.label_fr:safe==='ar'?field.label_ar:field.label_en}</span><strong>{Array.isArray(configuration[field.field_key])?(configuration[field.field_key] as unknown[]).filter(v=>typeof v==='string'||typeof v==='number').join(' · '):typeof configuration[field.field_key]==='object'?(safe==='fr'?'Détails enregistrés':safe==='ar'?'تم تسجيل التفاصيل':'Details recorded'):String(configuration[field.field_key])}</strong></article>)}</div>{!fields.length?<p>{safe==='fr'?'Aucun détail public supplémentaire pour cette configuration.':safe==='ar'?'لا توجد تفاصيل عامة إضافية لهذا الإعداد.':'No additional public details for this configuration.'}</p>:null}</section></main>
}
