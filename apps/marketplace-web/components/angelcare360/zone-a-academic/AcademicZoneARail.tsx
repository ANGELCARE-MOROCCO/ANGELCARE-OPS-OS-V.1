'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import styles from './AcademicZoneAChrome.module.css'

type Item = {
  key: string
  label: string
  short: string
  href: string
  active: (pathname: string, plane: string) => boolean
}

const ROOT = '/angelcare-360-command-center'

const items: Item[] = [
  {
    key: 'today',
    label: 'Aujourd’hui',
    short: 'Vue jour',
    href: `${ROOT}/academique`,
    active: (pathname, plane) => pathname === `${ROOT}/academique` && (!plane || plane === 'command' || plane === 'assessment-command'),
  },
  {
    key: 'timetable',
    label: 'Emploi du temps',
    short: 'Airspace',
    href: `${ROOT}/emploi-du-temps`,
    active: (pathname) => pathname === `${ROOT}/emploi-du-temps` || pathname === `${ROOT}/emploi-du-temps/calendrier` || pathname.startsWith(`${ROOT}/emploi-du-temps/enseignants`),
  },
  {
    key: 'classes',
    label: 'Classes & groupes',
    short: 'Dossiers classe',
    href: `${ROOT}/emploi-du-temps/classes`,
    active: (pathname) => pathname.startsWith(`${ROOT}/emploi-du-temps/classes`),
  },
  {
    key: 'progression',
    label: 'Progression',
    short: 'Learning flow',
    href: `${ROOT}/academique?plane=progression`,
    active: (pathname, plane) => (pathname === `${ROOT}/academique` && ['curriculum', 'courses', 'progression'].includes(plane)) || pathname.startsWith(`${ROOT}/academique/cours`),
  },
  {
    key: 'homework',
    label: 'Devoirs',
    short: 'Homework studio',
    href: `${ROOT}/academique/devoirs`,
    active: (pathname, plane) => pathname.startsWith(`${ROOT}/academique/devoirs`) || pathname.startsWith(`${ROOT}/academique/soumissions`) || (pathname === `${ROOT}/academique` && ['homework', 'submissions'].includes(plane)),
  },
  {
    key: 'assessments',
    label: 'Évaluations',
    short: 'Assessment foundry',
    href: `${ROOT}/academique/examens`,
    active: (pathname, plane) => pathname.startsWith(`${ROOT}/academique/examens`) || pathname.startsWith(`${ROOT}/academique/sessions-examens`) || (pathname === `${ROOT}/academique` && ['sessions', 'examinations'].includes(plane)),
  },
  {
    key: 'grades',
    label: 'Notes & maîtrise',
    short: 'Grade matrix',
    href: `${ROOT}/academique/notes`,
    active: (pathname, plane) => pathname.startsWith(`${ROOT}/academique/notes`) || pathname.startsWith(`${ROOT}/academique/moyennes`) || (pathname === `${ROOT}/academique` && ['gradebook', 'missing-grades', 'averages', 'validation'].includes(plane)),
  },
  {
    key: 'reports',
    label: 'Bulletins',
    short: 'Bulletin atelier',
    href: `${ROOT}/academique/bulletins`,
    active: (pathname, plane) => pathname.startsWith(`${ROOT}/academique/bulletins`) || pathname.startsWith(`${ROOT}/academique/appreciations`) || (pathname === `${ROOT}/academique` && ['report-cards', 'appreciations', 'publication'].includes(plane)),
  },
  {
    key: 'coordination',
    label: 'Coordination',
    short: 'Intervention room',
    href: `${ROOT}/academique?plane=review`,
    active: (pathname, plane) => pathname === `${ROOT}/academique` && plane === 'review',
  },
  {
    key: 'history',
    label: 'Historique',
    short: 'History lens',
    href: `${ROOT}/academique/audit`,
    active: (pathname, plane) => pathname.startsWith(`${ROOT}/academique/audit`) || (pathname === `${ROOT}/academique` && ['audit', 'assessment-audit'].includes(plane)),
  },
]

export default function AcademicZoneARail() {
  const pathname = usePathname() || `${ROOT}/academique`
  const params = useSearchParams()
  const plane = params.get('plane') || ''

  return (
    <nav className={styles.zoneRail} aria-label="Zone A — navigation académique principale">
      <div className={styles.zoneRailTrack}>
        {items.map((item, index) => {
          const active = item.active(pathname, plane)
          return (
            <Link key={item.key} href={item.href} data-active={active} aria-current={active ? 'page' : undefined}>
              <span className={styles.zoneRailIndex}>{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.zoneRailText}>
                <strong>{item.label}</strong>
                <small>{item.short}</small>
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
