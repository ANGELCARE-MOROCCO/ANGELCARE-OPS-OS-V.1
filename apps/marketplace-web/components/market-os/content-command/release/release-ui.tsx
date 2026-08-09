"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, X } from "lucide-react"
import styles from "./mz7-release.module.css"

export type ReleaseTone = "neutral" | "info" | "success" | "warning" | "danger" | "authority"

export function toneClass(tone: ReleaseTone) {
  return styles[`tone_${tone}`] || ""
}

export function Pill({ tone = "neutral", children }: { tone?: ReleaseTone; children: React.ReactNode }) {
  return <span className={`${styles.pill} ${toneClass(tone)}`}>{children}</span>
}

export function Metric({ icon, label, value, detail, tone = "neutral" }: { icon: React.ReactNode; label: string; value: React.ReactNode; detail: string; tone?: ReleaseTone }) {
  return <article className={`${styles.metric} ${toneClass(tone)}`}><span className={styles.metricIcon}>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>
}

export function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: { label: string; href?: string; onClick?: () => void } }) {
  return <header className={styles.sectionTitle}><div><span>{eyebrow}</span><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{action ? action.href ? <Link href={action.href}>{action.label}<ArrowRight/></Link> : <button type="button" onClick={action.onClick}>{action.label}<ArrowRight/></button> : null}</header>
}

export function Empty({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className={styles.empty}><strong>{title}</strong><p>{detail}</p>{action}</div>
}

export function Field({ label, hint, wide = false, children }: { label: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`${styles.field} ${wide ? styles.fieldWide : ""}`}><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>
}

export function Modal({ open, eyebrow, title, children, footer, onClose }: { open: boolean; eyebrow: string; title: string; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void }) {
  const dialogRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    dialog?.querySelector<HTMLElement>("button, input, select, textarea, a[href]")?.focus()
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
      if (event.key !== "Tab" || !dialog) return
      const focusable = [...dialog.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]")]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener("keydown", handleKey)
    return () => { document.removeEventListener("keydown", handleKey); previous?.focus() }
  }, [open, onClose])
  if (!open) return null
  return <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><div ref={dialogRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="bulk6-dialog-title"><header><div><span>{eyebrow}</span><h2 id="bulk6-dialog-title">{title}</h2></div><button type="button" aria-label="Fermer" onClick={onClose}><X/></button></header><div className={styles.modalBody}>{children}</div>{footer ? <footer>{footer}</footer> : null}</div></div>
}
