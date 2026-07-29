import { apiError, insertAudit, insertRow, requireCapitalApiActor, success } from "@/lib/ac-capital-os/server/mz15-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const actor = await requireCapitalApiActor();
    const body = await request.json() as Record<string, unknown>;
    const query = String(body.query || "AngelCare funding opportunities").trim();
    const run = await insertRow("ac_capital_radar_research_runs", {
      run_label: `Dry research: ${query}`,
      adapter_name: "AC Capital Governed Research Adapter",
      adapter_mode: "simulated",
      status: "completed",
      opportunities_detected: 0,
      sources_captured: 0,
      failed_sources: 0,
      human_review_required: 1,
      finished_at: new Date().toISOString(),
      safety_note: "Dry-run only. No live web/Gemini provider call and no fabricated opportunity was created.",
    });
    const result = {
      query,
      run,
      output: {
        summary: "Research workflow, source requirements and human-review controls were exercised without a live provider call.",
        sourceConfidence: 0,
        needsHumanReview: true,
        opportunities: [],
      },
    };
    await insertAudit({ actor: actor.email || actor.name, action: "radar_research_dry_run", objectType: "research_run", objectId: String(run.id), after: result, risk: "Medium", approval: "Human review" });
    return Response.json(success(result, "AI dry-run completed. No live research and no external provider call occurred."));
  } catch (reason) { return apiError(reason); }
}
