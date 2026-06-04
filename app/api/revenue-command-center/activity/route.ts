import { revenueClient, ok, fail, logRevenueActivity } from "@/lib/revenue-command-center/canonical-server"

export async function GET(request: Request) {
  const supabase = await revenueClient()
  const { searchParams } = new URL(request.url)
  const entityId = searchParams.get("entityId")
  let query = supabase.from("revenue_activities").select("*").order("created_at", { ascending: false }).limit(1000)
  if (entityId) query = query.eq("entity_id", entityId)
  const { data, error } = await query
  if (error) return fail(error)
  return ok({ activities: data || [], source: "revenue_activities" })
}

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    await logRevenueActivity(supabase, {
      entityType: body.entityType || "prospect",
      entityId: body.entityId,
      prospectId: body.prospectId,
      eventType: body.eventType || "manual_note",
      title: body.title || "Revenue activity",
      body: body.body || body.note || null,
      severity: body.severity || "info",
      metadata: body.metadata || {},
    })
    return ok({ saved: true })
  } catch (error) {
    return fail(error)
  }
}
