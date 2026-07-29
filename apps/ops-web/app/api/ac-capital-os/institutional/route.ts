import { apiError, isWriter, requireCapitalApiActor, success } from "@/lib/ac-capital-os/server/mz15-api";
import { executeInstitutionalAction, loadInstitutionalSnapshot, searchInstitutionalRecords } from "@/lib/ac-capital-os/server/institutional-runtime";
import type { JsonRecord } from "@/lib/ac-capital-os/server/free-provider-types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const actor = await requireCapitalApiActor();
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "snapshot";
    const data = mode === "search"
      ? await searchInstitutionalRecords({
          query: url.searchParams.get("query") || undefined,
          entityType: url.searchParams.get("entityType") || undefined,
          status: url.searchParams.get("status") || undefined,
          limit: Number(url.searchParams.get("limit") || 50),
        })
      : await loadInstitutionalSnapshot({
          workspaceKey: url.searchParams.get("workspaceKey") || undefined,
          entityType: url.searchParams.get("entityType") || undefined,
          entityId: url.searchParams.get("entityId") || undefined,
          actor,
        });
    return Response.json(success(data));
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCapitalApiActor();
    if (!isWriter(actor)) throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    const body = await request.json() as { action?: string; payload?: JsonRecord };
    if (!body.action) throw Object.assign(new Error("ACTION_REQUIRED"), { status: 400 });
    return Response.json(success(await executeInstitutionalAction(body.action, body.payload || {}, actor)));
  } catch (error) { return apiError(error); }
}
