import Link from 'next/link'
import styles from './LibraryCommand.module.css'

const BASE = '/angelcare-360-command-center/bibliotheque'
const NAV = [
  ['Atrium', BASE],
  ['Catalogue', `${BASE}/livres`],
  ['Exemplaires', `${BASE}/exemplaires`],
  ['Disponibilité', `${BASE}/disponibilite`],
  ['Prêts', `${BASE}/prets`],
  ['Retours', `${BASE}/retours`],
  ['Retards', `${BASE}/retards`],
  ['Audit', `${BASE}/audit`],
] as const

export function LibraryCommandShell({
  schoolName,
  title,
  subtitle,
  children,
}: {
  schoolName: string
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className={styles.universe}>
      <main className={styles.shell}>
        <header className={styles.masthead}>
          <div>
            <div className={styles.eyebrow}>SANILA · Library & Circulation OS</div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          <div className={styles.schoolMark}>
            <strong>{schoolName}</strong>
            <span>Maison du savoir · circulation institutionnelle</span>
          </div>
        </header>
        <nav className={styles.nav} aria-label="Navigation Bibliothèque">
          {NAV.map(([label, href], index) => (
            <Link key={href} href={href} className={`${styles.navLink} ${index === 0 ? styles.navPrimary : ''}`}>
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </main>
    </div>
  )
}

export function StatusPill({ value, tone }: { value: string; tone?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  return <span className={styles.status} data-tone={tone || 'neutral'}>{value}</span>
}

export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className={styles.empty}>
      <strong>{title}</strong>
      <p>{copy}</p>
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
