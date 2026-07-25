import { NextRequest } from "next/server"
import { auditEvent, fail, governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.device.view" })
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const body = await parseBody(request)
  const { data: current } = await context.supabase.from("whatsapp_desktop_governance_alerts").select("*").eq("id", id).maybeSingle()
  if (!current) return fail("ALERT_NOT_FOUND", 404)
  const { data, error } = await context.supabase.from("whatsapp_desktop_governance_alerts").update({ status: "acknowledged", acknowledged_by: context.userId, acknowledged_at: new Date().toISOString(), assigned_to: body.assigned_to || context.userId }).eq("id", id).select("*").single()
  if (error) return fail(error.message, 400)
  await auditEvent(context.supabase, { actorUserId: context.userId, deviceId: current.device_id, workspaceId: current.workspace_id, action: "governance_alert.acknowledged", reason: String(body.reason || "Alerte prise en charge"), previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
  return ok(data)
}
