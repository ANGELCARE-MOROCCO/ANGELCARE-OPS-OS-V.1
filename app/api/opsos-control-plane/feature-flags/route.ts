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

  return NextResponse.json({ ok: true, generatedAt: snapshot.generatedAt, flags: snapshot.flags, effective: snapshot.effective.featureFlags, source: snapshot.source })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body?.key) return NextResponse.json({ ok: false, error: "Missing feature flag key" }, { status: 400 })

  const result = await mutateOpsosRuntimeConfig({
    kind: "feature_flag",
    key: String(body.key),
    label: body.label || body.key,
    description: body.description || null,
    scope: body.scope || "global",
    target: body.target || "global",
    enabled: Boolean(body.enabled),
    rollout: Number(body.rollout ?? (body.enabled ? 100 : 0)),
    audience: body.audience || "all",
    risk: body.risk || "medium",
    actor: body.actor || request.headers.get("x-opsos-actor") || "opsos-control-plane",
    reason: body.reason || "Feature flag updated through OPSOS Runtime Control Plane",
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
