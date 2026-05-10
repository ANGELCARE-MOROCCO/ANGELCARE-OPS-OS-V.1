import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()

    const { data, error } = await db
      .from("email_os_core_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000)

    if (error) throw error

    const rows = data || []
    const byAction: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}

    for (const row of rows) {
      byAction[row.action] = (byAction[row.action] || 0) + 1
      bySeverity[row.severity || "info"] = (bySeverity[row.severity || "info"] || 0) + 1
    }

    return NextResponse.json({
      ok: true,
      data: {
        total: rows.length,
        byAction,
        bySeverity,
        latest: rows.slice(0, 25)
      }
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Audit summary failed" }, { status: 500 })
  }
}
