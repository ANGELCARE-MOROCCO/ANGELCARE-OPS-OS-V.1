import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { completeOnboardingStep } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request) {
  return withAmbassadorActor(request, async (actor) => completeOnboardingStep(actor, await readBody(request)))
}
