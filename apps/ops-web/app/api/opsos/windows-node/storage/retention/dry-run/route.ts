import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { simulateRetentionPolicy } from "@/lib/opsos/storage-destruction"

export const dynamic = "force-dynamic"
function clean(value: unknown) { return String(value ?? "").trim() }
export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({}))
  const policyId = clean(body.policyId)
  if (!policyId) return NextResponse.json({ ok: false, error: "policyId is required" }, { status: 400 })
  try {
    const data = await simulateRetentionPolicy(policyId)
    const db = createEmailOSCoreDb()
    await db.from("opsos_storage_retention_runs").insert({ id: randomUUID(), policy_id: policyId, mode: "dry_run", status: "completed", matched_count: data.matchedCount, matched_bytes: data.matchedBytes, result: data, requested_by: actorId(auth.context.user, auth.context.operator), created_at: new Date().toISOString(), completed_at: new Date().toISOString() })
    return NextResponse.json({ ok: true, data }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Retention dry-run failed" }, { status: 400 })
  }
}
