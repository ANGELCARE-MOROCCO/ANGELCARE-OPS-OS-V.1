"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  ClipboardCheck,
  FileCheck2,
  FileText,
  HelpCircle,
  History,
  Link2,
  ListChecks,
  MessageSquareWarning,
  PackageCheck,
  Plus,
  Save,
  Send,
  ShieldAlert,
  Target,
  Workflow,
} from "lucide-react"
import { Shell, loadStore, type ContentItem, type ContentTask } from "../content-command-system"
import {
  addTaskActivity,
  addTaskBlocker,
  addTaskChecklistItem,
  addTaskClarification,
  addTaskEvidence,
  readTaskActivity,
  readTaskChecklists,
  readTaskExecutionMeta,
  readTaskExecutionMetas,
  setTaskWorkState,
  toggleTaskChecklistItem,
  updateContentCommandTask,
  type TaskChecklistItem,
  type TaskExecutionMeta,
} from "@/lib/content-command/tasks/task-activity"
import { humanDate, sortTasksForCommand } from "../execution/task-operating-model"
import { bulk3ContextHref, contextFromLocation, writeBulk3Context } from "./bulk3-context"
import { bulk4ContextHref } from "../experience-bulk4/bulk4-context"
import { taskOperatingState, taskType, taskWorkstationLabel } from "./bulk3-derivations"
import type { TaskWorkstationMode } from "./bulk3-types"
import {
  Bulk3Modal,
  Bulk3Shell,
  ExperienceHeader,
  GovernanceNotice,
  IdentityBridge,
  OperationalEmpty,
  ReturnContext,
  SectionTitle,
  StatusPill,
  EvidenceTile,
  ActivityLine,
} from "./Bulk3Shared"
import styles from "./bulk3-experience.module.css"

const workstationModes: Array<{ key: TaskWorkstationMode; label: string }> = [
  { key: "mandate", label: "Mandat" },
  { key: "work", label: "Exécution" },
  { key: "inputs", label: "Entrées" },
  { key: "evidence", label: "Preuves" },
  { key: "history", label: "Historique" },
]

function workTone(state: TaskExecutionMeta["workState"]): "neutral" | "success" | "warning" | "danger" | "info" {
  if (state === "completed") return "success"
  if (state === "blocked") return "danger"
  if (["submitted", "returned", "awaiting_clarification", "preparing_evidence"].includes(state)) return "warning"
  if (["active", "accepted"].includes(state)) return "info"
  return "neutral"
}

export default function Bulk3TaskExecutionWorkspace() {
  const [tasks, setTasks] = React.useState<ContentTask[]>([])
  const [items, setItems] = React.useState<ContentItem[]>([])
  const [selectedId, setSelectedId] = React.useState("")
  const [meta, setMeta] = React.useState<TaskExecutionMeta | null>(null)
  const [checklist, setChecklist] = React.useState<TaskChecklistItem[]>([])
  const [mode, setMode] = React.useState<TaskWorkstationMode>("mandate")
  const [notice, setNotice] = React.useState("")
  const [checkInput, setCheckInput] = React.useState("")
  const [evidenceOpen, setEvidenceOpen] = React.useState(false)
  const [blockerOpen, setBlockerOpen] = React.useState(false)
  const [clarificationOpen, setClarificationOpen] = React.useState(false)
  const [context, setContext] = React.useState<ReturnType<typeof contextFromLocation>>({ returnTo: "/market-os/content-command-center/tasks" })
  const [evidenceForm, setEvidenceForm] = React.useState({ type: "link", label: "", url: "", note: "" })
  const [blockerForm, setBlockerForm] = React.useState({ type: "information", description: "", severity: "medium", owner: "", consequence: "" })
  const [clarificationForm, setClarificationForm] = React.useState({ question: "", requestedFrom: "", dueDate: "", impactedArea: "" })

  const reload = React.useCallback((preferred?: string) => {
    const store = loadStore()
    const metas = readTaskExecutionMetas()
    const ordered = sortTasksForCommand(store.tasks, metas)
    const location = contextFromLocation("/market-os/content-command-center/tasks")
    const routeId = location.taskId || preferred
    const fallback = ordered.find((task) => task.status === "doing") || ordered.find((task) => task.status !== "done") || ordered[0]
    const nextId = routeId && ordered.some((task) => task.id === routeId) ? routeId : fallback?.id || ""
    setContext(location)
    setTasks(ordered)
    setItems(store.items)
    setSelectedId(nextId)
    setMeta(nextId ? readTaskExecutionMeta(nextId) : null)
    setChecklist(nextId ? readTaskChecklists().filter((item) => item.taskId === nextId) : [])
  }, [])

  React.useEffect(() => { reload() }, [reload])
  const task = tasks.find((candidate) => candidate.id === selectedId) || null
  const item = task ? items.find((candidate) => candidate.id === task.contentId) || null : null
  const operating = task && meta ? taskOperatingState(task, item, meta, checklist) : null
  const history = task ? readTaskActivity().filter((event) => event.taskId === task.id) : []
  const type = task && meta ? taskType(task, meta) : "execution"

  React.useEffect(() => {
    if (!task || !meta) return
    writeBulk3Context({
      dossierId: task.contentId,
      dossierTitle: item?.title,
      missionId: meta.missionId || context.missionId,
      taskId: task.id,
      taskTitle: task.title,
      stage: "task-execution",
      sourceHref: `/market-os/content-command-center/tasks/execution?task=${task.id}`,
      returnTo: context.returnTo || "/market-os/content-command-center/tasks",
      updatedAt: new Date().toISOString(),
    })
  }, [task, meta, item, context])

  function chooseTask(id: string) {
    setSelectedId(id)
    setMeta(readTaskExecutionMeta(id))
    setChecklist(readTaskChecklists().filter((item) => item.taskId === id))
    setMode("mandate")
    setNotice("")
  }

  function changeState(state: TaskExecutionMeta["workState"]) {
    if (!task) return
    setTaskWorkState(task.id, state)
    if (state === "active") updateContentCommandTask(task.id, (current) => ({ ...current, status: "doing" }))
    if (state === "blocked") updateContentCommandTask(task.id, (current) => ({ ...current, status: "blocked" }))
    if (state === "completed") updateContentCommandTask(task.id, (current) => ({ ...current, status: "done" }))
    setNotice(`État de travail enregistré : ${state.replaceAll("_", " ")}.`)
    reload(task.id)
  }

  function addChecklist() {
    if (!task || !checkInput.trim()) return
    addTaskChecklistItem(task.id, checkInput.trim(), { required: true })
    setCheckInput("")
    setNotice("Critère d’exécution ajouté à la checklist gouvernée.")
    reload(task.id)
  }

  function addEvidence() {
    if (!task || !evidenceForm.label.trim()) return
    addTaskEvidence(task.id, {
      type: evidenceForm.type as "capture" | "document" | "source" | "export" | "preview" | "video" | "link" | "confirmation",
      label: evidenceForm.label.trim(),
      url: evidenceForm.url.trim() || undefined,
      note: evidenceForm.note.trim() || undefined,
      state: "submitted",
      submittedAt: new Date().toISOString(),
    })
    setTaskWorkState(task.id, "preparing_evidence", "Preuve ajoutée au dossier de tâche.")
    setEvidenceForm({ type: "link", label: "", url: "", note: "" })
    setEvidenceOpen(false)
    setNotice("Preuve enregistrée. Elle reste distincte de l’acceptation humaine.")
    reload(task.id)
  }

  function addBlocker() {
    if (!task || !blockerForm.description.trim()) return
    addTaskBlocker(task.id, {
      type: blockerForm.type as "information" | "approval" | "owner" | "source" | "asset" | "dependency" | "technical" | "brand" | "scope" | "capacity" | "review" | "external",
      description: blockerForm.description.trim(),
      severity: blockerForm.severity as "low" | "medium" | "high" | "critical",
      owner: blockerForm.owner.trim(),
      state: "open",
      consequence: blockerForm.consequence.trim() || undefined,
    })
    setBlockerForm({ type: "information", description: "", severity: "medium", owner: "", consequence: "" })
    setBlockerOpen(false)
    setNotice("Blocage déclaré avec owner et conséquence. La tâche ne peut plus progresser silencieusement.")
    reload(task.id)
  }

  function addClarification() {
    if (!task || !clarificationForm.question.trim()) return
    addTaskClarification(task.id, {
      question: clarificationForm.question.trim(),
      requestedFrom: clarificationForm.requestedFrom.trim(),
      dueDate: clarificationForm.dueDate || undefined,
      impactedArea: clarificationForm.impactedArea.trim() || undefined,
      state: "open",
    })
    setClarificationForm({ question: "", requestedFrom: "", dueDate: "", impactedArea: "" })
    setClarificationOpen(false)
    setNotice("Clarification enregistrée séparément d’un blocage.")
    reload(task.id)
  }

  function submitForReview() {
    if (!task || !meta || !operating?.readinessReady) return
    setTaskWorkState(task.id, "submitted", "Résultat soumis avec critères et preuve.")
    updateContentCommandTask(task.id, (current) => ({ ...current, status: "doing" }))
    addTaskActivity(task.id, "submitted_for_review", `Soumis à ${meta.reviewer || "l’autorité de révision à désigner"}.`)
    setNotice("Soumission enregistrée. La tâche reste distincte d’une acceptation humaine.")
    reload(task.id)
  }

  if (!tasks.length) return <Shell><Bulk3Shell><ExperienceHeader eyebrow="FOCUSED EXECUTION WORKSTATION" title="Aucune tâche réelle à exécuter" description="Le poste d’exécution ne crée aucun travail fictif. Constituez une tâche depuis Task Command avec un résultat, une preuve et une autorité de révision." actions={<Link className={styles.primaryButton} href="/market-os/content-command-center/tasks"><Plus size={15}/>Task Command</Link>}/><OperationalEmpty title="Registre vide" detail="Aucune tâche n’est exposée par le registre Content Command actuel."/></Bulk3Shell></Shell>
  if (!task || !meta || !operating) return null

  const completionMissing = operating.readinessMissing
  const typeDescription = ({
    research: "Qualifier les sources, produire l’analyse et conserver la lignée de preuve.",
    review: "Répondre aux findings, comparer les versions et prouver la correction.",
    planning: "Orchestrer les dates, dépendances et conséquences sans inventer la capacité.",
    evidence: "Constituer une preuve exploitable, traçable et distincte de son acceptation.",
    production: "Produire le résultat attendu sous contraintes de brief, source et doctrine.",
    execution: "Exécuter le mandat, prouver le résultat et préparer la décision humaine.",
  } as const)[type]

  return <Shell><Bulk3Shell>
    <ReturnContext href={context.returnTo}/>
    <ExperienceHeader eyebrow="FOCUSED EXECUTION WORKSTATION / ANGELCARE" title="Exécuter une responsabilité sans perdre le dossier, la mission ni la définition de réussite." description="Le poste adapte son corps de travail au type de tâche, maintient les entrées accessibles, sépare clarification et blocage, puis exige des preuves avant toute soumission." actions={<><Link className={styles.secondaryButton} href={bulk3ContextHref("/market-os/content-command-center/tasks", { dossierId: task.contentId, missionId: meta.missionId, taskId: task.id, returnTo: context.returnTo })}><ListChecks size={15}/>Task Command</Link><button className={styles.primaryButton} type="button" onClick={() => changeState(meta.workState === "active" ? "paused" : "active")}>{meta.workState === "active" ? <CirclePause size={15}/> : <CirclePlay size={15}/>} {meta.workState === "active" ? "Mettre en pause" : "Démarrer"}</button></>}/>
    {notice ? <GovernanceNotice kind={notice.includes("Blocage") ? "danger" : "success"} title="Synchronisation de tâche">{notice}</GovernanceNotice> : null}
    <IdentityBridge code={`AC-TASK-${task.id.slice(-6).toUpperCase()}`} title={task.title} meta={[
      { label: "Dossier", value: item?.title || task.contentId || "Non relié" },
      { label: "Mission", value: meta.missionId || "Non renseignée" },
      { label: "Owner", value: task.owner || "À affecter" },
      { label: "Réviseur", value: meta.reviewer || "À désigner" },
      { label: "Échéance", value: humanDate(task.dueDate) },
    ]} state={<StatusPill tone={workTone(meta.workState)}>{meta.workState.replaceAll("_", " ")}</StatusPill>} dominantAction={operating.nextAction} onDominantAction={() => setMode(completionMissing.length ? "mandate" : "work")}/>

    <section className={styles.workstation}>
      <aside className={styles.workMandate}>
        <div className={styles.mandateTop}><small>WORK MANDATE</small><h2>{task.title}</h2><p>{meta.objective || task.notes || "Objectif non documenté. La tâche reste incomplète tant que sa raison d’être n’est pas claire."}</p><div className={styles.mandateFacts}><div><small>État</small><strong>{meta.workState.replaceAll("_", " ")}</strong></div><div><small>Priorité</small><strong>{task.priority}</strong></div><div><small>Owner</small><strong>{task.owner || "À affecter"}</strong></div><div><small>Réviseur</small><strong>{meta.reviewer || "À désigner"}</strong></div></div></div>
        <div className={styles.taskPicker}><label>Tâche active</label><select value={task.id} onChange={(event) => chooseTask(event.target.value)}>{tasks.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select></div>
        <div className={styles.mandateRequirement}><small>Résultat requis</small><strong>{meta.requiredOutput || meta.completionDefinition || "Résultat à constituer"}</strong></div>
        <div className={styles.mandateRequirement}><small>Périmètre</small><strong>{meta.scope || "Périmètre non documenté"}</strong></div>
        <div className={styles.mandateRequirement}><small>Hors périmètre</small><strong>{meta.outOfScope || "Exclusions non documentées"}</strong></div>
        <div className={styles.materialActions} style={{ marginTop: 12 }}><button type="button" onClick={() => setClarificationOpen(true)}><HelpCircle size={13}/>Clarification</button><button className={styles.blocker} type="button" onClick={() => setBlockerOpen(true)}><ShieldAlert size={13}/>Blocage</button></div>
      </aside>

      <section className={styles.workingSurface}>
        <div className={styles.workstationTabs}>{workstationModes.map((entry) => <button type="button" key={entry.key} aria-pressed={mode === entry.key} onClick={() => setMode(entry.key)}>{entry.label}</button>)}</div>
        <div className={styles.taskTypeBanner}><span><i>{type === "research" ? <BookOpenCheck size={18}/> : type === "review" ? <ShieldAlert size={18}/> : type === "evidence" ? <FileCheck2 size={18}/> : type === "production" ? <PackageCheck size={18}/> : <Target size={18}/>}</i><div><strong>{taskWorkstationLabel(task, meta)}</strong><p>{typeDescription}</p></div></span><StatusPill tone={workTone(meta.workState)}>{meta.workState.replaceAll("_", " ")}</StatusPill></div>
        {type === "production" ? <section className={styles.creativeHandover}><div><PackageCheck size={20}/><span><small>BULK 4 · CREATIVE CONTEXT</small><strong>Le mandat ouvre le studio avec le dossier et la tâche préservés</strong><p>Choisissez l’environnement correspondant au résultat attendu. La version produite reste distincte de la preuve et de son acceptation.</p></span></div><div><Link href={bulk4ContextHref("/market-os/content-command-center/studio/digital", { dossierId: task.contentId, dossierTitle: item?.title, missionId: meta.missionId, taskId: task.id, studio: "digital", returnTo: `/market-os/content-command-center/tasks/execution?task=${task.id}` })}>Digital Studio <ArrowRight size={13}/></Link><Link href={bulk4ContextHref("/market-os/content-command-center/studio/print", { dossierId: task.contentId, dossierTitle: item?.title, missionId: meta.missionId, taskId: task.id, studio: "print", returnTo: `/market-os/content-command-center/tasks/execution?task=${task.id}` })}>Print & Field <ArrowRight size={13}/></Link><Link href={bulk4ContextHref("/market-os/content-command-center/studio/documents", { dossierId: task.contentId, dossierTitle: item?.title, missionId: meta.missionId, taskId: task.id, studio: "documents", returnTo: `/market-os/content-command-center/tasks/execution?task=${task.id}` })}>Documentation <ArrowRight size={13}/></Link></div></section> : null}

        {mode === "mandate" ? <div className={styles.executionCanvas}><section className={styles.objectivePanel}><small>WHY THIS WORK EXISTS</small><h3>{meta.objective || task.notes || "Objectif à compléter"}</h3><p>Mission : {meta.missionId || "non renseignée"}. Dossier : {item?.title || task.contentId || "non résolu"}. L’owner doit pouvoir expliquer le résultat attendu avant de commencer.</p></section><div className={styles.criteriaGrid}><section className={styles.criteriaPanel}><h3>Définition de réalisation</h3><p>{meta.completionDefinition || "Non définie"}</p></section><section className={styles.criteriaPanel}><h3>Critères d’acceptation</h3><p>{meta.acceptanceCriteria || "Non définis"}</p></section><section className={styles.criteriaPanel}><h3>Preuve exigée</h3><p>{meta.evidenceRequirement || "Non définie"}</p></section><section className={styles.criteriaPanel}><h3>Exigence de revue</h3><p>{meta.reviewRequirement || meta.reviewer || "Non définie"}</p></section></div>{completionMissing.length ? <GovernanceNotice kind="warning" title="Constitution incomplète">{completionMissing.join(" · ")}</GovernanceNotice> : <GovernanceNotice kind="success" title="Mandat exploitable">Les conditions observables sont présentes. La preuve et la décision de révision restent obligatoires.</GovernanceNotice>}</div> : null}

        {mode === "work" ? <div className={styles.executionCanvas}><SectionTitle eyebrow="EXECUTION CHECKLIST" title="Critères à satisfaire avant soumission" description="La checklist représente des obligations réelles, pas un pourcentage décoratif."/><div className={styles.executionChecklist}>{checklist.map((entry) => <div key={entry.id} className={`${styles.checkRow} ${entry.done ? styles.checkRowDone : ""}`}><button type="button" onClick={() => { toggleTaskChecklistItem(entry.id); reload(task.id) }} aria-label={entry.done ? `Rouvrir ${entry.label}` : `Terminer ${entry.label}`}>{entry.done ? <Check size={13}/> : null}</button><div><strong>{entry.label}</strong><small>{entry.required ? "Obligatoire" : "Optionnelle"}{entry.evidenceLinked ? " · preuve liée" : ""}</small></div><StatusPill tone={entry.done ? "success" : "warning"}>{entry.done ? "Satisfaite" : "À traiter"}</StatusPill></div>)}</div><div className={styles.checkInput}><input value={checkInput} onChange={(event) => setCheckInput(event.target.value)} placeholder="Ajouter un critère d’exécution réel…"/><button type="button" onClick={addChecklist}><Plus size={13}/>Ajouter</button></div><section className={styles.submissionGate}><header><div><h3>Submission gate</h3><p>Une soumission ne devient jamais une acceptation automatique.</p></div><StatusPill tone={operating.readinessReady ? "success" : "warning"}>{operating.readinessReady ? "Prête" : "Incomplète"}</StatusPill></header><div className={styles.submissionRequirements}>{completionMissing.map((entry) => <StatusPill key={entry} tone="warning">{entry}</StatusPill>)}{!completionMissing.length ? <StatusPill tone="success">Mandat complet</StatusPill> : null}</div><button type="button" onClick={submitForReview} disabled={!operating.readinessReady}><Send size={14}/>Soumettre à {meta.reviewer || "l’autorité de révision"}</button></section></div> : null}

        {mode === "inputs" ? <div className={styles.executionCanvas}><SectionTitle eyebrow="INPUTS & MATERIALS" title="Travailler avec les bons éléments, sans perdre le contexte" description="Les entrées disponibles sont exposées; les entrées absentes restent explicitement manquantes."/><div className={styles.criteriaGrid}><section className={styles.criteriaPanel}><h3>Dossier</h3><p>{item?.title || task.contentId || "Dossier non résolu"}</p>{item ? <Link className={styles.quietButton} href={bulk3ContextHref(`/market-os/content-command-center/${item.id}`, { dossierId: item.id, missionId: meta.missionId, taskId: task.id, returnTo: `/market-os/content-command-center/tasks/execution?task=${task.id}` })}>Ouvrir le dossier <ArrowRight size={13}/></Link> : null}</section><section className={styles.criteriaPanel}><h3>Mission</h3><p>{meta.missionId || "Aucune mission renseignée"}</p><Link className={styles.quietButton} href={bulk3ContextHref("/market-os/content-command-center/missions", { dossierId: task.contentId, missionId: meta.missionId, taskId: task.id, returnTo: `/market-os/content-command-center/tasks/execution?task=${task.id}` })}>Mission Control <ArrowRight size={13}/></Link></section><section className={styles.criteriaPanel}><h3>Source requise</h3><p>{meta.sourceRequirement || "Aucune exigence de source documentée"}</p></section><section className={styles.criteriaPanel}><h3>Dépendances</h3><p>{meta.dependencyIds.length ? meta.dependencyIds.join(", ") : "Aucune dépendance documentée"}</p></section></div></div> : null}

        {mode === "evidence" ? <div className={styles.executionCanvas}><SectionTitle eyebrow="EVIDENCE TRAY" title="Prouver le résultat sans confondre soumission et acceptation" description="Chaque preuve conserve son type, sa référence, sa note et son état." action={<button className={styles.primaryButton} onClick={() => setEvidenceOpen(true)}><Plus size={13}/>Ajouter une preuve</button>}/><div className={styles.materialList}>{meta.evidences.length ? meta.evidences.map((evidence) => <EvidenceTile key={evidence.id} label={evidence.label} state={evidence.state} note={evidence.note} href={evidence.url}/>) : <OperationalEmpty title="Aucune preuve enregistrée" detail={meta.evidenceRequirement || "L’exigence de preuve doit être définie avant soumission."}/>}</div></div> : null}

        {mode === "history" ? <div className={styles.executionCanvas}><SectionTitle eyebrow="ACCOUNTABILITY HISTORY" title="Ce qui s’est réellement passé" description="Les événements locaux existants sont affichés comme historique du registre actuel, sans fabriquer d’acteur ou de décision." action={<Link className={styles.quietButton} href={bulk3ContextHref(`/market-os/content-command-center/tasks/${task.id}`, { dossierId: task.contentId, missionId: meta.missionId, taskId: task.id, returnTo: `/market-os/content-command-center/tasks/execution?task=${task.id}` })}><History size={13}/>Chronique complète</Link>}/>{history.length ? history.map((event) => <ActivityLine key={event.id} title={event.action.replaceAll("_", " ")} detail={event.detail} date={humanDate(event.timestamp)}/>) : <OperationalEmpty title="Aucun événement" detail="Aucune activité n’est enregistrée pour cette tâche dans le registre existant."/>}</div> : null}
      </section>

      <aside className={styles.materialsDock}>
        <SectionTitle eyebrow="MATERIALS & AUTHORITY" title="Entrées accessibles" description="Les matériaux restent disponibles sans quitter le poste."/>
        <section className={styles.materialSection}><h3>Mandat de mission</h3><div className={styles.materialList}><div className={styles.materialItem}><div><strong>{meta.missionId || "Mission non renseignée"}</strong><small>Origine opérationnelle</small></div><Workflow size={15}/></div><div className={styles.materialItem}><div><strong>{item?.title || task.contentId || "Dossier non résolu"}</strong><small>Contexte institutionnel</small></div><FileText size={15}/></div></div></section>
        <section className={styles.materialSection}><h3>Pression actuelle</h3><div className={styles.materialList}><div className={styles.materialItem}><div><strong>{operating.openBlockers} blocage(s)</strong><small>Empêchent une progression valide</small></div><ShieldAlert size={15}/></div><div className={styles.materialItem}><div><strong>{operating.openClarifications} clarification(s)</strong><small>Réponse attendue</small></div><HelpCircle size={15}/></div><div className={styles.materialItem}><div><strong>{meta.evidences.length} preuve(s)</strong><small>{operating.acceptedEvidence} acceptée(s)</small></div><FileCheck2 size={15}/></div></div></section>
        <section className={styles.materialSection}><h3>Actions gouvernées</h3><div className={styles.materialActions}><button type="button" onClick={() => changeState("accepted")}><CheckCircle2 size={13}/>Accepter</button><button type="button" onClick={() => changeState("active")}><CirclePlay size={13}/>Démarrer</button><button type="button" onClick={() => setEvidenceOpen(true)}><FileCheck2 size={13}/>Preuve</button><button className={styles.blocker} type="button" onClick={() => setBlockerOpen(true)}><AlertTriangle size={13}/>Bloquer</button></div></section>
        <section className={styles.materialSection}><h3>Amendement et forensic</h3><div className={styles.materialActions}><Link className={styles.quietButton} href={bulk3ContextHref(`/market-os/content-command-center/tasks/${task.id}`, { dossierId: task.contentId, missionId: meta.missionId, taskId: task.id, returnTo: `/market-os/content-command-center/tasks/execution?task=${task.id}` })}><History size={13}/>Chronique</Link><Link className={styles.quietButton} href={bulk3ContextHref(`/market-os/content-command-center/tasks/${task.id}/edit`, { dossierId: task.contentId, missionId: meta.missionId, taskId: task.id, returnTo: `/market-os/content-command-center/tasks/execution?task=${task.id}` })}><Save size={13}/>Amendement</Link></div></section>
      </aside>
    </section>

    <Bulk3Modal open={evidenceOpen} onClose={() => setEvidenceOpen(false)} title="Ajouter une preuve" subtitle="La preuve sera enregistrée comme soumise, pas comme acceptée." footer={<><button className={styles.secondaryButton} onClick={() => setEvidenceOpen(false)}>Annuler</button><button className={styles.primaryButton} onClick={addEvidence} disabled={!evidenceForm.label.trim()}>Enregistrer la preuve</button></>}><div className={styles.formGrid}><label>Type<select value={evidenceForm.type} onChange={(event) => setEvidenceForm({ ...evidenceForm, type: event.target.value })}>{["link","capture","document","source","export","preview","video","confirmation"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Libellé<input value={evidenceForm.label} onChange={(event) => setEvidenceForm({ ...evidenceForm, label: event.target.value })}/></label><label className={styles.wide}>URL / référence<input value={evidenceForm.url} onChange={(event) => setEvidenceForm({ ...evidenceForm, url: event.target.value })}/></label><label className={styles.wide}>Note<textarea value={evidenceForm.note} onChange={(event) => setEvidenceForm({ ...evidenceForm, note: event.target.value })}/></label></div></Bulk3Modal>

    <Bulk3Modal open={blockerOpen} onClose={() => setBlockerOpen(false)} title="Déclarer un blocage" subtitle="Un blocage signifie que l’exécution ne peut pas progresser validement." footer={<><button className={styles.secondaryButton} onClick={() => setBlockerOpen(false)}>Annuler</button><button className={styles.primaryButton} onClick={addBlocker} disabled={!blockerForm.description.trim()}>Déclarer le blocage</button></>}><div className={styles.formGrid}><label>Type<select value={blockerForm.type} onChange={(event) => setBlockerForm({ ...blockerForm, type: event.target.value })}>{["information","approval","owner","source","asset","dependency","technical","brand","scope","capacity","review","external"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Sévérité<select value={blockerForm.severity} onChange={(event) => setBlockerForm({ ...blockerForm, severity: event.target.value })}>{["low","medium","high","critical"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Owner de résolution<input value={blockerForm.owner} onChange={(event) => setBlockerForm({ ...blockerForm, owner: event.target.value })}/></label><label className={styles.wide}>Description<textarea value={blockerForm.description} onChange={(event) => setBlockerForm({ ...blockerForm, description: event.target.value })}/></label><label className={styles.wide}>Conséquence<textarea value={blockerForm.consequence} onChange={(event) => setBlockerForm({ ...blockerForm, consequence: event.target.value })}/></label></div></Bulk3Modal>

    <Bulk3Modal open={clarificationOpen} onClose={() => setClarificationOpen(false)} title="Demander une clarification" subtitle="La clarification permet de continuer partiellement; elle ne doit pas être confondue avec un blocage." footer={<><button className={styles.secondaryButton} onClick={() => setClarificationOpen(false)}>Annuler</button><button className={styles.primaryButton} onClick={addClarification} disabled={!clarificationForm.question.trim()}>Enregistrer la demande</button></>}><div className={styles.formGrid}><label>Demandée à<input value={clarificationForm.requestedFrom} onChange={(event) => setClarificationForm({ ...clarificationForm, requestedFrom: event.target.value })}/></label><label>Échéance<input type="date" value={clarificationForm.dueDate} onChange={(event) => setClarificationForm({ ...clarificationForm, dueDate: event.target.value })}/></label><label className={styles.wide}>Question<textarea value={clarificationForm.question} onChange={(event) => setClarificationForm({ ...clarificationForm, question: event.target.value })}/></label><label className={styles.wide}>Zone impactée<input value={clarificationForm.impactedArea} onChange={(event) => setClarificationForm({ ...clarificationForm, impactedArea: event.target.value })}/></label></div></Bulk3Modal>
  </Bulk3Shell></Shell>
}
