"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock3,
  GitBranch,
  Layers3,
  ListChecks,
  Plus,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react"
import {
  Shell,
  TaskForm,
  statusLabel,
  useContentStore,
  type ContentTask,
} from "./content-command-system"
import {
  addTaskActivity,
  readTaskActivity,
  readTaskChecklists,
  readTaskExecutionMetas,
  saveTaskExecutionMeta,
  type TaskExecutionMeta,
} from "@/lib/content-command/tasks/task-activity"
import {
  humanDate,
  sortTasksForCommand,
  taskIsDueToday,
  taskIsOverdue,
  taskNextAction,
  taskQueueMatch,
  taskReadiness,
  type TaskQueueKey,
} from "./execution/task-operating-model"
import {
  EmptyState,
  ExecutionBadge,
  ExecutionModal,
  ExecutionPanel,
  MetricCard,
  SectionHeading,
  StatusMessage,
  toneForStatus,
} from "./execution/execution-ui"
import styles from "./execution/execution-command.module.css"

const statusFilters: Array<ContentTask["status"] | "all"> = ["all", "todo", "doing", "blocked", "done"]
const queueDefinitions: Array<{ key: TaskQueueKey; label: string; detail: string }> = [
  { key: "today", label: "À faire aujourd’hui", detail: "Échéance du jour, non terminée" },
  { key: "overdue", label: "En retard", detail: "Échéance dépassée" },
  { key: "blocked", label: "Bloquées", detail: "Blocage déclaré ou statut bloqué" },
  { key: "unassigned", label: "Non affectées", detail: "Responsabilité manquante" },
  { key: "clarification", label: "Clarification", detail: "Question opérationnelle ouverte" },
  { key: "evidence", label: "Preuve attendue", detail: "Exigence définie, preuve non soumise" },
  { key: "review", label: "En révision", detail: "Soumission en attente de décision" },
  { key: "returned", label: "Correction", detail: "Résultat retourné à l’exécution" },
  { key: "ready_close", label: "Prêtes à fermer", detail: "Tâche terminée avec preuve acceptée" },
]

export default function ContentTasksPage() {
  const { store, commit } = useContentStore()
  const [metas, setMetas] = React.useState<Record<string, TaskExecutionMeta>>({})
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState<ContentTask["status"] | "all">("all")
  const [queue, setQueue] = React.useState<TaskQueueKey | "all">("all")
  const [view, setView] = React.useState<"command" | "table" | "mission" | "owner">("command")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [announcement, setAnnouncement] = React.useState("")

  const refreshMeta = React.useCallback(() => setMetas(readTaskExecutionMetas()), [])
  React.useEffect(() => { refreshMeta() }, [refreshMeta, store.tasks.length])

  const checklists = readTaskChecklists()
  const activity = readTaskActivity()
  const ordered = sortTasksForCommand(store.tasks, metas)
  const tasks = ordered.filter((task) => {
    const meta = metas[task.id] ?? { taskId: task.id, dependencyIds: [], successorIds: [], workState: "not_started", updatedAt: "", evidences: [], blockers: [], clarifications: [] } as TaskExecutionMeta
    const matchesStatus = status === "all" || task.status === status
    const matchesQueue = queue === "all" || taskQueueMatch(task, meta, queue)
    const linked = store.items.find((item) => item.id === task.contentId)
    const haystack = `${task.title} ${task.owner} ${task.priority} ${task.status} ${linked?.title || ""} ${meta.missionId || ""}`.toLowerCase()
    return matchesStatus && matchesQueue && haystack.includes(query.trim().toLowerCase())
  })

  const today = ordered.filter(taskIsDueToday)
  const overdue = ordered.filter(taskIsOverdue)
  const blocked = ordered.filter((task) => task.status === "blocked" || metas[task.id]?.blockers.some((item) => item.state !== "resolved"))
  const review = ordered.filter((task) => metas[task.id]?.workState === "submitted")
  const owners = Array.from(new Set(ordered.map((task) => task.owner || "Non affectée")))

  function createTask(task: ContentTask) {
    commit((draft) => { draft.tasks = [task, ...draft.tasks] }, "task_create", `Tâche créée : ${task.title}`)
    saveTaskExecutionMeta(task.id, (current) => ({
      ...current,
      objective: task.notes || "",
      completionDefinition: "",
      acceptanceCriteria: "",
      evidenceRequirement: "",
      reviewer: "",
    }))
    addTaskActivity(task.id, "task_created", `Tâche créée dans Task Command et reliée au contenu ${task.contentId}.`)
    setCreateOpen(false)
    setAnnouncement("Tâche créée. Les critères de réalisation et la preuve doivent être complétés avant exécution.")
    refreshMeta()
  }

  function updateStatus(task: ContentTask, nextStatus: ContentTask["status"]) {
    commit((draft) => {
      draft.tasks = draft.tasks.map((candidate) => candidate.id === task.id ? { ...candidate, status: nextStatus } : candidate)
    }, "task_status", `${task.title} → ${nextStatus}`)
    addTaskActivity(task.id, "status_changed", `Statut : ${statusLabel(nextStatus)}`)
    if (nextStatus === "doing") saveTaskExecutionMeta(task.id, (current) => ({ ...current, workState: "active", startedAt: current.startedAt || new Date().toISOString() }))
    if (nextStatus === "blocked") saveTaskExecutionMeta(task.id, (current) => ({ ...current, workState: "blocked" }))
    if (nextStatus === "done") saveTaskExecutionMeta(task.id, (current) => ({ ...current, workState: "completed" }))
    setAnnouncement(`Tâche mise à jour : ${statusLabel(nextStatus)}.`)
    refreshMeta()
  }

  return <Shell>
    <main className={styles.root} data-market-os-root>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}><ListChecks size={16}/> TASK COMMAND / RESPONSABILITÉ QUOTIDIENNE</span>
          <h1>Une vue de commandement pour savoir quoi faire, pourquoi, dans quel ordre et avec quelle preuve.</h1>
          <p>Les tâches sont priorisées par échéance, impact de dépendance, priorité de mission, blocage et retour de révision — jamais par une notation arbitraire de productivité.</p>
        </div>
        <div className={styles.heroActions}>
          <button className={styles.primaryButton} type="button" onClick={() => setCreateOpen(true)}><Plus size={16}/>Créer une tâche</button>
          <Link className={styles.secondaryButton} href="/market-os/content-command-center/tasks/execution"><CircleDot size={16}/>Ouvrir le poste d’exécution</Link>
        </div>
      </section>

      {announcement ? <StatusMessage kind="success">{announcement}</StatusMessage> : null}

      <section className={styles.metricGrid} aria-label="Indicateurs du portefeuille de tâches">
        <MetricCard label="Travail total" value={store.tasks.length} detail="Tâches présentes dans le registre Content Command" icon={<Layers3 size={14}/>}/>
        <MetricCard label="Aujourd’hui" value={today.length} detail="Échéance du jour et résultat non accepté" icon={<CalendarClock size={14}/>}/>
        <MetricCard label="En retard" value={overdue.length} detail="Échéances dépassées à replanifier ou escalader" icon={<Clock3 size={14}/>}/>
        <MetricCard label="Blocages" value={blocked.length} detail="Tâches stoppées ou blocages non résolus" icon={<AlertTriangle size={14}/>}/>
        <MetricCard label="En révision" value={review.length} detail="Soumissions attendant une décision humaine" icon={<ShieldCheck size={14}/>}/>
      </section>

      <section className={styles.gridTwo}>
        <ExecutionPanel>
          <div className={styles.panelInner}>
            <SectionHeading eyebrow="TODAY COMMAND" title="Le travail qui commande la journée" description="Le classement privilégie les blocages critiques, les retards, la priorité et la date. Il n’invente aucune présence ou disponibilité." action={<Link className={styles.quietButton} href="/market-os/content-command-center/tasks/execution">Commencer <ArrowRight size={14}/></Link>}/>
            <div className={styles.taskList}>
              {ordered.filter((task) => task.status !== "done").slice(0, 7).map((task) => {
                const meta = metas[task.id] || { taskId: task.id, dependencyIds: [], successorIds: [], workState: "not_started", updatedAt: "", evidences: [], blockers: [], clarifications: [] } as TaskExecutionMeta
                const linked = store.items.find((item) => item.id === task.contentId)
                return <Link className={styles.taskCard} key={task.id} href={`/market-os/content-command-center/tasks/${task.id}`}>
                  <span className={styles.code}>{task.priority.slice(0, 3).toUpperCase()}</span>
                  <span className={styles.cardMain}><strong>{task.title}</strong><p>{taskNextAction(task, meta)}</p><span className={styles.cardMeta}><span>{linked?.title || "Dossier non résolu"}</span><span>{task.owner || "Responsable manquant"}</span><span>{humanDate(task.dueDate)}</span></span></span>
                  <ExecutionBadge tone={taskIsOverdue(task) ? "danger" : toneForStatus(task.status)}>{taskIsOverdue(task) ? "En retard" : statusLabel(task.status)}</ExecutionBadge>
                </Link>
              })}
              {!ordered.length ? <EmptyState title="Aucune tâche opérationnelle" detail="Créez une tâche uniquement lorsqu’un résultat, un responsable et une preuve peuvent être définis."/> : null}
            </div>
          </div>
        </ExecutionPanel>

        <ExecutionPanel>
          <div className={styles.panelInner}>
            <SectionHeading eyebrow="OPERATIONAL QUEUES" title="Pourquoi une tâche attend" description="Chaque file explique la condition qui y place la tâche et le travail nécessaire pour l’en sortir."/>
            <div className={styles.commandQueue}>
              {queueDefinitions.map((definition) => {
                const count = ordered.filter((task) => taskQueueMatch(task, metas[task.id] || { taskId: task.id, dependencyIds: [], successorIds: [], workState: "not_started", updatedAt: "", evidences: [], blockers: [], clarifications: [] } as TaskExecutionMeta, definition.key)).length
                return <button key={definition.key} className={styles.queueCard} type="button" onClick={() => setQueue(queue === definition.key ? "all" : definition.key)} aria-pressed={queue === definition.key}>
                  <span>{definition.label}</span><strong>{count}</strong><p>{definition.detail}</p>
                </button>
              })}
            </div>
          </div>
        </ExecutionPanel>
      </section>

      <section className={styles.panel} style={{ marginTop: 16 }}>
        <div className={styles.panelInner}>
          <SectionHeading eyebrow="TASK PORTFOLIO" title="Portefeuille, dépendances et action suivante" description="Les différentes vues utilisent le même registre; aucune tâche parallèle ou copie locale n’est créée." action={<div className={styles.filters}>{(["command", "table", "mission", "owner"] as const).map((mode) => <button key={mode} className={`${styles.filterButton} ${view === mode ? styles.filterActive : ""}`} type="button" onClick={() => setView(mode)}>{mode === "command" ? "Command" : mode === "table" ? "Registre" : mode === "mission" ? "Par mission" : "Par owner"}</button>)}</div>}/>

          <div className={styles.filters} aria-label="Filtrer par statut">
            {statusFilters.map((item) => <button className={`${styles.filterButton} ${status === item ? styles.filterActive : ""}`} type="button" key={item} onClick={() => setStatus(item)}>{item === "all" ? "Tous" : statusLabel(item)}</button>)}
            {queue !== "all" ? <button className={`${styles.filterButton} ${styles.filterActive}`} type="button" onClick={() => setQueue("all")}>File : {queueDefinitions.find((item) => item.key === queue)?.label} ×</button> : null}
          </div>
          <div style={{ position: "relative" }}><Search size={16} style={{ position: "absolute", left: 13, top: 27, color: "#60758b" }}/><input className={styles.searchInput} style={{ paddingLeft: 40 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par titre, responsable, dossier, mission, priorité ou statut…" aria-label="Rechercher les tâches"/></div>

          {view === "command" || view === "table" ? <div className={styles.taskList} style={{ marginTop: 15 }}>
            {tasks.map((task) => {
              const meta = metas[task.id] || { taskId: task.id, dependencyIds: [], successorIds: [], workState: "not_started", updatedAt: "", evidences: [], blockers: [], clarifications: [] } as TaskExecutionMeta
              const checklist = checklists.filter((item) => item.taskId === task.id)
              const readiness = taskReadiness(task, meta, checklist)
              const linked = store.items.find((item) => item.id === task.contentId)
              return <article className={styles.taskCard} key={task.id}>
                <span className={styles.code}>{task.id.slice(-5).toUpperCase()}</span>
                <span className={styles.cardMain}>
                  <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}><ExecutionBadge tone={toneForStatus(task.status)}>{statusLabel(task.status)}</ExecutionBadge><ExecutionBadge tone={task.priority === "Critical" ? "danger" : task.priority === "High" ? "warning" : "neutral"}>{task.priority}</ExecutionBadge>{readiness.ready ? <ExecutionBadge tone="success">Prête à soumettre</ExecutionBadge> : <ExecutionBadge tone="warning">{readiness.score}% préparée</ExecutionBadge>}</span>
                  <strong style={{ marginTop: 8 }}>{task.title}</strong>
                  <p>{taskNextAction(task, meta)}</p>
                  <span className={styles.cardMeta}><span>{linked?.title || "Dossier non résolu"}</span><span>{meta.missionId || "Mission non renseignée"}</span><span>{task.owner || "Owner manquant"}</span><span>{humanDate(task.dueDate)}</span><span>{activity.filter((item) => item.taskId === task.id).length} événement(s)</span></span>
                </span>
                <span className={styles.nodeActions}>
                  <Link href={`/market-os/content-command-center/tasks/${task.id}`}>Détail</Link>
                  <Link href={`/market-os/content-command-center/tasks/${task.id}/edit`}>Modifier</Link>
                  {task.status === "todo" ? <button type="button" onClick={() => updateStatus(task, "doing")}>Démarrer</button> : null}
                  {task.status === "doing" ? <button type="button" onClick={() => updateStatus(task, "done")} disabled={!readiness.ready}>Terminer</button> : null}
                </span>
              </article>
            })}
          </div> : null}

          {view === "mission" ? <div className={styles.gridThree}>
            {Array.from(new Set(tasks.map((task) => metas[task.id]?.missionId || "Mission non renseignée"))).map((missionId) => <article className={styles.queueCard} key={missionId}><span>{missionId}</span><strong>{tasks.filter((task) => (metas[task.id]?.missionId || "Mission non renseignée") === missionId).length}</strong><p>{tasks.filter((task) => (metas[task.id]?.missionId || "Mission non renseignée") === missionId && task.status === "blocked").length} bloquée(s)</p></article>)}
          </div> : null}

          {view === "owner" ? <div><StatusMessage kind="warning">Charge observée — volumes de tâches uniquement; aucune capacité contractuelle ni performance individuelle n’est déduite.</StatusMessage><div className={styles.workloadGrid}>
            {owners.map((owner) => {
              const ownerTasks = tasks.filter((task) => (task.owner || "Non affectée") === owner)
              const due = ownerTasks.filter((task) => task.status !== "done").length
              const late = ownerTasks.filter(taskIsOverdue).length
              const blockedCount = ownerTasks.filter((task) => task.status === "blocked").length
              const observed = Math.min(100, ownerTasks.length * 15)
              return <div className={styles.workloadRow} key={owner}><span className={styles.workloadName}>{owner}</span><span className={styles.workloadBar}><i style={{ width: `${observed}%` }}/></span><span className={styles.workloadCount}>{due} act.</span><span className={styles.workloadCount}>{late} ret.</span><span className={styles.workloadCount}>{blockedCount} bloq.</span></div>
            })}
          </div></div> : null}

          {!tasks.length ? <EmptyState title="Aucun résultat dans cette vue" detail="Modifiez les filtres. La page ne crée pas de tâches d’exemple pour remplir visuellement le portefeuille."/> : null}
        </div>
      </section>

      <section className={styles.gridThree}>
        <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="DEPENDENCY INTELLIGENCE" title="Relations observables" description="Les dépendances sont renseignées dans la couche d’exécution sans prétendre calculer un chemin critique absent."/><div className={styles.queueList}>{ordered.filter((task) => metas[task.id]?.dependencyIds.length).slice(0, 6).map((task) => <Link className={styles.queueItem} href={`/market-os/content-command-center/tasks/${task.id}`} key={task.id}><GitBranch size={16}/><span className={styles.cardMain}><strong>{task.title}</strong><p>{metas[task.id]?.dependencyIds.length} prédécesseur(s) · {metas[task.id]?.successorIds.length} successeur(s)</p></span><ArrowRight size={14}/></Link>)}{!ordered.some((task) => metas[task.id]?.dependencyIds.length) ? <EmptyState title="Aucune dépendance formalisée" detail="L’absence est visible; aucun chemin critique fictif n’est calculé."/> : null}</div></div></ExecutionPanel>
        <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="EVIDENCE QUEUE" title="Preuves exigées" description="La preuve reste distincte de la checklist et de la déclaration de fin."/><div className={styles.queueList}>{ordered.filter((task) => metas[task.id]?.evidenceRequirement).slice(0, 6).map((task) => <Link className={styles.queueItem} href={`/market-os/content-command-center/tasks/${task.id}`} key={task.id}><ShieldCheck size={16}/><span className={styles.cardMain}><strong>{task.title}</strong><p>{metas[task.id]?.evidences.length || 0} preuve(s) · {metas[task.id]?.evidenceRequirement}</p></span><ArrowRight size={14}/></Link>)}{!ordered.some((task) => metas[task.id]?.evidenceRequirement) ? <EmptyState title="Exigences de preuve non définies" detail="Complétez les tâches avant de les considérer exécutables."/> : null}</div></div></ExecutionPanel>
        <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="SAVED COMMAND VIEWS" title="Vues personnelles" description="Les filtres sauvegardés restent des préférences utilisateur, jamais des données métier."/><EmptyState title="Aucune vue enregistrée" detail="Cette fondation n’invente pas de vues favorites. Les filtres actuels restent disponibles pendant la session."/></div></ExecutionPanel>
      </section>

      <ExecutionModal open={createOpen} title="Créer une unité d’exécution" onClose={() => setCreateOpen(false)} footer={<button className={styles.quietButton} onClick={() => setCreateOpen(false)}>Fermer</button>}>
        {store.items.length ? <TaskForm items={store.items} onSave={createTask}/> : <EmptyState title="Aucun dossier ou contenu disponible" detail="Une tâche doit être reliée à un objet de contenu existant; aucune association fictive ne sera créée." action="Créer un contenu" href="/market-os/content-command-center/create"/>}
      </ExecutionModal>
    </main>
  </Shell>
}
