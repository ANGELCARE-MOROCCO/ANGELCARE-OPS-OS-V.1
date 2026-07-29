export type UnknownRecord = Record<string, unknown>

export type Severity = "critical" | "warning" | "info" | "success" | "neutral"

export type CommandIntervention = {
  id: string
  category: string
  title: string
  detail: string
  consequence: string
  owner: string
  waitingLabel: string
  severity: Severity
  href: string
}

export type LifecycleStageVM = {
  key: string
  label: string
  href: string
  active: number
  blocked: number
  waiting: number
  oldestLabel: string
}

export type RunwayItemVM = {
  id: string
  code: string
  title: string
  stage: string
  owner: string
  reviewer: string
  deadline: string
  progress: number | null
  readiness: number | null
  risk: Severity
  blocker: string
  nextGate: string
  href: string
}

export type CommandViewModel = {
  refreshedAt: string
  mandate: {
    configured: boolean
    title: string
    period: string
    sponsor: string
    objective: string
    priorities: string[]
    state: string
  }
  health: {
    activeDossiers: number
    blockedWork: number
    overdueWork: number
    pendingDecisions: number
    evidenceGaps: number
    sourceRisks: number
    failedPublications: number
  }
  interventions: CommandIntervention[]
  lifecycle: LifecycleStageVM[]
  runway: RunwayItemVM[]
  decisions: CommandIntervention[]
  integrity: CommandIntervention[]
  capacity: Array<{ owner: string; active: number; overdue: number; blocked: number }>
  activity: Array<{ id: string; label: string; detail: string; actor: string; timestamp: string; href: string }>
  waveConfigured: boolean
}

export type DossierLifecycleStage = {
  key: string
  label: string
  state: "complete" | "current" | "blocked" | "waiting" | "future" | "skipped"
  detail: string
}

export type DossierTaskVM = {
  id: string
  sequence: number
  title: string
  status: string
  owner: string
  dueAt: string
  completion: string
  blocker: string
  href: string
}

export type DossierEvidenceVM = {
  id: string
  title: string
  type: string
  filename: string
  status: string
  note: string
  createdAt: string
  previewUrl: string
  actor: string
}

export type DossierDecisionVM = {
  id: string
  type: "AI" | "HUMAN" | "AUTHORITY"
  title: string
  result: string
  summary: string
  score: number | null
  createdAt: string
  actor: string
}

export type DossierSourceVM = {
  id: string
  current: boolean
  filename: string
  version: string
  integrity: string
  createdAt: string
  rights: string
  retention: string
  kind: "canonical" | "previous" | "rendition" | "export" | "evidence"
}

export type DossierViewModel = {
  sourceType: "headquarters" | "legacy"
  partial: boolean
  id: string
  code: string
  title: string
  family: string
  category: string
  subcategory: string
  service: string
  audience: string
  city: string
  language: string
  channel: string
  campaign: string
  journeyStage: string
  priority: string
  status: string
  progress: number | null
  readiness: number | null
  risk: Severity
  owner: string
  reviewer: string
  sponsor: string
  dueAt: string
  updatedAt: string
  currentStage: string
  missionId: string
  constitution: {
    objective: string
    contentObjective: string
    message: string
    offer: string
    cta: string
    requiredOutput: string
    mandatory: string[]
    prohibited: string[]
    inScope: string[]
    outOfScope: string[]
    constraints: string[]
    completionDefinition: string
    state: string
  }
  lineage: Array<{ type: string; title: string; state: string; href: string }>
  ownership: Array<{ role: string; person: string; state: string }>
  brief: {
    version: string
    objective: string
    audience: string
    userProblem: string
    coreMessage: string
    supportingMessages: string[]
    format: string
    channels: string[]
    tone: string
    references: string[]
    deadline: string
    state: string
  }
  lifecycle: DossierLifecycleStage[]
  tasks: DossierTaskVM[]
  evidence: DossierEvidenceVM[]
  decisions: DossierDecisionVM[]
  sources: DossierSourceVM[]
  assets: Array<{ id: string; title: string; type: string; status: string; url: string; owner: string }>
  publications: Array<{ id: string; channel: string; status: string; scheduledAt: string; publishedAt: string; externalUrl: string; owner: string; evidence: UnknownRecord[] }>
  activity: Array<{ id: string; action: string; detail: string; actor: string; timestamp: string }>
  nextAction: { label: string; detail: string; href: string }
}

export function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {}
}

export function array(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.filter((item): item is UnknownRecord => Boolean(item) && typeof item === "object") : []
}

export function text(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return fallback
}

export function numberValue(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function bool(value: unknown): boolean {
  return value === true || value === "true" || value === 1
}

export function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean)
  if (typeof value === "string") return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
  return []
}

export function safeDate(value: unknown): string {
  const raw = text(value)
  if (!raw) return ""
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString()
}

export function formatDateFr(value: string, includeTime = false): string {
  if (!value) return "Non définie"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat("fr-FR", includeTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(parsed)
}

export function isOverdue(value: string): boolean {
  if (!value) return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() < Date.now()
}

export function humanStatus(value: string): string {
  const labels: Record<string, string> = {
    opportunity: "Opportunité",
    ideation: "Idéation",
    brief: "Brief",
    scope_locked: "Périmètre verrouillé",
    planned: "Planifié",
    assigned: "Affecté",
    accepted: "Accepté",
    in_creation: "En création",
    in_progress: "En cours",
    checkpoint: "Checkpoint",
    checkpoint_review: "Revue de checkpoint",
    draft_submitted: "Version soumise",
    submitted: "Soumis",
    ai_review: "Revue IA",
    human_review: "Révision humaine",
    revision: "Correction requise",
    revision_required: "Correction requise",
    validated: "Validé",
    approved: "Approuvé",
    source_required: "Source requise",
    source_secured: "Source sécurisée",
    classified: "Classifié",
    ready_distribution: "Prêt à diffuser",
    scheduled: "Planifié pour diffusion",
    published: "Publié",
    closed: "Clôturé",
    blocked: "Bloqué",
    failed: "Échec",
    rejected: "Rejeté",
    archived: "Archivé",
    draft: "Brouillon",
    review: "En révision",
    idea: "Idée",
    todo: "À faire",
    doing: "En cours",
    done: "Terminé",
    verified: "Vérifiée",
    pending: "En attente",
  }
  return labels[value] || value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function severityFor(value: string): Severity {
  const status = value.toLowerCase()
  if (["critical", "failed", "blocked", "rejected", "overdue", "integrity_failed", "cancelled"].some((part) => status.includes(part))) return "critical"
  if (["warning", "review", "pending", "submitted", "source_required", "revision", "draft"].some((part) => status.includes(part))) return "warning"
  if (["approved", "verified", "validated", "published", "closed", "done", "healthy"].some((part) => status.includes(part))) return "success"
  if (["active", "in_progress", "qualified", "scheduled"].some((part) => status.includes(part))) return "info"
  return "neutral"
}

const COMMAND_LIFECYCLE = [
  { key: "signal", label: "Signal", statuses: ["detected", "qualified", "signal"], href: "/market-os/content-command-center/signals" },
  { key: "strategy", label: "Stratégie", statuses: ["strategy", "approved_strategy"], href: "/market-os/content-command-center/strategies" },
  { key: "brief", label: "Brief", statuses: ["brief"], href: "/market-os/content-command-center/briefs" },
  { key: "constitution", label: "Constitution", statuses: ["scope_locked", "opportunity", "ideation"], href: "/market-os/content-command-center/directory" },
  { key: "mission", label: "Mission", statuses: ["assigned", "accepted"], href: "/market-os/content-command-center/missions" },
  { key: "execution", label: "Exécution", statuses: ["in_progress", "in_creation", "checkpoint"], href: "/market-os/content-command-center/tasks" },
  { key: "evidence", label: "Preuve", statuses: ["checkpoint_review", "draft_submitted", "submitted"], href: "/market-os/content-command-center/evidence" },
  { key: "review", label: "Révision", statuses: ["ai_review", "human_review", "revision", "review"], href: "/market-os/content-command-center/review" },
  { key: "validation", label: "Validation", statuses: ["validated", "approved"], href: "/market-os/content-command-center/validation" },
  { key: "source", label: "Source", statuses: ["source_required", "source_secured"], href: "/market-os/content-command-center/source-vault" },
  { key: "distribution", label: "Diffusion", statuses: ["classified", "ready_distribution", "scheduled"], href: "/market-os/content-command-center/distribution" },
  { key: "publication", label: "Publication", statuses: ["published"], href: "/market-os/content-command-center/publishing" },
  { key: "performance", label: "Performance", statuses: ["performance_review"], href: "/market-os/content-command-center/performance" },
  { key: "learning", label: "Apprentissage", statuses: ["closed"], href: "/market-os/content-command-center/learning" },
] as const

function deadlineLabel(value: string): string {
  if (!value) return "Sans échéance"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const diffDays = Math.ceil((parsed.getTime() - Date.now()) / 86_400_000)
  if (diffDays < 0) return `${Math.abs(diffDays)} j de retard`
  if (diffDays === 0) return "Échéance aujourd’hui"
  if (diffDays === 1) return "Échéance demain"
  return `Échéance dans ${diffDays} j`
}

export function buildCommandViewModel(snapshotValue: unknown): CommandViewModel {
  const snapshot = record(snapshotValue)
  const dossiers = array(snapshot.dossiers)
  const missions = array(snapshot.missions)
  const tasks = array(snapshot.tasks)
  const evidence = array(snapshot.evidence)
  const reviews = array(snapshot.reviews)
  const sources = array(snapshot.sources)
  const packages = array(snapshot.publicationPackages)
  const activitySource = [...array(snapshot.activity), ...array(snapshot.activities), ...array(snapshot.auditEvents)]
  const mandateRecord = record(snapshot.mandate)
  const configuredMandate = Boolean(text(mandateRecord.title) || text(mandateRecord.objective))

  const activeDossiers = dossiers.filter((item) => !["closed", "archived", "cancelled"].includes(text(item.status))).length
  const blockedTasks = tasks.filter((item) => text(item.status) === "blocked")
  const overdueTasks = tasks.filter((item) => !["done", "closed", "cancelled"].includes(text(item.status)) && isOverdue(safeDate(item.due_at || item.dueDate)))
  const decisionDossiers = dossiers.filter((item) => ["human_review", "validated", "source_required", "revision_required"].includes(text(item.status)))
  const evidenceGaps = dossiers.filter((item) => ["checkpoint_review", "draft_submitted", "submitted", "ai_review", "human_review"].includes(text(item.status)) && !evidence.some((proof) => text(proof.dossier_id) === text(item.id))).length
  const sourceRisks = sources.filter((item) => bool(item.is_current) && !["verified", "healthy"].includes(text(item.integrity_state))).length + dossiers.filter((item) => text(item.status) === "source_required").length
  const failedPublications = packages.filter((item) => ["failed", "error"].includes(text(item.status))).length

  const interventions: CommandIntervention[] = []
  for (const task of blockedTasks.slice(0, 6)) {
    const dossierId = text(task.dossier_id || task.entity_id)
    interventions.push({
      id: `blocked-${text(task.id)}`,
      category: "Blocage d’exécution",
      title: text(task.title, "Tâche bloquée"),
      detail: text(task.blocker_reason || task.notes || task.completion_definition, "Le travail ne peut pas progresser sans intervention."),
      consequence: "Le prochain gate du dossier reste inaccessible.",
      owner: text(task.owner_name || task.owner, "Responsable non affecté"),
      waitingLabel: deadlineLabel(safeDate(task.due_at || task.dueDate)),
      severity: "critical",
      href: dossierId ? `/market-os/content-command-center/dossiers/${dossierId}` : "/market-os/content-command-center/tasks",
    })
  }
  for (const task of overdueTasks.slice(0, 5)) {
    interventions.push({
      id: `overdue-${text(task.id)}`,
      category: "Menace d’échéance",
      title: text(task.title, "Échéance dépassée"),
      detail: text(task.completion_definition || task.notes, "La définition de complétion reste ouverte."),
      consequence: "La chaîne de revue ou de publication peut être retardée.",
      owner: text(task.owner_name || task.owner, "Responsable non affecté"),
      waitingLabel: deadlineLabel(safeDate(task.due_at || task.dueDate)),
      severity: "critical",
      href: text(task.id) ? `/market-os/content-command-center/tasks/${text(task.id)}` : "/market-os/content-command-center/tasks",
    })
  }
  for (const dossier of dossiers.filter((item) => !text(item.owner_name || item.owner)).slice(0, 4)) {
    interventions.push({
      id: `owner-${text(dossier.id)}`,
      category: "Responsabilité manquante",
      title: text(dossier.title, "Dossier sans responsable"),
      detail: "Aucun responsable de dossier n’est visible dans la source consolidée.",
      consequence: "Les décisions et handovers ne disposent pas d’un point d’imputabilité clair.",
      owner: "Direction Content Command",
      waitingLabel: "Affectation requise",
      severity: "warning",
      href: `/market-os/content-command-center/dossiers/${text(dossier.id)}`,
    })
  }
  for (const item of packages.filter((pkg) => ["failed", "error"].includes(text(pkg.status))).slice(0, 4)) {
    interventions.push({
      id: `publication-${text(item.id)}`,
      category: "Échec de publication",
      title: text(item.title || item.channel, "Package de diffusion en échec"),
      detail: text(item.error_message || item.notes, "La diffusion n’a pas été confirmée."),
      consequence: "La publication doit être récupérée ou replanifiée avant clôture.",
      owner: text(item.owner_name || item.owner, "Publisher non affecté"),
      waitingLabel: deadlineLabel(safeDate(item.scheduled_at)),
      severity: "critical",
      href: "/market-os/content-command-center/publishing",
    })
  }
  for (const item of packages) {
    const packageEvidence = array(item.evidence)
    const latestEvent = (type: string) => [...packageEvidence].reverse().find((event) => text(event.type) === type)
    const verification = latestEvent("publication_verification")
    const observation = latestEvent("performance_observation")
    const conclusion = latestEvent("performance_conclusion")
    const attribution = latestEvent("attribution_conclusion")
    const optimization = latestEvent("optimization_decision")
    const lesson = latestEvent("institutional_lesson")
    const governance = latestEvent("lesson_governance")
    const verified = text(item.status) === "verified" && text(verification?.conclusion) === "verified"
    const packageHref = `/market-os/content-command-center/performance?packageId=${encodeURIComponent(text(item.id))}`
    if (verified && !observation) {
      interventions.push({
        id: `impact-observation-${text(item.id)}`,
        category: "Observation post-publication",
        title: text(item.title || item.channel, "Publication vérifiée sans observation"),
        detail: "La vérité externe est confirmée, mais aucune fenêtre, provenance ou métrique réelle n’est encore constituée.",
        consequence: "Le dossier ne peut pas produire de conclusion d’impact ni d’apprentissage institutionnel.",
        owner: text(item.owner_name || item.owner, "Responsable impact non affecté"),
        waitingLabel: "Observation à ouvrir",
        severity: "warning",
        href: packageHref,
      })
    } else if (observation && !conclusion) {
      interventions.push({
        id: `impact-conclusion-${text(item.id)}`,
        category: "Suffisance de mesure",
        title: text(item.title || item.channel, "Observation sans conclusion"),
        detail: "Des métriques et leur provenance sont enregistrées, mais aucune autorité humaine n’a conclu leur suffisance.",
        consequence: "Toute attribution ou affirmation d’impact reste interdite.",
        owner: text(item.reviewer_name || item.owner_name || item.owner, "Réviseur impact non affecté"),
        waitingLabel: "Conclusion requise",
        severity: "warning",
        href: packageHref,
      })
    } else if (text(conclusion?.conclusion) === "sufficient" && !attribution) {
      interventions.push({
        id: `attribution-${text(item.id)}`,
        category: "Attribution à examiner",
        title: text(item.title || item.channel, "Résultat sans attribution"),
        detail: "La mesure est jugée suffisante, mais le lien entre contenu, parcours et issue métier reste à constituer.",
        consequence: "Aucun revenu ni résultat métier ne doit être revendiqué comme attribué.",
        owner: text(item.reviewer_name || item.owner_name || item.owner, "Autorité d’attribution non affectée"),
        waitingLabel: "Examen humain requis",
        severity: "info",
        href: `/market-os/content-command-center/attribution?packageId=${encodeURIComponent(text(item.id))}`,
      })
    } else if (attribution && !optimization) {
      interventions.push({
        id: `optimization-${text(item.id)}`,
        category: "Décision d’optimisation",
        title: text(item.title || item.channel, "Impact sans prochaine décision"),
        detail: "Le résultat est attribué ou explicitement non établi, mais aucune action gouvernée n’en découle encore.",
        consequence: "Le prochain cycle ne bénéficie pas de la connaissance constituée.",
        owner: text(item.owner_name || item.owner, "Autorité d’optimisation non affectée"),
        waitingLabel: "Décision requise",
        severity: "info",
        href: `/market-os/content-command-center/optimization?packageId=${encodeURIComponent(text(item.id))}`,
      })
    } else if (optimization && (!lesson || !governance)) {
      interventions.push({
        id: `learning-${text(item.id)}`,
        category: "Mémoire institutionnelle",
        title: text(item.title || item.channel, "Décision sans leçon gouvernée"),
        detail: lesson ? "Une leçon est rédigée mais n’a pas encore reçu de décision humaine." : "La décision d’optimisation n’a pas encore été transformée en apprentissage réutilisable.",
        consequence: "Le dossier ne peut pas être clôturé comme mémoire institutionnelle complète.",
        owner: text(item.reviewer_name || item.owner_name || item.owner, "Autorité d’apprentissage non affectée"),
        waitingLabel: lesson ? "Gouvernance requise" : "Leçon à constituer",
        severity: "warning",
        href: `/market-os/content-command-center/learning?packageId=${encodeURIComponent(text(item.id))}`,
      })
    }
  }

  const decisions: CommandIntervention[] = decisionDossiers.slice(0, 8).map((item) => ({
    id: `decision-${text(item.id)}`,
    category: text(item.status) === "source_required" ? "Autorité de source" : "Décision de dossier",
    title: text(item.title, "Décision requise"),
    detail: `État actuel : ${humanStatus(text(item.status, "pending"))}.`,
    consequence: text(item.status) === "revision_required" ? "La production reste suspendue jusqu’à correction." : "Le dossier attend son prochain gate institutionnel.",
    owner: text(item.reviewer_name || item.reviewer || item.owner_name, "Autorité non affectée"),
    waitingLabel: deadlineLabel(safeDate(item.due_at)),
    severity: severityFor(text(item.status)),
    href: `/market-os/content-command-center/dossiers/${text(item.id)}`,
  }))

  const integrity: CommandIntervention[] = []
  for (const item of sources.filter((source) => bool(source.is_current) && !["verified", "healthy"].includes(text(source.integrity_state))).slice(0, 6)) {
    const dossierId = text(item.dossier_id)
    integrity.push({
      id: `source-${text(item.id)}`,
      category: "Intégrité de source",
      title: text(item.original_filename, "Source canonique à vérifier"),
      detail: `État d’intégrité : ${humanStatus(text(item.integrity_state, "pending"))}.`,
      consequence: "La diffusion ou l’archivage institutionnel ne doit pas être considéré final.",
      owner: text(item.owner_name || item.owner, "Custodian non affecté"),
      waitingLabel: formatDateFr(safeDate(item.updated_at || item.created_at)),
      severity: severityFor(text(item.integrity_state)),
      href: dossierId ? `/market-os/content-command-center/dossiers/${dossierId}` : "/market-os/content-command-center/source-vault",
    })
  }
  for (const item of dossiers.filter((dossier) => text(dossier.status) === "source_required").slice(0, 6)) {
    integrity.push({
      id: `missing-source-${text(item.id)}`,
      category: "Source canonique absente",
      title: text(item.title, "Dossier sans source"),
      detail: "Le dossier est arrivé au gate de sécurisation sans source canonique visible.",
      consequence: "La classification et la distribution restent incomplètes.",
      owner: text(item.owner_name, "Responsable non affecté"),
      waitingLabel: deadlineLabel(safeDate(item.due_at)),
      severity: "warning",
      href: `/market-os/content-command-center/dossiers/${text(item.id)}`,
    })
  }

  const allLifecycleRecords = [...dossiers, ...missions, ...tasks]
  const lifecycle = COMMAND_LIFECYCLE.map((stage) => {
    const matches = allLifecycleRecords.filter((item) => stage.statuses.includes(text(item.status) as never))
    const blocked = matches.filter((item) => text(item.status) === "blocked" || text(item.blocker_reason)).length
    const waiting = matches.filter((item) => ["submitted", "review", "human_review", "source_required", "scheduled"].includes(text(item.status))).length
    const oldest = matches
      .map((item) => safeDate(item.created_at || item.updated_at || item.due_at))
      .filter(Boolean)
      .sort()[0]
    return { key: stage.key, label: stage.label, href: stage.href, active: matches.length, blocked, waiting, oldestLabel: oldest ? formatDateFr(oldest) : "Aucun élément" }
  })

  const runway = dossiers
    .filter((item) => !["closed", "archived", "cancelled"].includes(text(item.status)))
    .map<RunwayItemVM>((item) => {
      const id = text(item.id)
      const relatedTasks = tasks.filter((task) => text(task.dossier_id) === id)
      const blocker = relatedTasks.find((task) => text(task.status) === "blocked")
      const dueAt = safeDate(item.due_at)
      const status = text(item.status)
      return {
        id,
        code: text(item.content_code, id || "DOSSIER"),
        title: text(item.title, "Dossier sans titre"),
        stage: humanStatus(status),
        owner: text(item.owner_name || item.owner, "Responsable non affecté"),
        reviewer: text(item.reviewer_name || item.reviewer, "Réviseur non affecté"),
        deadline: dueAt,
        progress: numberValue(item.progress),
        readiness: numberValue(item.readiness),
        risk: blocker ? "critical" : isOverdue(dueAt) ? "critical" : severityFor(status),
        blocker: blocker ? text(blocker.title || blocker.blocker_reason, "Blocage déclaré") : "",
        nextGate: nextGateForStatus(status),
        href: `/market-os/content-command-center/dossiers/${id}`,
      }
    })
    .sort((a, b) => riskWeight(b.risk) - riskWeight(a.risk) || dateWeight(a.deadline) - dateWeight(b.deadline))
    .slice(0, 12)

  const capacityMap = new Map<string, { active: number; overdue: number; blocked: number }>()
  for (const task of tasks.filter((item) => !["done", "closed", "cancelled"].includes(text(item.status)))) {
    const owner = text(task.owner_name || task.owner, "Non affecté")
    const current = capacityMap.get(owner) || { active: 0, overdue: 0, blocked: 0 }
    current.active += 1
    if (isOverdue(safeDate(task.due_at || task.dueDate))) current.overdue += 1
    if (text(task.status) === "blocked") current.blocked += 1
    capacityMap.set(owner, current)
  }
  const capacity = [...capacityMap.entries()]
    .map(([owner, counts]) => ({ owner, ...counts }))
    .sort((a, b) => b.blocked - a.blocked || b.overdue - a.overdue || b.active - a.active)
    .slice(0, 8)

  const generatedActivity = [
    ...reviews.map((item) => ({ id: `review-${text(item.id)}`, label: text(item.review_type) === "ai" ? "Revue IA" : "Décision humaine", detail: text(item.summary, humanStatus(text(item.result))), actor: text(item.reviewer_name || item.actor, text(item.review_type) === "ai" ? "AI Director" : "Autorité humaine"), timestamp: safeDate(item.created_at), href: text(item.dossier_id) ? `/market-os/content-command-center/dossiers/${text(item.dossier_id)}` : "/market-os/content-command-center/review" })),
    ...evidence.map((item) => ({ id: `evidence-${text(item.id)}`, label: "Preuve déposée", detail: text(item.title || item.filename, "Preuve sans titre"), actor: text(item.owner_name || item.created_by, "Contributeur"), timestamp: safeDate(item.created_at), href: text(item.dossier_id) ? `/market-os/content-command-center/dossiers/${text(item.dossier_id)}` : "/market-os/content-command-center/evidence" })),
    ...activitySource.map((item, index) => ({ id: `activity-${text(item.id, String(index + 1))}`, label: humanStatus(text(item.action, "Activité")), detail: text(item.detail || item.summary, "Mise à jour opérationnelle"), actor: text(item.actor_name || item.actor, "Utilisateur autorisé"), timestamp: safeDate(item.created_at || item.timestamp), href: text(item.dossier_id) ? `/market-os/content-command-center/dossiers/${text(item.dossier_id)}` : "/market-os/content-command-center" })),
  ]
    .filter((item) => item.timestamp)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 10)

  return {
    refreshedAt: safeDate(snapshot.generatedAt || snapshot.refreshedAt || new Date().toISOString()),
    mandate: {
      configured: configuredMandate,
      title: configuredMandate ? text(mandateRecord.title, "Mandat Content Command") : "Mandat exécutif non configuré",
      period: text(mandateRecord.period || mandateRecord.horizon, "Période non définie"),
      sponsor: text(mandateRecord.sponsor_name || mandateRecord.sponsor, "Sponsor non défini"),
      objective: text(mandateRecord.objective, "Aucun objectif de mandat n’est exposé par la source consolidée."),
      priorities: stringArray(mandateRecord.priorities || mandateRecord.priority_services),
      state: text(mandateRecord.status, configuredMandate ? "active" : "missing"),
    },
    health: {
      activeDossiers,
      blockedWork: blockedTasks.length,
      overdueWork: overdueTasks.length,
      pendingDecisions: decisions.length,
      evidenceGaps,
      sourceRisks,
      failedPublications,
    },
    interventions: interventions.slice(0, 10),
    lifecycle,
    runway,
    decisions,
    integrity,
    capacity,
    activity: generatedActivity,
    waveConfigured: array(snapshot.strategicWaves).length > 0 || array(snapshot.waves).length > 0,
  }
}

function nextGateForStatus(status: string): string {
  const map: Record<string, string> = {
    opportunity: "Constituer le brief",
    ideation: "Verrouiller le périmètre",
    brief: "Confirmer la constitution",
    scope_locked: "Planifier la mission",
    planned: "Affecter l’exécution",
    assigned: "Accepter la mission",
    accepted: "Démarrer la création",
    in_creation: "Soumettre le checkpoint",
    checkpoint_review: "Décider la preuve",
    draft_submitted: "Lancer la revue IA",
    ai_review: "Obtenir la décision humaine",
    human_review: "Décider la validation",
    revision: "Soumettre la correction",
    validated: "Sécuriser la source",
    source_required: "Déposer la source canonique",
    source_secured: "Classer le contenu",
    classified: "Assembler la diffusion",
    ready_distribution: "Autoriser la distribution",
    scheduled: "Vérifier la publication",
    published: "Ouvrir l’observation",
    performance_review: "Conclure, attribuer et apprendre",
    closed: "Inspecter la mémoire",
  }
  return map[status] || "Vérifier le prochain gate"
}

function riskWeight(value: Severity): number {
  return { critical: 5, warning: 4, info: 3, neutral: 2, success: 1 }[value]
}

function dateWeight(value: string): number {
  if (!value) return Number.MAX_SAFE_INTEGER
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed
}

const DOSSIER_STAGES = [
  ["opportunity", "Opportunité"],
  ["ideation", "Idéation"],
  ["brief", "Brief"],
  ["scope_locked", "Constitution"],
  ["planned", "Planification"],
  ["assigned", "Affectation"],
  ["in_creation", "Création"],
  ["checkpoint_review", "Checkpoint"],
  ["ai_review", "Revue IA"],
  ["human_review", "Révision humaine"],
  ["validated", "Validation"],
  ["source_required", "Source canonique"],
  ["classified", "Classification"],
  ["ready_distribution", "Distribution"],
  ["scheduled", "Publication"],
  ["performance_review", "Performance"],
  ["closed", "Apprentissage & clôture"],
] as const

function normalizeDossierStatus(value: string): string {
  const map: Record<string, string> = {
    idea: "ideation",
    draft: "in_creation",
    review: "human_review",
    approved: "validated",
    published: "scheduled",
    archived: "closed",
    source_secured: "classified",
  }
  return map[value] || value || "opportunity"
}

function lifecycleFor(statusInput: string, blocked: boolean): DossierLifecycleStage[] {
  const status = normalizeDossierStatus(statusInput)
  let currentIndex = DOSSIER_STAGES.findIndex(([key]) => key === status)
  if (currentIndex < 0) currentIndex = 0
  return DOSSIER_STAGES.map(([key, label], index) => ({
    key,
    label,
    state: key === status ? (blocked ? "blocked" : "current") : index < currentIndex ? "complete" : "future",
    detail: key === status ? `Étape actuelle : ${label}` : index < currentIndex ? "Gate franchi selon l’état consolidé" : "Gate futur — conditions à confirmer",
  }))
}

export function findLiveDossier(snapshotValue: unknown, dossierId: string): UnknownRecord | null {
  const dossiers = array(record(snapshotValue).dossiers)
  return dossiers.find((item) => text(item.id) === dossierId || text(item.content_code) === dossierId) || null
}

export function buildLiveDossierViewModel(snapshotValue: unknown, dossierValue: UnknownRecord): DossierViewModel {
  const snapshot = record(snapshotValue)
  const id = text(dossierValue.id)
  const scope = record(dossierValue.scope_constitution)
  const briefRecord = record(dossierValue.brief)
  const tasks = array(snapshot.tasks).filter((item) => text(item.dossier_id) === id)
  const checkpoints = array(snapshot.checkpoints).filter((item) => text(item.dossier_id) === id)
  const evidence = array(snapshot.evidence).filter((item) => text(item.dossier_id) === id)
  const reviews = array(snapshot.reviews).filter((item) => text(item.dossier_id) === id)
  const sources = array(snapshot.sources).filter((item) => text(item.dossier_id) === id)
  const samples = array(snapshot.generatedSamples).filter((item) => text(item.dossier_id) === id)
  const packages = array(snapshot.publicationPackages).filter((item) => text(item.dossier_id) === id)
  const activities = [...array(snapshot.activity), ...array(snapshot.activities), ...array(snapshot.auditEvents)].filter((item) => text(item.dossier_id || item.entity_id) === id)
  const strategyId = text(dossierValue.strategy_id)
  const signalId = text(dossierValue.signal_id)
  const missionId = text(dossierValue.mission_id || tasks[0]?.mission_id)
  const status = text(dossierValue.status, "opportunity")
  const blocked = tasks.some((item) => text(item.status) === "blocked")
  const mergedTasks = checkpoints.length ? checkpoints : tasks

  return {
    sourceType: "headquarters",
    partial: false,
    id,
    code: text(dossierValue.content_code, id || "DOSSIER"),
    title: text(dossierValue.title, "Dossier sans titre"),
    family: text(dossierValue.family, "Famille non définie"),
    category: text(dossierValue.category, "Catégorie non définie"),
    subcategory: text(dossierValue.subcategory, "Sous-catégorie non définie"),
    service: text(dossierValue.service_label || dossierValue.service, "Service non défini"),
    audience: text(dossierValue.audience, "Audience non définie"),
    city: text(dossierValue.city, "Ville non définie"),
    language: text(dossierValue.language, "Langue non définie"),
    channel: text(dossierValue.channel, "Canal non défini"),
    campaign: text(dossierValue.campaign_label || dossierValue.campaign, "Sans campagne liée"),
    journeyStage: text(dossierValue.journey_stage, "Étape de parcours non définie"),
    priority: text(dossierValue.priority, "Priorité non définie"),
    status,
    progress: numberValue(dossierValue.progress),
    readiness: numberValue(dossierValue.readiness),
    risk: blocked ? "critical" : severityFor(status),
    owner: text(dossierValue.owner_name || dossierValue.owner, "Responsable non affecté"),
    reviewer: text(dossierValue.reviewer_name || dossierValue.reviewer, "Réviseur non affecté"),
    sponsor: text(dossierValue.sponsor_name || dossierValue.sponsor, "Sponsor non défini"),
    dueAt: safeDate(dossierValue.due_at),
    updatedAt: safeDate(dossierValue.updated_at || dossierValue.created_at),
    currentStage: normalizeDossierStatus(status),
    missionId,
    constitution: {
      objective: text(dossierValue.objective || scope.objective, "Objectif métier non défini"),
      contentObjective: text(scope.content_objective || briefRecord.objective, "Objectif de contenu non défini"),
      message: text(dossierValue.message_pillar || briefRecord.message, "Pilier de message non défini"),
      offer: text(dossierValue.offer || briefRecord.offer, "Offre non définie"),
      cta: text(dossierValue.cta || briefRecord.cta, "Appel à l’action non défini"),
      requiredOutput: text(scope.requiredOutput || scope.required_output, "Livrable requis non défini"),
      mandatory: stringArray(scope.mandatory || scope.mandatory_elements),
      prohibited: stringArray(scope.prohibited || scope.prohibited_elements),
      inScope: stringArray(scope.in_scope || scope.inScope),
      outOfScope: stringArray(scope.out_of_scope || scope.outOfScope),
      constraints: stringArray(scope.constraints),
      completionDefinition: text(scope.completion_definition || scope.completionDefinition, "Définition de complétion non formalisée"),
      state: text(scope.status || dossierValue.scope_state, scope.locked ? "locked" : "draft"),
    },
    lineage: [
      signalId ? { type: "Signal", title: text(dossierValue.signal_title, signalId), state: "Lié", href: "/market-os/content-command-center/signals" } : null,
      strategyId ? { type: "Stratégie", title: text(dossierValue.strategy_title, strategyId), state: "Liée", href: "/market-os/content-command-center/strategies" } : null,
      text(dossierValue.action_plan_id) ? { type: "Plan d’action", title: text(dossierValue.action_plan_title, text(dossierValue.action_plan_id)), state: "Lié", href: "/market-os/content-command-center/strategies" } : null,
      missionId ? { type: "Mission", title: text(dossierValue.mission_title, missionId), state: "Liée", href: "/market-os/content-command-center/missions" } : null,
    ].filter((item): item is { type: string; title: string; state: string; href: string } => Boolean(item)),
    ownership: [
      { role: "Sponsor", person: text(dossierValue.sponsor_name || dossierValue.sponsor, "Non défini"), state: text(dossierValue.sponsor_name || dossierValue.sponsor) ? "Affecté" : "Manquant" },
      { role: "Responsable du dossier", person: text(dossierValue.owner_name || dossierValue.owner, "Non affecté"), state: text(dossierValue.owner_name || dossierValue.owner) ? "Affecté" : "Manquant" },
      { role: "Réviseur", person: text(dossierValue.reviewer_name || dossierValue.reviewer, "Non affecté"), state: text(dossierValue.reviewer_name || dossierValue.reviewer) ? "Affecté" : "Manquant" },
      { role: "Supervision IA", person: text(dossierValue.ai_director_name || dossierValue.ai_director_id, "Non affectée"), state: text(dossierValue.ai_director_id) ? "Gouvernée" : "Non affectée" },
    ],
    brief: {
      version: text(briefRecord.version || dossierValue.brief_version, "Version non définie"),
      objective: text(briefRecord.objective || dossierValue.objective, "Objectif non défini"),
      audience: text(briefRecord.audience || dossierValue.audience, "Audience non définie"),
      userProblem: text(briefRecord.user_problem, "Problème utilisateur non documenté"),
      coreMessage: text(briefRecord.message || dossierValue.message_pillar, "Message central non défini"),
      supportingMessages: stringArray(briefRecord.supporting_messages),
      format: text(briefRecord.format || scope.requiredOutput || scope.required_output, "Format non défini"),
      channels: stringArray(briefRecord.channels || dossierValue.channel),
      tone: text(briefRecord.tone, "Ton non défini"),
      references: stringArray(briefRecord.references),
      deadline: safeDate(briefRecord.due_at || dossierValue.due_at),
      state: text(briefRecord.status || dossierValue.brief_status, "draft"),
    },
    lifecycle: lifecycleFor(status, blocked),
    tasks: mergedTasks.map((item, index) => ({
      id: text(item.id, `task-${index}`),
      sequence: numberValue(item.sequence_number) ?? index + 1,
      title: text(item.title, "Étape sans titre"),
      status: text(item.status, "todo"),
      owner: text(item.owner_name || item.owner, "Responsable non affecté"),
      dueAt: safeDate(item.due_at || item.dueDate),
      completion: text(item.completion_definition || item.instructions, "Définition de complétion non fournie"),
      blocker: text(item.blocker_reason),
      href: text(item.id) ? `/market-os/content-command-center/tasks/${text(item.id)}` : "/market-os/content-command-center/tasks",
    })),
    evidence: evidence.map((item) => ({
      id: text(item.id),
      title: text(item.title || item.filename, "Preuve sans titre"),
      type: text(item.evidence_type || item.content_type, "Preuve"),
      filename: text(item.filename, "Fichier non renseigné"),
      status: text(item.status, "pending"),
      note: text(item.note, "Aucune note"),
      createdAt: safeDate(item.created_at),
      previewUrl: text(item.preview_url),
      actor: text(item.owner_name || item.created_by, "Contributeur"),
    })),
    decisions: reviews.map((item) => ({
      id: text(item.id),
      type: text(item.review_type) === "ai" ? "AI" : "HUMAN",
      title: text(item.review_type) === "ai" ? "Revue IA gouvernée" : "Décision humaine",
      result: text(item.result, "pending"),
      summary: text(item.summary, "Aucune conclusion détaillée"),
      score: numberValue(item.score),
      createdAt: safeDate(item.created_at),
      actor: text(item.reviewer_name || item.actor, text(item.review_type) === "ai" ? "AI Director" : "Autorité humaine"),
    })),
    sources: sources.map((item) => ({
      id: text(item.id),
      current: bool(item.is_current),
      filename: text(item.original_filename || item.filename, "Source sans nom"),
      version: text(item.source_version || item.version, "1"),
      integrity: text(item.integrity_state, "pending"),
      createdAt: safeDate(item.created_at),
      rights: text(item.rights_classification || item.rights, "Non classifiés"),
      retention: text(item.retention_classification || item.retention, "Non définie"),
      kind: bool(item.is_current) ? "canonical" : "previous",
    })),
    assets: [
      ...array(snapshot.assets).filter((item) => text(item.dossier_id || item.linked_dossier_id) === id),
      ...samples,
    ].map((item) => ({
      id: text(item.id),
      title: text(item.title || item.name, "Asset sans nom"),
      type: text(item.asset_type || item.type, "Asset"),
      status: text(item.status, "draft"),
      url: text(item.preview_url || item.preview_data_url || item.url),
      owner: text(item.owner_name || item.owner, text(item.credit_number) ? "AI Director" : "Non affecté"),
    })),
    publications: packages.map((item) => ({
      id: text(item.id),
      channel: text(item.channel, "Canal non défini"),
      status: text(item.status, "draft"),
      scheduledAt: safeDate(item.scheduled_at),
      publishedAt: safeDate(item.published_at),
      externalUrl: text(item.external_reference || item.external_url || item.publication_url),
      owner: text(item.owner_name || item.publisher_name || item.owner, "Publisher non affecté"),
      evidence: array(item.evidence),
    })),
    activity: [
      ...activities.map((item) => ({ id: text(item.id), action: humanStatus(text(item.action, "Activité")), detail: text(item.detail || item.summary, "Mise à jour"), actor: text(item.actor_name || item.actor, "Utilisateur autorisé"), timestamp: safeDate(item.created_at || item.timestamp) })),
      ...evidence.map((item) => ({ id: `e-${text(item.id)}`, action: "Preuve déposée", detail: text(item.title || item.filename, "Preuve"), actor: text(item.owner_name || item.created_by, "Contributeur"), timestamp: safeDate(item.created_at) })),
      ...reviews.map((item) => ({ id: `r-${text(item.id)}`, action: text(item.review_type) === "ai" ? "Revue IA" : "Décision humaine", detail: text(item.summary, humanStatus(text(item.result))), actor: text(item.reviewer_name || item.actor, "Autorité"), timestamp: safeDate(item.created_at) })),
    ].filter((item) => item.timestamp).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    nextAction: nextActionForDossier(status, id),
  }
}

export function buildLegacyDossierViewModel(input: {
  item: UnknownRecord
  tasks: UnknownRecord[]
  assets: UnknownRecord[]
  briefs: UnknownRecord[]
  logs: UnknownRecord[]
}): DossierViewModel {
  const item = input.item
  const id = text(item.id)
  const status = text(item.status, "idea")
  const relevantBrief = input.briefs.find((brief) => text(brief.title) === text(item.title) || text(brief.campaign) === text(item.campaign)) || {}
  const blocked = input.tasks.some((task) => text(task.status) === "blocked")
  const sourceAssets = input.assets.filter((asset) => ["Brief", "PDF", "Presentation", "Other"].includes(text(asset.type)))
  return {
    sourceType: "legacy",
    partial: true,
    id,
    code: `LEGACY-${id}`,
    title: text(item.title, "Contenu sans titre"),
    family: text(item.type, "Famille héritée"),
    category: text(item.type, "Catégorie non normalisée"),
    subcategory: "Non normalisée dans le registre historique",
    service: "Service non renseigné dans le registre historique",
    audience: text(item.audience, "Audience non définie"),
    city: "Ville non renseignée dans le registre historique",
    language: "Langue non renseignée dans le registre historique",
    channel: text(item.channel, "Canal non défini"),
    campaign: text(item.campaign, "Sans campagne"),
    journeyStage: "Étape de parcours non renseignée",
    priority: text(item.priority, "Priorité non définie"),
    status,
    progress: null,
    readiness: numberValue(item.brandScore),
    risk: blocked ? "critical" : severityFor(status),
    owner: text(item.owner, "Responsable non affecté"),
    reviewer: text(item.reviewer, "Réviseur non affecté"),
    sponsor: "Sponsor non renseigné dans le registre historique",
    dueAt: safeDate(item.dueDate),
    updatedAt: safeDate(item.updatedAt || item.createdAt),
    currentStage: normalizeDossierStatus(status),
    missionId: "",
    constitution: {
      objective: text(item.objective, "Objectif métier non défini"),
      contentObjective: text(relevantBrief.objective, "Objectif de contenu non documenté"),
      message: text(relevantBrief.message || item.angle, "Message central non documenté"),
      offer: "Offre non documentée dans le registre historique",
      cta: text(item.cta, "Appel à l’action non défini"),
      requiredOutput: text(item.type, "Livrable non défini"),
      mandatory: [],
      prohibited: [],
      inScope: [],
      outOfScope: [],
      constraints: [],
      completionDefinition: "Définition de complétion absente du registre historique",
      state: "legacy_partial",
    },
    lineage: [],
    ownership: [
      { role: "Responsable du dossier", person: text(item.owner, "Non affecté"), state: text(item.owner) ? "Affecté" : "Manquant" },
      { role: "Réviseur", person: text(item.reviewer, "Non affecté"), state: text(item.reviewer) ? "Affecté" : "Manquant" },
      { role: "Sponsor", person: "Non renseigné", state: "Manquant" },
    ],
    brief: {
      version: "Historique",
      objective: text(relevantBrief.objective || item.objective, "Objectif non défini"),
      audience: text(relevantBrief.audience || item.audience, "Audience non définie"),
      userProblem: "Problème utilisateur non documenté",
      coreMessage: text(relevantBrief.message || item.angle, "Message central non défini"),
      supportingMessages: [],
      format: text(item.type, "Format non défini"),
      channels: [text(item.channel)].filter(Boolean),
      tone: "Ton non documenté",
      references: [],
      deadline: safeDate(relevantBrief.dueDate || item.dueDate),
      state: text(relevantBrief.status, "legacy_partial"),
    },
    lifecycle: lifecycleFor(status, blocked),
    tasks: input.tasks.map((task, index) => ({
      id: text(task.id, `legacy-task-${index}`),
      sequence: index + 1,
      title: text(task.title, "Tâche sans titre"),
      status: text(task.status, "todo"),
      owner: text(task.owner, "Responsable non affecté"),
      dueAt: safeDate(task.dueDate),
      completion: text(task.notes, "Définition de complétion non disponible"),
      blocker: text(task.status) === "blocked" ? text(task.notes, "Blocage déclaré") : "",
      href: text(task.id) ? `/market-os/content-command-center/tasks/${text(task.id)}` : "/market-os/content-command-center/tasks",
    })),
    evidence: input.assets.map((asset) => ({
      id: text(asset.id),
      title: text(asset.name, "Asset sans nom"),
      type: text(asset.type, "Asset"),
      filename: text(asset.name, "Fichier non renseigné"),
      status: text(asset.status, "draft"),
      note: text(asset.notes, "Aucune note"),
      createdAt: "",
      previewUrl: text(asset.url),
      actor: text(asset.owner, "Contributeur"),
    })),
    decisions: [],
    sources: sourceAssets.map((asset, index) => ({
      id: text(asset.id, `legacy-source-${index}`),
      current: index === 0,
      filename: text(asset.name, "Fichier historique"),
      version: "Historique",
      integrity: "not_verified",
      createdAt: "",
      rights: "Non classifiés",
      retention: "Non définie",
      kind: index === 0 ? "canonical" : "rendition",
    })),
    assets: input.assets.map((asset) => ({ id: text(asset.id), title: text(asset.name, "Asset sans nom"), type: text(asset.type, "Asset"), status: text(asset.status, "draft"), url: text(asset.url), owner: text(asset.owner, "Non affecté") })),
    publications: text(item.scheduledDate) || status === "published" ? [{ id: `legacy-publication-${id}`, channel: text(item.channel, "Canal non défini"), status: status === "published" ? "published" : "scheduled", scheduledAt: safeDate(item.scheduledDate), publishedAt: "", externalUrl: "", owner: text(item.owner, "Publisher non affecté"), evidence: [] }] : [],
    activity: input.logs.map((log) => ({ id: text(log.id), action: humanStatus(text(log.action, "Activité")), detail: text(log.detail, "Mise à jour historique"), actor: "Registre historique", timestamp: safeDate(log.timestamp) })).filter((log) => log.timestamp),
    nextAction: nextActionForDossier(status, id, true),
  }
}

function nextActionForDossier(status: string, id: string, legacy = false): DossierViewModel["nextAction"] {
  if (legacy) return { label: "Compléter la gouvernance", detail: "Le dossier historique doit être enrichi avant d’être considéré comme pleinement institutionnel.", href: `/market-os/content-command-center/${id}/edit` }
  const map: Record<string, DossierViewModel["nextAction"]> = {
    opportunity: { label: "Constituer le brief", detail: "Formaliser l’objectif, l’audience, le message et le livrable attendu.", href: "/market-os/content-command-center/briefs" },
    ideation: { label: "Verrouiller le périmètre", detail: "Séparer clairement le travail autorisé du hors périmètre.", href: "/market-os/content-command-center/studio" },
    brief: { label: "Confirmer la constitution", detail: "Valider les conditions d’entrée avant libération de la mission.", href: "/market-os/content-command-center/briefs" },
    scope_locked: { label: "Créer la mission", detail: "Transformer le périmètre autorisé en exécution ordonnée.", href: "/market-os/content-command-center/missions" },
    in_creation: { label: "Soumettre une preuve", detail: "Déposer le checkpoint courant avant la prochaine décision.", href: "/market-os/content-command-center/evidence" },
    ai_review: { label: "Obtenir la décision humaine", detail: "La recommandation IA ne remplace pas l’autorité humaine.", href: "/market-os/content-command-center/review" },
    human_review: { label: "Ouvrir la validation", detail: "Présenter la preuve, les conditions et la version concernée.", href: "/market-os/content-command-center/validation" },
    validated: { label: "Sécuriser la source", detail: "Déposer et vérifier la source éditable canonique.", href: "/market-os/content-command-center/source-vault" },
    source_required: { label: "Déposer la source canonique", detail: "La classification et la distribution restent bloquées tant que la source manque.", href: "/market-os/content-command-center/source-vault" },
    ready_distribution: { label: "Assembler le package", detail: "Préparer les renditions, le copy et la fenêtre de diffusion.", href: "/market-os/content-command-center/distribution" },
    scheduled: { label: "Vérifier la publication", detail: "Contrôler la mise en ligne et capturer la preuve.", href: "/market-os/content-command-center/publishing" },
    published: { label: "Ouvrir l’observation", detail: "Documenter une fenêtre, une provenance et les métriques réellement disponibles.", href: "/market-os/content-command-center/performance" },
    performance_review: { label: "Conclure l’impact", detail: "Examiner la suffisance, l’attribution, l’optimisation et la leçon institutionnelle.", href: "/market-os/content-command-center/performance" },
    closed: { label: "Inspecter la mémoire", detail: "Relire la lignée complète et les leçons acceptées dans Content Atlas.", href: "/market-os/content-command-center/directory" },
  }
  return map[status] || { label: "Vérifier le prochain gate", detail: "Contrôler les conditions d’entrée, les responsabilités et les preuves requises.", href: `/market-os/content-command-center/dossiers/${id}` }
}
