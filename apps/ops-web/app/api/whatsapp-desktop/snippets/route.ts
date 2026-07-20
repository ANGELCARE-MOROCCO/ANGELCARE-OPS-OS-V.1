import { NextRequest } from "next/server"
import { fail, ok } from "@/lib/whatsapp-desktop/server"
import { CONTEXT_PERMISSIONS, contextRequestContext } from "@/lib/whatsapp-desktop/context-server"
export async function GET(request: NextRequest) { const context = await contextRequestContext(request, CONTEXT_PERMISSIONS.prepare); if ("error" in context) return context.error; let query = context.supabase.from("whatsapp_message_snippets").select("*").eq("active", true).eq("approval_status", "approved"); const module = request.nextUrl.searchParams.get("module"); if (module) query = query.in("module", [module, "universal"]); const { data, error } = await query.order("sort_order", { ascending: true }); if (error) return fail(error.message, 500); return ok(data || []) }
