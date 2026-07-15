import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

async function count(table: string) {
  const db = createEmailOSCoreDb()
  const { count, error } = await db.from(table).select("*", { count: "exact", head: true })
  if (error) return 0
  return count || 0
}

export async function GET() {
  const data = {
    rbacPolicies: await count("email_os_core_rbac_policies"),
    securityAuditEvents: await count("email_os_core_security_audit_events"),
    vaultRefs: await count("email_os_core_secret_vault_refs"),
    tenantBoundaries: await count("email_os_core_tenant_boundaries"),
    aiGuards: await count("email_os_core_ai_execution_guards")
  }

  return NextResponse.json({
    ok: true,
    data: {
      ...data,
      status: data.rbacPolicies > 0 && data.securityAuditEvents > 0 ? "configured" : "needs-configuration"
    }
  })
}
