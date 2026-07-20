import { NextResponse } from "next/server"
import { createLifecycleRun, executeLifecycleRun, getLifecyclePolicy, listLifecycleRuns } from "@/lib/opsos/storage-lifecycle"
export const dynamic = "force-dynamic"
function clean(value: unknown) { return String(value ?? "").trim() }
export async function POST(request: Request) {
  const secret = clean(process.env.OPSOS_STORAGE_LIFECYCLE_SECRET || process.env.CRON_SECRET)
  const supplied = clean(request.headers.get("x-opsos-lifecycle-secret") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, ""))
  if (!secret || supplied !== secret) return NextResponse.json({ ok: false, error: "Unauthorized lifecycle scheduler" }, { status: 401 })
  try {
    const policy = await getLifecyclePolicy()
    if (!policy.enabled) return NextResponse.json({ ok: true, data: { skipped: true, reason: "Lifecycle policy disabled" } })
    const recentRuns = await listLifecycleRuns(20)
    const active = recentRuns.find((run) => ["queued", "running", "paused"].includes(run.status))
    if (active) return NextResponse.json({ ok: true, data: { skipped: true, reason: "A lifecycle run is already active", runNumber: active.runNumber } })
    const lastScheduled = recentRuns.find((run) => run.trigger === "scheduled")
    if (lastScheduled) {
      const elapsedMinutes = (Date.now() - new Date(lastScheduled.createdAt).getTime()) / 60_000
      if (Number.isFinite(elapsedMinutes) && elapsedMinutes < policy.cadenceMinutes * 0.9) {
        return NextResponse.json({ ok: true, data: { skipped: true, reason: "Policy cadence has not elapsed", nextEligibleInMinutes: Math.ceil(policy.cadenceMinutes - elapsedMinutes) } })
      }
    }
    const run = await createLifecycleRun({ policy, trigger: "scheduled", actor: "opsos-lifecycle-scheduler" })
    const data = await executeLifecycleRun(run.id, "opsos-lifecycle-scheduler")
    return NextResponse.json({ ok: true, data }, { headers: { "cache-control": "no-store" } })
  }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Scheduled lifecycle run failed" }, { status: 500 }) }
}
