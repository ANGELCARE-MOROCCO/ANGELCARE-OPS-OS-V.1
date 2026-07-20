import { NextRequest } from "next/server"
import { fail, ok, parseBody, hasGovernancePermission } from "@/lib/whatsapp-desktop/server"
import { CONTEXT_PERMISSIONS, auditContextAction, contextRequestContext, loadBusinessContext } from "@/lib/whatsapp-desktop/context-server"
async function idOf(ctx: { params: Promise<{ contextId: string }> | { contextId: string } }) { return String((await Promise.resolve(ctx.params)).contextId || "") }
export async function GET(request: NextRequest, routeContext: { params: Promise<{ contextId: string }> | { contextId: string } }) {
  const context = await contextRequestContext(request, CONTEXT_PERMISSIONS.view); if ("error" in context) return context.error
  try {
    const id = await idOf(routeContext); const admin = hasGovernancePermission(context.user, "whatsapp_context.analytics.view")
    const row = await loadBusinessContext(context.supabase, id, context.userId, admin, CONTEXT_PERMISSIONS.view)
    const [attempts, notes, tasks, appointments, documents, handoffs, escalations, timeline, messages] = await Promise.all([
      context.supabase.from("whatsapp_contact_attempts").select("*").eq("context_id", id).order("opened_at", { ascending: false }),
      context.supabase.from("whatsapp_context_notes").select("*").eq("context_id", id).order("created_at", { ascending: false }),
      context.supabase.from("whatsapp_context_tasks").select("*").eq("context_id", id).order("created_at", { ascending: false }),
      context.supabase.from("whatsapp_context_appointments").select("*").eq("context_id", id).order("starts_at", { ascending: true }),
      context.supabase.from("whatsapp_context_documents").select("*").eq("context_id", id).order("created_at", { ascending: false }),
      context.supabase.from("whatsapp_context_handoffs").select("*").eq("context_id", id).order("created_at", { ascending: false }),
      context.supabase.from("whatsapp_context_escalations").select("*").eq("context_id", id).order("created_at", { ascending: false }),
      context.supabase.from("whatsapp_context_events").select("*").eq("context_id", id).order("created_at", { ascending: false }).limit(200),
      context.supabase.from("whatsapp_prepared_messages").select("*").eq("context_id", id).order("created_at", { ascending: false }),
    ])
    return ok({ ...row, attempts: attempts.data || [], notes: notes.data || [], tasks: tasks.data || [], appointments: appointments.data || [], documents: documents.data || [], handoffs: handoffs.data || [], escalations: escalations.data || [], timeline: timeline.data || [], prepared_messages: messages.data || [] })
  } catch (error) { return fail(error instanceof Error ? error.message : String(error), 404) }
}
export async function PATCH(request: NextRequest, routeContext: { params: Promise<{ contextId: string }> | { contextId: string } }) {
  const context = await contextRequestContext(request, CONTEXT_PERMISSIONS.prepare); if ("error" in context) return context.error
  try {
    const id = await idOf(routeContext); const current = await loadBusinessContext(context.supabase, id, context.userId, false, CONTEXT_PERMISSIONS.prepare)
    const body = await parseBody(request); const update: Record<string,unknown> = {}
    for (const key of ["communication_purpose","expected_outcome","prepared_message","current_stage","preferred_language"] as const) if (body[key] !== undefined) update[key] = String(body[key] || "").slice(0, key === "prepared_message" ? 12000 : 500) || null
    if (body.priority && ["low","normal","high","critical"].includes(String(body.priority))) update.priority = body.priority
    const { data, error } = await context.supabase.from("whatsapp_context_sessions").update(update).eq("id", id).select("*").single()
    if (error) return fail(error.message, 400)
    await auditContextAction(context.supabase, context, { contextId: id, workspaceId: current.workspace_id, action: "whatsapp_context.updated", reason: String(body.reason || "Mise à jour du contexte"), previous: current, next: data })
    return ok(data)
  } catch (error) { return fail(error instanceof Error ? error.message : String(error), 400) }
}
