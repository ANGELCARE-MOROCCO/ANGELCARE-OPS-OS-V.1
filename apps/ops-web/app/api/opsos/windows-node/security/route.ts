import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type { WindowsNodeStatus } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

const TOKEN_ROTATION_CHECKLIST = [
  "Generate new token securely",
  "Update Windows .env",
  "Restart bridge service",
  "Update Vercel env",
  "Redeploy production",
  "Test bridge-health",
  "Test send-direct",
  "Rotate old token out",
  "Audit completion",
]

export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const result = await callWindowsBridgeAdmin<WindowsNodeStatus>("/admin/status", {}, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })

  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, "/admin/status", "security_status_failed")
    return NextResponse.json(error, { status: result.status, headers: { "cache-control": "no-store" } })
  }

  await auditWindowsNodeEvent({
    timestamp: new Date().toISOString(),
    actor: auth.context.operator,
    action: "windows_node_security_viewed",
    target: "/opsos/infrastructure/windows-node",
    result: "ok",
    reason: "Security posture viewed",
    severity: "info",
    metadataSummary: `unauthorized=${result.data.security.recentUnauthorizedAttempts} smtpErrors=${result.data.security.recentFailedSmtpAuth}`,
  })

  return NextResponse.json({
    ok: true,
    data: {
      ...result.data.security,
      rotationChecklist: TOKEN_ROTATION_CHECKLIST,
      maintenanceMode: result.data.maintenanceMode,
      recentFailures: {
        smtp: result.data.security.recentFailedSmtpAuth,
        api: result.data.security.recentFailedApiCalls,
      },
    },
  }, { headers: { "cache-control": "no-store" } })
}

