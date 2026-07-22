import { randomUUID } from "node:crypto"
import { actorCan, requireAmbassadorPermission } from "../auth"
import type { AmbassadorActor, AmbassadorRecord, AmbassadorServiceResult } from "../contracts"
import { AmbassadorServiceError, asAmbassadorServiceError } from "../errors"
import { ENTITY_CONFIG, getSettingsRow, writeAudit } from "../persistence"
import { getAmbassadorSupabaseAdmin } from "../supabase"
import { configurationFromLegacySettings, legacySettingsProjection } from "./defaults"
import type {
  AmbassadorSettingsActorCapabilities,
  AmbassadorSettingsApproval,
  AmbassadorSettingsControlCenterSnapshot,
  AmbassadorSettingsImpactSnapshot,
  AmbassadorSettingsRuntimeEvent,
  AmbassadorSettingsValidationResult,
  AmbassadorSettingsVersion,
  SettingsApprovalDomain,
  SettingsApprovalStatus,
} from "./contracts"
import {
  changedSettingsDomains,
  normalizeSettingsConfiguration,
  validateSettingsConfiguration,
} from "./validation"

const VERSIONS_TABLE = "market_os_ambassador_settings_versions"
const APPROVALS_TABLE = "market_os_ambassador_settings_approvals"
const ACTIVE_TABLE = "market_os_ambassador_settings_active_scopes"
const PUBLICATIONS_TABLE = "market_os_ambassador_settings_publications"
const RUNTIME_TABLE = "market_os_ambassador_settings_runtime_events"

function success<T>(data: T, extras: Record<string, unknown> = {}): AmbassadorServiceResult<T> {
  return { ok: true, source: "ambassador-supabase", data, ...extras }
}

function failure(error: unknown): AmbassadorServiceResult<never> {
  const resolved = asAmbassadorServiceError(error)
  return {
    ok: false,
    source: ["AUTH_REQUIRED", "AUTH_INVALID", "FORBIDDEN", "SCOPE_REQUIRED"].includes(resolved.code)
      ? "ambassador-auth"
      : ["VALIDATION_ERROR", "CONFLICT", "GATE_BLOCKED"].includes(resolved.code)
        ? "ambassador-validation"
        : "ambassador-supabase",
    error: resolved.message,
    code: resolved.code,
    status: resolved.status,
    details: resolved.details,
  }
}

function now(): string {
  return new Date().toISOString()
}

function text(value: unknown): string {
  return String(value ?? "").trim()
}

function titleCaseApprovalDomain(domain: SettingsApprovalDomain): string {
  return domain.charAt(0).toUpperCase() + domain.slice(1)
}

function asVersion(value: unknown): AmbassadorSettingsVersion {
  const row = value as AmbassadorSettingsVersion
  return { ...row, configuration: normalizeSettingsConfiguration(row.configuration) }
}

function scoped(query: any, actor: AmbassadorActor): any {
  return query.eq("tenant_id", actor.tenantId).eq("organization_id", actor.organizationId)
}

function persistenceError(area: string, error: { message?: string } | null): never {
  throw new AmbassadorServiceError("PERSISTENCE_ERROR", `${area}: ${error?.message || "database operation failed"}`, 503)
}

function canAny(actor: AmbassadorActor, permissions: string[]): boolean {
  return actor.permissions.has("*") || permissions.some((permission) => actor.permissions.has(permission))
}

function requireAny(actor: AmbassadorActor, permissions: string[], message: string): void {
  if (!canAny(actor, permissions)) throw new AmbassadorServiceError("FORBIDDEN", message, 403)
}

function approvalDomains(actor: AmbassadorActor): SettingsApprovalDomain[] {
  if (actor.permissions.has("*") || actor.roleKey === "ambassador_admin") return ["program", "compliance", "finance", "system"]
  if (!actorCan(actor, "settings.approve")) return []
  if (actor.roleKey === "market_manager") return ["program"]
  if (actor.roleKey === "compliance") return ["compliance"]
  if (actor.roleKey === "finance") return ["finance"]
  return []
}

function capabilities(actor: AmbassadorActor): AmbassadorSettingsActorCapabilities {
  return {
    canRead: actorCan(actor, "settings.read") || actor.permissions.has("*"),
    canDraft: canAny(actor, ["settings.draft", "settings.write"]),
    canValidate: canAny(actor, ["settings.validate", "settings.write"]),
    canSubmit: canAny(actor, ["settings.submit", "settings.write"]),
    canApprove: canAny(actor, ["settings.approve"]),
    canPublish: canAny(actor, ["settings.publish"]),
    canRollback: canAny(actor, ["settings.rollback"]),
    canProcessRuntime: canAny(actor, ["settings.runtime", "settings.publish"]),
    approvalDomains: approvalDomains(actor),
  }
}

async function listVersions(actor: AmbassadorActor): Promise<AmbassadorSettingsVersion[]> {
  const result = await scoped(
    getAmbassadorSupabaseAdmin().from(VERSIONS_TABLE).select("*").is("archived_at", null),
    actor,
  ).order("revision", { ascending: false }).limit(60)
  if (result.error) persistenceError("Load settings versions", result.error)
  return (result.data || []).map(asVersion)
}

async function listApprovals(actor: AmbassadorActor): Promise<AmbassadorSettingsApproval[]> {
  const result = await scoped(getAmbassadorSupabaseAdmin().from(APPROVALS_TABLE).select("*"), actor)
    .order("created_at", { ascending: false })
    .limit(250)
  if (result.error) persistenceError("Load settings approvals", result.error)
  return (result.data || []) as AmbassadorSettingsApproval[]
}

async function listRuntimeEvents(actor: AmbassadorActor): Promise<AmbassadorSettingsRuntimeEvent[]> {
  const result = await scoped(getAmbassadorSupabaseAdmin().from(RUNTIME_TABLE).select("*"), actor)
    .order("created_at", { ascending: false })
    .limit(80)
  if (result.error) persistenceError("Load settings runtime events", result.error)
  return (result.data || []) as AmbassadorSettingsRuntimeEvent[]
}

async function listScheduledPublications(actor: AmbassadorActor): Promise<AmbassadorRecord[]> {
  const result = await scoped(getAmbassadorSupabaseAdmin().from(PUBLICATIONS_TABLE).select("*"), actor)
    .in("status", ["scheduled", "processing", "failed"])
    .order("scheduled_for", { ascending: true })
    .limit(50)
  if (result.error) persistenceError("Load scheduled settings publications", result.error)
  return (result.data || []) as AmbassadorRecord[]
}

async function listActiveScopes(actor: AmbassadorActor): Promise<AmbassadorRecord[]> {
  const result = await scoped(getAmbassadorSupabaseAdmin().from(ACTIVE_TABLE).select("*"), actor)
    .order("published_at", { ascending: false })
    .limit(100)
  if (result.error) persistenceError("Load active settings scopes", result.error)
  return (result.data || []) as AmbassadorRecord[]
}

async function effectiveVersion(actor: AmbassadorActor, versions?: AmbassadorSettingsVersion[]): Promise<AmbassadorSettingsVersion | null> {
  const pointer = await scoped(
    getAmbassadorSupabaseAdmin().from(ACTIVE_TABLE).select("current_version_id").eq("scope_type", "organization").eq("scope_key", "default"),
    actor,
  ).maybeSingle()
  if (pointer.error) persistenceError("Load active settings pointer", pointer.error)
  const available = versions || await listVersions(actor)
  const activeId = text(pointer.data?.current_version_id)
  if (activeId) return available.find((version) => version.id === activeId) || await getVersion(actor, activeId)
  return available.find((version) => version.status === "published") || null
}

async function effectiveVersionForScope(
  actor: AmbassadorActor,
  scopeType: string,
  scopeKey: string,
): Promise<AmbassadorSettingsVersion | null> {
  const pointer = await scoped(
    getAmbassadorSupabaseAdmin().from(ACTIVE_TABLE).select("current_version_id").eq("scope_type", scopeType).eq("scope_key", scopeKey),
    actor,
  ).maybeSingle()
  if (pointer.error) persistenceError("Load scoped active settings pointer", pointer.error)
  const activeId = text(pointer.data?.current_version_id)
  if (activeId) return getVersion(actor, activeId)
  return effectiveVersion(actor)
}

async function getVersion(actor: AmbassadorActor, id: string): Promise<AmbassadorSettingsVersion | null> {
  const result = await scoped(getAmbassadorSupabaseAdmin().from(VERSIONS_TABLE).select("*").eq("id", id), actor).maybeSingle()
  if (result.error) persistenceError("Load settings version", result.error)
  return result.data ? asVersion(result.data) : null
}

async function requireVersion(actor: AmbassadorActor, id: string): Promise<AmbassadorSettingsVersion> {
  const version = await getVersion(actor, id)
  if (!version) throw new AmbassadorServiceError("NOT_FOUND", "Settings version not found", 404)
  return version
}

async function insertRuntimeEvent(
  actor: AmbassadorActor,
  versionId: string | null,
  eventType: string,
  status: string,
  summary: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  const result = await getAmbassadorSupabaseAdmin().from(RUNTIME_TABLE).insert({
    id: randomUUID(),
    tenant_id: actor.tenantId,
    organization_id: actor.organizationId,
    version_id: versionId,
    event_type: eventType,
    status,
    summary,
    details,
    actor_id: actor.actorId,
    request_id: actor.requestId,
    created_at: now(),
  })
  if (result.error) persistenceError("Write settings runtime event", result.error)
}

export async function loadSettingsControlCenter(
  actor: AmbassadorActor,
): Promise<AmbassadorServiceResult<AmbassadorSettingsControlCenterSnapshot>> {
  try {
    requireAmbassadorPermission(actor, "settings.read")
    const [versions, approvals, runtimeEvents, scheduledPublications, activeScopes, legacy] = await Promise.all([
      listVersions(actor),
      listApprovals(actor),
      listRuntimeEvents(actor),
      listScheduledPublications(actor),
      listActiveScopes(actor),
      getSettingsRow(actor),
    ])
    const effective = await effectiveVersion(actor, versions)
    const configuration = effective?.configuration || configurationFromLegacySettings(legacy)
    const drafts = versions.filter((version) => ["draft", "revision_requested", "pending_approval", "approved", "scheduled"].includes(version.status))
    const diagnostics: AmbassadorSettingsControlCenterSnapshot["diagnostics"] = []
    if (!effective) diagnostics.push({ severity: "warning", message: "No versioned policy has been published yet. The current legacy settings are displayed as the effective baseline." })
    if (scheduledPublications.some((item) => item.status === "failed")) diagnostics.push({ severity: "error", message: "At least one scheduled publication failed and requires intervention." })
    if (drafts.some((version) => version.status === "approved")) diagnostics.push({ severity: "info", message: "An approved settings version is ready for publication." })

    const snapshot: AmbassadorSettingsControlCenterSnapshot = {
      effectiveVersion: effective,
      effectiveConfiguration: configuration,
      drafts,
      versions,
      approvals,
      runtimeEvents,
      scheduledPublications,
      activeScopes,
      actor: {
        displayName: actor.displayName,
        roleKey: actor.roleKey,
        tenantId: actor.tenantId,
        organizationId: actor.organizationId,
      },
      capabilities: capabilities(actor),
      diagnostics,
      loadedAt: now(),
    }
    return success(snapshot, { snapshot })
  } catch (error) {
    return failure(error)
  }
}

export async function createSettingsDraft(
  actor: AmbassadorActor,
  payload: Record<string, unknown>,
): Promise<AmbassadorServiceResult<AmbassadorSettingsVersion>> {
  try {
    requireAny(actor, ["settings.draft", "settings.write"], "Missing Ambassador permission: settings.draft")
    const scopeType = text(payload.scopeType || payload.scope_type || "organization")
    const scopeKey = text(payload.scopeKey || payload.scope_key || "default")
    if (!["organization", "program", "country", "region", "city", "territory", "service_line"].includes(scopeType)) {
      throw new AmbassadorServiceError("VALIDATION_ERROR", "Unsupported Ambassador settings scope type", 400)
    }
    if (!scopeKey) throw new AmbassadorServiceError("VALIDATION_ERROR", "Settings scope key is required", 400)
    const current = await effectiveVersionForScope(actor, scopeType, scopeKey)
    const legacy = current ? null : await getSettingsRow(actor)
    const baseConfiguration = current?.configuration || configurationFromLegacySettings(legacy)
    const title = text(payload.title) || `Ambassador policy draft ${new Date().toLocaleDateString("fr-MA")}`
    const result = await getAmbassadorSupabaseAdmin().from(VERSIONS_TABLE).insert({
      id: randomUUID(),
      tenant_id: actor.tenantId,
      organization_id: actor.organizationId,
      title,
      status: "draft",
      scope_type: scopeType,
      scope_key: scopeKey,
      base_version_id: current?.id || null,
      configuration: baseConfiguration,
      change_summary: text(payload.changeSummary || payload.change_summary),
      approval_round: 0,
      created_by_actor_id: actor.actorId,
      updated_by_actor_id: actor.actorId,
      created_at: now(),
      updated_at: now(),
    }).select("*").single()
    if (result.error) persistenceError("Create settings draft", result.error)
    const version = asVersion(result.data)
    await writeAudit(actor, {
      entityType: VERSIONS_TABLE,
      entityId: version.id,
      action: "settings_draft_created",
      summary: `Created settings draft ${version.title}`,
      after: version,
    })
    return success(version, { record: version })
  } catch (error) {
    return failure(error)
  }
}

export async function updateSettingsDraft(
  actor: AmbassadorActor,
  id: string,
  payload: Record<string, unknown>,
): Promise<AmbassadorServiceResult<AmbassadorSettingsVersion>> {
  try {
    requireAny(actor, ["settings.draft", "settings.write"], "Missing Ambassador permission: settings.draft")
    const existing = await requireVersion(actor, id)
    if (!["draft", "revision_requested"].includes(existing.status)) {
      throw new AmbassadorServiceError("GATE_BLOCKED", "Only draft or revision-requested settings can be edited", 409)
    }
    const configuration = payload.configuration === undefined
      ? existing.configuration
      : normalizeSettingsConfiguration(payload.configuration)
    const patch: Record<string, unknown> = {
      title: text(payload.title) || existing.title,
      change_summary: payload.changeSummary === undefined && payload.change_summary === undefined
        ? existing.change_summary
        : text(payload.changeSummary || payload.change_summary),
      configuration,
      status: "draft",
      validation_result: null,
      impact_snapshot: null,
      updated_by_actor_id: actor.actorId,
      updated_at: now(),
    }
    const result = await scoped(getAmbassadorSupabaseAdmin().from(VERSIONS_TABLE).update(patch).eq("id", id), actor).select("*").single()
    if (result.error) persistenceError("Update settings draft", result.error)
    const version = asVersion(result.data)
    await writeAudit(actor, {
      entityType: VERSIONS_TABLE,
      entityId: id,
      action: "settings_draft_updated",
      summary: `Updated settings draft ${version.title}`,
      payload: { changedDomains: changedSettingsDomains(existing.configuration, version.configuration) },
      before: existing,
      after: version,
    })
    return success(version, { record: version })
  } catch (error) {
    return failure(error)
  }
}

export async function validateSettingsDraft(
  actor: AmbassadorActor,
  id: string,
): Promise<AmbassadorServiceResult<{ version: AmbassadorSettingsVersion; validation: AmbassadorSettingsValidationResult }>> {
  try {
    requireAny(actor, ["settings.validate", "settings.write"], "Missing Ambassador permission: settings.validate")
    const existing = await requireVersion(actor, id)
    if (!["draft", "revision_requested"].includes(existing.status)) {
      throw new AmbassadorServiceError("GATE_BLOCKED", "Only editable settings drafts can be validated", 409)
    }
    const base = existing.base_version_id ? await getVersion(actor, existing.base_version_id) : await effectiveVersion(actor)
    const validation = validateSettingsConfiguration(existing.configuration, base?.configuration)
    const result = await scoped(
      getAmbassadorSupabaseAdmin().from(VERSIONS_TABLE).update({ validation_result: validation, updated_by_actor_id: actor.actorId, updated_at: now() }).eq("id", id),
      actor,
    ).select("*").single()
    if (result.error) persistenceError("Persist settings validation", result.error)
    const version = asVersion(result.data)
    await insertRuntimeEvent(actor, id, "validation", validation.valid ? "passed" : "failed", validation.valid ? "Settings validation passed" : "Settings validation found blocking issues", { score: validation.score, issues: validation.issues })
    await writeAudit(actor, {
      entityType: VERSIONS_TABLE,
      entityId: id,
      action: "settings_validated",
      summary: validation.valid ? "Settings validation passed" : "Settings validation failed",
      payload: { validation },
      before: existing,
      after: version,
    })
    return success({ version, validation }, { record: version })
  } catch (error) {
    return failure(error)
  }
}

async function numberCount(table: string, actor: AmbassadorActor, configure?: (query: any) => any): Promise<number> {
  let query: any = scoped(getAmbassadorSupabaseAdmin().from(table).select("id", { count: "exact", head: true }), actor)
  if (configure) query = configure(query)
  const result = await query
  if (result.error) persistenceError(`Count ${table}`, result.error)
  return Number(result.count || 0)
}

export async function simulateSettingsDraft(
  actor: AmbassadorActor,
  id: string,
): Promise<AmbassadorServiceResult<{ version: AmbassadorSettingsVersion; impact: AmbassadorSettingsImpactSnapshot }>> {
  try {
    requireAny(actor, ["settings.validate", "settings.write"], "Missing Ambassador permission: settings.validate")
    const existing = await requireVersion(actor, id)
    if (!["draft", "revision_requested", "pending_approval", "approved"].includes(existing.status)) {
      throw new AmbassadorServiceError("GATE_BLOCKED", "This settings version cannot be simulated in its current state", 409)
    }
    const effective = await effectiveVersion(actor)
    const before = effective?.configuration || configurationFromLegacySettings(await getSettingsRow(actor))
    const config = existing.configuration
    const [affectedAmbassadors, affectedTerritories, openMissions, candidatesInPipeline, pendingConversions, pendingRewards, payouts] = await Promise.all([
      numberCount(ENTITY_CONFIG.ambassadors.table, actor, (query) => query.is("archived_at", null)),
      numberCount(ENTITY_CONFIG.territories.table, actor, (query) => query.is("archived_at", null)),
      numberCount(ENTITY_CONFIG.missions.table, actor, (query) => query.not("status", "in", "(completed,cancelled,archived)")),
      numberCount(ENTITY_CONFIG.recruitment.table, actor, (query) => query.not("stage", "in", "(converted,rejected,archived)")),
      numberCount(ENTITY_CONFIG.conversions.table, actor, (query) => query.in("status", ["pending", "submitted", "under_review"])),
      numberCount(ENTITY_CONFIG.incentives.table, actor, (query) => query.in("status", ["pending", "approved"])),
      scoped(getAmbassadorSupabaseAdmin().from(ENTITY_CONFIG.payouts.table).select("amount_mad,status"), actor).in("status", ["draft", "pending_approval", "approved", "processing"]),
    ])
    if (payouts.error) persistenceError("Load pending payout exposure", payouts.error)
    const pendingPayoutsMad = (payouts.data || []).reduce((sum: number, row: Record<string, unknown>) => sum + Number(row.amount_mad || 0), 0)
    const commissionDelta = config.rewards.defaultCommissionRate - before.rewards.defaultCommissionRate
    const projectedCommissionDeltaMad = Math.round(pendingPayoutsMad * (commissionDelta / Math.max(1, before.rewards.defaultCommissionRate || 1)))
    const changed = changedSettingsDomains(before, config)
    const warnings: string[] = []
    if (changed.includes("rewards")) warnings.push("Financial reward and payout exposure will change after publication.")
    if (changed.includes("governance")) warnings.push("Security or governance controls are being modified.")
    if (config.program.status !== "active") warnings.push(`Program status will become ${config.program.status}.`)
    if (config.training.certificationMinimumScore > before.training.certificationMinimumScore) warnings.push("Existing Ambassadors may fall below the new certification threshold.")
    if (config.territories.maximumAmbassadorsPerTerritory < before.territories.maximumAmbassadorsPerTerritory) warnings.push("Some territories may exceed the proposed capacity limit.")
    const validation = validateSettingsConfiguration(config, before)
    const riskPoints = validation.issues.filter((item) => item.severity === "error").length * 4 + warnings.length + (changed.includes("rewards") ? 2 : 0) + (changed.includes("governance") ? 3 : 0)
    const riskLevel: AmbassadorSettingsImpactSnapshot["riskLevel"] = riskPoints >= 8 ? "critical" : riskPoints >= 5 ? "high" : riskPoints >= 2 ? "medium" : "low"
    const impact: AmbassadorSettingsImpactSnapshot = {
      calculatedAt: now(),
      affectedAmbassadors,
      affectedTerritories,
      openMissions,
      candidatesInPipeline,
      pendingConversions,
      pendingRewards,
      pendingPayoutsMad,
      projectedCommissionDeltaMad,
      riskLevel,
      warnings,
    }
    const result = await scoped(getAmbassadorSupabaseAdmin().from(VERSIONS_TABLE).update({ impact_snapshot: impact, updated_by_actor_id: actor.actorId, updated_at: now() }).eq("id", id), actor).select("*").single()
    if (result.error) persistenceError("Persist settings simulation", result.error)
    const version = asVersion(result.data)
    await insertRuntimeEvent(actor, id, "simulation", "completed", "Operational and financial impact simulation completed", { impact, changedDomains: changed })
    await writeAudit(actor, {
      entityType: VERSIONS_TABLE,
      entityId: id,
      action: "settings_impact_simulated",
      summary: "Simulated settings operational and financial impact",
      payload: { impact, changedDomains: changed },
      before: existing,
      after: version,
    })
    return success({ version, impact }, { record: version })
  } catch (error) {
    return failure(error)
  }
}

export async function submitSettingsDraft(
  actor: AmbassadorActor,
  id: string,
): Promise<AmbassadorServiceResult<AmbassadorSettingsVersion>> {
  try {
    requireAny(actor, ["settings.submit", "settings.write"], "Missing Ambassador permission: settings.submit")
    const existing = await requireVersion(actor, id)
    if (!["draft", "revision_requested"].includes(existing.status)) {
      throw new AmbassadorServiceError("GATE_BLOCKED", "Only editable settings drafts can be submitted", 409)
    }
    if (existing.configuration.governance.configurationChangeReasonRequired && !text(existing.change_summary)) {
      throw new AmbassadorServiceError("VALIDATION_ERROR", "A change summary is required before submission", 400)
    }
    const base = existing.base_version_id ? await getVersion(actor, existing.base_version_id) : await effectiveVersion(actor)
    const validation = validateSettingsConfiguration(existing.configuration, base?.configuration)
    if (!validation.valid) throw new AmbassadorServiceError("GATE_BLOCKED", "Settings validation must pass before submission", 409, validation)

    const result = await getAmbassadorSupabaseAdmin().rpc("market_os_ambassador_submit_settings_version", {
      p_version_id: id,
      p_actor_id: actor.actorId,
      p_request_id: actor.requestId,
      p_validation_result: validation,
      p_required_approvals: validation.requiredApprovals,
    })
    if (result.error) persistenceError("Submit settings draft", result.error)
    const version = asVersion(result.data)
    return success(version, { record: version })
  } catch (error) {
    return failure(error)
  }
}

export async function decideSettingsApproval(
  actor: AmbassadorActor,
  id: string,
  payload: Record<string, unknown>,
): Promise<AmbassadorServiceResult<AmbassadorSettingsVersion>> {
  try {
    requireAny(actor, ["settings.approve"], "Missing Ambassador permission: settings.approve")
    const version = await requireVersion(actor, id)
    if (version.status !== "pending_approval") throw new AmbassadorServiceError("GATE_BLOCKED", "This version is not awaiting approval", 409)
    const domain = text(payload.domain) as SettingsApprovalDomain
    const decision = text(payload.decision) as SettingsApprovalStatus
    const note = text(payload.note || payload.decision_note)
    if (!["program", "compliance", "finance", "system"].includes(domain)) throw new AmbassadorServiceError("VALIDATION_ERROR", "Invalid approval domain", 400)
    if (!["approved", "rejected", "revision_requested"].includes(decision)) throw new AmbassadorServiceError("VALIDATION_ERROR", "Decision must be approved, rejected or revision_requested", 400)
    if (!note) throw new AmbassadorServiceError("VALIDATION_ERROR", "Approval decision note is required", 400)
    if (!approvalDomains(actor).includes(domain)) throw new AmbassadorServiceError("FORBIDDEN", `Actor role cannot decide ${domain} settings approval`, 403)
    if (
      version.configuration.governance.separationOfDutiesRequired &&
      ["finance", "compliance"].includes(domain) &&
      [version.created_by_actor_id, version.submitted_by_actor_id].filter(Boolean).includes(actor.actorId)
    ) {
      throw new AmbassadorServiceError(
        "FORBIDDEN",
        `${titleCaseApprovalDomain(domain)} approval must be decided by an actor other than the draft author or submitter`,
        403,
      )
    }

    const result = await getAmbassadorSupabaseAdmin().rpc("market_os_ambassador_decide_settings_approval", {
      p_version_id: id,
      p_actor_id: actor.actorId,
      p_domain: domain,
      p_decision: decision,
      p_note: note,
      p_request_id: actor.requestId,
    })
    if (result.error) persistenceError("Persist settings approval decision", result.error)
    const updated = asVersion(result.data)
    return success(updated, { record: updated })
  } catch (error) {
    return failure(error)
  }
}

async function publishNow(actor: AmbassadorActor, version: AmbassadorSettingsVersion, source: "manual" | "scheduled" | "rollback"): Promise<AmbassadorSettingsVersion> {
  const legacy = legacySettingsProjection(version.configuration)
  const result = await getAmbassadorSupabaseAdmin().rpc("market_os_ambassador_publish_settings_version", {
    p_version_id: version.id,
    p_actor_id: actor.actorId,
    p_request_id: actor.requestId,
    p_legacy_projection: legacy,
    p_publication_source: source,
  })
  if (result.error) persistenceError("Publish Ambassador settings version", result.error)
  return asVersion(result.data)
}

export async function publishSettingsVersion(
  actor: AmbassadorActor,
  id: string,
  payload: Record<string, unknown>,
): Promise<AmbassadorServiceResult<AmbassadorSettingsVersion>> {
  try {
    requireAny(actor, ["settings.publish"], "Missing Ambassador permission: settings.publish")
    const version = await requireVersion(actor, id)
    if (version.status !== "approved") throw new AmbassadorServiceError("GATE_BLOCKED", "Only fully approved settings can be published", 409)
    if (!version.validation_result?.valid) throw new AmbassadorServiceError("GATE_BLOCKED", "A successful validation result is required before publication", 409)
    const scheduledFor = text(payload.scheduledFor || payload.scheduled_for)
    if (scheduledFor && new Date(scheduledFor).getTime() > Date.now() + 60_000) {
      const normalizedSchedule = new Date(scheduledFor).toISOString()
      const result = await getAmbassadorSupabaseAdmin().rpc("market_os_ambassador_schedule_settings_version", {
        p_version_id: id,
        p_actor_id: actor.actorId,
        p_request_id: actor.requestId,
        p_scheduled_for: normalizedSchedule,
      })
      if (result.error) persistenceError("Schedule settings publication", result.error)
      const scheduled = asVersion((result.data as Record<string, unknown>).version)
      return success(scheduled, { record: scheduled, publication: (result.data as Record<string, unknown>).publication })
    }
    const published = await publishNow(actor, version, "manual")
    return success(published, { record: published })
  } catch (error) {
    return failure(error)
  }
}

export async function processScheduledSettingsPublications(
  actor: AmbassadorActor,
): Promise<AmbassadorServiceResult<{ processed: number; failed: number }>> {
  try {
    requireAny(actor, ["settings.runtime", "settings.publish"], "Missing Ambassador permission: settings.runtime")
    const staleBefore = new Date(Date.now() - 15 * 60_000).toISOString()
    const recovery = await scoped(
      getAmbassadorSupabaseAdmin().from(PUBLICATIONS_TABLE).update({ status: "scheduled", error_message: "Recovered stale processing lock", updated_at: now() }).eq("status", "processing").lt("updated_at", staleBefore),
      actor,
    )
    if (recovery.error) persistenceError("Recover stale settings publication locks", recovery.error)
    const due = await scoped(
      getAmbassadorSupabaseAdmin().from(PUBLICATIONS_TABLE).select("*").eq("status", "scheduled").lte("scheduled_for", now()),
      actor,
    ).order("scheduled_for", { ascending: true }).limit(20)
    if (due.error) persistenceError("Load due settings publications", due.error)
    let processed = 0
    let failed = 0
    for (const row of due.data || []) {
      try {
        const lock = await scoped(getAmbassadorSupabaseAdmin().from(PUBLICATIONS_TABLE).update({ status: "processing", updated_at: now() }).eq("id", row.id).eq("status", "scheduled"), actor).select("id").maybeSingle()
        if (lock.error) persistenceError("Lock settings publication", lock.error)
        if (!lock.data) continue
        const version = await requireVersion(actor, String(row.version_id))
        if (version.status !== "scheduled") throw new AmbassadorServiceError("GATE_BLOCKED", "Scheduled settings version is no longer publishable", 409)
        const publishable = { ...version, status: "approved" } as AmbassadorSettingsVersion
        await publishNow(actor, publishable, "scheduled")
        processed += 1
      } catch (error) {
        failed += 1
        const resolved = asAmbassadorServiceError(error)
        const failedUpdate = await scoped(
          getAmbassadorSupabaseAdmin().from(PUBLICATIONS_TABLE).update({ status: "failed", error_message: resolved.message, updated_at: now() }).eq("id", row.id),
          actor,
        )
        if (failedUpdate.error) persistenceError("Persist failed settings publication", failedUpdate.error)
        await insertRuntimeEvent(actor, String(row.version_id || "") || null, "publication", "failed", "Scheduled settings publication failed", { error: resolved.message, publicationId: row.id })
      }
    }
    return success({ processed, failed })
  } catch (error) {
    return failure(error)
  }
}

export async function rollbackSettingsVersion(
  actor: AmbassadorActor,
  id: string,
  payload: Record<string, unknown>,
): Promise<AmbassadorServiceResult<AmbassadorSettingsVersion>> {
  try {
    requireAny(actor, ["settings.rollback"], "Missing Ambassador permission: settings.rollback")
    const target = await requireVersion(actor, id)
    if (!["published", "superseded", "rolled_back"].includes(target.status)) {
      throw new AmbassadorServiceError("GATE_BLOCKED", "Only a previously published settings version can be restored", 409)
    }
    const reason = text(payload.reason)
    if (!reason) throw new AmbassadorServiceError("VALIDATION_ERROR", "Rollback reason is required", 400)
    const legacy = legacySettingsProjection(target.configuration)
    const result = await getAmbassadorSupabaseAdmin().rpc("market_os_ambassador_rollback_settings_version", {
      p_target_version_id: id,
      p_actor_id: actor.actorId,
      p_request_id: actor.requestId,
      p_reason: reason,
      p_legacy_projection: legacy,
    })
    if (result.error) persistenceError("Rollback Ambassador settings version", result.error)
    const restored = asVersion(result.data)
    return success(restored, { record: restored })
  } catch (error) {
    return failure(error)
  }
}

export async function getSettingsDraft(
  actor: AmbassadorActor,
  id: string,
): Promise<AmbassadorServiceResult<AmbassadorSettingsVersion>> {
  try {
    requireAmbassadorPermission(actor, "settings.read")
    const version = await requireVersion(actor, id)
    return success(version, { record: version })
  } catch (error) {
    return failure(error)
  }
}
