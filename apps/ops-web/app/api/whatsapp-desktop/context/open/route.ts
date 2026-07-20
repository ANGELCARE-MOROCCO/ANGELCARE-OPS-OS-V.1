import { NextRequest } from "next/server"
import { fail, ok, parseBody } from "@/lib/whatsapp-desktop/server"
import { CONTEXT_PERMISSIONS, contextEvent, contextRequestContext, loadBusinessContext, requireWorkspaceAssignment } from "@/lib/whatsapp-desktop/context-server"

export async function POST(request: NextRequest) {
  const context = await contextRequestContext(request, CONTEXT_PERMISSIONS.open)
  if ("error" in context) return context.error
  const body = await parseBody(request)
  try {
    const row = await loadBusinessContext(context.supabase, String(body.context_id || ""), context.userId, false, CONTEXT_PERMISSIONS.open)
    await requireWorkspaceAssignment(context.supabase, context.userId, row.workspace_id, row.context_type)
    if (!row.phone_number_e164 || !["validated", "needs_confirmation"].includes(row.phone_status)) return fail("VALID_WHATSAPP_PHONE_REQUIRED", 422)
    const message = String(body.prepared_message ?? row.prepared_message ?? "").slice(0, 12000)
    const { data: attempt, error } = await context.supabase.from("whatsapp_contact_attempts").insert({
      context_id: row.id, workspace_id: row.workspace_id, user_id: context.userId,
      device_id: body.device_id || row.device_id || null, normalized_phone: row.phone_number_e164,
      purpose: row.communication_purpose, prepared_message_snapshot: message || null,
      status: "awaiting_outcome", metadata: { operator_declared: true, delivery_evidence: "not_available_from_embedded_browser" },
    }).select("*").single()
    if (error) return fail(error.message, 400)
    await context.supabase.from("whatsapp_context_sessions").update({ status: "awaiting_outcome", opened_at: new Date().toISOString(), prepared_message: message || null }).eq("id", row.id)
    await contextEvent(context.supabase, { contextId: row.id, workspaceId: row.workspace_id, userId: context.userId, eventType: "whatsapp_opened", title: "Workspace WhatsApp ouvert", detail: "Conversation préparée. Envoi manuel requis.", entityType: "contact_attempt", entityId: attempt.id, metadata: { declared_sent: false } })
    return ok({ attempt, context: { ...row, prepared_message: message }, navigation: { phone: row.phone_number_e164, text: message, contextId: row.id, attemptId: attempt.id } })
  } catch (error) { return fail(error instanceof Error ? error.message : String(error), 400) }
}
