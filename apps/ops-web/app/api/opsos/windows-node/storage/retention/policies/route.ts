import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { getDestructionPolicy, listRetentionPolicies, saveDestructionPolicy, saveRetentionPolicy } from "@/lib/opsos/storage-destruction"

export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const [policy, retentionPolicies] = await Promise.all([getDestructionPolicy(), listRetentionPolicies()])
  return NextResponse.json({ ok: true, data: { policy, retentionPolicies } }, { headers: { "cache-control": "no-store" } })
}
export async function PUT(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({}))
  const actor = actorId(auth.context.user, auth.context.operator)
  try {
    if (body.kind === "destruction_policy") return NextResponse.json({ ok: true, data: await saveDestructionPolicy(body.policy || {}, actor) })
    return NextResponse.json({ ok: true, data: await saveRetentionPolicy(body.policy || body, actor) })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Policy update failed" }, { status: 400 })
  }
}
