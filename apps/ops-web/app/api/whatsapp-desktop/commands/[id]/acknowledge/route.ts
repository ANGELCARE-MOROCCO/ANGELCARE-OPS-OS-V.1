import { NextRequest } from "next/server"
import { fail, governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request)
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const body = await parseBody(request)
  const installationId = String(body.installation_id || "")
  const state = ["received", "executing", "completed", "failed"].includes(String(body.state)) ? String(body.state) : "received"
  const { data: device } = await context.supabase.from("whatsapp_desktop_devices").select("id,current_user_id").eq("installation_id", installationId).maybeSingle()
  if (!device) return fail("DEVICE_NOT_REGISTERED", 404)
  if (device.current_user_id && device.current_user_id !== context.userId) return fail("DEVICE_USER_MISMATCH", 403)
  const { data: command } = await context.supabase.from("whatsapp_desktop_commands").select("*").eq("id", id).eq("device_id", device.id).maybeSingle()
  if (!command) return fail("COMMAND_NOT_FOUND", 404)
  const now = new Date().toISOString()
  const update: Record<string, unknown> = { status: state }
  if (state === "received") update.received_at = now
  if (state === "executing") update.executing_at = now
  if (state === "completed") update.completed_at = now
  if (state === "failed") { update.failed_at = now; update.failure_reason = String(body.detail || "Command failed").slice(0, 1000) }
  const { data, error } = await context.supabase.from("whatsapp_desktop_commands").update(update).eq("id", id).select("*").single()
  if (error) return fail(error.message, 400)
  await context.supabase.from("whatsapp_desktop_command_receipts").insert({ command_id: id, device_id: device.id, state, detail: String(body.detail || "").slice(0, 2000) || null, evidence: body.evidence && typeof body.evidence === "object" ? body.evidence : {} })
  return ok(data)
}
