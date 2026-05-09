
import { assertEmailOSPermission } from "@/lib/email-os/production/rbac"
import { ok, fail, readJson } from "@/lib/email-os/production/response"
import { sendEmailOSMessage } from "@/lib/email-os/production/smtp-service"
import { persistAuditEvent } from "@/lib/email-os/production/audit"

export async function POST(request: Request) {
  try {
    const role = assertEmailOSPermission(request, "email.send")
    const body = await readJson<{ to?: string; subject?: string; html?: string; text?: string }>(request)

    if (!body?.to || !body?.subject || (!body.html && !body.text)) {
      return fail("Missing to, subject, and body content", 400)
    }

    const result = await sendEmailOSMessage({
      to: body.to,
      subject: body.subject,
      html: body.html,
      text: body.text
    })

    await persistAuditEvent({
      action: "email.send",
      severity: "critical",
      details: { to: body.to, subject: body.subject, role, messageId: result.messageId }
    })

    return ok({ messageId: result.messageId })
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Send failed", 500)
  }
}
