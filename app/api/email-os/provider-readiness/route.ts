import { NextResponse } from "next/server"

export async function GET() {
  const env = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    smtpHost: Boolean(process.env.EMAIL_OS_SMTP_HOST),
    smtpPort: Boolean(process.env.EMAIL_OS_SMTP_PORT),
    smtpUser: Boolean(process.env.EMAIL_OS_SMTP_USER),
    smtpPassword: Boolean(process.env.EMAIL_OS_SMTP_PASSWORD),
    smtpFrom: Boolean(process.env.EMAIL_OS_SMTP_FROM),
    imapHost: Boolean(process.env.EMAIL_OS_IMAP_HOST),
    imapPort: Boolean(process.env.EMAIL_OS_IMAP_PORT),
    imapUser: Boolean(process.env.EMAIL_OS_IMAP_USER),
    imapPassword: Boolean(process.env.EMAIL_OS_IMAP_PASSWORD),
    internalToken: Boolean(process.env.EMAIL_OS_INTERNAL_TOKEN)
  }

  const blockers = Object.entries(env)
    .filter(([key, value]) => !value && ["supabaseUrl", "supabaseServiceRole"].includes(key))
    .map(([key]) => key)

  const warnings = Object.entries(env)
    .filter(([key, value]) => !value && !blockers.includes(key))
    .map(([key]) => key)

  return NextResponse.json({
    ok: blockers.length === 0,
    data: {
      env,
      blockers,
      warnings,
      status: blockers.length === 0 ? "deployable" : "blocked"
    }
  })
}
