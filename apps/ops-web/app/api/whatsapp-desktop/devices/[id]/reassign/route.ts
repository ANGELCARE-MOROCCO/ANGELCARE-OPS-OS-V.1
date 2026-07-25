import { NextRequest } from "next/server"
import { governanceContext, ok, parseBody, publicDevice } from "@/lib/whatsapp-desktop/server"
import { DEVICE_ACTION_PERMISSIONS, lifecycleError, reassignDevice } from "@/lib/whatsapp-desktop/device-lifecycle"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: DEVICE_ACTION_PERMISSIONS.reassign })
  if ("error" in context) return context.error
  try {
    const id = String((await Promise.resolve(routeContext.params)).id || "")
    const body = await parseBody(request)
    const workspaceIds = Array.isArray(body.workspace_ids) ? body.workspace_ids.map(String) : []
    return ok(publicDevice(await reassignDevice(context, id, { userId: String(body.user_id || ""), workspaceIds, reason: String(body.reason || "Réaffectation administrative") })))
  } catch (error) { return lifecycleError(error) }
}
