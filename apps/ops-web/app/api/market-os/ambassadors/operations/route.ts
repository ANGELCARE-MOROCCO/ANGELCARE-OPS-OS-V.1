import { ambassadorJson, readBody } from "@/lib/market-os/ambassadors/api"
import { loadAmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const result = await loadAmbassadorWorkspaceSnapshot()
  return ambassadorJson({
    ok: result.ok,
    source: result.source,
    data: result.snapshot,
    operations: result.snapshot,
    diagnostics: result.diagnostics || [],
    loadedAt: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  const payload = await readBody(request)
  const result = await loadAmbassadorWorkspaceSnapshot()
  return ambassadorJson({
    ok: true,
    source: result.source,
    payload,
    data: result.snapshot,
    operations: result.snapshot,
    diagnostics: result.diagnostics || [],
    loadedAt: new Date().toISOString(),
  })
}
