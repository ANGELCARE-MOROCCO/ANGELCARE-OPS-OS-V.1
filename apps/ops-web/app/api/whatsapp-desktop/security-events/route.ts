import { NextRequest } from "next/server"
import { fail, governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"

export async function GET(request: NextRequest) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.audit.view" })
  if ("error" in context) return context.error
  const { data, error } = await context.supabase.from("whatsapp_desktop_security_events").select("*").order("created_at", { ascending: false }).limit(500)
  if (error) return fail(error.message, 500)
  return ok(data || [])
}

export async function PATCH(request: NextRequest) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.audit.view" })
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const id = Number(body.id)
  const status = ["acknowledged", "resolved", "dismissed"].includes(String(body.status)) ? String(body.status) : "acknowledged"
  if (!id) return fail("SECURITY_EVENT_ID_REQUIRED")
  const now = new Date().toISOString()
  const update = status === "resolved" ? { status, resolved_by: context.userId, resolved_at: now } : { status, acknowledged_by: context.userId, acknowledged_at: now }
  const { data, error } = await context.supabase.from("whatsapp_desktop_security_events").update(update).eq("id", id).select("*").single()
  if (error) return fail(error.message, 400)
  return ok(data)
}
