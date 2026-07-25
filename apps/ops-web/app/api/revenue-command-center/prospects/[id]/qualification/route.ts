import { fail, logRevenueAction, logRevenueActivity, ok, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess, revenueAccessFailure } from "@/lib/revenue-command-center/api-access"

function score(value: unknown) {
  return Math.max(0, Math.min(100, Number(value || 0)))
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireRevenueApiAccess("revenue.prospects.qualification.manage")
    const { id } = await params
    const supabase = await revenueClient()
    const body = await request.json()

    const scores = {
      need_score: score(body.needScore),
      authority_score: score(body.authorityScore),
      budget_score: score(body.budgetScore),
      timing_score: score(body.timingScore),
      fit_score: score(body.fitScore),
      urgency_score: score(body.urgencyScore),
      evidence_quality: score(body.evidenceQuality),
    }
    const overall = Math.round(
      scores.need_score * 0.2 +
        scores.authority_score * 0.18 +
        scores.budget_score * 0.16 +
        scores.timing_score * 0.14 +
        scores.fit_score * 0.16 +
        scores.urgency_score * 0.08 +
        scores.evidence_quality * 0.08,
    )
    const recommendation = body.recommendation || (overall >= 80 ? "advance" : overall >= 60 ? "continue_discovery" : overall >= 40 ? "nurture" : "disqualify")

    await supabase.from("revenue_qualification_assessments").update({ superseded_at: new Date().toISOString() }).eq("prospect_id", id).is("superseded_at", null)
    const { data, error } = await supabase.from("revenue_qualification_assessments").insert({
      prospect_id: id,
      opportunity_id: body.opportunityId || null,
      framework: body.framework || "ANGELCARE_ENTERPRISE",
      ...scores,
      overall_score: overall,
      recommendation,
      disqualification_reason: body.disqualificationReason || null,
      evidence: Array.isArray(body.evidence) ? body.evidence : [],
      notes: body.notes || null,
      assessed_by: (access.user as any).id || null,
      assessed_by_name: (access.user as any).email || (access.user as any).full_name || "Revenue Command",
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    }).select("*").single()
    if (error) return fail(error)

    const prospectPatch: Record<string, unknown> = { score: overall, updated_at: new Date().toISOString() }
    if (recommendation === "advance" && body.advanceStage) prospectPatch.stage = body.advanceStage
    await supabase.from("revenue_prospects").update(prospectPatch).eq("id", id)

    await logRevenueActivity(supabase, {
      entityType: "prospect",
      entityId: id,
      prospectId: id,
      eventType: "qualification_assessed",
      title: `Qualification enregistrée : ${overall}/100`,
      severity: overall < 40 ? "warning" : "info",
      metadata: { overall, recommendation, scores },
    })
    await logRevenueAction(supabase, { actionType: "assess_prospect_qualification", entityType: "prospect", entityId: id, payload: body, result: { assessmentId: data.id, overall, recommendation } })
    return ok({ assessment: data, overallScore: overall, recommendation })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}
