import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export async function GET() {
  try {
    const db = createEmailOSCoreDb()

    const [
      alerts,
      scores,
      risks,
      bottlenecks,
      workloads,
      presence
    ] = await Promise.all([
      db.from("email_os_core_command_alerts").select("*").order("created_at", { ascending: false }).limit(25),
      db.from("email_os_core_thread_priority_scores").select("*").order("created_at", { ascending: false }).limit(25),
      db.from("email_os_core_risk_classifications").select("*").order("created_at", { ascending: false }).limit(25),
      db.from("email_os_core_bottleneck_snapshots").select("*").order("created_at", { ascending: false }).limit(25),
      db.from("email_os_core_team_workloads").select("*").limit(50),
      db.from("email_os_core_presence").select("*").order("last_seen_at", { ascending: false }).limit(50)
    ])

    return NextResponse.json({
      ok: true,
      data: {
        alerts: alerts.data || [],
        priorityScores: scores.data || [],
        risks: risks.data || [],
        bottlenecks: bottlenecks.data || [],
        workloads: workloads.data || [],
        presence: presence.data || []
      }
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Command center summary failed" }, { status: 500 })
  }
}
