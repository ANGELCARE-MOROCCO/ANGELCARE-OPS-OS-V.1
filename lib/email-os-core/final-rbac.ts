import { createEmailOSCoreDb } from "./db"
import { makeEmailOSId, nowIso } from "./schema"

export type FinalRbacInput = {
  roleKey?: string
  resource: string
  action: string
  actor?: string
}

export async function enforceEmailOSPermission(input: FinalRbacInput) {
  const roleKey = input.roleKey || "operations"
  const db = createEmailOSCoreDb()

  if (roleKey === "admin" || roleKey === "ceo") {
    await writeSecurityAudit({
      actor: input.actor || roleKey,
      action: `${input.resource}.${input.action}`,
      resource: input.resource,
      decision: "allowed",
      reason: "privileged role"
    })
    return { allowed: true, reason: "privileged role" }
  }

  const { data, error } = await db
    .from("email_os_core_rbac_policies")
    .select("*")
    .eq("role_key", roleKey)
    .eq("resource", input.resource)
    .eq("action", input.action)
    .limit(1)

  if (error) {
    await writeSecurityAudit({
      actor: input.actor || roleKey,
      action: `${input.resource}.${input.action}`,
      resource: input.resource,
      decision: "denied",
      reason: error.message
    }).catch(() => null)

    return { allowed: false, reason: error.message }
  }

  const policy = data?.[0]
  const allowed = policy?.effect === "allow"

  await writeSecurityAudit({
    actor: input.actor || roleKey,
    action: `${input.resource}.${input.action}`,
    resource: input.resource,
    decision: allowed ? "allowed" : "denied",
    reason: policy ? `matched policy ${policy.id}` : "no matching policy"
  }).catch(() => null)

  return {
    allowed,
    reason: policy ? `matched policy ${policy.id}` : "no matching policy",
    policy: policy || null
  }
}

export async function writeSecurityAudit(input: {
  actor?: string
  action: string
  resource?: string
  decision: string
  reason?: string
  metadata?: Record<string, unknown>
}) {
  const db = createEmailOSCoreDb()

  const row = {
    id: makeEmailOSId(),
    actor: input.actor || null,
    action: input.action,
    resource: input.resource || null,
    decision: input.decision,
    reason: input.reason || null,
    metadata: input.metadata || {},
    created_at: nowIso()
  }

  const { error } = await db.from("email_os_core_security_audit_events").insert(row)
  if (error) throw error

  return row
}
