import type { ReactNode } from 'react'
import Angelcare360TimetableNavigation from './Angelcare360TimetableNavigation'
import type { Angelcare360TimetableNavigationItem } from '@/data/angelcare360/timetable-navigation'
import AcademicZoneAFrame from '@/components/angelcare360/zone-a-academic/AcademicZoneAFrame'
import styles from '@/components/angelcare360/zone-a-academic/AcademicZoneAChrome.module.css'

type Props = {
  title: string
  subtitle: string
  badge?: string
  statusLabel?: string
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  contextRow?: ReactNode
  navigationItems: Angelcare360TimetableNavigationItem[]
  children: ReactNode
}

export default function Angelcare360TimetablePageShell({ title, subtitle, badge, statusLabel, primaryAction, secondaryActions, contextRow, navigationItems, children }: Props) {
  return (
    <AcademicZoneAFrame eyebrow="Timetable Airspace">
      <section className={styles.pageShell} data-zone-a-surface="timetable">
        <header className={styles.hero}>
          <div className={styles.heading}>
            <div className={styles.eyebrowRow}>{badge ? <span className={styles.badge}>{badge}</span> : null}{statusLabel ? <span className={styles.status}>{statusLabel}</span> : null}</div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          {primaryAction || secondaryActions ? <div className={styles.heroActions}>{secondaryActions}{primaryAction}</div> : null}
        </header>
        {contextRow ? <div className={styles.contextRow}>{contextRow}</div> : null}
        <Angelcare360TimetableNavigation items={navigationItems} />
        <div className={styles.operationalCanvas} data-zone-a-content="true">{children}</div>
      </section>
    </AcademicZoneAFrame>
  )
}
