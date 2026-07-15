import { ambassadorJson, readBody } from "@/lib/market-os/ambassadors/api"
import { decideIncentive } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request) {
  return ambassadorJson(await decideIncentive(await readBody(request), "approved"))
}
