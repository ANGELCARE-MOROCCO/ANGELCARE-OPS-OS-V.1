import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { assignAmbassadorTerritory } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  return withAmbassadorActor(request, async (actor) => assignAmbassadorTerritory(actor, await readBody(request)))
}
