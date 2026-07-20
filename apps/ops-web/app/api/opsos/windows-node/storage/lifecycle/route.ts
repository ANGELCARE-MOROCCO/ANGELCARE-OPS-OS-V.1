import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { createLifecycleRun, executeLifecycleRun, listLifecycleRegistry } from "@/lib/opsos/storage-lifecycle"
import type { WindowsStorageLifecycleAction } from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  try { return NextResponse.json({ ok: true, data: await listLifecycleRegistry() }, { headers: { "cache-control": "no-store" } }) }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Phase 5 lifecycle registry unavailable", recommendedAction: "Apply the Phase 5 database migration and retry." }, { status: 500 }) }
}
export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({}))
  const actor = actorId(auth.context.user, auth.context.operator)
  try {
    const actions = Array.isArray(body.actions) ? body.actions.map(String) as WindowsStorageLifecycleAction[] : undefined
    const run = await createLifecycleRun({ actions, trigger: body.trigger === "scheduled" ? "scheduled" : "manual", actor })
    const data = body.execute === false ? run : await executeLifecycleRun(run.id, actor)
    await auditWindowsNodeEvent({ timestamp: new Date().toISOString(), actor: auth.context.operator, action: "windows_storage_lifecycle_run_started", target: "/opsos/infrastructure/windows-node#storage", result: data.status, reason: String(body.reason || "Phase 5 lifecycle optimization run"), severity: "medium", metadataSummary: `run=${data.runNumber} actions=${data.actions.join(",")}` })
    return NextResponse.json({ ok: true, data }, { status: 201, headers: { "cache-control": "no-store" } })
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to start lifecycle run" }, { status: 400 }) }
}
