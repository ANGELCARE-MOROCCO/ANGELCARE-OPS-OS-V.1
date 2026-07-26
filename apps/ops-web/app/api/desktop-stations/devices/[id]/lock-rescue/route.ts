import { NextRequest } from "next/server"
import { fail, ok, parseBody, stationAdminContext } from "@/lib/desktop-stations/server"
import { rescueStationLock } from "@/lib/desktop-stations/lock-safety"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await stationAdminContext(request, "whatsapp_desktop.device.restore")
  if ("error" in context) return context.error
  const { id } = await params
  const body = await parseBody(request)
  const reason = String(body.reason || "Libération administrative anti-verrouillage MZ16").trim().slice(0, 1000)
  if (!reason) return fail("LOCK_RESCUE_REASON_REQUIRED")
  try { return ok(await rescueStationLock(context, id, reason, "device"), { status: 201 }) }
  catch (cause) { return fail(cause instanceof Error ? cause.message : String(cause), 400) }
}
