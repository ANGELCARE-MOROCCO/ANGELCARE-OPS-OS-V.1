import { NextRequest } from "next/server"
import { fail, governanceContext, ok, parseBody, stationDevice } from "@/lib/desktop-stations/server"
export async function POST(request: NextRequest) {
  const context = await governanceContext(request); if ("error" in context) return context.error
  const body = await parseBody(request); const installationId = String(body.installation_id || "")
  const device = await stationDevice(context, installationId); if (!device) return fail("DEVICE_NOT_REGISTERED_OR_MISMATCH", 404)
  const now = new Date().toISOString(); const version = Math.max(0, Number(body.policy_version || 0))
  await context.supabase.from("whatsapp_desktop_devices").update({ station_policy_version: version, station_policy_synced_at: now, station_mode: String(body.applied_mode || "standard") }).eq("id", device.id)
  await context.supabase.from("desktop_station_events").insert({ device_id: device.id, user_id: context.userId, event_type: "policy_acknowledged", outcome: "success", policy_version: version, metadata: { applied_mode: body.applied_mode }, created_at: now })
  return ok({ acknowledged: true, policy_version: version, acknowledged_at: now })
}
