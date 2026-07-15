import { NextRequest, NextResponse } from "next/server"
import { getOpsosRuntimeConfig, mutateOpsosRuntimeConfig } from "@/lib/opsos-control-plane/runtime-config"
import type { OpsosRuntimeMutation } from "@/lib/opsos-control-plane/runtime-types"

export const dynamic = "force-dynamic"

function unauthorizedIfControlTokenInvalid(request: NextRequest) {
  const requiredToken = process.env.OPSOS_CONTROL_PLANE_ADMIN_TOKEN
  if (!requiredToken) return null
  const provided = request.headers.get("x-opsos-control-token") || request.nextUrl.searchParams.get("token") || ""
  if (provided !== requiredToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized OPSOS runtime control token" }, { status: 401 })
  }
  return null
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const snapshot = await getOpsosRuntimeConfig({
    route: params.get("route") || undefined,
    modal: params.get("modal") || undefined,
    module: params.get("module") || undefined,
    api: params.get("api") || undefined,
    userId: params.get("userId") || undefined,
  })

  return NextResponse.json(snapshot)
}

export async function POST(request: NextRequest) {
  const unauthorized = unauthorizedIfControlTokenInvalid(request)
  if (unauthorized) return unauthorized

  const body = (await request.json().catch(() => null)) as OpsosRuntimeMutation | null
  if (!body || !body.kind || !body.key) {
    return NextResponse.json({ ok: false, error: "Invalid runtime mutation payload" }, { status: 400 })
  }

  const result = await mutateOpsosRuntimeConfig({
    ...body,
    actor: body.actor || request.headers.get("x-opsos-actor") || "opsos-control-plane",
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
