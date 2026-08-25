import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './PayrollCommand.module.css'

const BASE = '/angelcare-360-command-center/paie'
const NAV = [
  ['Command', BASE], ['Périodes', `${BASE}/periodes`], ['Dossiers', `${BASE}/dossiers`], ['Éléments', `${BASE}/elements`],
  ['Primes', `${BASE}/primes`], ['Retenues', `${BASE}/retenues`], ['Avances', `${BASE}/avances`], ['Ajustements', `${BASE}/ajustements`],
  ['Remboursements', `${BASE}/remboursements`], ['Validation', `${BASE}/validation`], ['Paiements', `${BASE}/paiements`],
  ['Réconciliation', `${BASE}/reconciliation`], ['Exécutions', `${BASE}/executions`], ['Gouvernance', `${BASE}/gouvernance`],
  ['Historique', `${BASE}/historique-personnel`], ['Conformité', `${BASE}/conformite`], ['Bulletins', `${BASE}/bulletins`], ['Audit', `${BASE}/audit`],
] as const

export function PayrollCommandShell({ schoolName, title, subtitle, children, meta }: { schoolName: string; title: string; subtitle: string; children: ReactNode; meta?: ReactNode }) {
  return <div className={styles.universe}><main className={styles.shell}>
    <header className={styles.masthead}>
      <div className={styles.mastheadCopy}>
        <div className={styles.eyebrow}>SANILA · Payroll Sovereign Control OS</div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        {meta ? <div className={styles.metaRail}>{meta}</div> : null}
      </div>
      <div className={styles.schoolMark}><span>ÉTABLISSEMENT</span><strong>{schoolName}</strong><small>Paie confidentielle · gouvernance contrôlée</small><i>Dh · Maroc</i></div>
    </header>
    <nav className={styles.nav} aria-label="Navigation Paie">{NAV.map(([label, href], index) => <Link key={href} href={href} className={`${styles.navLink} ${index === 0 ? styles.navPrimary : ''}`}>{label}</Link>)}</nav>
    {children}
  </main></div>
}

export function StatusPill({ value, tone = 'neutral' }: { value: string; tone?: 'good' | 'warn' | 'bad' | 'neutral' | 'ink' }) {
  return <span className={styles.status} data-tone={tone}>{value}</span>
}
export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className={styles.empty}><strong>{title}</strong><p>{copy}</p></div>
}
export function formatMoneyMinor(value: number) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((Number(value) || 0) / 100) + ' Dh'
}
export function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0) + ' Dh'
}
export function formatDate(value?: string | null, withTime = false) {
  if (!value) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-MA', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(date)
}
export function toneFor(status: string) {
  const normalized = status.toLowerCase()
  if (['paid', 'reconciled', 'closed', 'approved', 'validated', 'finalized', 'published', 'active', 'passed', 'settled'].includes(normalized)) return 'good' as const
  if (['failed', 'cancelled', 'rejected', 'blocked'].includes(normalized)) return 'bad' as const
  if (['review', 'pending', 'submitted', 'calculating', 'payment_processing', 'warning', 'requested', 'recovering'].includes(normalized)) return 'warn' as const
  return 'neutral' as const
}
