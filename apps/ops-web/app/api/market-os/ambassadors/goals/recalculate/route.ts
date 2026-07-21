import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { recalculateGoal } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request) {
  return withAmbassadorActor(request, async (actor) => recalculateGoal(actor, await readBody(request)))
}
