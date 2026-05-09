import { finalFail, finalOk, finalJson } from "@/lib/email-os/final/final-response"
import { emailOSFinalDb, finalId, nowIso } from "@/lib/email-os/final/final-db"
import { writeFinalAudit } from "@/lib/email-os/final/final-audit"

export async function POST(request: Request) {
  try {
    const body = await finalJson<any>(request)
    if (!body?.subject && !body?.text && !body?.html) {
      return finalFail("Draft has no content", 400)
    }

    const db = emailOSFinalDb()
    const now = nowIso()

    const row = {
      id: body.id || finalId("draft"),
      to_address: body.to || "",
      subject: body.subject || "",
      html: body.html || null,
      text: body.text || null,
      mailbox_id: body.mailboxId || null,
      thread_id: body.threadId || null,
      status: body.status || "draft",
      created_at: body.id ? undefined : now,
      updated_at: now
    }

    const { data, error } = await db
      .from("email_os_drafts")
      .upsert(row)
      .select("*")
      .single()

    if (error) throw error

    await writeFinalAudit({
      action: "draft.autosaved",
      draftId: data.id,
      mailboxId: body.mailboxId,
      threadId: body.threadId,
      severity: "info"
    })

    return finalOk(data)
  } catch (error) {
    return finalFail(error instanceof Error ? error.message : "Failed to autosave draft", 500)
  }
}
