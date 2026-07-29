import { apiError, isWriter, requireCapitalApiActor, success } from "@/lib/ac-capital-os/server/mz15-api";
import { runDueAcCapitalAgents } from "@/lib/ac-capital-os/server/free-provider-control";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const actor = await requireCapitalApiActor();
    if (!isWriter(actor)) throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    return Response.json(success(await runDueAcCapitalAgents(actor)));
  } catch (error) {
    return apiError(error);
  }
}
