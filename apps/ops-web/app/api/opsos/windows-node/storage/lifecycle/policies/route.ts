import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { getLifecyclePolicy, saveLifecyclePolicy } from "@/lib/opsos/storage-lifecycle"
export const dynamic = "force-dynamic"
export async function GET(request: Request) { const auth = await requireWindowsNodeAdmin(request); if (!auth.ok) return auth.response; return NextResponse.json({ ok: true, data: await getLifecyclePolicy() }, { headers: { "cache-control": "no-store" } }) }
export async function PUT(request: Request) { const auth = await requireWindowsNodeAdmin(request); if (!auth.ok) return auth.response; const body = await request.json().catch(() => ({})); try { return NextResponse.json({ ok: true, data: await saveLifecyclePolicy(body.policy || body, actorId(auth.context.user, auth.context.operator)) }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Lifecycle policy update failed" }, { status: 400 }) } }
