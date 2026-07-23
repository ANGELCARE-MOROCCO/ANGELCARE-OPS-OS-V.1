'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, LockKeyhole, ShieldCheck, Triangle } from 'lucide-react'
import type { HeroAction, HeroMetric, HeroTone, HeroTruthState } from './hero-types'
import styles from './SovereignHeroes.module.css'

const truthTone: Record<HeroTruthState, string> = {
  LIVE: styles.truthLive,
  SHADOW: styles.truthShadow,
  PREVIEW: styles.truthPreview,
  DEGRADED: styles.truthDegraded,
  EMPTY: styles.truthEmpty,
  LOCKED: styles.truthLocked,
  OFFLINE: styles.truthOffline,
  INITIALIZING: styles.truthInitializing,
}

const metricTone: Record<HeroTone, string> = {
  navy: styles.metricNavy,
  blue: styles.metricBlue,
  cyan: styles.metricCyan,
  emerald: styles.metricEmerald,
  amber: styles.metricAmber,
  violet: styles.metricViolet,
  rose: styles.metricRose,
  slate: styles.metricSlate,
}

export function AngelCareHeroBrand({ inverted = false }: { inverted?: boolean }) {
  return <div className={styles.brand} data-inverted={inverted ? 'true' : 'false'}>
    <span className={styles.logoFrame}><Image src="/logo.png" alt="AngelCare" width={108} height={42} className={styles.logo} priority /></span>
    <span className={styles.brandDivider} />
    <span className={styles.brandText}><strong>REVENUE COMMAND OS</strong><small>Système exécutif propriétaire</small></span>
    <Triangle className={styles.brandTriangle} size={13} fill="currentColor" aria-hidden="true" />
  </div>
}

export function HeroTruthBadge({ state, label }: { state: HeroTruthState; label?: string }) {
  return <span className={`${styles.truthBadge} ${truthTone[state]}`} aria-label={`État opérationnel: ${label || state}`}><span className={styles.truthDot} />{label || state}</span>
}

export function HeroAuthorityBadge({ children, inverted = false }: { children: React.ReactNode; inverted?: boolean }) {
  return <span className={styles.authorityBadge} data-inverted={inverted ? 'true' : 'false'}><ShieldCheck size={13} aria-hidden="true" />{children}</span>
}

export function HeroMetricGrid({ metrics, dark = false, className = '' }: { metrics: HeroMetric[]; dark?: boolean; className?: string }) {
  return <div className={`${styles.metricGrid} ${className}`}>{metrics.map((metric) => <div key={`${metric.label}-${metric.value}`} className={`${styles.metric} ${metricTone[metric.tone || 'slate']}`} data-dark={dark ? 'true' : 'false'}>
    <p>{metric.label}</p><strong>{metric.value}</strong>{metric.note ? <span>{metric.note}</span> : null}
  </div>)}</div>
}

export function HeroActionRail({ actions = [], dark = false }: { actions?: HeroAction[]; dark?: boolean }) {
  if (!actions.length) return null
  return <div className={styles.actionRail}>{actions.map((action) => {
    const Icon = action.icon || ArrowRight
    const className = `${styles.action} ${action.kind === 'primary' ? styles.actionPrimary : action.kind === 'danger' ? styles.actionDanger : styles.actionSecondary}`
    const title = action.disabled ? action.reason || 'Action indisponible.' : undefined
    if (action.href && !action.disabled) return <Link key={action.label} href={action.href} className={className} data-dark={dark ? 'true' : 'false'}><span>{action.label}</span><Icon size={15} aria-hidden="true" /></Link>
    return <button key={action.label} type="button" onClick={action.onClick} disabled={action.disabled} title={title} aria-disabled={action.disabled || undefined} className={className} data-dark={dark ? 'true' : 'false'}><span>{action.label}</span>{action.disabled ? <LockKeyhole size={14} aria-hidden="true" /> : <Icon size={15} aria-hidden="true" />}</button>
  })}</div>
}

export function HeroExecutiveBrief({ label = 'Intelligence exécutive', children, dark = false }: { label?: string; children: React.ReactNode; dark?: boolean }) {
  return <div className={styles.executiveBrief} data-dark={dark ? 'true' : 'false'}><span>{label}</span><p>{children}</p></div>
}

export function HeroWarning({ children, dark = false }: { children?: React.ReactNode; dark?: boolean }) {
  if (!children) return null
  return <div className={styles.warning} data-dark={dark ? 'true' : 'false'}>{children}</div>
}

export function HeroMicroLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <span className={styles.microLabel} data-dark={dark ? 'true' : 'false'}>{children}</span>
}
