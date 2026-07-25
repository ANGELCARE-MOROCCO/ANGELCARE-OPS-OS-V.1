import { fail, logRevenueAction, logRevenueActivity, ok, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess, revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { normalizeContactPayload } from "@/lib/revenue-command-center/enterprise-server"

export async function GET(request: Request) {
  try {
    await requireRevenueApiAccess(["revenue.contacts.read", "revenue.prospects.read"])
    const supabase = await revenueClient()
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("accountId")
    const prospectId = searchParams.get("prospectId")
    const opportunityId = searchParams.get("opportunityId")
    const q = (searchParams.get("q") || "").trim()

    let query = supabase.from("revenue_contacts").select("*").is("archived_at", null).order("updated_at", { ascending: false }).limit(1000)
    if (accountId) query = query.eq("account_id", accountId)
    if (q) {
      const escaped = q.replace(/[%_,]/g, " ").trim()
      query = query.or(`full_name.ilike.%${escaped}%,role_title.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`)
    }
    const contactsResult = await query
    if (contactsResult.error) return fail(contactsResult.error)

    let relationships: any[] = []
    if (prospectId || opportunityId) {
      let relationshipQuery = supabase.from("revenue_contact_relationships").select("*").eq("status", "active")
      if (prospectId) relationshipQuery = relationshipQuery.eq("prospect_id", prospectId)
      if (opportunityId) relationshipQuery = relationshipQuery.eq("opportunity_id", opportunityId)
      const result = await relationshipQuery
      if (!result.error) relationships = result.data || []
    }

    return ok({ contacts: contactsResult.data || [], relationships, source: "revenue_contacts" })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireRevenueApiAccess("revenue.contacts.manage")
    const supabase = await revenueClient()
    const body = await request.json()
    const payload = normalizeContactPayload(body)
    const { data, error } = await supabase
      .from("revenue_contacts")
      .insert({ ...payload, owner_id: (access.user as any).id || null })
      .select("*")
      .single()
    if (error) return fail(error)

    const relationshipAccountId = String(body.accountId || payload.account_id || "").trim()
    let relationshipWarning: string | null = null
    if (relationshipAccountId && (body.prospectId || body.opportunityId || body.accountId || payload.account_id)) {
      const relationshipResult = await supabase.from("revenue_contact_relationships").insert({
        contact_id: data.id,
        account_id: relationshipAccountId,
        prospect_id: body.prospectId || null,
        opportunity_id: body.opportunityId || null,
        relationship_type: body.relationshipType || "stakeholder",
        decision_role: body.decisionRole || payload.decision_role,
        influence_level: body.influenceLevel || payload.influence_level,
        authority_level: body.authorityLevel || "unknown",
        relationship_strength: Math.max(0, Math.min(100, Number(body.relationshipStrength || 0))),
        is_primary: Boolean(body.isPrimary),
        notes: body.relationshipNotes || null,
        created_by: (access.user as any).id || null,
        updated_by: (access.user as any).id || null,
      })
      if (relationshipResult.error) relationshipWarning = relationshipResult.error.message
    }

    await logRevenueActivity(supabase, {
      entityType: "contact",
      entityId: data.id,
      eventType: "contact_created",
      title: `Contact créé : ${data.full_name}`,
      metadata: { accountId: data.account_id },
    })
    await logRevenueAction(supabase, {
      actionType: "create_contact",
      entityType: "contact",
      entityId: data.id,
      payload: body,
      result: { id: data.id, relationshipWarning },
    })
    return ok({ contact: data, relationshipWarning })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireRevenueApiAccess("revenue.contacts.manage")
    const supabase = await revenueClient()
    const body = await request.json()
    const id = String(body.id || "").trim()
    if (!id) return fail("Identifiant du contact requis.", 400)
    const { data: existing, error: readError } = await supabase.from("revenue_contacts").select("*").eq("id", id).maybeSingle()
    if (readError) return fail(readError)
    if (!existing) return fail("Contact introuvable.", 404)

    const payload = normalizeContactPayload({ ...existing, ...body })
    const patch: Record<string, unknown> = { ...payload, owner_id: (access.user as any).id || existing.owner_id || null, updated_at: new Date().toISOString() }
    if (body.action === "archive") {
      patch.status = "archived"
      patch.archived_at = new Date().toISOString()
    }
    if (body.action === "restore") {
      patch.status = "active"
      patch.archived_at = null
    }
    const { data, error } = await supabase.from("revenue_contacts").update(patch).eq("id", id).select("*").single()
    if (error) return fail(error)
    await logRevenueActivity(supabase, {
      entityType: "contact",
      entityId: id,
      eventType: body.action === "archive" ? "contact_archived" : "contact_updated",
      title: body.action === "archive" ? `Contact archivé : ${data.full_name}` : `Contact mis à jour : ${data.full_name}`,
      severity: body.action === "archive" ? "warning" : "info",
    })
    await logRevenueAction(supabase, { actionType: body.action === "archive" ? "archive_contact" : "update_contact", entityType: "contact", entityId: id, payload: body, result: { id } })
    return ok({ contact: data })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}
