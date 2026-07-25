import { NextRequest } from "next/server"
import { governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"
import { DEVICE_ACTION_PERMISSIONS, lifecycleError, purgeDevice } from "@/lib/whatsapp-desktop/device-lifecycle"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: DEVICE_ACTION_PERMISSIONS.forceDelete })
  if ("error" in context) return context.error
  try {
    const id = String((await Promise.resolve(routeContext.params)).id || "")
    return ok(await purgeDevice(context, request, id, await parseBody(request), true))
  } catch (error) { return lifecycleError(error) }
}
