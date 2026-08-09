import crypto from "node:crypto"
import { cleanString, jsonObject, nowIso, socialDb } from "@/lib/social-command/db"
import { getActiveConnectionWithSecrets } from "@/lib/social-command/repository"
import { autoReconcileMetaWebhookSubscriptionsEnabled, reconcileMetaWebhookSubscriptions, verifyMetaConnection } from "@/lib/social-command/meta"
import { classifyConversationText } from "@/lib/social-command/engagement"
import type { SocialAutomation, SocialAutomationRun } from "@/lib/social-command/types"

function automationRow(row: Record<string, unknown>): SocialAutomation {
  return {
    id: cleanString(row.id, 200), automation_code: cleanString(row.automation_code, 120), name: cleanString(row.name, 500),
    description: cleanString(row.description, 4000), family: cleanString(row.family, 120),
    status: (cleanString(row.status, 40) || "active") as SocialAutomation["status"], trigger_type: cleanString(row.trigger_type, 120),
    trigger_config: jsonObject(row.trigger_config), condition_config: jsonObject(row.condition_config), action_config: jsonObject(row.action_config),
    guardrail_config: jsonObject(row.guardrail_config), execution_mode: (cleanString(row.execution_mode, 40) || "automatic") as SocialAutomation["execution_mode"],
    run_count: Number(row.run_count || 0), success_count: Number(row.success_count || 0), failure_count: Number(row.failure_count || 0),
    last_run_at: cleanString(row.last_run_at, 100) || null, created_by: cleanString(row.created_by, 200) || null,
    created_at: cleanString(row.created_at, 100) || nowIso(), updated_at: cleanString(row.updated_at, 100) || nowIso(),
  }
}

export async function listAutomations(): Promise<SocialAutomation[]> {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_automations").select("*").order("automation_code", { ascending: true })
  if (error) throw error
  return (data || []).map((row: any) => automationRow(row as Record<string, unknown>))
}

export async function listAutomationRuns(limit = 180): Promise<SocialAutomationRun[]> {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_automation_runs").select("*").order("started_at", { ascending: false }).limit(limit)
  if (error) throw error
  return (data || []) as SocialAutomationRun[]
}

async function startRun(automation: SocialAutomation, input: {
  triggerType?: string
  entityType?: string | null
  entityId?: string | null
  snapshot?: Record<string, unknown>
}) {
  const db = await socialDb()
  const id = crypto.randomUUID()
  const now = nowIso()
  const { error } = await db.from("social_command_automation_runs").insert({
    id, automation_id: automation.id, automation_code: automation.automation_code,
    trigger_type: input.triggerType || automation.trigger_type, trigger_entity_type: input.entityType || null,
    trigger_entity_id: input.entityId || null, status: "running", decision: null,
    input_snapshot: input.snapshot || {}, condition_results: {}, action_results: [], error_message: null,
    started_at: now, completed_at: null, created_at: now,
  })
  if (error) throw error
  return id
}

async function finishRun(automation: SocialAutomation, runId: string, input: {
  status: "completed" | "failed" | "skipped"
  decision: string
  conditions?: Record<string, unknown>
  actions?: Array<Record<string, unknown>>
  error?: string | null
}) {
  const db = await socialDb()
  const now = nowIso()
  const { error } = await db.from("social_command_automation_runs").update({
    status: input.status, decision: input.decision, condition_results: input.conditions || {}, action_results: input.actions || [],
    error_message: input.error || null, completed_at: now,
  }).eq("id", runId)
  if (error) throw error
  const success = input.status === "completed"
  const failed = input.status === "failed"
  await db.from("social_command_automations").update({
    run_count: automation.run_count + 1,
    success_count: automation.success_count + (success ? 1 : 0),
    failure_count: automation.failure_count + (failed ? 1 : 0),
    last_run_at: now, updated_at: now,
  }).eq("id", automation.id)
  return { runId, ...input }
}

async function action(runId: string, actionType: string, entityType: string | null, entityId: string | null, status: string, result: Record<string, unknown> = {}) {
  const db = await socialDb()
  const now = nowIso()
  await db.from("social_command_automation_actions").insert({
    id: crypto.randomUUID(), run_id: runId, action_type: actionType, entity_type: entityType, entity_id: entityId,
    status, result, created_at: now, completed_at: now,
  })
}

async function getAutomationByCode(code: string) {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_automations").select("*").eq("automation_code", code).maybeSingle()
  if (error) throw error
  return data ? automationRow(data as Record<string, unknown>) : null
}

async function runCredentialHealth(automation: SocialAutomation) {
  const runId = await startRun(automation, { snapshot: { source: "worker" } })
  try {
    const connection = await getActiveConnectionWithSecrets()
    if (!connection) return finishRun(automation, runId, { status: "skipped", decision: "No active Meta connection" })
    const db = await socialDb()
    const now = nowIso()
    const expiryAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : null
    const remainingMs = expiryAt ? expiryAt - Date.now() : null
    const remainingDays = remainingMs == null ? null : remainingMs / (24 * 60 * 60 * 1000)
    if (remainingMs != null && remainingMs <= 0) throw new Error("Meta user token has expired; reconnect required")
    try {
      const identity = await verifyMetaConnection(connection)
      let subscription: unknown = null
      let subscriptionWarning: string | null = null
      if (autoReconcileMetaWebhookSubscriptionsEnabled() && connection.instagram_business_id) {
        try { subscription = await reconcileMetaWebhookSubscriptions(connection) }
        catch (error) { subscriptionWarning = error instanceof Error ? error.message : String(error) }
      }
      const warning = remainingDays != null && remainingDays <= 7
      const health = warning || subscriptionWarning ? "warning" : "healthy"
      await db.from("social_command_connections").update({ connection_health: health, last_verified_at: now, updated_at: now }).eq("id", connection.id)
      await db.from("social_command_channel_health_events").insert({
        id: crypto.randomUUID(), connection_id: connection.id, channel: "meta", health_state: health,
        reason: warning ? `Token expires in ${Math.max(0, remainingDays || 0).toFixed(1)} day(s)` : subscriptionWarning,
        details: { identity, tokenRemainingDays: remainingDays, webhookSubscriptions: subscription, subscriptionWarning }, observed_at: now, created_at: now,
      })
      await action(runId, "connection.health", "connection", connection.id, "completed", { health, tokenRemainingDays: remainingDays, subscriptionWarning })
      return finishRun(automation, runId, { status: "completed", decision: health === "healthy" ? "Connection healthy" : "Connection warning", actions: [{ health, tokenRemainingDays: remainingDays, subscriptionWarning }] })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await db.from("social_command_connections").update({ connection_health: "unhealthy", last_verified_at: now, updated_at: now }).eq("id", connection.id)
      await db.from("social_command_channel_health_events").insert({
        id: crypto.randomUUID(), connection_id: connection.id, channel: "meta", health_state: "requires_reconnect", reason: message,
        details: { tokenRemainingDays: remainingDays }, observed_at: now, created_at: now,
      })
      await action(runId, "connection.health", "connection", connection.id, "completed", { health: "requires_reconnect", reason: message })
      return finishRun(automation, runId, { status: "completed", decision: "Reconnect required", actions: [{ health: "requires_reconnect", reason: message }] })
    }
  } catch (error) {
    return finishRun(automation, runId, { status: "failed", decision: "Credential health failed", error: error instanceof Error ? error.message : String(error) })
  }
}

async function runCollisionGuard(automation: SocialAutomation) {
  const runId = await startRun(automation, { snapshot: { source: "scheduler" } })
  try {
    const db = await socialDb()
    const from = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await db.from("social_command_publications").select("id,title,caption,format,channels,scheduled_at,status").in("status", ["scheduled","queued","preparing"]).gte("scheduled_at", from).lte("scheduled_at", to).order("scheduled_at", { ascending: true }).limit(2000)
    if (error) throw error
    const rows = data || []
    const buckets = new Map<string, Array<Record<string, unknown>>>()
    for (const row of rows) {
      const date = new Date(String(row.scheduled_at || ""))
      if (Number.isNaN(date.getTime())) continue
      const key = date.toISOString().slice(0, 13)
      buckets.set(key, [...(buckets.get(key) || []), row])
    }
    const dense = [...buckets.entries()].filter(([, items]) => items.length >= 3).map(([hour, items]) => ({ hour, count: items.length, ids: items.map((item) => item.id) }))
    const exact = new Map<string, string[]>()
    for (const row of rows) {
      const key = `${cleanString(row.title,500).toLowerCase()}|${cleanString(row.caption,5000).toLowerCase()}|${String(row.scheduled_at || "").slice(0,16)}`
      if (!key.replace(/[|]/g, "")) continue
      exact.set(key, [...(exact.get(key) || []), String(row.id)])
    }
    const duplicates = [...exact.values()].filter((ids) => ids.length > 1)
    await action(runId, "collision.scan", "publication", null, "completed", { dense, duplicates })
    return finishRun(automation, runId, {
      status: "completed", decision: dense.length || duplicates.length ? "Operator attention suggested" : "No significant collisions",
      conditions: { publicationsScanned: rows.length }, actions: [{ denseWindows: dense.length, duplicateGroups: duplicates.length, dense, duplicates }],
    })
  } catch (error) {
    return finishRun(automation, runId, { status: "failed", decision: "Collision scan failed", error: error instanceof Error ? error.message : String(error) })
  }
}

async function runEscalation(automation: SocialAutomation) {
  const runId = await startRun(automation, { snapshot: { source: "engagement" } })
  try {
    const db = await socialDb()
    const thresholdMinutes = Math.max(15, Number(automation.condition_config.unanswered_minutes || process.env.SOCIAL_COMMAND_ENGAGEMENT_ESCALATION_MINUTES || 120))
    const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000).toISOString()
    const { data, error } = await db.from("social_command_conversations").select("id,status,last_message_at,first_response_at,priority").in("status", ["new","open","waiting","assigned"]).is("first_response_at", null).lte("last_message_at", cutoff).limit(500)
    if (error) throw error
    const ids = (data || []).map((row: any) => row.id)
    if (ids.length) await db.from("social_command_conversations").update({ status: "priority", priority: "high", updated_at: nowIso() }).in("id", ids)
    await action(runId, "engagement.escalate", "conversation", null, "completed", { thresholdMinutes, ids })
    return finishRun(automation, runId, { status: "completed", decision: ids.length ? `${ids.length} conversation(s) escalated` : "No escalation required", actions: [{ ids, thresholdMinutes }] })
  } catch (error) {
    return finishRun(automation, runId, { status: "failed", decision: "Engagement escalation failed", error: error instanceof Error ? error.message : String(error) })
  }
}

async function runReconciliation(automation: SocialAutomation) {
  const runId = await startRun(automation, { snapshot: { source: "provider_reconciliation" } })
  try {
    const intelligence = await import("@/lib/social-command/intelligence")
    const result = await intelligence.reconcilePublishedProviderState(80)
    await action(runId, "provider.reconcile", "publication", null, "completed", result)
    return finishRun(automation, runId, { status: "completed", decision: "Provider state reconciled", actions: [result] })
  } catch (error) {
    return finishRun(automation, runId, { status: "failed", decision: "Reconciliation failed", error: error instanceof Error ? error.message : String(error) })
  }
}

async function runMediaReadiness(automation: SocialAutomation) {
  const runId = await startRun(automation, { snapshot: { source: "media_readiness" } })
  try {
    const db = await socialDb()
    const { data, error } = await db.from("social_command_media_assets").select("id,status,mime_type,size_bytes,width,height,duration_seconds").in("status", ["ready","failed","inspecting","stored"]).limit(1000)
    if (error) throw error
    const rows = data || []
    const failed = rows.filter((row: any) => row.status === "failed").length
    const notReady = rows.filter((row: any) => row.status !== "ready").length
    await action(runId, "media.readiness", "media_asset", null, "completed", { scanned: rows.length, failed, notReady })
    return finishRun(automation, runId, { status: "completed", decision: notReady ? "Media exceptions present" : "Media ready", actions: [{ scanned: rows.length, failed, notReady }] })
  } catch (error) {
    return finishRun(automation, runId, { status: "failed", decision: "Media readiness failed", error: error instanceof Error ? error.message : String(error) })
  }
}

export async function evaluateInboundConversationAutomations(conversationId: string) {
  const automation = await getAutomationByCode("A08")
  if (!automation || automation.status !== "active") return null
  const db = await socialDb()
  const { data: conversation, error } = await db.from("social_command_conversations").select("*").eq("id", conversationId).single()
  if (error || !conversation) return null
  const runId = await startRun(automation, { triggerType: "dm.received", entityType: "conversation", entityId: conversationId, snapshot: { last_message_preview: conversation.last_message_preview } })
  try {
    const classification = classifyConversationText(conversation.last_message_preview)
    const dueMinutes = Math.max(15, Number(automation.action_config.response_target_minutes || 120))
    const dueAt = new Date(Date.now() + dueMinutes * 60 * 1000).toISOString()
    const priority = classification.category === "URGENT" || classification.category === "COMPLAINT" ? "high" : "normal"
    await db.from("social_command_conversations").update({
      triage_category: classification.category, triage_source: classification.source, triage_confidence: classification.confidence,
      priority, status: priority === "high" ? "priority" : conversation.status, due_at: dueAt, updated_at: nowIso(),
    }).eq("id", conversationId)
    await action(runId, "dm.triage", "conversation", conversationId, "completed", { ...classification, priority, dueAt })
    return finishRun(automation, runId, { status: "completed", decision: classification.category, actions: [{ ...classification, priority, dueAt }] })
  } catch (error) {
    return finishRun(automation, runId, { status: "failed", decision: "Triage failed", error: error instanceof Error ? error.message : String(error) })
  }
}

export async function cadenceProposal(input: Record<string, unknown>) {
  const count = Math.max(1, Math.min(500, Number(input.count || 1)))
  const periodDays = Math.max(1, Math.min(365, Number(input.periodDays || 30)))
  const perDay = Math.max(1, Math.ceil(count / periodDays))
  const strategies = [
    { code: "balanced", label: "BALANCED", perDay, days: Math.ceil(count / perDay), windows: ["09:30","19:30"] },
    { code: "accelerated", label: "ACCELERATED", perDay: Math.min(8, Math.max(perDay + 1, Math.ceil(count / Math.max(1, Math.floor(periodDays * .65))))), days: 0, windows: ["08:30","13:00","19:30","21:00"] },
    { code: "steady", label: "STEADY", perDay: 1, days: count, windows: ["19:30"] },
  ].map((strategy) => ({ ...strategy, days: strategy.days || Math.ceil(count / strategy.perDay), source: "operator_template" }))
  return { count, periodDays, strategies, truthState: "operator_template" }
}


async function runCrossChannelAdaptation(automation: SocialAutomation, payload: Record<string, unknown>, actorUserId: string) {
  const runId = await startRun(automation, { triggerType: "operator.request", entityType: "content", entityId: null, snapshot: { actorUserId } })
  try {
    const ai = await import("@/lib/social-command/ai")
    const output = await ai.adaptCrossChannelContent(payload, actorUserId, automation.id)
    await action(runId, "content.cross_channel_adapt", "content", null, "completed", { source: output.source, editable: output.editable, variantKeys: Object.keys(output.variants || {}) })
    const completion = await finishRun(automation, runId, { status: "completed", decision: "Editable cross-channel variants generated through central AI control", actions: [{ source: output.source, editable: true }] })
    return { ...output, automationRunId: runId, automationRunStatus: completion.status }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await finishRun(automation, runId, { status: "failed", decision: "Cross-channel adaptation failed", error: message })
    throw error
  }
}

async function runCadenceAutomation(automation: SocialAutomation, payload: Record<string, unknown>, actorUserId: string) {
  const runId = await startRun(automation, { triggerType: "operator.request", entityType: "campaign_plan", entityId: cleanString(payload.campaignId, 200) || null, snapshot: { actorUserId, count: payload.count, periodDays: payload.periodDays, format: payload.format } })
  try {
    const output = await cadenceProposal(payload)
    await action(runId, "campaign.cadence_proposal", "campaign_plan", cleanString(payload.campaignId, 200) || null, "completed", { count: output.count, periodDays: output.periodDays, strategyCodes: output.strategies.map((item) => item.code), truthState: output.truthState })
    const completion = await finishRun(automation, runId, { status: "completed", decision: "Operator-editable cadence proposal generated; MZ1 remains canonical scheduler", actions: [{ count: output.count, strategies: output.strategies.length, truthState: output.truthState }] })
    return { ...output, automationRunId: runId, automationRunStatus: completion.status }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await finishRun(automation, runId, { status: "failed", decision: "Cadence proposal failed", error: message })
    throw error
  }
}

export async function runAutomation(automationIdOrCode: string, actorUserId: string, payload: Record<string, unknown> = {}) {
  const db = await socialDb()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(automationIdOrCode)
  const query = db.from("social_command_automations").select("*")
  const { data, error } = isUuid ? await query.eq("id", automationIdOrCode).maybeSingle() : await query.eq("automation_code", automationIdOrCode).maybeSingle()
  if (error || !data) throw error || new Error("Automation not found")
  const automation = automationRow(data as Record<string, unknown>)
  if (automation.status === "disabled") throw new Error("Automation is disabled")
  switch (automation.automation_code) {
    case "A01": return { status: "delegated", message: "Smart Scheduler is executed by the MZ1 worker", actorUserId }
    case "A02": return { status: "delegated", message: "Failure Recovery is executed by the MZ1 queue", actorUserId }
    case "A03": return runCredentialHealth(automation)
    case "A04": return runCollisionGuard(automation)
    case "A05": return runMediaReadiness(automation)
    case "A06": return runCrossChannelAdaptation(automation, payload, actorUserId)
    case "A07": return runCadenceAutomation(automation, payload, actorUserId)
    case "A08": {
      const conversationId = cleanString(payload.conversationId, 200)
      if (!conversationId) throw new Error("conversationId required for DM Triage")
      return evaluateInboundConversationAutomations(conversationId)
    }
    case "A09": return runEscalation(automation)
    case "A10": return runReconciliation(automation)
    default: throw new Error("Unsupported automation code")
  }
}

export async function updateAutomation(automationId: string, input: Record<string, unknown>, actorUserId: string) {
  const db = await socialDb()
  const { data: current, error: currentError } = await db.from("social_command_automations").select("*").eq("id", automationId).single()
  if (currentError || !current) throw currentError || new Error("Automation not found")
  const patch: Record<string, unknown> = { updated_at: nowIso() }
  const status = cleanString(input.status, 30)
  if (["active","paused","disabled"].includes(status)) patch.status = status
  for (const [source, target] of [["triggerConfig","trigger_config"],["conditionConfig","condition_config"],["actionConfig","action_config"],["guardrailConfig","guardrail_config"]] as const) {
    if (input[source] && typeof input[source] === "object" && !Array.isArray(input[source])) patch[target] = input[source]
  }
  const nextVersion = Number(current.version_no || 1) + 1
  patch.version_no = nextVersion
  const { data, error } = await db.from("social_command_automations").update(patch).eq("id", automationId).select("*").single()
  if (error || !data) throw error || new Error("Automation update failed")
  await db.from("social_command_automation_versions").insert({
    id: crypto.randomUUID(), automation_id: automationId, version_no: nextVersion,
    snapshot: data, changed_by: actorUserId, created_at: nowIso(),
  })
  return automationRow(data as Record<string, unknown>)
}

export async function processAutomationTick() {
  const automations = await listAutomations()
  const runnable = automations.filter((item) => item.status === "active" && ["A03","A04","A05","A09","A10"].includes(item.automation_code))
  const results: Array<{ code: string; result: unknown }> = []
  for (const automation of runnable) {
    let result: unknown
    if (automation.automation_code === "A03") result = await runCredentialHealth(automation)
    else if (automation.automation_code === "A04") result = await runCollisionGuard(automation)
    else if (automation.automation_code === "A05") result = await runMediaReadiness(automation)
    else if (automation.automation_code === "A09") result = await runEscalation(automation)
    else result = await runReconciliation(automation)
    results.push({ code: automation.automation_code, result })
  }
  return results
}
