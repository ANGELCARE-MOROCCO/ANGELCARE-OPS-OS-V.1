import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from "next/server"
import { getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type { WindowsBackupStatus } from "@/lib/opsos/windows-node-types"


async function GET__angelcareGovernedImpl(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const result = await callWindowsBridgeAdmin<WindowsBackupStatus>("/admin/backup/status", {}, {
    operator: auth.context.operator,
    requestIp: getWindowsNodeRequestIp(request),
  })

  if (!result.ok) {
    const error = buildWindowsNodeApiErrorFromBridgeResult(result, "/admin/backup/status", "backup_status_failed")
    return NextResponse.json(error, { status: result.status, headers: { "cache-control": "no-store" } })
  }

  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}

export const GET = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'GET:/api/opsos/windows-node/backup/status',
  },
  GET__angelcareGovernedImpl,
)
