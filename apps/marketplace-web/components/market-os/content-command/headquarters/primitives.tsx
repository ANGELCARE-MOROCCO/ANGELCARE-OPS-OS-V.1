"use client"

import Link from "next/link"
import * as React from "react"
import { AlertTriangle, ArrowRight, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react"
import styles from "./content-command-headquarters.module.css"

export function PageStatus({ loading, error, migrationReady, refresh }: { loading: boolean; error: string; migrationReady?: boolean; refresh: () => void }) {
  if (loading) return <div className={styles.statePanel}><LoaderCircle className={styles.spin}/><strong>Chargement du quartier général Content Command…</strong><span>Les signaux, missions, dossiers, preuves, sources et décisions sont consolidés.</span></div>
  if (error) return <div className={`${styles.statePanel} ${styles.stateDanger}`}><AlertTriangle/><strong>{error}</strong><span>La page ne transforme jamais une source indisponible en donnée fictive.</span><button onClick={refresh}><RefreshCw/>Réessayer</button></div>
  if (migrationReady === false) return <div className={`${styles.statePanel} ${styles.stateWarning}`}><ShieldCheck/><strong>Fondation Phase 5 à activer</strong><span>Le cockpit est installé, mais la migration additive Content Headquarters n’est pas encore visible dans Supabase.</span></div>
  return null
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`] || styles.badge_neutral}`}>{children}</span>
}

export function Metric({ label, value, detail, icon, tone = "navy" }: { label: string; value: React.ReactNode; detail: string; icon: React.ReactNode; tone?: string }) {
  return <article className={`${styles.metric} ${styles[`metric_${tone}`] || ""}`}><span className={styles.metricIcon}>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>
}

export function Empty({ title, detail, action, href }: { title: string; detail: string; action?: string; href?: string }) {
  return <div className={styles.empty}><span className={styles.emptyMark}>AC</span><div><strong>{title}</strong><p>{detail}</p></div>{action && href ? <Link href={href}>{action}<ArrowRight/></Link> : null}</div>
}

export function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className={styles.sectionHeader}><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action}</header>
}

export function Progress({ value, label }: { value: number; label?: string }) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)))
  return <div className={styles.progressWrap}>{label ? <div><span>{label}</span><strong>{safe}%</strong></div> : null}<span className={styles.progress}><i style={{ width: `${safe}%` }}/></span></div>
}

export function Modal({ open, title, children, onClose, footer }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void; footer?: React.ReactNode }) {
  if (!open) return null
  return <div className={styles.modalBackdrop} onMouseDown={onClose}><section className={styles.modal} onMouseDown={(event) => event.stopPropagation()}><header><div><span>SANILA CONTENT COMMAND</span><h2>{title}</h2></div><button type="button" onClick={onClose}>×</button></header><div className={styles.modalBody}>{children}</div>{footer ? <footer>{footer}</footer> : null}</section></div>
}

export function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={wide ? styles.fieldWide : styles.field}><span>{label}</span>{children}</label>
}
