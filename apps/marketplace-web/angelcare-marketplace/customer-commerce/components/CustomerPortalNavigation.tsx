'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CatalogLocale } from '../../catalog-discovery/types'
import { customerCopy } from '../content'
import styles from '../customer-commerce.module.css'
export function CustomerPortalNavigation({locale}:{locale:CatalogLocale}){const pathname=usePathname();const t=customerCopy(locale);const items=[['',locale==='fr'?'Vue générale':locale==='ar'?'نظرة عامة':'Overview'],['orders',t.orders],['bookings',t.bookings],['enrollments',t.enrollments],['quotations',t.quotations],['subscriptions',t.subscriptions],['assessments',t.assessments],['wallet',t.wallet],['payments',locale==='fr'?'Paiements':locale==='ar'?'المدفوعات':'Payments'],['documents',locale==='fr'?'Documents':locale==='ar'?'الوثائق':'Documents'],['support',locale==='fr'?'Assistance':locale==='ar'?'الدعم':'Support'],['settings',locale==='fr'?'Paramètres':locale==='ar'?'الإعدادات':'Settings']];return <nav className={styles.portalNav} aria-label="Mon ANGELCARE">{items.map(([suffix,label])=>{const href=`/angelcare-marketplace/${locale}/account${suffix?`/${suffix}`:''}`;return <Link key={href} data-active={pathname===href} href={href}>{label}</Link>})}</nav>}
