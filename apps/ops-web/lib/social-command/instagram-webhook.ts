import { cleanString } from "@/lib/social-command/db"

const DEFAULT_GRAPH_VERSION = "v26.0"
const DEFAULT_FIELDS = [
  "comments",
  "live_comments",
  "messages",
  "messaging_postbacks",
  "messaging_seen",
  "mentions",
] as const

export type InstagramWebhookSubscriptionSnapshot = {
  configured: boolean
  source: "instagram_login"
  host: "graph.instagram.com"
  graphVersion: string
  accountId: string | null
  tokenConfigured: boolean
  desiredFields: string[]
  subscribedFields: string[]
  missingFields: string[]
  unexpectedFields: string[]
  appSubscriptions: Array<{ id: string; subscribedFields: string[] }>
  healthy: boolean
  inspectedAt: string
}

function desiredFieldsFromEnv() {
  const raw = cleanString(process.env.SOCIAL_COMMAND_META_WEBHOOK_FIELDS, 2000)
  const values = raw
    ? raw.split(",").map((value) => cleanString(value, 100)).filter(Boolean)
    : [...DEFAULT_FIELDS]
  return [...new Set(values)]
}

export function instagramWebhookConfig() {
  const accountId = cleanString(process.env.SOCIAL_COMMAND_INSTAGRAM_WEBHOOK_ACCOUNT_ID, 300)
  const accessToken = cleanString(process.env.SOCIAL_COMMAND_INSTAGRAM_WEBHOOK_ACCESS_TOKEN, 12000)
  const graphVersion = cleanString(process.env.META_GRAPH_VERSION || DEFAULT_GRAPH_VERSION, 30) || DEFAULT_GRAPH_VERSION
  return {
    accountId,
    accessToken,
    graphVersion,
    desiredFields: desiredFieldsFromEnv(),
  }
}

function safeMetaError(payload: unknown, status: number) {
  const value = payload && typeof payload === "object" ? payload as Record<string, any> : {}
  const error = value.error && typeof value.error === "object" ? value.error as Record<string, any> : {}
  const message = cleanString(error.message || value.error_description || value.error || `Instagram HTTP ${status}`, 1800)
  const code = cleanString(error.code, 80)
  const subcode = cleanString(error.error_subcode, 80)
  return [message, code && `code=${code}`, subcode && `subcode=${subcode}`].filter(Boolean).join(" · ")
}

async function instagramRequest(method: "GET" | "POST") {
  const cfg = instagramWebhookConfig()
  if (!cfg.accountId) throw new Error("SOCIAL_COMMAND_INSTAGRAM_WEBHOOK_ACCOUNT_ID is not configured")
  if (!cfg.accessToken) throw new Error("SOCIAL_COMMAND_INSTAGRAM_WEBHOOK_ACCESS_TOKEN is not configured")

  const url = new URL(`https://graph.instagram.com/${cfg.graphVersion}/${encodeURIComponent(cfg.accountId)}/subscribed_apps`)
  const init: RequestInit = {
    method,
    cache: "no-store",
    headers: {
      authorization: `Bearer ${cfg.accessToken}`,
      accept: "application/json",
    },
  }
  if (method === "POST") {
    // Meta's Instagram Login subscribed_apps contract accepts the desired fields
    // as a comma-separated subscribed_fields query parameter. The credential
    // remains in the Authorization header so it is not exposed in the URL.
    url.searchParams.set("subscribed_fields", cfg.desiredFields.join(","))
  }

  const response = await fetch(url, init)
  const text = await response.text().catch(() => "")
  let payload: any = null
  try { payload = text ? JSON.parse(text) : null } catch { payload = null }
  if (!response.ok || payload?.error) throw new Error(safeMetaError(payload, response.status))
  return payload
}

function normalizeSubscriptions(payload: any): Array<{ id: string; subscribedFields: string[] }> {
  const data: any[] = Array.isArray(payload?.data) ? payload.data : []
  return data.map((row: any) => {
    const subscribedFields: string[] = Array.isArray(row?.subscribed_fields)
      ? [...new Set<string>(row.subscribed_fields.map((value: unknown) => cleanString(value, 100)).filter((value: string) => Boolean(value)))]
      : []
    return { id: cleanString(row?.id, 300), subscribedFields }
  }).filter((row) => Boolean(row.id))
}

export async function inspectInstagramWebhookSubscriptions(): Promise<InstagramWebhookSubscriptionSnapshot> {
  const cfg = instagramWebhookConfig()
  const configured = Boolean(cfg.accountId && cfg.accessToken)
  if (!configured) {
    return {
      configured: false,
      source: "instagram_login",
      host: "graph.instagram.com",
      graphVersion: cfg.graphVersion,
      accountId: cfg.accountId || null,
      tokenConfigured: Boolean(cfg.accessToken),
      desiredFields: cfg.desiredFields,
      subscribedFields: [],
      missingFields: cfg.desiredFields,
      unexpectedFields: [],
      appSubscriptions: [],
      healthy: false,
      inspectedAt: new Date().toISOString(),
    }
  }

  const payload = await instagramRequest("GET")
  const appSubscriptions = normalizeSubscriptions(payload)
  const subscribedFields = [...new Set(appSubscriptions.flatMap((row: { subscribedFields: string[] }) => row.subscribedFields))]
  const missingFields = cfg.desiredFields.filter((field) => !subscribedFields.includes(field))
  const unexpectedFields = subscribedFields.filter((field) => !cfg.desiredFields.includes(field))
  return {
    configured: true,
    source: "instagram_login",
    host: "graph.instagram.com",
    graphVersion: cfg.graphVersion,
    accountId: cfg.accountId,
    tokenConfigured: true,
    desiredFields: cfg.desiredFields,
    subscribedFields,
    missingFields,
    unexpectedFields,
    appSubscriptions,
    healthy: missingFields.length === 0 && subscribedFields.length > 0,
    inspectedAt: new Date().toISOString(),
  }
}

export async function reconcileInstagramWebhookSubscriptions() {
  const cfg = instagramWebhookConfig()
  if (!cfg.accountId || !cfg.accessToken) {
    throw new Error("Dedicated Instagram Login webhook credentials are not configured")
  }
  const result = await instagramRequest("POST")
  if (result?.success !== true) throw new Error("Instagram did not confirm webhook subscription reconciliation")
  const snapshot = await inspectInstagramWebhookSubscriptions()
  return { success: true, snapshot }
}
