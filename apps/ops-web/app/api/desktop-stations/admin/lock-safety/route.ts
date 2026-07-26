import { NextRequest } from "next/server"
import { fail, ok, stationAdminContext } from "@/lib/desktop-stations/server"
import { loadLockSafetyOverview } from "@/lib/desktop-stations/lock-safety"

export async function GET(request: NextRequest) {
  const context = await stationAdminContext(request)
  if ("error" in context) return context.error
  try { return ok(await loadLockSafetyOverview(context)) }
  catch (cause) { return fail(cause instanceof Error ? cause.message : String(cause), 500) }
}
