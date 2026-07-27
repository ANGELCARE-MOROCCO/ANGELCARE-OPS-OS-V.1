"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ClipboardList,
  FileCheck2,
  GitBranch,
  History,
  Link2,
  MessageSquareText,
  PencilLine,
  ShieldCheck,
  UserRoundCheck,
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
  addTaskChecklistItem,
  readTaskActivity,
  readTaskChecklists,
  readTaskExecutionMeta,
  toggleTaskChecklistItem,
  updateContentCommandTask,
  type TaskActivityEvent,
  type TaskChecklistItem,
  type TaskExecutionMeta,
} from "@/lib/content-command/tasks/task-activity"
import { humanDate, taskLineage, taskNextAction, taskReadiness } from "../execution/task-operating-model"
import {
  EmptyState,
  ExecutionBadge,
  ExecutionPanel,
  ProgressBar,
  SectionHeading,
  StatusMessage,
  toneForStatus,
} from "../execution/execution-ui"
import styles from "../execution/execution-command.module.css"

export function TaskDetailWorkspace({ taskId }: { taskId: string }) {
  const [task, setTask] = React.useState<ContentTask | null>(null)
  const [linkedContent, setLinkedContent] = React.useState<ContentItem | null>(null)
  const [activity, setActivity] = React.useState<TaskActivityEvent[]>([])
  const [checklist, setChecklist] = React.useState<TaskChecklistItem[]>([])
  const [meta, setMeta] = React.useState<TaskExecutionMeta | null>(null)
  const [note, setNote] = React.useState("")
  const [checkInput, setCheckInput] = React.useState("")
  const [announcement, setAnnouncement] = React.useState("")

  const reload = React.useCallback(() => {
    const store = loadStore()
    const found = store.tasks.find((candidate) => candidate.id === taskId) ?? null
    setTask(found)
    setLinkedContent(found ? store.items.find((item) => item.id === found.contentId) ?? null : null)
    setActivity(readTaskActivity().filter((event) => event.taskId === taskId))
    setChecklist(readTaskChecklists().filter((item) => item.taskId === taskId))
    setMeta(found ? readTaskExecutionMeta(taskId) : null)
  }, [taskId])

  React.useEffect(() => { reload() }, [reload])

  if (!task || !meta) {
    return <Shell><main className={styles.root} data-market-os-root><section className={styles.hero}><div><span className={styles.eyebrow}><ClipboardList size={16}/> TASK DETAIL</span><h1>Tâche introuvable</h1><p>Aucune tâche ne correspond à l’identifiant demandé. Aucun enregistrement de remplacement n’est fabriqué.</p></div></section><div style={{ marginTop: 16 }}><EmptyState title="Tâche indisponible" detail={`Aucun objet n’existe avec l’identifiant ${taskId}.`} action="Retour à Task Command" href="/market-os/content-command-center/tasks"/></div></main></Shell>
  }

  const currentTask = task
  const currentMeta = meta
  const readiness = taskReadiness(currentTask, currentMeta, checklist)
  const lineage = taskLineage(currentTask, linkedContent, currentMeta)
  const openBlockers = currentMeta.blockers.filter((item) => item.state !== "resolved")
  const openClarifications = currentMeta.clarifications.filter((item) => item.state === "open" || item.state === "reopened")

  function changeStatus(status: ContentTask["status"]) {
    updateContentCommandTask(currentTask.id, (current) => ({ ...current, status }))
    addTaskActivity(currentTask.id, "status_changed", `Statut mis à jour : ${statusLabel(status)}`)
    setAnnouncement(`Statut enregistré : ${statusLabel(status)}.`)
    reload()
  }

  function addNote() {
    if (!note.trim()) return
    updateContentCommandTask(currentTask.id, (current) => ({ ...current, notes: `${current.notes ? `${current.notes}\n\n` : ""}${new Date().toISOString()} — ${note.trim()}` }))
    addTaskActivity(currentTask.id, "operational_note_added", note.trim())
    setNote("")
    setAnnouncement("Note opérationnelle ajoutée à l’historique.")
    reload()
  }

  function addChecklist() {
    if (!checkInput.trim()) return
    addTaskChecklistItem(currentTask.id, checkInput.trim(), { required: true })
    setCheckInput("")
    reload()
  }

  return <Shell>
    <main className={styles.root} data-market-os-root>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}><ClipboardList size={16}/> DOSSIER DE TÂCHE / TRAÇABILITÉ COMPLÈTE</span>
          <h1>{task.title}</h1>
          <p>{taskNextAction(task, meta)} Le dossier de tâche rassemble l’identité, la lignée, les instructions, les dépendances, les preuves, les décisions et l’historique.</p>
        </div>
        <div className={styles.heroActions}>
          <Link className={styles.primaryButton} href={`/market-os/content-command-center/tasks/execution?task=${task.id}`}>Exécuter <ArrowRight size={15}/></Link>
          <Link className={styles.secondaryButton} href={`/market-os/content-command-center/tasks/${task.id}/edit`}><PencilLine size={15}/>Modifier</Link>
        </div>
      </section>

      {announcement ? <StatusMessage kind="success">{announcement}</StatusMessage> : null}

      <div className={styles.lineage} style={{ marginTop: 16 }} aria-label="Lignée opérationnelle">
        {lineage.map((node) => node.href ? <Link className={styles.lineageNode} href={node.href} key={node.label}><small>{node.label}</small><strong>{node.value}</strong></Link> : <div className={styles.lineageNode} key={node.label}><small>{node.label}</small><strong>{node.value}</strong></div>)}
      </div>

      <section className={styles.gridTwo}>
        <ExecutionPanel>
          <div className={styles.panelInner}>
            <SectionHeading eyebrow="TASK IDENTITY" title="Responsabilité et état actuel" description="La priorité, l’échéance et le statut restent visibles, mais ne remplacent jamais les critères de réalisation."/>
            <div className={styles.detailStrip}>
              <div className={styles.detailCell}><small>Identité</small><strong>{task.id}</strong></div>
              <div className={styles.detailCell}><small>Responsable</small><strong>{task.owner || "Non affectée"}</strong></div>
              <div className={styles.detailCell}><small>Réviseur</small><strong>{meta.reviewer || "À désigner"}</strong></div>
              <div className={styles.detailCell}><small>Priorité</small><strong>{task.priority}</strong></div>
              <div className={styles.detailCell}><small>Échéance</small><strong>{humanDate(task.dueDate)}</strong></div>
            </div>
            <div className={styles.filters}>{(["todo", "doing", "blocked", "done"] as const).map((status) => <button type="button" className={`${styles.filterButton} ${task.status === status ? styles.filterActive : ""}`} onClick={() => changeStatus(status)} key={status}>{statusLabel(status)}</button>)}</div>
          </div>
        </ExecutionPanel>

        <ExecutionPanel>
          <div className={styles.panelInner}>
            <SectionHeading eyebrow="READINESS" title="Préparation et défauts observables" description="Le score découle uniquement des champs présents et des étapes obligatoires; il ne mesure pas la performance."/>
            <ProgressBar value={readiness.score}/>
            {readiness.missing.length ? <ul className={styles.missingList}>{readiness.missing.map((item) => <li key={item}><AlertTriangle size={13}/>{item}</li>)}</ul> : <StatusMessage kind="success">Les conditions observables sont prêtes.</StatusMessage>}
          </div>
        </ExecutionPanel>
      </section>

      <section className={styles.gridTwo}>
        <ExecutionPanel>
          <div className={styles.panelInner}>
            <SectionHeading eyebrow="OBJECTIVE & SCOPE" title="Instructions opérationnelles" description="L’objectif, le périmètre et l’acceptation sont séparés pour empêcher une exécution ambiguë."/>
            <div className={styles.scopeGrid}>
              <div className={styles.scopeGood}><strong><UserRoundCheck size={15}/>Objectif</strong><p>{meta.objective || task.notes || "Objectif non formalisé."}</p></div>
              <div className={styles.scopeGood}><strong><Check size={15}/>Définition de réalisation</strong><p>{meta.completionDefinition || "Manquante."}</p></div>
              <div className={styles.scopeNeutral}><strong><ShieldCheck size={15}/>Critères d’acceptation</strong><p>{meta.acceptanceCriteria || "Manquants."}</p></div>
              <div className={styles.scopeStop}><strong><AlertTriangle size={15}/>Hors périmètre</strong><p>{meta.outOfScope || "Toute activité étrangère au résultat exige un amendement."}</p></div>
            </div>
          </div>
        </ExecutionPanel>

        <ExecutionPanel>
          <div className={styles.panelInner}>
            <SectionHeading eyebrow="DEPENDENCIES" title="Prédécesseurs et successeurs" description="La page expose les relations enregistrées et n’invente aucun chemin critique."/>
            <div className={styles.commandQueue}>
              <div className={styles.queueCard}><span>Prédécesseurs</span><strong>{meta.dependencyIds.length}</strong><p>{meta.dependencyIds.join(", ") || "Aucune dépendance renseignée"}</p></div>
              <div className={styles.queueCard}><span>Successeurs</span><strong>{meta.successorIds.length}</strong><p>{meta.successorIds.join(", ") || "Aucun successeur renseigné"}</p></div>
              <div className={styles.queueCard}><span>Mission</span><strong>{meta.missionId ? "1" : "0"}</strong><p>{meta.missionId || "Mission non renseignée"}</p></div>
            </div>
          </div>
        </ExecutionPanel>
      </section>

      <section className={styles.gridTwo}>
        <ExecutionPanel>
          <div className={styles.panelInner}>
            <SectionHeading eyebrow="CHECKLIST" title="Étapes de réalisation" description="La checklist ne remplace ni la preuve ni la décision d’acceptation." action={<div style={{ display: "flex", gap: 7 }}><input className={styles.field} value={checkInput} onChange={(event) => setCheckInput(event.target.value)} placeholder="Nouvelle étape"/><button className={styles.quietButton} type="button" onClick={addChecklist}>Ajouter</button></div>}/>
            <div className={styles.checkList}>{checklist.map((item) => <div className={`${styles.checkItem} ${item.done ? styles.checkDone : ""}`} key={item.id}><button type="button" className={styles.checkToggle} aria-pressed={item.done} onClick={() => { toggleTaskChecklistItem(item.id); reload() }}>{item.done ? <Check size={15}/> : null}</button><span><span className={styles.checkLabel}>{item.label}</span><span className={styles.checkMeta}>{item.required ? "Obligatoire" : "Optionnelle"}</span></span><ExecutionBadge tone={item.done ? "success" : "warning"}>{item.done ? "Réalisée" : "À faire"}</ExecutionBadge></div>)}{!checklist.length ? <EmptyState title="Checklist absente" detail="Ajoutez uniquement des étapes vérifiables et nécessaires."/> : null}</div>
          </div>
        </ExecutionPanel>

        <ExecutionPanel>
          <div className={styles.panelInner}>
            <SectionHeading eyebrow="EVIDENCE" title="Preuves de réalisation" description="Les preuves restent versionnées et séparées des commentaires."/>
            <div className={styles.evidenceList}>{meta.evidences.map((evidence) => <article className={styles.evidenceItem} key={evidence.id}><header><strong>{evidence.label}</strong><ExecutionBadge tone={toneForStatus(evidence.state)}>{evidence.state}</ExecutionBadge></header><p>{evidence.type} · {evidence.note || "Aucune note"}</p>{evidence.url ? <a href={evidence.url} target="_blank" rel="noreferrer" className={styles.quietButton}>Ouvrir</a> : null}</article>)}{!meta.evidences.length ? <EmptyState title="Aucune preuve" detail={meta.evidenceRequirement || "L’exigence de preuve n’est pas encore définie."} action="Ouvrir le poste d’exécution" href={`/market-os/content-command-center/tasks/execution?task=${task.id}`}/> : null}</div>
          </div>
        </ExecutionPanel>
      </section>

      <section className={styles.gridThree}>
        <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="BLOCKERS" title="Blocages ouverts" description="Chaque blocage expose sa sévérité, son owner et sa conséquence."/><div className={styles.queueList}>{openBlockers.map((item) => <article className={styles.blockerItem} key={item.id}><header><strong>{item.description}</strong><ExecutionBadge tone="danger">{item.severity}</ExecutionBadge></header><p>{item.owner || "Owner non affecté"} · {item.consequence || "Conséquence non documentée"}</p></article>)}{!openBlockers.length ? <EmptyState title="Aucun blocage ouvert" detail="Aucun obstacle actif n’est enregistré pour cette tâche."/> : null}</div></div></ExecutionPanel>
        <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="CLARIFICATIONS" title="Questions ouvertes" description="La clarification ne doit pas être confondue avec un blocage."/><div className={styles.queueList}>{openClarifications.map((item) => <article className={styles.clarificationItem} key={item.id}><header><strong>{item.question}</strong><ExecutionBadge tone="warning">{item.state}</ExecutionBadge></header><p>Demandée à {item.requestedFrom || "une autorité à désigner"} · {humanDate(item.dueDate)}</p></article>)}{!openClarifications.length ? <EmptyState title="Aucune clarification ouverte" detail="Les instructions ne comportent actuellement aucune question formalisée."/> : null}</div></div></ExecutionPanel>
        <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="REVIEW HISTORY" title="Décision et gate" description="Une soumission ne devient jamais une acceptation par simple changement client."/><div className={styles.queueCard}><span>État de travail</span><strong style={{ fontSize: 17 }}>{meta.workState.replaceAll("_", " ")}</strong><p>Réviseur : {meta.reviewer || "À désigner"}</p></div></div></ExecutionPanel>
      </section>

      <section className={styles.gridTwo}>
        <ExecutionPanel>
          <div className={styles.panelInner}>
            <SectionHeading eyebrow="COLLABORATION" title="Notes opérationnelles" description="Les notes sont datées et ajoutées à l’historique, sans écraser les instructions."/>
            <p style={{ whiteSpace: "pre-wrap", color: "#60758a", fontSize: 12, lineHeight: 1.65 }}>{task.notes || "Aucune note opérationnelle."}</p>
            <textarea className={styles.textarea} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ajouter une note datée…"/>
            <button type="button" className={styles.quietButton} onClick={addNote}><MessageSquareText size={14}/>Ajouter la note</button>
          </div>
        </ExecutionPanel>

        <ExecutionPanel>
          <div className={styles.panelInner}>
            <SectionHeading eyebrow="CHANGE HISTORY" title="Chronologie traçable" description="Les événements proviennent des actions réellement enregistrées sur la tâche."/>
            <div className={styles.timeline}>{activity.map((event) => <article className={styles.timelineItem} key={event.id}><small>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(event.timestamp))}</small><strong>{event.action.replaceAll("_", " ")}</strong><p>{event.detail}</p></article>)}{!activity.length ? <EmptyState title="Historique vide" detail="Aucune action n’a encore été enregistrée."/> : null}</div>
          </div>
        </ExecutionPanel>
      </section>

      <section className={styles.panel} style={{ marginTop: 16 }}>
        <div className={styles.panelInner}>
          <SectionHeading eyebrow="AVAILABLE ACTIONS" title="Actions gouvernées" description="Les actions ouvrent les expériences dédiées sans forcer une décision d’acceptation."/>
          <div className={styles.heroActions} style={{ justifyContent: "flex-start" }}><Link className={styles.quietButton} href={`/market-os/content-command-center/tasks/execution?task=${task.id}`}>Exécuter</Link><Link className={styles.quietButton} href={`/market-os/content-command-center/tasks/${task.id}/edit`}>Modifier</Link><Link className={styles.quietButton} href={linkedContent ? `/market-os/content-command-center/${linkedContent.id}` : "/market-os/content-command-center/directory"}><Link2 size={14}/>Dossier lié</Link><Link className={styles.quietButton} href="/market-os/content-command-center/evidence"><FileCheck2 size={14}/>Evidence Lab</Link><Link className={styles.quietButton} href="/market-os/content-command-center/tasks"><History size={14}/>Task Command</Link></div>
        </div>
      </section>
    </main>
  </Shell>
}

export default TaskDetailWorkspace
