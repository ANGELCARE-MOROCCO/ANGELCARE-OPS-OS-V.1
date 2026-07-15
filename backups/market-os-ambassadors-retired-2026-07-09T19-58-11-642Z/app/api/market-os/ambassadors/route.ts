import { ambassadorJson, readBody } from "@/lib/market-os/ambassadors/api"
import { createAmbassadorEntity, loadAmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return ambassadorJson(await loadAmbassadorWorkspaceSnapshot())
}

export async function POST(request: Request) {
  return ambassadorJson(await createAmbassadorEntity("ambassadors", await readBody(request)))
}
