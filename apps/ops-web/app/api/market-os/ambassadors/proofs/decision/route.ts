import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { decideProof } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request) {
  return withAmbassadorActor(request, async (actor) => decideProof(actor, await readBody(request)))
}
