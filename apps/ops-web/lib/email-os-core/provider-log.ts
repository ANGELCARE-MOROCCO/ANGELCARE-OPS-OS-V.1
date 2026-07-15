import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function writeProviderLog(input: {
  provider: string
  status: string
  message?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const db = createEmailOSCoreDb()

    await db.from("email_os_core_provider_logs").insert({
      id: makeEmailOSId(),
      provider: input.provider,
      status: input.status,
      message: input.message || null,
      metadata: input.metadata || {},
      created_at: nowIso()
    })
  } catch {
    // non-blocking
  }
}
