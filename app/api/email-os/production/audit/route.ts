
import { assertEmailOSPermission } from "@/lib/email-os/production/rbac"
import { persistAuditEvent } from "@/lib/email-os/production/audit"
import { ok, fail, readJson } from "@/lib/email-os/production/response"

export async function POST(request: Request) {
  try {
    assertEmailOSPermission(request, "email.audit")
    const body = await readJson<any>(request)

    if (!body?.action) return fail("Missing audit action", 400)

    const event = await persistAuditEvent({
      action: body.action,
      actorId: body.actorId,
      mailboxId: body.mailboxId,
      threadId: body.threadId,
      draftId: body.draftId,
      severity: body.severity || "info",
      details: body.details || {}
    })

    return ok(event)
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Audit failed", 500)
  }
}
