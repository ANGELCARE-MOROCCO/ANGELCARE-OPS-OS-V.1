"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { ArrowRight, CircleAlert, FileArchive, FileCheck2, FileImage, FileText, ShieldCheck } from "lucide-react"
import styles from "./knowledge-system.module.css"
import type { KnowledgeTone } from "./knowledge-model"

export function KnowledgeMetric({ icon: Icon, label, value, detail, tone = "neutral" }: { icon: LucideIcon; label: string; value: number | string; detail: string; tone?: KnowledgeTone }) {
  return <article className={`${styles.metric} ${styles[`tone_${tone}`]}`}><span><Icon/></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>
}

export function KnowledgeTabs<T extends string>({ value, onChange, items, label }: { value: T; onChange: (value: T) => void; items: Array<{ value: T; label: string; icon: LucideIcon; count?: number }>; label: string }) {
  return <div className={styles.tabs} role="tablist" aria-label={label}>{items.map(({ value: itemValue, label: itemLabel, icon: Icon, count }) => <button key={itemValue} type="button" role="tab" aria-selected={value === itemValue} className={value === itemValue ? styles.tabActive : ""} onClick={() => onChange(itemValue)}><Icon/><span>{itemLabel}</span>{typeof count === "number" ? <b>{count}</b> : null}</button>)}</div>
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: KnowledgeTone }) {
  return <span className={`${styles.pill} ${styles[`pill_${tone}`]}`}>{children}</span>
}

export function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className={styles.sectionTitle}><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action}</header>
}

export function TruthBoundary({ title, detail, tone = "info" }: { title: string; detail: string; tone?: KnowledgeTone }) {
  return <div className={`${styles.truthBoundary} ${styles[`tone_${tone}`]}`}><CircleAlert/><div><strong>{title}</strong><p>{detail}</p></div></div>
}

export function EmptyKnowledge({ title, detail, href, action }: { title: string; detail: string; href?: string; action?: string }) {
  return <div className={styles.empty}><span>AC</span><div><strong>{title}</strong><p>{detail}</p></div>{href && action ? <Link href={href}>{action}<ArrowRight/></Link> : null}</div>
}

export function FileClassLegend() {
  const classes = [
    { icon: FileArchive, title: "Source canonique", detail: "Original éditable gouverné et versionné.", tone: "info" as const },
    { icon: FileText, title: "Source de travail", detail: "Version en production, non encore canonique.", tone: "warning" as const },
    { icon: FileImage, title: "Rendition / aperçu", detail: "Représentation dérivée pour inspection ou canal.", tone: "neutral" as const },
    { icon: FileCheck2, title: "Export / publication", detail: "Livrable diffusé, jamais confondu avec l’original.", tone: "success" as const },
  ]
  return <div className={styles.fileLegend}>{classes.map(({ icon: Icon, title, detail, tone }) => <article key={title} className={styles[`tone_${tone}`]}><Icon/><div><strong>{title}</strong><p>{detail}</p></div></article>)}</div>
}

export function RelationshipChain({ stages }: { stages: Array<{ label: string; value: string; href?: string; state?: KnowledgeTone }> }) {
  return <div className={styles.relationshipChain}>{stages.map((stage, index) => <div key={`${stage.label}-${index}`} className={styles[`tone_${stage.state || "neutral"}`]}>{stage.href ? <Link href={stage.href}><small>{stage.label}</small><strong>{stage.value || "Relation absente"}</strong></Link> : <span><small>{stage.label}</small><strong>{stage.value || "Relation absente"}</strong></span>}{index < stages.length - 1 ? <ArrowRight/> : null}</div>)}</div>
}

export function IntegritySeal({ verified, label }: { verified: boolean; label: string }) {
  return <span className={`${styles.integritySeal} ${verified ? styles.integrityVerified : styles.integrityWarning}`}>{verified ? <ShieldCheck/> : <CircleAlert/>}<strong>{label}</strong></span>
}
