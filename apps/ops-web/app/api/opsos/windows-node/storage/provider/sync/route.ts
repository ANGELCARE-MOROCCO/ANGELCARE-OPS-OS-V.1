import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { listProviderRuns, runProviderSync } from "@/lib/opsos/storage-lifecycle"
export const dynamic = "force-dynamic"
export async function GET(request: Request) { const auth = await requireWindowsNodeAdmin(request); if (!auth.ok) return auth.response; return NextResponse.json({ ok: true, data: await listProviderRuns() }, { headers: { "cache-control": "no-store" } }) }
export async function POST(request: Request) { const auth = await requireWindowsNodeAdmin(request); if (!auth.ok) return auth.response; const body = await request.json().catch(() => ({})); try { return NextResponse.json({ ok: true, data: await runProviderSync({ mailboxId: body.mailboxId || null, limit: Number(body.limit || 25), actor: actorId(auth.context.user, auth.context.operator) }) }, { status: 201 }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Provider synchronization failed" }, { status: 400 }) } }
