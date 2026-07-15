import { NextResponse } from "next/server"
import { buildTechnicalSettings, callBridgeAdmin, getAuthenticatedOperatorContext, getRequestIp } from "@/lib/email-os/server-control"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const context = await getAuthenticatedOperatorContext(request)

  if (!context) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const requestIp = getRequestIp(request)
    const bridge = await callBridgeAdmin("/admin/status", {}, context.operator, requestIp)

    return NextResponse.json({
      ok: true,
      data: {
        ...bridge.data,
        technicalSettings: buildTechnicalSettings(),
        operator: context.operator
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load server control status"
      },
      { status: 500 }
    )
  }
}

