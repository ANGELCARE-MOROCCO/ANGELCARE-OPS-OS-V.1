import { decryptSecret, encryptSecret } from "@/lib/social-command/crypto"
import { cleanString, jsonObject, nowIso, socialDb, stringArray } from "@/lib/social-command/db"
import { createDeliveryUrl } from "@/lib/social-command/storage"
import type { SocialConnection, SocialExecutionJob, SocialMediaAsset, SocialPublication } from "@/lib/social-command/types"

const DEFAULT_GRAPH_VERSION = "v26.0"

function connectionHealth(value: unknown): SocialConnection["connection_health"] {
  const normalized = cleanString(value, 60)
  if (normalized === "healthy" || normalized === "warning" || normalized === "unhealthy" || normalized === "disconnected" || normalized === "unknown") return normalized
  return "unknown"
}

function normalizeSocialConnection(value: unknown): SocialConnection {
  const row = jsonObject(value)
  const id = cleanString(row.id, 200)
  if (!id) throw new Error("Meta connection was saved but the database did not return a valid connection id")
  return {
    id,
    status: cleanString(row.status, 60) || "connected",
    facebook_page_id: cleanString(row.facebook_page_id, 200) || null,
    facebook_page_name: cleanString(row.facebook_page_name, 500) || null,
    instagram_business_id: cleanString(row.instagram_business_id, 200) || null,
    instagram_username: cleanString(row.instagram_username, 500) || null,
    granted_scopes: stringArray(row.granted_scopes),
    token_expires_at: cleanString(row.token_expires_at, 100) || null,
    last_verified_at: cleanString(row.last_verified_at, 100) || null,
    connection_health: connectionHealth(row.connection_health),
    meta_json: jsonObject(row.meta_json),
    connected_by: cleanString(row.connected_by, 200) || null,
    connected_at: cleanString(row.connected_at, 100) || nowIso(),
    disconnected_at: cleanString(row.disconnected_at, 100) || null,
  }
}


export function metaConfig() {
  const appId = cleanString(process.env.META_APP_ID || process.env.FACEBOOK_APP_ID, 200)
  const appSecret = cleanString(process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET, 500)
  const configurationId = cleanString(process.env.META_LOGIN_CONFIGURATION_ID || process.env.FACEBOOK_LOGIN_CONFIGURATION_ID, 200)
  const publicBaseUrl = cleanString(process.env.SOCIAL_COMMAND_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL, 1000).replace(/\/+$/, "")
  const graphVersion = cleanString(process.env.META_GRAPH_VERSION || DEFAULT_GRAPH_VERSION, 30) || DEFAULT_GRAPH_VERSION
  const callbackUrl = `${publicBaseUrl}/api/social-command/meta/callback`
  return { appId, appSecret, configurationId, publicBaseUrl, graphVersion, callbackUrl }
}

export function assertMetaConfig() {
  const cfg = metaConfig()
  const missing = [
    !cfg.appId && "META_APP_ID",
    !cfg.appSecret && "META_APP_SECRET",
    !cfg.configurationId && "META_LOGIN_CONFIGURATION_ID",
    !cfg.publicBaseUrl && "SOCIAL_COMMAND_PUBLIC_BASE_URL",
  ].filter(Boolean)
  if (missing.length) throw new Error(`Missing Meta configuration: ${missing.join(", ")}`)
  return cfg
}

export function buildMetaLoginUrl(state: string) {
  const cfg = assertMetaConfig()
  const url = new URL(`https://www.facebook.com/${cfg.graphVersion}/dialog/oauth`)
  url.searchParams.set("client_id", cfg.appId)
  url.searchParams.set("redirect_uri", cfg.callbackUrl)
  url.searchParams.set("state", state)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("config_id", cfg.configurationId)
  return url.toString()
}

async function parseJson(response: Response) {
  const text = await response.text().catch(() => "")
  let payload: any = null
  try { payload = text ? JSON.parse(text) : null } catch {}
  if (!response.ok || payload?.error) {
    const detail = payload?.error?.message || payload?.error_description || payload?.error || `Meta HTTP ${response.status}`
    throw new Error(String(detail))
  }
  return payload
}

export async function exchangeMetaCode(code: string) {
  const cfg = assertMetaConfig()
  const url = new URL(`https://graph.facebook.com/${cfg.graphVersion}/oauth/access_token`)
  url.searchParams.set("client_id", cfg.appId)
  url.searchParams.set("client_secret", cfg.appSecret)
  url.searchParams.set("redirect_uri", cfg.callbackUrl)
  url.searchParams.set("code", code)
  const payload = await parseJson(await fetch(url, { cache: "no-store" }))
  let accessToken = cleanString(payload.access_token, 10000)
  let expiresIn = Number(payload.expires_in || 0)

  // Upgrade to a long-lived user token when Meta allows it for this app/token pair.
  if (accessToken) {
    try {
      const longUrl = new URL(`https://graph.facebook.com/${cfg.graphVersion}/oauth/access_token`)
      longUrl.searchParams.set("grant_type", "fb_exchange_token")
      longUrl.searchParams.set("client_id", cfg.appId)
      longUrl.searchParams.set("client_secret", cfg.appSecret)
      longUrl.searchParams.set("fb_exchange_token", accessToken)
      const longPayload = await parseJson(await fetch(longUrl, { cache: "no-store" }))
      if (longPayload?.access_token) {
        accessToken = cleanString(longPayload.access_token, 10000)
        expiresIn = Number(longPayload.expires_in || expiresIn || 0)
      }
    } catch {
      // Short-lived token remains usable for the immediate discovery/finalization flow.
    }
  }
  if (!accessToken) throw new Error("Meta did not return a user access token")
  return { accessToken, expiresIn }
}

export type MetaPageCandidate = {
  id: string
  name: string
  access_token: string
  tasks: string[]
  instagram_business_account?: { id?: string } | null
  instagram?: { id: string; username?: string; name?: string; profile_picture_url?: string } | null
}

export async function discoverMetaPages(userToken: string): Promise<MetaPageCandidate[]> {
  const cfg = assertMetaConfig()
  const url = new URL(`https://graph.facebook.com/${cfg.graphVersion}/me/accounts`)
  url.searchParams.set("fields", "id,name,access_token,tasks,instagram_business_account")
  url.searchParams.set("limit", "100")
  url.searchParams.set("access_token", userToken)
  const payload = await parseJson(await fetch(url, { cache: "no-store" }))
  const pages = Array.isArray(payload?.data) ? payload.data : []

  const enriched: MetaPageCandidate[] = []
  for (const raw of pages) {
    const page: MetaPageCandidate = {
      id: cleanString(raw?.id, 200),
      name: cleanString(raw?.name, 500),
      access_token: cleanString(raw?.access_token, 10000),
      tasks: Array.isArray(raw?.tasks) ? raw.tasks.map(String) : [],
      instagram_business_account: raw?.instagram_business_account || null,
      instagram: null,
    }
    const igId = cleanString(raw?.instagram_business_account?.id, 200)
    if (igId && page.access_token) {
      try {
        const igUrl = new URL(`https://graph.facebook.com/${cfg.graphVersion}/${encodeURIComponent(igId)}`)
        igUrl.searchParams.set("fields", "id,username,name,profile_picture_url")
        igUrl.searchParams.set("access_token", page.access_token)
        page.instagram = await parseJson(await fetch(igUrl, { cache: "no-store" }))
      } catch {
        page.instagram = { id: igId }
      }
    }
    if (page.id && page.access_token) enriched.push(page)
  }
  return enriched
}

export async function saveMetaConnection(input: {
  actorUserId: string
  userToken: string
  userTokenExpiresIn?: number
  page: MetaPageCandidate
  grantedScopes?: string[]
}) {
  const db = await socialDb()
  const now = nowIso()
  await db.from("social_command_connections").update({ status: "disconnected", disconnected_at: now, connection_health: "disconnected", updated_at: now }).eq("status", "connected")
  const tokenExpiresAt = input.userTokenExpiresIn && input.userTokenExpiresIn > 0
    ? new Date(Date.now() + input.userTokenExpiresIn * 1000).toISOString()
    : null
  const igId = cleanString(input.page.instagram?.id || input.page.instagram_business_account?.id, 200) || null
  const row = {
    status: "connected",
    facebook_page_id: input.page.id,
    facebook_page_name: input.page.name,
    instagram_business_id: igId,
    instagram_username: cleanString(input.page.instagram?.username, 500) || null,
    granted_scopes: input.grantedScopes || [],
    encrypted_user_token: encryptSecret(input.userToken),
    encrypted_page_token: encryptSecret(input.page.access_token),
    token_expires_at: tokenExpiresAt,
    last_verified_at: now,
    last_refresh_at: now,
    connection_health: "healthy",
    meta_json: {
      tasks: input.page.tasks,
      instagramName: input.page.instagram?.name || null,
      instagramProfilePictureUrl: input.page.instagram?.profile_picture_url || null,
    },
    connected_by: input.actorUserId,
    connected_at: now,
    disconnected_at: null,
    created_at: now,
    updated_at: now,
  }
  const safeFields = [
    "id","status","facebook_page_id","facebook_page_name","instagram_business_id","instagram_username",
    "granted_scopes","token_expires_at","last_verified_at","last_refresh_at","connection_health","meta_json",
    "connected_by","connected_at","disconnected_at","created_at","updated_at",
  ].join(",")
  const { data, error } = await db.from("social_command_connections").insert(row).select(safeFields).single()
  if (error) throw error
  return normalizeSocialConnection(data)
}

export async function getMetaGrantedScopes(userToken: string) {
  const cfg = assertMetaConfig()
  const url = new URL(`https://graph.facebook.com/${cfg.graphVersion}/me/permissions`)
  url.searchParams.set("access_token", userToken)
  const payload = await parseJson(await fetch(url, { cache: "no-store" }))
  return (Array.isArray(payload?.data) ? payload.data : [])
    .filter((row: any) => row?.status === "granted")
    .map((row: any) => String(row.permission))
}

export function getConnectionSecrets(connection: any) {
  return {
    userToken: decryptSecret(connection?.encrypted_user_token),
    pageToken: decryptSecret(connection?.encrypted_page_token),
  }
}

export async function verifyMetaConnection(connection: any) {
  const cfg = assertMetaConfig()
  const { pageToken } = getConnectionSecrets(connection)
  if (!pageToken || !connection?.facebook_page_id) throw new Error("Page token is unavailable")
  const fields = connection.instagram_business_id
    ? "id,name,instagram_business_account"
    : "id,name"
  const url = new URL(`https://graph.facebook.com/${cfg.graphVersion}/${encodeURIComponent(connection.facebook_page_id)}`)
  url.searchParams.set("fields", fields)
  url.searchParams.set("access_token", pageToken)
  const page = await parseJson(await fetch(url, { cache: "no-store" }))
  let instagram: any = null
  if (connection.instagram_business_id) {
    const igUrl = new URL(`https://graph.facebook.com/${cfg.graphVersion}/${encodeURIComponent(connection.instagram_business_id)}`)
    igUrl.searchParams.set("fields", "id,username,name,profile_picture_url")
    igUrl.searchParams.set("access_token", pageToken)
    instagram = await parseJson(await fetch(igUrl, { cache: "no-store" }))
  }
  return { page, instagram }
}

function captionFor(publication: SocialPublication, channel: "facebook" | "instagram") {
  const variants = publication.platform_variants || {}
  const variant = variants[channel] as any
  const caption = cleanString(variant?.caption ?? publication.caption, 20000)
  const hashtags = Array.isArray(variant?.hashtags) ? variant.hashtags : publication.hashtags
  const hashText = (hashtags || []).map((tag: string) => tag.startsWith("#") ? tag : `#${tag}`).join(" ")
  return [caption, hashText].filter(Boolean).join("\n\n")
}

function firstVideo(media: SocialMediaAsset[]) {
  return media.find((m) => /^video\//i.test(m.mime_type)) || null
}
function images(media: SocialMediaAsset[]) {
  return media.filter((m) => /^image\//i.test(m.mime_type))
}

async function graphPost(pathname: string, params: Record<string, string>, pageToken: string) {
  const cfg = assertMetaConfig()
  const url = new URL(`https://graph.facebook.com/${cfg.graphVersion}/${pathname.replace(/^\/+/, "")}`)
  const form = new URLSearchParams(params)
  form.set("access_token", pageToken)
  return parseJson(await fetch(url, { method: "POST", body: form, cache: "no-store" }))
}

async function graphGet(pathname: string, params: Record<string, string>, pageToken: string) {
  const cfg = assertMetaConfig()
  const url = new URL(`https://graph.facebook.com/${cfg.graphVersion}/${pathname.replace(/^\/+/, "")}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  url.searchParams.set("access_token", pageToken)
  return parseJson(await fetch(url, { cache: "no-store" }))
}

export type ProviderExecutionResult = {
  done: boolean
  retryable?: boolean
  status: "published" | "confirming" | "failed"
  providerReference?: string | null
  providerState?: Record<string, unknown>
  publicUrl?: string | null
  error?: string | null
  retryAfterSeconds?: number
}

export async function publishInstagram(input: {
  connection: SocialConnection
  publication: SocialPublication
  media: SocialMediaAsset[]
  job: SocialExecutionJob
}): Promise<ProviderExecutionResult> {
  if (!input.connection.instagram_business_id) return { done: true, status: "failed", error: "No linked Instagram Professional account" }
  const { pageToken } = getConnectionSecrets(input.connection)
  const igId = input.connection.instagram_business_id
  const caption = captionFor(input.publication, "instagram")
  const state = input.job.provider_state || {}
  const existingContainer = cleanString((state as any).containerId, 200)

  if (existingContainer) {
    const status = await graphGet(existingContainer, { fields: "status_code,status" }, pageToken)
    const code = cleanString(status?.status_code, 80).toUpperCase()
    if (code && !["FINISHED", "PUBLISHED"].includes(code)) {
      if (["ERROR", "EXPIRED"].includes(code)) return { done: true, status: "failed", error: cleanString(status?.status, 2000) || `Instagram container ${code}` }
      return { done: false, retryable: true, status: "confirming", providerReference: existingContainer, providerState: state, retryAfterSeconds: 15 }
    }
    const published = await graphPost(`${igId}/media_publish`, { creation_id: existingContainer }, pageToken)
    return { done: true, status: "published", providerReference: cleanString(published?.id, 200) || existingContainer, providerState: { ...state, mediaId: published?.id || null } }
  }

  if (input.publication.format === "carousel" || (input.publication.format === "post" && input.media.length > 1)) {
    if (input.media.length < 2) return { done: true, status: "failed", error: "Instagram carousel requires at least 2 media assets" }
    const childIds: string[] = []
    for (const asset of input.media.slice(0, 10)) {
      const url = createDeliveryUrl(asset)
      const params: Record<string, string> = { is_carousel_item: "true" }
      if (/^video\//i.test(asset.mime_type)) {
        params.media_type = "VIDEO"
        params.video_url = url
      } else {
        params.image_url = url
      }
      const child = await graphPost(`${igId}/media`, params, pageToken)
      if (!child?.id) throw new Error("Instagram did not return a carousel child container")
      childIds.push(String(child.id))
    }
    const parent = await graphPost(`${igId}/media`, { media_type: "CAROUSEL", children: childIds.join(","), caption }, pageToken)
    if (!parent?.id) throw new Error("Instagram did not return a carousel container")
    const published = await graphPost(`${igId}/media_publish`, { creation_id: String(parent.id) }, pageToken)
    return { done: true, status: "published", providerReference: cleanString(published?.id, 200), providerState: { containerId: parent.id, childIds } }
  }

  const asset = input.publication.format === "reel" ? firstVideo(input.media) : input.media[0]
  if (!asset) return { done: true, status: "failed", error: `No compatible media assigned for Instagram ${input.publication.format}` }
  const deliveryUrl = createDeliveryUrl(asset)
  const params: Record<string, string> = {}
  const isVideo = /^video\//i.test(asset.mime_type)
  if (input.publication.format === "reel") {
    params.media_type = "REELS"
    params.video_url = deliveryUrl
    params.caption = caption
    params.share_to_feed = "true"
  } else if (input.publication.format === "story") {
    params.media_type = "STORIES"
    if (isVideo) params.video_url = deliveryUrl
    else params.image_url = deliveryUrl
  } else {
    if (isVideo) {
      params.media_type = "REELS"
      params.video_url = deliveryUrl
      params.caption = caption
      params.share_to_feed = "true"
    } else {
      params.image_url = deliveryUrl
      params.caption = caption
    }
  }
  const container = await graphPost(`${igId}/media`, params, pageToken)
  if (!container?.id) throw new Error("Instagram did not return a media container")
  const containerId = String(container.id)

  if (isVideo || input.publication.format === "reel" || input.publication.format === "story") {
    return { done: false, retryable: true, status: "confirming", providerReference: containerId, providerState: { containerId }, retryAfterSeconds: 15 }
  }
  const published = await graphPost(`${igId}/media_publish`, { creation_id: containerId }, pageToken)
  return { done: true, status: "published", providerReference: cleanString(published?.id, 200) || containerId, providerState: { containerId, mediaId: published?.id || null } }
}

export async function publishFacebook(input: {
  connection: SocialConnection
  publication: SocialPublication
  media: SocialMediaAsset[]
  job: SocialExecutionJob
}): Promise<ProviderExecutionResult> {
  const { pageToken } = getConnectionSecrets(input.connection)
  const pageId = input.connection.facebook_page_id
  if (!pageId) return { done: true, status: "failed", error: "No Facebook Page connected" }
  const caption = captionFor(input.publication, "facebook")

  if (input.publication.format === "story") {
    return {
      done: true,
      status: "failed",
      error: "Facebook Page Story publishing is not enabled by the current verified Meta adapter. Instagram Story remains supported; this Facebook job is isolated and does not block Instagram.",
      providerState: { capability: "facebook_story", supported: false },
    }
  }

  if (input.publication.format === "reel") {
    const video = firstVideo(input.media)
    if (!video) return { done: true, status: "failed", error: "Facebook Reel requires a video asset" }
    const cfg = assertMetaConfig()
    const existingVideoId = cleanString((input.job.provider_state as any)?.videoId, 200)
    if (existingVideoId) {
      const status = await graphGet(existingVideoId, { fields: "status" }, pageToken)
      const videoStatus = cleanString(status?.status?.video_status, 80).toLowerCase()
      const publishingStatus = cleanString(status?.status?.publishing_phase?.status, 80).toLowerCase()
      const processingStatus = cleanString(status?.status?.processing_phase?.status, 80).toLowerCase()
      if (["ready", "published", "complete", "completed"].includes(videoStatus) || ["complete", "completed"].includes(publishingStatus)) {
        return { done: true, status: "published", providerReference: existingVideoId, providerState: { ...(input.job.provider_state || {}), status } }
      }
      if (["error", "failed"].includes(videoStatus) || ["error", "failed"].includes(processingStatus) || ["error", "failed"].includes(publishingStatus)) {
        return { done: true, status: "failed", error: "Facebook Reel processing failed", providerReference: existingVideoId, providerState: { ...(input.job.provider_state || {}), status } }
      }
      return { done: false, retryable: true, status: "confirming", providerReference: existingVideoId, providerState: { ...(input.job.provider_state || {}), status }, retryAfterSeconds: 20 }
    }
    const start = await graphPost(`${pageId}/video_reels`, { upload_phase: "start" }, pageToken)
    const videoId = cleanString(start?.video_id, 200)
    const uploadUrl = cleanString(start?.upload_url, 2000)
    if (!videoId || !uploadUrl) throw new Error("Facebook did not create a Reel upload session")
    const hosted = createDeliveryUrl(video)
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: `OAuth ${pageToken}`, file_url: hosted },
      cache: "no-store",
    })
    await parseJson(uploadResponse)
    const finish = new URL(`https://graph.facebook.com/${cfg.graphVersion}/${encodeURIComponent(pageId)}/video_reels`)
    const body = new URLSearchParams({
      access_token: pageToken,
      video_id: videoId,
      upload_phase: "finish",
      video_state: "PUBLISHED",
      description: caption,
      title: input.publication.title,
    })
    await parseJson(await fetch(finish, { method: "POST", body, cache: "no-store" }))
    return { done: false, retryable: true, status: "confirming", providerReference: videoId, providerState: { videoId, phase: "facebook_reel_processing" }, retryAfterSeconds: 20 }
  }

  const pictureAssets = images(input.media)
  if (!input.media.length) {
    const result = await graphPost(`${pageId}/feed`, { message: caption }, pageToken)
    return { done: true, status: "published", providerReference: cleanString(result?.id, 200) }
  }

  if (input.publication.format === "carousel" || pictureAssets.length > 1) {
    const photoIds: string[] = []
    for (const asset of pictureAssets.slice(0, 10)) {
      const result = await graphPost(`${pageId}/photos`, { url: createDeliveryUrl(asset), published: "false" }, pageToken)
      if (result?.id) photoIds.push(String(result.id))
    }
    if (!photoIds.length) return { done: true, status: "failed", error: "No compatible image assets for Facebook multi-image post" }
    const attached = photoIds.map((media_fbid) => ({ media_fbid }))
    const result = await graphPost(`${pageId}/feed`, { message: caption, attached_media: JSON.stringify(attached) }, pageToken)
    return { done: true, status: "published", providerReference: cleanString(result?.id, 200), providerState: { photoIds } }
  }

  const asset = input.media[0]
  if (/^image\//i.test(asset.mime_type)) {
    const result = await graphPost(`${pageId}/photos`, { url: createDeliveryUrl(asset), caption, published: "true" }, pageToken)
    return { done: true, status: "published", providerReference: cleanString(result?.post_id || result?.id, 200) }
  }

  // Non-reel video is intentionally routed through Reels for a reliable Page-video publishing path.
  if (/^video\//i.test(asset.mime_type)) {
    return publishFacebook({ ...input, publication: { ...input.publication, format: "reel" } })
  }
  return { done: true, status: "failed", error: "Unsupported Facebook media type" }
}
