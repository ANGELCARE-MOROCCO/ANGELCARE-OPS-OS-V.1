import { fail, logRevenueAction, logRevenueActivity, ok, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess, revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { normalizeOpportunityPayload } from "@/lib/revenue-command-center/enterprise-server"

export async function GET(request: Request) {
  try {
    await requireRevenueApiAccess(["revenue.opportunities.read", "revenue.prospects.read"])
    const supabase = await revenueClient()
    const { searchParams } = new URL(request.url)
    const prospectId = searchParams.get("prospectId")
    const accountId = searchParams.get("accountId")
    const stage = searchParams.get("stage")
    const status = searchParams.get("status")

    let query = supabase.from("revenue_opportunities").select("*").is("archived_at", null).order("updated_at", { ascending: false }).limit(2000)
    if (prospectId) query = query.eq("prospect_id", prospectId)
    if (accountId) query = query.eq("account_id", accountId)
    if (stage && stage !== "all") query = query.eq("stage", stage)
    if (status && status !== "all") query = query.eq("status", status)

    const { data, error } = await query
    if (error) return fail(error)
    return ok({ opportunities: data || [], source: "revenue_opportunities" })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireRevenueApiAccess("revenue.opportunities.manage")
    const supabase = await revenueClient()
    const body = await request.json()
    const payload = normalizeOpportunityPayload(body)
    if (!payload.prospect_id && !payload.account_id) return fail("Un prospect ou un compte doit être relié à l’opportunité.", 400)

    const { data, error } = await supabase
      .from("revenue_opportunities")
      .insert({ ...payload, owner_id: (access.user as any).id || null, created_by: (access.user as any).id || null, updated_by: (access.user as any).id || null })
      .select("*")
      .single()
    if (error) return fail(error)

    await supabase.from("revenue_opportunity_stage_history").insert({
      opportunity_id: data.id,
      from_stage: null,
      to_stage: data.stage,
      previous_probability: null,
      new_probability: data.probability,
      previous_value_mad: null,
      new_value_mad: data.value_mad,
      reason: "Création de l’opportunité",
      changed_by: (access.user as any).id || null,
      changed_by_name: (access.user as any).email || (access.user as any).full_name || "Revenue Command",
      metadata: { source: "opportunities_api" },
    }).then(() => undefined)

    await logRevenueActivity(supabase, {
      entityType: "opportunity",
      entityId: data.id,
      prospectId: data.prospect_id,
      eventType: "opportunity_created",
      title: `Opportunité créée : ${data.title}`,
      metadata: { valueMad: data.value_mad, stage: data.stage },
    })
    await logRevenueAction(supabase, { actionType: "create_opportunity", entityType: "opportunity", entityId: data.id, payload: body, result: { id: data.id } })
    return ok({ opportunity: data })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireRevenueApiAccess("revenue.opportunities.manage")
    const supabase = await revenueClient()
    const body = await request.json()
    const id = String(body.id || "").trim()
    if (!id) return fail("Identifiant de l’opportunité requis.", 400)

    const { data: existing, error: readError } = await supabase.from("revenue_opportunities").select("*").eq("id", id).maybeSingle()
    if (readError) return fail(readError)
    if (!existing) return fail("Opportunité introuvable.", 404)

    const payload = normalizeOpportunityPayload({ ...existing, ...body })
    const patch: Record<string, unknown> = { ...payload, updated_by: (access.user as any).id || null, updated_at: new Date().toISOString() }
    if (body.action === "archive") {
      patch.archived_at = new Date().toISOString()
      patch.status = "archived"
    }
    if (body.action === "restore") {
      patch.archived_at = null
      patch.status = "open"
    }

    const { data, error } = await supabase.from("revenue_opportunities").update(patch).eq("id", id).select("*").single()
    if (error) return fail(error)

    await logRevenueActivity(supabase, {
      entityType: "opportunity",
      entityId: id,
      prospectId: data.prospect_id,
      eventType: body.action === "archive" ? "opportunity_archived" : "opportunity_updated",
      title: body.action === "archive" ? `Opportunité archivée : ${data.title}` : `Opportunité mise à jour : ${data.title}`,
      severity: body.action === "archive" ? "warning" : "info",
      metadata: { previousStage: existing.stage, newStage: data.stage },
    })
    await logRevenueAction(supabase, { actionType: body.action === "archive" ? "archive_opportunity" : "update_opportunity", entityType: "opportunity", entityId: id, payload: body, result: { id } })
    return ok({ opportunity: data })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}
