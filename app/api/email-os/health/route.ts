import { NextResponse } from "next/server"

export async function GET() {
  const data = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    smtpHost: Boolean(process.env.EMAIL_OS_SMTP_HOST),
    smtpUser: Boolean(process.env.EMAIL_OS_SMTP_USER),
    smtpPassword: Boolean(process.env.EMAIL_OS_SMTP_PASSWORD)
  }

  return NextResponse.json({ ok: data.supabaseUrl && (data.supabaseServiceRole || data.supabaseAnonKey), data })
}
