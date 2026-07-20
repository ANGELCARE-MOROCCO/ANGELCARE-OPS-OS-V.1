import { NextRequest } from "next/server"
import { fail, governanceContext, ok } from "@/lib/whatsapp-desktop/server"

export async function GET(request: NextRequest) {
  const context = await governanceContext(request, { adminPermission: "whatsapp_desktop.audit.view" })
  if ("error" in context) return context.error
  const limit = Math.max(1, Math.min(1000, Number(request.nextUrl.searchParams.get("limit") || 300)))
  const { data, error } = await context.supabase.from("whatsapp_desktop_audit_events").select("*").order("created_at", { ascending: false }).limit(limit)
  if (error) return fail(error.message, 500)
  return ok(data || [])
}
