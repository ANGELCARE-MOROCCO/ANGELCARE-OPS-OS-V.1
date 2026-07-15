import { createEmailOSCoreDb } from "./db"
import { makeEmailOSId, nowIso } from "./schema"

export async function audit(action: string, details: Record<string, unknown> = {}) {
  const db = createEmailOSCoreDb()
  await db.from("email_os_core_audit").insert({
    id: makeEmailOSId(),
    action,
    target_type: String(details.targetType || ""),
    target_id: String(details.targetId || ""),
    severity: String(details.severity || "info"),
    details,
    created_at: nowIso()
  })
}
