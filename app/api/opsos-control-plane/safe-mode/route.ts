import { NextRequest, NextResponse } from "next/server"
import { getOpsosRuntimeConfig, mutateOpsosRuntimeConfig } from "@/lib/opsos-control-plane/runtime-config"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const snapshot = await getOpsosRuntimeConfig({
    route: params.get("route") || undefined,
    modal: params.get("modal") || undefined,
    module: params.get("module") || undefined,
  })

  return NextResponse.json({ ok: true, generatedAt: snapshot.generatedAt, safeModes: snapshot.safeModes, effective: snapshot.effective.rules, active: snapshot.effective.safeModeEnabled, source: snapshot.source })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body?.key) return NextResponse.json({ ok: false, error: "Missing safe mode key" }, { status: 400 })

  const result = await mutateOpsosRuntimeConfig({
    kind: "safe_mode",
    key: String(body.key),
    label: body.label || body.key,
    description: body.description || null,
    scope: body.scope || "global",
    target: body.target || "global",
    enabled: Boolean(body.enabled),
    rules: body.rules || {},
    risk: body.risk || "high",
    actor: body.actor || request.headers.get("x-opsos-actor") || "opsos-control-plane",
    reason: body.reason || "Safe mode updated through OPSOS Runtime Control Plane",
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
