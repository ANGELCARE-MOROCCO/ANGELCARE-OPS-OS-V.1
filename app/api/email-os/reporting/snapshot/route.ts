import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    const { data: metrics } = await db
      .from("email_os_core_analytics_metrics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    const summary = {
      generatedAt: nowIso(),
      metrics: metrics || []
    }

    const row = {
      id: makeEmailOSId(),
      snapshot_name: `Executive Snapshot ${new Date().toISOString()}`,
      summary,
      generated_by: "email_os_core",
      generated_at: nowIso()
    }

    const { data, error } = await db
      .from("email_os_core_reporting_snapshots")
      .insert(row)
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Snapshot generation failed"
    }, { status: 500 })
  }
}
