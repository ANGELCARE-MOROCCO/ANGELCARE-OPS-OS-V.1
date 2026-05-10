import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId } from "@/lib/email-os-core/schema"

export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    const { data: incidents } = await db
      .from("email_os_core_sla_incidents")
      .select("*")
      .eq("breached", true)
      .limit(100)

    const escalations = (incidents || []).map((incident: any) => ({
      id: makeEmailOSId(),
      incident_id: incident.id,
      escalation_level: 1,
      target_team: "operations",
      status: "pending",
      escalated_at: new Date().toISOString(),
      metadata: {
        entityId: incident.entity_id
      }
    }))

    if (escalations.length) {
      await db.from("email_os_core_workflow_escalations").insert(escalations)
    }

    return NextResponse.json({
      ok: true,
      data: {
        escalations: escalations.length
      }
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Escalation failed"
    }, { status: 500 })
  }
}
