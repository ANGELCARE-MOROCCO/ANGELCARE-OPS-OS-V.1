"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  FileCheck2,
  Filter,
  GitBranch,
  History,
  Layers3,
  ListChecks,
  Plus,
  Search,
  ShieldAlert,
  Target,
  UserRoundX,
  UsersRound,
  Workflow,
} from "lucide-react"
import {
  Shell,
  owners,
  priorities,
  todayISO,
  uid,
  useContentStore,
  type ContentTask,
} from "../content-command-system"
import {
  addTaskActivity,
  readTaskActivity,
  readTaskChecklists,
  readTaskExecutionMetas,
  saveTaskExecutionMeta,
  type TaskExecutionMeta,
  hydrateTaskRuntime,
} from "@/lib/content-command/tasks/task-activity"
import { humanDate, sortTasksForCommand, taskIsOverdue, taskQueueMatch, type TaskQueueKey } from "../execution/task-operating-model"
import { bulk3ContextHref, contextFromLocation, writeBulk3Context } from "./bulk3-context"
import { taskAttentionWeight, taskOperatingState } from "./bulk3-derivations"
import type { TaskCommandMode, TaskOperatingState } from "./bulk3-types"
import {
  Bulk3Modal,
  Bulk3Shell,
  ExperienceHeader,
  GovernanceNotice,
  MetricRail,
  OperationalEmpty,
  ReturnContext,
  SectionTitle,
  StatusPill,
} from "./Bulk3Shared"
import styles from "./bulk3-experience.module.css"

const modeDefinitions: Array<{ key: TaskCommandMode; label: string; detail: string }> = [
  { key: "coordination", label: "Coordination", detail: "Ownership, blocages et handovers" },
  { key: "mission", label: "Missions", detail: "Architecture par mission et livrable" },
  { key: "review", label: "Revue & preuve", detail: "Soumissions, corrections et acceptation" },
  { key: "risk", label: "Risque", detail: "Retards, dépendances et missions exposées" },
  { key: "audit", label: "Audit", detail: "Historique et changements d’état" },
]

const queueDefinitions: Array<{ key: TaskQueueKey; label: string; detail: string }> = [
  { key: "blocked", label: "Blocages", detail: "Action impossible ou statut bloqué" },
  { key: "unassigned", label: "Sans owner", detail: "Responsabilité manquante" },
  { key: "returned", label: "Retournées", detail: "Correction demandée" },
  { key: "review", label: "En révision", detail: "Décision humaine attendue" },
  { key: "clarification", label: "Clarifications", detail: "Réponse nécessaire" },
  { key: "evidence", label: "Preuve attendue", detail: "Obligation non satisfaite" },
  { key: "overdue", label: "En retard", detail: "Échéance dépassée" },
  { key: "ready_close", label: "Prêtes à clôturer", detail: "Résultat et preuve acceptée" },
]

function statusTone(task: ContentTask, state: TaskOperatingState): "neutral" | "success" | "warning" | "danger" | "info" {
  if (state.openBlockers || task.status === "blocked") return "danger"
  if (state.meta.workState === "returned" || state.openClarifications) return "warning"
  if (task.status === "done" || state.meta.workState === "completed") return "success"
  if (task.status === "doing" || state.meta.workState === "active") return "info"
  return "neutral"
}

export default function Bulk3TaskCommandWorkspace() {
  const { store, commit } = useContentStore()
  const [metas, setMetas] = React.useState<Record<string, TaskExecutionMeta>>({})
  const [mode, setMode] = React.useState<TaskCommandMode>("coordination")
  const [queue, setQueue] = React.useState<TaskQueueKey | "all">("all")
  const [query, setQuery] = React.useState("")
  const [missionFilter, setMissionFilter] = React.useState("")
  const [selectedId, setSelectedId] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [notice, setNotice] = React.useState("")
  const [context, setContext] = React.useState<ReturnType<typeof contextFromLocation>>({ returnTo: "/market-os/content-command-center" })
  const [form, setForm] = React.useState({ title: "", contentId: "", owner: owners[0] || "", dueDate: todayISO(2), priority: "High" as ContentTask["priority"], notes: "", missionId: "", completion: "", evidence: "", reviewer: "" })

  const refresh = React.useCallback(() => setMetas(readTaskExecutionMetas()), [])
  React.useEffect(() => { refresh(); setContext(contextFromLocation("/market-os/content-command-center")) }, [refresh, store.tasks.length])
  React.useEffect(() => { void hydrateTaskRuntime().then(refresh).catch(() => undefined) }, [refresh])
  React.useEffect(() => { if (!form.contentId && store.items[0]?.id) setForm((current) => ({ ...current, contentId: store.items[0].id })) }, [store.items, form.contentId])

  const checklists = readTaskChecklists()
  const taskStates = sortTasksForCommand(store.tasks, metas).map((task) => taskOperatingState(task, store.items.find((item) => item.id === task.contentId), metas[task.id] || {
    taskId: task.id,
    dependencyIds: [], successorIds: [], workState: "not_started", updatedAt: "", evidences: [], blockers: [], clarifications: [],
  }, checklists.filter((item) => item.taskId === task.id))).sort((a, b) => taskAttentionWeight(b) - taskAttentionWeight(a))

  const missions = Array.from(new Set(taskStates.map((state) => state.meta.missionId || "Mission non renseignée")))
  const visible = taskStates.filter((state) => {
    const haystack = `${state.task.title} ${state.task.owner} ${state.item?.title || ""} ${state.meta.missionId || ""} ${state.nextAction}`.toLowerCase()
    const queueMatch = queue === "all" || taskQueueMatch(state.task, state.meta, queue)
    const missionMatch = !missionFilter || (state.meta.missionId || "Mission non renseignée") === missionFilter
    return queueMatch && missionMatch && haystack.includes(query.trim().toLowerCase())
  })
  const selected = visible.find((state) => state.task.id === selectedId) || taskStates.find((state) => state.task.id === context.taskId) || visible[0] || taskStates[0]

  React.useEffect(() => {
    if (!selected) return
    writeBulk3Context({
      dossierId: selected.task.contentId || context.dossierId,
      dossierTitle: selected.item?.title,
      missionId: selected.meta.missionId || context.missionId,
      taskId: selected.task.id,
      taskTitle: selected.task.title,
      stage: "task-command",
      sourceHref: "/market-os/content-command-center/tasks",
      returnTo: context.returnTo || "/market-os/content-command-center",
      updatedAt: new Date().toISOString(),
    })
  }, [selected, context])

  const blocked = taskStates.filter((state) => state.openBlockers || state.task.status === "blocked")
  const unassigned = taskStates.filter((state) => !state.task.owner)
  const returned = taskStates.filter((state) => state.meta.workState === "returned")
  const review = taskStates.filter((state) => state.meta.workState === "submitted")
  const overdue = taskStates.filter((state) => taskIsOverdue(state.task))

  function createTask() {
    if (!form.title.trim() || !form.contentId) return
    const task: ContentTask = { id: uid("task"), contentId: form.contentId, title: form.title.trim(), owner: form.owner, status: "todo", dueDate: form.dueDate, priority: form.priority, notes: form.notes }
    commit((draft) => { draft.tasks = [task, ...draft.tasks] }, "task_create", `Tâche constituée : ${task.title}`)
    saveTaskExecutionMeta(task.id, (current) => ({ ...current, missionId: form.missionId || undefined, reviewer: form.reviewer, objective: form.notes, completionDefinition: form.completion, acceptanceCriteria: form.completion, evidenceRequirement: form.evidence }))
    addTaskActivity(task.id, "task_constituted", "Tâche constituée depuis Bulk 3 Task Command.")
    setForm({ title: "", contentId: store.items[0]?.id || "", owner: owners[0] || "", dueDate: todayISO(2), priority: "High", notes: "", missionId: "", completion: "", evidence: "", reviewer: "" })
    setCreateOpen(false)
    setNotice("Tâche constituée. L’owner doit encore accepter le mandat avant exécution.")
    refresh()
  }

  const grouped = visible.reduce<Record<string, TaskOperatingState[]>>((acc, state) => {
    const key = state.meta.missionId || "Mission non renseignée"
    ;(acc[key] ||= []).push(state)
    return acc
  }, {})

  return <Shell><Bulk3Shell>
    <ReturnContext href={context.returnTo}/>
    <ExperienceHeader
      eyebrow="EXECUTION ORCHESTRATION GRID / ANGELCARE"
      title="Coordonner les missions par dépendance, responsabilité, preuve et intervention réelle."
      description="Task Command ne mesure pas la productivité. Il rend visible ce qui bloque une mission, qui doit agir, quelle preuve manque, quelle révision attend et quel handover doit être sécurisé."
      actions={<><Link className={styles.secondaryButton} href={bulk3ContextHref("/market-os/content-command-center/missions", { dossierId: context.dossierId, missionId: context.missionId, returnTo: "/market-os/content-command-center/tasks" })}><Workflow size={15}/>Mission Control</Link><button className={styles.primaryButton} onClick={() => setCreateOpen(true)}><Plus size={15}/>Constituer une tâche</button></>}
    />
    {notice ? <GovernanceNotice kind="success" title="Task Command synchronisé">{notice}</GovernanceNotice> : null}
    <MetricRail items={[
      { label: "Blocages actifs", value: blocked.length, detail: "Tâches stoppées ou contraintes ouvertes", tone: blocked.length ? "danger" : "success" },
      { label: "Sans ownership", value: unassigned.length, detail: "Responsabilité à affecter", tone: unassigned.length ? "warning" : "success" },
      { label: "Retournées", value: returned.length, detail: "Corrections à reprendre", tone: returned.length ? "warning" : "neutral" },
      { label: "En révision", value: review.length, detail: "Décision humaine attendue", tone: "info" },
      { label: "Échéances exposées", value: overdue.length, detail: "Dates dépassées", tone: overdue.length ? "danger" : "neutral" },
    ]}/>

    <section className={styles.commandMatrix}>
      <aside className={styles.commandNav}>
        <span className={styles.eyebrow}><ClipboardCheck size={14}/> TASK COMMAND</span>
        <h2>Coordination par intention</h2><p>Les modes changent la hiérarchie du travail, pas uniquement le filtre.</p>
        <div className={styles.modeNav}>{modeDefinitions.map((definition) => <button key={definition.key} type="button" aria-pressed={mode === definition.key} onClick={() => setMode(definition.key)}><span><strong>{definition.label}</strong><small>{definition.detail}</small></span><ArrowRight size={13}/></button>)}</div>
        <div className={styles.queueStack}>{queueDefinitions.map((definition) => { const count = taskStates.filter((state) => taskQueueMatch(state.task, state.meta, definition.key)).length; return <button key={definition.key} type="button" onClick={() => setQueue((current) => current === definition.key ? "all" : definition.key)}><span><strong>{definition.label}</strong><small>{definition.detail}</small></span><span>{count}</span></button> })}</div>
      </aside>

      <section className={styles.constellationSurface}>
        <SectionTitle eyebrow={mode.toUpperCase()} title={mode === "mission" ? "Architecture de tâches par mission" : mode === "review" ? "Soumissions, preuves et corrections" : mode === "risk" ? "Chemin d’intervention et exposition" : mode === "audit" ? "Historique opérationnel observable" : "Missions, handovers et points de coordination"} description="Chaque tâche reste reliée au dossier, à la mission, à son owner, à sa preuve et à sa décision d’acceptation."/>
        <div className={styles.commandToolbar}><label className={styles.searchField}><Search size={14}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher tâche, owner, dossier ou mission…"/></label><select value={missionFilter} onChange={(event) => setMissionFilter(event.target.value)}><option value="">Toutes les missions</option>{missions.map((mission) => <option key={mission}>{mission}</option>)}</select><button className={styles.quietButton} type="button" onClick={() => { setQueue("all"); setMissionFilter(""); setQuery("") }}><Filter size={14}/>Réinitialiser</button></div>
        {Object.keys(grouped).length ? <div className={styles.missionConstellations}>{Object.entries(grouped).map(([mission, states]) => <article className={styles.constellation} key={mission}><header className={styles.constellationHeader}><div><strong>{mission}</strong><p>{states.length} unité(s) · {states.filter((state) => state.openBlockers).length} blocage(s) · {states.filter((state) => state.meta.workState === "submitted").length} en révision</p></div><StatusPill tone={states.some((state) => state.openBlockers) ? "danger" : "info"}>{states.some((state) => state.openBlockers) ? "Intervention" : "En orchestration"}</StatusPill></header><div className={styles.constellationTasks}>{states.map((state, index) => <button type="button" key={state.task.id} className={`${styles.commandTaskRow} ${selected?.task.id === state.task.id ? styles.commandTaskRowSelected : ""}`} onClick={() => setSelectedId(state.task.id)}><span className={styles.commandTaskIndex}>{String(index + 1).padStart(2, "0")}</span><div><strong>{state.task.title}</strong><p>{state.nextAction}</p><span className={styles.rowMeta}><span>{state.task.owner || "Owner manquant"}</span><span>{state.item?.title || "Dossier non résolu"}</span><span>{humanDate(state.task.dueDate)}</span></span></div><StatusPill tone={statusTone(state.task, state)}>{state.openBlockers ? "Bloquée" : state.meta.workState.replaceAll("_", " ")}</StatusPill></button>)}</div></article>)}</div> : <OperationalEmpty title="Aucune tâche dans cette vue" detail="Modifiez les filtres ou constituez une tâche avec un résultat, un owner, une preuve et une condition d’acceptation."/>}
      </section>

      <aside className={styles.taskInspector}>
        {selected ? <>
          <section className={styles.inspectorHero}><small>SELECTED EXECUTION OBJECT</small><h2>{selected.task.title}</h2><p>{selected.meta.objective || selected.task.notes || "Objectif opérationnel non documenté."}</p><div className={styles.inspectorFacts}><div><small>Owner</small><strong>{selected.task.owner || "À affecter"}</strong></div><div><small>Échéance</small><strong>{humanDate(selected.task.dueDate)}</strong></div><div><small>Mission</small><strong>{selected.meta.missionId || "Non renseignée"}</strong></div><div><small>État</small><strong>{selected.meta.workState.replaceAll("_", " ")}</strong></div></div></section>
          <section className={styles.inspectorSection}><h3>Prochaine action gouvernée</h3><GovernanceNotice kind={selected.openBlockers ? "danger" : selected.openClarifications ? "warning" : "info"} title={selected.nextAction}>{selected.openBlockers ? `${selected.openBlockers} blocage(s) empêchent une progression valide.` : selected.openClarifications ? `${selected.openClarifications} clarification(s) nécessitent une réponse.` : "La tâche peut être ouverte dans son poste d’exécution sans perdre le contexte actuel."}</GovernanceNotice></section>
          <section className={styles.inspectorSection}><h3>Constitution observable</h3><div className={styles.inspectorList}><div>Résultat : {selected.meta.requiredOutput || selected.meta.completionDefinition || "À définir"}</div><div>Preuve : {selected.meta.evidenceRequirement || "À définir"}</div><div>Réviseur : {selected.meta.reviewer || "À désigner"}</div><div>Dépendances : {selected.meta.dependencyIds.length || 0}</div></div></section>
          <section className={styles.inspectorSection}><h3>Pression et historique</h3><div className={styles.inspectorList}><div>{selected.openBlockers} blocage(s) ouvert(s)</div><div>{selected.openClarifications} clarification(s) ouverte(s)</div><div>{selected.submittedEvidence} preuve(s) soumise(s)</div><div>{readTaskActivity().filter((event) => event.taskId === selected.task.id).length} événement(s) tracé(s)</div></div></section>
          <div className={styles.inspectorActions}><Link href={bulk3ContextHref(`/market-os/content-command-center/tasks/execution?task=${selected.task.id}`, { dossierId: selected.task.contentId, missionId: selected.meta.missionId, taskId: selected.task.id, returnTo: "/market-os/content-command-center/tasks" })}><Target size={14}/>Ouvrir le poste d’exécution</Link><Link href={bulk3ContextHref(`/market-os/content-command-center/tasks/${selected.task.id}`, { dossierId: selected.task.contentId, missionId: selected.meta.missionId, taskId: selected.task.id, returnTo: "/market-os/content-command-center/tasks" })}><History size={14}/>Chronique</Link><Link href={bulk3ContextHref(`/market-os/content-command-center/tasks/${selected.task.id}/edit`, { dossierId: selected.task.contentId, missionId: selected.meta.missionId, taskId: selected.task.id, returnTo: "/market-os/content-command-center/tasks" })}><GitBranch size={14}/>Amendement</Link></div>
        </> : <OperationalEmpty title="Aucune tâche sélectionnée" detail="Sélectionnez une unité d’exécution pour inspecter sa constitution, ses preuves, ses dépendances et sa prochaine action."/>}
      </aside>
    </section>

    <Bulk3Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Constituer une tâche accountable" subtitle="Une tâche doit définir le résultat, l’owner, l’échéance, la preuve et l’autorité de révision." footer={<><button className={styles.secondaryButton} onClick={() => setCreateOpen(false)}>Annuler</button><button className={styles.primaryButton} onClick={createTask} disabled={!form.title.trim() || !form.contentId}>Créer la tâche</button></>}>
      <div className={styles.formGrid}>
        <label>Titre<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}/></label>
        <label>Dossier<select value={form.contentId} onChange={(event) => setForm({ ...form, contentId: event.target.value })}><option value="">Sélectionner</option>{store.items.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
        <label>Owner<select value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })}>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select></label>
        <label>Réviseur<input value={form.reviewer} onChange={(event) => setForm({ ...form, reviewer: event.target.value })}/></label>
        <label>Échéance<input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })}/></label>
        <label>Priorité<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as ContentTask["priority"] })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
        <label className={styles.wide}>Mission / code<input value={form.missionId} onChange={(event) => setForm({ ...form, missionId: event.target.value })}/></label>
        <label className={styles.wide}>Objectif et contexte<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })}/></label>
        <label className={styles.wide}>Définition de réalisation<textarea value={form.completion} onChange={(event) => setForm({ ...form, completion: event.target.value })}/></label>
        <label className={styles.wide}>Preuve exigée<textarea value={form.evidence} onChange={(event) => setForm({ ...form, evidence: event.target.value })}/></label>
      </div>
    </Bulk3Modal>
  </Bulk3Shell></Shell>
}
