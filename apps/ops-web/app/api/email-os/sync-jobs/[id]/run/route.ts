import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const db = createEmailOSCoreDb()

    const { data: job, error: jobError } = await db
      .from("email_os_core_sync_jobs")
      .select("*")
      .eq("id", id)
      .single()

    if (jobError) throw jobError
    if (!job) throw new Error("Sync job not found")

    await db
      .from("email_os_core_sync_jobs")
      .update({ status: "running", started_at: nowIso(), updated_at: nowIso() })
      .eq("id", id)

    const syncResult = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/email-os/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mailboxId: job.mailbox_id, limit: 20 })
    })
    let count = 0
    let errorMessage: string | null = null
    let errorCode: string | null = null

    if (syncResult) {
      const json = await syncResult.json()
      count = Number(json?.data?.count || 0)
      if (!json?.ok) {
        errorCode = json?.code || json?.data?.code || null
        errorMessage = errorCode ? `Inbound sync failed: ${errorCode}` : json?.error || "Sync failed"
      }
    } else {
      errorMessage = "Sync endpoint unreachable"
    }

    const finalStatus = errorMessage ? "failed" : "completed"

    await db
      .from("email_os_core_sync_jobs")
      .update({
        status: finalStatus,
        completed_at: nowIso(),
        error: errorMessage,
        updated_at: nowIso()
      })
      .eq("id", id)

    await db.from("email_os_core_sync_history").insert({
      id: makeEmailOSId(),
      mailbox_id: job.mailbox_id,
      sync_job_id: id,
      status: finalStatus,
      messages_synced: count,
      error: errorMessage,
      metadata: {},
      created_at: nowIso()
    })

    return NextResponse.json({ ok: !errorMessage, data: { status: finalStatus, messagesSynced: count, error: errorMessage, code: errorCode } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Sync job run failed" }, { status: 500 })
  }
}
