import { NextResponse } from "next/server"
import { getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { beginDedupPlanExecution, finalizeDedupPlan, loadDedupPlan } from "@/lib/opsos/storage-lifecycle"
import { callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
export async function POST(request: Request, { params }: { params: Promise<{ planId: string }> }) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const { planId } = await params
  const actor = actorId(auth.context.user, auth.context.operator)
  try {
    const plan = await loadDedupPlan(planId)
    if (!plan) throw new Error("Deduplication plan not found")
    if (plan.status !== "approved") throw new Error("Deduplication plan requires independent approval")
    await beginDedupPlanExecution(plan.id, actor)
    const bridge = await callWindowsBridgeAdmin<any>("/admin/storage/dedup/execute", {
      method: "POST",
      body: JSON.stringify({ planId: plan.id, planNumber: plan.planNumber, sha256: plan.sha256, copies: plan.copies }),
    }, { operator: auth.context.operator, requestIp: getWindowsNodeRequestIp(request) })
    if (!bridge.ok) {
      await finalizeDedupPlan(plan.id, actor, { status: "failed", error: bridge.errorMessage || "Windows deduplication execution failed" }).catch(() => null)
      throw new Error(bridge.errorMessage || "Windows deduplication execution failed")
    }
    return NextResponse.json({ ok: true, data: await finalizeDedupPlan(plan.id, actor, bridge.data) })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Deduplication execution failed" }, { status: 400 })
  }
}
