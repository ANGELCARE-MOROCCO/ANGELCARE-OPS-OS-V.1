import { NextRequest } from "next/server"
import { fail, governanceContext, ok, publicDevice } from "@/lib/whatsapp-desktop/server"

export async function GET(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.device.view" })
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const { data, error } = await context.supabase.from("whatsapp_desktop_devices").select("*,workspace_access:whatsapp_desktop_device_workspace_access(*),heartbeats:whatsapp_desktop_heartbeats(*),commands:whatsapp_desktop_commands(*)").eq("id", id).maybeSingle()
  if (error) return fail(error.message, 500)
  if (!data) return fail("DEVICE_NOT_FOUND", 404)
  if (Array.isArray(data.heartbeats)) data.heartbeats = data.heartbeats.slice(-100).reverse()
  if (Array.isArray(data.commands)) data.commands = data.commands.slice(-100).reverse()
  return ok(publicDevice(data))
}
