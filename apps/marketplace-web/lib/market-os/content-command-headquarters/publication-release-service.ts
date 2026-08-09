import { createServiceClient } from "@/lib/supabase/server"
import { auditContentHeadquarters } from "./repository"
import type { JsonRecord, PublicationPackage } from "./types"
import { assertProductionCapability } from './production-operations-service'

const PACKAGES = "market_content_publication_packages"
const DOSSIERS = "market_content_dossiers"
const SOURCES = "market_content_source_objects"

function clean(value: unknown) { return String(value || "").trim() }
function records(value: unknown): JsonRecord[] { return Array.isArray(value) ? value.filter((item): item is JsonRecord => Boolean(item && typeof item === "object" && !Array.isArray(item))) : [] }
function record(value: unknown): JsonRecord { return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {} }
function mode(value: unknown) {
  const selected = clean(value).toLowerCase()
  return ["manual", "print", "internal", "provider", "unsupported", "legacy"].includes(selected) ? selected : "manual"
}
function upsertEvidence(items: JsonRecord[], type: string, next: JsonRecord) {
  return [...items.filter((item) => clean(item.type) !== type), next]
}
function appendEvidence(items: JsonRecord[], next: JsonRecord) { return [...items, next] }
function requiredRenditions(value: unknown) {
  return records(value).map((item, index) => ({
    id: clean(item.id) || `rendition-${index + 1}`,
    name: clean(item.name) || `Rendition ${index + 1}`,
    required: item.required !== false,
    status: clean(item.status) || "required",
    assetReference: clean(item.assetReference),
    versionIdentity: clean(item.versionIdentity),
  }))
}
function manifestFrom(items: JsonRecord[]) { return items.find((item) => clean(item.type) === "release_manifest") || null }
function readiness(input: { sourceSecured: boolean; channel: string; scheduledAt: string; renditions: JsonRecord[]; manifest: JsonRecord | null }) {
  const manifest = input.manifest || {}
  const renditions = requiredRenditions(input.renditions)
  const required = renditions.filter((item) => item.required)
  const allRenditionsReady = required.length > 0 && required.every((item) => ["ready", "approved", "available"].includes(item.status))
  const executionMode = mode(manifest.executionMode)
  const gates = [
    input.sourceSecured,
    Boolean(input.channel),
    Boolean(input.scheduledAt),
    allRenditionsReady,
    Boolean(clean(manifest.copy)),
    Boolean(clean(manifest.cta) || ["print", "internal"].includes(executionMode)),
    Boolean(clean(manifest.audience)),
    Boolean(clean(manifest.language)),
    executionMode !== "unsupported",
    Boolean(clean(manifest.proofExpectation)),
  ]
  return Math.round((gates.filter(Boolean).length / gates.length) * 100)
}

async function loadPackage(packageId: string) {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(PACKAGES).select("*").eq("id", packageId).single()
  if (result.error) throw result.error
  return { supabase, package: result.data as PublicationPackage }
}

async function loadReleaseAuthority(supabase: any, dossierId: string) {
  const dossierResult = await supabase.from(DOSSIERS).select("*").eq("id", dossierId).single()
  if (dossierResult.error) throw dossierResult.error
  const sourceResult = await supabase.from(SOURCES).select("id,source_version,sha256_hash,integrity_state,is_current").eq("dossier_id", dossierId).eq("is_current", true).order("source_version", { ascending: false }).limit(1)
  if (sourceResult.error) throw sourceResult.error
  const source = Array.isArray(sourceResult.data) ? sourceResult.data[0] : null
  return { dossier: dossierResult.data, source }
}

export async function createGovernedPublicationPackage(input: {
  actorId: string; actorName: string; dossierId: string; channel: string; scheduledAt?: string; requiredRenditions?: JsonRecord[]; manifest?: JsonRecord
}) {
  const supabase = await createServiceClient() as any
  const { dossier, source } = await loadReleaseAuthority(supabase, input.dossierId)
  if (!source || dossier.source_state !== "secured" || source.integrity_state !== "verified") throw new Error("PUBLICATION_SOURCE_GATE_REQUIRED")
  if (!["source_secured", "classified", "ready_distribution", "scheduled", "published"].includes(clean(dossier.status))) throw new Error("FORMAL_VALIDATION_GATE_REQUIRED")
  const manifest: JsonRecord = {
    type: "release_manifest", version: 1,
    ...record(input.manifest),
    executionMode: mode(record(input.manifest).executionMode),
    canonicalSourceId: source.id,
    canonicalSourceVersion: source.source_version,
    canonicalSourceHash: source.sha256_hash,
    declaredAt: new Date().toISOString(),
    declaredBy: input.actorName,
  }
  const renditions = requiredRenditions(input.requiredRenditions)
  const packageReadiness = readiness({ sourceSecured: true, channel: clean(input.channel), scheduledAt: clean(input.scheduledAt), renditions, manifest })
  const insert = await supabase.from(PACKAGES).insert({
    dossier_id: input.dossierId,
    channel: clean(input.channel),
    scheduled_at: clean(input.scheduledAt) || null,
    status: "draft",
    package_readiness: packageReadiness,
    required_renditions: renditions,
    evidence: [manifest],
    created_by: input.actorId || null,
  }).select("*").single()
  if (insert.error) throw insert.error
  const dossierUpdate = await supabase.from(DOSSIERS).update({ status: "ready_distribution", publication_state: "draft", updated_at: new Date().toISOString() }).eq("id", input.dossierId)
  if (dossierUpdate.error) throw dossierUpdate.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: "publication_package.governed_created", entityType: "publication_package", entityId: insert.data.id, detail: { dossierId: input.dossierId, channel: input.channel, scheduledAt: input.scheduledAt || null, sourceId: source.id, packageReadiness } })
  return insert.data as PublicationPackage
}

export async function savePublicationPackageManifest(input: {
  actorId: string; actorName: string; packageId: string; scheduledAt?: string; requiredRenditions?: JsonRecord[]; manifest: JsonRecord
}) {
  const { supabase, package: current } = await loadPackage(input.packageId)
  if (!["draft", "ready"].includes(current.status)) throw new Error("PACKAGE_MANIFEST_LOCKED")
  const { dossier, source } = await loadReleaseAuthority(supabase, current.dossier_id)
  if (!source || dossier.source_state !== "secured") throw new Error("PUBLICATION_SOURCE_GATE_REQUIRED")
  const manifest: JsonRecord = {
    type: "release_manifest", version: 1,
    ...record(input.manifest),
    executionMode: mode(record(input.manifest).executionMode),
    canonicalSourceId: source.id,
    canonicalSourceVersion: source.source_version,
    canonicalSourceHash: source.sha256_hash,
    declaredAt: new Date().toISOString(),
    declaredBy: input.actorName,
  }
  const renditions = input.requiredRenditions === undefined ? records(current.required_renditions) : requiredRenditions(input.requiredRenditions)
  const scheduledAt = input.scheduledAt === undefined ? clean(current.scheduled_at) : clean(input.scheduledAt)
  const evidence = upsertEvidence(records(current.evidence), "release_manifest", manifest)
  const packageReadiness = readiness({ sourceSecured: true, channel: current.channel, scheduledAt, renditions, manifest })
  const update = await supabase.from(PACKAGES).update({ scheduled_at: scheduledAt || null, required_renditions: renditions, evidence, package_readiness: packageReadiness, status: current.status === "ready" && packageReadiness < 100 ? "draft" : current.status, updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single()
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: "publication_package.manifest_saved", entityType: "publication_package", entityId: current.id, detail: { packageReadiness, scheduledAt: scheduledAt || null, renditionCount: renditions.length } })
  return update.data as PublicationPackage
}

export async function declarePublicationPackageReady(input: { actorId: string; actorName: string; packageId: string }) {
  const { supabase, package: current } = await loadPackage(input.packageId)
  if (current.status !== "draft") throw new Error("PACKAGE_READY_TRANSITION_NOT_ALLOWED")
  const { dossier, source } = await loadReleaseAuthority(supabase, current.dossier_id)
  const manifest = manifestFrom(records(current.evidence))
  const score = readiness({ sourceSecured: Boolean(source && dossier.source_state === "secured"), channel: current.channel, scheduledAt: clean(current.scheduled_at), renditions: records(current.required_renditions), manifest })
  if (score < 100) throw new Error(`PACKAGE_PREFLIGHT_INCOMPLETE_${score}`)
  const update = await supabase.from(PACKAGES).update({ status: "ready", package_readiness: 100, updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single()
  if (update.error) throw update.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: "publication_package.ready_declared", entityType: "publication_package", entityId: current.id, detail: { sourceId: source?.id || null, readiness: score } })
  return update.data as PublicationPackage
}

export async function authorizePublicationPackage(input: { actorId: string; actorName: string; packageId: string; actorRole: string; reason: string }) {
  const policy = await assertProductionCapability('publishing')
  if (!policy.allowed) throw new Error(policy.reason)
  const { supabase, package: current } = await loadPackage(input.packageId)
  if (current.status !== "ready") throw new Error("RELEASE_AUTHORIZATION_REQUIRES_READY_PACKAGE")
  if (!current.scheduled_at) throw new Error("RELEASE_SCHEDULE_REQUIRED")
  const authorization: JsonRecord = { type: "release_authorization", authorityRole: clean(input.actorRole) || "governed_authority", reason: clean(input.reason), authorizedAt: new Date().toISOString(), authorizedBy: input.actorName }
  if (!clean(input.reason)) throw new Error("RELEASE_AUTHORIZATION_REASON_REQUIRED")
  const evidence = appendEvidence(records(current.evidence), authorization)
  const update = await supabase.from(PACKAGES).update({ status: "scheduled", package_readiness: 100, evidence, updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single()
  if (update.error) throw update.error
  const dossierUpdate = await supabase.from(DOSSIERS).update({ status: "scheduled", publication_state: "scheduled", updated_at: new Date().toISOString() }).eq("id", current.dossier_id)
  if (dossierUpdate.error) throw dossierUpdate.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: "publication_package.release_authorized", entityType: "publication_package", entityId: current.id, detail: { authorityRole: authorization.authorityRole, reason: authorization.reason, scheduledAt: current.scheduled_at } })
  return update.data as PublicationPackage
}

export async function recordPublicationExecution(input: { actorId: string; actorName: string; packageId: string; executionMode: string; externalReference: string; note: string; versionIdentity?: string; renditionIdentity?: string }) {
  const { supabase, package: current } = await loadPackage(input.packageId)
  if (current.status !== "scheduled") throw new Error("PUBLICATION_EXECUTION_REQUIRES_AUTHORIZED_SCHEDULE")
  const executionMode = mode(input.executionMode)
  if (executionMode === "provider" || executionMode === "unsupported") throw new Error("REAL_PROVIDER_EXECUTION_NOT_AVAILABLE")
  if (!clean(input.externalReference)) throw new Error("PUBLICATION_EXTERNAL_REFERENCE_REQUIRED")
  if (!clean(input.note)) throw new Error("PUBLICATION_EXECUTION_NOTE_REQUIRED")
  const proof: JsonRecord = { type: "publication_proof", executionMode, externalReference: clean(input.externalReference), note: clean(input.note), executedAt: new Date().toISOString(), executedBy: input.actorName, versionIdentity: clean(input.versionIdentity), renditionIdentity: clean(input.renditionIdentity) }
  const evidence = appendEvidence(records(current.evidence), proof)
  const update = await supabase.from(PACKAGES).update({ status: "published", published_at: proof.executedAt, external_reference: proof.externalReference, evidence, package_readiness: 95, updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single()
  if (update.error) throw update.error
  const dossierUpdate = await supabase.from(DOSSIERS).update({ status: "published", publication_state: "published", updated_at: new Date().toISOString() }).eq("id", current.dossier_id)
  if (dossierUpdate.error) throw dossierUpdate.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: "publication_package.execution_recorded", entityType: "publication_package", entityId: current.id, detail: { executionMode, externalReference: proof.externalReference } })
  return update.data as PublicationPackage
}

export async function verifyPublicationExecution(input: { actorId: string; actorName: string; packageId: string; conclusion: "verified" | "failed"; reason: string }) {
  const { supabase, package: current } = await loadPackage(input.packageId)
  if (current.status !== "published") throw new Error("PUBLICATION_VERIFICATION_REQUIRES_PUBLISHED_STATE")
  if (!current.external_reference || !current.published_at) throw new Error("PUBLICATION_PROOF_REQUIRED")
  if (!clean(input.reason)) throw new Error("PUBLICATION_VERIFICATION_REASON_REQUIRED")
  const verification: JsonRecord = { type: "publication_verification", conclusion: input.conclusion, reason: clean(input.reason), checkedAt: new Date().toISOString(), checkedBy: input.actorName, externalReference: current.external_reference }
  const evidence = appendEvidence(records(current.evidence), verification)
  const nextStatus = input.conclusion === "verified" ? "verified" : "verification_failed"
  const update = await supabase.from(PACKAGES).update({ status: nextStatus, evidence, package_readiness: input.conclusion === "verified" ? 100 : 80, updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single()
  if (update.error) throw update.error
  const dossierUpdate = await supabase.from(DOSSIERS).update({ publication_state: nextStatus, updated_at: new Date().toISOString() }).eq("id", current.dossier_id)
  if (dossierUpdate.error) throw dossierUpdate.error
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: `publication_package.verification_${input.conclusion}`, entityType: "publication_package", entityId: current.id, detail: { reason: verification.reason, externalReference: current.external_reference } })
  return update.data as PublicationPackage
}

export async function recordPublicationFailure(input: { actorId: string; actorName: string; packageId: string; failureClass: string; impact: string; recoveryOwner: string; recoveryAction: string }) {
  const { supabase, package: current } = await loadPackage(input.packageId)
  if (!["scheduled", "published", "verification_failed"].includes(current.status)) throw new Error("PUBLICATION_FAILURE_STATE_NOT_ALLOWED")
  if (![input.failureClass, input.impact, input.recoveryOwner, input.recoveryAction].every((value) => clean(value))) throw new Error("PUBLICATION_FAILURE_CONSTITUTION_REQUIRED")
  const failure: JsonRecord = { type: "publication_failure", failureClass: clean(input.failureClass), impact: clean(input.impact), recoveryOwner: clean(input.recoveryOwner), recoveryAction: clean(input.recoveryAction), detectedAt: new Date().toISOString(), detectedBy: input.actorName, previousStatus: current.status }
  const evidence = appendEvidence(records(current.evidence), failure)
  const update = await supabase.from(PACKAGES).update({ status: "failed", evidence, package_readiness: Math.min(80, current.package_readiness), updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single()
  if (update.error) throw update.error
  await supabase.from(DOSSIERS).update({ publication_state: "failed", updated_at: new Date().toISOString() }).eq("id", current.dossier_id)
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: "publication_package.failure_recorded", entityType: "publication_package", entityId: current.id, detail: failure })
  return update.data as PublicationPackage
}

export async function recoverPublicationPackage(input: { actorId: string; actorName: string; packageId: string; resolution: string; scheduledAt: string }) {
  const { supabase, package: current } = await loadPackage(input.packageId)
  if (!["failed", "blocked", "verification_failed"].includes(current.status)) throw new Error("PUBLICATION_RECOVERY_NOT_ALLOWED")
  if (!clean(input.resolution) || !clean(input.scheduledAt)) throw new Error("PUBLICATION_RECOVERY_PLAN_REQUIRED")
  const recovery: JsonRecord = { type: "publication_recovery", resolution: clean(input.resolution), recoveredAt: new Date().toISOString(), recoveredBy: input.actorName, previousStatus: current.status, scheduledAt: clean(input.scheduledAt) }
  const evidence = appendEvidence(records(current.evidence), recovery)
  const update = await supabase.from(PACKAGES).update({ status: "scheduled", scheduled_at: clean(input.scheduledAt), published_at: null, external_reference: null, evidence, package_readiness: 100, updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single()
  if (update.error) throw update.error
  await supabase.from(DOSSIERS).update({ status: "scheduled", publication_state: "scheduled", updated_at: new Date().toISOString() }).eq("id", current.dossier_id)
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: "publication_package.recovered", entityType: "publication_package", entityId: current.id, detail: recovery })
  return update.data as PublicationPackage
}

export async function governPublicationTermination(input: { actorId: string; actorName: string; packageId: string; decision: "withdrawn" | "superseded" | "cancelled"; reason: string; replacementPackageId?: string }) {
  const { supabase, package: current } = await loadPackage(input.packageId)
  if (!clean(input.reason)) throw new Error("PUBLICATION_TERMINATION_REASON_REQUIRED")
  if (input.decision === "superseded" && !clean(input.replacementPackageId)) throw new Error("SUPERSEDING_PACKAGE_REQUIRED")
  const event: JsonRecord = { type: "publication_termination", decision: input.decision, reason: clean(input.reason), replacementPackageId: clean(input.replacementPackageId), decidedAt: new Date().toISOString(), decidedBy: input.actorName, previousStatus: current.status }
  const evidence = appendEvidence(records(current.evidence), event)
  const update = await supabase.from(PACKAGES).update({ status: input.decision, evidence, updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single()
  if (update.error) throw update.error
  await supabase.from(DOSSIERS).update({ publication_state: input.decision, updated_at: new Date().toISOString() }).eq("id", current.dossier_id)
  await auditContentHeadquarters({ actorId: input.actorId, actorName: input.actorName, action: `publication_package.${input.decision}`, entityType: "publication_package", entityId: current.id, detail: event })
  return update.data as PublicationPackage
}
