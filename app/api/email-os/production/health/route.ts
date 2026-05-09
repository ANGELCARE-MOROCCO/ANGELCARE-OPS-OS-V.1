
import { ok } from "@/lib/email-os/production/response"
import { getEmailOSEnvReport } from "@/lib/email-os/production/env"

export async function GET() {
  return ok({
    service: "email-os-production",
    env: getEmailOSEnvReport(),
    checkedAt: new Date().toISOString()
  })
}
