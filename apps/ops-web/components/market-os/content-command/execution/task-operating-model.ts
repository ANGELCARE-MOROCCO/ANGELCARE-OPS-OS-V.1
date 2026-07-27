import type { ContentItem, ContentTask } from "@/components/market-os/content-command/content-command-system"
import type { TaskChecklistItem, TaskExecutionMeta } from "@/lib/content-command/tasks/task-activity"

export type TaskReadiness = {
  score: number
  ready: boolean
  missing: string[]
}

export type TaskQueueKey = "today" | "overdue" | "blocked" | "unassigned" | "clarification" | "evidence" | "review" | "returned" | "ready_close"

export function parseDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function dateKey(value?: string) {
  return value?.slice(0, 10) || ""
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function taskIsOverdue(task: ContentTask) {
  return Boolean(task.dueDate && task.dueDate < todayKey() && task.status !== "done")
}

export function taskIsDueToday(task: ContentTask) {
  return dateKey(task.dueDate) === todayKey() && task.status !== "done"
}

export function priorityWeight(priority: ContentTask["priority"]) {
  return ({ Low: 1, Medium: 2, High: 3, Critical: 4 } as const)[priority] ?? 0
}

export function taskReadiness(task: ContentTask, meta: TaskExecutionMeta, checklist: TaskChecklistItem[]): TaskReadiness {
  const missing = [
    !task.title.trim() ? "Titre de la tâche" : null,
    !task.owner.trim() ? "Responsable" : null,
    !task.dueDate ? "Échéance" : null,
    !meta.objective?.trim() ? "Objectif" : null,
    !meta.completionDefinition?.trim() ? "Définition de réalisation" : null,
    !meta.acceptanceCriteria?.trim() ? "Critères d’acceptation" : null,
    !meta.evidenceRequirement?.trim() ? "Preuve requise" : null,
    meta.blockers.some((item) => item.state !== "resolved" && item.severity === "critical") ? "Blocage critique non résolu" : null,
  ].filter(Boolean) as string[]

  const requiredChecklist = checklist.filter((item) => item.required)
  const completedRequired = requiredChecklist.filter((item) => item.done).length
  const baseChecks = 7
  const satisfiedBase = baseChecks - missing.filter((item) => item !== "Blocage critique non résolu").length
  const checklistScore = requiredChecklist.length ? completedRequired / requiredChecklist.length : 0
  const score = Math.max(0, Math.min(100, Math.round((satisfiedBase / baseChecks) * 75 + checklistScore * 25)))
  const ready = missing.length === 0 && (requiredChecklist.length === 0 || completedRequired === requiredChecklist.length)
  return { score, ready, missing }
}

export function sortTasksForCommand(tasks: ContentTask[], metas: Record<string, TaskExecutionMeta>) {
  return [...tasks].sort((a, b) => {
    const aMeta = metas[a.id]
    const bMeta = metas[b.id]
    const aCriticalBlocker = aMeta?.blockers.some((item) => item.state !== "resolved" && item.severity === "critical") ? 1 : 0
    const bCriticalBlocker = bMeta?.blockers.some((item) => item.state !== "resolved" && item.severity === "critical") ? 1 : 0
    if (aCriticalBlocker !== bCriticalBlocker) return bCriticalBlocker - aCriticalBlocker
    const aOverdue = taskIsOverdue(a) ? 1 : 0
    const bOverdue = taskIsOverdue(b) ? 1 : 0
    if (aOverdue !== bOverdue) return bOverdue - aOverdue
    const priorityDiff = priorityWeight(b.priority) - priorityWeight(a.priority)
    if (priorityDiff) return priorityDiff
    return (a.dueDate || "9999").localeCompare(b.dueDate || "9999")
  })
}

export function taskQueueMatch(task: ContentTask, meta: TaskExecutionMeta, queue: TaskQueueKey) {
  switch (queue) {
    case "today": return taskIsDueToday(task)
    case "overdue": return taskIsOverdue(task)
    case "blocked": return task.status === "blocked" || meta.blockers.some((item) => item.state !== "resolved")
    case "unassigned": return !task.owner.trim()
    case "clarification": return meta.clarifications.some((item) => item.state === "open" || item.state === "reopened")
    case "evidence": return Boolean(meta.evidenceRequirement) && meta.evidences.every((item) => item.state === "draft")
    case "review": return meta.workState === "submitted"
    case "returned": return meta.workState === "returned"
    case "ready_close": return task.status === "done" && meta.evidences.some((item) => item.state === "accepted")
    default: return false
  }
}

export function taskNextAction(task: ContentTask, meta: TaskExecutionMeta) {
  const openBlocker = meta.blockers.find((item) => item.state !== "resolved")
  if (openBlocker) return `Résoudre le blocage : ${openBlocker.description}`
  if (meta.clarifications.some((item) => item.state === "open" || item.state === "reopened")) return "Obtenir la clarification attendue"
  if (!meta.completionDefinition?.trim()) return "Définir précisément la condition de réalisation"
  if (!meta.evidenceRequirement?.trim()) return "Définir la preuve exigée"
  if (task.status === "todo") return "Accepter puis démarrer l’exécution"
  if (task.status === "doing" && !meta.evidences.length) return "Préparer la preuve de réalisation"
  if (meta.workState === "submitted") return "Attendre la décision du réviseur"
  if (task.status === "done") return "Vérifier l’acceptation et la tâche suivante"
  return "Ouvrir le poste d’exécution"
}

export function taskLineage(task: ContentTask, item?: ContentItem | null, meta?: TaskExecutionMeta) {
  return [
    { label: "Dossier", value: item?.title || task.contentId || "Non relié", href: item ? `/market-os/content-command-center/${item.id}` : undefined },
    { label: "Mission", value: meta?.missionId || "Mission non renseignée", href: meta?.missionId ? "/market-os/content-command-center/missions" : undefined },
    { label: "Tâche", value: task.title },
    { label: "Preuve", value: meta?.evidences.length ? `${meta.evidences.length} preuve(s)` : "Aucune preuve" },
    { label: "Révision", value: meta?.workState === "submitted" ? "En attente" : meta?.workState === "returned" ? "Correction demandée" : "Non soumise" },
  ]
}

export function humanDate(value?: string) {
  if (!value) return "Non définie"
  const parsed = parseDate(value)
  if (!parsed) return value
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(parsed)
}
