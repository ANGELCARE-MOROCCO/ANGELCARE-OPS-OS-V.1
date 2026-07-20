import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { executeLifecycleRun, updateLifecycleRunState } from "@/lib/opsos/storage-lifecycle"
export const dynamic = "force-dynamic"
export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const auth = await requireWindowsNodeAdmin(request); if (!auth.ok) return auth.response
  const { runId } = await params; const body = await request.json().catch(() => ({})); const action = String(body.action || "execute")
  try { const actor = actorId(auth.context.user, auth.context.operator); const data = action === "execute" || action === "resume_execute" ? await executeLifecycleRun(runId, actor) : await updateLifecycleRunState(runId, action as "pause" | "resume" | "cancel", actor); return NextResponse.json({ ok: true, data }) }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Lifecycle run action failed" }, { status: 400 }) }
}
