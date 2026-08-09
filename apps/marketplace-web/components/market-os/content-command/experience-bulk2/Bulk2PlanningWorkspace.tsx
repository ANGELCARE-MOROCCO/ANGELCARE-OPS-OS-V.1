"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight,
  CircleDot, Clock3, GitBranch, Layers3, MoveRight, Search, ShieldAlert, TimerReset,
  TriangleAlert, UserRound, Waypoints,
} from "lucide-react"
import { statusLabel, type ContentItem, useContentStore } from "../content-command-system"
import type { ReadinessCheck, StrategicContext } from "./bulk2-types"
import { planningCollisions } from "./bulk2-derivations"
import { readStrategicContext, strategicHref } from "./bulk2-context"
import { Drawer, EmptyStrategicState, Notice, ReadinessGate, StrategicContextSidecar, StrategicIdentityStrip } from "./Bulk2Shared"
import styles from "./bulk2-experience.module.css"

const lifecycle = ["brief", "draft", "review", "approved", "scheduled", "published"] as const

function dateLabel(value: string) {
  if (!value) return "Non planifié"
  try { return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`)) }
  catch { return value }
}

function addDays(value: string, days: number) {
  const date = value ? new Date(`${value}T12:00:00`) : new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export default function Bulk2PlanningWorkspace() {
  const { store, commit } = useContentStore()
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState("all")
  const [selectedId, setSelectedId] = React.useState("")
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false)
  const [notice, setNotice] = React.useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null)
  const [strategicContext, setStrategicContext] = React.useState<StrategicContext | null>(null)
  const [windowStart, setWindowStart] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [scheduleForm, setScheduleForm] = React.useState({ productionDate: "", publicationDate: "", owner: "" })

  React.useEffect(() => { setStrategicContext(readStrategicContext()) }, [])

  const collisions = React.useMemo(() => planningCollisions(store.items), [store.items])
  const collisionIds = React.useMemo(() => new Set(collisions.flatMap((collision) => collision.affectedIds)), [collisions])
  const items = React.useMemo(() => store.items.filter((item) => {
    const haystack = `${item.title} ${item.campaign} ${item.channel} ${item.owner} ${item.reviewer}`.toLowerCase()
    const matchesQuery = haystack.includes(query.toLowerCase())
    const matchesFilter = filter === "all"
      ? true
      : filter === "collision"
        ? collisionIds.has(item.id)
        : filter === "unscheduled"
          ? !item.scheduledDate
          : item.status === filter
    return matchesQuery && matchesFilter
  }).sort((a, b) => (a.scheduledDate || "9999").localeCompare(b.scheduledDate || "9999")), [store.items, query, filter, collisionIds])
  const selected = store.items.find((item) => item.id === selectedId) || items[0] || null
  const selectedCollisions = selected ? collisions.filter((collision) => collision.affectedIds.includes(selected.id)) : []
  const relatedBrief = selected ? store.briefs.find((brief) => brief.campaign && brief.campaign === selected.campaign) || null : null
  const relatedTasks = selected ? store.tasks.filter((task) => task.contentId === selected.id) : []

  React.useEffect(() => {
    if (!selected) return
    setScheduleForm({ productionDate: selected.dueDate || "", publicationDate: selected.scheduledDate || "", owner: selected.owner || "" })
  }, [selected?.id, selected])

  const days = React.useMemo(() => Array.from({ length: 14 }, (_, index) => addDays(windowStart, index)), [windowStart])
  const context: StrategicContext = {
    caseId: strategicContext?.caseId || selected?.id,
    caseCode: strategicContext?.caseCode || selected?.id,
    title: strategicContext?.title || selected?.title,
    stage: "planning",
    owner: selected?.owner,
    deadline: selected?.scheduledDate,
    status: selected ? statusLabel(selected.status) : "Aucun contenu",
    returnTo: "/market-os/content-command-center/calendar",
  }

  const readinessChecks: ReadinessCheck[] = selected ? [
    { id: "brief", label: "Brief prêt", passed: relatedBrief?.status === "ready" || relatedBrief?.status === "used", reason: relatedBrief ? `Brief ${statusLabel(relatedBrief.status)}.` : "Aucun brief relié par campagne.", owner: "Brief owner" },
    { id: "owner", label: "Owner assigné", passed: Boolean(selected.owner.trim()), reason: selected.owner ? `Owner : ${selected.owner}.` : "Aucun owner.", owner: "Content Lead" },
    { id: "production", label: "Échéance production", passed: Boolean(selected.dueDate), reason: selected.dueDate ? `Production : ${selected.dueDate}.` : "Date de production manquante.", owner: selected.owner || "Content Lead" },
    { id: "publication", label: "Publication planifiée", passed: Boolean(selected.scheduledDate), reason: selected.scheduledDate ? `Publication : ${selected.scheduledDate}.` : "Date de publication manquante.", owner: "Planning owner" },
    { id: "sequence", label: "Séquence temporelle", passed: Boolean(selected.dueDate && selected.scheduledDate && selected.dueDate <= selected.scheduledDate), reason: selected.dueDate && selected.scheduledDate ? selected.dueDate <= selected.scheduledDate ? "Production avant publication." : "Publication prévue avant la production." : "Dates insuffisantes.", owner: "Planning owner" },
    { id: "collision", label: "Collisions critiques", passed: !selectedCollisions.some((collision) => collision.severity === "critical"), reason: selectedCollisions.length ? `${selectedCollisions.length} collision(s) détectée(s).` : "Aucune collision déterministe.", owner: "Planning owner" },
  ] : []

  function saveSchedule() {
    if (!selected) return
    commit((draft) => {
      draft.items = draft.items.map((item) => item.id === selected.id ? { ...item, dueDate: scheduleForm.productionDate, scheduledDate: scheduleForm.publicationDate, owner: scheduleForm.owner, status: scheduleForm.publicationDate && item.status === "approved" ? "scheduled" : item.status, updatedAt: new Date().toISOString() } : item)
    }, "planning reschedule", `[planning:${selected.id}] Production ${scheduleForm.productionDate || "—"}; publication ${scheduleForm.publicationDate || "—"}; owner ${scheduleForm.owner || "—"}`)
    setRescheduleOpen(false)
    setNotice({ tone: "success", text: "Planning enregistré dans le store existant. Les collisions ont été recalculées immédiatement." })
  }

  const nextAction = !selected ? "Sélectionner un contenu" : !selected.scheduledDate ? "Planifier la publication" : selectedCollisions.length ? "Résoudre les collisions" : "Préparer la mission"

  return <main aria-label="Planning éditorial AngelCare" className={`${styles.bulk2Canvas} ${styles.planningCanvas}`}>
    <section className={styles.planningHero}>
      <div className={styles.timelineGlyph}><span/><span/><span/><CalendarClock/></div>
      <div className={styles.heroCopy}><span>Planning éditorial</span><h1>Orchestrer le temps, les dépendances et les conséquences avant l’exécution.</h1><p>Le planning ne prétend pas connaître la productivité humaine. Il expose les dates persistées, les collisions déterministes, l’ordre des gates et les effets d’un déplacement.</p></div>
      <div className={styles.heroCommandCluster}><button className={styles.sovereignButton} onClick={() => selected ? setRescheduleOpen(true) : setNotice({ tone: "warning", text: "Sélectionnez un contenu avant de planifier." })}><CalendarClock/> Planifier / replanifier</button><Link className={styles.secondaryButton} href={strategicHref("/market-os/content-command-center/briefs", { ...context, stage: "brief" })}><GitBranch/> Briefs</Link></div>
    </section>

    {notice ? <Notice tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Notice> : null}
    <StrategicIdentityStrip context={context} nextAction={nextAction} onNextAction={selected ? () => setRescheduleOpen(true) : undefined}/>

    <section className={styles.planningCommandBar}>
      <label className={styles.searchControl}><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Contenu, campagne, canal ou owner…"/></label>
      <select className={styles.selectControl} value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Tout le planning</option><option value="collision">Avec collision</option><option value="unscheduled">Non planifié</option>{lifecycle.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select>
      <div className={styles.truthCounters}><span><strong>{store.items.length}</strong> contenus</span><span><strong>{store.items.filter((item) => item.scheduledDate).length}</strong> planifiés</span><span><strong>{collisions.length}</strong> collisions</span></div>
      <div className={styles.windowControls}><button onClick={() => setWindowStart(addDays(windowStart, -14))} aria-label="Période précédente"><ChevronLeft/></button><span>{dateLabel(windowStart)} → {dateLabel(days[13])}</span><button onClick={() => setWindowStart(addDays(windowStart, 14))} aria-label="Période suivante"><ChevronRight/></button></div>
    </section>

    <div className={styles.temporalSurface}>
      <section className={styles.planningRunway}>
        <header className={styles.zoneHeader}><div><span>01 · Planning Runway</span><h2>Deux semaines de mouvement opérationnel</h2><p>Chaque position provient de la date de publication enregistrée.</p></div><Clock3/></header>
        <div className={styles.runwayGrid}>
          <div className={styles.runwayLabels}><span>Brief</span><span>Production</span><span>Review</span><span>Validation</span><span>Publishing</span></div>
          <div className={styles.runwayTimeline}>
            <div className={styles.dayHeaders}>{days.map((day) => <span key={day} className={day === new Date().toISOString().slice(0,10) ? styles.todayHeader : undefined}><strong>{new Date(`${day}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short" })}</strong><small>{new Date(`${day}T12:00:00`).getDate()}</small></span>)}</div>
            <div className={styles.runwayLanes}>
              {lifecycle.slice(0,5).map((stage) => <div className={styles.runwayLane} key={stage}><span className={styles.laneBaseline}/>{store.items.filter((item) => item.status === stage || (stage === "published" && item.status === "scheduled")).map((item, index) => {
                const date = item.scheduledDate || item.dueDate
                const dayIndex = days.indexOf(date)
                if (dayIndex < 0) return null
                return <button key={item.id} className={`${styles.runwayItem} ${collisionIds.has(item.id) ? styles.runwayItemCollision : ""} ${selected?.id === item.id ? styles.runwayItemActive : ""}`} style={{ left: `calc(${(dayIndex / 14) * 100}% + 8px)`, top: `${10 + (index % 2) * 34}px` }} onClick={() => setSelectedId(item.id)}><span>{item.title}</span><small>{item.channel}</small></button>
              })}</div>)}
            </div>
          </div>
        </div>
      </section>

      <aside className={styles.planningInspector}>
        {selected ? <>
          <header><span>Selected orchestration</span><h2>{selected.title}</h2><p>{selected.campaign || "Campagne non renseignée"}</p></header>
          <div className={styles.scheduleFacts}>
            <article><CalendarClock/><div><small>Production</small><strong>{dateLabel(selected.dueDate)}</strong></div></article>
            <article><MoveRight/><div><small>Publication</small><strong>{dateLabel(selected.scheduledDate)}</strong></div></article>
            <article><UserRound/><div><small>Owner</small><strong>{selected.owner || "Non renseigné"}</strong></div></article>
            <article><Layers3/><div><small>Canal</small><strong>{selected.channel}</strong></div></article>
          </div>
          <button className={styles.sovereignButton} onClick={() => setRescheduleOpen(true)}><TimerReset/> Inspecter les conséquences</button>
        </> : <EmptyStrategicState title="Sélectionnez un contenu" detail="Dates, owner, canal, collisions et conséquences apparaîtront ici."/>}
      </aside>
    </div>

    <section className={styles.lifecycleLanesSection}>
      <header className={styles.zoneHeader}><div><span>02 · Lifecycle Lanes</span><h2>Le planning suit les gates, pas seulement les dates</h2><p>Chaque contenu reste visible dans son état persistant.</p></div><Waypoints/></header>
      <div className={styles.lifecycleLanes}>{lifecycle.map((stage) => <article key={stage}><header><span>{statusLabel(stage)}</span><strong>{store.items.filter((item) => item.status === stage).length}</strong></header><div>{store.items.filter((item) => item.status === stage).slice(0, 5).map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)}><CircleDot/><span>{item.title}</span><small>{item.scheduledDate || item.dueDate || "Sans date"}</small></button>)}{!store.items.some((item) => item.status === stage) ? <p>Aucun contenu</p> : null}</div></article>)}</div>
    </section>

    <div className={styles.planningLowerGrid}>
      <section className={styles.collisionRadar}>
        <header className={styles.zoneHeader}><div><span>03 · Collision Radar</span><h2>Conflits expliqués par leur base réelle</h2><p>Aucune capacité humaine ou prédiction de performance n’est inventée.</p></div><AlertTriangle/></header>
        <div className={styles.collisionList}>{collisions.map((collision) => <button key={collision.id} className={styles[`collision_${collision.severity}`]} onClick={() => setSelectedId(collision.affectedIds[0] || "")}><span className={styles.collisionIcon}>{collision.severity === "critical" ? <ShieldAlert/> : <TriangleAlert/>}</span><div><strong>{collision.title}</strong><p>{collision.basis}</p><small>{collision.consequence}</small></div><span>{collision.affectedIds.length}</span></button>)}{!collisions.length ? <EmptyStrategicState title="Aucune collision déterministe" detail="Aucun chevauchement de canal/date, owner/échéance ou incohérence de séquence n’est visible."/> : null}</div>
      </section>

      <section className={styles.consequenceInspector}>
        <header className={styles.zoneHeader}><div><span>04 · Rescheduling Consequence</span><h2>Ce que le déplacement change</h2></div><TimerReset/></header>
        {selected ? <div className={styles.consequenceChain}>
          <article><span>1</span><div><strong>Brief</strong><p>{relatedBrief ? `${relatedBrief.title} · ${statusLabel(relatedBrief.status)}` : "Aucun brief relié par campagne"}</p></div></article>
          <article><span>2</span><div><strong>Production</strong><p>{selected.dueDate || "Date manquante"} · {selected.owner || "Owner manquant"}</p></div></article>
          <article><span>3</span><div><strong>Tâches</strong><p>{relatedTasks.length} tâche(s) · {relatedTasks.filter((task) => task.status === "blocked").length} bloquée(s)</p></div></article>
          <article><span>4</span><div><strong>Publication</strong><p>{selected.scheduledDate || "Non planifiée"} · {selected.channel}</p></div></article>
          <article><span>5</span><div><strong>Collisions</strong><p>{selectedCollisions.length} conséquence(s) détectée(s)</p></div></article>
          <button className={styles.sovereignButton} onClick={() => setRescheduleOpen(true)}>Modifier avec contrôle <ArrowRight/></button>
        </div> : <EmptyStrategicState title="Aucun contenu sélectionné" detail="Le chainage brief, production, tâches, publication et collisions apparaîtra ici."/>}
      </section>

      <StrategicContextSidecar context={context} sections={[
        { label: "Brief", value: relatedBrief ? statusLabel(relatedBrief.status) : "Non relié", tone: relatedBrief ? "success" : "danger" },
        { label: "Production", value: selected?.dueDate || "Sans date", tone: selected?.dueDate ? "success" : "warning" },
        { label: "Publication", value: selected?.scheduledDate || "Sans date", tone: selected?.scheduledDate ? "success" : "warning" },
        { label: "Collisions", value: String(selectedCollisions.length), tone: selectedCollisions.some((collision) => collision.severity === "critical") ? "danger" : selectedCollisions.length ? "warning" : "success" },
      ]}/>
    </div>

    <section className={styles.missionReadinessDeck}>
      <ReadinessGate title="Mission Readiness Gate" checks={readinessChecks} actionLabel="Ouvrir Mission Control" actionDisabled={readinessChecks.some((check) => !check.passed)}/>
      <article className={styles.missionBoundary}><header><CheckCircle2/><span>05 · Planning Decision Dock</span></header><h3>{selected ? selected.title : "Aucune sélection"}</h3><p>Le planning peut enregistrer dates et owner. La constitution complète de mission reste dans Mission Control avec le contexte stratégique préservé.</p>{selected ? <Link className={styles.sovereignButton} href={`/market-os/content-command-center/missions?dossier=${encodeURIComponent(selected.id)}&executionStage=mission&returnTo=${encodeURIComponent("/market-os/content-command-center/calendar")}`}>Constituer la mission <ArrowRight/></Link> : null}</article>
    </section>

    {rescheduleOpen && selected ? <Drawer title="Replanifier avec analyse de conséquence" eyebrow={`${selected.title} · Temporal Control`} onClose={() => setRescheduleOpen(false)} footer={<><button className={styles.secondaryButton} onClick={() => setRescheduleOpen(false)}>Annuler</button><button className={styles.sovereignButton} onClick={saveSchedule}><CalendarClock/> Enregistrer le planning</button></>}>
      <div className={styles.drawerFormGrid}>
        <label>Échéance de production<input type="date" value={scheduleForm.productionDate} onChange={(event) => setScheduleForm({ ...scheduleForm, productionDate: event.target.value })}/></label>
        <label>Date de publication<input type="date" value={scheduleForm.publicationDate} onChange={(event) => setScheduleForm({ ...scheduleForm, publicationDate: event.target.value })}/></label>
        <label>Owner<input value={scheduleForm.owner} onChange={(event) => setScheduleForm({ ...scheduleForm, owner: event.target.value })}/></label>
        <div className={styles.reschedulePreview}>
          <header><TimerReset/><strong>Prévisualisation des impacts</strong></header>
          <article><span>Séquence</span><strong>{scheduleForm.productionDate && scheduleForm.publicationDate && scheduleForm.productionDate <= scheduleForm.publicationDate ? "Cohérente" : "À corriger"}</strong></article>
          <article><span>Brief</span><strong>{relatedBrief ? statusLabel(relatedBrief.status) : "Non relié"}</strong></article>
          <article><span>Owner</span><strong>{scheduleForm.owner || "Non assigné"}</strong></article>
          <article><span>Collisions actuelles</span><strong>{selectedCollisions.length}</strong></article>
          <p>Les collisions futures seront recalculées après persistance. Aucun résultat prédit n’est affiché avant enregistrement.</p>
        </div>
      </div>
    </Drawer> : null}
  </main>
}
