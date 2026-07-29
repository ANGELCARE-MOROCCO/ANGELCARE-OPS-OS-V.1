import { apiError, isWriter, requireCapitalApiActor, success } from "@/lib/ac-capital-os/server/mz15-api";
import { emitCapitalEvent, processCapitalEventById } from "@/lib/ac-capital-os/server/capital-orchestrator";
import type { JsonRecord } from "@/lib/ac-capital-os/server/free-provider-types";

export const dynamic = "force-dynamic";
const clean = (value: unknown) => String(value ?? "").trim();

const eventByAgent: Record<string, { eventType: string; entityType: string; workspace: string }> = {
  "funder-intelligence-agent": { eventType: "funder.refresh.requested", entityType: "funder", workspace: "funders" },
  "qualification-underwriter": { eventType: "opportunity.qualify.requested", entityType: "opportunity", workspace: "qualification" },
  "funding-case-architect": { eventType: "case.regenerate.requested", entityType: "qualification", workspace: "cases" },
  "data-room-proof-agent": { eventType: "proof.updated", entityType: "document", workspace: "data-room" },
  "pipeline-intelligence-agent": { eventType: "pipeline.updated", entityType: "pipeline", workspace: "pipeline" },
  "coordinator-mission-planner": { eventType: "approval.granted", entityType: "approval", workspace: "coordinator" },
  "capital-learning-agent": { eventType: "outcome.recorded", entityType: "learning", workspace: "learning" },
  "executive-report-agent": { eventType: "report.requested", entityType: "report", workspace: "reports" },
};

export async function POST(request: Request) {
  try {
    const actor = await requireCapitalApiActor();
    if (!isWriter(actor)) throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    const body = await request.json() as JsonRecord;
    const agentKey = clean(body.agentKey);
    const contract = eventByAgent[agentKey];
    if (!contract) throw Object.assign(new Error("AC_CAPITAL_EXECUTABLE_AGENT_REQUIRED"), { status: 400 });
    const entityId = clean(body.entityId);
    if (!entityId && agentKey !== "executive-report-agent") throw Object.assign(new Error("ENTITY_REQUIRED"), { status: 400 });
    const event = await emitCapitalEvent({
      eventType: contract.eventType, entityType: contract.entityType, entityId: entityId || null,
      sourceWorkspace: contract.workspace, payload: { ...(body.payload as JsonRecord || {}), manualAgentKey: agentKey },
      idempotencyKey: `manual-agent:${agentKey}:${entityId || "department"}:${Date.now()}`, priority: "high", actor: actor.email || actor.name,
    });
    const execution = await processCapitalEventById(actor, clean(event.id));
    return Response.json(success({ event, execution }));
  } catch (error) { return apiError(error); }
}
