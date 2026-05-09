
import { requireEmailOSCronSecret } from "@/lib/email-os/production/env"
import { ok, fail } from "@/lib/email-os/production/response"
import { runEmailOSQueueProcessor } from "@/lib/email-os/runtime/queue-processor"

export async function POST(request: Request) {
  if (!requireEmailOSCronSecret(request)) return fail("Invalid cron secret", 401)

  try {
    const result = await runEmailOSQueueProcessor(10)
    return ok(result)
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Queue worker failed", 500)
  }
}
