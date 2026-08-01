'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowUpRight, DatabaseZap, Network, ShieldAlert } from 'lucide-react'
import type { SovereignEntity, SovereignMetric, SovereignSourceReport } from './SovereignTypes'
import styles from './SovereignExperience.module.css'

export function WorkspaceCrown({ eyebrow, title, subtitle, metrics, children }: { eyebrow: string; title: string; subtitle: string; metrics: SovereignMetric[]; children?: ReactNode }) {
  return (
    <header className={styles.workspaceCrown}>
      <div className={styles.workspaceCopy}>
        <div className={styles.workspaceEyebrow}>{eyebrow}</div>
        <h1 className={styles.workspaceTitle}>{title}</h1>
        <p className={styles.workspaceSubtitle}>{subtitle}</p>
        {children ? <div className={styles.workspaceActions}>{children}</div> : null}
      </div>
      <div className={styles.workspacePulse}>
        {metrics.slice(0, 4).map((metric) => <div className={styles.pulseRow} key={metric.key}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}
      </div>
    </header>
  )
}

export function IntelligenceRibbon({ metrics }: { metrics: SovereignMetric[] }) {
  return <div className={styles.intelligenceRibbon}>{metrics.map((metric) => <div key={metric.key} className={styles.ribbonSignal}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></div>)}</div>
}

export function LensBar({ lenses, active, onChange }: { lenses: string[]; active: string; onChange: (value: string) => void }) {
  return <div className={styles.lensBar}>{lenses.map((lens) => <button key={lens} type="button" className={active === lens ? styles.lensButtonActive : styles.lensButton} onClick={() => onChange(lens)}>{lens}</button>)}</div>
}

export function Surface({ eyebrow, title, description, count, children }: { eyebrow: string; title: string; description?: string; count?: number | string; children: ReactNode }) {
  return <section className={styles.surface}><header className={styles.surfaceHeader}><div><div className={styles.surfaceEyebrow}>{eyebrow}</div><h2 className={styles.surfaceTitle}>{title}</h2>{description ? <p className={styles.surfaceDescription}>{description}</p> : null}</div>{count !== undefined ? <span className={styles.surfaceCount}>{count}</span> : null}</header>{children}</section>
}

export function EntityMatrix({ entities, empty, onOpen }: { entities: SovereignEntity[]; empty: string; onOpen: (entity: SovereignEntity) => void }) {
  if (!entities.length) return <div className={styles.emptySignal}>{empty}</div>
  return <div className={styles.entityMatrix}>{entities.slice(0, 12).map((entity) => <button key={`${entity.kind}-${entity.id}`} type="button" className={styles.entityTile} onClick={() => onOpen(entity)}><div className={styles.entityTileTop}><span className={styles.entityTileTitle}>{entity.title}</span><span className={styles.entityTileStatus}>{entity.status || entity.kind}</span></div><div className={styles.entityTileMeta}>{entity.fields.slice(0,4).map((field) => <div className={styles.entityMetric} key={field.label}><span>{field.label}</span><strong>{field.value}</strong></div>)}</div></button>)}</div>
}

export function FlowField({ nodes }: { nodes: Array<{ label: string; value: string }> }) {
  return <div className={styles.flow}>{nodes.map((node) => <div className={styles.flowNode} key={node.label}><span>{node.label}</span><strong>{node.value}</strong></div>)}</div>
}

export function PressureList({ items, empty }: { items: Array<{ title: string; detail: string; value: string }>; empty: string }) {
  if (!items.length) return <div className={styles.emptySignal}>{empty}</div>
  return <div className={styles.pressureList}>{items.slice(0,8).map((item,index) => <div className={styles.pressureItem} key={`${item.title}-${index}`}><span className={styles.pressureSignal}/><div className={styles.pressureCopy}><strong>{item.title}</strong><span>{item.detail}</span></div><span className={styles.pressureValue}>{item.value}</span></div>)}</div>
}

export function DeepNavigation({ items }: { items: Array<{ label: string; href: string; eyebrow: string }> }) {
  return <div className={styles.deepNav}>{items.map((item) => <Link className={styles.deepNavLink} href={item.href} key={item.href}><span>{item.eyebrow}</span><strong>{item.label}</strong><ArrowUpRight size={15}/></Link>)}</div>
}

export function SourceIntegrity({ sources }: { sources: SovereignSourceReport[] }) {
  const unavailable = sources.filter((source) => source.state === 'unavailable')
  return <div className={styles.sidecarBlock}><h4>{unavailable.length ? <><ShieldAlert size={13}/> Intégrité partielle</> : <><DatabaseZap size={13}/> Sources opérationnelles</>}</h4><p>{unavailable.length ? `${unavailable.length} source(s) indisponible(s). Aucun zéro trompeur n’est affiché.` : `${sources.length} sources chargées avec traçabilité.`}</p>{sources.slice(0,8).map((source) => <div className={styles.sidecarEvent} key={source.key}><span className={styles.sidecarDot}/><div><strong>{source.label} · {source.count}</strong><span>{source.state === 'complete' ? 'Disponible' : source.message || 'Indisponible'}</span></div></div>)}</div>
}

export function RelationshipSummary({ count }: { count: number }) {
  return <div className={styles.sidecarBlock}><h4><Network size={13}/> Graphe opérationnel</h4><p>{count} relations actives entre clients, tenants, abonnements, finance, service et gouvernance.</p></div>
}
