import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  DatabaseZap,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import styles from './CustomerRelationshipCommandRoom.module.css'
import type {
  Wave2DataSource,
  Wave2Evidence,
  Wave2Factor,
  Wave2RelationshipNode,
  Wave2TimelineEvent,
  Wave2Tone,
} from '../wave2/Wave2CommandTypes'


export function formatDh(value: number | string | null | undefined) {
  const amount = Number(value || 0)
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0)} Dh`
}

export function formatDate(value: string | null | undefined, fallback = 'Non renseignée') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function formatDateTime(value: string | null | undefined, fallback = 'Non renseigné') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date)
}

export function humanize(value: string | null | undefined, fallback = 'Non renseigné') {
  if (!value) return fallback
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function toneForStatus(value: string | null | undefined): Wave2Tone {
  const status = String(value || '').toLowerCase()
  if (['active', 'paid', 'confirmed', 'resolved', 'done', 'renewed', 'live', 'good', 'enabled'].includes(status)) return 'success'
  if (['critical', 'urgent', 'overdue', 'blocked', 'suspended', 'churned', 'rejected', 'at risk', 'at_risk'].includes(status)) return 'critical'
  if (['warning', 'high', 'pending', 'trial', 'partially_paid', 'in_progress', 'investigating', 'upcoming'].includes(status)) return 'warning'
  if (['commercial', 'proposal_sent', 'contract_pending', 'renewal'].includes(status)) return 'commercial'
  return 'info'
}

export function StatusToken({ value, tone, detail }: { value: string; tone?: Wave2Tone; detail?: string }) {
  return (
    <span className={styles.statusToken} data-tone={tone || toneForStatus(value)} title={detail}>
      <CircleDot size={12} />
      {humanize(value)}
    </span>
  )
}

export function SourceIntegrity({ sources, sourceState }: { sources: Wave2DataSource[]; sourceState: string }) {
  const unavailable = sources.filter((source) => source.state === 'unavailable')
  const partial = sourceState === 'partial' || unavailable.length > 0
  return (
    <div className={styles.sourceIntegrity} data-state={partial ? 'partial' : sourceState}>
      <DatabaseZap size={15} />
      <div>
        <strong>{partial ? 'Dossier alimenté partiellement' : 'Dossier synchronisé'}</strong>
        <span>
          {partial
            ? `${unavailable.length} source(s) indisponible(s). Aucun zéro artificiel n’est produit.`
            : `${sources.length} source(s) opérationnelle(s) · données consolidées.`}
        </span>
      </div>
    </div>
  )
}

export function ChapterSection({
  eyebrow,
  title,
  description,
  action,
  children,
  className = '',
}: {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`${styles.chapterSection} ${className}`}>
      <header className={styles.sectionHeader}>
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className={styles.sectionAction}>{action}</div> : null}
      </header>
      {children}
    </section>
  )
}

export function MetricCell({
  label,
  value,
  detail,
  tone = 'info',
  onClick,
}: {
  label: string
  value: string
  detail?: string
  tone?: Wave2Tone
  onClick?: () => void
}) {
  const body = (
    <>
      <span className={styles.metricLabel}>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </>
  )
  return onClick ? (
    <button type="button" className={styles.metricCell} data-tone={tone} onClick={onClick}>{body}<ChevronRight size={15} /></button>
  ) : (
    <div className={styles.metricCell} data-tone={tone}>{body}</div>
  )
}

export function FactorArchitecture({ factors, onEvidence }: { factors: Wave2Factor[]; onEvidence: (ids: string[]) => void }) {
  if (!factors.length) return <EmptyInstrument title="Aucun facteur calculable" detail="Les sources disponibles ne permettent pas encore une décomposition fiable." />
  return (
    <div className={styles.factorArchitecture}>
      {factors.map((factor) => (
        <button key={factor.id} type="button" className={styles.factorCard} data-tone={factor.tone} onClick={() => onEvidence(factor.evidenceIds)}>
          <div className={styles.factorTop}><span>{factor.label}</span><StatusToken value={factor.movement || 'stable'} tone={factor.tone} /></div>
          <strong>{factor.value}</strong>
          <p>{factor.detail}</p>
          <span className={styles.factorEvidence}>{factor.evidenceIds.length} preuve(s) <ArrowUpRight size={13} /></span>
        </button>
      ))}
    </div>
  )
}

export function RelationshipArchitecture({ nodes, onOpenEvidence }: { nodes: Wave2RelationshipNode[]; onOpenEvidence: (ids: string[]) => void }) {
  if (!nodes.length) return <EmptyInstrument title="Aucune relation disponible" detail="Le dossier ne contient pas encore d’objet lié dans cette dimension." />
  return (
    <div className={styles.relationshipGrid}>
      {nodes.map((node) => {
        const content = (
          <>
            <div className={styles.relationshipHead}>
              <span>{humanize(node.kind)}</span>
              <StatusToken value={node.status} tone={node.tone} />
            </div>
            <strong>{node.label}</strong>
            <p>{node.meta}</p>
            <span className={styles.relationshipAction}>Ouvrir le contexte <ArrowUpRight size={13} /></span>
          </>
        )
        if (node.href) return <Link key={node.id} href={node.href} className={styles.relationshipCard} data-tone={node.tone}>{content}</Link>
        return <button key={node.id} type="button" className={styles.relationshipCard} data-tone={node.tone} onClick={() => onOpenEvidence(node.evidenceIds || [])}>{content}</button>
      })}
    </div>
  )
}

export function TimelineArchitecture({ events, onEvidence }: { events: Wave2TimelineEvent[]; onEvidence: (ids: string[]) => void }) {
  if (!events.length) return <EmptyInstrument title="Aucun événement probant" detail="La chronologie se remplira avec les prochains événements du dossier." />
  return (
    <div className={styles.timelineArchitecture}>
      {events.map((event) => (
        <button key={event.id} type="button" className={styles.timelineEvent} data-tone={event.tone} onClick={() => onEvidence(event.evidenceIds)}>
          <span className={styles.timelineDot} />
          <div>
            <div className={styles.timelineMeta}><span>{formatDateTime(event.timestamp)}</span><span>{event.actor}</span></div>
            <strong>{event.title}</strong>
            <p>{event.detail}</p>
          </div>
          <ChevronRight size={16} />
        </button>
      ))}
    </div>
  )
}

export function EvidenceList({ evidence, selectedId, onSelect }: { evidence: Wave2Evidence[]; selectedId?: string | null; onSelect?: (id: string) => void }) {
  if (!evidence.length) return <EmptyInstrument title="Aucune preuve disponible" detail="Aucun document ou événement ne soutient encore ce signal." />
  return (
    <div className={styles.evidenceList}>
      {evidence.map((item) => (
        <button key={item.id} type="button" className={styles.evidenceItem} data-selected={selectedId === item.id} data-tone={item.tone} onClick={() => onSelect?.(item.id)}>
          <span className={styles.evidenceIcon}>{item.type === 'audit' ? <ShieldCheck size={16} /> : <FileText size={16} />}</span>
          <div>
            <span>{item.label}</span>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
            <small>{item.timestamp ? formatDateTime(item.timestamp) : item.source} · {item.verified ? 'Vérifié' : 'À vérifier'}</small>
          </div>
          {item.value ? <b>{item.value}</b> : null}
        </button>
      ))}
    </div>
  )
}

export function LockedCapability({ title, detail }: { title: string; detail: string }) {
  return (
    <div className={styles.lockedCapability}>
      <span><LockKeyhole size={18} /></span>
      <div><strong>{title}</strong><p>{detail}</p></div>
    </div>
  )
}

export function EmptyInstrument({ title, detail }: { title: string; detail: string }) {
  return (
    <div className={styles.emptyInstrument}>
      <span><Sparkles size={18} /></span>
      <div><strong>{title}</strong><p>{detail}</p></div>
    </div>
  )
}

export function DeadlineSignal({ label, date, tone = 'info' }: { label: string; date?: string | null; tone?: Wave2Tone }) {
  return (
    <div className={styles.deadlineSignal} data-tone={tone}>
      <CalendarDays size={16} />
      <div><span>{label}</span><strong>{formatDate(date)}</strong></div>
    </div>
  )
}

export function ManagementSignal({ icon = 'warning', title, detail, tone = 'warning' }: { icon?: 'warning' | 'clock' | 'check'; title: string; detail: string; tone?: Wave2Tone }) {
  const Icon = icon === 'clock' ? Clock3 : icon === 'check' ? CheckCircle2 : AlertTriangle
  return (
    <div className={styles.managementSignal} data-tone={tone}>
      <Icon size={17} />
      <div><strong>{title}</strong><p>{detail}</p></div>
    </div>
  )
}
