import { apiError, requireCapitalApiActor, success } from "@/lib/ac-capital-os/server/mz15-api";
import { processCapitalOrchestratorQueue, runCapitalIntegrityScan } from "@/lib/ac-capital-os/server/capital-orchestrator";
export const dynamic = "force-dynamic";
export async function POST() { try { const actor = await requireCapitalApiActor(); const queue = await processCapitalOrchestratorQueue(actor, 20); const integrity = await runCapitalIntegrityScan(actor); return Response.json(success({ queue, integrity })); } catch (error) { return apiError(error); } }
