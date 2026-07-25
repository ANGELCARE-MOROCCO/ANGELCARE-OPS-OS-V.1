import { NextRequest } from "next/server"
import { governanceContext, ok } from "@/lib/whatsapp-desktop/server"
import { DEVICE_ACTION_PERMISSIONS, lifecycleError, loadDeviceLifecycle } from "@/lib/whatsapp-desktop/device-lifecycle"

export async function GET(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: DEVICE_ACTION_PERMISSIONS.view })
  if ("error" in context) return context.error
  try { return ok(await loadDeviceLifecycle(context.supabase, String((await Promise.resolve(routeContext.params)).id || ""))) }
  catch (error) { return lifecycleError(error) }
}
