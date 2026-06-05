import { revenueClient, ok, fail, cleanString, cleanNumber, normalizeRevenueProspectPayload, ensureRevenueProspect, logRevenueActivity, logRevenueAction } from "@/lib/revenue-command-center/canonical-server"

export async function GET(request: Request) {
  const supabase = await revenueClient()
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get("stage")
  const city = searchParams.get("city")
  const limit = Math.min(Number(searchParams.get("limit") || 500), 5000)

  let query = supabase.from("revenue_prospects").select("*").neq("status", "archived").order("updated_at", { ascending: false }).limit(limit)
  if (stage && stage !== "all") query = query.eq("stage", stage)
  if (city && city !== "all") query = query.eq("city", city)

  const { data, error } = await query
  if (error) return fail(error)
  return ok({ prospects: data || [], source: "revenue_prospects" })
}

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const explicitId = cleanString(body.id || body.prospectId || body.entityId, "")
    let data: any = null
    let error: any = null
    if (explicitId) {
      data = await ensureRevenueProspect(supabase, explicitId, body)
    } else {
      const row = normalizeRevenueProspectPayload(body)
      const insertPayload: Record<string, unknown> = { ...row }
      delete insertPayload.id
      const inserted = await supabase.from("revenue_prospects").insert(insertPayload).select("*").single()
      data = inserted.data
      error = inserted.error
      if (error && /column .* does not exist/i.test(error.message || "")) {
        const minimalPayload: Record<string, unknown> = {
          name: row.name,
          city: row.city,
          stage: row.stage,
          priority: row.priority,
          value_mad: row.value_mad,
          score: row.score,
          data: row.data,
        }
        const fallback = await supabase.from("revenue_prospects").insert(minimalPayload).select("*").single()
        data = fallback.data
        error = fallback.error
      }
    }
    if (error) return fail(error)
    await logRevenueActivity(supabase, { entityType: "prospect", entityId: data.id, prospectId: data.id, eventType: "prospect_created", title: `Prospect created: ${data.name}`, metadata: { source: "canonical_api" } })
    await logRevenueAction(supabase, { actionType: "create_prospect", entityType: "prospect", entityId: data.id, payload: body, result: { id: data.id } })
    return ok({ prospect: data })
  } catch (error) {
    return fail(error)
  }
}

export async function PATCH(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    if (!body.id) return fail("Missing prospect id", 400)
    if (body.mode === "archive" || body.action === "archive") {
      const { data, error } = await supabase.from("revenue_prospects").update({ status: "archived", archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", body.id).select("*").single()
      if (error) return fail(error)
      await logRevenueActivity(supabase, { entityType: "prospect", entityId: data.id, prospectId: data.prospect_id || null, eventType: "prospect_archived", title: `prospect archived: ${data.name || data.id}`, severity: "warning", metadata: { table: "revenue_prospects" } })
      await logRevenueAction(supabase, { actionType: "archive_prospect", entityType: "prospect", entityId: data.id, payload: body, result: { id: data.id } })
      return ok({ prospect: data })
    }
    if (body.mode === "restore" || body.action === "restore") {
      const { data, error } = await supabase.from("revenue_prospects").update({ status: "active", archived_at: null, updated_at: new Date().toISOString() }).eq("id", body.id).select("*").single()
      if (error) return fail(error)
      await logRevenueActivity(supabase, { entityType: "prospect", entityId: data.id, prospectId: data.prospect_id || null, eventType: "prospect_restored", title: `prospect restored: ${data.name || data.id}`, metadata: { table: "revenue_prospects" } })
      await logRevenueAction(supabase, { actionType: "restore_prospect", entityType: "prospect", entityId: data.id, payload: body, result: { id: data.id } })
      return ok({ prospect: data })
    }
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: null,
    }
    for (const [from, to] of Object.entries({ name:"name", company:"company", city:"city", source:"source", segment:"segment", stage:"stage", priority:"priority", score:"score", probability:"probability", owner:"owner", contactName:"contact_name", email:"email", phone:"phone", status:"status" })) {
      if (body[from] !== undefined) patch[to] = body[from]
    }
    if (body.valueMad !== undefined || body.value_mad !== undefined || body.value !== undefined) patch.value_mad = cleanNumber(body.valueMad ?? body.value_mad ?? body.value, 0)
    if (body.metadata !== undefined) patch.metadata = body.metadata
    const { data, error } = await supabase.from("revenue_prospects").update(patch).eq("id", body.id).select("*").single()
    if (error) return fail(error)
    await logRevenueActivity(supabase, { entityType: "prospect", entityId: data.id, prospectId: data.id, eventType: "prospect_updated", title: `Prospect updated: ${data.name}`, metadata: { patch } })
    await logRevenueAction(supabase, { actionType: "update_prospect", entityType: "prospect", entityId: data.id, payload: body, result: { id: data.id } })
    return ok({ prospect: data })
  } catch (error) {
    return fail(error)
  }
}


export async function DELETE(request: Request) {
  const supabase = await revenueClient()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return fail("Missing prospect id", 400)
    const { data, error } = await supabase.from("revenue_prospects").update({ status: "archived", archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select("*").single()
    if (error) return fail(error)
    await logRevenueActivity(supabase, { entityType: "prospect", entityId: data.id, prospectId: data.prospect_id || null, eventType: "prospect_archived", title: `prospect archived: ${data.name || data.id}`, severity: "warning", metadata: { table: "revenue_prospects" } })
    await logRevenueAction(supabase, { actionType: "archive_prospect", entityType: "prospect", entityId: data.id, payload: { id }, result: { id: data.id } })
    return ok({ prospect: data })
  } catch (error) {
    return fail(error)
  }
}
