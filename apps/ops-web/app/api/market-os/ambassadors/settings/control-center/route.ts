import { withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { loadSettingsControlCenter } from "@/lib/market-os/ambassadors/settings/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return withAmbassadorActor(request, (actor) => loadSettingsControlCenter(actor))
}
