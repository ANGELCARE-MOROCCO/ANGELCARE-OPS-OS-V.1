import { NextRequest } from "next/server"
import { fail, ok, parseBody, stationAdminContext } from "@/lib/desktop-stations/server"
import { deviceLockRisk, rescueStationLock } from "@/lib/desktop-stations/lock-safety"

export async function POST(request: NextRequest) {
  const context = await stationAdminContext(request, "whatsapp_desktop.device.bulk_manage")
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const reason = String(body.reason || "Activation du mode sûr anti-verrouillage MZ16").trim().slice(0, 1000)
  if (!reason) return fail("FLEET_SAFE_MODE_REASON_REQUIRED")
  const { data: devices, error } = await context.supabase.from("whatsapp_desktop_devices").select("*")
  if (error) return fail(error.message, 500)
  const candidates = (devices || []).filter((device: Record<string, any>) => device.station_mode === "locked" || device.station_required_mode === "locked" || deviceLockRisk(device).unsafe)
  const results: Array<Record<string, any>> = []
  for (const device of candidates) {
    try { results.push({ ok: true, ...(await rescueStationLock(context, String(device.id), reason, "fleet")) }) }
    catch (cause) { results.push({ ok: false, device_id: device.id, error: cause instanceof Error ? cause.message : String(cause) }) }
  }
  const failed = results.filter((row) => !row.ok)
  return ok({ total_candidates: candidates.length, queued: results.length - failed.length, failed: failed.length, results }, { status: failed.length ? 207 : 201 })
}
