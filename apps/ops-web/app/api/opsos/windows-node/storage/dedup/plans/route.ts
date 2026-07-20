import { NextResponse } from "next/server"
import { getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { createDedupPlan, listDedupPlans } from "@/lib/opsos/storage-lifecycle"
import { callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  return NextResponse.json({ ok: true, data: await listDedupPlans() }, { headers: { "cache-control": "no-store" } })
}
export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({}))
  try {
    if (!body.group || !Array.isArray(body.group.copies)) throw new Error("A complete exact-hash duplicate group is required")
    const bridge = await callWindowsBridgeAdmin<any>("/admin/storage/dedup/preflight", {
      method: "POST",
      body: JSON.stringify({ sha256: body.group.sha256, copies: body.group.copies }),
    }, { operator: auth.context.operator, requestIp: getWindowsNodeRequestIp(request) })
    if (!bridge.ok) throw new Error(bridge.errorMessage || "Windows deduplication preflight failed")
    const data = await createDedupPlan(body.group, String(body.reason || ""), actorId(auth.context.user, auth.context.operator), bridge.data || {})
    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Deduplication plan creation failed" }, { status: 400 })
  }
}
