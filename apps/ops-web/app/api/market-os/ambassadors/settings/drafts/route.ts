import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { createSettingsDraft } from "@/lib/market-os/ambassadors/settings/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  return withAmbassadorActor(request, async (actor) => createSettingsDraft(actor, await readBody(request)))
}
