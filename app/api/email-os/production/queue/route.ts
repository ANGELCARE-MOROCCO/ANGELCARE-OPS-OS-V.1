
import { assertEmailOSPermission } from "@/lib/email-os/production/rbac"
import { createQueueJob, persistQueueJob } from "@/lib/email-os/production/queue"
import { ok, fail, readJson } from "@/lib/email-os/production/response"

export async function POST(request: Request) {
  try {
    assertEmailOSPermission(request, "email.queue")
    const body = await readJson<any>(request)
    if (!body?.type) return fail("Missing queue job type", 400)

    const job = createQueueJob({
      type: body.type,
      payload: body.payload || {},
      maxAttempts: body.maxAttempts || 3
    })

    await persistQueueJob(job)
    return ok(job)
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Queue failed", 500)
  }
}
