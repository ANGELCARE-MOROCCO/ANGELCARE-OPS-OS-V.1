import { NextResponse } from "next/server"
import { callBridgeAdmin, getAuthenticatedOperatorContext, getRequestIp } from "@/lib/email-os/server-control"

export const dynamic = "force-dynamic"

const ALLOWED_SERVICES = new Set(["angelcare-email-bridge", "angelcare-caddy"])
const ALLOWED_ACTIONS = new Set(["start", "stop", "restart"])

export async function POST(request: Request) {
  const context = await getAuthenticatedOperatorContext(request)

  if (!context) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const service = String(body?.service || "").trim()
  const action = String(body?.action || "").trim()
  const confirmation = String(body?.confirmation || "").trim()

  if (!ALLOWED_SERVICES.has(service)) {
    return NextResponse.json({ ok: false, error: "Unsupported service" }, { status: 400 })
  }

  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ ok: false, error: "Unsupported service action" }, { status: 400 })
  }

  if (action === "stop" && !confirmation) {
    return NextResponse.json({ ok: false, error: "Stopping a Windows service requires confirmation" }, { status: 400 })
  }

  if (action === "stop" && service === "angelcare-caddy" && confirmation.length < 6) {
    return NextResponse.json(
      {
        ok: false,
        error: "Stopping Caddy requires an explicit confirmation because it can cut public operator access"
      },
      { status: 400 }
    )
  }

  try {
    const bridge = await callBridgeAdmin(
      `/admin/service/${action}`,
      {
        method: "POST",
        body: JSON.stringify({ service, confirmation })
      },
      context.operator,
      getRequestIp(request)
    )

    return NextResponse.json({ ok: true, data: bridge.data })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Service action failed"
      },
      { status: 500 }
    )
  }
}

