import { ambassadorJson, readBody } from "@/lib/market-os/ambassadors/api"
import { assignAmbassadorTerritory } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  return ambassadorJson(await assignAmbassadorTerritory(await readBody(request)))
}
