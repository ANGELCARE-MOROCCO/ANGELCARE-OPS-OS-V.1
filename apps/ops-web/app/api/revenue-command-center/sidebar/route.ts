import { ok } from "@/lib/revenue-command-center/canonical-server"
import { REVENUE_COMMAND_CENTER_ROUTES } from "@/lib/revenue-command-center/route-registry"

export async function GET() {
  return ok({ routes: REVENUE_COMMAND_CENTER_ROUTES, source: "canonical_route_registry" })
}
