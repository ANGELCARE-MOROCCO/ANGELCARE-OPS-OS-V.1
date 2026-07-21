import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { decideTerritoryAssignment } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  return withAmbassadorActor(request, async (actor) => decideTerritoryAssignment(actor, await readBody(request)))
}
