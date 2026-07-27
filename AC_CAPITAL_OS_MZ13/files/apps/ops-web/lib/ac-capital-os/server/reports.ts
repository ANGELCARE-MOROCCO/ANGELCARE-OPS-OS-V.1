import { supabaseRestInsert, supabaseRestSelect } from "./supabase";

export type AcCapitalReportType =
  | "Founder Capital Brief"
  | "Bank Readiness Report"
  | "Investor Readiness Report"
  | "Grant Readiness Report"
  | "Pipeline Executive Report"
  | "Data Room Readiness Report"
  | "AI Governance Report"
  | "Coordinator Workload Report"
  | "Risk & Objection Report"
  | "Production Readiness Report"
  | "Monthly Capital Committee Report";

export async function generateAcCapitalReport(type: AcCapitalReportType, format: "markdown" | "html" | "json" = "markdown") {
  const timestamp = new Date().toISOString();
  const title = `${type} — AC CAPITAL OS`;
  const sections = [
    "Executive summary",
    "Live data availability",
    "Risk and approval flags",
    "Recommended next actions",
    "Truth boundary",
  ];

  const content = {
    title,
    type,
    format,
    generatedAt: timestamp,
    sections,
    truthBoundary: "Report generation foundation only. PDF export is a future phase unless scoped separately.",
  };

  await supabaseRestInsert("ac_capital_report_exports", {
    report_type: type,
    format,
    status: "Generated",
    output_reference: null,
    metadata: content,
    created_at: timestamp,
  });

  return {
    ok: true,
    dataMode: "supabase-live",
    source: "supabase",
    data: content,
  };
}

export async function listAcCapitalReports() {
  const result = await supabaseRestSelect("ac_capital_report_exports", { limit: 50 });
  return {
    ok: true,
    dataMode: result.rows.length ? "supabase-live" : "seeded-fallback",
    source: result.rows.length ? "supabase" : "seeded",
    warning: result.warning,
    data: result.rows,
  };
}
