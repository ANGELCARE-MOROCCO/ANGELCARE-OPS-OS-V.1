'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, ChevronRight, CircleAlert, ExternalLink, LockKeyhole, ShieldCheck, X } from 'lucide-react'
import OperatorOverlayPortal from '../OperatorOverlayPortal'
import styles from './Wave2CommandExperience.module.css'
import type {
  Wave2Action,
  Wave2CommandBase,
  Wave2Decision,
  Wave2Evidence,
  Wave2Factor,
  Wave2RelationshipNode,
  Wave2RibbonItem,
  Wave2Simulation,
  Wave2TimelineEvent,
  Wave2Tone,
} from './Wave2CommandTypes'

export function Wave2IdentityChamber({ command, kind, extra }: { command: Wave2CommandBase; kind: 'customer' | 'tenant' | 'subscription' | 'billing' | 'renewal' | 'incident'; extra?: ReactNode }) {
  return (
    <section className={styles.identity}>
      <div className={styles.identityMain}>
        <div className={styles.eyebrow}>ANGELCARE 360 OPERATOR · {command.entityKind}</div>
        <h1 className={styles.title}>{command.title}</h1>
        <p className={styles.subtitle}>{command.subtitle}</p>
        <div className={styles.identityMeta}>
          <span className={styles.pill}><ToneDot tone={command.tone} /> {command.status}</span>
          <span className={styles.pill}>Owner · {command.owner}</span>
          <span className={styles.pill}>Sponsor · {command.sponsor}</span>
          <span className={styles.pill}>Risque · {command.riskLabel}</span>
        </div>
        {extra}
      </div>
      <aside className={styles.identitySide}>
        <IdentityMetric label="Valeur financière" value={formatDh(command.financialValueDh)} detail="Valeur ou exposition dérivée des données disponibles." />
        <IdentityMetric label="Prochaine échéance" value={command.nextDeadline} detail="Date la plus importante liée à l’entité." />
        <IdentityMetric label="Dernier signal" value={command.lastMeaningfulEvent} detail="Événement significatif le plus récent." />
        <IdentityMetric label="Recommandation" value={command.primaryRecommendation} detail="Orientation déterministe, sans intelligence artificielle inventée." />
      </aside>
    </section>
  )
}

function IdentityMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className={styles.identityMetric}><div className={styles.metricLabel}>{label}</div><div className={styles.metricValue}>{value}</div><div className={styles.metricDetail}>{detail}</div></div>
}

export function Wave2SourceHealth({ command }: { command: Wave2CommandBase }) {
  if (command.sourceState === 'complete') return null
  return (
    <section className={styles.sourceBanner} role="status">
      <div>
        <div className={styles.sourceBannerStrong}>{command.sourceState === 'partial' ? 'Données partielles' : 'Sources indisponibles'}</div>
        <div className={styles.sourceBannerDetail}>Les valeurs absentes ne sont pas converties en zéros. Ouvrez les sources ci-dessous pour comprendre les limites de cette lecture.</div>
      </div>
      <CircleAlert size={20} aria-hidden="true" />
      <div className={styles.sourceGrid}>
        {command.sources.filter((source) => source.state !== 'complete').map((source) => <div key={source.key} className={styles.sourceCard}><div className={styles.sourceCardLabel}>{source.label}</div><div className={styles.sourceCardDetail}>{source.detail}</div></div>)}
      </div>
    </section>
  )
}

export function Wave2IntelligenceRibbon({ items, onEvidence }: { items: Wave2RibbonItem[]; onEvidence: (ids: string[], title: string) => void }) {
  return <section className={styles.ribbon} aria-label="Ruban d’intelligence contextuelle">{items.map((item) => <button key={item.id} type="button" className={styles.ribbonButton} onClick={() => onEvidence(item.evidenceIds || [], item.label)}><span className={styles.ribbonLabel}>{item.label}</span><span className={styles.ribbonValue}>{item.value}</span><span className={styles.ribbonDetail}>{item.detail}</span></button>)}</section>
}

export function Wave2LensBar({ lenses, active, onChange }: { lenses: string[]; active: string; onChange: (lens: string) => void }) {
  return <nav className={styles.lensBar} aria-label="Lenses de management">{lenses.map((lens) => <button type="button" key={lens} onClick={() => onChange(lens)} className={`${styles.lensButton} ${active === lens ? styles.lensButtonActive : ''}`}>{lens}</button>)}</nav>
}

export function Wave2Section({ eyebrow, title, description, badge, children }: { eyebrow: string; title: string; description?: string; badge?: string; children: ReactNode }) {
  return <section className={styles.section}><header className={styles.sectionHeader}><div><div className={styles.sectionEyebrow}>{eyebrow}</div><h2 className={styles.sectionTitle}>{title}</h2>{description ? <p className={styles.sectionDescription}>{description}</p> : null}</div>{badge ? <span className={styles.sectionBadge}>{badge}</span> : null}</header>{children}</section>
}

export function Wave2FactorGrid({ factors, onEvidence }: { factors: Wave2Factor[]; onEvidence: (ids: string[], title: string) => void }) {
  if (!factors.length) return <Wave2Empty title="Aucun facteur disponible" detail="Les sources disponibles ne permettent pas encore d’expliquer cette dimension." />
  return <div className={styles.factorGrid}>{factors.map((factor) => <button key={factor.id} type="button" className={styles.factorCard} onClick={() => onEvidence(factor.evidenceIds, factor.label)}><div className={styles.factorTop}><span className={styles.factorLabel}>{factor.label}</span><ToneDot tone={factor.tone} /></div><span className={styles.factorValue}>{factor.value}</span><span className={styles.factorDetail}>{factor.detail}</span></button>)}</div>
}

export function Wave2RelationshipField({ nodes, onEvidence }: { nodes: Wave2RelationshipNode[]; onEvidence: (ids: string[], title: string) => void }) {
  if (!nodes.length) return <Wave2Empty title="Aucune relation disponible" detail="Cette entité ne possède aucun objet lié dans les sources actuellement disponibles." />
  return <div className={styles.relationshipField}>{nodes.map((node) => node.href ? <Link key={node.id} href={node.href} className={styles.relationshipNode}><span className={styles.relationshipKind}>{node.kind}</span><span className={styles.relationshipLabel}>{node.label}</span><span className={styles.relationshipMeta}>{node.meta}</span><span className={styles.relationshipStatus}>{node.status} <ArrowRight size={11} /></span></Link> : <button key={node.id} type="button" className={styles.relationshipNode} onClick={() => onEvidence(node.evidenceIds || [], node.label)}><span className={styles.relationshipKind}>{node.kind}</span><span className={styles.relationshipLabel}>{node.label}</span><span className={styles.relationshipMeta}>{node.meta}</span><span className={styles.relationshipStatus}>{node.status}</span></button>)}</div>
}

export function Wave2Timeline({ events, onEvidence }: { events: Wave2TimelineEvent[]; onEvidence: (ids: string[], title: string) => void }) {
  if (!events.length) return <Wave2Empty title="Aucun événement" detail="Aucun événement lié n’est disponible dans les sources chargées." />
  return <div className={styles.timeline}>{events.slice(0, 16).map((event, index) => <button key={event.id} type="button" className={styles.timelineItem} onClick={() => onEvidence(event.evidenceIds, event.title)} style={{ appearance: 'none', border: 0, background: 'transparent', width: '100%', textAlign: 'left', paddingLeft: 0, paddingRight: 0, cursor: 'pointer' }}><span className={styles.timelineRail}><span className={styles.timelineDot} style={{ background: toneColor(event.tone) }} />{index < events.length - 1 ? <span className={styles.timelineLine} /> : null}</span><span className={styles.timelineContent}><span className={styles.timelineTitle}>{event.title}</span><span className={styles.timelineDetail}>{event.detail}</span><span className={styles.timelineMeta}>{formatDateTime(event.timestamp)} · {event.actor}</span></span></button>)}</div>
}

export function Wave2Lifecycle({ steps }: { steps: Array<{ label: string; state: 'done' | 'current' | 'blocked' | 'upcoming'; detail: string }> }) {
  return <div className={styles.lifecycle}>{steps.map((step, index) => <div key={`${step.label}-${index}`} className={`${styles.lifecycleStep} ${step.state === 'done' ? styles.lifecycleDone : step.state === 'current' ? styles.lifecycleCurrent : step.state === 'blocked' ? styles.lifecycleBlocked : styles.lifecycleUpcoming}`}><span className={styles.lifecycleIndex}>{String(index + 1).padStart(2, '0')}</span><span className={styles.lifecycleLabel}>{step.label}</span><span className={styles.lifecycleDetail}>{step.detail}</span></div>)}</div>
}

export function Wave2ActionDock({ actions, onDecision }: { actions: Wave2Action[]; onDecision: (decision: Wave2Decision) => void }) {
  return <div className={styles.actionDock} aria-label="Actions contextuelles">{actions.map((action, index) => {
    const className = `${styles.actionButton} ${index === 0 ? styles.actionPrimary : ''} ${action.tone === 'critical' ? styles.actionCritical : ''} ${action.lockedReason ? styles.actionLocked : ''}`
    if (action.lockedReason) return <button key={action.id} type="button" className={className} disabled title={action.lockedReason}><LockKeyhole size={13} />{action.label}</button>
    const actionDecision = action.decision
    if (actionDecision) return <button key={action.id} type="button" className={className} onClick={() => onDecision(actionDecision)}><ShieldCheck size={13} />{action.label}</button>
    return action.href ? <Link key={action.id} href={action.href} className={className}>{action.label}<ArrowRight size={13} /></Link> : <button key={action.id} type="button" className={className}>{action.label}</button>
  })}</div>
}

export function Wave2SimulationView({ simulation }: { simulation: Wave2Simulation }) {
  return <div className={styles.simulationTable}>{simulation.lines.map((line) => <div key={line.id} className={styles.simulationRow}><div className={styles.simulationLabel}>{line.label}<span className={styles.certainty}>{certaintyLabel(line.certainty)}</span></div><div className={styles.simulationCurrent}>{line.current}</div><div className={styles.simulationArrow}>→</div><div className={styles.simulationProposed}>{line.proposed}</div><div className={styles.simulationImpact}>{line.impact}</div></div>)}</div>
}

export function Wave2EvidenceDrawer({ open, title, evidence, selectedId, onSelect, onClose }: { open: boolean; title: string; evidence: Wave2Evidence[]; selectedId?: string | null; onSelect: (id: string) => void; onClose: () => void }) {
  useEscape(open, onClose)
  const selected = evidence.find((item) => item.id === selectedId) || null
  if (!open) return null
  return <OperatorOverlayPortal><div className={styles.overlay} role="presentation" onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => { if (event.currentTarget === event.target) onClose() }}><section role="dialog" aria-modal="true" aria-label={title} className={`${styles.drawer} ${selected ? styles.drawerSecondary : ''}`}><header className={styles.drawerHeader}><div className={styles.drawerTop}><div><div className={styles.drawerBreadcrumb}>Command Room → Intelligence → Preuve</div><h2 className={styles.drawerTitle}>{selected ? selected.title : title}</h2></div><button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer"><X size={17} /></button></div><p className={styles.drawerSubtitle}>{selected ? `${selected.label} · ${selected.source}` : `${evidence.length} preuve(s) reliée(s) à cette investigation.`}</p></header><div className={styles.drawerBody}>{selected ? <EvidenceDetail evidence={selected} onBack={() => onSelect('')} /> : <div className={styles.evidenceList}>{evidence.length ? evidence.map((item) => <button type="button" key={item.id} className={styles.evidenceButton} onClick={() => onSelect(item.id)}><span><span className={styles.evidenceTitle}>{item.label} · {item.title}</span><span className={styles.evidenceDetail}>{item.detail}</span></span><span className={styles.evidenceValue}>{item.value || item.status || 'Ouvrir'}<ChevronRight size={12} /></span></button>) : <Wave2Empty title="Aucune preuve reliée" detail="Ce signal ne possède pas de preuve spécifique dans les données actuellement disponibles." />}</div>}</div><footer className={styles.drawerFooter}><button type="button" className={styles.actionButton} onClick={onClose}>Fermer</button>{selected?.href ? <Link href={selected.href} className={`${styles.actionButton} ${styles.actionPrimary}`}>Ouvrir la source <ExternalLink size={12} /></Link> : null}</footer></section></div></OperatorOverlayPortal>
}

function EvidenceDetail({ evidence, onBack }: { evidence: Wave2Evidence; onBack: () => void }) {
  return <><button type="button" className={styles.actionButton} onClick={onBack}>← Revenir aux preuves</button><div className={styles.drawerPanel}><div className={styles.drawerPanelTitle}>Situation probante</div><div className={styles.decisionText}>{evidence.detail}</div></div><div className={styles.decisionGrid}><div className={styles.decisionBlock}><span className={styles.decisionLabel}>Type</span><span className={styles.decisionText}>{evidence.type}</span></div><div className={styles.decisionBlock}><span className={styles.decisionLabel}>Statut</span><span className={styles.decisionText}>{evidence.status || 'Non applicable'}</span></div><div className={styles.decisionBlock}><span className={styles.decisionLabel}>Valeur</span><span className={styles.decisionText}>{evidence.value || 'Non applicable'}</span></div><div className={styles.decisionBlock}><span className={styles.decisionLabel}>Horodatage</span><span className={styles.decisionText}>{formatDateTime(evidence.timestamp)}</span></div><div className={`${styles.decisionBlock} ${styles.decisionBlockWide}`}><span className={styles.decisionLabel}>Source</span><span className={styles.decisionText}>{evidence.source} · {evidence.verified ? 'vérifiée dans le registre' : 'à vérifier'}</span></div></div></>
}

export function Wave2DecisionChamber({ decision, onClose }: { decision: Wave2Decision | null; onClose: () => void }) {
  useEscape(Boolean(decision), onClose)
  if (!decision) return null
  return <OperatorOverlayPortal><div className={styles.overlay} role="presentation" onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => { if (event.currentTarget === event.target) onClose() }}><section role="dialog" aria-modal="true" aria-label={decision.title} className={styles.drawer}><header className={styles.drawerHeader}><div className={styles.drawerTop}><div><div className={styles.drawerBreadcrumb}>Command Room → Decision Chamber</div><h2 className={styles.drawerTitle}>{decision.title}</h2></div><button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer"><X size={17} /></button></div><p className={styles.drawerSubtitle}>Aucune mutation n’est exécutée depuis cette chambre. Elle expose la situation, les alternatives, l’autorité et les conséquences avant l’espace opérationnel protégé.</p></header><div className={styles.drawerBody}><div className={styles.decisionGrid}><DecisionBlock label="Situation" text={decision.situation} wide /><DecisionBlock label="Recommandation" text={decision.recommendation} wide /><div className={`${styles.decisionBlock} ${styles.decisionBlockWide}`}><span className={styles.decisionLabel}>Alternatives</span>{decision.alternatives.map((alternative) => <span key={alternative} className={styles.decisionText}>• {alternative}</span>)}</div><DecisionBlock label="Impact client" text={decision.customerImpact} /><DecisionBlock label="Impact tenant" text={decision.tenantImpact} /><div className={styles.decisionBlock}><span className={styles.decisionLabel}>Impact financier</span><span className={styles.decisionMoney}>{formatDh(decision.financialImpactDh)}</span></div><DecisionBlock label="Impact contractuel" text={decision.contractImpact} /><DecisionBlock label="Réversibilité" text={decision.reversibility} /><DecisionBlock label="Autorité requise" text={decision.authority} /><DecisionBlock label="Motif obligatoire" text={decision.requiredReason} /><DecisionBlock label="Audit" text={decision.auditResult} /><DecisionBlock label="Follow-up" text={decision.followUp} wide /><div className={`${styles.decisionBlock} ${styles.decisionBlockWide}`}><span className={styles.decisionLabel}>Notifications</span><div className={styles.notificationList}>{decision.notifications.map((notification) => <span key={notification} className={styles.notification}>{notification}</span>)}</div></div></div></div><footer className={styles.drawerFooter}><button type="button" className={styles.actionButton} onClick={onClose}>Revenir</button>{decision.executionHref ? <Link href={decision.executionHref} className={`${styles.actionButton} ${styles.actionPrimary}`}>Ouvrir l’exécution protégée <ArrowRight size={13} /></Link> : null}</footer></section></div></OperatorOverlayPortal>
}

function DecisionBlock({ label, text, wide }: { label: string; text: string; wide?: boolean }) {
  return <div className={`${styles.decisionBlock} ${wide ? styles.decisionBlockWide : ''}`}><span className={styles.decisionLabel}>{label}</span><span className={styles.decisionText}>{text}</span></div>
}

export function Wave2Empty({ title, detail }: { title: string; detail: string }) { return <div className={styles.empty}><div className={styles.emptyTitle}>{title}</div><div className={styles.emptyDetail}>{detail}</div></div> }

export function useWave2Investigation(evidence: Wave2Evidence[]) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTitle, setDrawerTitle] = useState('Preuves')
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null)
  const [activeEvidenceIds, setActiveEvidenceIds] = useState<string[]>([])
  const openEvidence = (ids: string[], title: string) => {
    setDrawerTitle(title)
    setActiveEvidenceIds(ids)
    setSelectedEvidenceId(ids.length === 1 ? ids[0] : null)
    setDrawerOpen(true)
  }
  const filteredEvidence = useMemo(() => activeEvidenceIds.length ? evidence.filter((item) => activeEvidenceIds.includes(item.id)) : evidence, [activeEvidenceIds, evidence])
  return { drawerOpen, drawerTitle, selectedEvidenceId, filteredEvidence, openEvidence, setSelectedEvidenceId, closeEvidence: () => { setDrawerOpen(false); setSelectedEvidenceId(null); setActiveEvidenceIds([]) } }
}

export function ToneDot({ tone }: { tone: Wave2Tone }) { return <span className={styles.toneDot} style={{ background: toneColor(tone) }} aria-hidden="true" /> }

export function toneColor(tone: Wave2Tone) { return tone === 'success' ? '#16a34a' : tone === 'info' ? '#2563eb' : tone === 'warning' ? '#d97706' : tone === 'critical' ? '#dc2626' : tone === 'commercial' ? '#6d28d9' : '#64748b' }
export function formatDh(value: number) { return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} Dh` }
export function formatDateTime(value?: string | null) { if (!value) return 'Non disponible'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date) }
function certaintyLabel(value: string) { return value === 'exact' ? 'Exact' : value === 'derived' ? 'Dérivé' : value === 'estimated' ? 'Estimé' : 'Indisponible' }
function useEscape(open: boolean, onClose: () => void) { useEffect(() => { if (!open) return; const listener = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; document.addEventListener('keydown', listener); return () => document.removeEventListener('keydown', listener) }, [open, onClose]) }
