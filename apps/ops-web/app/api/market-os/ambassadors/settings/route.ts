import { ambassadorJson, readBody } from "@/lib/market-os/ambassadors/api"
import { getAmbassadorSettings, updateAmbassadorSettings } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return ambassadorJson(await getAmbassadorSettings())
}

export async function PATCH(request: Request) {
  return ambassadorJson(await updateAmbassadorSettings(await readBody(request)))
}
