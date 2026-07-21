import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { getAmbassadorSettings, updateAmbassadorSettings } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return withAmbassadorActor(request, (actor) => getAmbassadorSettings(actor))
}

export async function PATCH(request: Request) {
  return withAmbassadorActor(request, async (actor) => updateAmbassadorSettings(actor, await readBody(request)))
}
