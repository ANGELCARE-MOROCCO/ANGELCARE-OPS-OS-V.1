import { ambassadorJson, readBody } from "@/lib/market-os/ambassadors/api"
import { assignMissionToAmbassador } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  return ambassadorJson(await assignMissionToAmbassador(await readBody(request)))
}
