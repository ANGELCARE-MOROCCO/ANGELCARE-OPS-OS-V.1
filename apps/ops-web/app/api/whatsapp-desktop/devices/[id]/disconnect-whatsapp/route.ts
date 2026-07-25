import { NextRequest } from "next/server"
import { governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"
import { DEVICE_ACTION_PERMISSIONS, disconnectWhatsApp, lifecycleError } from "@/lib/whatsapp-desktop/device-lifecycle"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: DEVICE_ACTION_PERMISSIONS.disconnect })
  if ("error" in context) return context.error
  try {
    const id = String((await Promise.resolve(routeContext.params)).id || "")
    const body = await parseBody(request)
    return ok(await disconnectWhatsApp(context, id, String(body.reason || "Déconnexion WhatsApp administrative")))
  } catch (error) { return lifecycleError(error) }
}
