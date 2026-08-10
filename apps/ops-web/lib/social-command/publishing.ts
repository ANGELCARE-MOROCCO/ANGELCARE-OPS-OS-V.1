import crypto from "node:crypto"
import { nowIso, socialDb } from "@/lib/social-command/db"
import { getActiveConnectionWithSecrets } from "@/lib/social-command/repository"
import { publishFacebook, publishInstagram } from "@/lib/social-command/meta"
import type { SocialExecutionJob, SocialMediaAsset, SocialPublication } from "@/lib/social-command/types"

function addSeconds(seconds: number) {
  return new Date(Date.now() + Math.max(1, seconds) * 1000).toISOString()
}

async function loadExecutionBundle(jobId: string) {
  const db = await socialDb()
  const { data: job, error: jobError } = await db.from("social_command_execution_jobs").select("*").eq("id", jobId).maybeSingle()
  if (jobError) throw jobError
  if (!job) throw new Error("Execution job not found")
  const { data: publication, error: pubError } = await db.from("social_command_publications").select("*").eq("id", job.publication_id).maybeSingle()
  if (pubError) throw pubError
  if (!publication) throw new Error("Publication not found")
  const { data: links, error: linksError } = await db.from("social_command_publication_media").select("asset_id,sort_order").eq("publication_id", publication.id).order("sort_order", { ascending: true })
  if (linksError) throw linksError
  const assetIds = (links || []).map((link: any) => link.asset_id)
  let media: SocialMediaAsset[] = []
  if (assetIds.length) {
    const { data: assets, error: assetsError } = await db.from("social_command_media_assets").select("*").in("id", assetIds)
    if (assetsError) throw assetsError
    const map = new Map((assets || []).map((asset: any) => [asset.id, asset]))
    media = assetIds.map((id: string) => map.get(id)).filter(Boolean) as SocialMediaAsset[]
  }
  return { job: job as SocialExecutionJob, publication: publication as SocialPublication, media }
}

async function recordAttempt(input: {
  jobId: string
  attemptNo: number
  startedAt: string
  finishedAt: string
  status: string
  error?: string | null
  providerReference?: string | null
  providerState?: Record<string, unknown>
}) {
  const db = await socialDb()
  await db.from("social_command_execution_attempts").insert({
    job_id: input.jobId,
    attempt_no: input.attemptNo,
    started_at: input.startedAt,
    completed_at: input.finishedAt,
    latency_ms: Math.max(0, new Date(input.finishedAt).getTime() - new Date(input.startedAt).getTime()),
    status: input.status,
    error_message: input.error || null,
    provider_reference: input.providerReference || null,
    provider_state: input.providerState || {},
  })
}

async function reconcilePublication(publicationId: string) {
  const db = await socialDb()
  const { data: jobs, error } = await db.from("social_command_execution_jobs").select("status,provider_reference,updated_at").eq("publication_id", publicationId)
  if (error) throw error
  const states = (jobs || []).map((job: any) => String(job.status)) as string[]
  let status = "queued"
  let publishedAt: string | null = null
  if (states.length && states.every((state: string) => state === "published")) {
    status = "published"
    publishedAt = nowIso()
  } else if (states.some((state: string) => state === "failed")) {
    status = "failed"
  } else if (states.some((state: string) => state === "publishing" || state === "confirming")) {
    status = "publishing"
  } else if (states.some((state: string) => state === "retrying")) {
    status = "queued"
  }
  await db.from("social_command_publications").update({ status, published_at: publishedAt, updated_at: nowIso() }).eq("id", publicationId)
  return status
}

async function claimExecutionJob(jobId: string) {
  const db = await socialDb()
  const { data: current, error } = await db.from("social_command_execution_jobs")
    .select("id,status,locked_at,attempt_count,max_attempts").eq("id", jobId).maybeSingle()
  if (error) throw error
  if (!current) throw new Error("Execution job not found")
  if (["published", "cancelled", "failed"].includes(String(current.status))) return { claimed: false as const, status: String(current.status), job: current }

  const lockCutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  if (["preparing", "publishing"].includes(String(current.status)) && current.locked_at && String(current.locked_at) > lockCutoff) {
    return { claimed: false as const, status: "locked", job: current }
  }
  const attemptNo = Number(current.attempt_count || 0) + 1
  let query = db.from("social_command_execution_jobs").update({
    status: "preparing",
    locked_at: nowIso(),
    attempt_count: attemptNo,
    updated_at: nowIso(),
  }).eq("id", jobId)
  if (["preparing", "publishing"].includes(String(current.status))) {
    query = query.in("status", ["preparing", "publishing"]).lt("locked_at", lockCutoff)
  } else {
    query = query.in("status", ["queued", "retrying", "confirming"])
  }
  const { data: claimed, error: claimError } = await query.select("*").maybeSingle()
  if (claimError) throw claimError
  if (!claimed) return { claimed: false as const, status: "contended", job: current }
  return { claimed: true as const, status: "preparing", job: claimed, attemptNo }
}

async function recoverStaleExecutionLocks() {
  const db = await socialDb()
  const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  const now = nowIso()
  const { data, error } = await db.from("social_command_execution_jobs").update({
    status: "retrying", locked_at: null, next_attempt_at: now,
    last_error: "Recovered stale Social Command worker lock", updated_at: now,
  }).in("status", ["preparing", "publishing"]).lt("locked_at", cutoff).select("id")
  if (error) throw error
  return (data || []).length
}

export async function processExecutionJob(jobId: string) {
  const db = await socialDb()
  const claim = await claimExecutionJob(jobId)
  if (!claim.claimed) return { skipped: true, status: claim.status }
  const startedAt = nowIso()
  const bundle = await loadExecutionBundle(jobId)
  const attemptNo = claim.attemptNo

  try {
    const connection = await getActiveConnectionWithSecrets()
    if (!connection) throw new Error("No active Meta connection")
    if (bundle.media.some((asset) => asset.status !== "ready")) throw new Error("Publication contains media that is not ready")

    await db.from("social_command_execution_jobs").update({ status: "publishing", updated_at: nowIso() }).eq("id", jobId).eq("status", "preparing")
    const liveJob = { ...bundle.job, status: "publishing" as const, attempt_count: attemptNo }
    const result = bundle.job.channel === "instagram"
      ? await publishInstagram({ connection, publication: bundle.publication, media: bundle.media, job: liveJob })
      : await publishFacebook({ connection, publication: bundle.publication, media: bundle.media, job: liveJob })

    const finishedAt = nowIso()
    if (result.status === "published") {
      await db.from("social_command_execution_jobs").update({
        status: "published",
        locked_at: null,
        last_error: null,
        provider_reference: result.providerReference || null,
        provider_state: result.providerState || {},
        next_attempt_at: null,
        updated_at: finishedAt,
      }).eq("id", jobId)
      await recordAttempt({ jobId, attemptNo, startedAt, finishedAt, status: "published", providerReference: result.providerReference, providerState: result.providerState })
      await db.from("social_command_provider_results").insert({
        job_id: jobId, publication_id: bundle.publication.id,
        channel: bundle.job.channel, result_type: "published", provider_reference: result.providerReference || null,
        public_url: result.publicUrl || null, payload: result.providerState || {}, created_at: finishedAt,
      })
      const publicationStatus = await reconcilePublication(bundle.publication.id)
      return { status: "published", publicationStatus, providerReference: result.providerReference || null }
    }

    if (result.status === "confirming" && result.retryable) {
      const nextAttempt = addSeconds(result.retryAfterSeconds || 15)
      await db.from("social_command_execution_jobs").update({
        status: "confirming",
        locked_at: null,
        last_error: null,
        provider_reference: result.providerReference || null,
        provider_state: result.providerState || {},
        next_attempt_at: nextAttempt,
        updated_at: finishedAt,
      }).eq("id", jobId)
      await recordAttempt({ jobId, attemptNo, startedAt, finishedAt, status: "confirming", providerReference: result.providerReference, providerState: result.providerState })
      await reconcilePublication(bundle.publication.id)
      return { status: "confirming", nextAttemptAt: nextAttempt }
    }

    throw new Error(result.error || "Provider execution failed")
  } catch (error) {
    const finishedAt = nowIso()
    const message = error instanceof Error ? error.message : String(error)
    const maxAttempts = Number(bundle.job.max_attempts || 5)
    const retryable = attemptNo < maxAttempts && !/capability|unsupported|not enabled/i.test(message)
    const retrySeconds = Math.min(15 * Math.pow(2, Math.max(0, attemptNo - 1)), 15 * 60)
    await db.from("social_command_execution_jobs").update({
      status: retryable ? "retrying" : "failed",
      locked_at: null,
      last_error: message,
      next_attempt_at: retryable ? addSeconds(retrySeconds) : null,
      updated_at: finishedAt,
    }).eq("id", jobId)
    await recordAttempt({ jobId, attemptNo, startedAt, finishedAt, status: retryable ? "retrying" : "failed", error: message, providerReference: bundle.job.provider_reference, providerState: bundle.job.provider_state })
    await db.from("social_command_provider_results").insert({
      job_id: jobId, publication_id: bundle.publication.id,
      channel: bundle.job.channel, result_type: retryable ? "retrying" : "failed", provider_reference: bundle.job.provider_reference || null,
      public_url: null, payload: { error: message }, created_at: finishedAt,
    })
    await reconcilePublication(bundle.publication.id)
    return { status: retryable ? "retrying" : "failed", error: message }
  }
}

export async function processDueJobs(limit = 8) {
  const db = await socialDb()
  await recoverStaleExecutionLocks()
  const now = nowIso()
  const { data, error } = await db.from("social_command_execution_jobs")
    .select("id,status,due_at,next_attempt_at")
    .in("status", ["queued", "retrying", "confirming"])
    .lte("due_at", now)
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${now}`)
    .order("due_at", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 20)))
  if (error) throw error
  const results: Array<{ id: string; result: unknown }> = []
  for (const row of data || []) results.push({ id: (row as any).id, result: await processExecutionJob((row as any).id) })
  return results
}
