import { revenueClient, ok, fail, cleanString, cleanNumber, logRevenueActivity, logRevenueAction } from "@/lib/revenue-command-center/canonical-server"

export async function GET() {
  const supabase = await revenueClient()
  const { data, error } = await supabase.from("revenue_partnerships").select("*").neq("status", "archived").order("updated_at", { ascending: false }).limit(2000)
  if (error) return fail(error)
  return ok({ partnerships: data || [], source: "revenue_partnerships" })
}

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const row = {
      partner_name: cleanString(body.partnerName || body.partner_name || body.name, "Unnamed partner"),
      partner_type: cleanString(body.partnerType || body.partner_type, "kindergarten"),
      city: cleanString(body.city, "Unassigned"),
      stage: cleanString(body.stage, "targeted"),
      priority: cleanString(body.priority, "medium"),
      estimated_value_mad: cleanNumber(body.estimatedValueMad || body.estimated_value_mad, 0),
      owner: cleanString(body.owner, "Partnership Officer"),
      contact_name: cleanString(body.contactName || body.contact_name, ""),
      phone: cleanString(body.phone, ""),
      email: cleanString(body.email, ""),
      status: cleanString(body.status, "active"),
      metadata: body.metadata || {},
    }
    const { data, error } = await supabase.from("revenue_partnerships").insert(row).select("*").single()
    if (error) return fail(error)
    await logRevenueActivity(supabase, { entityType: "partnership", entityId: data.id, eventType: "partnership_created", title: `Partnership created: ${data.partner_name}`, metadata: row })
    await logRevenueAction(supabase, { actionType: "create_partnership", entityType: "partnership", entityId: data.id, payload: body, result: { id: data.id } })
    return ok({ partnership: data })
  } catch (error) {
    return fail(error)
  }
}
