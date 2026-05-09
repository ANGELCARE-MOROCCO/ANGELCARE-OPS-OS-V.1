import { NextResponse } from "next/server"

export async function GET() {
  const checks = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
    smtpHost: Boolean(process.env.EMAIL_OS_SMTP_HOST),
    smtpUser: Boolean(process.env.EMAIL_OS_SMTP_USER),
    smtpPassword: Boolean(process.env.EMAIL_OS_SMTP_PASSWORD),
    imapHost: Boolean(process.env.EMAIL_OS_IMAP_HOST),
    imapUser: Boolean(process.env.EMAIL_OS_IMAP_USER),
    imapPassword: Boolean(process.env.EMAIL_OS_IMAP_PASSWORD),
    cronSecret: Boolean(process.env.EMAIL_OS_CRON_SECRET)
  }

  return NextResponse.json({
    ok: checks.supabaseUrl && checks.supabaseKey,
    data: checks,
    checkedAt: new Date().toISOString()
  })
}
