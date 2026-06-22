import { ambassadorJson } from "@/lib/market-os/ambassadors/api"
import { loadAmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return ambassadorJson(await loadAmbassadorWorkspaceSnapshot())
}
