import { apiError, isWriter, requireCapitalApiActor, success } from "@/lib/ac-capital-os/server/mz15-api";
import { executeRadarWorkbenchAction, loadRadarWorkbench } from "@/lib/ac-capital-os/server/radar-workbench";

export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

export async function GET() {
  try {
    await requireCapitalApiActor();
    const data = await loadRadarWorkbench();
    return Response.json(success(data));
  } catch (reason) {
    return apiError(reason);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCapitalApiActor();
    if (!isWriter(actor)) {
      throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    }
    const body = (await request.json()) as JsonRecord;
    const requestedAction = String(body.action || "").trim();
    const legacyMap: Record<string, string> = {
      "validate-source": "opportunity-disposition",
      handoff: "send-to-qualification",
      monitor: "opportunity-disposition",
      reject: "opportunity-disposition",
    };
    const action = legacyMap[requestedAction] || requestedAction;
    const normalizedBody: JsonRecord = { ...body };
    if (requestedAction === "validate-source") {
      normalizedBody.opportunityId = body.id;
      normalizedBody.disposition = body.valid === false ? "watchlist" : "qualify";
      normalizedBody.reason = body.reviewNote;
    }
    if (requestedAction === "handoff") {
      normalizedBody.opportunityId = body.id;
      normalizedBody.reason = body.instruction;
    }
    if (requestedAction === "monitor" || requestedAction === "reject") {
      normalizedBody.opportunityId = body.id;
      normalizedBody.disposition = requestedAction;
    }
    if (requestedAction === "create-opportunity") {
      throw Object.assign(
        new Error("MANUAL_OPPORTUNITY_CREATION_MOVED_TO_SOURCE_CONVERSION_OR_CREATE_OPPORTUNITY_FROM_SOURCE"),
        { status: 400 },
      );
    }
    if (!action) throw Object.assign(new Error("RADAR_WORKBENCH_ACTION_REQUIRED"), { status: 400 });
    const result = await executeRadarWorkbenchAction({ action, body: normalizedBody, actor });
    return Response.json(success(result));
  } catch (reason) {
    return apiError(reason);
  }
}
