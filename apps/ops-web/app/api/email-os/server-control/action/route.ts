import { NextResponse } from "next/server"
import { callBridgeAdmin, getAuthenticatedOperatorContext, getRequestIp, isServerControlAction } from "@/lib/email-os/server-control"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const context = await getAuthenticatedOperatorContext(request)

  if (!context) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const action = body?.action
  const payload = body?.payload && typeof body.payload === "object" ? body.payload : {}

  if (!isServerControlAction(action)) {
    return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 })
  }

  try {
    const requestIp = getRequestIp(request)
    const target = {
      restart_bridge: "/admin/service/restart",
      restart_caddy: "/admin/caddy/reload",
      validate_caddy: "/admin/caddy/validate",
      refresh_duckdns: "/admin/duckdns/update",
      smtp_test: "/admin/test/smtp",
      send_test: "/admin/test/send",
      reboot_server: "/admin/system/reboot",
      shutdown_server: "/admin/system/shutdown",
      cancel_shutdown: "/admin/system/cancel-shutdown",
      network_test: "/admin/test/network"
    }[action]

    if (!target) {
      return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 })
    }

    const requestBody =
      action === "restart_bridge"
        ? { service: "angelcare-email-bridge", confirmation: payload.confirmation || "CONFIRM SERVICE ACTION" }
        : action === "restart_caddy"
          ? { service: "angelcare-caddy", confirmation: payload.confirmation || "CONFIRM SERVICE ACTION" }
          : action === "validate_caddy"
            ? {}
            : action === "refresh_duckdns"
              ? {}
              : action === "smtp_test"
                ? {}
                : action === "send_test"
                  ? payload
                  : action === "reboot_server"
                    ? { confirmation: payload.confirmation || "CONFIRM SERVER RESTART" }
                    : action === "shutdown_server"
                      ? { confirmation: payload.confirmation || "CONFIRM SERVER SHUTDOWN" }
                      : action === "cancel_shutdown"
                        ? {}
                        : {}

    const bridge = await callBridgeAdmin(target, { method: "POST", body: JSON.stringify(requestBody) }, context.operator, requestIp)
    return NextResponse.json({ ok: true, data: bridge.data })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Action failed"
      },
      { status: 500 }
    )
  }
}

