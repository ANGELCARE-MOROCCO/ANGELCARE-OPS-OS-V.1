export type EmailOSQATest = {
  area: string
  key: string
  label: string
  severity: "normal" | "high" | "critical"
}

export const EMAIL_OS_PRODUCTION_QA_MANIFEST: EmailOSQATest[] = [
  { area: "auth", key: "login_protected", label: "Protected Email-OS routes require login", severity: "critical" },
  { area: "env", key: "supabase_env", label: "Supabase URL and service role are configured", severity: "critical" },
  { area: "env", key: "provider_env", label: "SMTP and IMAP provider env are configured", severity: "high" },
  { area: "database", key: "core_tables", label: "Core Email-OS tables are available", severity: "critical" },
  { area: "mailbox", key: "provider_profile", label: "Default provider profile exists", severity: "high" },
  { area: "mailbox", key: "mailbox_credentials", label: "At least one mailbox credential exists", severity: "high" },
  { area: "mailbox", key: "mailbox_test", label: "Mailbox credential test has passed", severity: "critical" },
  { area: "smtp", key: "queue_send", label: "Outbound queue can process or fail safely", severity: "critical" },
  { area: "imap", key: "sync_checkpoint", label: "IMAP checkpoint route works", severity: "high" },
  { area: "search", key: "search_index", label: "Search index can be refreshed", severity: "normal" },
  { area: "collaboration", key: "thread_lock", label: "Thread locking prevents duplicate handling", severity: "high" },
  { area: "security", key: "rbac_enforce", label: "RBAC enforce route records audit decision", severity: "critical" },
  { area: "security", key: "security_audit", label: "Security audit events are visible", severity: "high" },
  { area: "realtime", key: "live_poll", label: "Realtime poll route returns events safely", severity: "normal" },
  { area: "ai", key: "ai_guard", label: "AI draft reply creates approval guard", severity: "high" },
  { area: "ux", key: "final_command", label: "Final command center loads", severity: "normal" },
  { area: "deployment", key: "build_passes", label: "npm run build passes", severity: "critical" },
  { area: "deployment", key: "vercel_env", label: "Vercel production env matches local required env", severity: "critical" }
]
