
import { NextResponse } from "next/server"

export async function GET() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ]

  const optional = [
    "EMAIL_OS_SMTP_HOST",
    "EMAIL_OS_SMTP_USER",
    "EMAIL_OS_SMTP_PASSWORD",
    "EMAIL_OS_IMAP_HOST",
    "EMAIL_OS_IMAP_USER",
    "EMAIL_OS_IMAP_PASSWORD",
    "EMAIL_OS_CRON_SECRET",
    "EMAIL_OS_ENCRYPTION_KEY"
  ]

  const missingRequired = required.filter((key) => !process.env[key])
  const missingOptional = optional.filter((key) => !process.env[key])

  return NextResponse.json({
    ok: missingRequired.length === 0,
    service: "email-os-enterprise",
    missingRequired,
    missingOptional,
    checkedAt: new Date().toISOString()
  })
}
