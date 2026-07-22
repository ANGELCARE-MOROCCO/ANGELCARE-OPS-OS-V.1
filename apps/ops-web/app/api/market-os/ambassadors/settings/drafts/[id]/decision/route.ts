import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { decideSettingsApproval } from "@/lib/market-os/ambassadors/settings/server"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  return withAmbassadorActor(request, async (actor) => decideSettingsApproval(actor, id, await readBody(request)))
}
