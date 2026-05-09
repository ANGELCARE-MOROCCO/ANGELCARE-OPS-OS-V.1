
import { sendEmailOSMessage } from "@/lib/email-os/production/smtp-service"
import { persistNotification } from "@/lib/email-os/production/notifications"
import { persistAuditEvent } from "@/lib/email-os/production/audit"
import {
  claimNextQueueJobs,
  createRuntimeEvent,
  markQueueJobCompleted,
  markQueueJobFailed
} from "./repositories"

export type QueueProcessorResult = {
  processed: number
  completed: number
  failed: number
  errors: string[]
}

async function processQueueJob(job: any) {
  if (job.type === "send") {
    const payload = job.payload || {}

    if (!payload.to || !payload.subject || (!payload.html && !payload.text)) {
      throw new Error("Send job missing to, subject or body")
    }

    const result = await sendEmailOSMessage({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    })

    await persistAuditEvent({
      action: "queue.send.completed",
      severity: "critical",
      mailboxId: payload.mailboxId,
      threadId: payload.threadId,
      details: { jobId: job.id, messageId: result.messageId }
    })

    await createRuntimeEvent({
      type: "queue.send.completed",
      mailboxId: payload.mailboxId,
      threadId: payload.threadId,
      payload: { jobId: job.id, messageId: result.messageId }
    })

    return result
  }

  if (job.type === "notification") {
    await persistNotification(job.payload)
    await createRuntimeEvent({ type: "notification.dispatched", payload: { jobId: job.id } })
    return { ok: true }
  }

  if (job.type === "sla") {
    await createRuntimeEvent({ type: "sla.job.processed", payload: { jobId: job.id } })
    return { ok: true }
  }

  if (job.type === "sync") {
    await createRuntimeEvent({ type: "mailbox.sync.requested", payload: { jobId: job.id } })
    return { ok: true }
  }

  throw new Error(`Unsupported Email-OS queue job type: ${job.type}`)
}

export async function runEmailOSQueueProcessor(limit = 10): Promise<QueueProcessorResult> {
  const jobs = await claimNextQueueJobs(limit)
  const result: QueueProcessorResult = {
    processed: jobs.length,
    completed: 0,
    failed: 0,
    errors: []
  }

  for (const job of jobs) {
    try {
      await processQueueJob(job)
      await markQueueJobCompleted(job.id)
      result.completed += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown queue job error"
      await markQueueJobFailed(job, message)
      result.failed += 1
      result.errors.push(`${job.id}: ${message}`)
    }
  }

  return result
}
