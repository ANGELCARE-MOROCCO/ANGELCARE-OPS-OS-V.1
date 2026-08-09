import Link from 'next/link'
import { ArrowRight, CircleAlert, CircleCheck, Clock3, Database, ShieldCheck } from 'lucide-react'
import styles from '../flashcards-os.module.css'

export function formatDate(value: string | null) {
  if (!value) return 'Non planifié'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

export function StatusPill({ value }: { value: string }) {
  const key = value.toLowerCase()
  const tone = /approved|completed|healthy|accepted|succeeded|ready_for_umz3/.test(key)
    ? styles.intelPillSuccess
    : /failed|blocked|rejected|dead_letter|cancelled/.test(key)
      ? styles.intelPillDanger
      : /review|pending|submitted|queued|synthesising|acquiring|evidence_requested|rework/.test(key)
        ? styles.intelPillWarning
        : styles.intelPillNeutral
  return <span className={`${styles.intelPill} ${tone}`}>{value.replaceAll('_', ' ')}</span>
}

export function ProviderBadge({ provider, configured, status }: { provider: string; configured: boolean; status: string }) {
  const Icon = configured && status === 'healthy' ? CircleCheck : configured ? CircleAlert : Clock3
  return (
    <span className={`${styles.providerBadge} ${configured ? styles.providerConfigured : styles.providerUnconfigured}`}>
      <Icon size={14} /> {provider} · {configured ? status : 'configuration requise'}
    </span>
  )
}

export function SourceModeBadge({ mode }: { mode: string }) {
  return (
    <span className={styles.sourceModeBadge}>
      {mode === 'database' ? <Database size={14} /> : <ShieldCheck size={14} />}
      {mode === 'database' ? 'Données opérationnelles' : 'Bootstrap contrôlé'}
    </span>
  )
}

export function EmptyIntelligenceState({ title, detail, href, action }: { title: string; detail: string; href?: string; action?: string }) {
  return (
    <div className={styles.intelEmptyState}>
      <div className={styles.intelEmptyMark}><ShieldCheck size={24} /></div>
      <div><strong>{title}</strong><p>{detail}</p></div>
      {href && action ? <Link className={styles.intelTextAction} href={href}>{action}<ArrowRight size={15} /></Link> : null}
    </div>
  )
}

export function MetricDial({ label, value, suffix = '', detail }: { label: string; value: number | string; suffix?: string; detail: string }) {
  return (
    <article className={styles.intelMetricDial}>
      <span>{label}</span>
      <strong>{value}{suffix}</strong>
      <p>{detail}</p>
    </article>
  )
}
