import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.device.view" })
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const body = await parseBody(request)
  const note = String(body.resolution_note || "").trim()
  if (note.length < 5) return fail("RESOLUTION_NOTE_REQUIRED")
  const { data: current } = await context.supabase.from("whatsapp_desktop_governance_alerts").select("*").eq("id", id).maybeSingle()
  if (!current) return fail("ALERT_NOT_FOUND", 404)
  const { data, error } = await context.supabase.from("whatsapp_desktop_governance_alerts").update({ status: "resolved", resolved_by: context.userId, resolved_at: new Date().toISOString(), resolution_note: note }).eq("id", id).select("*").single()
  if (error) return fail(error.message, 400)
  await auditEvent(context.supabase, { actorUserId: context.userId, deviceId: current.device_id, workspaceId: current.workspace_id, action: "governance_alert.resolved", reason: note, previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
  return ok(data)
}
