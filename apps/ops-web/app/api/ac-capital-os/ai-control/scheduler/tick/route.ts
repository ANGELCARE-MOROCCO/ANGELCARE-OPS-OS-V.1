import { governRoute } from '@/lib/runtime/governor/route'
import { apiError, isWriter, requireCapitalApiActor, success } from "@/lib/ac-capital-os/server/mz15-api";
import { runDueAcCapitalAgents } from "@/lib/ac-capital-os/server/free-provider-control";

export const dynamic = "force-dynamic";

async function POST__angelcareGovernedImpl() {
  try {
    const actor = await requireCapitalApiActor();
    if (!isWriter(actor)) throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    return Response.json(success(await runDueAcCapitalAgents(actor)));
  } catch (error) {
    return apiError(error);
  }
}

export const POST = governRoute(
  {
    workloadClass: 'worker',
    operation: 'POST:/api/ac-capital-os/ai-control/scheduler/tick',
  },
  POST__angelcareGovernedImpl,
)
