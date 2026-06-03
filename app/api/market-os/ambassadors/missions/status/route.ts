import { ambassadorJson, readBody } from "@/lib/market-os/ambassadors/api"
import { updateMissionStatus } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request) {
  return ambassadorJson(await updateMissionStatus(await readBody(request)))
}
