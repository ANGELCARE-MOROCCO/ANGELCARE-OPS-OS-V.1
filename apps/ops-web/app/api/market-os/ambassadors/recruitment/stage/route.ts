import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { moveRecruitmentStage } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request) {
  return withAmbassadorActor(request, async (actor) => moveRecruitmentStage(actor, await readBody(request)))
}
