import { fail, logRevenueAction, logRevenueActivity, ok, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess, revenueAccessFailure } from "@/lib/revenue-command-center/api-access"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireRevenueApiAccess("revenue.prospects.risks.manage")
    const { id } = await params
    const supabase = await revenueClient()
    const body = await request.json()
    const { data: prospect, error: prospectError } = await supabase.from("revenue_prospects").select("id,account_id,name").eq("id", id).maybeSingle()
    if (prospectError) return fail(prospectError)
    if (!prospect) return fail("Prospect introuvable.", 404)

    const riskId = String(body.id || "").trim()
    const payload = {
      account_id: body.accountId || prospect.account_id,
      prospect_id: id,
      opportunity_id: body.opportunityId || null,
      risk_type: body.riskType || "commercial",
      severity: body.severity || "medium",
      probability: Math.max(0, Math.min(100, Number(body.probability || 50))),
      impact_mad: Number(body.impactMad || 0),
      title: body.title || "Risque commercial",
      description: body.description || null,
      mitigation_plan: body.mitigationPlan || null,
      owner: body.owner || null,
      due_at: body.dueAt || null,
      status: body.status || "open",
      resolved_at: body.status === "resolved" ? new Date().toISOString() : null,
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
      created_by: (access.user as any).id || null,
      updated_by: (access.user as any).id || null,
    }
    const result = riskId
      ? await supabase.from("revenue_account_risks").update(payload).eq("id", riskId).select("*").single()
      : await supabase.from("revenue_account_risks").insert(payload).select("*").single()
    if (result.error) return fail(result.error)

    await logRevenueActivity(supabase, {
      entityType: "prospect",
      entityId: id,
      prospectId: id,
      eventType: riskId ? "commercial_risk_updated" : "commercial_risk_created",
      title: `${riskId ? "Risque mis à jour" : "Risque créé"} : ${result.data.title}`,
      severity: ["critical", "high"].includes(result.data.severity) ? "warning" : "info",
      metadata: { riskId: result.data.id, severity: result.data.severity, impactMad: result.data.impact_mad },
    })
    await logRevenueAction(supabase, { actionType: riskId ? "update_commercial_risk" : "create_commercial_risk", entityType: "prospect", entityId: id, payload: body, result: { id: result.data.id } })
    return ok({ risk: result.data })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}
