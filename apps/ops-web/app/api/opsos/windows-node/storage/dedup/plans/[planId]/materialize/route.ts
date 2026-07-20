import { NextResponse } from "next/server"
import { getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { loadDedupPlan, recordDedupMaterialization } from "@/lib/opsos/storage-lifecycle"
import { callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"

export async function POST(request: Request, { params }: { params: Promise<{ planId: string }> }) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const { planId } = await params
  const body = await request.json().catch(() => ({}))
  try {
    const plan = await loadDedupPlan(planId)
    if (!plan) throw new Error("Deduplication plan not found")
    if (!["completed", "completed_with_warnings"].includes(plan.status)) throw new Error("Only a completed deduplication plan can be materialized")
    const fileId = String(body.fileId || "")
    const copy = plan.copies.find((item) => item.fileId === fileId)
    if (!copy) throw new Error("Deduplicated file reference not found")
    if (copy.canonical) throw new Error("The canonical file does not require materialization")
    const reason = String(body.reason || "")
    if (reason.trim().length < 8) throw new Error("A detailed materialization reason is required")
    const bridge = await callWindowsBridgeAdmin<any>("/admin/storage/dedup/materialize", {
      method: "POST",
      body: JSON.stringify(copy),
    }, { operator: auth.context.operator, requestIp: getWindowsNodeRequestIp(request) })
    if (!bridge.ok) throw new Error(bridge.errorMessage || "Windows copy materialization failed")
    const data = await recordDedupMaterialization(plan.id, fileId, actorId(auth.context.user, auth.context.operator), reason, bridge.data || {})
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Deduplication materialization failed" }, { status: 400 })
  }
}
