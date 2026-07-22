import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { getSettingsDraft, updateSettingsDraft } from "@/lib/market-os/ambassadors/settings/server"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  return withAmbassadorActor(request, (actor) => getSettingsDraft(actor, id))
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  return withAmbassadorActor(request, async (actor) => updateSettingsDraft(actor, id, await readBody(request)))
}
