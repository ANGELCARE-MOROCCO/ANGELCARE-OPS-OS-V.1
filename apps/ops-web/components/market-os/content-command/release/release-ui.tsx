"use client"

import * as React from "react"
import Link from "next/link"
import { AlertCircle, X } from "lucide-react"
import styles from "./mz7-release.module.css"

export type ReleaseTone = "success" | "warning" | "danger" | "info" | "neutral"

export function toneClass(tone: ReleaseTone) {
  return tone === "danger" ? styles.dangerTone : styles[tone]
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: ReleaseTone }) {
  return <span className={`${styles.pill} ${toneClass(tone)}`}>{children}</span>
}

export function Metric({ icon, label, value, detail, tone = "neutral" }: { icon: React.ReactNode; label: string; value: number | string; detail: string; tone?: ReleaseTone }) {
  return <article className={`${styles.metric} ${toneClass(tone)}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>
}

export function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: { href?: string; label: string; onClick?: () => void } }) {
  return <header className={styles.sectionTitle}><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action ? action.href ? <Link href={action.href}>{action.label}</Link> : <button type="button" onClick={action.onClick}>{action.label}</button> : null}</header>
}

export function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className={styles.empty}><span><AlertCircle/></span><div><strong>{title}</strong><p>{detail}</p></div></div>
}

export function Modal({ open, eyebrow, title, children, footer, onClose }: { open: boolean; eyebrow: string; title: string; children: React.ReactNode; footer: React.ReactNode; onClose: () => void }) {
  const closeRef = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    requestAnimationFrame(() => closeRef.current?.focus())
    return () => { document.removeEventListener("keydown", handler); previous?.focus?.() }
  }, [open, onClose])
  if (!open) return null
  return <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="mz7-modal-title" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><section className={styles.modal}><header><div><span>{eyebrow}</span><h2 id="mz7-modal-title">{title}</h2></div><button ref={closeRef} type="button" aria-label="Fermer" onClick={onClose}><X/></button></header><div className={styles.modalBody}>{children}</div><footer>{footer}</footer></section></div>
}

export function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`${styles.field} ${wide ? styles.fieldWide : ""}`}><span>{label}</span>{children}</label>
}
