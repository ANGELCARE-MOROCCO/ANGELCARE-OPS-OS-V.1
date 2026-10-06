'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CatalogLocale } from '../../catalog-discovery/types'
import styles from '../customer-commerce.module.css'

type NavItem={suffix:string;labels:Record<CatalogLocale,string>;group:'commerce'|'family'|'finance'|'account'}
const NAV_ITEMS:NavItem[]=[
  {suffix:'',labels:{fr:'Vue générale',en:'Overview',ar:'نظرة عامة'},group:'commerce'},
  {suffix:'saved',labels:{fr:'Favoris',en:'Saved',ar:'المحفوظات'},group:'commerce'},
  {suffix:'action-center',labels:{fr:'À faire',en:'Action Center',ar:'الإجراءات'},group:'commerce'},
  {suffix:'orders',labels:{fr:'Commandes',en:'Orders',ar:'الطلبات'},group:'commerce'},
  {suffix:'bookings',labels:{fr:'Réservations',en:'Bookings',ar:'الحجوزات'},group:'commerce'},
  {suffix:'enrollments',labels:{fr:'Academy',en:'Academy',ar:'الأكاديمية'},group:'commerce'},
  {suffix:'family',labels:{fr:'Ma famille',en:'My Family',ar:'عائلتي'},group:'family'},
  {suffix:'quotations',labels:{fr:'Devis',en:'Quotes',ar:'عروض الأسعار'},group:'commerce'},
  {suffix:'subscriptions',labels:{fr:'Abonnements',en:'Subscriptions',ar:'الاشتراكات'},group:'commerce'},
  {suffix:'assessments',labels:{fr:'Quality Check',en:'Quality Check',ar:'فحص الجودة'},group:'commerce'},
  {suffix:'wallet',labels:{fr:'Wallet',en:'Wallet',ar:'المحفظة'},group:'finance'},
  {suffix:'payments',labels:{fr:'Paiements',en:'Payments',ar:'المدفوعات'},group:'finance'},
  {suffix:'documents',labels:{fr:'Documents',en:'Documents',ar:'الوثائق'},group:'account'},
  {suffix:'notifications',labels:{fr:'Notifications',en:'Notifications',ar:'الإشعارات'},group:'account'},
  {suffix:'support',labels:{fr:'Assistance',en:'Support',ar:'الدعم'},group:'account'},
  {suffix:'settings',labels:{fr:'Compte & sécurité',en:'Account & Security',ar:'الحساب والأمان'},group:'account'},
]

export function CustomerPortalNavigation({locale}:{locale:CatalogLocale}){
  const pathname=usePathname()
  return <nav className={styles.portalNav} aria-label="Mon ANGELCARE">
    {NAV_ITEMS.map((item)=>{
      const href=`/angelcare-marketplace/${locale}/account${item.suffix?`/${item.suffix}`:''}`
      const active=item.suffix?pathname===href||pathname.startsWith(`${href}/`):pathname===href
      return <Link key={href} data-active={active} data-group={item.group} aria-current={active?'page':undefined} href={href}>{item.labels[locale]}</Link>
    })}
  </nav>
}
