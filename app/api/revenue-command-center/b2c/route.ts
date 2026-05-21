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
