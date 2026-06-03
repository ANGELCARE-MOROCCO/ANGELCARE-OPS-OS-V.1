import { fail, ok, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { normalizeActivityEventFromDb } from "@/lib/revenue-command-center/operational-normalizers"
import { saveRevenueNote } from "@/lib/revenue-command-center/operational-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const supabase = await revenueClient()
  const { searchParams } = new URL(request.url)
  const entityId = searchParams.get("entityId") || searchParams.get("entity_id")
  const entityType = searchParams.get("entityType") || searchParams.get("entity_type")
  const prospectId = searchParams.get("prospectId") || searchParams.get("prospect_id")
  const partnershipId = searchParams.get("partnershipId") || searchParams.get("partnership_id")
  const limit = Math.min(Number(searchParams.get("limit") || 500), 1000)

  let query = supabase.from("revenue_notes").select("*").order("created_at", { ascending: false }).limit(limit)
  if (entityId) query = query.eq("entity_id", entityId)
  if (entityType) query = query.eq("entity_type", entityType)
  if (prospectId) query = query.eq("prospect_id", prospectId)
  if (partnershipId) query = query.eq("partnership_id", partnershipId)

  const { data, error, count } = await query
  if (error) return fail(error)
  const notes = (data || []).map((row) => ({
    ...row,
    event: normalizeActivityEventFromDb({
      ...row,
      event_type: row.note_type === "comment" ? "comment_added" : "note_added",
      title: row.note_type === "comment" ? "Comment" : "Note",
      body: row.body,
    }),
  }))
  return ok({ data: notes, items: notes, notes, count: count ?? notes.length, source: "revenue_notes" })
}

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const note = await saveRevenueNote(supabase as any, body, { actionType: String(body.noteType || body.note_type || body.type || "note").includes("comment") ? "comment" : "note" })
    return ok({ data: note, item: note, note, comment: note.comment || null, source: "revenue_notes" })
  } catch (error) {
    return fail(error)
  }
}
