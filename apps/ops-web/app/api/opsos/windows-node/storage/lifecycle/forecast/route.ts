import { NextResponse } from "next/server"
import { requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { captureLifecycleSnapshot, getForecast } from "@/lib/opsos/storage-lifecycle"
export const dynamic = "force-dynamic"
export async function GET(request: Request) { const auth = await requireWindowsNodeAdmin(request); if (!auth.ok) return auth.response; const url = new URL(request.url); if (url.searchParams.get("capture") === "1") await captureLifecycleSnapshot(auth.context.operator); return NextResponse.json({ ok: true, data: await getForecast() }, { headers: { "cache-control": "no-store" } }) }
