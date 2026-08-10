import crypto from "node:crypto"
import { cleanString, jsonObject, nowIso, socialDb, stringArray } from "@/lib/social-command/db"

function aiControlUrl() {
  return cleanString(process.env.SOCIAL_COMMAND_AI_CONTROL_URL || process.env.AI_PROVIDER_CONTROL_INTERNAL_URL, 2000).replace(/\/+$/, "")
}

function aiControlSecret() {
  return cleanString(process.env.SOCIAL_COMMAND_AI_CONTROL_SECRET || process.env.AI_PROVIDER_CONTROL_INTERNAL_SECRET, 2000)
}

export function aiControlConfigured() { return Boolean(aiControlUrl()) }

async function record(input: {
  id: string
  actorUserId: string
  operation: string
  status: string
  provider?: string | null
  estimatedUnits?: number | null
  actualUnits?: number | null
  request?: Record<string, unknown>
  response?: Record<string, unknown>
  error?: string | null
  automationId?: string | null
}) {
  const db = await socialDb()
  const now = nowIso()
  await db.from("social_command_ai_operations").upsert({
    id: input.id, module: "social-command", actor_user_id: input.actorUserId, operation: input.operation,
    automation_id: input.automationId || null, status: input.status, provider: input.provider || null,
    estimated_units: input.estimatedUnits || null, actual_units: input.actualUnits || null,
    request_snapshot: input.request || {}, response_snapshot: input.response || {}, error_message: input.error || null,
    created_at: now, updated_at: now, completed_at: ["completed","failed"].includes(input.status) ? now : null,
  }, { onConflict: "id" })
}

export async function governedAiRequest(input: {
  actorUserId: string
  operation: string
  payload: Record<string, unknown>
  automationId?: string | null
  estimatedUnits?: number
}) {
  const url = aiControlUrl()
  if (!url) throw new Error("AngelCare AI Provider Control is not configured for Social Command")
  const id = crypto.randomUUID()
  await record({ id, actorUserId: input.actorUserId, operation: input.operation, status: "running", estimatedUnits: input.estimatedUnits || null, request: input.payload, automationId: input.automationId })
  try {
    const headers = new Headers({ "content-type": "application/json" })
    const secret = aiControlSecret()
    if (secret) headers.set("x-ai-provider-control-secret", secret)
    const response = await fetch(url, {
      method: "POST", headers, cache: "no-store",
      body: JSON.stringify({
        module: "social-command",
        operation: input.operation,
        actorUserId: input.actorUserId,
        automationId: input.automationId || null,
        estimatedUnits: input.estimatedUnits || null,
        payload: input.payload,
      }),
    })
    const text = await response.text().catch(() => "")
    let body: Record<string, unknown> = {}
    try { body = text ? JSON.parse(text) as Record<string, unknown> : {} } catch {}
    if (!response.ok || body.ok === false) throw new Error(cleanString(body.error || `AI Provider Control HTTP ${response.status}`, 3000))
    const data = jsonObject(body.data || body)
    await record({
      id, actorUserId: input.actorUserId, operation: input.operation, status: "completed",
      provider: cleanString(data.provider, 120) || null,
      estimatedUnits: input.estimatedUnits || null,
      actualUnits: Number(data.actualUnits || data.usageUnits || 0) || null,
      request: input.payload, response: data, automationId: input.automationId,
    })
    return data
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await record({ id, actorUserId: input.actorUserId, operation: input.operation, status: "failed", estimatedUnits: input.estimatedUnits || null, request: input.payload, error: message, automationId: input.automationId })
    throw error
  }
}

export async function adaptCrossChannelContent(payload: Record<string, unknown>, actorUserId: string, automationId?: string | null) {
  const caption = cleanString(payload.caption, 20000)
  const hashtags = stringArray(payload.hashtags)
  if (!caption && !hashtags.length) throw new Error("Master content is required")
  const result = await governedAiRequest({
    actorUserId,
    operation: "cross_channel_adaptation",
    automationId: automationId || null,
    estimatedUnits: Math.max(1, Math.ceil((caption.length + hashtags.join(" ").length) / 1000)),
    payload: {
      instruction: "Prepare editable Facebook, Instagram feed, Instagram Story and Reel copy variants. Preserve facts. Do not invent metrics, results, prices or operational claims.",
      master: { caption, hashtags },
      channels: ["facebook", "instagram"],
      formats: ["post", "story", "reel"],
      locale: cleanString(payload.locale, 20) || "fr-MA",
      campaignContext: jsonObject(payload.campaignContext),
    },
  })
  return { source: "ai-provider-control", editable: true, variants: jsonObject(result.variants || result.output || result) }
}

export async function suggestDmReply(payload: Record<string, unknown>, actorUserId: string) {
  const conversation = cleanString(payload.conversation, 16000)
  if (!conversation) throw new Error("Conversation context is required")
  const result = await governedAiRequest({
    actorUserId,
    operation: "dm_reply_draft",
    estimatedUnits: Math.max(1, Math.ceil(conversation.length / 1000)),
    payload: {
      instruction: "Draft a concise professional reply for an AngelCare human operator to review. Do not claim commitments, availability, pricing or facts not present in the supplied context.",
      conversation,
      context: jsonObject(payload.context),
      locale: cleanString(payload.locale, 20) || "fr-MA",
    },
  })
  return { source: "ai-provider-control", editable: true, draft: cleanString(result.text || result.draft || result.output, 20000) }
}

export async function aiUsageSummary() {
  const db = await socialDb()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const [{ data: rows, error }, { data: latest }] = await Promise.all([
    db.from("social_command_ai_operations").select("status,actual_units,created_at").gte("created_at", since).limit(5000),
    db.from("social_command_ai_operations").select("created_at,status").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ])
  if (error) throw error
  return {
    configured: aiControlConfigured(), operations24h: (rows || []).length,
    failed24h: (rows || []).filter((row: any) => row.status === "failed").length,
    actualUnits24h: (rows || []).reduce((sum: number, row: any) => sum + Number(row.actual_units || 0), 0),
    lastOperationAt: latest?.created_at || null,
  }
}
