import { runAcCapitalAiAgent } from "../../../../../lib/ac-capital-os/server/ai-runner";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await runAcCapitalAiAgent({
    agentKey: String(body.agentKey || "capital_executive_brain"),
    workspace: String(body.workspace || "AI Command Center"),
    prompt: typeof body.prompt === "string" ? body.prompt : undefined,
    approvalStatus: typeof body.approvalStatus === "string" ? body.approvalStatus : undefined,
    riskLevel: typeof body.riskLevel === "string" ? body.riskLevel : undefined,
    liveRequested: body.liveRequested === true,
  });
  return Response.json(result, { status: result.ok ? 200 : 403 });
}
