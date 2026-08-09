"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  LoaderCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import type { Bulk4ReadinessTone, PreflightCheck } from "./bulk4-types"
import styles from "./bulk4-experience.module.css"

export function Bulk4BrandCrown({
  eyebrow,
  title,
  description,
  actions,
  returnTo,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: React.ReactNode
  returnTo?: string
}) {
  return <header className={styles.brandCrown}>
    <div className={styles.brandIdentity}>
      <img src="/logo.png" alt="AngelCare" />
      <span><small>ANGELCARE · SANILA MARKET OS</small><strong>Creative Production Universe</strong></span>
    </div>
    <div className={styles.brandNarrative}><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
    <div className={styles.brandActions}>{returnTo ? <Link href={returnTo}><ArrowLeft/> Retour au contexte</Link> : null}{actions}</div>
  </header>
}

export function Bulk4TruthState({
  loading,
  error,
  onRefresh,
}: {
  loading?: boolean
  error?: string
  onRefresh?: () => void
}) {
  if (loading) return <div className={styles.loadingState}><LoaderCircle className={styles.spin}/><span><strong>Synchronisation du registre créatif…</strong><small>Templates, assets, documents et versions autoritaires.</small></span></div>
  if (error) return <div className={styles.errorState}><AlertTriangle/><span><strong>Registre indisponible</strong><small>{error}. Aucun actif de démonstration n’est substitué aux données réelles.</small></span>{onRefresh ? <button onClick={onRefresh}><RefreshCcw/> Réessayer</button> : null}</div>
  return null
}

export function TonePill({ tone = "neutral", children }: { tone?: Bulk4ReadinessTone; children: React.ReactNode }) {
  return <span className={`${styles.tonePill} ${styles[`tone_${tone}`]}`}><i aria-hidden="true" />{children}</span>
}

export function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className={styles.sectionTitle}><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action ? <div>{action}</div> : null}</header>
}

export function EmptyCreativeState({ title, detail, href, action }: { title: string; detail: string; href?: string; action?: string }) {
  return <div className={styles.emptyState}><CircleDashed/><div><strong>{title}</strong><p>{detail}</p></div>{href && action ? <Link href={href}>{action}<ArrowRight/></Link> : null}</div>
}

export function PreflightPanel({ checks, title = "Production preflight" }: { checks: PreflightCheck[]; title?: string }) {
  const blocking = checks.filter((check) => check.blocking && !check.passed)
  return <section className={styles.preflightPanel} aria-label={title}>
    <header><span><ShieldCheck/><small>CONTROL GATE</small></span><strong>{title}</strong><TonePill tone={blocking.length ? "danger" : "success"}>{blocking.length ? `${blocking.length} blocage(s)` : "Prêt à progresser"}</TonePill></header>
    <div>{checks.map((check) => <article key={check.id} className={check.passed ? styles.checkPassed : check.blocking ? styles.checkBlocked : styles.checkWarning}>
      {check.passed ? <CheckCircle2/> : <AlertTriangle/>}<span><strong>{check.label}</strong><small>{check.detail}</small></span><b>{check.passed ? "Conforme" : check.blocking ? "Bloquant" : "À traiter"}</b>
    </article>)}</div>
  </section>
}

export function Bulk4Modal({ open, onClose, title, subtitle, children, footer }: { open: boolean; onClose: () => void; title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  React.useEffect(() => {
    if (!open) return
    const listener = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    document.addEventListener("keydown", listener)
    return () => document.removeEventListener("keydown", listener)
  }, [open, onClose])
  if (!open) return null
  return <div className={styles.modalBackdrop} role="presentation" onMouseDown={onClose}>
    <section className={styles.modalShell} role="dialog" aria-modal="true" aria-labelledby="bulk4-modal-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><small>{subtitle}</small><h2 id="bulk4-modal-title">{title}</h2></div><button type="button" aria-label="Fermer" onClick={onClose}><X/></button></header>
      <div className={styles.modalBody}>{children}</div>
      {footer ? <footer>{footer}</footer> : null}
    </section>
  </div>
}

export function DominantAction({ href, onClick, disabled, children }: { href?: string; onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  if (href) return <Link className={styles.dominantAction} href={href}><Sparkles/>{children}<ArrowRight/></Link>
  return <button className={styles.dominantAction} type="button" onClick={onClick} disabled={disabled}><Sparkles/>{children}<ArrowRight/></button>
}

export { styles }
