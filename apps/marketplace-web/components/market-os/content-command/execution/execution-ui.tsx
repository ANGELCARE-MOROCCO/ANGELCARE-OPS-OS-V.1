"use client"

import Link from "next/link"
import * as React from "react"
import { AlertTriangle, ArrowRight, CheckCircle2, LoaderCircle, X } from "lucide-react"
import styles from "./execution-command.module.css"

export function ExecutionPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`${styles.panel} ${className}`}>{children}</section>
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className={styles.sectionHeader}><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action}</header>
}

export function ExecutionBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  const toneClass = tone === "success" ? styles.badgeSuccess : tone === "warning" ? styles.badgeWarning : tone === "danger" ? styles.badgeDanger : tone === "info" ? styles.badgeInfo : ""
  return <span className={`${styles.badge} ${toneClass}`}>{children}</span>
}

export function MetricCard({ label, value, detail, icon }: { label: string; value: React.ReactNode; detail: string; icon?: React.ReactNode }) {
  return <article className={styles.metric}><span>{icon}{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)))
  return <div className={styles.readiness}><div className={styles.readinessTop}><span>{label || "Préparation opérationnelle"}</span><strong>{safe}%</strong></div><div className={styles.progress}><i style={{ width: `${safe}%` }}/></div></div>
}

export function EmptyState({ title, detail, href, action }: { title: string; detail: string; href?: string; action?: string }) {
  return <div className={styles.empty}><div><strong>{title}</strong><p>{detail}</p>{href && action ? <Link className={styles.quietButton} href={href}>{action}<ArrowRight size={15}/></Link> : null}</div></div>
}

export function StatusMessage({ kind, children }: { kind: "loading" | "warning" | "error" | "success"; children: React.ReactNode }) {
  const cls = kind === "error" ? `${styles.alert} ${styles.error}` : kind === "success" ? `${styles.alert} ${styles.success}` : styles.alert
  return <div className={cls} role={kind === "error" ? "alert" : "status"}>{kind === "loading" ? <LoaderCircle size={17}/> : kind === "success" ? <CheckCircle2 size={17}/> : <AlertTriangle size={17}/>}<div>{children}</div></div>
}

export function ExecutionModal({ open, title, children, footer, onClose }: { open: boolean; title: string; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void }) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])
  if (!open) return null
  return <div className={styles.modalBackdrop} role="presentation" onMouseDown={onClose}><section className={styles.modal} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Fermer"><X/></button></header><div className={styles.modalBody}>{children}</div>{footer ? <footer className={styles.modalFooter}>{footer}</footer> : null}</section></div>
}

export function toneForStatus(value: string): "neutral" | "success" | "warning" | "danger" | "info" {
  const status = value.toLowerCase()
  if (["done", "closed", "validated", "accepted", "approved", "ready", "resolved", "complete", "published"].some((word) => status.includes(word))) return "success"
  if (["blocked", "critical", "failed", "rejected", "cancelled", "overdue", "danger"].some((word) => status.includes(word))) return "danger"
  if (["waiting", "review", "submitted", "warning", "checkpoint", "revision", "paused"].some((word) => status.includes(word))) return "warning"
  if (["active", "doing", "assigned", "qualifying", "proposed", "info"].some((word) => status.includes(word))) return "info"
  return "neutral"
}
