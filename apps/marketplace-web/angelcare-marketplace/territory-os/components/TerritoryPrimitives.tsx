import type { CSSProperties, ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, CircleDashed, PauseCircle } from 'lucide-react'
import { formatTerritoryHealth, formatTerritoryStatus } from '../format'
import type { TerritoryGateStatus, TerritoryHealthStatus, TerritoryStatus } from '../types'
import styles from '../territory-os.module.css'

export function TerritoryStatusPill({ status }: { status: TerritoryStatus }) {
  const className =
    status === 'live' ? styles.statusLive :
    status === 'soft_launch' ? styles.statusSoft :
    status === 'review' ? styles.statusReview :
    status === 'configuring' ? styles.statusConfig :
    status === 'draft' ? styles.statusDraft : styles.statusPaused
  return <span className={`${styles.statusPill} ${className}`}>{formatTerritoryStatus(status)}</span>
}

export function TerritoryHealthPill({ status }: { status: TerritoryHealthStatus }) {
  const className =
    status === 'healthy' ? styles.healthHealthy :
    status === 'attention_required' ? styles.healthAttention :
    status === 'at_risk' ? styles.healthRisk :
    status === 'critical' || status === 'paused' ? styles.healthCritical : styles.healthUnknown
  return <span className={`${styles.healthPill} ${className}`}>{formatTerritoryHealth(status)}</span>
}

export function ReadinessBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={styles.readinessCell} aria-label={`Préparation ${safe}%`}>
      <div className={styles.readinessTrack}><div className={styles.readinessFill} style={{ width: `${safe}%` }} /></div>
      <span className={styles.readinessValue}>{safe}%</span>
    </div>
  )
}

export function ScoreRing({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={styles.scoreRing} style={{ '--score': safe } as CSSProperties}>
      <div className={styles.scoreValue}><strong>{safe}%</strong><span>readiness</span></div>
    </div>
  )
}

export function GateStatusPill({ status }: { status: TerritoryGateStatus }) {
  const passed = status === 'passed' || status === 'waiver_approved' || status === 'not_applicable'
  const failed = status === 'failed' || status === 'expired'
  const progress = ['in_progress', 'submitted', 'waiver_requested'].includes(status)
  const className = passed ? styles.gatePassed : failed ? styles.gateFailed : progress ? styles.gateProgress : styles.healthUnknown
  const label: Record<TerritoryGateStatus, string> = {
    not_started: 'Non démarré',
    in_progress: 'En cours',
    submitted: 'Soumis',
    passed: 'Validé',
    failed: 'Échec',
    waiver_requested: 'Dérogation demandée',
    waiver_approved: 'Dérogation approuvée',
    expired: 'Expiré',
    not_applicable: 'Non applicable',
  }
  return <span className={`${styles.statusPill} ${className}`}>{label[status]}</span>
}

export function CommandPanel({ title, subtitle, action, children, flush = false }: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  flush?: boolean
}) {
  return (
    <section className={styles.panel}>
      <header className={styles.panelHeader}>
        <div><h2 className={styles.panelTitle}>{title}</h2>{subtitle ? <p className={styles.panelSubtitle}>{subtitle}</p> : null}</div>
        {action}
      </header>
      <div className={flush ? styles.panelBodyFlush : styles.panelBody}>{children}</div>
    </section>
  )
}

export function TerritoryEmpty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className={styles.emptyState}>
      <div>
        <div className={styles.emptyIcon}><CircleDashed size={25} /></div>
        <h3 className={styles.emptyTitle}>{title}</h3>
        <p className={styles.emptyText}>{text}</p>
        {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
      </div>
    </div>
  )
}

export function GateIcon({ status }: { status: TerritoryGateStatus }) {
  if (status === 'passed' || status === 'waiver_approved' || status === 'not_applicable') return <CheckCircle2 size={17} />
  if (status === 'failed' || status === 'expired') return <AlertTriangle size={17} />
  if (status === 'submitted' || status === 'in_progress') return <PauseCircle size={17} />
  return <CircleDashed size={17} />
}
