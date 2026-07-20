import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { listProviderReconciliations, reconcileProviderMailbox } from "@/lib/opsos/storage-lifecycle"
export const dynamic = "force-dynamic"
export async function GET(request: Request) { const auth = await requireWindowsNodeAdmin(request); if (!auth.ok) return auth.response; return NextResponse.json({ ok: true, data: await listProviderReconciliations() }, { headers: { "cache-control": "no-store" } }) }
export async function POST(request: Request) { const auth = await requireWindowsNodeAdmin(request); if (!auth.ok) return auth.response; const body = await request.json().catch(() => ({})); try { return NextResponse.json({ ok: true, data: await reconcileProviderMailbox(String(body.mailboxId || ""), auth.context.operator) }, { status: 201 }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Provider reconciliation failed" }, { status: 400 }) } }
