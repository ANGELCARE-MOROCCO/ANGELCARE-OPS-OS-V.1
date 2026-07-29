"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Command,
  FileCheck2,
  FileWarning,
  Gauge,
  History,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Network,
  Orbit,
  PanelRightOpen,
  Play,
  RefreshCcw,
  RotateCcw,
  Route,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
  UsersRound,
  Workflow,
  X,
} from "lucide-react"
import { useHeadquartersSnapshot, headquartersAction } from "../headquarters/client"
import { buildCommandViewModel, formatDateFr, humanStatus, type Severity } from "../headquarters/mz2-view-models"
import {
  buildWorkLanes,
  dominantWorkItem,
  perspectiveDescription,
  type Bulk1CommandTab,
  type Bulk1Perspective,
  type Bulk1WorkItem,
  type Bulk1WorkLanes,
  type WorkLaneKey,
} from "./bulk1-derivations"
import { readBulk1Context, type Bulk1ContextSnapshot } from "./bulk1-context"
import styles from "./bulk1-experience.module.css"

const PERSPECTIVES: Array<{ key: Bulk1Perspective; label: string; icon: typeof Target }> = [
  { key: "executive", label: "Direction", icon: ShieldCheck },
  { key: "production", label: "Production", icon: Workflow },
  { key: "focus", label: "Focus", icon: Target },
  { key: "audit", label: "Audit", icon: History },
]

const LANE_META: Record<WorkLaneKey, { label: string; eyebrow: string; description: string; icon: typeof Target }> = {
  now: { label: "Maintenant", eyebrow: "PRIORITÉ ACTIVE", description: "La responsabilité la plus pressante selon les blocages, retours, décisions et échéances observables.", icon: Play },
  today: { label: "Aujourd’hui", eyebrow: "À TERMINER", description: "Travail critique ou dû aujourd’hui, ordonné sans score de productivité inventé.", icon: CalendarClock },
  returned: { label: "Retourné", eyebrow: "CORRECTIONS", description: "Travail revenu pour correction, révision ou preuve supplémentaire.", icon: RotateCcw },
  waiting: { label: "En attente", eyebrow: "DÉPENDANCES", description: "Éléments qui attendent une autorité, une source, une preuve ou un autre propriétaire.", icon: Clock3 },
  blocked: { label: "Bloqué", eyebrow: "INTERVENTION", description: "Travail empêché de progresser et nécessitant résolution ou escalade.", icon: ShieldAlert },
  upcoming: { label: "À venir", eyebrow: "PROCHAINS MOUVEMENTS", description: "Travail prêt prochainement, conservé hors du focus immédiat.", icon: Orbit },
}

function toneClass(severity: Severity): string {
  return styles[`tone_${severity}`] || styles.tone_neutral
}

function CommandStatus({ severity, children }: { severity: Severity; children: React.ReactNode }) {
  return <span className={`${styles.commandStatus} ${toneClass(severity)}`}><i aria-hidden="true" />{children}</span>
}

function WorkspaceTabs({ active, onChange }: { active: Bulk1CommandTab; onChange: (next: Bulk1CommandTab) => void }) {
  return <div className={styles.workspaceTabs} role="tablist" aria-label="Espaces de commandement">
    <button type="button" role="tab" aria-selected={active === "command"} onClick={() => onChange("command")}><Command/><span><strong>Commandement 360</strong><small>Situation, flux et autorité</small></span></button>
    <button type="button" role="tab" aria-selected={active === "my-work"} onClick={() => onChange("my-work")}><BriefcaseBusiness/><span><strong>Mon travail</strong><small>Priorités et Focus Station</small></span></button>
  </div>
}

function PerspectiveControl({ value, onChange }: { value: Bulk1Perspective; onChange: (value: Bulk1Perspective) => void }) {
  return <div className={styles.perspectiveControl} aria-label="Perspective opérationnelle">
    <div><span>PERSPECTIVE</span><strong>{PERSPECTIVES.find((item) => item.key === value)?.label}</strong></div>
    <div role="group" aria-label="Choisir la perspective">
      {PERSPECTIVES.map((item) => { const Icon = item.icon; return <button key={item.key} type="button" aria-pressed={value === item.key} onClick={() => onChange(item.key)}><Icon/><span>{item.label}</span></button> })}
    </div>
    <p>{perspectiveDescription(value)}</p>
  </div>
}

function WorkIdentity({ item }: { item: Bulk1WorkItem }) {
  return <div className={styles.workIdentity}>
    <span>{item.dossierCode}</span>
    <strong>{item.dossierTitle}</strong>
    <small>{item.stage}</small>
  </div>
}

function ImmediateActionCard({ item, rank, onFocus }: { item: Bulk1WorkItem; rank: number; onFocus: (item: Bulk1WorkItem) => void }) {
  return <article className={`${styles.immediateCard} ${toneClass(item.severity)}`}>
    <header><span>{String(rank).padStart(2, "0")}</span><CommandStatus severity={item.severity}>{item.stage}</CommandStatus></header>
    <WorkIdentity item={item}/>
    <h3>{item.title}</h3>
    <p>{item.reason}</p>
    <div className={styles.consequenceLine}><AlertTriangle/><span><small>CONSÉQUENCE</small>{item.consequence}</span></div>
    <dl><div><dt>Responsable</dt><dd>{item.owner}</dd></div><div><dt>Pression</dt><dd>{item.deadline}</dd></div></dl>
    <div className={styles.cardActions}><button type="button" onClick={() => onFocus(item)}><PanelRightOpen/> Travailler ici</button><Link href={item.href}>Ouvrir le dossier <ArrowRight/></Link></div>
  </article>
}

function ImmediateCommand({ lanes, onFocus }: { lanes: Bulk1WorkLanes; onFocus: (item: Bulk1WorkItem) => void }) {
  const priority = [
    ...lanes.now,
    ...lanes.blocked,
    ...lanes.returned,
    ...lanes.today,
    ...lanes.waiting,
  ].filter((item, index, source) => source.findIndex((candidate) => candidate.id === item.id) === index).slice(0, 3)

  return <section className={styles.immediateCommand} aria-labelledby="bulk1-immediate-title">
    <header className={styles.sectionHeader}>
      <div><span>HORIZON A · IMMÉDIAT</span><h2 id="bulk1-immediate-title">À faire maintenant</h2><p>Une sélection limitée d’actions réelles, expliquées par leur risque, leur retour, leur échéance ou leur autorité.</p></div>
      <CommandStatus severity={priority.some((item) => item.severity === "critical") ? "critical" : priority.length ? "warning" : "success"}>{priority.length ? `${priority.length} mouvement(s) prioritaire(s)` : "Aucune pression critique visible"}</CommandStatus>
    </header>
    {priority.length ? <div className={styles.immediateGrid}>{priority.map((item, index) => <ImmediateActionCard key={item.id} item={item} rank={index + 1} onFocus={onFocus}/>)}</div> : <div className={styles.commandEmpty}><CheckCircle2/><div><strong>Aucune action urgente visible</strong><p>Le snapshot consolidé ne remonte actuellement aucun blocage, retour, décision ou échéance critique.</p></div></div>}
  </section>
}

function LifecycleFlow({ model }: { model: ReturnType<typeof buildCommandViewModel> }) {
  const [selected, setSelected] = React.useState(model.lifecycle[0]?.key || "")
  React.useEffect(() => { if (!model.lifecycle.some((stage) => stage.key === selected)) setSelected(model.lifecycle[0]?.key || "") }, [model.lifecycle, selected])
  const selectedStage = model.lifecycle.find((stage) => stage.key === selected) || model.lifecycle[0]
  const dossierMatches = model.runway.filter((item) => item.stage.toLowerCase().includes(selectedStage?.label.toLowerCase() || ""))

  return <section className={styles.flowCommand} aria-labelledby="bulk1-flow-title">
    <header className={styles.sectionHeader}>
      <div><span>HORIZON B · FLUX OPÉRATIONNEL</span><h2 id="bulk1-flow-title">La chaîne de contenu comme système vivant</h2><p>Sélectionnez un gate pour voir les dossiers actifs derrière la pression. La visualisation ne remplace jamais le record opérationnel.</p></div>
      <Route/>
    </header>
    <div className={styles.flowBody}>
      <div className={styles.flowTrack} role="list" aria-label="Étapes du cycle de contenu">
        {model.lifecycle.map((stage, index) => <button type="button" role="listitem" key={stage.key} aria-pressed={stage.key === selected} onClick={() => setSelected(stage.key)}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div><strong>{stage.label}</strong><small>{stage.active} actif(s) · {stage.waiting} attente(s)</small></div>
          <b>{stage.active}</b>
          <i aria-hidden="true" />
          {stage.blocked ? <em>{stage.blocked} bloqué(s)</em> : <em>{stage.oldestLabel}</em>}
        </button>)}
      </div>
      <aside className={styles.flowInspector}>
        <header><Network/><span><small>GATE SÉLECTIONNÉ</small><strong>{selectedStage?.label || "Cycle"}</strong></span></header>
        <div className={styles.flowNumbers}><div><span>Actifs</span><strong>{selectedStage?.active || 0}</strong></div><div><span>En attente</span><strong>{selectedStage?.waiting || 0}</strong></div><div><span>Bloqués</span><strong>{selectedStage?.blocked || 0}</strong></div></div>
        {dossierMatches.length ? <div className={styles.flowDossiers}>{dossierMatches.slice(0, 5).map((item) => <Link href={item.href} key={item.id}><span>{item.code}</span><strong>{item.title}</strong><small>{item.nextGate}</small><ChevronRight/></Link>)}</div> : <div className={styles.flowNoMatch}><CircleDot/><p>Aucun dossier de la runway limitée ne correspond à ce gate. Ouvrez le registre spécialisé pour le portefeuille complet.</p></div>}
        <Link className={styles.inspectorLink} href={selectedStage?.href || "/market-os/content-command-center/directory"}>Ouvrir le workspace de portefeuille <ArrowRight/></Link>
      </aside>
    </div>
  </section>
}

function AuthorityRisk({ model, onFocus }: { model: ReturnType<typeof buildCommandViewModel>; onFocus: (item: Bulk1WorkItem) => void }) {
  const decisions = model.decisions.slice(0, 4).map((item) => ({ ...item, kind: "decision" as const }))
  const integrity = model.integrity.slice(0, 4).map((item) => ({ ...item, kind: "integrity" as const }))
  const entries = [...decisions, ...integrity]
  return <section className={styles.authorityCommand} aria-labelledby="bulk1-authority-title">
    <header className={styles.sectionHeader}>
      <div><span>HORIZON C · AUTORITÉ & RISQUE</span><h2 id="bulk1-authority-title">Ce qui ne doit pas rester sans décision</h2><p>Décisions humaines, source canonique, intégrité et conditions bloquantes sont séparées des tâches ordinaires.</p></div>
      <LockKeyhole/>
    </header>
    {entries.length ? <div className={styles.authorityGrid}>{entries.map((entry) => <article key={entry.id} className={toneClass(entry.severity)}>
      <div className={styles.authorityMarker}>{entry.kind === "decision" ? <UserRoundCheck/> : <FileWarning/>}</div>
      <div><small>{entry.category}</small><strong>{entry.title}</strong><p>{entry.detail}</p><span>{entry.owner} · {entry.waitingLabel}</span></div>
      <button type="button" onClick={() => onFocus({ ...entry, dossierCode: "AUTORITÉ", dossierTitle: entry.category, stage: entry.category, reason: entry.detail, consequence: entry.consequence, deadline: entry.waitingLabel, primaryLabel: entry.kind === "decision" ? "Rendre la décision" : "Résoudre le gate", primaryKind: "open", source: entry.kind === "decision" ? "decision" : "integrity" })}>Inspecter <ChevronRight/></button>
    </article>)}</div> : <div className={styles.commandEmpty}><ShieldCheck/><div><strong>Aucune autorité en attente visible</strong><p>Aucun dossier de la consolidation actuelle ne requiert de décision ou de correction d’intégrité.</p></div></div>}
  </section>
}

function ResumeContinuity({ context, onClear }: { context: Bulk1ContextSnapshot | null; onClear: () => void }) {
  return <section className={styles.resumeContinuity}>
    <div className={styles.resumeOrb}><Orbit/></div>
    <div className={styles.resumeCopy}><span>REPRENDRE MON TRAVAIL</span>{context ? <><strong>{context.dossierCode} · {context.dossierTitle}</strong><p>Dernier contexte : {humanStatus(context.stage)} · enregistré {formatDateFr(context.updatedAt, true)}.</p></> : <><strong>Aucun contexte de dossier mémorisé</strong><p>Ouvrez un dossier pour activer la continuité de session sécurisée dans ce navigateur.</p></>}</div>
    {context ? <div className={styles.resumeActions}><Link href={context.href}><Play/> Reprendre exactement ici</Link><button type="button" aria-label="Effacer le contexte mémorisé" onClick={onClear}><X/></button></div> : <Link href="/market-os/content-command-center/directory">Choisir un dossier <ArrowRight/></Link>}
  </section>
}

function WorkLane({ laneKey, items, selected, onSelect }: { laneKey: WorkLaneKey; items: Bulk1WorkItem[]; selected: Bulk1WorkItem | null; onSelect: (item: Bulk1WorkItem) => void }) {
  const meta = LANE_META[laneKey]
  const Icon = meta.icon
  return <section className={`${styles.workLane} ${styles[`lane_${laneKey}`]}`}>
    <header><span><Icon/><small>{meta.eyebrow}</small></span><strong>{meta.label}</strong><b>{items.length}</b><p>{meta.description}</p></header>
    <div>{items.length ? items.map((item) => <button type="button" key={item.id} aria-pressed={selected?.id === item.id} onClick={() => onSelect(item)} className={toneClass(item.severity)}>
      <span className={styles.laneDot}/><div><small>{item.dossierCode} · {item.stage}</small><strong>{item.title}</strong><p>{item.dossierTitle}</p><em>{item.deadline}</em></div><ChevronRight/>
    </button>) : <div className={styles.laneEmpty}><CheckCircle2/><span>Aucun élément visible</span></div>}</div>
  </section>
}

function MyWorkDesk({ lanes, selected, onSelect }: { lanes: Bulk1WorkLanes; selected: Bulk1WorkItem | null; onSelect: (item: Bulk1WorkItem) => void }) {
  const ordered: WorkLaneKey[] = ["now", "today", "returned", "blocked", "waiting", "upcoming"]
  return <section className={styles.myWorkDesk} aria-labelledby="bulk1-my-work-title">
    <header className={styles.myWorkIntro}>
      <div><span>PERSONAL COMMAND DECK</span><h2 id="bulk1-my-work-title">Mon travail, expliqué et exécutable</h2><p>La journée est organisée par responsabilité réelle, dépendance et prochain mouvement — pas par une longue liste de modules.</p></div>
      <div className={styles.myWorkCounts}><div><strong>{lanes.today.length}</strong><span>aujourd’hui</span></div><div><strong>{lanes.returned.length}</strong><span>retourné(s)</span></div><div><strong>{lanes.blocked.length}</strong><span>bloqué(s)</span></div></div>
    </header>
    <div className={styles.workLaneGrid}>{ordered.map((laneKey) => <WorkLane key={laneKey} laneKey={laneKey} items={lanes[laneKey]} selected={selected} onSelect={onSelect}/>)}</div>
  </section>
}

function FocusStation({ item, busy, notice, onResumeTask, onClose }: { item: Bulk1WorkItem | null; busy: boolean; notice: string; onResumeTask: (item: Bulk1WorkItem) => void; onClose: () => void }) {
  return <aside className={`${styles.focusStation} ${item ? styles.focusStationOpen : ""}`} aria-hidden={!item} aria-label="Focus Station">
    {item ? <>
      <header><span><Target/><small>FOCUS STATION</small></span><button type="button" aria-label="Fermer Focus Station" onClick={onClose}><X/></button></header>
      <div className={styles.focusIdentity}><WorkIdentity item={item}/><CommandStatus severity={item.severity}>{item.stage}</CommandStatus></div>
      <section className={styles.focusObjective}><small>ACTION ATTENDUE</small><h2>{item.title}</h2><p>{item.reason}</p></section>
      <section className={styles.focusConsequence}><AlertTriangle/><div><small>POURQUOI MAINTENANT</small><p>{item.consequence}</p></div></section>
      <dl className={styles.focusFacts}><div><dt>Responsable</dt><dd>{item.owner}</dd></div><div><dt>Pression</dt><dd>{item.deadline}</dd></div><div><dt>Origine</dt><dd>{item.source}</dd></div></dl>
      <section className={styles.focusChecklist}><span>CONDITIONS DE PROGRESSION</span><div><CheckCircle2/><p>Le dossier et le stage restent visibles pendant l’action.</p></div><div><CheckCircle2/><p>Le résultat doit être persisté avant la mise à jour des files.</p></div><div><ShieldCheck/><p>L’autorité et les données absentes ne sont jamais inventées.</p></div></section>
      {notice ? <div className={styles.focusNotice} aria-live="polite">{notice}</div> : null}
      <footer>{item.primaryKind === "resume-task" && item.taskId ? <button type="button" disabled={busy} onClick={() => onResumeTask(item)}>{busy ? <LoaderCircle className={styles.spin}/> : <Play/>}{item.primaryLabel}</button> : <Link href={item.href}><Play/>{item.primaryLabel}</Link>}<Link className={styles.focusSecondary} href={item.taskId ? `/market-os/content-command-center/tasks/execution?task=${encodeURIComponent(item.taskId)}&returnTo=${encodeURIComponent("/market-os/content-command-center?workspace=my-work")}` : item.href}>Ouvrir le poste contextualisé <ArrowRight/></Link></footer>
    </> : null}
  </aside>
}

export default function Bulk1CommandementWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const model = React.useMemo(() => buildCommandViewModel(snapshot), [snapshot])
  const lanes = React.useMemo(() => buildWorkLanes(model), [model])
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("workspace") === "my-work" ? "my-work" : "command"
  const [activeTab, setActiveTab] = React.useState<Bulk1CommandTab>(initialTab)
  const [perspective, setPerspective] = React.useState<Bulk1Perspective>("production")
  const [selected, setSelected] = React.useState<Bulk1WorkItem | null>(() => dominantWorkItem(lanes))
  const [context, setContext] = React.useState<Bulk1ContextSnapshot | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [notice, setNotice] = React.useState("")

  React.useEffect(() => setContext(readBulk1Context()), [])
  React.useEffect(() => { if (!selected) setSelected(dominantWorkItem(lanes)) }, [lanes, selected])

  function changeTab(next: Bulk1CommandTab) {
    setActiveTab(next)
    const params = new URLSearchParams(searchParams.toString())
    if (next === "my-work") params.set("workspace", "my-work")
    else params.delete("workspace")
    router.replace(params.toString() ? `${pathname}?${params}` : pathname, { scroll: false })
  }

  async function resumeTask(item: Bulk1WorkItem) {
    if (!item.taskId) return
    setBusy(true)
    setNotice("")
    try {
      await headquartersAction("update_task", { taskId: item.taskId, status: "in_progress", progress: 25 })
      setNotice("La tâche est reprise. Les files Commandement et Mon travail ont été actualisées depuis le snapshot autoritaire.")
      await refresh()
    } catch (nextError) {
      setNotice(nextError instanceof Error ? nextError.message : "TASK_RESUME_FAILED")
    } finally {
      setBusy(false)
    }
  }

  if (loading && !snapshot) return <main className={styles.bulk1Canvas}><div className={styles.bulk1Loading}><LoaderCircle className={styles.spin}/><span><strong>Construction de votre situation de travail…</strong><small>Dossiers, gates, décisions, blocages et échéances sont consolidés.</small></span></div></main>

  return <main className={`${styles.bulk1Canvas} ${styles[`perspective_${perspective}`]}`} data-content-experience-bulk1 data-command-tab={activeTab}>
    <div className={styles.commandLiveRegion} aria-live="polite">{notice}</div>
    {error ? <div className={styles.commandError}><AlertTriangle/><span><strong>Snapshot Headquarters indisponible</strong><small>{error}. Les données ne sont pas remplacées par des exemples.</small></span><button type="button" onClick={() => void refresh()}><RefreshCcw/> Réessayer</button></div> : null}

    <section className={styles.commandCrown}>
      <div className={styles.commandBrand}><span className={styles.brandSignal}><Sparkles/></span><div><small>ANGELCARE · SANILA MARKET OS</small><strong>Content Command Headquarters</strong></div></div>
      <div className={styles.commandTitle}><span>SOVEREIGN ORIENTATION / BULK 1</span><h1>{activeTab === "command" ? "Comprendre. Décider. Faire avancer." : "Votre journée, sans vous perdre dans les modules."}</h1><p>{activeTab === "command" ? "Commandement 360 concentre les actions, la pression du cycle et l’autorité. Chaque signal ouvre un dossier réel et une prochaine action explicable." : "Mon travail transforme les responsabilités, retours, blocages et dépendances en une séquence personnelle directement exploitable."}</p></div>
      <div className={styles.commandCrownActions}><button type="button" onClick={() => void refresh()}><RefreshCcw/> Actualiser</button><Link href="/market-os/content-command-center/directory"><Layers3/> Tous les dossiers</Link></div>
    </section>

    <section className={styles.commandNavigationBar}>
      <WorkspaceTabs active={activeTab} onChange={changeTab}/>
      <PerspectiveControl value={perspective} onChange={setPerspective}/>
    </section>

    <ResumeContinuity context={context} onClear={() => { if (typeof window !== "undefined") window.sessionStorage.removeItem("angelcare.content-command.bulk1.context.v1"); setContext(null) }}/>

    {activeTab === "command" ? <>
      <ImmediateCommand lanes={lanes} onFocus={setSelected}/>
      <LifecycleFlow model={model}/>
      <AuthorityRisk model={model} onFocus={setSelected}/>
      <section className={styles.commandTelemetry}>
        <article><Gauge/><div><small>DOSSIERS ACTIFS</small><strong>{model.health.activeDossiers}</strong><p>Hors clôture, archive et annulation.</p></div></article>
        <article><FileCheck2/><div><small>LACUNES DE PREUVE</small><strong>{model.health.evidenceGaps}</strong><p>Cas observables sans preuve liée.</p></div></article>
        <article><UsersRound/><div><small>RESPONSABILITÉ OBSERVÉE</small><strong>{model.capacity.length}</strong><p>Propriétaires visibles dans les travaux actifs.</p></div></article>
        <article><Activity/><div><small>DERNIÈRE CONSOLIDATION</small><strong>{formatDateFr(model.refreshedAt, true)}</strong><p>Aucune activité fictive ajoutée.</p></div></article>
      </section>
    </> : <MyWorkDesk lanes={lanes} selected={selected} onSelect={setSelected}/>} 

    <FocusStation item={selected} busy={busy} notice={notice} onResumeTask={(item) => void resumeTask(item)} onClose={() => setSelected(null)}/>
  </main>
}
