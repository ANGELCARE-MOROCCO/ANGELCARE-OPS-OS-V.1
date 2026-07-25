import { NextRequest } from "next/server"
import { governanceContext, ok, parseBody, publicDevice } from "@/lib/whatsapp-desktop/server"
import { DEVICE_ACTION_PERMISSIONS, lifecycleError, reinstateDevice } from "@/lib/whatsapp-desktop/device-lifecycle"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: DEVICE_ACTION_PERMISSIONS.restore })
  if ("error" in context) return context.error
  try {
    const id = String((await Promise.resolve(routeContext.params)).id || "")
    const body = await parseBody(request)
    return ok(publicDevice(await reinstateDevice(context, id, String(body.reason || "Réhabilitation avec nouvelle approbation"))))
  } catch (error) { return lifecycleError(error) }
}
