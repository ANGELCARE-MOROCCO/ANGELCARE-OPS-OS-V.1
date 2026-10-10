import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import { GitCompareArrows } from 'lucide-react'
import { CategoryNativeCompare } from '@/angelcare-marketplace/category-native-experience/components/CategoryNativeCompare'
import { compareCategoryNativeItems } from '@/angelcare-marketplace/category-native-experience/repository'
import { comparisonSelectionSlugs } from '@/angelcare-marketplace/category-native-experience/comparison-selection'
import { categoryNativeLocale } from '@/angelcare-marketplace/category-native-experience/validation'
import styles from '@/angelcare-marketplace/category-native-experience/experience.module.css'

export const dynamic = 'force-dynamic'

export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const { locale } = await params
  const catalogLocale = categoryNativeLocale(locale)
  const query = await searchParams
  const raw = query.items || query.item || []
  const explicit = (Array.isArray(raw) ? raw : [raw]).flatMap((value) => String(value || '').split(',')).filter(Boolean)
  const slugs = explicit.length ? explicit.slice(0, 4) : await comparisonSelectionSlugs(catalogLocale, 4)

  if (!slugs.length) {
    const title = catalogLocale === 'fr' ? 'Votre comparateur est prêt' : catalogLocale === 'ar' ? 'المقارنة جاهزة' : 'Your comparison center is ready'
    const body = catalogLocale === 'fr' ? 'Ajoutez des offres avec le bouton Comparer depuis le Marketplace. Nous ne fabriquons aucune comparaison quand aucune sélection réelle n’existe.' : catalogLocale === 'ar' ? 'أضف العروض باستخدام زر المقارنة من السوق. لا ننشئ مقارنة وهمية عند عدم وجود اختيارات فعلية.' : 'Add offers with the Compare action from the Marketplace. No comparison is fabricated when you have no real selections.'
    const cta = catalogLocale === 'fr' ? 'Explorer le Marketplace' : catalogLocale === 'ar' ? 'استكشف السوق' : 'Explore the Marketplace'
    return <main className={styles.experience} dir={catalogLocale === 'ar' ? 'rtl' : 'ltr'}><section className={styles.compareShell}><header className={styles.sectionHeader}><span>ANGELCARE COMPARISON</span><h1>{title}</h1><p>{body}</p></header><Link className={styles.primaryAction} href={`/angelcare-marketplace/${catalogLocale}/marketplace`}><GitCompareArrows size={18}/>{cta}</Link></section></main>
  }

  try {
    const result = await compareCategoryNativeItems({ locale: catalogLocale, slugs })
    return <CategoryNativeCompare result={result}/>
  } catch {
    const title = catalogLocale === 'fr' ? 'Choisissez des offres comparables' : catalogLocale === 'ar' ? 'اختر عروضاً قابلة للمقارنة' : 'Choose comparable offers'
    const body = catalogLocale === 'fr' ? 'Les offres doivent appartenir au même archétype pour produire une comparaison utile et honnête.' : catalogLocale === 'ar' ? 'يجب أن تنتمي العروض إلى نفس النوع حتى تكون المقارنة مفيدة وصادقة.' : 'Offers must belong to the same experience type to produce a useful, honest comparison.'
    const cta = catalogLocale === 'fr' ? 'Revenir au Marketplace' : catalogLocale === 'ar' ? 'العودة إلى السوق' : 'Back to Marketplace'
    return <main className={styles.experience} dir={catalogLocale === 'ar' ? 'rtl' : 'ltr'}><section className={styles.compareShell}><header className={styles.sectionHeader}><span>ANGELCARE COMPARISON</span><h1>{title}</h1><p>{body}</p></header><Link className={styles.primaryAction} href={`/angelcare-marketplace/${catalogLocale}/marketplace`}><GitCompareArrows size={18}/>{cta}</Link></section></main>
  }
}
