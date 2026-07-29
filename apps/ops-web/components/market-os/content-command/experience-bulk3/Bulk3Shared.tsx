"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  FileCheck2,
  LoaderCircle,
  LockKeyhole,
  ShieldAlert,
  Sparkles,
  Target,
  X,
} from "lucide-react"
import styles from "./bulk3-experience.module.css"

export function Bulk3Shell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <main className={`${styles.root} ${className}`} data-market-os-root data-bulk3-experience>{children}</main>
}

export function ExperienceHeader({
  eyebrow,
  title,
  description,
  badge,
  actions,
  compact = false,
}: {
  eyebrow: string
  title: string
  description: string
  badge?: React.ReactNode
  actions?: React.ReactNode
  compact?: boolean
}) {
  return <header className={`${styles.experienceHeader} ${compact ? styles.experienceHeaderCompact : ""}`}>
    <div className={styles.experienceHeaderCopy}>
      <span className={styles.eyebrow}><Sparkles size={15}/>{eyebrow}</span>
      <div className={styles.titleLine}><h1>{title}</h1>{badge}</div>
      <p>{description}</p>
    </div>
    {actions ? <div className={styles.headerActions}>{actions}</div> : null}
  </header>
}

export function ReturnContext({ href, label = "Revenir au contexte" }: { href?: string; label?: string }) {
  if (!href) return null
  return <Link className={styles.returnContext} href={href}><ArrowLeft size={15}/>{label}</Link>
}

export function IdentityBridge({
  code,
  title,
  meta,
  state,
  dominantAction,
  onDominantAction,
  disabled,
}: {
  code: string
  title: string
  meta: Array<{ label: string; value: React.ReactNode }>
  state: React.ReactNode
  dominantAction?: string
  onDominantAction?: () => void
  disabled?: boolean
}) {
  return <section className={styles.identityBridge}>
    <div className={styles.identityMain}>
      <span className={styles.identityCode}>{code}</span>
      <h2>{title}</h2>
      <div className={styles.identityMeta}>{meta.map((item) => <span key={item.label}><small>{item.label}</small><strong>{item.value}</strong></span>)}</div>
    </div>
    <div className={styles.identityDecision}>
      {state}
      {dominantAction && onDominantAction ? <button type="button" className={styles.dominantButton} onClick={onDominantAction} disabled={disabled}><Target size={16}/>{dominantAction}<ArrowRight size={15}/></button> : null}
    </div>
  </section>
}

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" | "navy" }) {
  return <span className={`${styles.statusPill} ${styles[`status_${tone}`]}`}>{children}</span>
}

export function MetricRail({ items }: { items: Array<{ label: string; value: React.ReactNode; detail: string; tone?: "neutral" | "success" | "warning" | "danger" | "info" }> }) {
  return <section className={styles.metricRail} aria-label="Indicateurs opérationnels">{items.map((item) => <article key={item.label} className={`${styles.metricRailItem} ${item.tone ? styles[`metric_${item.tone}`] : ""}`}><small>{item.label}</small><strong>{item.value}</strong><p>{item.detail}</p></article>)}</section>
}

export function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className={styles.sectionTitle}><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action}</header>
}

export function GovernanceNotice({ kind = "info", title, children }: { kind?: "info" | "success" | "warning" | "danger"; title: string; children: React.ReactNode }) {
  const Icon = kind === "success" ? CheckCircle2 : kind === "danger" ? ShieldAlert : kind === "warning" ? AlertTriangle : CircleDot
  return <div className={`${styles.governanceNotice} ${styles[`notice_${kind}`]}`} role={kind === "danger" ? "alert" : "status"}><Icon size={18}/><div><strong>{title}</strong><p>{children}</p></div></div>
}

export function ReadinessRunway({ completed, total, missing, label = "Préparation gouvernée" }: { completed: number; total: number; missing: string[]; label?: string }) {
  const ratio = total ? Math.round((completed / total) * 100) : 0
  return <div className={styles.readinessRunway}>
    <div className={styles.readinessHeader}><div><small>{label}</small><strong>{completed}/{total} conditions</strong></div><span>{ratio}% observé</span></div>
    <div className={styles.runwayTrack} aria-label={`${completed} conditions sur ${total}`}><i style={{ width: `${Math.min(100, Math.max(0, ratio))}%` }}/></div>
    {missing.length ? <ul>{missing.map((item) => <li key={item}><AlertTriangle size={14}/>{item}</li>)}</ul> : <div className={styles.readinessSuccess}><CheckCircle2 size={15}/>Toutes les conditions observables sont satisfaites.</div>}
  </div>
}

export function OperationalEmpty({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className={styles.operationalEmpty}><div className={styles.emptyMark}><LockKeyhole size={20}/></div><div><strong>{title}</strong><p>{detail}</p>{action}</div></div>
}

export function ActivityLine({ title, detail, date, icon }: { title: string; detail: string; date?: string; icon?: React.ReactNode }) {
  return <article className={styles.activityLine}><span>{icon || <Clock3 size={15}/>}</span><div><strong>{title}</strong><p>{detail}</p></div>{date ? <time>{date}</time> : null}</article>
}

export function EvidenceTile({ label, state, note, href }: { label: string; state: string; note?: string; href?: string }) {
  const content = <><span><FileCheck2 size={16}/></span><div><strong>{label}</strong><p>{note || "Aucune note enregistrée"}</p></div><StatusPill tone={state === "accepted" ? "success" : state === "rejected" ? "danger" : state === "submitted" ? "warning" : "neutral"}>{state}</StatusPill></>
  return href ? <Link className={styles.evidenceTile} href={href}>{content}<ChevronRight size={14}/></Link> : <article className={styles.evidenceTile}>{content}</article>
}

export function Bulk3Modal({ open, title, subtitle, children, footer, onClose }: { open: boolean; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void }) {
  const closeRef = React.useRef<HTMLButtonElement | null>(null)
  React.useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])
  if (!open) return null
  return <div className={styles.modalBackdrop} onMouseDown={onClose} role="presentation"><section className={styles.modal} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}><header><div><span>ANGELCARE / EXECUTION GOVERNANCE</span><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div><button ref={closeRef} type="button" onClick={onClose} aria-label="Fermer"><X/></button></header><div className={styles.modalBody}>{children}</div>{footer ? <footer>{footer}</footer> : null}</section></div>
}

export function BusyLabel({ busy, children }: { busy?: boolean; children: React.ReactNode }) {
  return <>{busy ? <LoaderCircle className={styles.spin} size={15}/> : null}{children}</>
}
