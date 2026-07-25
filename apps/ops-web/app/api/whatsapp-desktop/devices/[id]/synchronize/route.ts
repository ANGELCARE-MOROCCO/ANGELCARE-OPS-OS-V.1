import { NextRequest } from "next/server"
import { queueSynchronization } from "@/lib/whatsapp-desktop/control-plane-server"
import { fail, governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest, routeContext: { params: Promise<{ id: string }> | { id: string } }) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.command.issue" })
  if ("error" in context) return context.error
  const id = String((await Promise.resolve(routeContext.params)).id || "")
  const body = await parseBody(request)
  try {
    const reason = String(body.reason || "Synchronisation gouvernée depuis /whatsapp-os/admin").slice(0, 1000)
    return ok(await queueSynchronization(context, id, reason, String(body.trigger_type || "manual")))
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error), 400)
  }
}
