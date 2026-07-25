import { NextRequest } from "next/server"
import { governanceContext, ok, parseBody, publicDevice } from "@/lib/whatsapp-desktop/server"
import { DEVICE_ACTION_PERMISSIONS, lifecycleError, restoreDevice } from "@/lib/whatsapp-desktop/device-lifecycle"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: DEVICE_ACTION_PERMISSIONS.restore })
  if ("error" in context) return context.error
  try {
    const id = String((await Promise.resolve(routeContext.params)).id || "")
    const body = await parseBody(request)
    const reason = String(body.reason || "Restauration administrative contrôlée")
    return ok(publicDevice(await restoreDevice(context, id, reason)))
  } catch (error) { return lifecycleError(error) }
}
