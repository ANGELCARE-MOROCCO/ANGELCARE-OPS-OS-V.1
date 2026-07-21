import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { assignMissionToAmbassador } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  return withAmbassadorActor(request, async (actor) => assignMissionToAmbassador(actor, await readBody(request)))
}
