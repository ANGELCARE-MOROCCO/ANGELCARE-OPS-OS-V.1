import { fail, logRevenueAction, logRevenueActivity, ok, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess, revenueAccessFailure } from "@/lib/revenue-command-center/api-access"

const STAGE_SEQUENCE = [
  "qualification",
  "discovery",
  "decision_map",
  "appointment_ready",
  "proposal",
  "negotiation",
  "contracting",
  "closed_won",
  "closed_lost",
  "recovery",
]

export async function POST(request: Request) {
  try {
    const access = await requireRevenueApiAccess("revenue.opportunities.transition")
    const supabase = await revenueClient()
    const body = await request.json()
    const id = String(body.id || body.opportunityId || "").trim()
    const toStage = String(body.toStage || body.stage || "").trim()
    if (!id || !toStage) return fail("Opportunité et nouvelle étape requises.", 400)
    if (!STAGE_SEQUENCE.includes(toStage)) return fail("Étape commerciale non reconnue.", 400)

    const { data: current, error: readError } = await supabase.from("revenue_opportunities").select("*").eq("id", id).maybeSingle()
    if (readError) return fail(readError)
    if (!current) return fail("Opportunité introuvable.", 404)

    const currentIndex = STAGE_SEQUENCE.indexOf(String(current.stage))
    const targetIndex = STAGE_SEQUENCE.indexOf(toStage)
    const backwards = currentIndex >= 0 && targetIndex >= 0 && targetIndex < currentIndex
    if (backwards && !String(body.reason || "").trim()) {
      return fail("Un motif est requis pour revenir à une étape antérieure.", 400)
    }
    if (["closed_won", "closed_lost"].includes(toStage) && !String(body.reason || "").trim()) {
      return fail("Un motif de clôture est requis.", 400)
    }

    const metadata = {
      ...(current.metadata && typeof current.metadata === "object" ? current.metadata : {}),
      transition_reason: String(body.reason || "Transition Revenue Command"),
      transition_evidence: Array.isArray(body.evidence) ? body.evidence : [],
    }
    const status = toStage === "closed_won" ? "won" : toStage === "closed_lost" ? "lost" : "open"
    const patch: Record<string, unknown> = {
      stage: toStage,
      status,
      probability: Number(body.probability ?? current.probability ?? 0),
      next_step: String(body.nextStep || current.next_step || ""),
      next_step_at: body.nextStepAt || current.next_step_at || null,
      close_reason: ["closed_won", "closed_lost"].includes(toStage) ? String(body.reason) : current.close_reason,
      closed_at: ["closed_won", "closed_lost"].includes(toStage) ? new Date().toISOString() : null,
      updated_by: (access.user as any).id || null,
      metadata,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("revenue_opportunities").update(patch).eq("id", id).select("*").single()
    if (error) return fail(error)

    await logRevenueActivity(supabase, {
      entityType: "opportunity",
      entityId: id,
      prospectId: data.prospect_id,
      eventType: "opportunity_stage_changed",
      title: `Opportunité déplacée : ${current.stage} → ${toStage}`,
      severity: backwards ? "warning" : "info",
      metadata: { fromStage: current.stage, toStage, reason: body.reason || null },
    })
    await logRevenueAction(supabase, {
      actionType: "transition_opportunity",
      entityType: "opportunity",
      entityId: id,
      payload: body,
      result: { fromStage: current.stage, toStage },
    })

    return ok({ opportunity: data, transition: { fromStage: current.stage, toStage, backwards } })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}
