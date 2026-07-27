import { supabaseRestInsert } from "../../../../../lib/ac-capital-os/server/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const record = {
    issue_title: String(body.issueTitle || "AI issue reported"),
    category: String(body.category || "AI troubleshooting"),
    severity: String(body.severity || "Medium"),
    affected_workspace: String(body.workspace || "AI Command Center"),
    reproduction_note: typeof body.reproductionNote === "string" ? body.reproductionNote : null,
    impact: typeof body.impact === "string" ? body.impact : null,
    recommended_fix: typeof body.recommendedFix === "string" ? body.recommendedFix : "Review prompt, doctrine and skill binding.",
    status: "New",
    owner: String(body.owner || "AI System Admin"),
    reported_by: String(body.reportedBy || "system-safe"),
    reported_at: new Date().toISOString(),
  };
  const result = await supabaseRestInsert("ac_capital_ai_troubleshooting_issues", record);
  return Response.json({
    ok: result.ok,
    dataMode: result.ok ? "supabase-live" : "seeded-fallback",
    source: result.ok ? "supabase" : "seeded",
    warning: result.warning,
    data: result.record || record,
  });
}
