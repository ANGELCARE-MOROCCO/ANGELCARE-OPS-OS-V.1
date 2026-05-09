import { finalFail, finalOk, finalJson } from "@/lib/email-os/final/final-response"
import { emailOSFinalDb, finalId, nowIso } from "@/lib/email-os/final/final-db"
import { writeFinalAudit } from "@/lib/email-os/final/final-audit"

export async function POST(request: Request) {
  try {
    const body = await finalJson<any>(request)

    if (!body?.targetId || !body?.decision) {
      return finalFail("Missing targetId or decision", 400)
    }

    const db = emailOSFinalDb()
    const row = {
      id: body.id || finalId("appr"),
      target_id: body.targetId,
      target_type: body.targetType || "draft",
      decision: body.decision,
      decided_by: body.decidedBy || null,
      reason: body.reason || null,
      created_at: nowIso()
    }

    const { data, error } = await db
      .from("email_os_approval_decisions")
      .insert(row)
      .select("*")
      .single()

    if (error) throw error

    await writeFinalAudit({
      action: `approval.${body.decision}`,
      draftId: body.targetType === "draft" ? body.targetId : undefined,
      threadId: body.targetType === "thread" ? body.targetId : undefined,
      severity: "critical",
      details: row
    })

    return finalOk(data)
  } catch (error) {
    return finalFail(error instanceof Error ? error.message : "Approval execution failed", 500)
  }
}
