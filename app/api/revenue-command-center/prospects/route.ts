import { revenueClient, ok, fail, cleanString, cleanNumber, logRevenueActivity, logRevenueAction } from "@/lib/revenue-command-center/canonical-server"

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
    const row = {
      name: cleanString(body.name || body.company, "Unnamed prospect"),
      company: cleanString(body.company || body.name, ""),
      city: cleanString(body.city, "Unassigned"),
      source: cleanString(body.source, "manual"),
      segment: cleanString(body.segment, "b2b"),
      stage: cleanString(body.stage, "new_lead"),
      priority: cleanString(body.priority, "medium"),
      score: cleanNumber(body.score, 0),
      value_mad: cleanNumber(body.valueMad ?? body.value_mad ?? body.value, 0),
      probability: cleanNumber(body.probability, 0),
      owner: cleanString(body.owner, "BD Officer"),
      contact_name: cleanString(body.contactName || body.contact_name, ""),
      email: cleanString(body.email, ""),
      phone: cleanString(body.phone, ""),
      data: body,
      metadata: body.metadata || {},
    }
    const { data, error } = await supabase.from("revenue_prospects").insert(row).select("*").single()
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
