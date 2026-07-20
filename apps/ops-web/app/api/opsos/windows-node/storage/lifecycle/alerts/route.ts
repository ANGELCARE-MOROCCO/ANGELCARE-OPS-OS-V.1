import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { listLifecycleAlerts, updateLifecycleAlert } from "@/lib/opsos/storage-lifecycle"
export const dynamic = "force-dynamic"
export async function GET(request: Request) { const auth = await requireWindowsNodeAdmin(request); if (!auth.ok) return auth.response; return NextResponse.json({ ok: true, data: await listLifecycleAlerts() }, { headers: { "cache-control": "no-store" } }) }
export async function PATCH(request: Request) { const auth = await requireWindowsNodeAdmin(request); if (!auth.ok) return auth.response; const body = await request.json().catch(() => ({})); try { return NextResponse.json({ ok: true, data: await updateLifecycleAlert(String(body.alertId || ""), body.action === "resolve" ? "resolve" : "acknowledge", actorId(auth.context.user, auth.context.operator)) }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Alert update failed" }, { status: 400 }) } }
