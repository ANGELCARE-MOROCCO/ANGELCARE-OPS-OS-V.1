import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
]

const optionalEnv = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "EMAIL_OS_SMTP_HOST",
  "EMAIL_OS_SMTP_PORT",
  "EMAIL_OS_SMTP_USER",
  "EMAIL_OS_SMTP_PASSWORD",
  "EMAIL_OS_SMTP_FROM",
  "EMAIL_OS_IMAP_HOST",
  "EMAIL_OS_IMAP_PORT",
  "EMAIL_OS_IMAP_USER",
  "EMAIL_OS_IMAP_PASSWORD",
  "EMAIL_OS_CRON_SECRET",
  "EMAIL_OS_INTERNAL_TOKEN"
]

const tables = [
  "email_os_core_mailboxes",
  "email_os_core_templates",
  "email_os_core_threads",
  "email_os_core_drafts",
  "email_os_core_queue",
  "email_os_core_audit",
  "email_os_core_automation",
  "email_os_core_messages",
  "email_os_core_approvals",
  "email_os_core_notes",
  "email_os_core_sla_rules",
  "email_os_core_comments",
  "email_os_core_notifications",
  "email_os_core_attachments",
  "email_os_core_provider_logs",
  "email_os_core_delivery_attempts",
  "email_os_core_deleted_records",
  "email_os_core_retention_policies",
  "email_os_core_mailbox_permissions",
  "email_os_core_access_profiles",
  "email_os_core_access_audit"
]

async function tableCheck(table: string) {
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
  const env = {
    required: Object.fromEntries(requiredEnv.map((key) => [key, Boolean(process.env[key])])),
    optional: Object.fromEntries(optionalEnv.map((key) => [key, Boolean(process.env[key])]))
  }

  const tableResults = []
  for (const table of tables) {
    tableResults.push(await tableCheck(table))
  }

  const blockers = [
    ...Object.entries(env.required).filter(([, value]) => !value).map(([key]) => `Missing required env: ${key}`),
    ...tableResults.filter((item) => !item.ok).map((item) => `Missing/error table: ${item.table}`)
  ]

  return NextResponse.json({
    ok: blockers.length === 0,
    data: {
      status: blockers.length === 0 ? "launch-ready" : "blocked",
      blockers,
      env,
      tables: tableResults,
      checkedAt: new Date().toISOString()
    }
  })
}
