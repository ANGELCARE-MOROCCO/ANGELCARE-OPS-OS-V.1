import { NextRequest } from "next/server"
import { auditEvent, governanceContext, ok, parseBody, revokeActiveLeases } from "@/lib/whatsapp-desktop/server"
import { DEVICE_ACTION_PERMISSIONS, disconnectWhatsApp, lifecycleError, loadDevice, logoutDesktop, restoreDevice } from "@/lib/whatsapp-desktop/device-lifecycle"

export async function POST(request: NextRequest) {
  const context = await governanceContext(request, { adminPermission: DEVICE_ACTION_PERMISSIONS.bulk })
  if ("error" in context) return context.error
  try {
    const body = await parseBody(request)
    const ids = Array.isArray(body.device_ids) ? [...new Set(body.device_ids.map(String).filter(Boolean))].slice(0, 100) : []
    const action = String(body.action || "")
    const reason = String(body.reason || "Action groupée ANGELCARE")
    if (!ids.length) throw new Error("DEVICE_SELECTION_REQUIRED")
    const results: Array<Record<string, unknown>> = []
    for (const id of ids) {
      try {
        if (action === "restore") results.push({ id, ok: true, data: await restoreDevice(context, id, reason) })
        else if (action === "disconnect_whatsapp") results.push({ id, ok: true, data: await disconnectWhatsApp(context, id, reason) })
        else if (action === "logout_desktop") results.push({ id, ok: true, data: await logoutDesktop(context, id, reason) })
        else if (action === "suspend") {
          const current = await loadDevice(context.supabase, id)
          if (current.approval_status !== "approved") throw new Error(`INVALID_DEVICE_TRANSITION:${current.approval_status}:suspend`)
          const now = new Date().toISOString()
          const { data, error } = await context.supabase.from("whatsapp_desktop_devices").update({ approval_status: "suspended", suspended_at: now, suspended_by: context.userId, suspension_reason: reason, revoke_reason: reason }).eq("id", id).select("*").single()
          if (error) throw error
          await context.supabase.from("whatsapp_desktop_device_workspace_access").update({ status: "suspended", reason }).eq("device_id", id).eq("status", "approved")
          await revokeActiveLeases(context.supabase, { deviceId: id, actorId: context.userId, reason })
          await context.supabase.from("whatsapp_desktop_commands").insert({ device_id: id, command_type: "HIDE_WHATSAPP_VIEW", reason, issued_by: context.userId })
          await auditEvent(context.supabase, { actorUserId: context.userId, targetUserId: data.current_user_id, deviceId: id, action: "device.bulk_suspended", reason, previousState: current, newState: data, ip: context.ip, userAgent: context.userAgent })
          results.push({ id, ok: true, data })
        } else throw new Error("UNSUPPORTED_BULK_ACTION")
      } catch (error) {
        results.push({ id, ok: false, error: error instanceof Error ? error.message : String(error) })
      }
    }
    return ok({ requested: ids.length, succeeded: results.filter((row) => row.ok).length, failed: results.filter((row) => !row.ok).length, results })
  } catch (error) { return lifecycleError(error) }
}
