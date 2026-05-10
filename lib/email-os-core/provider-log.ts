import { createEmailOSCoreDb } from "./db"
import { makeEmailOSId, nowIso } from "./schema"

export async function writeProviderLog(input: {
  provider: string
  action: string
  status: string
  message?: string
  metadata?: Record<string, unknown>
}) {
  const db = createEmailOSCoreDb()

  const row = {
    id: makeEmailOSId(),
    provider: input.provider,
    action: input.action,
    status: input.status,
    message: input.message || null,
    metadata: input.metadata || {},
    created_at: nowIso()
  }

  const { error } = await db.from("email_os_core_provider_logs").insert(row)
  if (error) throw error
  return row
}
