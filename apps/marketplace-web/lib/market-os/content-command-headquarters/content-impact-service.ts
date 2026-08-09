import { createServiceClient } from "@/lib/supabase/server"
import { auditContentHeadquarters } from "./repository"
import type { JsonRecord, PublicationPackage } from "./types"

const PACKAGES = "market_content_publication_packages"
const DOSSIERS = "market_content_dossiers"

const clean = (value: unknown) => String(value ?? "").trim()
const record = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {}
const records = (value: unknown): JsonRecord[] => Array.isArray(value) ? value.filter((item): item is JsonRecord => Boolean(item && typeof item === "object" && !Array.isArray(item))) : []
const number = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}
const append = (items: JsonRecord[], next: JsonRecord) => [...items, next]
const latest = (items: JsonRecord[], type: string) => [...items].reverse().find((item) => clean(item.type) === type) || null

async function loadPackage(packageId: string) {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(PACKAGES).select("*").eq("id", packageId).single()
  if (result.error) throw result.error
  return { supabase, package: result.data as PublicationPackage }
}

function requireVerifiedPublication(current: PublicationPackage) {
  const evidence = records(current.evidence)
  const verification = latest(evidence, "publication_verification")
  if (current.status !== "verified" || clean(verification?.conclusion) !== "verified") throw new Error("VERIFIED_PUBLICATION_REQUIRED")
  if (!current.external_reference || !current.published_at) throw new Error("PUBLICATION_EXTERNAL_TRUTH_REQUIRED")
  return evidence
}

function normalizedMetrics(input: JsonRecord) {
  return {
    impressions: number(input.impressions),
    views: number(input.views),
    engagements: number(input.engagements),
    clicks: number(input.clicks),
    downloads: number(input.downloads),
    leads: number(input.leads),
    conversions: number(input.conversions),
    revenueDh: number(input.revenueDh),
  }
}

export async function recordPerformanceObservation(input: {
  actorId: string
  actorName: string
  packageId: string
  observedFrom: string
  observedTo: string
  provenanceType: string
  sourceLabel: string
  sourceReference: string
  limitations: string
  metrics: JsonRecord
}) {
  const { supabase, package: current } = await loadPackage(input.packageId)
  const evidence = requireVerifiedPublication(current)
  const provenanceType = clean(input.provenanceType).toLowerCase()
  const allowedProvenance = ["provider", "internal_event", "crm_linked", "imported", "manual", "customer_declared"]
  if (!allowedProvenance.includes(provenanceType)) throw new Error("PERFORMANCE_PROVENANCE_REQUIRED")
  if (![input.observedFrom, input.observedTo, input.sourceLabel].every((value) => clean(value))) throw new Error("PERFORMANCE_OBSERVATION_CONSTITUTION_REQUIRED")
  if (["manual", "imported", "customer_declared"].includes(provenanceType) && !clean(input.sourceReference)) throw new Error("PERFORMANCE_SOURCE_REFERENCE_REQUIRED")
  if (provenanceType === "manual" && !clean(input.limitations)) throw new Error("MANUAL_METRIC_LIMITATIONS_REQUIRED")
  const metrics = normalizedMetrics(input.metrics)
  if (!Object.values(metrics).some((value) => value > 0)) throw new Error("PERFORMANCE_METRIC_REQUIRED")
  const event: JsonRecord = {
    type: "performance_observation",
    observationId: `OBS-${Date.now()}`,
    observedFrom: clean(input.observedFrom),
    observedTo: clean(input.observedTo),
    provenanceType,
    sourceLabel: clean(input.sourceLabel),
    sourceReference: clean(input.sourceReference),
    limitations: clean(input.limitations),
    metrics,
    externalReference: current.external_reference,
    recordedAt: new Date().toISOString(),
    recordedBy: input.actorName,
    state: "submitted",
  }
  const update = await supabase.from(PACKAGES).update({ evidence: append(evidence, event), updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single()
  if (update.error) throw update.error
  const dossierUpdate = await supabase.from(DOSSIERS).update({ status: "performance_review", updated_at: new Date().toISOString() }).eq("id", current.dossier_id)
  if (dossierUpdate.error) throw dossierUpdate.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: "content_performance.observation_recorded", entityType: "publication_package", entityId: current.id, detail: { observationId: event.observationId, provenanceType, observedFrom: event.observedFrom, observedTo: event.observedTo } })
  return update.data as PublicationPackage
}

export async function recordPerformanceConclusion(input: {
  actorId: string
  actorName: string
  packageId: string
  conclusion: "sufficient" | "insufficient" | "disputed" | "extend_observation"
  summary: string
  limitations: string
  nextReviewAt?: string
}) {
  const { supabase, package: current } = await loadPackage(input.packageId)
  const evidence = requireVerifiedPublication(current)
  if (!latest(evidence, "performance_observation")) throw new Error("PERFORMANCE_OBSERVATION_REQUIRED")
  if (!clean(input.summary)) throw new Error("PERFORMANCE_CONCLUSION_REQUIRED")
  const allowed = ["sufficient", "insufficient", "disputed", "extend_observation"]
  if (!allowed.includes(input.conclusion)) throw new Error("PERFORMANCE_CONCLUSION_INVALID")
  if (input.conclusion !== "sufficient" && !clean(input.limitations)) throw new Error("PERFORMANCE_LIMITATIONS_REQUIRED")
  const event: JsonRecord = {
    type: "performance_conclusion",
    conclusion: input.conclusion,
    summary: clean(input.summary),
    limitations: clean(input.limitations),
    nextReviewAt: clean(input.nextReviewAt),
    concludedAt: new Date().toISOString(),
    concludedBy: input.actorName,
  }
  const update = await supabase.from(PACKAGES).update({ evidence: append(evidence, event), updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single()
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: `content_performance.${input.conclusion}`, entityType: "publication_package", entityId: current.id, detail: event })
  return update.data as PublicationPackage
}

export async function recordAttributionConclusion(input: {
  actorId: string
  actorName: string
  packageId: string
  method: string
  conclusion: "direct" | "assisted" | "correlated" | "unestablished" | "disputed"
  outcomeLabel: string
  outcomeReference: string
  attributedRevenueDh?: number
  evidenceBasis: string
  competingExplanations: string
  limitations: string
}) {
  const { supabase, package: current } = await loadPackage(input.packageId)
  const evidence = requireVerifiedPublication(current)
  const performanceConclusion = latest(evidence, "performance_conclusion")
  if (!performanceConclusion || clean(performanceConclusion.conclusion) !== "sufficient") throw new Error("SUFFICIENT_PERFORMANCE_CONCLUSION_REQUIRED")
  const allowedMethods = ["tracked_link", "crm_link", "customer_declaration", "assisted_journey", "manual_evidence", "correlation_only"]
  if (!allowedMethods.includes(clean(input.method))) throw new Error("ATTRIBUTION_METHOD_REQUIRED")
  if (![input.outcomeLabel, input.evidenceBasis, input.limitations].every((value) => clean(value))) throw new Error("ATTRIBUTION_CONSTITUTION_REQUIRED")
  if (["direct", "assisted"].includes(input.conclusion) && !clean(input.outcomeReference)) throw new Error("ATTRIBUTION_OUTCOME_REFERENCE_REQUIRED")
  const event: JsonRecord = {
    type: "attribution_conclusion",
    method: clean(input.method),
    conclusion: input.conclusion,
    outcomeLabel: clean(input.outcomeLabel),
    outcomeReference: clean(input.outcomeReference),
    attributedRevenueDh: number(input.attributedRevenueDh),
    evidenceBasis: clean(input.evidenceBasis),
    competingExplanations: clean(input.competingExplanations),
    limitations: clean(input.limitations),
    reviewedAt: new Date().toISOString(),
    reviewedBy: input.actorName,
  }
  const update = await supabase.from(PACKAGES).update({ evidence: append(evidence, event), updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single()
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: `content_attribution.${input.conclusion}`, entityType: "publication_package", entityId: current.id, detail: { method: event.method, outcomeLabel: event.outcomeLabel, attributedRevenueDh: event.attributedRevenueDh } })
  return update.data as PublicationPackage
}

export async function recordOptimizationDecision(input: {
  actorId: string
  actorName: string
  packageId: string
  decision: string
  rationale: string
  affectedScope: string
  owner: string
  dueAt?: string
  newVersionRequired: boolean
  revalidationRequired: boolean
}) {
  const { supabase, package: current } = await loadPackage(input.packageId)
  const evidence = requireVerifiedPublication(current)
  if (!latest(evidence, "performance_conclusion")) throw new Error("PERFORMANCE_CONCLUSION_REQUIRED")
  const allowed = ["continue", "extend_observation", "improve_copy", "replace_cta", "change_channel", "change_timing", "change_audience", "localize", "adapt_format", "new_variant", "repurpose", "rerun", "pause", "retire", "archive", "supersede", "return_strategy", "return_brief", "create_mission"]
  const decision = clean(input.decision)
  if (!allowed.includes(decision)) throw new Error("OPTIMIZATION_DECISION_INVALID")
  if (![input.rationale, input.affectedScope, input.owner].every((value) => clean(value))) throw new Error("OPTIMIZATION_DECISION_CONSTITUTION_REQUIRED")
  const event: JsonRecord = {
    type: "optimization_decision",
    decision,
    rationale: clean(input.rationale),
    affectedScope: clean(input.affectedScope),
    owner: clean(input.owner),
    dueAt: clean(input.dueAt),
    newVersionRequired: Boolean(input.newVersionRequired),
    revalidationRequired: Boolean(input.revalidationRequired),
    decidedAt: new Date().toISOString(),
    decidedBy: input.actorName,
  }
  const update = await supabase.from(PACKAGES).update({ evidence: append(evidence, event), updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single()
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: `content_optimization.${decision}`, entityType: "publication_package", entityId: current.id, detail: event })
  return update.data as PublicationPackage
}

export async function recordInstitutionalLesson(input: {
  actorId: string
  actorName: string
  packageId: string
  title: string
  lesson: string
  applicability: string
  limitations: string
  doctrineRecommendation: string
}) {
  const { supabase, package: current } = await loadPackage(input.packageId)
  const evidence = requireVerifiedPublication(current)
  if (!latest(evidence, "optimization_decision")) throw new Error("OPTIMIZATION_DECISION_REQUIRED")
  if (![input.title, input.lesson, input.applicability, input.limitations].every((value) => clean(value))) throw new Error("INSTITUTIONAL_LESSON_CONSTITUTION_REQUIRED")
  const event: JsonRecord = {
    type: "institutional_lesson",
    lessonId: `LESSON-${Date.now()}`,
    title: clean(input.title),
    lesson: clean(input.lesson),
    applicability: clean(input.applicability),
    limitations: clean(input.limitations),
    doctrineRecommendation: clean(input.doctrineRecommendation),
    status: "draft",
    createdAt: new Date().toISOString(),
    createdBy: input.actorName,
  }
  const update = await supabase.from(PACKAGES).update({ evidence: append(evidence, event), updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single()
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: "institutional_learning.draft_created", entityType: "publication_package", entityId: current.id, detail: { lessonId: event.lessonId, title: event.title } })
  return update.data as PublicationPackage
}

export async function governInstitutionalLesson(input: {
  actorId: string
  actorName: string
  packageId: string
  decision: "accepted" | "accepted_with_limitations" | "retired" | "superseded"
  reason: string
}) {
  const { supabase, package: current } = await loadPackage(input.packageId)
  const evidence = requireVerifiedPublication(current)
  const lesson = latest(evidence, "institutional_lesson")
  if (!lesson) throw new Error("INSTITUTIONAL_LESSON_REQUIRED")
  if (!clean(input.reason)) throw new Error("LEARNING_AUTHORITY_REASON_REQUIRED")
  const event: JsonRecord = {
    type: "lesson_governance",
    lessonId: clean(lesson.lessonId),
    decision: input.decision,
    reason: clean(input.reason),
    decidedAt: new Date().toISOString(),
    decidedBy: input.actorName,
  }
  const update = await supabase.from(PACKAGES).update({ evidence: append(evidence, event), updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single()
  if (update.error) throw update.error
  if (["accepted", "accepted_with_limitations"].includes(input.decision)) {
    const dossierUpdate = await supabase.from(DOSSIERS).update({ status: "closed", updated_at: new Date().toISOString() }).eq("id", current.dossier_id)
    if (dossierUpdate.error) throw dossierUpdate.error
  }
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: `institutional_learning.${input.decision}`, entityType: "publication_package", entityId: current.id, detail: event })
  return update.data as PublicationPackage
}
