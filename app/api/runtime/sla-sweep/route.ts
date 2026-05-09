
import { requireEmailOSCronSecret } from "@/lib/email-os/production/env"
import { ok, fail } from "@/lib/email-os/production/response"
import { runEmailOSSlaSweep } from "@/lib/email-os/runtime/sla-sweep"

export async function POST(request: Request) {
  if (!requireEmailOSCronSecret(request)) return fail("Invalid cron secret", 401)

  try {
    const result = await runEmailOSSlaSweep()
    return ok(result)
  } catch (error) {
    return fail(error instanceof Error ? error.message : "SLA sweep failed", 500)
  }
}
