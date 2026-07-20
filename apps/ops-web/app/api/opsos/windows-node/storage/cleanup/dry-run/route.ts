import { NextResponse } from "next/server"
import { getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorFromBridgeResult, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import { listCleanupProfiles } from "@/lib/opsos/storage-destruction"
export const dynamic = "force-dynamic"
function clean(value: unknown) { return String(value ?? "").trim() }
export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({}))
  const profileId = clean(body.profileId)
  const profile = (await listCleanupProfiles()).find((item) => item.id === profileId)
  if (!profile) return NextResponse.json({ ok: false, error: "Cleanup profile not found" }, { status: 404 })
  const endpoint = "/admin/storage/cleanup/dry-run"
  const result = await callWindowsBridgeAdmin<any>(endpoint, { method: "POST", body: JSON.stringify({ profile }) }, { operator: auth.context.operator, requestIp: getWindowsNodeRequestIp(request) })
  if (!result.ok) return NextResponse.json(buildWindowsNodeApiErrorFromBridgeResult(result, endpoint, "storage_cleanup_dry_run_failed"), { status: result.status })
  return NextResponse.json({ ok: true, data: result.data }, { headers: { "cache-control": "no-store" } })
}
