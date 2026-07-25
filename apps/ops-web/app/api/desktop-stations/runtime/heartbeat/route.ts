import { NextRequest } from "next/server"
import { fail, governanceContext, ok, parseBody, resolveEffectivePolicy, stationDevice } from "@/lib/desktop-stations/server"

export async function POST(request: NextRequest) {
  const context = await governanceContext(request)
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const installationId = String(body.installation_id || request.headers.get("x-angelcare-desktop-installation") || "")
  const device = await stationDevice(context, installationId)
  if (!device) return fail("DEVICE_NOT_REGISTERED_OR_MISMATCH", 404)
  const now = new Date().toISOString()
  const clientClock = body.client_time ? new Date(String(body.client_time)) : null
  const reportedState = {
    ...(device.reported_state && typeof device.reported_state === "object" ? device.reported_state : {}),
    station_mode: String(body.station_mode || "standard"),
    required_mode: String(body.required_mode || "standard"),
    policy_version: Math.max(0, Number(body.policy_version || 0)),
    tab_count: Math.max(0, Number(body.tab_count || 0)),
    active_tab_type: String(body.active_tab_type || "").slice(0, 80) || null,
    browser_health: String(body.browser_health || "unknown").slice(0, 80),
    kiosk_state: Boolean(body.kiosk_state),
    desktop_version: String(body.desktop_version || device.desktop_version || "").slice(0, 80),
    governance_contract_version: String(body.governance_contract_version || device.governance_contract_version || "").slice(0, 80),
    last_station_heartbeat_at: now,
  }
  const update = {
    station_mode: reportedState.station_mode,
    station_required_mode: reportedState.required_mode,
    station_kiosk_state: reportedState.kiosk_state,
    station_active_tab_type: reportedState.active_tab_type,
    station_tab_count: reportedState.tab_count,
    station_policy_version: reportedState.policy_version,
    station_browser_health: reportedState.browser_health,
    station_unlock_state: body.unlock_state && typeof body.unlock_state === "object" ? body.unlock_state : {},
    runtime_health: body.runtime_health && typeof body.runtime_health === "object" ? body.runtime_health : {},
    reported_state: reportedState,
    governance_contract_version: reportedState.governance_contract_version || null,
    desktop_build_number: Number.isFinite(Number(body.desktop_build_number)) ? Number(body.desktop_build_number) : device.desktop_build_number || null,
    client_clock_at: clientClock && Number.isFinite(clientClock.getTime()) ? clientClock.toISOString() : null,
    clock_drift_seconds: clientClock && Number.isFinite(clientClock.getTime()) ? Math.round((clientClock.getTime() - Date.now()) / 1000) : null,
    last_heartbeat_at: now,
    last_seen_at: now,
    desktop_version: reportedState.desktop_version || null,
  }
  const { error: updateError } = await context.supabase.from("whatsapp_desktop_devices").update(update).eq("id", device.id)
  if (updateError) return fail(updateError.message, 500)
  await context.supabase.from("desktop_station_tab_sessions").upsert({ device_id: device.id, user_id: context.userId, active_tab_type: update.station_active_tab_type, tab_count: update.station_tab_count, policy_version: update.station_policy_version, last_seen_at: now }, { onConflict: "device_id" })
  await context.supabase.from("desktop_station_commands").update({ status: "expired" }).eq("device_id", device.id).lt("expires_at", now).in("status", ["created", "delivered", "received"])
  const { data: commands } = await context.supabase.from("desktop_station_commands").select("id,command_type,payload,reason,issued_at,expires_at,status,correlation_id,priority,retry_count,max_retries").eq("device_id", device.id).in("status", ["created", "delivered"]).gt("expires_at", now).order("issued_at", { ascending: true }).limit(50)
  const newIds = (commands || []).filter((item: any) => item.status === "created").map((item: any) => item.id)
  if (newIds.length) await context.supabase.from("desktop_station_commands").update({ status: "delivered", delivered_at: now }).in("id", newIds)
  const effective = await resolveEffectivePolicy(context, installationId)
  await context.supabase.from("whatsapp_desktop_devices").update({ last_command_poll_at: now, last_configuration_pull_at: now }).eq("id", device.id)
  return ok({ server_time: now, effective_policy: effective.policy, commands: commands || [] })
}
