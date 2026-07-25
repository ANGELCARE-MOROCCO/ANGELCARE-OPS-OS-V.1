import { fail, logRevenueAction, logRevenueActivity, ok, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess, revenueAccessFailure } from "@/lib/revenue-command-center/api-access"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireRevenueApiAccess("revenue.prospects.decision_map.manage")
    const { id } = await params
    const supabase = await revenueClient()
    const body = await request.json()
    const contactId = String(body.contactId || "").trim()
    if (!contactId) return fail("Contact requis pour la cartographie décisionnelle.", 400)

    const { data: prospect, error: prospectError } = await supabase.from("revenue_prospects").select("id,account_id,name").eq("id", id).maybeSingle()
    if (prospectError) return fail(prospectError)
    if (!prospect) return fail("Prospect introuvable.", 404)

    const payload = {
      account_id: body.accountId || prospect.account_id || null,
      prospect_id: id,
      opportunity_id: body.opportunityId || null,
      contact_id: contactId,
      member_role: body.memberRole || "influencer",
      influence_score: Number(body.influenceScore || 0),
      support_level: body.supportLevel || "neutral",
      access_level: body.accessLevel || "unknown",
      relationship_owner: body.relationshipOwner || null,
      engagement_strategy: body.engagementStrategy || null,
      risk_notes: body.riskNotes || null,
      next_action: body.nextAction || null,
      next_action_at: body.nextActionAt || null,
      status: body.status || "active",
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
      created_by: (access.user as any).id || null,
      updated_by: (access.user as any).id || null,
    }

    const memberId = String(body.id || "").trim()
    const result = memberId
      ? await supabase.from("revenue_decision_map_members").update(payload).eq("id", memberId).select("*, revenue_contacts(*)").single()
      : await supabase.from("revenue_decision_map_members").insert(payload).select("*, revenue_contacts(*)").single()
    if (result.error) return fail(result.error)

    await logRevenueActivity(supabase, {
      entityType: "prospect",
      entityId: id,
      prospectId: id,
      eventType: memberId ? "decision_map_member_updated" : "decision_map_member_added",
      title: memberId ? `Membre de décision mis à jour : ${prospect.name}` : `Membre ajouté à la décision : ${prospect.name}`,
      metadata: { memberId: result.data.id, contactId },
    })
    await logRevenueAction(supabase, {
      actionType: memberId ? "update_decision_map_member" : "create_decision_map_member",
      entityType: "prospect",
      entityId: id,
      payload: body,
      result: { id: result.data.id },
    })
    return ok({ member: result.data })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRevenueApiAccess("revenue.prospects.decision_map.manage")
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")
    if (!memberId) return fail("Membre de décision requis.", 400)
    const supabase = await revenueClient()
    const { data, error } = await supabase.from("revenue_decision_map_members").update({ status: "inactive", updated_at: new Date().toISOString() }).eq("id", memberId).eq("prospect_id", id).select("*").single()
    if (error) return fail(error)
    await logRevenueActivity(supabase, { entityType: "prospect", entityId: id, prospectId: id, eventType: "decision_map_member_removed", title: "Membre retiré de la cartographie décisionnelle", severity: "warning", metadata: { memberId } })
    return ok({ member: data })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}
