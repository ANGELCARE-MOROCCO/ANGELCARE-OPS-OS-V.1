import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    const { data: threads } = await db
      .from("email_os_core_threads")
      .select("*")
      .limit(100)

    const incidents = []

    for (const thread of threads || []) {
      const created = new Date(thread.created_at || Date.now()).getTime()
      const ageMinutes = Math.floor((Date.now() - created) / 60000)

      const breached = ageMinutes > 240

      const incident = {
        id: makeEmailOSId(),
        entity_id: thread.id,
        entity_type: "thread",
        sla_policy_id: null,
        status: breached ? "breached" : "active",
        breached,
        started_at: thread.created_at || nowIso(),
        due_at: new Date(created + 240 * 60000).toISOString(),
        resolved_at: null,
        metadata: {
          ageMinutes
        }
      }

      incidents.push(incident)
    }

    if (incidents.length) {
      await db.from("email_os_core_sla_incidents").upsert(incidents)
    }

    return NextResponse.json({
      ok: true,
      data: {
        incidents: incidents.length,
        breached: incidents.filter((x) => x.breached).length
      }
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "SLA evaluation failed"
    }, { status: 500 })
  }
}
