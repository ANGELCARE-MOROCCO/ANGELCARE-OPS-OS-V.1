"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, CircleDot, Clock3, ExternalLink, ShieldAlert, UserRound } from "lucide-react"
import type { ReadinessCheck, StrategicContext } from "./bulk2-types"
import { strategicHref, writeStrategicContext } from "./bulk2-context"
import styles from "./bulk2-experience.module.css"

export function StrategicIdentityStrip({ context, nextAction, onNextAction }: { context: StrategicContext; nextAction: string; onNextAction?: () => void }) {
  React.useEffect(() => { writeStrategicContext(context) }, [context])
  return <section className={styles.identityStrip} aria-label="Identité du cas stratégique">
    <div className={styles.identityMark}><span>AC</span><small>SANILA</small></div>
    <div className={styles.identityCore}>
      <span className={styles.overline}>{context.caseCode || "CAS STRATÉGIQUE"}</span>
      <strong>{context.title || "Aucun cas sélectionné"}</strong>
      <div className={styles.identityMeta}>
        <span><CircleDot/> {context.stage}</span>
        <span><UserRound/> {context.owner || "Responsable non renseigné"}</span>
        <span><Clock3/> {context.deadline || "Échéance non renseignée"}</span>
        <span className={styles.statusPill}>{context.status || "État indisponible"}</span>
      </div>
    </div>
    <div className={styles.identityAction}>
      <small>Prochaine action gouvernée</small>
      {onNextAction ? <button className={styles.primaryAction} onClick={onNextAction}><span>{nextAction}</span><ArrowRight/></button> : <span className={styles.primaryActionStatic}>{nextAction}</span>}
    </div>
  </section>
}

export function StrategicContextSidecar({ context, sections, returnHref }: { context: StrategicContext; sections: Array<{ label: string; value: string; tone?: "success" | "warning" | "danger" | "neutral" }>; returnHref?: string }) {
  return <aside className={styles.contextSidecar} aria-label="Contexte stratégique continu">
    <header className={styles.sidecarHeader}>
      <div><span>Contexte continu</span><h2>{context.caseCode || "Cas non sélectionné"}</h2><p>{context.title || "Sélectionnez un objet pour inspecter sa lignée."}</p></div>
      {returnHref ? <Link className={styles.iconLink} href={returnHref} aria-label="Revenir au contexte précédent"><ArrowLeft/></Link> : null}
    </header>
    <div className={styles.sidecarStack}>
      {sections.map((section) => <article className={styles.sidecarItem} key={section.label}>
        <span className={styles.sidecarLabel}>{section.label}</span>
        <strong className={section.tone ? styles[`tone_${section.tone}`] : undefined}>{section.value}</strong>
      </article>)}
    </div>
    <nav className={styles.sidecarNav} aria-label="Passages stratégiques">
      <Link href={strategicHref("/market-os/content-command-center/signals", { ...context, stage: "observation" })}>Observatoire <ExternalLink/></Link>
      <Link href={strategicHref("/market-os/content-command-center/strategies", { ...context, stage: "strategy" })}>Fabrique <ExternalLink/></Link>
      <Link href={strategicHref("/market-os/content-command-center/briefs", { ...context, stage: "brief" })}>Briefing <ExternalLink/></Link>
      <Link href={strategicHref("/market-os/content-command-center/calendar", { ...context, stage: "planning" })}>Planning <ExternalLink/></Link>
      <Link href={strategicHref("/market-os/content-command-center/brand-governance", { ...context, stage: "brand" })}>Brand <ExternalLink/></Link>
    </nav>
  </aside>
}

export function ReadinessGate({ title, checks, actionLabel, onAction, actionDisabled }: { title: string; checks: ReadinessCheck[]; actionLabel: string; onAction?: () => void; actionDisabled?: boolean }) {
  const passed = checks.filter((check) => check.passed).length
  return <section className={styles.readinessGate} aria-label={title}>
    <header><div><span>Gate déterministe</span><h3>{title}</h3></div><div className={styles.readinessCount}><strong>{passed}</strong><span>/ {checks.length}</span></div></header>
    <div className={styles.readinessChecks}>
      {checks.map((check) => <article key={check.id} className={check.passed ? styles.checkPassed : styles.checkMissing}>
        {check.passed ? <CheckCircle2/> : <ShieldAlert/>}
        <div><strong>{check.label}</strong><p>{check.reason}</p>{check.owner ? <small>Responsable : {check.owner}</small> : null}</div>
      </article>)}
    </div>
    {onAction ? <button className={styles.gateAction} onClick={onAction} disabled={actionDisabled}>{actionLabel}<ArrowRight/></button> : null}
  </section>
}

export function EmptyStrategicState({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className={styles.emptyState}><span className={styles.emptySymbol}>AC</span><div><strong>{title}</strong><p>{detail}</p>{action}</div></div>
}

export function Notice({ children, tone = "neutral", onClose }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger"; onClose?: () => void }) {
  return <div className={`${styles.notice} ${styles[`notice_${tone}`]}`} role="status">
    {tone === "success" ? <CheckCircle2/> : tone === "warning" || tone === "danger" ? <AlertTriangle/> : <CircleDot/>}
    <span>{children}</span>{onClose ? <button onClick={onClose} aria-label="Fermer">×</button> : null}
  </div>
}

export function Drawer({ title, eyebrow, children, onClose, footer }: { title: string; eyebrow: string; children: React.ReactNode; onClose: () => void; footer?: React.ReactNode }) {
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])
  return <div className={styles.drawerBackdrop} onMouseDown={onClose}>
    <section className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="bulk2-drawer-title" onMouseDown={(event) => event.stopPropagation()}>
      <header className={styles.drawerHeader}><div><span>{eyebrow}</span><h2 id="bulk2-drawer-title">{title}</h2></div><button onClick={onClose} aria-label="Fermer">×</button></header>
      <div className={styles.drawerBody}>{children}</div>
      {footer ? <footer className={styles.drawerFooter}>{footer}</footer> : null}
    </section>
  </div>
}
