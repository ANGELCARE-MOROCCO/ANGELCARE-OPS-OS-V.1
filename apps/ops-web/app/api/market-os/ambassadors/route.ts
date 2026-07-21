import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { createAmbassadorEntity, loadAmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return withAmbassadorActor(request, (actor) => loadAmbassadorWorkspaceSnapshot(actor))
}

export async function POST(request: Request) {
  return withAmbassadorActor(request, async (actor) => createAmbassadorEntity(actor, "ambassadors", await readBody(request)))
}
