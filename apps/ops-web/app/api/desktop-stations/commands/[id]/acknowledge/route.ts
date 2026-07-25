import { NextRequest } from "next/server"
import { fail, governanceContext, ok, parseBody, stationDevice } from "@/lib/desktop-stations/server"
import { reconcileSynchronizationRun } from "@/lib/whatsapp-desktop/control-plane-server"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request)
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const body = await parseBody(request)
  const device = await stationDevice(context, String(body.installation_id || ""))
  if (!device) return fail("DEVICE_NOT_REGISTERED_OR_MISMATCH", 404)
  const state = ["received", "executing", "completed", "failed"].includes(String(body.state)) ? String(body.state) : "received"
  const { data: command } = await context.supabase.from("desktop_station_commands").select("*").eq("id", id).eq("device_id", device.id).maybeSingle()
  if (!command) return fail("COMMAND_NOT_FOUND", 404)
  const now = new Date().toISOString()
  const update: Record<string, unknown> = { status: state }
  if (state === "received") update.received_at = now
  if (state === "executing") update.executing_at = now
  if (state === "completed") update.completed_at = now
  if (state === "failed") { update.failed_at = now; update.failure_reason = String(body.detail || "Command failed").slice(0, 1000) }
  const { data, error } = await context.supabase.from("desktop_station_commands").update(update).eq("id", id).select("*").single()
  if (error) return fail(error.message, 400)
  await context.supabase.from("desktop_station_events").insert({ device_id: device.id, user_id: context.userId, event_type: "command_execution", outcome: state, severity: state === "failed" ? "high" : "informational", command_id: id, reason: String(body.detail || "").slice(0, 1000) || null, metadata: body.evidence && typeof body.evidence === "object" ? body.evidence : {} })
  await reconcileSynchronizationRun(context.supabase, device.id, command.correlation_id)
  return ok(data)
}
