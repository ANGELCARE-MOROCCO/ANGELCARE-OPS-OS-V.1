'use client'

import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  FileText,
  Info,
  LockKeyhole,
  Sparkles,
  UserRoundCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type {
  SchoolAdminAttentionItem,
  SchoolAdminBreadcrumbItem,
  SchoolAdminNextActionConfig,
  SchoolAdminTone,
} from '@/types/angelcare360/school-admin-workbench'
import styles from './SchoolAdminWorkbench.module.css'

const toneIcons: Record<SchoolAdminTone, LucideIcon> = {
  neutral: Info,
  info: CircleHelp,
  success: BadgeCheck,
  warning: AlertTriangle,
  critical: XCircle,
  approval: LockKeyhole,
}

export function SchoolAdminBreadcrumb({ items }: { items: SchoolAdminBreadcrumbItem[] }) {
  return <nav className={styles.breadcrumb} aria-label="Vous êtes ici">
    {items.map((item, index) => <span key={item.key}>
      {index ? <ChevronRight size={13} aria-hidden="true" /> : null}
      {item.onSelect ? <button type="button" onClick={item.onSelect}>{item.label}</button> : <strong>{item.label}</strong>}
    </span>)}
  </nav>
}

export function SchoolAdminDossierHeader({
  eyebrow,
  title,
  description,
  status,
  tone = 'neutral',
  context,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  status?: string | null
  tone?: SchoolAdminTone
  context?: ReactNode
  children?: ReactNode
}) {
  return <div className={styles.dossierHeader} data-tone={tone}>
    <div className={styles.dossierHeaderMain}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <div className={styles.titleLine}><h2>{title}</h2>{status ? <SchoolAdminHumanStatus tone={tone} label={status} /> : null}</div>
      <p>{description}</p>
      {context ? <div className={styles.headerContext}>{context}</div> : null}
    </div>
    {children ? <div className={styles.headerActions}>{children}</div> : null}
  </div>
}

export function SchoolAdminHumanStatus({ tone = 'neutral', label }: { tone?: SchoolAdminTone; label: string }) {
  const Icon = toneIcons[tone]
  return <span className={styles.humanStatus} data-tone={tone}><Icon size={14} />{label}</span>
}

export function SchoolAdminSituationSummary({
  title = 'Ce qu’il faut savoir',
  summary,
  reason,
  consequence,
  tone = 'info',
}: {
  title?: string
  summary: string
  reason?: string | null
  consequence?: string | null
  tone?: SchoolAdminTone
}) {
  const Icon = toneIcons[tone]
  return <section className={styles.situation} data-tone={tone}>
    <div className={styles.situationIcon}><Icon size={21} /></div>
    <div className={styles.situationBody}>
      <span>{title}</span>
      <h3>{summary}</h3>
      {reason ? <div className={styles.explanation}><strong>Pourquoi ce dossier apparaît ici ?</strong><p>{reason}</p></div> : null}
      {consequence ? <div className={styles.consequence}><strong>Conséquence actuelle</strong><p>{consequence}</p></div> : null}
    </div>
  </section>
}

export function SchoolAdminAttentionBlock({
  title = 'À faire',
  items,
  emptyTitle = 'Aucune action nécessaire',
  emptyDetail = 'Ce dossier est complet pour le moment.',
}: {
  title?: string
  items: SchoolAdminAttentionItem[]
  emptyTitle?: string
  emptyDetail?: string
}) {
  return <section className={styles.attentionBlock}>
    <div className={styles.sectionHeading}><ClipboardCheck size={18} /><div><strong>{title}</strong><span>Les actions sont classées par priorité et restent liées au dossier.</span></div></div>
    {items.length ? <div className={styles.attentionList}>{items.map((item) => {
      const Icon = toneIcons[item.tone || 'warning']
      return <div className={styles.attentionItem} data-tone={item.tone || 'warning'} key={item.key}>
        <span className={styles.attentionIcon}><Icon size={17} /></span>
        <div><strong>{item.label}</strong>{item.detail ? <p>{item.detail}</p> : null}</div>
        {item.actionLabel && item.onAction ? <button type="button" onClick={item.onAction}>{item.actionLabel}<ChevronRight size={15} /></button> : null}
      </div>
    })}</div> : <SchoolAdminEmptyState title={emptyTitle} detail={emptyDetail} compact />}
  </section>
}

export function SchoolAdminNextAction({ config }: { config: SchoolAdminNextActionConfig }) {
  return <section className={styles.nextAction} data-tone={config.tone || 'approval'}>
    <div className={styles.nextActionIcon}><Sparkles size={20} /></div>
    <div><span>Prochaine étape recommandée</span><h3>{config.title}</h3><p>{config.detail}</p>{config.disabled && config.disabledReason ? <small>{config.disabledReason}</small> : null}</div>
    <button type="button" onClick={config.onAction} disabled={config.disabled}>{config.label}<ChevronRight size={16} /></button>
  </section>
}

export function SchoolAdminImpactPreview({
  title = 'Ce qui va changer',
  items,
  tone = 'info',
}: {
  title?: string
  items: Array<{ key: string; label: string; value?: string | null }>
  tone?: SchoolAdminTone
}) {
  return <section className={styles.impactPreview} data-tone={tone}>
    <div className={styles.sectionHeading}><CheckCircle2 size={18} /><div><strong>{title}</strong><span>Vérifiez les conséquences avant de confirmer.</span></div></div>
    <div className={styles.impactList}>{items.map((item) => <div key={item.key}><BadgeCheck size={15} /><span>{item.label}</span>{item.value ? <strong>{item.value}</strong> : null}</div>)}</div>
  </section>
}

export function SchoolAdminAssignmentPanel({
  owner,
  dueAt,
  updatedAt,
  nextStep,
}: {
  owner?: string | null
  dueAt?: string | null
  updatedAt?: string | null
  nextStep?: string | null
}) {
  return <section className={styles.assignmentPanel}>
    <div><UserRoundCheck size={16} /><span>Responsable</span><strong>{owner || 'À attribuer'}</strong></div>
    <div><CalendarClock size={16} /><span>Échéance</span><strong>{dueAt || 'Aucune date définie'}</strong></div>
    <div><FileText size={16} /><span>Dernière mise à jour</span><strong>{updatedAt || 'Non renseignée'}</strong></div>
    <div><ArrowLeft size={16} /><span>Prochaine action</span><strong>{nextStep || 'Vérifier le dossier'}</strong></div>
  </section>
}

export function SchoolAdminActionDock({
  primary,
  secondary = [],
  note,
}: {
  primary?: { label: string; onClick: () => void; disabled?: boolean; busy?: boolean; danger?: boolean }
  secondary?: Array<{ key: string; label: string; onClick: () => void; disabled?: boolean }>
  note?: string | null
}) {
  return <div className={styles.actionDock}>
    {note ? <p>{note}</p> : <span />}
    <div>{secondary.map((action) => <button type="button" key={action.key} onClick={action.onClick} disabled={action.disabled}>{action.label}</button>)}{primary ? <button type="button" className={styles.primaryAction} data-danger={primary.danger || undefined} onClick={primary.onClick} disabled={primary.disabled || primary.busy}>{primary.busy ? 'Enregistrement…' : primary.label}</button> : null}</div>
  </div>
}

export function SchoolAdminPermissionRequest({
  message,
  onRequest,
}: {
  message: string
  onRequest?: (() => void) | null
}) {
  return <section className={styles.permissionRequest}>
    <LockKeyhole size={20} />
    <div><strong>Validation de la direction nécessaire</strong><p>{message}</p></div>
    {onRequest ? <button type="button" onClick={onRequest}>Demander la validation</button> : null}
  </section>
}

export function SchoolAdminCompletionResult({ title, detail }: { title: string; detail: string }) {
  return <section className={styles.completionResult}><BadgeCheck size={24} /><div><strong>{title}</strong><p>{detail}</p></div></section>
}

export function SchoolAdminEmptyState({
  title,
  detail,
  actionLabel,
  onAction,
  compact = false,
}: {
  title: string
  detail: string
  actionLabel?: string
  onAction?: () => void
  compact?: boolean
}) {
  return <section className={styles.emptyState} data-compact={compact || undefined}><BadgeCheck size={compact ? 20 : 28} /><div><strong>{title}</strong><p>{detail}</p></div>{actionLabel && onAction ? <button type="button" onClick={onAction}>{actionLabel}</button> : null}</section>
}

export function SchoolAdminErrorState({
  title = 'Cette action n’a pas pu être terminée',
  detail,
  reference,
  onRetry,
}: {
  title?: string
  detail: string
  reference?: string | null
  onRetry?: (() => void) | null
}) {
  return <section className={styles.errorState} role="alert"><AlertTriangle size={22} /><div><strong>{title}</strong><p>{detail}</p>{reference ? <small>Référence : {reference}</small> : null}</div>{onRetry ? <button type="button" onClick={onRetry}>Réessayer</button> : null}</section>
}
