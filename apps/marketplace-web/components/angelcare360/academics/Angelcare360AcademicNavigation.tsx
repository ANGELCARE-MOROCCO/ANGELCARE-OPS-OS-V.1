'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Angelcare360AcademicNavigationItem } from '@/data/angelcare360/academics-navigation'
import styles from '@/components/angelcare360/zone-a-academic/AcademicZoneAChrome.module.css'

type Props = { items: Angelcare360AcademicNavigationItem[] }
const specialistKeys = new Set(['cours', 'soumissions', 'sessions', 'moyennes', 'appreciations'])

export default function Angelcare360AcademicNavigation({ items }: Props) {
  const pathname = usePathname() || '/angelcare-360-command-center/academique'
  const specialist = items.filter((item) => specialistKeys.has(item.key))
  if (!specialist.length) return null
  return (
    <nav className={styles.specialistBar} aria-label="Outils académiques spécialisés">
      <span className={styles.specialistLabel}>Outils spécialisés</span>
      <div className={styles.specialistTrack}>
        {specialist.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return <Link key={item.key} href={item.href} data-active={active} aria-current={active ? 'page' : undefined} title={item.summary}><span>{item.label}</span>{item.badge ? <b>{item.badge}</b> : null}</Link>
        })}
      </div>
    </nav>
  )
}
