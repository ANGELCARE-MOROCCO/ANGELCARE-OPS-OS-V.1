import { NextRequest } from "next/server"
import { fail, governanceContext, issueAuthorizationLease, ok, parseBody } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest) {
  const context = await governanceContext(request)
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const installationId = String(body.installation_id || "")
  const workspaceId = String(body.workspace_id || "")
  const desktopVersion = String(body.desktop_version || "0.0.0")
  if (!installationId || !workspaceId) return fail("INSTALLATION_AND_WORKSPACE_REQUIRED")
  const result = await issueAuthorizationLease(context.supabase, { userId: context.userId, installationId, workspaceId, desktopVersion })
  return ok(result)
}
