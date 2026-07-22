import { withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { processScheduledSettingsPublications } from "@/lib/market-os/ambassadors/settings/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  return withAmbassadorActor(request, (actor) => processScheduledSettingsPublications(actor))
}
