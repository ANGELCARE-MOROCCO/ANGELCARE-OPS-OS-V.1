import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  Inbox,
  LockKeyhole,
} from 'lucide-react'
import styles from './marketplace.module.css'

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
}: {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger'
}) {
  return (
    <Link
      href={href}
      className={
        variant === 'secondary'
          ? styles.buttonSecondary
          : variant === 'quiet'
            ? styles.buttonQuiet
            : variant === 'danger'
              ? styles.buttonDanger
              : styles.button
      }
    >
      {children}
    </Link>
  )
}

export function Button({
  children,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger'
}) {
  return (
    <button
      {...props}
      className={cx(
        variant === 'secondary'
          ? styles.buttonSecondary
          : variant === 'quiet'
            ? styles.buttonQuiet
            : variant === 'danger'
              ? styles.buttonDanger
              : styles.button,
        props.className,
      )}
    >
      {children}
    </button>
  )
}

const statusLabels: Record<string, string> = {
  enabled: 'Actif',
  active: 'Actif',
  ready: 'Prêt',
  healthy: 'Sain',
  success: 'Réussi',
  accepted: 'Accepté',
  registered: 'Enregistré',
  in_progress: 'En cours',
  draft: 'Brouillon',
  degraded: 'Dégradé',
  disabled: 'Désactivé',
  inactive: 'Inactif',
  not_installed: 'Non installé',
  not_started: 'Non démarré',
  unknown: 'À vérifier',
  blocked: 'Bloqué',
  failed: 'Échec',
  denied: 'Refusé',
  archived: 'Archivé',
  deprecated: 'Déprécié',
  expired: 'Expiré',
  not_applicable: 'Non applicable',
  conditionally_accepted: 'Accepté sous conditions',
}

export function StatusChip({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const className =
    ['enabled', 'active', 'ready', 'healthy', 'success', 'accepted'].includes(normalized)
      ? styles.statusSuccess
      : ['registered', 'in_progress', 'draft', 'degraded', 'conditionally_accepted'].includes(normalized)
        ? styles.statusInfo
        : ['disabled', 'inactive', 'not_installed', 'not_started', 'unknown', 'not_applicable'].includes(normalized)
          ? styles.statusNeutral
          : ['blocked', 'failed', 'denied'].includes(normalized)
            ? styles.statusDanger
            : styles.statusWarning
  return <span className={cx(styles.status, className)}>{statusLabels[normalized] || status}</span>
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  breadcrumbs?: ReactNode
}) {
  return (
    <header className={styles.pageHeader}>
      <div>
        {breadcrumbs ? <div className={styles.breadcrumbs}>{breadcrumbs}</div> : null}
        {eyebrow ? (
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            {eyebrow}
          </span>
        ) : null}
        <h1 className={styles.pageTitle}>{title}</h1>
        <p className={styles.pageDescription}>{description}</p>
      </div>
      {actions ? <div className={styles.pageActions}>{actions}</div> : null}
    </header>
  )
}

export function Card({
  title,
  subtitle,
  action,
  children,
  body = true,
}: {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  body?: boolean
}) {
  return (
    <section className={styles.card}>
      {title || subtitle || action ? (
        <header className={styles.cardHeader}>
          <div>
            {title ? <h2 className={styles.cardTitle}>{title}</h2> : null}
            {subtitle ? <p className={styles.cardSubtitle}>{subtitle}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={body ? styles.cardBody : undefined}>{children}</div>
    </section>
  )
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string | number
  hint: string
  icon: ReactNode
}) {
  return (
    <article className={styles.metricCard}>
      <div className={styles.metricTop}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={styles.metricIcon}>{icon}</span>
      </div>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricHint}>{hint}</div>
    </article>
  )
}

export function StatePanel({
  type,
  title,
  text,
  actions,
}: {
  type: 'empty' | 'error' | 'denied' | 'blocked' | 'success'
  title: string
  text: string
  actions?: ReactNode
}) {
  const Icon =
    type === 'error'
      ? AlertTriangle
      : type === 'denied'
        ? LockKeyhole
        : type === 'blocked'
          ? Ban
          : type === 'success'
            ? CheckCircle2
            : Inbox
  return (
    <div
      className={
        type === 'error' ? styles.errorState : type === 'denied' ? styles.deniedState : styles.emptyState
      }
    >
      <div>
        <span className={styles.stateIcon}><Icon size={26} aria-hidden="true" /></span>
        <h2 className={styles.stateTitle}>{title}</h2>
        <p className={styles.stateText}>{text}</p>
        {actions ? <div className={styles.stateActions}>{actions}</div> : null}
      </div>
    </div>
  )
}

export function NextAction({ children }: { children: ReactNode }) {
  return (
    <span className={styles.inline}>
      {children}
      <ArrowRight size={15} aria-hidden="true" />
    </span>
  )
}
