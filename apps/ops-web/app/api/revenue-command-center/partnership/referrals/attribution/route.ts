import { fail, ok, cleanNumber, cleanString } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { partnershipContext } from "@/lib/revenue-command-center/partnership-enterprise/server"

const EVENT_TYPES = new Set([
  "prospect_created",
  "opportunity_created",
  "meeting_completed",
  "proposal_created",
  "contract_signed",
  "payment_confirmed",
  "revenue_realized",
])

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const permission = cleanString(body.overrideReason)
      ? "revenue.partnerships.attribution.override"
      : "revenue.partnerships.attribution.manage"
    const { access, supabase } = await partnershipContext(permission)
    const referralId = cleanString(body.referralId)
    const eventType = cleanString(body.eventType)
    const eventId = cleanString(body.eventId)
    const evidenceReference = cleanString(body.evidenceReference)
    const overrideReason = cleanString(body.overrideReason)
    if (!referralId || !eventType || !eventId) return fail("referralId, eventType et eventId sont requis.", 400)
    if (!EVENT_TYPES.has(eventType)) return fail("Type d’événement d’attribution non autorisé.", 400)
    if (!evidenceReference) return fail("Une preuve d’attribution est requise.", 400)
    if (body.overrideReason !== undefined && !overrideReason) return fail("La justification de l’override est requise.", 400)

    const share = cleanNumber(body.attributionShare, 100)
    if (!(share > 0 && share <= 100)) return fail("La part d’attribution doit être comprise entre 0 et 100.", 400)

    const rpc = await supabase.rpc("revenue_create_partner_attribution", {
      p_referral_id: referralId,
      p_event_type: eventType,
      p_event_id: eventId,
      p_attribution_share: share,
      p_value_mad: Math.max(0, cleanNumber(body.valueMad, 0)),
      p_evidence_reference: evidenceReference,
      p_override_reason: overrideReason || null,
      p_actor_id: (access.user as any).id || null,
    })
    if (rpc.error) return fail(rpc.error)
    return ok({ result: Array.isArray(rpc.data) ? rpc.data[0] : rpc.data })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}
