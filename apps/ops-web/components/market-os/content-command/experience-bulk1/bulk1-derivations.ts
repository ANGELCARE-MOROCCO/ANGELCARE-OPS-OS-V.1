import type { CommandIntervention, CommandViewModel, DossierLifecycleStage, DossierViewModel, RunwayItemVM, Severity } from "../headquarters/mz2-view-models"
import { formatDateFr, humanStatus, isOverdue, severityFor } from "../headquarters/mz2-view-models"

export type Bulk1Perspective = "executive" | "production" | "focus" | "audit"
export type Bulk1CommandTab = "command" | "my-work"
export type WorkLaneKey = "now" | "today" | "returned" | "waiting" | "blocked" | "upcoming"

export type Bulk1WorkItem = {
  id: string
  title: string
  dossierCode: string
  dossierTitle: string
  stage: string
  reason: string
  consequence: string
  owner: string
  deadline: string
  severity: Severity
  href: string
  primaryLabel: string
  primaryKind: "open" | "resume-task"
  taskId?: string
  source: "intervention" | "decision" | "integrity" | "runway"
}

export type Bulk1WorkLanes = Record<WorkLaneKey, Bulk1WorkItem[]>

function interventionToWork(item: CommandIntervention): Bulk1WorkItem {
  const taskMatch = item.id.match(/^(?:blocked|overdue)-(.+)$/)
  return {
    id: item.id,
    title: item.title,
    dossierCode: "CONTEXTE",
    dossierTitle: item.category,
    stage: item.category,
    reason: item.detail,
    consequence: item.consequence,
    owner: item.owner,
    deadline: item.waitingLabel,
    severity: item.severity,
    href: item.href,
    primaryLabel: taskMatch ? "Reprendre la tâche" : "Ouvrir le contexte",
    primaryKind: taskMatch ? "resume-task" : "open",
    taskId: taskMatch?.[1],
    source: "intervention",
  }
}

function runwayToWork(item: RunwayItemVM): Bulk1WorkItem {
  return {
    id: `runway-${item.id}`,
    title: item.nextGate,
    dossierCode: item.code,
    dossierTitle: item.title,
    stage: item.stage,
    reason: item.blocker || `Le dossier est actuellement au stade « ${item.stage} » et son prochain gate est identifié.`,
    consequence: item.blocker ? "La progression reste bloquée tant que cette condition n’est pas résolue." : "Ce mouvement maintient la continuité du dossier et protège l’échéance annoncée.",
    owner: item.owner,
    deadline: item.deadline ? formatDateFr(item.deadline, true) : "Sans échéance exposée",
    severity: item.risk,
    href: item.href,
    primaryLabel: item.nextGate,
    primaryKind: "open",
    source: "runway",
  }
}

function isToday(value: string): boolean {
  if (!value) return false
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return false
  const now = new Date()
  return parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth() && parsed.getDate() === now.getDate()
}

function unique(items: Bulk1WorkItem[]): Bulk1WorkItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.href}:${item.title}:${item.stage}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function buildWorkLanes(model: CommandViewModel): Bulk1WorkLanes {
  const interventions = model.interventions.map(interventionToWork)
  const decisions = model.decisions.map((item) => ({ ...interventionToWork(item), source: "decision" as const, primaryLabel: "Rendre la décision" }))
  const integrity = model.integrity.map((item) => ({ ...interventionToWork(item), source: "integrity" as const, primaryLabel: "Résoudre le gate" }))
  const runway = model.runway.map(runwayToWork)

  const blocked = interventions.filter((item) => item.severity === "critical")
  const returned = runway.filter((item) => /correction|révision|rejet|retour/i.test(`${item.stage} ${item.reason}`))
  const waiting = unique([
    ...decisions,
    ...integrity,
    ...runway.filter((item) => /attente|review|révision|validation|source/i.test(`${item.stage} ${item.reason}`)),
  ])
  const today = runway.filter((item) => isToday(model.runway.find((runwayItem) => `runway-${runwayItem.id}` === item.id)?.deadline || "") || item.severity === "critical")
  const upcoming = runway.filter((item) => !today.some((todayItem) => todayItem.id === item.id) && !returned.some((returnedItem) => returnedItem.id === item.id))
  const now = unique([
    ...blocked.slice(0, 1),
    ...returned.slice(0, 1),
    ...decisions.slice(0, 1),
    ...runway.slice(0, 1),
  ]).slice(0, 1)

  return {
    now,
    today: unique(today).slice(0, 8),
    returned: unique(returned).slice(0, 8),
    waiting: unique(waiting).slice(0, 10),
    blocked: unique(blocked).slice(0, 8),
    upcoming: unique(upcoming).slice(0, 10),
  }
}

export function perspectiveDescription(perspective: Bulk1Perspective): string {
  const descriptions: Record<Bulk1Perspective, string> = {
    executive: "Décisions, exposition, blocages critiques et conséquences institutionnelles.",
    production: "Travail assigné, corrections, preuves, échéances et prochain gate exécutable.",
    focus: "Une responsabilité, un dossier et une action dominante sans bruit secondaire.",
    audit: "Historique, lignée, décisions, acteurs, versions et preuves de progression.",
  }
  return descriptions[perspective]
}

export function dominantWorkItem(lanes: Bulk1WorkLanes): Bulk1WorkItem | null {
  return lanes.now[0] || lanes.blocked[0] || lanes.returned[0] || lanes.today[0] || lanes.waiting[0] || lanes.upcoming[0] || null
}

export type DossierRequirement = {
  id: string
  label: string
  detail: string
  owner: string
  blocking: boolean
  resolved: boolean
  actionLabel: string
  href: string
}

export function currentLifecycleStage(dossier: DossierViewModel): DossierLifecycleStage {
  return dossier.lifecycle.find((stage) => stage.state === "current" || stage.state === "blocked") || dossier.lifecycle[0]
}

export function dossierRequirements(dossier: DossierViewModel): DossierRequirement[] {
  const requirements: DossierRequirement[] = []
  const hasCurrentSource = dossier.sources.some((source) => source.current)
  const hasEvidence = dossier.evidence.length > 0
  const hasHumanDecision = dossier.decisions.some((decision) => decision.type !== "AI" && ["approved", "validated", "pass", "pass_minor"].includes(decision.result))
  const hasOwner = !/non affecté/i.test(dossier.owner)
  const hasReviewer = !/non affecté/i.test(dossier.reviewer)
  const hasBrief = dossier.brief.objective !== "Objectif non défini" && dossier.brief.coreMessage !== "Message central non défini"
  const hasTaskBlocker = dossier.tasks.some((task) => Boolean(task.blocker) || task.status === "blocked")

  if (!hasOwner) requirements.push({ id: "owner", label: "Responsable du dossier manquant", detail: "La progression ne dispose pas d’un propriétaire imputable.", owner: "Direction Content Command", blocking: true, resolved: false, actionLabel: "Affecter dans le dossier", href: `#ownership` })
  if (!hasReviewer) requirements.push({ id: "reviewer", label: "Autorité de révision manquante", detail: "Le prochain gate de revue ou validation ne peut pas être attribué.", owner: dossier.owner, blocking: ["ai_review", "human_review", "validated"].includes(dossier.currentStage), resolved: false, actionLabel: "Ouvrir la gouvernance", href: `#ownership` })
  if (!hasBrief) requirements.push({ id: "brief", label: "Brief incomplet", detail: "L’objectif et le message central ne sont pas suffisamment documentés.", owner: dossier.owner, blocking: ["brief", "scope_locked", "planned"].includes(dossier.currentStage), resolved: false, actionLabel: "Compléter le brief", href: `?stage=brief` })
  if (hasTaskBlocker) requirements.push({ id: "task-blocker", label: "Blocage d’exécution actif", detail: dossier.tasks.find((task) => task.blocker)?.blocker || "Une tâche liée empêche la progression du dossier.", owner: dossier.tasks.find((task) => task.blocker)?.owner || dossier.owner, blocking: true, resolved: false, actionLabel: "Ouvrir l’exécution", href: `?stage=assigned` })
  if (["checkpoint_review", "ai_review", "human_review", "validated"].includes(dossier.currentStage) && !hasEvidence) requirements.push({ id: "evidence", label: "Preuve de version absente", detail: "La décision ne peut pas être considérée fondée sans preuve inspectable liée au dossier.", owner: dossier.owner, blocking: true, resolved: false, actionLabel: "Préparer la preuve", href: `?stage=checkpoint_review` })
  if (["validated", "source_required", "classified", "ready_distribution", "scheduled", "performance_review", "closed"].includes(dossier.currentStage) && !hasHumanDecision) requirements.push({ id: "decision", label: "Décision humaine non visible", detail: "Une recommandation IA ne remplace pas la conclusion d’une autorité humaine.", owner: dossier.reviewer, blocking: true, resolved: false, actionLabel: "Ouvrir la décision", href: `?stage=human_review` })
  if (["source_required", "classified", "ready_distribution", "scheduled", "performance_review", "closed"].includes(dossier.currentStage) && !hasCurrentSource) requirements.push({ id: "source", label: "Source canonique absente", detail: "La version éditable institutionnelle n’est pas sécurisée pour la distribution et la mémoire corporate.", owner: dossier.owner, blocking: true, resolved: false, actionLabel: "Sécuriser la source", href: `?stage=source_required` })
  if (["ready_distribution", "scheduled", "performance_review", "closed"].includes(dossier.currentStage) && dossier.publications.length === 0) requirements.push({ id: "package", label: "Package de distribution absent", detail: "Aucun canal, asset, copy ou fenêtre de publication n’est lié au dossier.", owner: dossier.owner, blocking: true, resolved: false, actionLabel: "Préparer la distribution", href: `?stage=ready_distribution` })

  if (!requirements.length) requirements.push({ id: "clear", label: "Aucun blocage critique visible", detail: "Les conditions observables du gate courant sont satisfaites. Vérifiez l’action dominante avant progression.", owner: dossier.owner, blocking: false, resolved: true, actionLabel: dossier.nextAction.label, href: dossier.nextAction.href })
  return requirements
}

export function dossierReadinessLabel(dossier: DossierViewModel, requirements: DossierRequirement[]): { label: string; severity: Severity; detail: string } {
  const blockers = requirements.filter((requirement) => requirement.blocking && !requirement.resolved)
  if (blockers.length) return { label: `${blockers.length} condition(s) bloquante(s)`, severity: "critical", detail: blockers[0].detail }
  if (dossier.readiness !== null) return { label: `${Math.round(dossier.readiness)}% de préparation observée`, severity: dossier.readiness >= 85 ? "success" : dossier.readiness >= 60 ? "warning" : "critical", detail: "Valeur exposée par le dossier, complétée par les contrôles déterministes de Bulk 1." }
  return { label: "Gate prêt à être vérifié", severity: "info", detail: "Aucun score n’est inventé lorsque la source ne fournit pas de mesure de préparation." }
}

export function stageLabel(stageKey: string): string {
  const labels: Record<string, string> = {
    opportunity: "Intelligence",
    ideation: "Stratégie",
    brief: "Brief",
    scope_locked: "Constitution",
    planned: "Planification",
    assigned: "Mission & tâches",
    in_creation: "Production",
    checkpoint_review: "Preuves",
    ai_review: "Revue IA",
    human_review: "Révision humaine",
    validated: "Validation",
    source_required: "Source canonique",
    classified: "Classification",
    ready_distribution: "Distribution",
    scheduled: "Publication",
    performance_review: "Performance & attribution",
    closed: "Apprentissage & clôture",
  }
  return labels[stageKey] || humanStatus(stageKey)
}

export function stageDescription(stageKey: string): string {
  const descriptions: Record<string, string> = {
    opportunity: "Qualifier le signal, sa source, sa crédibilité et la raison stratégique d’ouvrir ce dossier.",
    ideation: "Transformer l’intelligence en direction choisie, documentée et gouvernée.",
    brief: "Formaliser l’objectif, l’audience, le message, le format et les contraintes de production.",
    scope_locked: "Verrouiller le périmètre, les exclusions, les responsabilités et la définition de complétion.",
    planned: "Positionner la production, les checkpoints et la publication dans une fenêtre contrôlée.",
    assigned: "Piloter la mission, les tâches, les dépendances, les blockers et la preuve attendue.",
    in_creation: "Travailler sur la version courante, les variantes, les assets et les checkpoints de création.",
    checkpoint_review: "Rassembler une preuve inspectable, sa provenance et la version concernée.",
    ai_review: "Consulter l’interprétation IA comme avis explicable, jamais comme autorité finale.",
    human_review: "Résoudre les findings, comparer les versions et préparer une conclusion humaine.",
    validated: "Rendre une décision institutionnelle sur la bonne version, avec conditions et autorité.",
    source_required: "Sécuriser la source éditable canonique et préserver sa lignée de versions.",
    classified: "Confirmer la taxonomie, les droits, la rétention et la capacité de réutilisation.",
    ready_distribution: "Assembler les adaptations de canal, la copy, les assets, le tracking et le pré-flight.",
    scheduled: "Exécuter, confirmer, vérifier et prouver la publication autorisée.",
    performance_review: "Observer une fenêtre réelle, qualifier la provenance, conclure la suffisance, examiner l’attribution et décider l’optimisation.",
    closed: "Conserver la publication, la mesure, l’attribution, la décision et la leçon acceptée dans la mémoire institutionnelle.",
  }
  return descriptions[stageKey] || "Contrôler les conditions d’entrée, la preuve, l’autorité et le prochain mouvement du dossier."
}

export function nextTaskAction(dossier: DossierViewModel): { taskId: string; label: string; status: string; progress: number } | null {
  const task = dossier.tasks.find((item) => !["done", "closed", "cancelled"].includes(item.status))
  if (!task) return null
  if (["todo", "assigned", "accepted", "blocked"].includes(task.status)) return { taskId: task.id, label: task.status === "blocked" ? "Reprendre après résolution" : "Démarrer la tâche", status: "in_progress", progress: 25 }
  return { taskId: task.id, label: "Marquer prête pour revue", status: "submitted", progress: 100 }
}

export function dossierStatusSummary(dossier: DossierViewModel): string {
  const overdue = isOverdue(dossier.dueAt)
  const current = currentLifecycleStage(dossier)
  return `${stageLabel(current.key)} · ${overdue ? "échéance dépassée" : dossier.dueAt ? `échéance ${formatDateFr(dossier.dueAt)}` : "sans échéance exposée"} · ${humanStatus(dossier.status)}`
}

export function severityClassName(severity: Severity): string {
  return `tone-${severity}`
}

export function stageTone(stage: DossierLifecycleStage): Severity {
  if (stage.state === "blocked") return "critical"
  if (stage.state === "current") return "info"
  if (stage.state === "complete") return "success"
  if (stage.state === "waiting") return "warning"
  return severityFor(stage.state)
}
