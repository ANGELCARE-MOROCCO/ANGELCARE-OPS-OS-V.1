"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  History,
  Save,
  ShieldCheck,
  Trash2,
  Workflow,
} from "lucide-react"
import { Shell, priorities, saveStore, useContentStore, type ContentTask } from "../content-command-system"
import {
  addTaskActivity,
  deleteContentCommandTask,
  readTaskExecutionMeta,
  saveTaskExecutionMeta,
  type TaskExecutionMeta,
  hydrateTaskRuntime,
} from "@/lib/content-command/tasks/task-activity"
import { humanDate } from "../execution/task-operating-model"
import { bulk3ContextHref, contextFromLocation, writeBulk3Context } from "./bulk3-context"
import { amendmentAuthority, amendmentImpact, classifyAmendment } from "./bulk3-derivations"
import {
  Bulk3Modal,
  Bulk3Shell,
  ExperienceHeader,
  GovernanceNotice,
  OperationalEmpty,
  ReturnContext,
  SectionTitle,
  StatusPill,
} from "./Bulk3Shared"
import styles from "./bulk3-experience.module.css"

function cloneMeta(value: TaskExecutionMeta): TaskExecutionMeta {
  return { ...value, dependencyIds: [...value.dependencyIds], successorIds: [...value.successorIds], evidences: [...value.evidences], blockers: [...value.blockers], clarifications: [...value.clarifications] }
}

export default function Bulk3TaskAmendmentWorkspace({ taskId }: { taskId: string }) {
  const { store } = useContentStore()
  const router = useRouter()
  const [currentTask, setCurrentTask] = React.useState<ContentTask | null>(null)
  const [proposedTask, setProposedTask] = React.useState<ContentTask | null>(null)
  const [currentMeta, setCurrentMeta] = React.useState<TaskExecutionMeta | null>(null)
  const [proposedMeta, setProposedMeta] = React.useState<TaskExecutionMeta | null>(null)
  const [context, setContext] = React.useState<ReturnType<typeof contextFromLocation>>({ returnTo: "/market-os/content-command-center/tasks" })
  const [notice, setNotice] = React.useState("")
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteConfirm, setDeleteConfirm] = React.useState("")

  React.useEffect(() => {
    void hydrateTaskRuntime(taskId).then(() => {
      const meta = readTaskExecutionMeta(taskId)
      setCurrentMeta(cloneMeta(meta))
      setProposedMeta(cloneMeta(meta))
    }).catch(() => undefined)
  }, [taskId])

  React.useEffect(() => {
    const location = contextFromLocation("/market-os/content-command-center/tasks")
    const task = store.tasks.find((candidate) => candidate.id === taskId) || null
    const meta = task ? readTaskExecutionMeta(task.id) : null
    setContext(location)
    setCurrentTask(task ? { ...task } : null)
    setProposedTask(task ? { ...task } : null)
    setCurrentMeta(meta ? cloneMeta(meta) : null)
    setProposedMeta(meta ? cloneMeta(meta) : null)
  }, [taskId, store.tasks])

  React.useEffect(() => {
    if (!currentTask || !currentMeta) return
    writeBulk3Context({ dossierId: currentTask.contentId, missionId: currentMeta.missionId, taskId: currentTask.id, taskTitle: currentTask.title, stage: "task-amendment", sourceHref: `/market-os/content-command-center/tasks/${currentTask.id}/edit`, returnTo: context.returnTo || "/market-os/content-command-center/tasks", updatedAt: new Date().toISOString() })
  }, [currentTask, currentMeta, context])

  if (!currentTask || !proposedTask || !currentMeta || !proposedMeta) return <Shell><Bulk3Shell><ReturnContext href={context.returnTo}/><ExperienceHeader eyebrow="GOVERNED TASK AMENDMENT" title="Tâche introuvable" description="Aucune modification n’est appliquée lorsqu’un objet de tâche valide ne peut pas être chargé."/><OperationalEmpty title="Aucun objet à modifier" detail={`Identifiant : ${taskId}`}/></Bulk3Shell></Shell>

  const amendmentClass = classifyAmendment(currentTask, proposedTask, currentMeta, proposedMeta)
  const authority = amendmentAuthority(amendmentClass)
  const impacts = amendmentImpact(amendmentClass)
  const changed = JSON.stringify(currentTask) !== JSON.stringify(proposedTask) || JSON.stringify(currentMeta) !== JSON.stringify(proposedMeta)

  function setTaskField<K extends keyof ContentTask>(key: K, value: ContentTask[K]) {
    setProposedTask((current) => current ? { ...current, [key]: value } : current)
  }

  function setMetaField<K extends keyof TaskExecutionMeta>(key: K, value: TaskExecutionMeta[K]) {
    setProposedMeta((current) => current ? { ...current, [key]: value } : current)
  }

  function saveAmendment() {
    if (!currentTask || !proposedTask || !currentMeta || !proposedMeta) return
    if (!changed || !proposedMeta.amendmentReason?.trim()) {
      setNotice(!changed ? "Aucun changement matériel n’est détecté." : "Le motif d’amendement est obligatoire.")
      return
    }
    saveStore({ ...store, tasks: store.tasks.map((task) => task.id === currentTask.id ? proposedTask : task) })
    saveTaskExecutionMeta(currentTask.id, proposedMeta)
    addTaskActivity(currentTask.id, "task_amended", `${amendmentClass} · autorité attendue : ${authority} · motif : ${proposedMeta.amendmentReason}`)
    setCurrentTask({ ...proposedTask })
    setCurrentMeta(cloneMeta(proposedMeta))
    setNotice("Amendement enregistré avec motif, classification d’impact et historique.")
  }

  function removeTask() {
    if (!currentTask) return
    if (deleteConfirm !== currentTask.title) return
    deleteContentCommandTask(currentTask.id)
    router.push(context.returnTo || "/market-os/content-command-center/tasks")
  }

  return <Shell><Bulk3Shell>
    <ReturnContext href={context.returnTo}/>
    <ExperienceHeader eyebrow="GOVERNED AMENDMENT CHAMBER / ANGELCARE" title="Modifier une tâche seulement après avoir exposé les conséquences sur la mission, les dépendances et l’acceptation." description="L’éditeur sépare l’état actif de la proposition, classe la nature du changement, rend l’autorité visible et conserve un événement d’amendement plutôt que d’écraser silencieusement l’instruction." actions={<><Link className={styles.secondaryButton} href={bulk3ContextHref(`/market-os/content-command-center/tasks/${currentTask.id}`, { dossierId: currentTask.contentId, missionId: currentMeta.missionId, taskId: currentTask.id, returnTo: context.returnTo })}><History size={15}/>Chronique</Link><button className={styles.primaryButton} type="button" onClick={saveAmendment} disabled={!changed}><Save size={15}/>Enregistrer l’amendement</button></>}/>
    {notice ? <GovernanceNotice kind={notice.includes("enregistré") ? "success" : "warning"} title="Décision d’amendement">{notice}</GovernanceNotice> : null}

    <section className={styles.amendmentLayout}>
      <section className={styles.amendmentWorkbench}>
        <SectionTitle eyebrow="CURRENT / PROPOSED" title="Comparer avant de modifier" description="Les valeurs actuelles restent visibles à côté des valeurs proposées. L’amendement ne devient actif qu’après l’enregistrement explicite."/>
        <div className={styles.amendmentSplit}>
          <section className={styles.amendmentColumn}>
            <h2>Constitution active</h2>
            <div className={styles.fieldGrid}>
              <label>Titre<div className={styles.currentValue}>{currentTask.title}</div></label>
              <label>Owner<div className={styles.currentValue}>{currentTask.owner || "Non affecté"}</div></label>
              <label>Échéance<div className={styles.currentValue}>{humanDate(currentTask.dueDate)}</div></label>
              <label>Priorité<div className={styles.currentValue}>{currentTask.priority}</div></label>
              <label className={styles.wide}>Objectif<div className={styles.currentValue}>{currentMeta.objective || currentTask.notes || "Non défini"}</div></label>
              <label className={styles.wide}>Scope<div className={styles.currentValue}>{currentMeta.scope || "Non défini"}</div></label>
              <label className={styles.wide}>Réalisation<div className={styles.currentValue}>{currentMeta.completionDefinition || "Non définie"}</div></label>
              <label className={styles.wide}>Preuve<div className={styles.currentValue}>{currentMeta.evidenceRequirement || "Non définie"}</div></label>
              <label className={styles.wide}>Dépendances<div className={styles.currentValue}>{currentMeta.dependencyIds.length ? currentMeta.dependencyIds.join(", ") : "Aucune"}</div></label>
            </div>
          </section>

          <section className={`${styles.amendmentColumn} ${styles.amendmentColumnProposed}`}>
            <h2>Proposition gouvernée</h2>
            <div className={styles.fieldGrid}>
              <label>Titre<input value={proposedTask.title} onChange={(event) => setTaskField("title", event.target.value)}/></label>
              <label>Owner<input value={proposedTask.owner} onChange={(event) => setTaskField("owner", event.target.value)}/></label>
              <label>Échéance<input type="date" value={proposedTask.dueDate} onChange={(event) => setTaskField("dueDate", event.target.value)}/></label>
              <label>Priorité<select value={proposedTask.priority} onChange={(event) => setTaskField("priority", event.target.value as ContentTask["priority"])}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
              <label className={styles.wide}>Objectif<textarea value={proposedMeta.objective || proposedTask.notes} onChange={(event) => setMetaField("objective", event.target.value)}/></label>
              <label className={styles.wide}>Scope<textarea value={proposedMeta.scope || ""} onChange={(event) => setMetaField("scope", event.target.value)}/></label>
              <label className={styles.wide}>Hors périmètre<textarea value={proposedMeta.outOfScope || ""} onChange={(event) => setMetaField("outOfScope", event.target.value)}/></label>
              <label className={styles.wide}>Définition de réalisation<textarea value={proposedMeta.completionDefinition || ""} onChange={(event) => setMetaField("completionDefinition", event.target.value)}/></label>
              <label className={styles.wide}>Critères d’acceptation<textarea value={proposedMeta.acceptanceCriteria || ""} onChange={(event) => setMetaField("acceptanceCriteria", event.target.value)}/></label>
              <label className={styles.wide}>Preuve exigée<textarea value={proposedMeta.evidenceRequirement || ""} onChange={(event) => setMetaField("evidenceRequirement", event.target.value)}/></label>
              <label>Réviseur<input value={proposedMeta.reviewer || ""} onChange={(event) => setMetaField("reviewer", event.target.value)}/></label>
              <label>Mission<input value={proposedMeta.missionId || ""} onChange={(event) => setMetaField("missionId", event.target.value)}/></label>
              <label className={styles.wide}>Dépendances<input value={proposedMeta.dependencyIds.join(", ")} onChange={(event) => setMetaField("dependencyIds", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))}/></label>
              <label className={styles.wide}>Motif d’amendement<textarea value={proposedMeta.amendmentReason || ""} onChange={(event) => setMetaField("amendmentReason", event.target.value)} placeholder="Pourquoi ce changement est-il nécessaire et quelle conséquence accepte-t-on ?"/></label>
            </div>
          </section>
        </div>
      </section>

      <aside className={styles.impactChamber}>
        <div className={styles.impactHero}><small>AMENDMENT IMPACT MAP</small><h2>{amendmentClass.replaceAll("_", " ")}</h2><p>La classification est déterminée à partir des champs réellement modifiés. Elle ne constitue pas une approbation automatique.</p></div>
        <SectionTitle eyebrow="IMPACTS OBSERVABLES" title="Ce qui devra être revalidé" description="Les surfaces affectées sont exposées avant la sauvegarde."/>
        <div className={styles.impactList}>{impacts.map((impact) => <div className={styles.impactItem} key={impact}><AlertTriangle size={14}/>{impact}</div>)}</div>
        <section className={styles.authorityDecision}><small>AUTORITÉ REQUISE</small><strong>{authority}</strong><p>L’interface enregistre la proposition et son motif. Elle ne prétend pas remplacer une décision d’autorité inexistante dans le backend actuel.</p><button type="button" onClick={saveAmendment} disabled={!changed}><ShieldCheck size={13}/>Appliquer avec historique</button></section>
        <div style={{ marginTop: 14 }}><GovernanceNotice kind={changed ? "warning" : "success"} title={changed ? "Changement matériel détecté" : "Aucun changement matériel"}>{changed ? "Vérifiez l’impact, le motif et l’autorité avant enregistrement." : "L’état proposé correspond à la constitution active."}</GovernanceNotice></div>
        <div style={{ marginTop: 14 }}><button type="button" className={styles.secondaryButton} onClick={() => setDeleteOpen(true)}><Trash2 size={13}/>Suppression exceptionnelle</button></div>
      </aside>
    </section>

    <Bulk3Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Suppression exceptionnelle" subtitle="Cette action retire la tâche, ses métadonnées, sa checklist et son historique local actuel." footer={<><button className={styles.secondaryButton} onClick={() => setDeleteOpen(false)}>Annuler</button><button className={styles.primaryButton} onClick={removeTask} disabled={deleteConfirm !== currentTask.title}><Trash2 size={13}/>Supprimer définitivement</button></>}>
      <GovernanceNotice kind="danger" title="Action destructive">Saisissez exactement le titre de la tâche pour autoriser la suppression : {currentTask.title}</GovernanceNotice>
      <div className={styles.formGrid} style={{ marginTop: 12 }}><label className={styles.wide}>Confirmation<input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder={currentTask.title}/></label></div>
    </Bulk3Modal>
  </Bulk3Shell></Shell>
}
