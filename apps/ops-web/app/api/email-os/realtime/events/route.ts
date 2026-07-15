import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()

    const { data, error } = await db
      .from("email_os_core_realtime_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ ok: true, data: data || [] })
  } catch {
    return NextResponse.json({ ok: false, error: "Realtime feed failed" }, { status: 500 })
  }
}
