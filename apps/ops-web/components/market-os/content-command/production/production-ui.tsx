"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight, Boxes, CircleAlert } from "lucide-react"
import type { ReactNode } from "react"
import styles from "./production-system.module.css"
import type { ProductionTone } from "./production-model"

const toneClassByTone = {
  neutral: undefined,
  success: styles.tone_success,
  warning: styles.tone_warning,
  danger: styles.tone_danger,
  info: styles.tone_info,
  violet: styles.tone_violet,
} satisfies Readonly<Record<ProductionTone, string | undefined>>

const pillClassByTone = {
  neutral: undefined,
  success: styles.pill_success,
  warning: styles.pill_warning,
  danger: styles.pill_danger,
  info: styles.pill_info,
  violet: styles.pill_violet,
} satisfies Readonly<Record<ProductionTone, string | undefined>>

export function ProductionCanvas({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main data-market-os-root className={`${styles.canvas} ${className}`}>{children}</main>
}

export function CommandHero({ eyebrow, title, description, icon: Icon, metrics, actions, tone = "navy" }: {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  metrics?: Array<{ label: string; value: ReactNode; detail?: string }>
  actions?: ReactNode
  tone?: "navy" | "violet" | "emerald" | "amber"
}) {
  return <section className={`${styles.hero} ${styles[`hero_${tone}`]}`}>
    <div className={styles.heroIdentity}><span className={styles.heroIcon}><Icon /></span><div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div></div>
    {metrics?.length ? <div className={styles.heroMetrics}>{metrics.map((metric) => <div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span>{metric.detail ? <small>{metric.detail}</small> : null}</div>)}</div> : null}
    {actions ? <div className={styles.heroActions}>{actions}</div> : null}
  </section>
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className={styles.sectionHeading}><div><p>{eyebrow}</p><h2>{title}</h2><span>{description}</span></div>{action}</header>
}

export function MetricCard({ icon: Icon, label, value, detail, tone = "neutral" }: { icon: LucideIcon; label: string; value: ReactNode; detail: string; tone?: ProductionTone }) {
  return <article className={`${styles.metricCard} ${toneClassByTone[tone]}`}><span><Icon /></span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: ProductionTone }) {
  return <span className={`${styles.statusPill} ${pillClassByTone[tone]}`}>{children}</span>
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0))
  return <div className={styles.progressBlock}>{label ? <div><span>{label}</span><strong>{safe}%</strong></div> : null}<i><b style={{ width: `${safe}%` }} /></i></div>
}

export function EmptyOperational({ title, detail, action, href }: { title: string; detail: string; action?: string; href?: string }) {
  return <div className={styles.empty}><span><Boxes /></span><div><strong>{title}</strong><p>{detail}</p></div>{action && href ? <Link href={href}>{action}<ArrowRight /></Link> : null}</div>
}

export function TruthNotice({ title, detail, tone = "warning" }: { title: string; detail: string; tone?: ProductionTone }) {
  return <div className={`${styles.truthNotice} ${toneClassByTone[tone]}`}><CircleAlert /><div><strong>{title}</strong><p>{detail}</p></div></div>
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link className={styles.textLink} href={href}>{children}<ArrowRight /></Link>
}

export { styles }
