import { NextRequest } from "next/server"
import { fail, ok, parseBody } from "@/lib/whatsapp-desktop/server"
import { CONTEXT_PERMISSIONS, contextRequestContext, normalizeWhatsAppPhone } from "@/lib/whatsapp-desktop/context-server"
export async function POST(request: NextRequest) { const context = await contextRequestContext(request, CONTEXT_PERMISSIONS.view); if ("error" in context) return context.error; const body = await parseBody(request); const result = normalizeWhatsAppPhone(body.phone, String(body.default_country || "MA")); return result.status === "missing" ? fail("PHONE_MISSING", 422, { data: result }) : ok(result) }
