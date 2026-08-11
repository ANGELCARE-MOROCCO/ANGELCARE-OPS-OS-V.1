import { signCompact } from "@/lib/social-command/crypto"
import { cleanString } from "@/lib/social-command/db"
import type { SocialMediaAsset } from "@/lib/social-command/types"

function baseUrl() {
  return String(process.env.SOCIAL_COMMAND_MEDIA_GATEWAY_PUBLIC_URL || "").trim().replace(/\/+$/, "")
}

function adminToken() {
  return String(process.env.SOCIAL_COMMAND_MEDIA_GATEWAY_ADMIN_TOKEN || "").trim()
}

export function mediaGatewayConfigured() {
  return Boolean(baseUrl() && adminToken() && process.env.SOCIAL_COMMAND_MEDIA_SIGNING_SECRET)
}

export function createUploadSession(input: {
  assetId: string
  filename: string
  mimeType: string
  maxBytes: number
  actorUserId: string
}) {
  const root = baseUrl()
  if (!root) throw new Error("SOCIAL_COMMAND_MEDIA_GATEWAY_PUBLIC_URL is not configured")
  const expiresAt = Date.now() + 30 * 60 * 1000
  const token = signCompact({
    kind: "upload",
    assetId: input.assetId,
    filename: cleanString(input.filename, 180),
    mimeType: cleanString(input.mimeType, 120),
    maxBytes: input.maxBytes,
    actorUserId: input.actorUserId,
    exp: expiresAt,
  })
  return {
    uploadUrl: `${root}/upload/${encodeURIComponent(input.assetId)}?token=${encodeURIComponent(token)}`,
    expiresAt: new Date(expiresAt).toISOString(),
  }
}

export function createDeliveryUrl(asset: Pick<SocialMediaAsset, "id" | "safe_filename">, ttlMs = 48 * 60 * 60 * 1000) {
  const root = baseUrl()
  if (!root) throw new Error("SOCIAL_COMMAND_MEDIA_GATEWAY_PUBLIC_URL is not configured")
  const expiresAt = Date.now() + ttlMs
  const token = signCompact({ kind: "delivery", assetId: asset.id, exp: expiresAt })
  return `${root}/media/${encodeURIComponent(asset.id)}/${encodeURIComponent(asset.safe_filename)}?token=${encodeURIComponent(token)}`
}

async function gateway(pathname: string, init?: RequestInit) {
  const root = baseUrl()
  const token = adminToken()
  if (!root || !token) throw new Error("Social Command media gateway is not configured")
  const headers = new Headers(init?.headers || {})
  headers.set("x-social-media-admin-token", token)
  const response = await fetch(`${root}${pathname}`, { ...init, headers, cache: "no-store" })
  const text = await response.text().catch(() => "")
  let payload: any = null
  try { payload = text ? JSON.parse(text) : null } catch {}
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `Media gateway HTTP ${response.status}`)
  return payload?.data ?? payload
}

export async function fetchGatewayAsset(assetId: string) {
  return gateway(`/admin/assets/${encodeURIComponent(assetId)}`)
}

export async function deleteGatewayAsset(assetId: string) {
  return gateway(`/admin/assets/${encodeURIComponent(assetId)}`, { method: "DELETE" })
}

export async function fetchGatewayHealth() {
  const root = baseUrl()
  if (!root) return { configured: false, healthy: false, publicUrl: null, error: "Media gateway URL not configured" }
  try {
    const response = await fetch(`${root}/health`, { cache: "no-store" })
    const payload = await response.json().catch(() => ({}))
    return {
      configured: true,
      healthy: response.ok && payload?.ok !== false && payload?.data?.healthy !== false,
      degraded: payload?.data?.healthy === false || Boolean(payload?.data?.warnings?.length),
      publicUrl: root,
      rootLabel: payload?.data?.rootLabel || null,
      freeBytes: payload?.data?.freeBytes ?? null,
      totalBytes: payload?.data?.totalBytes ?? null,
      usedBytes: payload?.data?.usedBytes ?? null,
      freeRatio: payload?.data?.freeRatio ?? null,
      minFreeBytes: payload?.data?.minFreeBytes ?? null,
      warnings: Array.isArray(payload?.data?.warnings) ? payload.data.warnings.map(String) : [],
      temporaryFiles: payload?.data?.temporaryFiles ?? null,
      error: response.ok ? null : String(payload?.error || `HTTP ${response.status}`),
    }
  } catch (error) {
    return { configured: true, healthy: false, publicUrl: root, error: error instanceof Error ? error.message : String(error) }
  }
}
