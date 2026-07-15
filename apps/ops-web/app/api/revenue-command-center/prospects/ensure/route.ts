import { ensureRevenueProspect, fail, ok, revenueClient } from "@/lib/revenue-command-center/canonical-server"

export async function POST(request: Request) {
  const supabase = await revenueClient()
  try {
    const body = await request.json()
    const prospectId = body.id || body.prospectId || body.entityId || body?.prospect?.id || body?.snapshot?.id
    if (!prospectId) return fail("Missing prospect id", 400)
    const snapshot = body.snapshot || body.prospect || body
    const prospect = await ensureRevenueProspect(supabase, String(prospectId), snapshot)
    return ok({ prospect, source: "revenue_prospects", ensured: true })
  } catch (error) {
    return fail(error)
  }
}
