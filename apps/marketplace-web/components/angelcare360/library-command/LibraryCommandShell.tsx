import Link from 'next/link'
import styles from './LibraryCommand.module.css'

const BASE = '/angelcare-360-command-center/bibliotheque'
const NAV = [
  ['Cockpit', BASE],
  ['Catalogue', `${BASE}/livres`],
  ['Exemplaires', `${BASE}/exemplaires`],
  ['Disponibilité', `${BASE}/disponibilite`],
  ['Circulation', `${BASE}/prets`],
  ['Retours', `${BASE}/retours`],
  ['Retards', `${BASE}/retards`],
  ['Membres', `${BASE}/membres`],
  ['Audit', `${BASE}/audit`],
] as const

export function LibraryCommandShell({
  schoolName,
  title,
  subtitle,
  children,
  actions,
  context,
}: {
  schoolName: string
  title: string
  subtitle: string
  children: React.ReactNode
  actions?: React.ReactNode
  context?: React.ReactNode
}) {
  return (
    <div className={styles.universe} data-sanila-library-surface="circulation-command">
      <main className={styles.shell}>
        <header className={styles.masthead}>
          <div className={styles.mastheadCopy}>
            <div className={styles.eyebrow}>SANILA · Library & Circulation Command OS</div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
            <div className={styles.contextRow}>
              <span className={styles.contextPill}>{schoolName}</span>
              <span className={styles.contextPill}>Circulation atomique</span>
              <span className={styles.contextPill}>Disponibilité factuelle</span>
              {context}
            </div>
          </div>
          <div className={styles.mastheadRail}>
            <div className={styles.schoolMark}>
              <span>Maison du savoir</span>
              <strong>{schoolName}</strong>
              <small>Catalogue · exemplaires · emprunteurs · circulation</small>
            </div>
            {actions ? <div className={styles.mastheadActions}>{actions}</div> : null}
          </div>
        </header>
        <nav className={styles.nav} aria-label="Navigation Bibliothèque">
          {NAV.map(([label, href], index) => (
            <Link key={href} href={href} className={`${styles.navLink} ${index === 0 ? styles.navPrimary : ''}`}>
              {label}
            </Link>
          ))}
        </nav>
        <div className={styles.workspace}>{children}</div>
      </main>
    </div>
  )
}

export function StatusPill({ value, tone }: { value: string; tone?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  return <span className={styles.status} data-tone={tone || 'neutral'}>{value}</span>
}

export function EmptyState({ title, copy, action }: { title: string; copy: string; action?: React.ReactNode }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyMark}>∷</span>
      <strong>{title}</strong>
      <p>{copy}</p>
      {action ? <div className={styles.emptyAction}>{action}</div> : null}
    </div>
  )
}

export function formatDate(value?: string | null, withTime = false) {
  if (!value) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-MA', withTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(date)
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value) + ' Dh'
}
