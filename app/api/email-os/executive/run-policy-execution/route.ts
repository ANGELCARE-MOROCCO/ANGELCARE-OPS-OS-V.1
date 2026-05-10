import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    const { data: risks, error } = await db
      .from("email_os_core_risk_classifications")
      .select("*")
      .eq("risk_level", "high")
      .limit(50)

    if (error) throw error

    const actions = (risks || []).map((risk: any) => ({
      id: makeEmailOSId(),
      action_type: "escalate_thread",
      target_type: risk.entity_type,
      target_id: risk.entity_id,
      command_status: "queued",
      requested_by: "policy-engine",
      approved_by: null,
      payload: {
        reason: risk.risk_reason,
        recommendedAction: risk.recommended_action
      },
      result: {},
      created_at: nowIso(),
      executed_at: null
    }))

    if (actions.length) {
      const { error: insertError } = await db.from("email_os_core_executive_command_actions").insert(actions)
      if (insertError) throw insertError
    }

    const resultRow = {
      id: makeEmailOSId(),
      policy_id: null,
      policy_name: "High Risk Executive Escalation",
      execution_status: "completed",
      actions_created: actions.length,
      metadata: { highRisksFound: risks?.length || 0 },
      executed_at: nowIso()
    }

    const { data, error: resultError } = await db
      .from("email_os_core_policy_execution_results")
      .insert(resultRow)
      .select("*")
      .single()

    if (resultError) throw resultError

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Policy execution failed" }, { status: 500 })
  }
}
