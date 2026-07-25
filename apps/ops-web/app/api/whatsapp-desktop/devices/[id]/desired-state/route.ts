import { NextRequest } from "next/server"
import { saveDesiredState } from "@/lib/whatsapp-desktop/control-plane-server"
import { fail, governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"

async function deviceId(routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  return String((await Promise.resolve(routeContext.params)).id || "")
}

export async function GET(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.device.view" })
  if ("error" in context) return context.error
  const id = await deviceId(routeContext)
  const { data, error } = await context.supabase.from("whatsapp_desktop_device_governance_state").select("*").eq("device_id", id).maybeSingle()
  if (error) return fail(error.message, 500)
  return ok(data || null)
}

export async function PATCH(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.device.reassign" })
  if ("error" in context) return context.error
  try {
    return ok(await saveDesiredState(context, await deviceId(routeContext), await parseBody(request)))
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error), 400)
  }
}
