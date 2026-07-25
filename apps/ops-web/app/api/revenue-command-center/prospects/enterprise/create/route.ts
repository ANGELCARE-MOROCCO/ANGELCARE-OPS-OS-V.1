import { fail, ok, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess, revenueAccessFailure } from "@/lib/revenue-command-center/api-access"

export async function POST(request: Request) {
  try {
    const access = await requireRevenueApiAccess("revenue.prospects.manage")
    const body = await request.json()
    const name = String(body.name || body.company || "").trim()
    if (!name) return fail("Le nom du prospect ou de l’organisation est requis.", 400)

    const supabase = await revenueClient()
    const actor = access.user as any
    const { data, error } = await supabase.rpc("revenue_create_enterprise_prospect_dossier", {
      payload: body,
      p_actor_id: actor.id || null,
      p_actor_name: actor.email || actor.full_name || "Revenue Command",
    })
    if (error) return fail(error)

    return ok({ dossier: data, source: "revenue_create_enterprise_prospect_dossier" })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}
