"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Check,
  FileCheck2,
  GitBranch,
  Link2,
  ListChecks,
  Save,
  ShieldAlert,
  Target,
  Trash2,
  UserRoundCog,
} from "lucide-react"
import {
  Shell,
  loadStore,
  priorities,
  statusLabel,
  type ContentTask,
  type Priority,
} from "@/components/market-os/content-command/content-command-system"
import {
  addTaskActivity,
  deleteContentCommandTask,
  readTaskExecutionMeta,
  saveTaskExecutionMeta,
  updateContentCommandTask,
  type TaskExecutionMeta,
} from "@/lib/content-command/tasks/task-activity"
import { humanDate } from "../execution/task-operating-model"
import {
  EmptyState,
  ExecutionBadge,
  ExecutionPanel,
  SectionHeading,
  StatusMessage,
  toneForStatus,
} from "../execution/execution-ui"
import styles from "../execution/execution-command.module.css"

type SectionKey = "identity" | "mission" | "objective" | "scope" | "ownership" | "schedule" | "dependencies" | "completion" | "evidence" | "review" | "impact"

const sections: Array<{ key: SectionKey; label: string; icon: React.ReactNode }> = [
  { key: "identity", label: "Identité", icon: <ListChecks size={14}/> },
  { key: "mission", label: "Mission & dossier", icon: <Link2 size={14}/> },
  { key: "objective", label: "Objectif", icon: <Target size={14}/> },
  { key: "scope", label: "Périmètre", icon: <ShieldAlert size={14}/> },
  { key: "ownership", label: "Responsabilités", icon: <UserRoundCog size={14}/> },
  { key: "schedule", label: "Calendrier", icon: <CalendarClock size={14}/> },
  { key: "dependencies", label: "Dépendances", icon: <GitBranch size={14}/> },
  { key: "completion", label: "Réalisation", icon: <Check size={14}/> },
  { key: "evidence", label: "Preuves", icon: <FileCheck2 size={14}/> },
  { key: "review", label: "Révision", icon: <ShieldAlert size={14}/> },
  { key: "impact", label: "Impact & sauvegarde", icon: <Save size={14}/> },
]

export function TaskEditWorkspace({ taskId }: { taskId: string }) {
  const [task, setTask] = React.useState<ContentTask | null>(null)
  const [initialTask, setInitialTask] = React.useState<ContentTask | null>(null)
  const [meta, setMeta] = React.useState<TaskExecutionMeta | null>(null)
  const [initialMeta, setInitialMeta] = React.useState<TaskExecutionMeta | null>(null)
  const [section, setSection] = React.useState<SectionKey>("identity")
  const [saved, setSaved] = React.useState(false)
  const [error, setError] = React.useState("")
  const [deleteConfirm, setDeleteConfirm] = React.useState("")

  React.useEffect(() => {
    const found = loadStore().tasks.find((candidate) => candidate.id === taskId) ?? null
    const execution = found ? readTaskExecutionMeta(taskId) : null
    setTask(found)
    setInitialTask(found ? { ...found } : null)
    setMeta(execution)
    setInitialMeta(execution ? JSON.parse(JSON.stringify(execution)) as TaskExecutionMeta : null)
  }, [taskId])

  const dirty = React.useMemo(() => JSON.stringify(task) !== JSON.stringify(initialTask) || JSON.stringify(meta) !== JSON.stringify(initialMeta), [task, initialTask, meta, initialMeta])

  React.useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  if (!task || !meta) {
    return <Shell><main className={styles.root} data-market-os-root><section className={styles.hero}><div><span className={styles.eyebrow}>TASK EDITOR</span><h1>Tâche introuvable</h1><p>Aucune instruction n’est créée en remplacement d’un enregistrement absent.</p></div></section><div style={{ marginTop: 16 }}><EmptyState title="Modification indisponible" detail={`La tâche ${taskId} n’existe pas dans le registre actuel.`} action="Retour à Task Command" href="/market-os/content-command-center/tasks"/></div></main></Shell>
  }

  const currentTask = task
  const currentMeta = meta

  function setTaskField<K extends keyof ContentTask>(key: K, value: ContentTask[K]) {
    setTask((current) => current ? { ...current, [key]: value } : current)
    setSaved(false)
    setError("")
  }

  function setMetaField<K extends keyof TaskExecutionMeta>(key: K, value: TaskExecutionMeta[K]) {
    setMeta((current) => current ? { ...current, [key]: value } : current)
    setSaved(false)
    setError("")
  }

  const materialChange = Boolean(initialTask && initialMeta && (
    currentTask.title !== initialTask.title ||
    currentTask.contentId !== initialTask.contentId ||
    currentTask.owner !== initialTask.owner ||
    currentTask.dueDate !== initialTask.dueDate ||
    currentMeta.missionId !== initialMeta.missionId ||
    currentMeta.objective !== initialMeta.objective ||
    currentMeta.scope !== initialMeta.scope ||
    currentMeta.completionDefinition !== initialMeta.completionDefinition ||
    currentMeta.acceptanceCriteria !== initialMeta.acceptanceCriteria ||
    JSON.stringify(currentMeta.dependencyIds) !== JSON.stringify(initialMeta.dependencyIds)
  ))

  const impacts = [
    currentTask.dueDate !== initialTask?.dueDate ? `Échéance modifiée : ${humanDate(initialTask?.dueDate)} → ${humanDate(currentTask.dueDate)}` : null,
    currentTask.owner !== initialTask?.owner ? `Responsabilité modifiée : ${initialTask?.owner || "non affectée"} → ${currentTask.owner || "non affectée"}` : null,
    currentTask.contentId !== initialTask?.contentId ? "Le dossier lié change; les références et la lignée doivent être revérifiées." : null,
    currentMeta.missionId !== initialMeta?.missionId ? "La mission d’appartenance change; les dépendances et milestones doivent être revérifiés." : null,
    JSON.stringify(currentMeta.dependencyIds) !== JSON.stringify(initialMeta?.dependencyIds) ? "Les prédécesseurs changent; les successeurs peuvent être affectés." : null,
    currentMeta.completionDefinition !== initialMeta?.completionDefinition || currentMeta.acceptanceCriteria !== initialMeta?.acceptanceCriteria ? "Les conditions acceptées changent; une reprise en charge peut être nécessaire." : null,
  ].filter(Boolean) as string[]

  function validate() {
    const missing = [
      !currentTask.title.trim() ? "Titre" : null,
      !currentTask.owner.trim() ? "Responsable" : null,
      !currentTask.dueDate ? "Échéance" : null,
      !currentMeta.objective?.trim() ? "Objectif" : null,
      !currentMeta.completionDefinition?.trim() ? "Définition de réalisation" : null,
      !currentMeta.acceptanceCriteria?.trim() ? "Critères d’acceptation" : null,
      !currentMeta.evidenceRequirement?.trim() ? "Preuve requise" : null,
      materialChange && !currentMeta.amendmentReason?.trim() ? "Motif d’amendement pour les changements matériels" : null,
    ].filter(Boolean) as string[]
    if (missing.length) {
      setError(`Informations requises : ${missing.join(", ")}.`)
      return false
    }
    return true
  }

  function save() {
    if (!validate()) return
    const updated = updateContentCommandTask(currentTask.id, () => currentTask)
    if (!updated) {
      setError("La tâche n’a pas pu être sauvegardée dans le registre.")
      return
    }
    const savedMeta = saveTaskExecutionMeta(currentTask.id, currentMeta)
    addTaskActivity(currentTask.id, materialChange ? "task_amended" : "task_updated", materialChange ? `Amendement : ${currentMeta.amendmentReason}` : "Instructions opérationnelles mises à jour.")
    setInitialTask({ ...updated })
    setInitialMeta(JSON.parse(JSON.stringify(savedMeta)) as TaskExecutionMeta)
    setTask({ ...updated })
    setMeta(savedMeta)
    setSaved(true)
    setError("")
  }

  function remove() {
    if (deleteConfirm !== currentTask.title) {
      setError("Saisissez le titre exact de la tâche avant suppression.")
      return
    }
    deleteContentCommandTask(currentTask.id)
    window.location.href = "/market-os/content-command-center/tasks"
  }

  return <Shell>
    <main className={styles.root} data-market-os-root>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}><ShieldAlert size={16}/> GOVERNED TASK EDITOR / AMENDEMENT CONTRÔLÉ</span>
          <h1>{task.title}</h1>
          <p>Modifier une instruction d’exécution peut affecter la mission, le calendrier, les dépendances, la preuve et le réviseur. Les changements matériels exigent un motif explicite.</p>
        </div>
        <div className={styles.heroActions}>
          <Link className={styles.primaryButton} href={`/market-os/content-command-center/tasks/${task.id}`}><ArrowLeft size={15}/>Retour au dossier</Link>
          <ExecutionBadge tone={dirty ? "warning" : "success"}>{dirty ? "Modifications non enregistrées" : "Synchronisé"}</ExecutionBadge>
        </div>
      </section>

      {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
      {saved ? <StatusMessage kind="success">Tâche sauvegardée et historique d’amendement mis à jour.</StatusMessage> : null}

      <section className={styles.editorLayout}>
        <nav className={styles.editorNav} aria-label="Sections de modification">
          {sections.map((item) => <button type="button" key={item.key} className={section === item.key ? styles.editorNavActive : ""} onClick={() => setSection(item.key)} aria-current={section === item.key ? "step" : undefined}>{item.icon}{item.label}</button>)}
        </nav>

        <div style={{ minWidth: 0 }}>
          {section === "identity" ? <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="IDENTITY" title="Identité de la tâche" description="Le titre et la priorité définissent l’unité d’exécution; ils ne remplacent pas l’objectif."/><div className={styles.formGrid}><label className={`${styles.label} ${styles.formWide}`}>Titre<input className={styles.field} value={task.title} onChange={(event) => setTaskField("title", event.target.value)}/></label><label className={styles.label}>Statut<select className={styles.select} value={task.status} onChange={(event) => setTaskField("status", event.target.value as ContentTask["status"])}>{(["todo", "doing", "blocked", "done"] as const).map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label><label className={styles.label}>Priorité<select className={styles.select} value={task.priority} onChange={(event) => setTaskField("priority", event.target.value as Priority)}>{priorities.map((value) => <option key={value}>{value}</option>)}</select></label></div></div></ExecutionPanel> : null}

          {section === "mission" ? <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="MISSION RELATIONSHIP" title="Mission, dossier et lignée" description="Changer une relation peut affecter les preuves, le calendrier et la responsabilité."/><div className={styles.formGrid}><label className={styles.label}>Dossier / contenu ID<input className={styles.field} value={task.contentId} onChange={(event) => setTaskField("contentId", event.target.value)}/></label><label className={styles.label}>Mission ID<input className={styles.field} value={meta.missionId || ""} onChange={(event) => setMetaField("missionId", event.target.value)}/></label></div></div></ExecutionPanel> : null}

          {section === "objective" ? <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="OBJECTIVE" title="Objectif et résultat exigé" description="L’employé doit comprendre le résultat, pas seulement le titre de la tâche."/><div className={styles.formGrid}><label className={`${styles.label} ${styles.formWide}`}>Objectif<textarea className={styles.textarea} value={meta.objective || ""} onChange={(event) => setMetaField("objective", event.target.value)}/></label><label className={`${styles.label} ${styles.formWide}`}>Résultat requis<textarea className={styles.textarea} value={meta.requiredOutput || ""} onChange={(event) => setMetaField("requiredOutput", event.target.value)}/></label></div></div></ExecutionPanel> : null}

          {section === "scope" ? <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="SCOPE GUARD" title="Périmètre autorisé et exclusions" description="Les exclusions protègent la mission contre les demandes latérales non approuvées."/><div className={styles.formGrid}><label className={`${styles.label} ${styles.formWide}`}>Dans le périmètre<textarea className={styles.textarea} value={meta.scope || ""} onChange={(event) => setMetaField("scope", event.target.value)}/></label><label className={`${styles.label} ${styles.formWide}`}>Hors périmètre<textarea className={styles.textarea} value={meta.outOfScope || ""} onChange={(event) => setMetaField("outOfScope", event.target.value)}/></label></div></div></ExecutionPanel> : null}

          {section === "ownership" ? <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="OWNERSHIP" title="Responsable et autorité de révision" description="La responsabilité d’exécution et la décision d’acceptation doivent rester distinctes."/><div className={styles.formGrid}><label className={styles.label}>Responsable<input className={styles.field} value={task.owner} onChange={(event) => setTaskField("owner", event.target.value)}/></label><label className={styles.label}>Réviseur<input className={styles.field} value={meta.reviewer || ""} onChange={(event) => setMetaField("reviewer", event.target.value)}/></label></div></div></ExecutionPanel> : null}

          {section === "schedule" ? <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="SCHEDULE" title="Dates et conséquence opérationnelle" description="Une nouvelle échéance ne déplace pas silencieusement les tâches dépendantes."/><div className={styles.formGrid}><label className={styles.label}>Échéance<input className={styles.field} type="date" value={task.dueDate} onChange={(event) => setTaskField("dueDate", event.target.value)}/></label><div className={styles.alert}><CalendarClock size={16}/><div>Ancienne date : {humanDate(initialTask?.dueDate)}. Nouvelle date : {humanDate(currentTask.dueDate)}. Les successeurs doivent être vérifiés manuellement.</div></div></div></div></ExecutionPanel> : null}

          {section === "dependencies" ? <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="DEPENDENCY IMPACT" title="Prédécesseurs et successeurs" description="Saisissez des identifiants séparés par des virgules. Aucun déplacement de date automatique n’est effectué."/><div className={styles.formGrid}><label className={`${styles.label} ${styles.formWide}`}>Prédécesseurs<input className={styles.field} value={meta.dependencyIds.join(", ")} onChange={(event) => setMetaField("dependencyIds", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))}/></label><label className={`${styles.label} ${styles.formWide}`}>Successeurs<input className={styles.field} value={meta.successorIds.join(", ")} onChange={(event) => setMetaField("successorIds", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))}/></label></div></div></ExecutionPanel> : null}

          {section === "completion" ? <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="COMPLETION STANDARD" title="Réalisation, qualité et acceptation" description="Ces champs déterminent ce qui peut être soumis et ce qui peut être accepté."/><div className={styles.formGrid}><label className={`${styles.label} ${styles.formWide}`}>Définition de réalisation<textarea className={styles.textarea} value={meta.completionDefinition || ""} onChange={(event) => setMetaField("completionDefinition", event.target.value)}/></label><label className={`${styles.label} ${styles.formWide}`}>Critères d’acceptation<textarea className={styles.textarea} value={meta.acceptanceCriteria || ""} onChange={(event) => setMetaField("acceptanceCriteria", event.target.value)}/></label><label className={`${styles.label} ${styles.formWide}`}>Critères qualité<textarea className={styles.textarea} value={meta.qualityCriteria || ""} onChange={(event) => setMetaField("qualityCriteria", event.target.value)}/></label></div></div></ExecutionPanel> : null}

          {section === "evidence" ? <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="EVIDENCE REQUIREMENTS" title="Preuve et source exigées" description="La preuve est définie avant l’exécution; elle n’est pas ajoutée après coup pour justifier un statut."/><div className={styles.formGrid}><label className={`${styles.label} ${styles.formWide}`}>Preuve requise<textarea className={styles.textarea} value={meta.evidenceRequirement || ""} onChange={(event) => setMetaField("evidenceRequirement", event.target.value)}/></label><label className={`${styles.label} ${styles.formWide}`}>Source requise<textarea className={styles.textarea} value={meta.sourceRequirement || ""} onChange={(event) => setMetaField("sourceRequirement", event.target.value)}/></label></div></div></ExecutionPanel> : null}

          {section === "review" ? <ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="REVIEW REQUIREMENTS" title="Gate de révision" description="La tâche ne peut pas auto-accepter son propre résultat."/><div className={styles.formGrid}><label className={`${styles.label} ${styles.formWide}`}>Exigence de révision<textarea className={styles.textarea} value={meta.reviewRequirement || ""} onChange={(event) => setMetaField("reviewRequirement", event.target.value)}/></label><div className={styles.alert}><ShieldAlert size={16}/><div>État actuel : {meta.workState.replaceAll("_", " ")}. Réviseur : {meta.reviewer || "non désigné"}.</div></div></div></div></ExecutionPanel> : null}

          {section === "impact" ? <div style={{ display: "grid", gap: 16 }}><ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="CHANGE IMPACT" title="Conséquences avant sauvegarde" description="Les impacts sont déterministes à partir des valeurs modifiées; aucun effet automatique n’est prétendu."/>{impacts.length ? <ul className={styles.missingList}>{impacts.map((impact) => <li key={impact}><AlertTriangle size={14}/>{impact}</li>)}</ul> : <StatusMessage kind="success">Aucun changement matériel détecté.</StatusMessage>}<label className={`${styles.label} ${styles.formWide}`} style={{ marginTop: 16 }}>Motif d’amendement<textarea className={styles.textarea} value={meta.amendmentReason || ""} onChange={(event) => setMetaField("amendmentReason", event.target.value)} placeholder="Obligatoire si une instruction acceptée, une date, une responsabilité ou une dépendance change."/></label></div></ExecutionPanel><ExecutionPanel><div className={styles.panelInner}><SectionHeading eyebrow="DESTRUCTIVE ACTION" title="Suppression exceptionnelle" description="La suppression retire la tâche, ses métadonnées d’exécution, sa checklist et son historique local. Elle n’est jamais l’action principale."/><div className={styles.alert}><Trash2 size={16}/><div>Saisissez exactement <strong>{task.title}</strong> pour activer la suppression.</div></div><input className={styles.field} value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder="Titre exact de la tâche"/><button type="button" className={styles.dangerButton} style={{ marginTop: 10 }} disabled={deleteConfirm !== task.title} onClick={remove}><Trash2 size={14}/>Supprimer définitivement</button></div></ExecutionPanel></div> : null}

          <div className={styles.saveBar} role="status" aria-live="polite"><p>{dirty ? "Modifications non sauvegardées. Vérifiez les impacts avant enregistrement." : "Toutes les modifications sont enregistrées."}</p><div style={{ display: "flex", gap: 8 }}><Link className={styles.quietButton} href={`/market-os/content-command-center/tasks/${task.id}`}>Annuler</Link><button type="button" className={styles.primaryButton} onClick={save} disabled={!dirty}><Save size={15}/>Sauvegarder</button></div></div>
        </div>
      </section>
    </main>
  </Shell>
}

export default TaskEditWorkspace
