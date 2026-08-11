import crypto from "node:crypto"
import { cleanString, jsonObject, nowIso, socialDb } from "@/lib/social-command/db"
import type { SocialCommandActor } from "@/lib/social-command/auth"

export type SocialCommandSavedView = {
  id: string
  actor_user_id: string
  name: string
  universe: string
  view_key: string
  query: Record<string, unknown>
  is_shared: boolean
  created_at: string
  updated_at: string
}

function bool(value: unknown) { return value === true || /^(1|true|yes|on)$/i.test(String(value || "")) }

export async function listOperatorExperience(actor: SocialCommandActor) {
  const db = await socialDb()
  const [{ data: own, error: ownError }, { data: shared, error: sharedError }, { data: pref, error: prefError }] = await Promise.all([
    db.from("social_command_saved_views").select("*").eq("actor_user_id", actor.id).order("updated_at", { ascending: false }).limit(100),
    db.from("social_command_saved_views").select("*").eq("is_shared", true).neq("actor_user_id", actor.id).order("updated_at", { ascending: false }).limit(100),
    db.from("social_command_operator_preferences").select("preferences,updated_at").eq("actor_user_id", actor.id).maybeSingle(),
  ])
  if (ownError) throw ownError
  if (sharedError) throw sharedError
  if (prefError) throw prefError
  const rows = [...(own || []), ...(shared || [])]
  const seen = new Set<string>()
  const views = rows.filter((row: any) => !seen.has(String(row.id)) && seen.add(String(row.id))) as SocialCommandSavedView[]
  return { actor: { id: actor.id, name: actor.name, email: actor.email, role: actor.role }, views, preferences: jsonObject(pref?.preferences), preferencesUpdatedAt: pref?.updated_at || null }
}

export async function createSavedView(input: Record<string, unknown>, actor: SocialCommandActor) {
  const db = await socialDb()
  const name = cleanString(input.name, 120)
  const universe = cleanString(input.universe, 40)
  const viewKey = cleanString(input.viewKey ?? input.view_key, 80)
  if (!name) throw new Error("SAVED_VIEW_NAME_REQUIRED")
  if (!universe || !["command","studio","publish","engage","automate","control"].includes(universe)) throw new Error("SAVED_VIEW_UNIVERSE_INVALID")
  const row = {
    id: crypto.randomUUID(), actor_user_id: actor.id, name, universe, view_key: viewKey || "",
    query: jsonObject(input.query), is_shared: bool(input.isShared ?? input.is_shared), created_at: nowIso(), updated_at: nowIso(),
  }
  const { data, error } = await db.from("social_command_saved_views").insert(row).select("*").single()
  if (error) throw error
  return data as SocialCommandSavedView
}

export async function updateSavedView(id: string, input: Record<string, unknown>, actor: SocialCommandActor) {
  const db = await socialDb()
  const { data: current, error: readError } = await db.from("social_command_saved_views").select("*").eq("id", id).maybeSingle()
  if (readError) throw readError
  if (!current) throw new Error("SAVED_VIEW_NOT_FOUND")
  if (String(current.actor_user_id) !== actor.id) throw new Error("SAVED_VIEW_NOT_OWNED")
  const patch: Record<string, unknown> = { updated_at: nowIso() }
  if (input.name !== undefined) patch.name = cleanString(input.name, 120)
  if (input.universe !== undefined) patch.universe = cleanString(input.universe, 40)
  if (input.viewKey !== undefined || input.view_key !== undefined) patch.view_key = cleanString(input.viewKey ?? input.view_key, 80)
  if (input.query !== undefined) patch.query = jsonObject(input.query)
  if (input.isShared !== undefined || input.is_shared !== undefined) patch.is_shared = bool(input.isShared ?? input.is_shared)
  const { data, error } = await db.from("social_command_saved_views").update(patch).eq("id", id).select("*").single()
  if (error) throw error
  return data as SocialCommandSavedView
}

export async function deleteSavedView(id: string, actor: SocialCommandActor) {
  const db = await socialDb()
  const { data: current, error: readError } = await db.from("social_command_saved_views").select("actor_user_id").eq("id", id).maybeSingle()
  if (readError) throw readError
  if (!current) return { deleted: false }
  if (String(current.actor_user_id) !== actor.id) throw new Error("SAVED_VIEW_NOT_OWNED")
  const { error } = await db.from("social_command_saved_views").delete().eq("id", id)
  if (error) throw error
  return { deleted: true }
}

export async function saveOperatorPreferences(input: Record<string, unknown>, actor: SocialCommandActor) {
  const db = await socialDb()
  const preferences = jsonObject(input.preferences ?? input)
  const row = { actor_user_id: actor.id, preferences, updated_at: nowIso() }
  const { data, error } = await db.from("social_command_operator_preferences").upsert(row, { onConflict: "actor_user_id" }).select("preferences,updated_at").single()
  if (error) throw error
  return data
}

export async function getExecutionJobDossier(jobId: string, actor: SocialCommandActor) {
  const db = await socialDb()
  const { data: job, error: jobError } = await db.from("social_command_execution_jobs").select("*").eq("id", jobId).maybeSingle()
  if (jobError) throw jobError
  if (!job) throw new Error("EXECUTION_JOB_NOT_FOUND")
  const [{ data: publication, error: pubError }, { data: attempts, error: attemptError }, { data: results, error: resultError }] = await Promise.all([
    db.from("social_command_publications").select("*").eq("id", job.publication_id).maybeSingle(),
    db.from("social_command_execution_attempts").select("*").eq("job_id", jobId).order("attempt_no", { ascending: true }).limit(100),
    db.from("social_command_provider_results").select("*").eq("job_id", jobId).order("created_at", { ascending: true }).limit(100),
  ])
  if (pubError) throw pubError
  if (attemptError) throw attemptError
  if (resultError) throw resultError
  const { data: links, error: linksError } = await db.from("social_command_publication_media").select("asset_id,sort_order").eq("publication_id", job.publication_id).order("sort_order", { ascending: true })
  if (linksError) throw linksError
  const ids = (links || []).map((row: any) => row.asset_id)
  let media: any[] = []
  if (ids.length) {
    const { data, error } = await db.from("social_command_media_assets").select("id,title,original_filename,mime_type,size_bytes,width,height,duration_seconds,status,lifecycle_status,preview_url:storage_key,metadata").in("id", ids)
    if (error) throw error
    const map = new Map((data || []).map((row: any) => [row.id, row]))
    media = ids.map((id: string) => map.get(id)).filter(Boolean)
  }
  return { job, publication, attempts: attempts || [], providerResults: results || [], media, actorId: actor.id }
}
