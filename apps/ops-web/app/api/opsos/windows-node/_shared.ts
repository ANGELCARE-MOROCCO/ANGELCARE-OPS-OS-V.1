import { NextResponse } from "next/server"
import {
  authorizeInfrastructureAdminRequest,
  buildWindowsNodeApiErrorFromBridgeResult,
  buildWindowsNodeApiErrorResponse,
  callWindowsBridgeAdmin,
  recordWindowsNodeAudit,
} from "@/lib/opsos/windows-node"
import type { WindowsNodeApiError, WindowsNodeApiResponse } from "@/lib/opsos/windows-node-types"

type RequestContext = {
  operator: string
  user?: unknown
}

export function getWindowsNodeRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || request.headers.get("cf-connecting-ip") || ""
}

export async function requireWindowsNodeAdmin(request: Request) {
  const auth = await authorizeInfrastructureAdminRequest(request)
  if (!auth.ok) {
    return { ok: false as const, response: auth.response }
  }
  return { ok: true as const, context: { operator: auth.operator, user: auth.user } satisfies RequestContext }
}

export function windowsNodeOk<T>(data: T) {
  return NextResponse.json<WindowsNodeApiResponse<T>>({ ok: true, data }, { headers: { "cache-control": "no-store" } })
}

export function windowsNodeError(error: WindowsNodeApiError, status?: number) {
  const statusCode = typeof status === "number" ? status : error.responseStatus || 500
  return NextResponse.json(
    error,
    {
      status: statusCode,
      headers: { "cache-control": "no-store" },
    }
  )
}

export async function callWindowsNodeBridge<T>(
  endpointPath: string,
  request: Request,
  options: RequestInit = {},
  fallbackAction = "bridge_request_failed",
) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) {
    return auth.response
  }

  const result = await callWindowsBridgeAdmin<T>(endpointPath, options, {
    operator: auth.context.operator,
    requestIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || request.headers.get("cf-connecting-ip") || "",
  })

  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, endpointPath, fallbackAction)
    return windowsNodeError(error || buildWindowsNodeApiErrorResponse({
      status: 502,
      errorName: "BridgeCallFailed",
      errorMessage: "Bridge request failed",
      endpointPath,
      causeCode: fallbackAction,
    }), result.status)
  }

  return windowsNodeOk(result.data)
}

export async function auditWindowsNodeEvent(event: Parameters<typeof recordWindowsNodeAudit>[0]) {
  await recordWindowsNodeAudit(event).catch(() => null)
}

export function buildBridgeRequestBody(body: Record<string, unknown>) {
  return JSON.stringify(body)
}
