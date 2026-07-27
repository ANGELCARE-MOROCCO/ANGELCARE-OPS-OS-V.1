"use client"

import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileArchive,
  FileCheck2,
  Gauge,
  GitBranch,
  Layers3,
  RefreshCw,
  Route,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
  UsersRound,
  Workflow,
} from "lucide-react"
import type { CommandIntervention, CommandViewModel, Severity } from "../mz2-view-models"
import { formatDateFr, humanStatus } from "../mz2-view-models"
import styles from "../mz2-executive-dossier.module.css"

function severityClass(value: Severity) {
  return styles[`severity_${value}`] || styles.severity_neutral
}

function StatusPill({ value, label }: { value: Severity; label: string }) {
  return <span className={`${styles.statusPill} ${severityClass(value)}`}><i aria-hidden="true" />{label}</span>
}

export function ExecutiveMandateMasthead({ model, onRefresh }: { model: CommandViewModel; onRefresh: () => void }) {
  return <section className={styles.executiveMasthead} aria-labelledby="cc-mz2-command-title">
    <div className={styles.mastheadMain}>
      <div className={styles.mastheadEyebrow}><span>ANGELCARE CONTENT COMMAND</span><StatusPill value={model.mandate.configured ? "success" : "warning"} label={model.mandate.configured ? humanStatus(model.mandate.state) : "Configuration requise"}/></div>
      <h1 id="cc-mz2-command-title">Commandement 360</h1>
      <p className={styles.mastheadLead}>Le centre exécutif qui expose les exceptions, les décisions, les pressions de cycle et les interventions nécessaires — sans transformer une donnée absente en certitude fictive.</p>
      <div className={styles.mandateObjective}>
        <Target aria-hidden="true" />
        <div><small>MANDAT ACTIF</small><strong>{model.mandate.title}</strong><p>{model.mandate.objective}</p></div>
      </div>
      <div className={styles.mastheadActions}>
        <Link href="/market-os/content-command-center/directory"><Layers3/> Ouvrir les dossiers</Link>
        <Link href="/market-os/content-command-center/missions" className={styles.secondaryAction}><Workflow/> Mission Control</Link>
        <button type="button" onClick={onRefresh}><RefreshCw/> Actualiser</button>
      </div>
    </div>
    <aside className={styles.mandateFacts} aria-label="Contexte du mandat">
      <header><div><Sparkles/><span>POSITION D’AUTORITÉ</span></div><small>Actualisé {formatDateFr(model.refreshedAt, true)}</small></header>
      <dl>
        <div><dt>Période</dt><dd>{model.mandate.period}</dd></div>
        <div><dt>Sponsor</dt><dd>{model.mandate.sponsor}</dd></div>
        <div><dt>Dossiers actifs</dt><dd>{model.health.activeDossiers}</dd></div>
        <div><dt>Décisions en attente</dt><dd>{model.health.pendingDecisions}</dd></div>
      </dl>
      <div className={styles.mandatePriorities}>
        <small>PRIORITÉS DÉCLARÉES</small>
        {model.mandate.priorities.length ? <div>{model.mandate.priorities.slice(0, 6).map((priority) => <span key={priority}>{priority}</span>)}</div> : <p>Aucune priorité de mandat n’est exposée par la source consolidée.</p>}
      </div>
    </aside>
  </section>
}

export function SituationRoom({ model }: { model: CommandViewModel }) {
  const cells = [
    { label: "Blocages actifs", value: model.health.blockedWork, detail: "travaux empêchés de progresser", severity: model.health.blockedWork ? "critical" : "success", icon: ShieldAlert },
    { label: "Échéances dépassées", value: model.health.overdueWork, detail: "éléments encore ouverts", severity: model.health.overdueWork ? "critical" : "success", icon: CalendarClock },
    { label: "Décisions d’autorité", value: model.health.pendingDecisions, detail: "dossiers au prochain gate", severity: model.health.pendingDecisions ? "warning" : "success", icon: UserRoundCheck },
    { label: "Lacunes de preuve", value: model.health.evidenceGaps, detail: "dossiers sans preuve visible", severity: model.health.evidenceGaps ? "warning" : "success", icon: FileCheck2 },
    { label: "Risques de source", value: model.health.sourceRisks, detail: "sources absentes ou non vérifiées", severity: model.health.sourceRisks ? "critical" : "success", icon: FileArchive },
    { label: "Échecs de publication", value: model.health.failedPublications, detail: "packages à récupérer", severity: model.health.failedPublications ? "critical" : "success", icon: AlertOctagon },
  ] as const

  const critical = model.health.blockedWork + model.health.overdueWork + model.health.sourceRisks + model.health.failedPublications
  return <section className={styles.situationRoom} aria-labelledby="cc-mz2-situation-title">
    <header className={styles.sectionHeading}>
      <div><span>SITUATION ROOM</span><h2 id="cc-mz2-situation-title">État opérationnel immédiat</h2><p>Les signaux suivants sont dérivés exclusivement des dossiers, tâches, preuves, sources et packages réellement visibles.</p></div>
      <StatusPill value={critical ? "critical" : model.health.pendingDecisions ? "warning" : "success"} label={critical ? `${critical} exception(s) critique(s)` : model.health.pendingDecisions ? "Décisions requises" : "Aucune exception critique visible"}/>
    </header>
    <div className={styles.situationGrid}>
      {cells.map((cell) => {
        const Icon = cell.icon
        return <article key={cell.label} className={`${styles.situationCell} ${severityClass(cell.severity)}`}>
          <span className={styles.situationIcon}><Icon aria-hidden="true" /></span>
          <div><small>{cell.label}</small><strong>{cell.value}</strong><p>{cell.detail}</p></div>
        </article>
      })}
    </div>
  </section>
}

function InterventionCard({ item, compact = false }: { item: CommandIntervention; compact?: boolean }) {
  return <article className={`${styles.interventionCard} ${severityClass(item.severity)} ${compact ? styles.isCompact : ""}`}>
    <div className={styles.interventionSignal}><i aria-hidden="true"/><span>{item.category}</span></div>
    <div className={styles.interventionBody}>
      <h3>{item.title}</h3>
      <p>{item.detail}</p>
      {!compact ? <div className={styles.consequence}><CircleAlert/><span><small>CONSÉQUENCE D’INACTION</small>{item.consequence}</span></div> : null}
    </div>
    <dl>
      <div><dt>Responsable</dt><dd>{item.owner}</dd></div>
      <div><dt>Pression temporelle</dt><dd>{item.waitingLabel}</dd></div>
    </dl>
    <Link href={item.href}>Ouvrir le contexte <ArrowRight/></Link>
  </article>
}

export function ExecutiveInterventionQueue({ model }: { model: CommandViewModel }) {
  return <section className={styles.interventionSection} aria-labelledby="cc-mz2-interventions-title">
    <header className={styles.sectionHeading}>
      <div><span>EXECUTIVE INTERVENTION QUEUE</span><h2 id="cc-mz2-interventions-title">Ce qui exige une intervention maintenant</h2><p>La file ne contient que des exceptions observables : blocages, retards, responsabilité absente ou échec de diffusion.</p></div>
      <Link href="/market-os/content-command-center/tasks">Voir toutes les tâches <ArrowRight/></Link>
    </header>
    {model.interventions.length ? <div className={styles.interventionGrid}>{model.interventions.slice(0, 6).map((item) => <InterventionCard key={item.id} item={item}/>)}</div> : <div className={styles.positiveEmpty}><CheckCircle2/><div><strong>Aucune intervention critique visible</strong><p>La consolidation actuelle ne remonte aucun blocage, retard, échec de publication ou dossier sans propriétaire.</p></div></div>}
  </section>
}

export function LifecyclePressureMap({ model }: { model: CommandViewModel }) {
  const max = Math.max(1, ...model.lifecycle.map((stage) => stage.active))
  return <section className={styles.lifecycleCommand} aria-labelledby="cc-mz2-lifecycle-title">
    <header className={styles.sectionHeading}>
      <div><span>VALUE CHAIN CONTROL</span><h2 id="cc-mz2-lifecycle-title">Pression sur la chaîne de contenu</h2><p>Chaque gate expose le volume visible, les attentes et les blocages. Ce n’est pas un score de capacité humaine.</p></div>
      <Route aria-hidden="true"/>
    </header>
    <div className={styles.lifecycleTrack}>
      {model.lifecycle.map((stage, index) => <Link key={stage.key} href={stage.href} className={styles.lifecycleNode} style={{ "--stage-pressure": `${Math.max(8, Math.round((stage.active / max) * 100))}%` } as CSSProperties}>
        <span className={styles.lifecycleIndex}>{String(index + 1).padStart(2, "0")}</span>
        <div><strong>{stage.label}</strong><small>{stage.active} actif(s) · {stage.waiting} en attente</small></div>
        <span className={styles.lifecycleVolume}>{stage.active}</span>
        <i className={styles.lifecycleBar} aria-hidden="true"><b/></i>
        <span className={styles.lifecycleMeta}>{stage.blocked ? `${stage.blocked} bloqué(s)` : stage.oldestLabel}</span>
        <ChevronRight aria-hidden="true" />
      </Link>)}
    </div>
  </section>
}

export function ProductionRunway({ model }: { model: CommandViewModel }) {
  return <section className={styles.runwaySection} aria-labelledby="cc-mz2-runway-title">
    <header className={styles.sectionHeading}>
      <div><span>LIVE PRODUCTION RUNWAY</span><h2 id="cc-mz2-runway-title">Travail actif classé par risque et échéance</h2><p>La priorité est calculée à partir des blocages, retards et états réellement visibles — jamais à partir d’un pourcentage inventé.</p></div>
      <Link href="/market-os/content-command-center/directory">Ouvrir Content Atlas <ArrowRight/></Link>
    </header>
    {model.runway.length ? <div className={styles.runwayBoard} role="list">
      {model.runway.map((item) => <Link href={item.href} key={item.id} className={`${styles.runwayRow} ${severityClass(item.risk)}`} role="listitem">
        <div className={styles.runwayIdentity}><span>{item.code}</span><strong>{item.title}</strong><small>{item.stage}</small></div>
        <div className={styles.runwayOwnership}><small>RESPONSABLE</small><strong>{item.owner}</strong><span>{item.reviewer}</span></div>
        <div className={styles.runwayProgress}>
          <small>PROGRESSION / READINESS</small>
          <div><span>{item.progress === null ? "—" : `${item.progress}%`}</span><i aria-hidden="true"><b style={{ width: `${item.progress ?? 0}%` }}/></i></div>
          <div><span>{item.readiness === null ? "—" : `${item.readiness}%`}</span><i aria-hidden="true"><b style={{ width: `${item.readiness ?? 0}%` }}/></i></div>
        </div>
        <div className={styles.runwayGate}><small>PROCHAIN GATE</small><strong>{item.nextGate}</strong>{item.blocker ? <span><AlertOctagon/> {item.blocker}</span> : <span><Clock3/> {item.deadline ? formatDateFr(item.deadline) : "Sans échéance"}</span>}</div>
        <ArrowRight aria-hidden="true"/>
      </Link>)}
    </div> : <div className={styles.operationalEmpty}><Workflow/><div><strong>Aucun dossier actif visible</strong><p>La source consolidée ne contient actuellement aucun dossier ouvert à présenter sur la runway.</p></div><Link href="/market-os/content-command-center/studio">Créer un dossier <ArrowRight/></Link></div>}
  </section>
}

export function DecisionIntegrityPanels({ model }: { model: CommandViewModel }) {
  return <section className={styles.dualCommandGrid}>
    <article className={styles.decisionPanel} aria-labelledby="cc-mz2-decisions-title">
      <header><div><UserRoundCheck/><span><small>DECISION COMMAND</small><h2 id="cc-mz2-decisions-title">Autorité requise</h2></span></div><Link href="/market-os/content-command-center/validation">Validation <ArrowRight/></Link></header>
      {model.decisions.length ? <div>{model.decisions.slice(0, 6).map((item) => <InterventionCard key={item.id} item={item} compact/>)}</div> : <div className={styles.inlineEmpty}><CheckCircle2/><span><strong>Aucune décision en attente</strong><small>Aucun dossier consolidé n’est actuellement positionné sur un gate d’autorité.</small></span></div>}
    </article>
    <article className={styles.integrityPanel} aria-labelledby="cc-mz2-integrity-title">
      <header><div><ShieldCheck/><span><small>SOURCE & EVIDENCE INTEGRITY</small><h2 id="cc-mz2-integrity-title">Preuve institutionnelle</h2></span></div><Link href="/market-os/content-command-center/source-vault">Source Vault <ArrowRight/></Link></header>
      {model.integrity.length ? <div>{model.integrity.slice(0, 6).map((item) => <InterventionCard key={item.id} item={item} compact/>)}</div> : <div className={styles.inlineEmpty}><ShieldCheck/><span><strong>Aucun risque d’intégrité visible</strong><small>Aucune source courante non vérifiée ou source requise n’est remontée.</small></span></div>}
    </article>
  </section>
}

export function StrategicWaveTimeline({ model }: { model: CommandViewModel }) {
  return <section className={`${styles.waveSection} ${styles.executiveOnly}`} aria-labelledby="cc-mz2-wave-title">
    <header className={styles.sectionHeading}><div><span>STRATEGIC WAVE</span><h2 id="cc-mz2-wave-title">Période stratégique et jalons</h2><p>Le cockpit n’invente pas un cycle de 90 jours lorsque la source n’en fournit aucun.</p></div><CalendarClock/></header>
    {model.waveConfigured ? <div className={styles.waveConfigured}><Activity/><div><strong>Une période stratégique est disponible dans la source.</strong><p>La visualisation détaillée sera alimentée par les objets de vague réellement retournés par le backend complet.</p></div></div> : <div className={styles.waveEmpty}>
      <div className={styles.waveEmptyMark}><GitBranch/></div>
      <div><span>MANDAT TEMPOREL NON EXPOSÉ</span><h3>Aucune vague stratégique ne peut être affichée honnêtement.</h3><p>Les dossiers et tâches restent opérationnels, mais aucun objet de période ne fournit actuellement les jalons, objectifs planifiés et écarts réels.</p></div>
      <Link href="/market-os/content-command-center/strategies">Ouvrir la Fabrique stratégique <ArrowRight/></Link>
    </div>}
  </section>
}

export function CapacityAndActivity({ model }: { model: CommandViewModel }) {
  const max = Math.max(1, ...model.capacity.map((item) => item.active))
  return <section className={styles.capacityActivityGrid}>
    <article className={styles.capacityPanel} aria-labelledby="cc-mz2-capacity-title">
      <header><div><UsersRound/><span><small>OBSERVED WORKLOAD</small><h2 id="cc-mz2-capacity-title">Concentration du travail visible</h2></span></div><BadgeNote>Comptages observés — pas un taux RH</BadgeNote></header>
      {model.capacity.length ? <div className={styles.capacityRows}>{model.capacity.map((item) => <div key={item.owner}>
        <span className={styles.capacityOwner}><strong>{item.owner}</strong><small>{item.active} actif(s)</small></span>
        <i aria-hidden="true"><b style={{ width: `${Math.max(8, Math.round((item.active / max) * 100))}%` }}/></i>
        <span className={styles.capacityRisk}>{item.blocked ? `${item.blocked} bloqué(s)` : item.overdue ? `${item.overdue} en retard` : "Sans exception visible"}</span>
      </div>)}</div> : <div className={styles.inlineEmpty}><UsersRound/><span><strong>Aucune charge active observable</strong><small>La source ne remonte aucune tâche ouverte avec un propriétaire.</small></span></div>}
    </article>
    <article className={styles.activityPanel} aria-labelledby="cc-mz2-activity-title">
      <header><div><Activity/><span><small>EXECUTIVE ACTIVITY</small><h2 id="cc-mz2-activity-title">Événements à valeur décisionnelle</h2></span></div><span className={styles.auditHint}>Mode Audit disponible dans le shell</span></header>
      {model.activity.length ? <div className={styles.activityTimeline}>{model.activity.map((item) => <Link href={item.href} key={item.id}>
        <i aria-hidden="true"/><span><strong>{item.label}</strong><p>{item.detail}</p><small>{item.actor} · {formatDateFr(item.timestamp, true)}</small></span><ArrowRight/>
      </Link>)}</div> : <div className={styles.inlineEmpty}><Activity/><span><strong>Aucune activité décisionnelle visible</strong><small>Les preuves, reviews et événements d’audit n’exposent aucun enregistrement horodaté.</small></span></div>}
    </article>
  </section>
}

function BadgeNote({ children }: { children: ReactNode }) {
  return <span className={styles.badgeNote}><Gauge/>{children}</span>
}

export function ExecutiveCommandDock() {
  const actions = [
    { href: "/market-os/content-command-center/studio", label: "Créer une initiative", detail: "Dossier gouverné", icon: Sparkles },
    { href: "/market-os/content-command-center/signals", label: "Capturer un signal", detail: "Intelligence marché", icon: Activity },
    { href: "/market-os/content-command-center/missions", label: "Libérer une mission", detail: "Exécution ordonnée", icon: Workflow },
    { href: "/market-os/content-command-center/evidence", label: "Ouvrir les preuves", detail: "Inspection et corrections", icon: FileCheck2 },
    { href: "/market-os/content-command-center/validation", label: "Décider", detail: "Autorité humaine", icon: ShieldCheck },
    { href: "/market-os/content-command-center/source-vault", label: "Sécuriser les sources", detail: "Mémoire canonique", icon: FileArchive },
  ]
  return <nav className={styles.commandDock} aria-label="Actions exécutives Content Command">
    <header><span>COMMAND DOCK</span><strong>Passer de la lecture à l’action autorisée</strong></header>
    <div>{actions.map((action) => { const Icon = action.icon; return <Link key={action.href} href={action.href}><Icon/><span><strong>{action.label}</strong><small>{action.detail}</small></span><ArrowRight/></Link> })}</div>
  </nav>
}
