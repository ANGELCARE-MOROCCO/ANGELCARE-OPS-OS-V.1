import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { actorId } from "@/app/api/opsos/windows-node/storage/quarantine/_shared"
import { approveDedupPlan } from "@/lib/opsos/storage-lifecycle"
export async function POST(request: Request, { params }: { params: Promise<{ planId: string }> }) { const auth = await requireWindowsNodeAdmin(request); if (!auth.ok) return auth.response; const { planId } = await params; const body = await request.json().catch(() => ({})); try { return NextResponse.json({ ok: true, data: await approveDedupPlan(planId, actorId(auth.context.user, auth.context.operator), String(body.reason || "")) }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Deduplication approval failed" }, { status: 400 }) } }
