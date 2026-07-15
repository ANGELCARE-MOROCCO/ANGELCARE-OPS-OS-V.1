import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const roleKey = body.roleKey || "operations"
    const resource = body.resource || "thread"
    const action = body.action || "read"

    const db = createEmailOSCoreDb()
    const { data: policies, error } = await db
      .from("email_os_core_rbac_policies")
      .select("*")
      .eq("role_key", roleKey)
      .eq("resource", resource)
      .eq("action", action)
      .limit(1)

    if (error) throw error

    const policy = policies?.[0]
    const allowed = policy ? policy.effect === "allow" : roleKey === "admin"

    await db.from("email_os_core_security_audit_events").insert({
      id: makeEmailOSId(),
      actor: body.actor || roleKey,
      action: `${resource}.${action}`,
      resource,
      decision: allowed ? "allowed" : "denied",
      reason: policy ? `matched policy ${policy.id}` : "default policy",
      metadata: { roleKey },
      created_at: nowIso()
    })
    return NextResponse.json({ ok: true, data: { allowed, policy: policy || null } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "RBAC evaluation failed" }, { status: 500 })
  }
}
