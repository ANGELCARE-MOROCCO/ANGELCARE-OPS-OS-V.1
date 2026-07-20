import { NextRequest } from "next/server"
import { accessEvent, fail, governanceContext, issueAuthorizationLease, ok, parseBody, securityEvent } from "@/lib/whatsapp-desktop/server"

export async function POST(request: NextRequest) {
  const context = await governanceContext(request)
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const installationId = String(body.installation_id || "")
  const workspaceId = String(body.workspace_id || "")
  const desktopVersion = String(body.desktop_version || "0.0.0")
  if (!installationId || !workspaceId) return fail("INSTALLATION_AND_WORKSPACE_REQUIRED")
  const result = await issueAuthorizationLease(context.supabase, { userId: context.userId, installationId, workspaceId, desktopVersion })
  await accessEvent(context.supabase, { eventType: "authorization_issued", userId: context.userId, deviceId: result.device?.id, workspaceId, assignmentId: result.assignment?.id, outcome: result.authorized ? "authorized" : "denied", reason: result.reason, metadata: { desktop_version: desktopVersion }, ip: context.ip, userAgent: context.userAgent })
  if (!result.authorized) await securityEvent(context.supabase, { severity: result.reason.includes("REVOKED") || result.reason.includes("COMPROMISED") ? "high" : "attention", eventType: "authorization_denied", userId: context.userId, deviceId: result.device?.id, workspaceId, title: "Accès WhatsApp Desktop refusé", description: result.reason })
  return ok(result)
}
