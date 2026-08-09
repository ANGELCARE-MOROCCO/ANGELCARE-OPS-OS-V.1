import { getAcCapitalFeatureFlags } from "./feature-flags";
import type { AcCapitalResearchResult } from "./research-types";
import { supabaseRestInsert } from "./supabase";

export async function runResearchAdapter(input: { query: string; mode?: "manual" | "dry-run" | "provider-control" | "disabled" }) {
  const flags = getAcCapitalFeatureFlags();
  const mode = input.mode || (flags.allowResearch ? "provider-control" : "dry-run");

  if (mode === "disabled") {
    return { ok: false, dataMode: "disabled", source: "none", warning: "Research adapter disabled.", data: [] };
  }

  const result: AcCapitalResearchResult = {
    sourceUrl: undefined,
    sourceTitle: "Dry-run research adapter",
    sourceConfidence: 0,
    sourceFreshness: "Not live. Human review required.",
    detectedAt: new Date().toISOString(),
    needsHumanReview: true,
    title: `Dry-run result for ${input.query}`,
    summary: "No live web/Gemini research was executed. Configure provider-control and enable research flags for live mode.",
  };

  await supabaseRestInsert("ac_capital_radar_research_runs", {
    run_status: mode === "provider-control" ? "provider-control requested" : "dry-run",
    query: input.query,
    source_count: 0,
    created_at: new Date().toISOString(),
  });

  return {
    ok: true,
    dataMode: "seeded-fallback",
    source: "seeded",
    warning: "Dry-run research only. No unsourced funder, fake deadline or fake confidence was created.",
    data: [result],
  };
}
