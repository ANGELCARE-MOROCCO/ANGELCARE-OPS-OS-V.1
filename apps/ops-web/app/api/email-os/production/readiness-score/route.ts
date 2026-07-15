import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

async function tableOk(table: string) {
  try {
    const db = createEmailOSCoreDb()
    const { error } = await db.from(table).select("*", { count: "exact", head: true })
    return !error
  } catch {
    return false
  }
}

async function count(table: string, column?: string, value?: string) {
  try {
    const db = createEmailOSCoreDb()
    let q = db.from(table).select("*", { count: "exact", head: true })
    if (column && value) q = q.eq(column, value)
    const { count } = await q
    return count || 0
  } catch {
    return 0
  }
}

export async function GET() {
  const checks = [
    { key: "supabase_env", ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY), weight: 15 },
    { key: "provider_env", ok: Boolean(process.env.EMAIL_OS_SMTP_HOST && process.env.EMAIL_OS_IMAP_HOST), weight: 10 },
    { key: "core_tables", ok: await tableOk("email_os_core_mailboxes") && await tableOk("email_os_core_threads"), weight: 15 },
    { key: "security_tables", ok: await tableOk("email_os_core_security_audit_events") && await tableOk("email_os_core_rbac_policies"), weight: 10 },
    { key: "realtime_tables", ok: await tableOk("email_os_core_realtime_events"), weight: 8 },
    { key: "ai_tables", ok: await tableOk("email_os_core_ai_memory") && await tableOk("email_os_core_ai_execution_guards"), weight: 8 },
    { key: "mailboxes", ok: await count("email_os_core_mailboxes") > 0, weight: 10 },
    { key: "credentials", ok: await count("email_os_core_mailbox_credentials") > 0, weight: 10 },
    { key: "passed_credential_test", ok: await count("email_os_core_mailbox_credentials", "last_test_status", "passed") > 0, weight: 10 },
    { key: "monitoring", ok: await tableOk("email_os_core_monitoring_events"), weight: 4 }
  ]

  const score = checks.reduce((sum, check) => sum + (check.ok ? check.weight : 0), 0)

  return NextResponse.json({
    ok: score >= 75,
    data: {
      score,
      status: score >= 90 ? "production-strong" : score >= 75 ? "production-usable" : score >= 55 ? "staging-ready" : "not-ready",
      checks
    }
  })
}
