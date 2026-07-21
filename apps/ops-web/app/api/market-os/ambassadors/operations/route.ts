import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { loadAmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return withAmbassadorActor(request, async (actor) => {
    const result = await loadAmbassadorWorkspaceSnapshot(actor)
    return {
      ...result,
      data: result.snapshot,
      operations: result.snapshot,
      loadedAt: new Date().toISOString(),
    }
  })
}

export async function POST(request: Request) {
  return withAmbassadorActor(request, async (actor) => {
    const payload = await readBody(request)
    const result = await loadAmbassadorWorkspaceSnapshot(actor)
    return {
      ...result,
      payload,
      data: result.snapshot,
      operations: result.snapshot,
      loadedAt: new Date().toISOString(),
    }
  })
}
