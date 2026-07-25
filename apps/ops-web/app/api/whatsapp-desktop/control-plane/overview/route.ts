import { NextRequest } from "next/server"
import { loadControlPlaneOverview } from "@/lib/whatsapp-desktop/control-plane-server"
import { fail, governanceContext, ok } from "@/lib/whatsapp-desktop/server"

export async function GET(request: NextRequest) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.workspace.view" })
  if ("error" in context) return context.error
  try {
    const refreshAlerts = request.nextUrl.searchParams.get("refreshAlerts") === "1"
    return ok(await loadControlPlaneOverview(context.supabase, { refreshAlerts }))
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error), 500)
  }
}
