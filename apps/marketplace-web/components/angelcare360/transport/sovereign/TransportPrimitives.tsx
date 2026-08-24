import styles from './TransportSovereign.module.css'

export function StatusPill({ value, tone = 'neutral' }: { value: string; tone?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  return <span className={styles.status} data-tone={tone}>{value}</span>
}

export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className={styles.empty}><strong>{title}</strong><p>{copy}</p></div>
}

export function formatDate(value?: string | null, withTime = false) {
  if (!value) return '—'
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return value
  return new Intl.DateTimeFormat('fr-MA', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(d)
}

export function formatTime(value?: string | null) {
  if (!value) return '—'
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5)
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? new Intl.DateTimeFormat('fr-MA', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d) : value
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(value) + ' Dh'
}
