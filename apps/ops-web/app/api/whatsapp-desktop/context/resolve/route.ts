import { NextRequest } from "next/server"
import { fail, ok, parseBody } from "@/lib/whatsapp-desktop/server"
import { CONTEXT_PERMISSIONS, auditContextAction, contextEvent, contextRequestContext, ensureSourceModulePermission, requireWorkspaceAssignment, resolveBusinessEntity } from "@/lib/whatsapp-desktop/context-server"

export async function POST(request: NextRequest) {
  const context = await contextRequestContext(request, CONTEXT_PERMISSIONS.open)
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const workspaceId = String(body.workspace_id || "")
  if (!workspaceId) return fail("WORKSPACE_ID_REQUIRED")
  try {
    ensureSourceModulePermission(context.user, String(body.context_type || ""))
    const assignment = await requireWorkspaceAssignment(context.supabase, context.userId, workspaceId, String(body.context_type || ""), CONTEXT_PERMISSIONS.open)
    const operatorName = String(context.user.full_name || context.user.email || context.user.username || "Équipe ANGELCARE")
    const resolved = await resolveBusinessEntity(context.supabase, body, operatorName)
    const { data: session, error } = await context.supabase.from("whatsapp_context_sessions").insert({
      workspace_id: workspaceId, user_id: context.userId, device_id: body.device_id || null,
      context_type: resolved.context_type, entity_id: resolved.entity_id, entity_name: resolved.entity_name,
      phone_number_raw: resolved.phone_number_raw, phone_number_e164: resolved.phone.normalized_e164,
      phone_status: resolved.phone.status, module_label: resolved.module_label, source_route: resolved.source_route,
      communication_purpose: resolved.communication_purpose, current_stage: resolved.current_stage,
      assigned_user_id: resolved.assigned_user_id, priority: resolved.priority,
      preferred_language: resolved.preferred_language, expected_outcome: resolved.expected_outcome,
      prepared_message: resolved.prepared_message, adapter_id: resolved.adapter_id, source_table: resolved.source_table,
      source_snapshot: resolved.source_snapshot, variables: resolved.variables,
      status: resolved.phone.normalized_e164 ? "ready" : "draft",
    }).select("*").single()
    if (error) return fail(error.message, 400)
    if (resolved.prepared_message) await context.supabase.from("whatsapp_prepared_messages").insert({
      context_id: session.id, workspace_id: workspaceId, user_id: context.userId,
      message_mode: body.message_mode || "corporate", language: resolved.preferred_language,
      source_type: body.prepared_message ? "record" : "context_default", body: resolved.prepared_message,
      variables_snapshot: resolved.variables,
    })
    const allowedDocumentCategories = Array.isArray(assignment.policyJson?.allowed_document_categories) ? assignment.policyJson.allowed_document_categories : []
    const permittedDocuments = allowedDocumentCategories.length ? resolved.documents.filter((document) => allowedDocumentCategories.includes(document.category)) : resolved.documents
    if (permittedDocuments.length) await context.supabase.from("whatsapp_context_documents").insert(permittedDocuments.map((document) => ({
      context_id: session.id, workspace_id: workspaceId, label: document.label, category: document.category,
      filename: document.filename || null, secure_url: document.url, source: "adapter", metadata: { source_id: document.id || null },
    })))
    await contextEvent(context.supabase, { contextId: session.id, workspaceId, userId: context.userId, eventType: "context_resolved", title: "Contexte WhatsApp préparé", detail: `${resolved.module_label} · ${resolved.entity_name}`, entityType: resolved.context_type, entityId: resolved.entity_id, metadata: { phone_status: resolved.phone.status, adapter_id: resolved.adapter_id } })
    await auditContextAction(context.supabase, context, { contextId: session.id, workspaceId, action: "whatsapp_context.resolved", reason: resolved.communication_purpose, next: session })
    return ok({ context: session, resolved, phone: resolved.phone })
  } catch (error) { return fail(error instanceof Error ? error.message : String(error), 400) }
}
