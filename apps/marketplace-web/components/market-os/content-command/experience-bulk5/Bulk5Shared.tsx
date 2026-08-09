"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, CircleDashed, LoaderCircle, RefreshCcw, ShieldCheck, Sparkles, X } from "lucide-react"
import type { Bulk5Context, Bulk5Tone, ReadinessGate } from "./bulk5-types"
import styles from "./bulk5-experience.module.css"

export function Bulk5BrandCrown({ eyebrow, title, description, actions, returnTo }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode; returnTo?: string }) {
  return <header className={styles.brandCrown}>
    <div className={styles.brandIdentity}><img src="/logo.png" alt="AngelCare"/><span><small>ANGELCARE · SANILA MARKET OS</small><strong>Proof & Human Authority System</strong></span></div>
    <div className={styles.brandNarrative}><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
    <div className={styles.brandActions}>{returnTo ? <Link href={returnTo}><ArrowLeft/> Retour au contexte</Link> : null}{actions}</div>
  </header>
}

export function Bulk5TruthState({ loading, error, onRefresh }: { loading?: boolean; error?: string; onRefresh?: () => void }) {
  if (loading) return <div className={styles.loadingState}><LoaderCircle className={styles.spin}/><span><strong>Synchronisation des preuves et décisions…</strong><small>Versions, evidence, reviews et autorité humaine.</small></span></div>
  if (error) return <div className={styles.errorState}><AlertTriangle/><span><strong>Registre institutionnel indisponible</strong><small>{error}. Aucune preuve ou validation fictive n’est substituée.</small></span>{onRefresh ? <button onClick={onRefresh}><RefreshCcw/> Réessayer</button> : null}</div>
  return null
}

export function TonePill({ tone = "neutral", children }: { tone?: Bulk5Tone; children: React.ReactNode }) {
  return <span className={`${styles.tonePill} ${styles[`tone_${tone}`]}`}><i aria-hidden="true"/>{children}</span>
}
export function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className={styles.sectionTitle}><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action ? <div>{action}</div> : null}</header>
}
export function EmptyAuthorityState({ title, detail, href, action }: { title: string; detail: string; href?: string; action?: string }) {
  return <div className={styles.emptyState}><CircleDashed/><div><strong>{title}</strong><p>{detail}</p></div>{href && action ? <Link href={href}>{action}<ArrowRight/></Link> : null}</div>
}
export function DominantAction({ href, onClick, disabled, children }: { href?: string; onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  if (href) return <Link className={styles.dominantAction} href={href}><Sparkles/>{children}<ArrowRight/></Link>
  return <button className={styles.dominantAction} type="button" onClick={onClick} disabled={disabled}><Sparkles/>{children}<ArrowRight/></button>
}

export function ProofContextStrip({ context, caseCode, version, stage }: { context: Bulk5Context; caseCode?: string; version?: string; stage: string }) {
  return <section className={styles.contextStrip} aria-label="Contexte continu de preuve">
    <div><small>DOSSIER</small><strong>{caseCode || context.dossierTitle || context.dossierId || "Non sélectionné"}</strong></div>
    <div><small>VERSION CONTRÔLÉE</small><strong>{version || context.version || "Non exposée"}</strong></div>
    <div><small>MISSION / TÂCHE</small><strong>{context.taskId || context.missionId || "Relation non exposée"}</strong></div>
    <div><small>ÉTAPE</small><strong>{stage}</strong></div>
    <TonePill tone={caseCode ? "info" : "warning"}>{caseCode ? "Contexte préservé" : "Sélection requise"}</TonePill>
  </section>
}

export function ReadinessMatrix({ gates, title = "Institutional readiness" }: { gates: ReadinessGate[]; title?: string }) {
  const blockers = gates.filter((gate) => gate.blocking && !gate.passed)
  return <section className={styles.readinessMatrix} aria-label={title}>
    <header><span><ShieldCheck/><small>CONTROL MATRIX</small></span><strong>{title}</strong><TonePill tone={blockers.length ? "danger" : "success"}>{blockers.length ? `${blockers.length} blocage(s)` : "Gate franchissable"}</TonePill></header>
    <div>{gates.map((gate) => <article key={gate.id} className={gate.passed ? styles.gatePassed : gate.blocking ? styles.gateBlocked : styles.gateWarning}>{gate.passed ? <CheckCircle2/> : <AlertTriangle/>}<span><strong>{gate.label}</strong><small>{gate.detail}</small></span><b>{gate.passed ? "PASS" : gate.blocking ? "BLOQUANT" : "REQUIS"}</b></article>)}</div>
  </section>
}

export function Bulk5Modal({ open, onClose, title, subtitle, children, footer }: { open: boolean; onClose: () => void; title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  React.useEffect(() => {
    if (!open) return
    const listener = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    document.addEventListener("keydown", listener)
    return () => document.removeEventListener("keydown", listener)
  }, [open, onClose])
  if (!open) return null
  return <div className={styles.modalBackdrop} role="presentation" onMouseDown={onClose}><section className={styles.modalShell} role="dialog" aria-modal="true" aria-labelledby="bulk5-modal-title" onMouseDown={(event) => event.stopPropagation()}><header><div><small>{subtitle}</small><h2 id="bulk5-modal-title">{title}</h2></div><button type="button" aria-label="Fermer" onClick={onClose}><X/></button></header><div className={styles.modalBody}>{children}</div>{footer ? <footer>{footer}</footer> : null}</section></div>
}

export function WorkspaceTabs({ value, items, onChange }: { value: string; items: Array<{ id: string; label: string; detail: string }>; onChange: (value: string) => void }) {
  return <nav className={styles.workspaceTabs} aria-label="Modes du workspace">{items.map((item) => <button type="button" key={item.id} aria-current={value === item.id ? "page" : undefined} onClick={() => onChange(item.id)}><strong>{item.label}</strong><small>{item.detail}</small></button>)}</nav>
}

export { styles }
