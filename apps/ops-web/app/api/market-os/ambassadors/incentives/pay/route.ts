import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { decideIncentive } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request) {
  return withAmbassadorActor(request, async (actor) => decideIncentive(actor, await readBody(request), "paid"))
}
