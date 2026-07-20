import { NextRequest } from "next/server"
import { accessEvent, fail, governanceContext, ok, parseBody, pendingCommands, publicDevice } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest) {
  const context = await governanceContext(request)
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const installationId = String(body.installation_id || "")
  const { data: device } = await context.supabase.from("whatsapp_desktop_devices").select("*").eq("installation_id", installationId).maybeSingle()
  if (!device) return fail("DEVICE_NOT_REGISTERED", 404)
  if (device.current_user_id && device.current_user_id !== context.userId) return fail("DEVICE_USER_MISMATCH", 403)
  const now = new Date().toISOString()
  const linkState = ["unknown", "not_linked", "qr_required", "linked", "logged_out"].includes(String(body.whatsapp_link_state)) ? body.whatsapp_link_state : "unknown"
  const { data: updated, error } = await context.supabase.from("whatsapp_desktop_devices").update({
    current_user_id: context.userId,
    desktop_version: String(body.desktop_version || device.desktop_version || "").slice(0, 80) || null,
    whatsapp_link_state: linkState,
    last_heartbeat_at: now,
    last_seen_at: now,
    last_ip: context.ip,
    runtime_health: body.runtime_health && typeof body.runtime_health === "object" ? body.runtime_health : {},
  }).eq("id", device.id).select("*").single()
  if (error) return fail(error.message, 500)
  await context.supabase.from("whatsapp_desktop_heartbeats").insert({
    device_id: device.id,
    workspace_id: body.workspace_id || null,
    user_id: context.userId,
    desktop_version: updated.desktop_version,
    whatsapp_visible: Boolean(body.whatsapp_visible),
    whatsapp_link_state: linkState,
    authorization_state: String(body.authorization_state || "unknown").slice(0, 80),
    runtime_health: body.runtime_health || {},
  })
  const commands = await pendingCommands(context.supabase, device.id)
  await accessEvent(context.supabase, { eventType: "device_heartbeat", userId: context.userId, deviceId: device.id, workspaceId: body.workspace_id || null, outcome: "received", metadata: { whatsapp_visible: Boolean(body.whatsapp_visible), authorization_state: body.authorization_state }, ip: context.ip, userAgent: context.userAgent })
  return ok({ device: publicDevice(updated), commands, server_time: now })
}
