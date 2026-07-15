import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const after = url.searchParams.get("after")
    const limit = Number(url.searchParams.get("limit") || 100)

    const db = createEmailOSCoreDb()
    let query = db.from("email_os_core_realtime_events").select("*").order("created_at", { ascending: false }).limit(limit)

    if (after) query = query.gt("created_at", after)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Realtime poll failed" }, { status: 500 })
  }
}
