import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { getProviderCapabilities } from "@/lib/opsos/storage-lifecycle"
export async function POST(request: Request) { const auth = await requireWindowsNodeAdmin(request); if (!auth.ok) return auth.response; const body = await request.json().catch(() => ({})); try { return NextResponse.json({ ok: true, data: await getProviderCapabilities(String(body.mailboxId || ""), auth.context.operator) }, { headers: { "cache-control": "no-store" } }) } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Provider capability check failed" }, { status: 400 }) } }
