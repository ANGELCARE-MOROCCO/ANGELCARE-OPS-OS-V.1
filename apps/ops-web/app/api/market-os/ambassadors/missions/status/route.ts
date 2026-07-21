import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { updateMissionStatus } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request) {
  return withAmbassadorActor(request, async (actor) => updateMissionStatus(actor, await readBody(request)))
}
