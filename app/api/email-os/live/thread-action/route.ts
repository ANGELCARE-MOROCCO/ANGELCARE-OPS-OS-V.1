import { finalFail, finalOk, finalJson } from "@/lib/email-os/final/final-response"
import { emailOSFinalDb, nowIso } from "@/lib/email-os/final/final-db"
import { writeFinalAudit } from "@/lib/email-os/final/final-audit"
import { createFinalQueueJob } from "@/lib/email-os/final/final-queue"

export async function POST(request: Request) {
  try {
    const body = await finalJson<any>(request)
    if (!body?.threadId || !body?.action) {
      return finalFail("Missing threadId or action", 400)
    }

    const db = emailOSFinalDb()
    const updates: Record<string, unknown> = { updated_at: nowIso() }

    if (body.action === "archive") updates.status = "archived"
    if (body.action === "resolve") updates.status = "resolved"
    if (body.action === "assign") {
      updates.status = "assigned"
      updates.owner_id = body.ownerId || null
    }
    if (body.action === "escalate") {
      updates.priority = "critical"
      updates.status = "approval"
    }
    if (body.action === "read") updates.unread = false

    const { error } = await db
      .from("email_os_threads")
      .update(updates)
      .eq("id", body.threadId)

    if (error) {
      return finalOk({ updated: false, warning: "Thread table unavailable or incompatible", error: error.message })
    }

    await writeFinalAudit({
      action: `thread.${body.action}`,
      threadId: body.threadId,
      mailboxId: body.mailboxId,
      severity: body.action === "escalate" ? "critical" : "info",
      details: body.payload || {}
    })

    if (body.action === "escalate") {
      await createFinalQueueJob({
        type: "notification",
        payload: {
          type: "sla_breach",
          title: "Thread escalated",
          body: `Thread ${body.threadId} escalated`,
          priority: "high"
        }
      })
    }

    return finalOk({ updated: true, threadId: body.threadId, action: body.action })
  } catch (error) {
    return finalFail(error instanceof Error ? error.message : "Failed to execute thread action", 500)
  }
}
