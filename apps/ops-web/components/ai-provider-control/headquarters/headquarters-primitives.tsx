import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import styles from './ai-sovereignty-headquarters.module.css'

export type Tone = 'good' | 'warn' | 'bad' | 'blue' | 'neutral'

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{children}</span>
}

export function Metric({ icon: Icon, label, value, detail, tone = 'blue' }: { icon: LucideIcon; label: string; value: ReactNode; detail: string; tone?: Tone }) {
  return <article className={`${styles.metric} ${styles[`metric_${tone}`]}`}><div className={styles.metricIcon}><Icon size={19}/></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>
}

export function SectionTitle({ eyebrow, title, body, action }: { eyebrow: string; title: string; body?: string; action?: ReactNode }) {
  return <header className={styles.sectionTitle}><div><span>{eyebrow}</span><h2>{title}</h2>{body ? <p>{body}</p> : null}</div>{action}</header>
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return <div className={styles.empty}><Icon size={30}/><strong>{title}</strong><p>{body}</p>{action}</div>
}

export function formatDate(value: unknown) {
  if (!value) return '—'
  try { return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(value))) } catch { return '—' }
}
export function money(value: unknown) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(Number(value || 0)) }
export function num(value: unknown) { return new Intl.NumberFormat('fr-FR').format(Number(value || 0)) }
export function text(value: unknown) { return String(value ?? '') }
export function statusTone(value: unknown): Tone {
  const s = text(value).toLowerCase()
  if (['active','operating','healthy','ready','completed','published','validated','resolved','approved'].includes(s)) return 'good'
  if (['testing','standby','draft','warning','requested','in_review','paused','limited'].includes(s)) return 'warn'
  if (['failed','revoked','critical','blocked','suspended','rejected','destroyed','open'].includes(s)) return 'bad'
  return 'neutral'
}
