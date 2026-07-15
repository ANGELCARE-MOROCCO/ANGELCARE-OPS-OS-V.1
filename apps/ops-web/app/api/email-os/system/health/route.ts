import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()

    const checks = {
      database: true,
      smtp: Boolean(process.env.EMAIL_OS_SMTP_HOST),
      imap: Boolean(process.env.EMAIL_OS_IMAP_HOST),
      realtime: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
    }

    const healthy = Object.values(checks).every(Boolean)

    await db.from("email_os_core_system_health").insert({
      id: crypto.randomUUID(),
      component: "email-os",
      status: healthy ? "healthy" : "degraded",
      message: healthy ? "All systems operational" : "One or more systems unavailable",
      metadata: checks
    })

    return NextResponse.json({
      ok: true,
      data: {
        healthy,
        checks
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Health check failed"
      },
      { status: 500 }
    )
  }
}
