import { revenueClient, ok, fail, cleanString, cleanNumber, logRevenueActivity, logRevenueAction } from "@/lib/revenue-command-center/canonical-server"

export async function GET() {
  const supabase = await revenueClient()
  const { data, error } = await supabase.from("revenue_b2c_cases").select("*").neq("status", "archived").order("updated_at", { ascending: false }).limit(2000)
  if (error) return fail(error)
  return ok({ cases: data || [], source: "revenue_b2c_cases" })
}

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const row = {
      parent_name: cleanString(body.parentName || body.parent_name || body.name, "Unnamed parent"),
      child_age_range: cleanString(body.childAgeRange || body.child_age_range, ""),
      city: cleanString(body.city, "Unassigned"),
      service_interest: cleanString(body.serviceInterest || body.service_interest, "childcare"),
      stage: cleanString(body.stage, "inquiry"),
      priority: cleanString(body.priority, "medium"),
      estimated_value_mad: cleanNumber(body.estimatedValueMad || body.estimated_value_mad, 0),
      owner: cleanString(body.owner, "B2C Officer"),
      phone: cleanString(body.phone, ""),
      email: cleanString(body.email, ""),
      preferred_channel: cleanString(body.preferredChannel || body.preferred_channel, "whatsapp"),
      status: cleanString(body.status, "active"),
      metadata: body.metadata || {},
    }
    const { data, error } = await supabase.from("revenue_b2c_cases").insert(row).select("*").single()
    if (error) return fail(error)
    await logRevenueActivity(supabase, { entityType: "b2c", entityId: data.id, eventType: "b2c_case_created", title: `B2C case created: ${data.parent_name}`, metadata: row })
    await logRevenueAction(supabase, { actionType: "create_b2c_case", entityType: "b2c", entityId: data.id, payload: body, result: { id: data.id } })
    return ok({ case: data })
  } catch (error) {
    return fail(error)
  }
}


export async function PATCH(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    if (!body.id) return fail("Missing B2C case id", 400)
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    for (const [from, to] of Object.entries({
      parentName: "parent_name",
      parent_name: "parent_name",
      childAgeRange: "child_age_range",
      child_age_range: "child_age_range",
      city: "city",
      serviceInterest: "service_interest",
      service_interest: "service_interest",
      stage: "stage",
      priority: "priority",
      urgency: "urgency",
      owner: "owner",
      phone: "phone",
      email: "email",
      preferredChannel: "preferred_channel",
      preferred_channel: "preferred_channel",
      status: "status",
      intakeStatus: "intake_status",
      intake_status: "intake_status",
      consultationStatus: "consultation_status",
      consultation_status: "consultation_status",
      quoteStatus: "quote_status",
      quote_status: "quote_status",
      matchingStatus: "matching_status",
      matching_status: "matching_status",
      careStartStatus: "care_start_status",
      care_start_status: "care_start_status",
      nextAction: "next_action",
      next_action: "next_action",
      notes: "notes",
    })) {
      if (body[from] !== undefined) patch[to] = body[from]
    }
    if (body.estimatedValueMad !== undefined || body.estimated_value_mad !== undefined || body.valueMad !== undefined || body.value !== undefined) {
      patch.estimated_value_mad = cleanNumber(body.estimatedValueMad ?? body.estimated_value_mad ?? body.valueMad ?? body.value, 0)
    }
    if (body.metadata !== undefined) patch.metadata = body.metadata
    if (String(body.mode || body.action || "") === "archive") {
      patch.status = "archived"
      patch.archived_at = new Date().toISOString()
    }
    const { data, error } = await supabase.from("revenue_b2c_cases").update(patch).eq("id", body.id).select("*").single()
    if (error) return fail(error)
    await logRevenueActivity(supabase, { entityType: "b2c", entityId: data.id, eventType: "b2c_case_updated", title: `B2C case updated: ${data.parent_name}`, metadata: { patch } })
    await logRevenueAction(supabase, { actionType: "update_b2c_case", entityType: "b2c", entityId: data.id, payload: body, result: { id: data.id } })
    return ok({ case: data })
  } catch (error) {
    return fail(error)
  }
}
