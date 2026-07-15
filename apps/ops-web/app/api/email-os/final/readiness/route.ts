import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

const tables = [
  "email_os_core_mailboxes",
  "email_os_core_threads",
  "email_os_core_queue",
  "email_os_core_audit",
  "email_os_core_provider_profiles",
  "email_os_core_mailbox_credentials",
  "email_os_core_realtime_events",
  "email_os_core_ai_memory",
  "email_os_core_rbac_policies",
  "email_os_core_security_audit_events",
  "email_os_core_final_readiness_checks"
]

async function tableStatus(table: string) {
  try {
    const db = createEmailOSCoreDb()
    const { count, error } = await db.from(table).select("*", { count: "exact", head: true })
    if (error) throw error
    return { table, ok: true, count: count || 0 }
  } catch (error) {
    return { table, ok: false, error: error instanceof Error ? error.message : "failed" }
  }
}

export async function GET() {
  const statuses = []
  for (const table of tables) {
    statuses.push(await tableStatus(table))
  }

  const blockers = statuses.filter((item) => !item.ok)

  return NextResponse.json({
    ok: blockers.length === 0,
    data: {
      status: blockers.length === 0 ? "final-foundation-ready" : "blocked",
      blockers,
      tables: statuses,
      env: {
        supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        smtp: Boolean(process.env.EMAIL_OS_SMTP_HOST),
        imap: Boolean(process.env.EMAIL_OS_IMAP_HOST),
        openai: Boolean(process.env.OPENAI_API_KEY)
      }
    }
  })
}
