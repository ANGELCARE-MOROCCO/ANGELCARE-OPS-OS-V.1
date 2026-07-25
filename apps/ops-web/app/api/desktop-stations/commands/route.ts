import { NextRequest } from "next/server"
import { STATION_COMMANDS, fail, governanceContext, ok, parseBody, stationAdminContext, stationDevice } from "@/lib/desktop-stations/server"

export async function GET(request: NextRequest) {
  const installationId = String(request.nextUrl.searchParams.get("installationId") || "")
  if (installationId) {
    const context = await governanceContext(request)
    if ("error" in context) return context.error
    const device = await stationDevice(context, installationId)
    if (!device) return fail("DEVICE_NOT_REGISTERED_OR_MISMATCH", 404)
    const now = new Date().toISOString()
    await context.supabase.from("whatsapp_desktop_devices").update({ last_command_poll_at: now }).eq("id", device.id)
    const { data, error } = await context.supabase.from("desktop_station_commands").select("*").eq("device_id", device.id).order("issued_at", { ascending: false }).limit(100)
    if (error) return fail(error.message, 500)
    return ok(data || [])
  }
  const context = await stationAdminContext(request, "whatsapp_desktop.command.issue")
  if ("error" in context) return context.error
  const { data, error } = await context.supabase.from("desktop_station_commands").select("*,device:whatsapp_desktop_devices(id,device_name)").order("issued_at", { ascending: false }).limit(500)
  if (error) return fail(error.message, 500)
  return ok(data || [])
}

export async function POST(request: NextRequest) {
  const context = await stationAdminContext(request, "whatsapp_desktop.command.issue")
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const commandType = String(body.command_type || "").toUpperCase()
  if (!body.device_id || !STATION_COMMANDS.has(commandType)) return fail("VALID_DEVICE_AND_COMMAND_REQUIRED")
  const expiresAt = body.expires_at || new Date(Date.now() + 24 * 60 * 60_000).toISOString()
  const { data, error } = await context.supabase.from("desktop_station_commands").insert({
    device_id: body.device_id, policy_id: body.policy_id || null, workspace_id: body.workspace_id || null, command_type: commandType,
    payload: body.payload && typeof body.payload === "object" ? body.payload : {},
    reason: String(body.reason || "Commande Corporate Station ANGELCARE").slice(0, 1000), status: "created", issued_by: context.userId, expires_at: expiresAt,
    correlation_id: body.correlation_id || null, priority: body.priority || "normal", max_retries: Math.max(0, Math.min(20, Number(body.max_retries ?? 3))),
    acknowledgement_deadline: body.acknowledgement_deadline || new Date(Date.now() + 10 * 60_000).toISOString(),
  }).select("*").single()
  if (error) return fail(error.message, 400)
  return ok(data, { status: 201 })
}
