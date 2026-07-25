import { fail, ok, cleanString } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import {
  normalizeReferralPayload,
  partnershipContext,
  recordPartnershipEvent,
  updateRow,
} from "@/lib/revenue-command-center/partnership-enterprise/server"

export async function GET(request: Request) {
  try {
    const { supabase } = await partnershipContext("revenue.partnerships.referrals.read")
    const partnerId = new URL(request.url).searchParams.get("partnershipId")
    let query = supabase.from("revenue_partner_referrals").select("*").order("received_at", { ascending: false })
    if (partnerId) query = query.eq("partnership_id", partnerId)
    const result = await query
    if (result.error) return fail(result.error)
    return ok({ referrals: result.data || [] })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}

async function referralDuplicates(supabase: any, row: ReturnType<typeof normalizeReferralPayload>) {
  const candidates = new Map<string, any>()
  if (row.normalized_email) {
    const result = await supabase
      .from("revenue_partner_referrals")
      .select("id,status,partnership_id,referred_name,normalized_email,normalized_phone")
      .eq("normalized_email", row.normalized_email)
      .limit(20)
    if (result.error) throw result.error
    for (const candidate of result.data || []) candidates.set(candidate.id, candidate)
  }
  if (row.normalized_phone) {
    const result = await supabase
      .from("revenue_partner_referrals")
      .select("id,status,partnership_id,referred_name,normalized_email,normalized_phone")
      .eq("normalized_phone", row.normalized_phone)
      .limit(20)
    if (result.error) throw result.error
    for (const candidate of result.data || []) candidates.set(candidate.id, candidate)
  }
  return [...candidates.values()]
}

async function existingProspect(supabase: any, row: ReturnType<typeof normalizeReferralPayload>) {
  if (row.normalized_email) {
    const result = await supabase
      .from("revenue_prospects")
      .select("id,name,email,phone,created_at")
      .ilike("email", row.normalized_email)
      .order("created_at", { ascending: true })
      .limit(1)
    if (result.error) throw result.error
    if (result.data?.[0]) return result.data[0]
  }
  if (row.normalized_phone) {
    const result = await supabase
      .from("revenue_prospects")
      .select("id,name,email,phone,created_at")
      .eq("phone", row.phone)
      .order("created_at", { ascending: true })
      .limit(1)
    if (result.error) throw result.error
    if (result.data?.[0]) return result.data[0]
  }
  return null
}

export async function POST(request: Request) {
  try {
    const { access, supabase } = await partnershipContext("revenue.partnerships.referrals.manage")
    const body = await request.json()
    const row = normalizeReferralPayload(body)
    if (!row.partnership_id) return fail("partnershipId requis.", 400)
    if (!row.referred_name.trim()) return fail("Le nom du referral est requis.", 400)
    if (!row.normalized_email && !row.normalized_phone && !row.source_evidence) {
      return fail("Un moyen de contact ou une preuve source est requis.", 400)
    }

    const actorId = (access.user as any).id || null
    const [duplicates, prospect] = await Promise.all([
      referralDuplicates(supabase, row),
      existingProspect(supabase, row),
    ])
    const duplicateReferral = duplicates[0] || null
    const needsReview = Boolean(duplicateReferral || prospect)

    const result = await supabase
      .from("revenue_partner_referrals")
      .insert({
        ...row,
        status: needsReview ? "duplicate_review" : row.status,
        duplicate_of_referral_id: duplicateReferral?.id || null,
        linked_prospect_id: prospect?.id || row.linked_prospect_id,
        created_by: actorId,
        updated_by: actorId,
      })
      .select("*")
      .single()
    if (result.error) return fail(result.error)

    if (prospect) {
      const conflict = await supabase.from("revenue_partner_attribution_conflicts").insert({
        partnership_id: row.partnership_id,
        referral_id: result.data.id,
        conflict_type: "pre_existing_prospect",
        description: "Le referral correspond à un prospect existant. Une décision d’attribution est obligatoire.",
        existing_prospect_id: prospect.id,
        value_at_risk_mad: row.estimated_value_mad,
        status: "open",
        created_by: actorId,
      })
      if (conflict.error) return fail(conflict.error)
    }

    await recordPartnershipEvent(supabase, {
      partnershipId: row.partnership_id,
      eventType: needsReview ? "partner_referral_duplicate_review" : "partner_referral_registered",
      title: `${needsReview ? "Referral à arbitrer" : "Referral enregistré"} : ${row.referred_name}`,
      payload: body,
      result: { id: result.data.id, duplicateReferralId: duplicateReferral?.id || null, prospectId: prospect?.id || null },
      actorId,
      severity: needsReview ? "warning" : "info",
    })
    return ok({
      referral: result.data,
      duplicate: needsReview,
      referralCandidates: duplicates,
      existingProspect: prospect,
    })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { access, supabase } = await partnershipContext("revenue.partnerships.referrals.manage")
    const body = await request.json()
    const id = String(body.referralId || body.id || "")
    if (!id) return fail("referralId requis.", 400)
    const payload: Record<string, unknown> = {
      updated_by: (access.user as any).id || null,
      updated_at: new Date().toISOString(),
    }
    for (const key of ["status", "linked_prospect_id", "linked_opportunity_id", "owner", "consent_status", "source_evidence", "metadata"]) {
      if (body[key] !== undefined) payload[key] = body[key]
    }
    if (body.prospectId !== undefined) payload.linked_prospect_id = cleanString(body.prospectId) || null
    if (body.opportunityId !== undefined) payload.linked_opportunity_id = cleanString(body.opportunityId) || null
    if (body.reason) payload.metadata = { ...(typeof body.metadata === "object" ? body.metadata : {}), reason: cleanString(body.reason) }
    const data = await updateRow(supabase, "revenue_partner_referrals", id, payload)
    return ok({ referral: data })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}
