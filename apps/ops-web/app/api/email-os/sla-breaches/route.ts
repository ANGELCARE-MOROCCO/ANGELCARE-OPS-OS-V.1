import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()

    const { data, error } = await db
      .from("email_os_core_threads")
      .select("*")
      .in("status", ["open", "assigned", "escalated"])
      .order("updated_at", { ascending: true })
      .limit(100)

    if (error) throw error

    const now = Date.now()

    const breaches = (data || []).filter((row: any) => {
      const updated = new Date(row.updated_at || row.created_at || now).getTime()
      const ageMinutes = (now - updated) / 60000
      return ageMinutes > 240
    })

    return NextResponse.json({
      ok: true,
      data: {
        count: breaches.length,
        breaches
      }
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "SLA breach scan failed"
    }, { status: 500 })
  }
}
