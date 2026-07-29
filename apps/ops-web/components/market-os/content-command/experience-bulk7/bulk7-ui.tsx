import type { LucideIcon } from "lucide-react"
import { ArrowRight, CircleAlert, DatabaseZap, ShieldCheck } from "lucide-react"
import styles from "./bulk7-impact.module.css"
import type { ImpactTone } from "./bulk7-impact-model"

export function TonePill({ tone = "neutral", children }: { tone?: ImpactTone; children: React.ReactNode }) {
  return <span className={`${styles.tonePill} ${styles[`tone_${tone}`]}`}><i aria-hidden="true" />{children}</span>
}

export function WorkspaceTitle({ eyebrow, title, description, icon: Icon, action }: { eyebrow: string; title: string; description: string; icon: LucideIcon; action?: React.ReactNode }) {
  return <header className={styles.workspaceTitle}><div className={styles.titleIcon}><Icon /></div><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action ? <aside>{action}</aside> : null}</header>
}

export function TruthBoundary({ title, detail, tone = "info" }: { title: string; detail: string; tone?: ImpactTone }) {
  return <div className={`${styles.truthBoundary} ${styles[`tone_${tone}`]}`}><CircleAlert/><div><strong>{title}</strong><p>{detail}</p></div></div>
}

export function DataSeal({ source, reference, limitations }: { source: string; reference: string; limitations: string }) {
  return <div className={styles.dataSeal}><DatabaseZap/><div><small>PROVENANCE DE MESURE</small><strong>{source || "Source non documentée"}</strong><p>{reference || "Aucune référence externe ou interne n’est fournie."}</p></div><TonePill tone={limitations ? "warning" : "success"}>{limitations ? "Limites déclarées" : "Limites non signalées"}</TonePill></div>
}

export function MetricReadout({ label, value, detail, icon: Icon, tone = "neutral" }: { label: string; value: React.ReactNode; detail: string; icon: LucideIcon; tone?: ImpactTone }) {
  return <article className={`${styles.metricReadout} ${styles[`tone_${tone}`]}`}><span><Icon/></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>
}

export function DominantAction({ label, detail, onClick, href }: { label: string; detail: string; onClick?: () => void; href?: string }) {
  const body = <><span><ShieldCheck/><small>ACTION DOMINANTE</small><strong>{label}</strong><p>{detail}</p></span><ArrowRight/></>
  return href ? <a className={styles.dominantAction} href={href}>{body}</a> : <button type="button" className={styles.dominantAction} onClick={onClick}>{body}</button>
}
