import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

async function safeCount(table: string) {
  try {
    const db = createEmailOSCoreDb()
    const { count, error } = await db.from(table).select("*", { count: "exact", head: true })
    if (error) throw error
    return { ok: true, count: count || 0 }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Count failed" }
  }
}

export async function GET() {
  const tables = [
    "email_os_core_mailboxes",
    "email_os_core_templates",
    "email_os_core_threads",
    "email_os_core_drafts",
    "email_os_core_queue",
    "email_os_core_audit",
    "email_os_core_automation",
    "email_os_core_approvals",
    "email_os_core_notes",
    "email_os_core_sla_rules"
  ]

  const results: Record<string, unknown> = {}

  for (const table of tables) {
    results[table] = await safeCount(table)
  }

  return NextResponse.json({
    ok: true,
    env: {
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      smtpHost: Boolean(process.env.EMAIL_OS_SMTP_HOST),
      imapHost: Boolean(process.env.EMAIL_OS_IMAP_HOST)
    },
    tables: results
  })
}
