'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Angelcare360TimetableNavigationItem } from '@/data/angelcare360/timetable-navigation'
import styles from '@/components/angelcare360/zone-a-academic/AcademicZoneAChrome.module.css'

type Props = { items: Angelcare360TimetableNavigationItem[] }

export default function Angelcare360TimetableNavigation({ items }: Props) {
  const pathname = usePathname() || '/angelcare-360-command-center/emploi-du-temps'
  const secondary = items.filter((item) => item.key !== 'overview')
  return (
    <nav className={styles.specialistBar} aria-label="Vues spécialisées de l’emploi du temps">
      <span className={styles.specialistLabel}>Vues airspace</span>
      <div className={styles.specialistTrack}>
        {secondary.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return <Link key={item.key} href={item.href} data-active={active} aria-current={active ? 'page' : undefined} title={item.summary}><span>{item.label}</span>{item.badge ? <b>{item.badge}</b> : null}</Link>
        })}
      </div>
    </nav>
  )
}
