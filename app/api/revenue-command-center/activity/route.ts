import { revenueClient, ok, fail, logRevenueActivity } from "@/lib/revenue-command-center/canonical-server"
import { normalizeActivityEventFromDb } from "@/lib/revenue-command-center/operational-normalizers"
import { saveRevenueNote } from "@/lib/revenue-command-center/operational-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const supabase = await revenueClient()
  const { searchParams } = new URL(request.url)
  const entityId = searchParams.get("entityId") || searchParams.get("entity_id")
  const entityType = searchParams.get("entityType") || searchParams.get("entity_type")
  let query = supabase.from("revenue_activities").select("*").order("created_at", { ascending: false }).limit(1000)
  if (entityId && entityType === "prospect") query = query.or(`entity_id.eq.${entityId},prospect_id.eq.${entityId}`)
  else if (entityId && entityType === "partnership") query = query.or(`entity_id.eq.${entityId},partnership_id.eq.${entityId}`)
  else if (entityId) query = query.eq("entity_id", entityId)
  if (entityType === "prospect" && !entityId) query = query.or("entity_type.eq.prospect,prospect_id.not.is.null")
  else if (entityType === "partnership" && !entityId) query = query.or("entity_type.eq.partnership,partnership_id.not.is.null")
  else if (entityType) query = query.eq("entity_type", entityType)
  const { data, error } = await query
  if (error) return fail(error)
  const activities = (data || []).map(normalizeActivityEventFromDb)
  return ok({ data: activities, items: activities, activities, events: activities, source: "revenue_activities" })
}

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    if (body.action === "add_note" || body.action === "add_comment" || body.note || body.comment) {
      const note = await saveRevenueNote(supabase as any, body, { actionType: body.action === "add_comment" || body.comment ? "comment" : "note" })
      return ok({ data: note, item: note, note, comment: note.comment || null, source: "revenue_notes" })
    }
    await logRevenueActivity(supabase, {
      entityType: body.entityType || "prospect",
      entityId: body.entityId,
      prospectId: body.prospectId,
      partnershipId: body.partnershipId,
      eventType: body.eventType || "manual_note",
      title: body.title || "Revenue activity",
      body: body.body || body.note || null,
      severity: body.severity || "info",
      metadata: body.metadata || {},
    })
    return ok({ data: { saved: true }, item: { saved: true }, saved: true })
  } catch (error) {
    return fail(error)
  }
}
