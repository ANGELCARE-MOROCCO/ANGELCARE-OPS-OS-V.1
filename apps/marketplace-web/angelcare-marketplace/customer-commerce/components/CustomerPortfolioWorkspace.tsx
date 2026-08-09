import Link from 'next/link'
import { CalendarClock, PackageCheck, ShieldCheck, WalletCards } from 'lucide-react'
import type { CustomerPortfolio } from '../types'
import { CustomerPortalNavigation } from './CustomerPortalNavigation'
import styles from '../customer-commerce.module.css'
const PORTFOLIO_TITLES: Record<
  CustomerPortfolio['locale'],
  Record<CustomerPortfolio['filter'], string>
> = {
  fr: {
    product_order: 'Commandes & produits',
    family_booking: 'Réservations & services',
    academy_enrollment: 'Academy & inscriptions',
    b2b_quotation: 'Devis & solutions',
    partner_activation: 'Abonnements & Partner OS',
    quality_assessment: 'Quality Check 360',
    kit_order: 'Commandes de kits',
    recurring_service: 'Services récurrents',
    hospitality_programme: 'Programmes hôteliers',
    corporate_benefit: 'Avantages entreprise',
    all: 'Tous les parcours',
  },
  en: {
    product_order: 'Orders & products',
    family_booking: 'Bookings & services',
    academy_enrollment: 'Academy & enrollments',
    b2b_quotation: 'Quotes & solutions',
    partner_activation: 'Subscriptions & Partner OS',
    quality_assessment: 'Quality Check 360',
    kit_order: 'Kit orders',
    recurring_service: 'Recurring services',
    hospitality_programme: 'Hospitality programmes',
    corporate_benefit: 'Corporate benefits',
    all: 'All journeys',
  },
  ar: {
    product_order: 'الطلبات والمنتجات',
    family_booking: 'الحجوزات والخدمات',
    academy_enrollment: 'الأكاديمية والتسجيلات',
    b2b_quotation: 'عروض الأسعار والحلول',
    partner_activation: 'الاشتراكات وPartner OS',
    quality_assessment: 'Quality Check 360',
    kit_order: 'طلبات الأطقم التعليمية',
    recurring_service: 'الخدمات المتكررة',
    hospitality_programme: 'برامج الضيافة',
    corporate_benefit: 'مزايا الشركات',
    all: 'كل المسارات',
  },
}

const titleFor = (
  filter: CustomerPortfolio['filter'],
  locale: CustomerPortfolio['locale'],
): string => PORTFOLIO_TITLES[locale][filter]
export function CustomerPortfolioWorkspace({data}:{data:CustomerPortfolio}){const{locale}=data;const title=titleFor(data.filter,locale);return <main className={styles.root} dir={locale==='ar'?'rtl':'ltr'}><div className={styles.portalShell}><section className={styles.portalHero}><div><span className={styles.eyebrow}>MON ANGELCARE · SEGMENTED PORTFOLIO</span><h1>{title}</h1><p>{locale==='fr'?'Cette vue contient uniquement les parcours du type demandé, avec les actions, paiements et documents réellement associés.':locale==='ar'?'يعرض هذا القسم فقط المسارات المطلوبة مع الإجراءات والمدفوعات والوثائق المرتبطة فعلياً.':'This view contains only the requested journey type with its real actions, payments and documents.'}</p></div><aside className={styles.walletMini}><WalletCards/><strong>{data.wallet?.available_balance.toLocaleString(locale)||0} AC</strong><span>{data.wallet?.membership?.tier_name||'AC Wallet Member'}</span></aside></section><CustomerPortalNavigation locale={locale}/><section className={styles.metricGrid}><article className={styles.metricCard}><PackageCheck/><strong>{data.filteredJourneys.length}</strong><span>{title}</span></article><article className={styles.metricCard}><CalendarClock/><strong>{data.filteredJourneys.filter((j)=>j.scheduled_start_at).length}</strong><span>{locale==='fr'?'Planifiés':locale==='ar'?'مجدولة':'Scheduled'}</span></article><article className={styles.metricCard}><ShieldCheck/><strong>{data.filteredJourneys.filter((j)=>['blocked','recovery'].includes(j.status)).length}</strong><span>{locale==='fr'?'Sous attention':locale==='ar'?'تحتاج متابعة':'Need attention'}</span></article></section><section className={styles.panel}><header><div><span className={styles.eyebrow}>CUSTOMER PORTFOLIO</span><h2>{title}</h2></div></header>{data.filteredJourneys.length?<div className={styles.journeyList}>{data.filteredJourneys.map((j)=><Link className={styles.journeyCard} href={`/angelcare-marketplace/${locale}/account/journeys/${j.id}`} key={j.id}><div><span>{j.journey_type.replaceAll('_',' ')}</span><h3>{j.title}</h3><p>{j.status} · {j.current_authority} · {j.next_action_label||''}</p></div><time>{j.public_reference}</time><div className={styles.progressTrack}><i style={{width:`${j.completion_percent}%`}}/></div></Link>)}</div>:<div className={styles.emptyState}>{locale==='fr'?'Aucun élément dans cette catégorie.':locale==='ar'?'لا توجد عناصر في هذا القسم.':'No item in this category.'}</div>}</section></div></main>}
