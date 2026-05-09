import { finalFail, finalOk, finalJson } from "@/lib/email-os/final/final-response"
import { sendEmailOSMessage } from "@/lib/email-os/production/smtp-service"
import { writeFinalAudit } from "@/lib/email-os/final/final-audit"
import { createFinalQueueJob } from "@/lib/email-os/final/final-queue"

export async function POST(request: Request) {
  try {
    const body = await finalJson<any>(request)

    if (!body?.to || !body?.subject || (!body.html && !body.text)) {
      return finalFail("Missing to, subject, and body", 400)
    }

    try {
      const result = await sendEmailOSMessage({
        to: body.to,
        subject: body.subject,
        html: body.html,
        text: body.text,
        from: body.from
      })

      await writeFinalAudit({
        action: "send.completed",
        mailboxId: body.mailboxId,
        threadId: body.threadId,
        severity: "critical",
        details: { to: body.to, subject: body.subject, messageId: result.messageId }
      })

      return finalOk({ mode: "sent", messageId: result.messageId })
    } catch (sendError) {
      const job = await createFinalQueueJob({
        type: "send",
        payload: {
          to: body.to,
          subject: body.subject,
          html: body.html,
          text: body.text,
          from: body.from,
          mailboxId: body.mailboxId,
          threadId: body.threadId
        }
      })

      await writeFinalAudit({
        action: "send.queued",
        mailboxId: body.mailboxId,
        threadId: body.threadId,
        severity: "warning",
        details: {
          to: body.to,
          subject: body.subject,
          jobId: job.id,
          reason: sendError instanceof Error ? sendError.message : "provider unavailable"
        }
      })

      return finalOk({ mode: "queued", job })
    }
  } catch (error) {
    return finalFail(error instanceof Error ? error.message : "Send or queue failed", 500)
  }
}
