"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CirclePause,
  CirclePlay,
  CircleStop,
  ClipboardCheck,
  FileCheck2,
  HelpCircle,
  Link2,
  ListChecks,
  LockKeyhole,
  MessageSquareWarning,
  Plus,
  Send,
  ShieldCheck,
  Target,
} from "lucide-react"
import {
  Shell,
  loadStore,
  statusLabel,
  type ContentItem,
  type ContentTask,
} from "@/components/market-os/content-command/content-command-system"
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
  saveTaskExecutionMeta,
  setTaskWorkState,
  toggleTaskChecklistItem,
  updateContentCommandTask,
  type TaskChecklistItem,
  type TaskExecutionMeta,
} from "@/lib/content-command/tasks/task-activity"
import {
  humanDate,
  sortTasksForCommand,
  taskLineage,
  taskNextAction,
  taskReadiness,
} from "../execution/task-operating-model"
import {
  EmptyState,
  ExecutionBadge,
  ExecutionModal,
  ExecutionPanel,
  ProgressBar,
  SectionHeading,
  StatusMessage,
  toneForStatus,
} from "../execution/execution-ui"
import styles from "../execution/execution-command.module.css"

const workStates: Array<{ value: TaskExecutionMeta["workState"]; label: string; icon: React.ReactNode }> = [
  { value: "accepted", label: "Prendre en charge", icon: <Check size={14}/> },
  { value: "active", label: "Démarrer", icon: <CirclePlay size={14}/> },
  { value: "paused", label: "Mettre en pause", icon: <CirclePause size={14}/> },
  { value: "blocked", label: "Bloquer", icon: <CircleStop size={14}/> },
  { value: "preparing_evidence", label: "Préparer la preuve", icon: <FileCheck2 size={14}/> },
  { value: "submitted", label: "Soumis", icon: <Send size={14}/> },
]

export function TaskExecutionCommandCenter() {
  const [tasks, setTasks] = React.useState<ContentTask[]>([])
  const [items, setItems] = React.useState<ContentItem[]>([])
  const [selectedId, setSelectedId] = React.useState("")
  const [meta, setMeta] = React.useState<TaskExecutionMeta | null>(null)
  const [checklist, setChecklist] = React.useState<TaskChecklistItem[]>([])
  const [announcement, setAnnouncement] = React.useState("")
  const [checkInput, setCheckInput] = React.useState("")
  const [evidenceOpen, setEvidenceOpen] = React.useState(false)
  const [blockerOpen, setBlockerOpen] = React.useState(false)
  const [clarificationOpen, setClarificationOpen] = React.useState(false)
  const [evidenceForm, setEvidenceForm] = React.useState({ type: "link", label: "", url: "", note: "" })
  const [blockerForm, setBlockerForm] = React.useState({ type: "information", description: "", severity: "medium", owner: "", consequence: "" })
  const [clarificationForm, setClarificationForm] = React.useState({ question: "", requestedFrom: "", dueDate: "", impactedArea: "" })

  const reload = React.useCallback((preferred?: string) => {
    const store = loadStore()
    const metas = readTaskExecutionMetas()
    const ordered = sortTasksForCommand(store.tasks, metas)
    const routeId = (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("task") : null) || preferred
    const fallback = ordered.find((task) => task.status === "doing") || ordered.find((task) => task.status !== "done") || ordered[0]
    const nextId = routeId && ordered.some((task) => task.id === routeId) ? routeId : fallback?.id || ""
    setTasks(ordered)
    setItems(store.items)
    setSelectedId(nextId)
    if (nextId) {
      setMeta(readTaskExecutionMeta(nextId))
      setChecklist(readTaskChecklists().filter((item) => item.taskId === nextId))
    } else {
      setMeta(null)
      setChecklist([])
    }
  }, [])

  React.useEffect(() => { reload() }, [reload])

  const task = tasks.find((candidate) => candidate.id === selectedId) || null
  const linkedContent = task ? items.find((item) => item.id === task.contentId) || null : null
  const activity = task ? readTaskActivity().filter((event) => event.taskId === task.id) : []
  const readiness = task && meta ? taskReadiness(task, meta, checklist) : { score: 0, ready: false, missing: [] }
  const lineage = task ? taskLineage(task, linkedContent, meta || undefined) : []
  const nextTask = task && meta?.successorIds.length ? tasks.find((candidate) => candidate.id === meta.successorIds[0]) : null

  function selectTask(id: string) {
    setSelectedId(id)
    setMeta(readTaskExecutionMeta(id))
    setChecklist(readTaskChecklists().filter((item) => item.taskId === id))
    setAnnouncement("")
  }

  function changeWorkState(workState: TaskExecutionMeta["workState"]) {
    if (!task) return
    setTaskWorkState(task.id, workState)
    if (workState === "active") updateContentCommandTask(task.id, (current) => ({ ...current, status: "doing" }))
    if (workState === "blocked") updateContentCommandTask(task.id, (current) => ({ ...current, status: "blocked" }))
    if (workState === "completed") updateContentCommandTask(task.id, (current) => ({ ...current, status: "done" }))
    setAnnouncement(`État de travail enregistré : ${workState.replaceAll("_", " ")}.`)
    reload(task.id)
  }

  function addChecklist() {
    if (!task || !checkInput.trim()) return
    addTaskChecklistItem(task.id, checkInput.trim(), { required: true })
    setCheckInput("")
    setAnnouncement("Étape obligatoire ajoutée à la checklist.")
    reload(task.id)
  }

  function toggleChecklist(id: string) {
    if (!task) return
    toggleTaskChecklistItem(id)
    reload(task.id)
  }

  function submitEvidence() {
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
    setEvidenceOpen(false)
    setEvidenceForm({ type: "link", label: "", url: "", note: "" })
    setAnnouncement("Preuve enregistrée. La soumission reste distincte de la décision de révision.")
    reload(task.id)
  }

  function submitBlocker() {
    if (!task || !blockerForm.description.trim()) return
    addTaskBlocker(task.id, {
      type: blockerForm.type as "information" | "approval" | "owner" | "source" | "asset" | "dependency" | "technical" | "brand" | "scope" | "capacity" | "review" | "external",
      description: blockerForm.description.trim(),
      severity: blockerForm.severity as "low" | "medium" | "high" | "critical",
      owner: blockerForm.owner.trim(),
      state: "open",
      consequence: blockerForm.consequence.trim() || undefined,
    })
    setBlockerOpen(false)
    setAnnouncement("Blocage déclaré. Il doit maintenant être affecté et résolu explicitement.")
    reload(task.id)
  }

  function submitClarification() {
    if (!task || !clarificationForm.question.trim()) return
    addTaskClarification(task.id, {
      question: clarificationForm.question.trim(),
      requestedFrom: clarificationForm.requestedFrom.trim(),
      dueDate: clarificationForm.dueDate || undefined,
      impactedArea: clarificationForm.impactedArea.trim() || undefined,
      state: "open",
    })
    setClarificationOpen(false)
    setAnnouncement("Demande de clarification enregistrée séparément du blocage.")
    reload(task.id)
  }

  function submitForReview() {
    if (!task || !meta || !readiness.ready) return
    setTaskWorkState(task.id, "submitted", "Résultat soumis à la révision avec checklist et preuve.")
    updateContentCommandTask(task.id, (current) => ({ ...current, status: "doing" }))
    addTaskActivity(task.id, "submitted_for_review", `Soumis à ${meta.reviewer || "l’autorité de révision à désigner"}.`)
    setAnnouncement("Soumission enregistrée. La tâche n’est pas considérée acceptée avant décision humaine.")
    reload(task.id)
  }

  if (!tasks.length) {
    return <Shell><main className={styles.root} data-market-os-root><section className={styles.hero}><div><span className={styles.eyebrow}><ClipboardCheck size={16}/> TASK EXECUTION</span><h1>Poste d’exécution ciblé</h1><p>Aucune tâche n’est disponible. Le système n’invente aucun travail d’exemple.</p></div></section><div style={{ marginTop: 16 }}><EmptyState title="Aucune tâche à exécuter" detail="Créez une tâche dans Task Command après avoir relié un dossier et défini un résultat." action="Ouvrir Task Command" href="/market-os/content-command-center/tasks"/></div></main></Shell>
  }

  if (!task || !meta) return null

  return <Shell>
    <main className={styles.root} data-market-os-root>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}><CirclePlay size={16}/> POSTE D’EXÉCUTION / FOCUS CONTROL</span>
          <h1>{task.title}</h1>
          <p>{taskNextAction(task, meta)} Le poste protège le périmètre, les critères de réalisation, les dépendances, la preuve et le gate de révision.</p>
        </div>
        <div className={styles.heroActions}>
          <Link className={styles.primaryButton} href={`/market-os/content-command-center/tasks/${task.id}`}><ListChecks size={16}/>Dossier complet</Link>
          <Link className={styles.secondaryButton} href={`/market-os/content-command-center/tasks/${task.id}/edit`}><LockKeyhole size={16}/>Modifier les instructions</Link>
        </div>
      </section>

      {announcement ? <StatusMessage kind="success">{announcement}</StatusMessage> : null}

      <div className={styles.lineage} style={{ marginTop: 16 }} aria-label="Lignée opérationnelle de la tâche">
        {lineage.map((node) => node.href ? <Link className={styles.lineageNode} href={node.href} key={node.label}><small>{node.label}</small><strong>{node.value}</strong></Link> : <div className={styles.lineageNode} key={node.label}><small>{node.label}</small><strong>{node.value}</strong></div>)}
      </div>

      <section className={styles.focusLayout}>
        <div style={{ display: "grid", gap: 16 }}>
          <ExecutionPanel>
            <div className={styles.panelInner}>
              <SectionHeading eyebrow="OBJECTIVE & COMPLETION STANDARD" title="Ce qui doit être produit et ce qui prouve que c’est terminé" description="Une checklist terminée n’est jamais confondue avec une tâche acceptée."/>
              <div className={styles.objectiveBlock}><small>Objectif opérationnel</small><h2>{meta.objective || task.notes || "Objectif non formalisé"}</h2><p>{meta.requiredOutput || "Le résultat attendu doit être complété dans l’éditeur avant soumission."}</p></div>
              <div className={styles.gridThree}>
                <div className={styles.scopeNeutral}><strong><Target size={15}/>Définition de réalisation</strong><p>{meta.completionDefinition || "Manquante"}</p></div>
                <div className={styles.scopeNeutral}><strong><Check size={15}/>Critères d’acceptation</strong><p>{meta.acceptanceCriteria || "Manquants"}</p></div>
                <div className={styles.scopeNeutral}><strong><ShieldCheck size={15}/>Preuve exigée</strong><p>{meta.evidenceRequirement || "Non définie"}</p></div>
              </div>
            </div>
          </ExecutionPanel>

          <ExecutionPanel>
            <div className={styles.panelInner}>
              <SectionHeading eyebrow="SCOPE GUARD" title="Périmètre visible pendant l’exécution" description="Tout travail hors périmètre doit faire l’objet d’un amendement, pas d’une dérive silencieuse."/>
              <div className={styles.scopeGrid}>
                <div className={styles.scopeGood}><strong><Target size={15}/>Dans le périmètre</strong><p>{meta.scope || "Périmètre à formaliser."}</p></div>
                <div className={styles.scopeStop}><strong><AlertTriangle size={15}/>Hors périmètre</strong><p>{meta.outOfScope || "Tout résultat non relié à l’objectif nécessite une clarification ou un amendement."}</p></div>
              </div>
            </div>
          </ExecutionPanel>

          <ExecutionPanel>
            <div className={styles.panelInner}>
              <SectionHeading eyebrow="EXECUTION CHECKLIST" title="Étapes obligatoires et état réel" description="Les étapes restent séparées des preuves et de la décision de révision." action={<div style={{ display: "flex", gap: 7 }}><input className={styles.field} value={checkInput} onChange={(event) => setCheckInput(event.target.value)} placeholder="Nouvelle étape…" aria-label="Nouvelle étape de checklist"/><button type="button" className={styles.quietButton} onClick={addChecklist}><Plus size={14}/></button></div>}/>
              <div className={styles.checkList}>
                {checklist.map((item) => <div className={`${styles.checkItem} ${item.done ? styles.checkDone : ""}`} key={item.id}><button className={styles.checkToggle} type="button" aria-pressed={item.done} onClick={() => toggleChecklist(item.id)}>{item.done ? <Check size={15}/> : null}</button><span><span className={styles.checkLabel}>{item.label}</span><span className={styles.checkMeta}>{item.required ? "Obligatoire" : "Optionnelle"}{item.evidenceLinked ? " · Liée à une preuve" : ""}</span></span><ExecutionBadge tone={item.done ? "success" : "warning"}>{item.done ? "Réalisée" : "À faire"}</ExecutionBadge></div>)}
                {!checklist.length ? <EmptyState title="Checklist non constituée" detail="Ajoutez uniquement les étapes réellement nécessaires à la réalisation du résultat."/> : null}
              </div>
            </div>
          </ExecutionPanel>

          <ExecutionPanel>
            <div className={styles.panelInner}>
              <SectionHeading eyebrow="WORKING MATERIALS" title="Sources, dossier et références" description="Les matériaux restent des références; ils ne deviennent pas automatiquement des sources éditables."/>
              <div className={styles.gridThree}>
                <Link className={styles.scopeNeutral} href={linkedContent ? `/market-os/content-command-center/${linkedContent.id}` : "/market-os/content-command-center/directory"}><strong><Link2 size={15}/>Dossier / contenu</strong><p>{linkedContent?.title || task.contentId || "Non relié"}</p></Link>
                <Link className={styles.scopeNeutral} href="/market-os/content-command-center/brand-governance"><strong><ShieldCheck size={15}/>Règles de marque</strong><p>Consulter la doctrine applicable avant production.</p></Link>
                <Link className={styles.scopeNeutral} href="/market-os/content-command-center/source-vault"><strong><FileCheck2 size={15}/>Sources</strong><p>{meta.sourceRequirement || "Exigence de source non définie."}</p></Link>
              </div>
            </div>
          </ExecutionPanel>

          <ExecutionPanel>
            <div className={styles.panelInner}>
              <SectionHeading eyebrow="EVIDENCE SUBMISSION" title="Prouver le résultat" description="Une preuve soumise reste en attente jusqu’à son acceptation; elle ne ferme pas automatiquement la tâche." action={<button type="button" className={styles.quietButton} onClick={() => setEvidenceOpen(true)}><Plus size={14}/>Ajouter une preuve</button>}/>
              <div className={styles.evidenceList}>
                {meta.evidences.map((evidence) => <article className={styles.evidenceItem} key={evidence.id}><header><strong>{evidence.label}</strong><ExecutionBadge tone={toneForStatus(evidence.state)}>{evidence.state}</ExecutionBadge></header><p>{evidence.type} · {evidence.note || "Aucune note"}</p>{evidence.url ? <a href={evidence.url} target="_blank" rel="noreferrer" className={styles.quietButton}>Ouvrir la référence</a> : null}</article>)}
                {!meta.evidences.length ? <EmptyState title="Aucune preuve enregistrée" detail={meta.evidenceRequirement || "Définissez d’abord la preuve attendue dans l’éditeur."}/> : null}
              </div>
            </div>
          </ExecutionPanel>
        </div>

        <aside className={styles.focusIdentity} style={{ display: "grid", gap: 16 }}>
          <ExecutionPanel>
            <div className={styles.panelInner}>
              <SectionHeading eyebrow="ACTIVE TASK" title="Commande d’exécution" description="Choisissez une tâche puis contrôlez son état sans perdre son contexte."/>
              <select className={styles.select} value={task.id} onChange={(event) => selectTask(event.target.value)} aria-label="Sélectionner la tâche active">{tasks.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.title}</option>)}</select>
              <div className={styles.detailStrip} style={{ gridTemplateColumns: "1fr 1fr", marginTop: 12 }}>
                <div className={styles.detailCell}><small>Responsable</small><strong>{task.owner || "Non affectée"}</strong></div>
                <div className={styles.detailCell}><small>Réviseur</small><strong>{meta.reviewer || "À désigner"}</strong></div>
                <div className={styles.detailCell}><small>Priorité</small><strong>{task.priority}</strong></div>
                <div className={styles.detailCell}><small>Échéance</small><strong>{humanDate(task.dueDate)}</strong></div>
              </div>
              <div className={styles.workStateControls}>{workStates.map((state) => <button type="button" key={state.value} aria-pressed={meta.workState === state.value} onClick={() => changeWorkState(state.value)}>{state.icon}{state.label}</button>)}</div>
            </div>
          </ExecutionPanel>

          <ExecutionPanel>
            <div className={styles.panelInner}>
              <SectionHeading eyebrow="REVIEW READINESS" title="Gate de soumission" description="La soumission est bloquée tant que les exigences déterministes restent incomplètes."/>
              <ProgressBar value={readiness.score}/>
              {readiness.missing.length ? <ul className={styles.missingList}>{readiness.missing.map((item) => <li key={item}><AlertTriangle size={13}/>{item}</li>)}</ul> : <StatusMessage kind="success">Checklist, critères et preuve sont prêts pour soumission.</StatusMessage>}
              <button type="button" className={styles.primaryButton} style={{ width: "100%", marginTop: 12 }} disabled={!readiness.ready || meta.workState === "submitted"} onClick={submitForReview}><Send size={15}/>Soumettre à la révision</button>
            </div>
          </ExecutionPanel>

          <ExecutionPanel>
            <div className={styles.panelInner}>
              <SectionHeading eyebrow="BLOCKER & CLARIFICATION" title="Deux états, deux traitements" description="Un blocage arrête l’exécution; une clarification demande une réponse sur une instruction."/>
              <div style={{ display: "grid", gap: 8 }}>
                <button type="button" className={styles.dangerButton} onClick={() => setBlockerOpen(true)}><MessageSquareWarning size={15}/>Déclarer un blocage</button>
                <button type="button" className={styles.quietButton} onClick={() => setClarificationOpen(true)}><HelpCircle size={15}/>Demander une clarification</button>
              </div>
              <div className={styles.queueList} style={{ marginTop: 12 }}>
                {meta.blockers.filter((item) => item.state !== "resolved").map((item) => <div className={styles.blockerItem} key={item.id}><header><strong>{item.description}</strong><ExecutionBadge tone="danger">{item.severity}</ExecutionBadge></header><p>Owner : {item.owner || "Non affecté"} · {item.consequence || "Conséquence non documentée"}</p></div>)}
                {meta.clarifications.filter((item) => item.state === "open" || item.state === "reopened").map((item) => <div className={styles.clarificationItem} key={item.id}><header><strong>{item.question}</strong><ExecutionBadge tone="warning">Clarification</ExecutionBadge></header><p>Demandée à {item.requestedFrom || "une autorité à désigner"}</p></div>)}
              </div>
            </div>
          </ExecutionPanel>

          <ExecutionPanel>
            <div className={styles.panelInner}>
              <SectionHeading eyebrow="NEXT TASK" title="Après acceptation" description="La tâche suivante n’est jamais ouverte automatiquement."/>
              {nextTask ? <Link className={styles.taskCard} href={`/market-os/content-command-center/tasks/execution?task=${nextTask.id}`}><span className={styles.code}>NEXT</span><span className={styles.cardMain}><strong>{nextTask.title}</strong><p>{nextTask.owner} · {humanDate(nextTask.dueDate)}</p></span><ArrowRight size={15}/></Link> : <EmptyState title="Successeur non renseigné" detail="Aucune dépendance suivante n’est actuellement enregistrée."/>}
            </div>
          </ExecutionPanel>

          <ExecutionPanel>
            <div className={styles.panelInner}>
              <SectionHeading eyebrow="SESSION AUDIT" title="Derniers événements" description="L’historique décrit des actions réellement enregistrées dans la couche de tâche."/>
              <div className={styles.timeline}>{activity.slice(0, 6).map((event) => <article className={styles.timelineItem} key={event.id}><small>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(event.timestamp))}</small><strong>{event.action.replaceAll("_", " ")}</strong><p>{event.detail}</p></article>)}{!activity.length ? <EmptyState title="Aucun événement enregistré" detail="L’historique sera alimenté par les actions réelles de cette tâche."/> : null}</div>
            </div>
          </ExecutionPanel>
        </aside>
      </section>

      <ExecutionModal open={evidenceOpen} title="Ajouter une preuve de réalisation" onClose={() => setEvidenceOpen(false)} footer={<><button className={styles.quietButton} onClick={() => setEvidenceOpen(false)}>Annuler</button><button className={styles.primaryButton} onClick={submitEvidence} disabled={!evidenceForm.label.trim()}>Enregistrer la preuve</button></>}>
        <div className={styles.formGrid}><label className={styles.label}>Type<select className={styles.select} value={evidenceForm.type} onChange={(event) => setEvidenceForm({ ...evidenceForm, type: event.target.value })}>{["capture","document","source","export","preview","video","link","confirmation"].map((type) => <option key={type}>{type}</option>)}</select></label><label className={styles.label}>Libellé<input className={styles.field} value={evidenceForm.label} onChange={(event) => setEvidenceForm({ ...evidenceForm, label: event.target.value })}/></label><label className={`${styles.label} ${styles.formWide}`}>URL ou référence<input className={styles.field} value={evidenceForm.url} onChange={(event) => setEvidenceForm({ ...evidenceForm, url: event.target.value })}/></label><label className={`${styles.label} ${styles.formWide}`}>Note<textarea className={styles.textarea} value={evidenceForm.note} onChange={(event) => setEvidenceForm({ ...evidenceForm, note: event.target.value })}/></label></div>
      </ExecutionModal>

      <ExecutionModal open={blockerOpen} title="Déclarer un blocage" onClose={() => setBlockerOpen(false)} footer={<><button className={styles.quietButton} onClick={() => setBlockerOpen(false)}>Annuler</button><button className={styles.dangerButton} onClick={submitBlocker} disabled={!blockerForm.description.trim()}>Déclarer</button></>}>
        <div className={styles.formGrid}><label className={styles.label}>Type<select className={styles.select} value={blockerForm.type} onChange={(event) => setBlockerForm({ ...blockerForm, type: event.target.value })}>{["information","approval","owner","source","asset","dependency","technical","brand","scope","capacity","review","external"].map((type) => <option key={type}>{type}</option>)}</select></label><label className={styles.label}>Sévérité<select className={styles.select} value={blockerForm.severity} onChange={(event) => setBlockerForm({ ...blockerForm, severity: event.target.value })}>{["low","medium","high","critical"].map((value) => <option key={value}>{value}</option>)}</select></label><label className={`${styles.label} ${styles.formWide}`}>Description<textarea className={styles.textarea} value={blockerForm.description} onChange={(event) => setBlockerForm({ ...blockerForm, description: event.target.value })}/></label><label className={styles.label}>Owner de résolution<input className={styles.field} value={blockerForm.owner} onChange={(event) => setBlockerForm({ ...blockerForm, owner: event.target.value })}/></label><label className={styles.label}>Conséquence<input className={styles.field} value={blockerForm.consequence} onChange={(event) => setBlockerForm({ ...blockerForm, consequence: event.target.value })}/></label></div>
      </ExecutionModal>

      <ExecutionModal open={clarificationOpen} title="Demander une clarification" onClose={() => setClarificationOpen(false)} footer={<><button className={styles.quietButton} onClick={() => setClarificationOpen(false)}>Annuler</button><button className={styles.primaryButton} onClick={submitClarification} disabled={!clarificationForm.question.trim()}>Envoyer la demande</button></>}>
        <div className={styles.formGrid}><label className={`${styles.label} ${styles.formWide}`}>Question<textarea className={styles.textarea} value={clarificationForm.question} onChange={(event) => setClarificationForm({ ...clarificationForm, question: event.target.value })}/></label><label className={styles.label}>Demandée à<input className={styles.field} value={clarificationForm.requestedFrom} onChange={(event) => setClarificationForm({ ...clarificationForm, requestedFrom: event.target.value })}/></label><label className={styles.label}>Échéance<input className={styles.field} type="date" value={clarificationForm.dueDate} onChange={(event) => setClarificationForm({ ...clarificationForm, dueDate: event.target.value })}/></label><label className={`${styles.label} ${styles.formWide}`}>Zone affectée<input className={styles.field} value={clarificationForm.impactedArea} onChange={(event) => setClarificationForm({ ...clarificationForm, impactedArea: event.target.value })}/></label></div>
      </ExecutionModal>
    </main>
  </Shell>
}

export default TaskExecutionCommandCenter
