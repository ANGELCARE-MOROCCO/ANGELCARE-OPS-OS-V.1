import { NextRequest } from "next/server"
import { fail, governanceContext, ok, resolveEffectivePolicy } from "@/lib/desktop-stations/server"
export async function GET(request: NextRequest) {
  const context = await governanceContext(request); if ("error" in context) return context.error
  const installationId = String(request.nextUrl.searchParams.get("installationId") || request.headers.get("x-angelcare-desktop-installation") || "")
  if (!installationId) return fail("INSTALLATION_ID_REQUIRED")
  const result = await resolveEffectivePolicy(context, installationId)
  if (!result.device) return fail("DEVICE_NOT_REGISTERED_OR_MISMATCH", 404)
  return ok(result)
}
