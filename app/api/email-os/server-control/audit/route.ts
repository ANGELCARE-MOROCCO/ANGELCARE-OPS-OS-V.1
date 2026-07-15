import { NextResponse } from "next/server"
import { callBridgeAdmin, getAuthenticatedOperatorContext, getRequestIp, normalizeLinesParam } from "@/lib/email-os/server-control"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const context = await getAuthenticatedOperatorContext(request)

  if (!context) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const lines = normalizeLinesParam(url.searchParams.get("lines"), 200)

  try {
    const bridge = await callBridgeAdmin(`/admin/audit?lines=${lines}`, {}, context.operator, getRequestIp(request))
    return NextResponse.json({ ok: true, data: bridge.data })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load audit"
      },
      { status: 500 }
    )
  }
}

