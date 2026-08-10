import crypto from "node:crypto"
import { cleanString, jsonObject, nowIso, socialDb } from "@/lib/social-command/db"
import { getActiveConnectionWithSecrets } from "@/lib/social-command/repository"
import { getConnectionSecrets, metaConfig } from "@/lib/social-command/meta"
import type { SocialChannel, SocialFormat, SocialMetricSnapshot, SocialPerformanceSummary } from "@/lib/social-command/types"

async function graphGet(pathname: string, params: Record<string, string>, accessToken: string) {
  const cfg = metaConfig()
  const url = new URL(`https://graph.facebook.com/${cfg.graphVersion}/${pathname.replace(/^\/+/, "")}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  url.searchParams.set("access_token", accessToken)
  const response = await fetch(url, { cache: "no-store" })
  const text = await response.text().catch(() => "")
  let payload: Record<string, unknown> = {}
  try { payload = text ? JSON.parse(text) as Record<string, unknown> : {} } catch {}
  const errorObject = payload.error && typeof payload.error === "object" ? payload.error as Record<string, unknown> : null
  if (!response.ok || errorObject) throw new Error(cleanString(errorObject?.message || payload.error || `Meta HTTP ${response.status}`, 3000))
  return payload
}

function metricValue(row: Record<string, unknown>) {
  const values = Array.isArray(row.values) ? row.values as Array<Record<string, unknown>> : []
  const first = values[0] || {}
  const value = first.value ?? row.value
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

async function insertMetric(input: {
  channel: SocialChannel
  entityType: string
  entityId: string
  metricCode: string
  canonicalMetric: string
  value: number | null
  period?: string | null
  truthState: SocialMetricSnapshot["truth_state"]
  payload?: Record<string, unknown>
  observedAt?: string
}) {
  const db = await socialDb()
  const observedAt = input.observedAt || nowIso()
  const { error } = await db.from("social_command_metric_snapshots").insert({
    id: crypto.randomUUID(), provider: "meta", channel: input.channel, entity_type: input.entityType, entity_id: input.entityId,
    metric_code: input.metricCode, canonical_metric: input.canonicalMetric, value_numeric: input.value, value_text: null,
    period: input.period || null, observed_at: observedAt, truth_state: input.truthState,
    provider_payload: input.payload || {}, created_at: nowIso(),
  })
  if (error) throw error
}

export async function syncProviderMetrics() {
  const connection = await getActiveConnectionWithSecrets()
  if (!connection) return { synced: 0, truthState: "unavailable", reason: "No active Meta connection" }
  const scopes = Array.isArray(connection.granted_scopes) ? connection.granted_scopes.map(String) : []
  if (!scopes.includes("instagram_manage_insights")) {
    if (connection.instagram_business_id) {
      await insertMetric({
        channel: "instagram", entityType: "account", entityId: String(connection.instagram_business_id), metricCode: "provider_insights",
        canonicalMetric: "provider_insights", value: null, truthState: "unavailable", payload: { reason: "instagram_manage_insights permission missing" },
      })
    }
    return { synced: 0, truthState: "unavailable", reason: "instagram_manage_insights permission missing" }
  }
  const igId = cleanString(connection.instagram_business_id, 300)
  if (!igId) return { synced: 0, truthState: "unavailable", reason: "Instagram business account not connected" }
  const { pageToken } = getConnectionSecrets(connection)
  if (!pageToken) return { synced: 0, truthState: "failed", reason: "Page token unavailable" }
  let synced = 0
  const observedAt = nowIso()
  try {
    const account = await graphGet(`${encodeURIComponent(igId)}/insights`, { metric: "reach,profile_views", period: "day" }, pageToken)
    for (const raw of Array.isArray(account.data) ? account.data as Array<Record<string, unknown>> : []) {
      const code = cleanString(raw.name, 120)
      if (!code) continue
      await insertMetric({ channel: "instagram", entityType: "account", entityId: igId, metricCode: code, canonicalMetric: code, value: metricValue(raw), period: "day", truthState: "live", payload: raw, observedAt })
      synced++
    }
  } catch (error) {
    await insertMetric({ channel: "instagram", entityType: "account", entityId: igId, metricCode: "provider_insights", canonicalMetric: "provider_insights", value: null, truthState: "failed", payload: { error: error instanceof Error ? error.message : String(error) }, observedAt })
  }

  const db = await socialDb()
  const { data: results, error: resultError } = await db.from("social_command_provider_results")
    .select("publication_id,provider_reference,channel,created_at").eq("channel", "instagram").eq("result_type", "published")
    .not("provider_reference", "is", null).order("created_at", { ascending: false }).limit(80)
  if (resultError) throw resultError
  for (const row of results || []) {
    const ref = cleanString(row.provider_reference, 500)
    if (!ref) continue
    try {
      const payload = await graphGet(`${encodeURIComponent(ref)}/insights`, { metric: "reach,likes,comments,saved,shares" }, pageToken)
      for (const raw of Array.isArray(payload.data) ? payload.data as Array<Record<string, unknown>> : []) {
        const code = cleanString(raw.name, 120)
        if (!code) continue
        await insertMetric({ channel: "instagram", entityType: "publication", entityId: String(row.publication_id), metricCode: code, canonicalMetric: code, value: metricValue(raw), period: null, truthState: "live", payload: raw, observedAt })
        synced++
      }
    } catch (error) {
      await insertMetric({ channel: "instagram", entityType: "publication", entityId: String(row.publication_id), metricCode: "provider_insights", canonicalMetric: "provider_insights", value: null, truthState: "provider_limited", payload: { providerReference: ref, error: error instanceof Error ? error.message : String(error) }, observedAt })
    }
  }
  return { synced, truthState: synced ? "live" : "unavailable", observedAt }
}

export async function listMetricSnapshots(limit = 600) {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_metric_snapshots").select("*").order("observed_at", { ascending: false }).limit(limit)
  if (error) throw error
  return (data || []) as SocialMetricSnapshot[]
}

function median(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((a,b) => a-b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export async function performanceSummary(): Promise<SocialPerformanceSummary> {
  const db = await socialDb()
  const [metrics, publicationResult, jobsResult, conversationsResult, messagesResult, commentsResult] = await Promise.all([
    listMetricSnapshots(1200),
    db.from("social_command_publications").select("id,format,channels,status,published_at,scheduled_at").neq("status", "archived").limit(5000),
    db.from("social_command_execution_jobs").select("id,status,attempt_count,channel,publication_id").limit(5000),
    db.from("social_command_conversations").select("id,status,unread_count,first_received_at,first_response_at").neq("status", "archived").limit(5000),
    db.from("social_command_messages").select("id,direction,created_at").eq("direction", "inbound").limit(5000),
    db.from("social_command_comments").select("id,status").limit(5000),
  ])
  for (const result of [publicationResult, jobsResult, conversationsResult, messagesResult, commentsResult]) if (result.error) throw result.error
  const publications = publicationResult.data || []
  const jobs = jobsResult.data || []
  const conversations = conversationsResult.data || []
  const messages = messagesResult.data || []
  const comments = commentsResult.data || []
  const completedJobs = jobs.filter((job: any) => ["published","failed"].includes(job.status))
  const publishedJobs = completedJobs.filter((job: any) => job.status === "published")
  const responseMinutes = conversations.flatMap((conversation: any) => {
    if (!conversation.first_response_at || !conversation.first_received_at) return []
    const delta = (new Date(conversation.first_response_at).getTime() - new Date(conversation.first_received_at).getTime()) / 60000
    return Number.isFinite(delta) && delta >= 0 ? [delta] : []
  })
  const latestObserved = metrics[0]?.observed_at || null
  const liveMetrics = metrics.filter((metric) => metric.truth_state === "live" && metric.value_numeric != null)
  const latestPerPublication = new Map<string, number>()
  for (const metric of liveMetrics) {
    if (metric.entity_type !== "publication") continue
    if (!["reach","engagement","likes","comments","saved","shares"].includes(metric.metric_code)) continue
    if (!latestPerPublication.has(metric.entity_id)) latestPerPublication.set(metric.entity_id, Number(metric.value_numeric || 0))
  }
  const byFormat = new Map<SocialFormat, number[]>()
  const byChannel = new Map<SocialChannel, number[]>()
  for (const publication of publications) {
    const value = latestPerPublication.get(publication.id)
    if (value == null) continue
    const format = publication.format as SocialFormat
    byFormat.set(format, [...(byFormat.get(format) || []), value])
    for (const channel of (publication.channels || []) as SocialChannel[]) byChannel.set(channel, [...(byChannel.get(channel) || []), value])
  }
  const formatPerformance = (["post","story","reel","carousel"] as SocialFormat[]).map((format) => {
    const values = byFormat.get(format) || []
    return { format, publications: publications.filter((row: any) => row.format === format).length, metric: values.length ? values.reduce((a,b)=>a+b,0) / values.length : null, metricCode: values.length ? "provider_signal_avg" : null }
  })
  const channelPerformance = (["instagram","facebook"] as SocialChannel[]).map((channel) => {
    const values = byChannel.get(channel) || []
    return { channel, publications: publications.filter((row: any) => Array.isArray(row.channels) && row.channels.includes(channel)).length, metric: values.length ? values.reduce((a,b)=>a+b,0) / values.length : null, metricCode: values.length ? "provider_signal_avg" : null }
  })

  const slots = new Map<string, { count: number; score: number; scored: number }>()
  for (const publication of publications.filter((row: any) => row.published_at)) {
    const date = new Date(publication.published_at)
    if (Number.isNaN(date.getTime())) continue
    const key = `${date.getDay()}-${date.getHours()}`
    const current = slots.get(key) || { count: 0, score: 0, scored: 0 }
    current.count++
    const value = latestPerPublication.get(publication.id)
    if (value != null) { current.score += value; current.scored++ }
    slots.set(key, current)
  }
  const hotSlots = [...slots.entries()].map(([key, value]) => {
    const [weekday, hour] = key.split("-").map(Number)
    const enough = value.scored >= 4 && publications.filter((row: any) => row.published_at).length >= 12
    return { weekday, hour, sampleSize: value.count, score: enough ? value.score / value.scored : null, state: enough ? "live" as const : "insufficient_data" as const }
  }).sort((a,b) => (b.score ?? -1) - (a.score ?? -1)).slice(0, 12)

  return {
    truthState: liveMetrics.length ? "live" : metrics.some((metric) => metric.truth_state === "failed") ? "failed" : "insufficient_data",
    observedAt: latestObserved,
    publications: publications.length,
    publishingSuccessRate: completedJobs.length ? publishedJobs.length / completedJobs.length * 100 : null,
    failureRate: completedJobs.length ? completedJobs.filter((job: any) => job.status === "failed").length / completedJobs.length * 100 : null,
    recoveredJobs: jobs.filter((job: any) => Number(job.attempt_count || 0) > 1 && job.status === "published").length,
    inboundMessages: messages.length,
    unreadConversations: conversations.reduce((sum: number, conversation: any) => sum + Number(conversation.unread_count || 0), 0),
    openConversations: conversations.filter((conversation: any) => !["resolved","archived"].includes(conversation.status)).length,
    medianFirstResponseMinutes: median(responseMinutes), comments: comments.length,
    unresolvedComments: comments.filter((comment: any) => !["answered","resolved"].includes(comment.status)).length,
    metrics: metrics.slice(0, 240), formatPerformance, channelPerformance, hotSlots,
  }
}

export async function capabilityMatrix() {
  const db = await socialDb()
  const connection = await getActiveConnectionWithSecrets()
  if (!connection) return []
  const scopes = Array.isArray(connection.granted_scopes) ? connection.granted_scopes.map(String) : []
  const rows = [
    ["facebook","publishing","pages_manage_posts"],
    ["instagram","publishing","instagram_content_publish"],
    ["instagram","messages","instagram_manage_messages"],
    ["instagram","comments","instagram_manage_comments"],
    ["instagram","insights","instagram_manage_insights"],
    ["instagram","basic","instagram_basic"],
  ] as const
  const now = nowIso()
  for (const [channel, capability, scope] of rows) {
    const supported = scopes.includes(scope)
    await db.from("social_command_channel_capabilities").upsert({
      connection_id: connection.id, channel, capability, supported, source: "granted_scope",
      reason: supported ? null : `${scope} permission not granted`, checked_at: now,
    }, { onConflict: "connection_id,channel,capability" })
  }
  const { data, error } = await db.from("social_command_channel_capabilities").select("*").eq("connection_id", connection.id).order("channel").order("capability")
  if (error) throw error
  return (data || []).map((row: any) => ({ ...row, state: row.supported ? "available" : /permission/i.test(String(row.reason || "")) ? "permission_missing" : "unavailable" }))
}

export async function reconcilePublishedProviderState(limit = 100) {
  const db = await socialDb()
  const connection = await getActiveConnectionWithSecrets()
  if (!connection) return { checked: 0, confirmed: 0, missing: 0, failed: 0, state: "unavailable" }
  const { pageToken } = getConnectionSecrets(connection)
  if (!pageToken) return { checked: 0, confirmed: 0, missing: 0, failed: 0, state: "unavailable" }
  const { data, error } = await db.from("social_command_provider_results").select("id,publication_id,channel,provider_reference,created_at").eq("result_type", "published").not("provider_reference", "is", null).order("created_at", { ascending: false }).limit(Math.max(1, Math.min(limit, 200)))
  if (error) throw error
  let confirmed = 0, missing = 0, failed = 0
  const details: Array<Record<string, unknown>> = []
  for (const row of data || []) {
    const ref = cleanString(row.provider_reference, 500)
    if (!ref) continue
    try {
      const payload = await graphGet(encodeURIComponent(ref), { fields: "id" }, pageToken)
      confirmed++
      details.push({ publicationId: row.publication_id, providerReference: ref, state: "confirmed", provider: payload })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (/unsupported|get request|does not exist|cannot be loaded/i.test(message)) missing++
      else failed++
      details.push({ publicationId: row.publication_id, providerReference: ref, state: /unsupported|get request|does not exist|cannot be loaded/i.test(message) ? "provider_missing" : "failed", error: message })
    }
  }
  const runId = crypto.randomUUID()
  await db.from("social_command_reconciliation_runs").insert({
    id: runId, provider: "meta", status: failed ? "completed_with_errors" : "completed", checked_count: (data || []).length,
    confirmed_count: confirmed, missing_count: missing, failed_count: failed, details, started_at: nowIso(), completed_at: nowIso(), created_at: nowIso(),
  })
  return { runId, checked: (data || []).length, confirmed, missing, failed, state: failed ? "degraded" : "live", details: details.slice(0, 50) }
}
