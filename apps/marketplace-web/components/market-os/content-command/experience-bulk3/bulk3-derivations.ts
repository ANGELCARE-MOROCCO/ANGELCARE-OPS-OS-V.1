import type { ContentItem, ContentTask } from "@/components/market-os/content-command/content-command-system"
import type { TaskChecklistItem, TaskExecutionMeta } from "@/lib/content-command/tasks/task-activity"
import { taskIsOverdue, taskNextAction, taskReadiness } from "../execution/task-operating-model"
import type { AmendmentClass, MissionReadinessState, TaskOperatingState } from "./bulk3-types"

export function missionReadiness(mission: any, tasks: any[]): MissionReadinessState {
  const missing = [
    !mission?.objective ? "Objectif opérationnel non défini" : null,
    !mission?.scope ? "Périmètre autorisé non défini" : null,
    !mission?.success_definition ? "Définition de réussite absente" : null,
    !mission?.assigned_to_name ? "Responsable de mission non affecté" : null,
    !mission?.reviewer_name ? "Autorité de révision non désignée" : null,
    !mission?.due_at ? "Échéance non définie" : null,
    !tasks.length ? "Architecture de tâches absente" : null,
    tasks.some((task) => !task.assigned_to_name && !mission?.assigned_to_name) ? "Tâche sans responsable" : null,
    tasks.some((task) => !task.completion_definition && !task.description) ? "Définition de réalisation incomplète" : null,
  ].filter(Boolean) as string[]
  const status = String(mission?.status || "")
  const total = 9
  const completed = Math.max(0, total - missing.length)
  let state: MissionReadinessState["state"] = "constitution-incomplete"
  if (status === "closed") state = "closed"
  else if (status === "validated") state = "closure-pending"
  else if (["blocked", "paused"].includes(status)) state = "at-risk"
  else if (["accepted", "in_progress", "checkpoint", "submitted", "ai_review", "human_review", "revision"].includes(status)) state = "active"
  else if (!missing.length) state = "ready"
  else if (missing.some((item) => item.toLowerCase().includes("responsable"))) state = "ownership-required"
  else if (missing.some((item) => item.toLowerCase().includes("architecture") || item.toLowerCase().includes("réalisation"))) state = "dependency-required"
  else if (missing.some((item) => item.toLowerCase().includes("autorité"))) state = "authority-required"
  return { ready: missing.length === 0, state, missing, completed, total }
}

export function missionDominantAction(mission: any, readiness: MissionReadinessState) {
  const status = String(mission?.status || "proposed")
  if (readiness.missing.length) return { label: "Résoudre la constitution", targetStatus: status }
  const transitions: Record<string, { label: string; targetStatus: string }> = {
    proposed: { label: "Qualifier la mission", targetStatus: "qualifying" },
    qualifying: { label: "Approuver le périmètre", targetStatus: "scope_approved" },
    scope_approved: { label: "Déclarer prête", targetStatus: "ready" },
    ready: { label: "Libérer la mission", targetStatus: "assigned" },
    assigned: { label: "Confirmer la prise en charge", targetStatus: "accepted" },
    accepted: { label: "Démarrer l’exécution", targetStatus: "in_progress" },
    in_progress: { label: "Ouvrir le checkpoint", targetStatus: "checkpoint" },
    checkpoint: { label: "Soumettre les preuves", targetStatus: "submitted" },
    submitted: { label: "Transmettre à l’autorité", targetStatus: "human_review" },
    human_review: { label: "Valider la mission", targetStatus: "validated" },
    revision: { label: "Reprendre l’exécution", targetStatus: "in_progress" },
    validated: { label: "Clôturer la mission", targetStatus: "closed" },
    blocked: { label: "Lever le blocage", targetStatus: "in_progress" },
    paused: { label: "Reprendre la mission", targetStatus: "in_progress" },
  }
  return transitions[status] || { label: "Inspecter la prochaine autorité", targetStatus: status }
}

export function missionClosureMissing(mission: any, tasks: any[]) {
  return [
    tasks.some((task) => !["done", "closed", "validated"].includes(String(task.status))) ? "Des tâches restent ouvertes" : null,
    tasks.some((task) => task.evidence_required && !(task as any).evidence_id) ? "Des preuves obligatoires restent absentes" : null,
    String(mission?.status) !== "validated" && String(mission?.status) !== "closed" ? "La validation finale n’est pas obtenue" : null,
  ].filter(Boolean) as string[]
}

export function taskOperatingState(
  task: ContentTask,
  item: ContentItem | null | undefined,
  meta: TaskExecutionMeta,
  checklist: TaskChecklistItem[],
): TaskOperatingState {
  const readiness = taskReadiness(task, meta, checklist)
  return {
    task,
    item,
    meta,
    checklist,
    openBlockers: meta.blockers.filter((record) => record.state !== "resolved").length,
    openClarifications: meta.clarifications.filter((record) => record.state === "open" || record.state === "reopened").length,
    acceptedEvidence: meta.evidences.filter((record) => record.state === "accepted").length,
    submittedEvidence: meta.evidences.filter((record) => record.state === "submitted").length,
    readinessMissing: readiness.missing,
    readinessReady: readiness.ready,
    nextAction: taskNextAction(task, meta),
  }
}

export function taskAttentionWeight(state: TaskOperatingState) {
  let score = 0
  if (state.openBlockers) score += 100
  if (taskIsOverdue(state.task)) score += 80
  if (state.meta.workState === "returned") score += 70
  if (state.openClarifications) score += 45
  if (state.meta.workState === "submitted") score += 35
  if (!state.task.owner) score += 30
  score += ({ Critical: 25, High: 18, Medium: 10, Low: 2 } as const)[state.task.priority] || 0
  return score
}

export function taskType(task: ContentTask, meta: TaskExecutionMeta) {
  const text = `${task.title} ${task.notes} ${meta.objective || ""} ${meta.requiredOutput || ""}`.toLowerCase()
  if (/recherche|analyse|signal|source/.test(text)) return "research"
  if (/révision|correction|review|validation/.test(text)) return "review"
  if (/plan|planning|calendrier|distribution/.test(text)) return "planning"
  if (/preuve|evidence|capture|confirmation/.test(text)) return "evidence"
  if (/visuel|design|vidéo|video|copy|contenu|brochure|document|production/.test(text)) return "production"
  return "execution"
}

export function taskWorkstationLabel(task: ContentTask, meta: TaskExecutionMeta) {
  const kind = taskType(task, meta)
  return ({
    research: "Atelier de recherche et qualification",
    review: "Poste de correction et conformité",
    planning: "Poste d’orchestration temporelle",
    evidence: "Poste de preuve et traçabilité",
    production: "Atelier de production contrôlée",
    execution: "Poste d’exécution opérationnelle",
  } as const)[kind]
}

export function classifyAmendment(current: ContentTask, proposed: ContentTask, currentMeta: TaskExecutionMeta, proposedMeta: TaskExecutionMeta): AmendmentClass {
  if (current.contentId !== proposed.contentId || currentMeta.objective !== proposedMeta.objective) return "strategic"
  if (currentMeta.scope !== proposedMeta.scope || currentMeta.outOfScope !== proposedMeta.outOfScope) return "scope"
  if (currentMeta.completionDefinition !== proposedMeta.completionDefinition || currentMeta.acceptanceCriteria !== proposedMeta.acceptanceCriteria) return "completion"
  if (currentMeta.dependencyIds.join("|") !== proposedMeta.dependencyIds.join("|")) return "dependency"
  if (current.owner !== proposed.owner || currentMeta.reviewer !== proposedMeta.reviewer) return "ownership"
  if (current.dueDate !== proposed.dueDate) return "deadline"
  if (current.title !== proposed.title || current.priority !== proposed.priority) return "operational"
  return "clarification"
}

export function amendmentAuthority(kind: AmendmentClass) {
  return ({
    clarification: "Responsable de tâche",
    operational: "Responsable de mission",
    scope: "Autorité de mission",
    deadline: "Responsable de mission et planning",
    ownership: "Responsable de mission",
    dependency: "Coordination de mission",
    completion: "Réviseur / autorité d’acceptation",
    strategic: "Direction stratégique et propriétaire du dossier",
  } as const)[kind]
}

export function amendmentImpact(kind: AmendmentClass) {
  return ({
    clarification: ["Historique de tâche"],
    operational: ["Priorité", "Séquence de travail", "My Work"],
    scope: ["Mission", "Livrables", "Preuves", "Revue"],
    deadline: ["Planning", "Mission", "Revue", "Publication"],
    ownership: ["My Work", "Responsabilité", "Handover"],
    dependency: ["Prédécesseurs", "Successeurs", "Chemin critique"],
    completion: ["Checklist", "Preuves", "Acceptation"],
    strategic: ["Dossier", "Mission", "Brief", "Planification"],
  } as const)[kind]
}
