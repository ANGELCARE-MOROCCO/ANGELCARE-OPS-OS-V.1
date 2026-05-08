import { NextRequest, NextResponse } from "next/server"
import { applyPartnershipActionV13, defaultPartnershipStoreV13, type PartnershipActionKey, type PartnershipStoreV13 } from "@/lib/revenue-command-center/partnerships-v13"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

let memoryStore: PartnershipStoreV13 = defaultPartnershipStoreV13()
function json(body: unknown, status = 200) { return NextResponse.json(body, { status }) }
function message(error: unknown) { return error instanceof Error ? error.message : String(error) }
export async function GET() { try { return json({ ok: true, data: memoryStore }) } catch (error) { return json({ ok: false, error: message(error) }, 500) } }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || "update") as PartnershipActionKey
    const partnerId = String(body.partnerId || body.id || "system")
    const payload = body.payload && typeof body.payload === "object" ? body.payload as Record<string, unknown> : {}
    memoryStore = applyPartnershipActionV13(memoryStore, action, partnerId, payload)
    return json({ ok: true, action, partnerId, data: memoryStore })
  } catch (error) { return json({ ok: false, error: message(error) }, 500) }
}
export async function DELETE() { try { memoryStore = defaultPartnershipStoreV13(); return json({ ok: true, data: memoryStore }) } catch (error) { return json({ ok: false, error: message(error) }, 500) } }
