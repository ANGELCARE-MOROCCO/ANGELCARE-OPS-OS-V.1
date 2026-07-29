import { executeCapitalReportComposition } from "@/lib/ac-capital-os/server/live-intelligence";
import { apiError, insertAudit, insertRow, isWriter, readTable, requireCapitalApiActor, requiredString, success } from "@/lib/ac-capital-os/server/mz15-api";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

const SOURCE_TABLES: Record<string, string[]> = {
  "command-floor": ["ac_capital_command_priorities", "ac_capital_deadline_risks", "ac_capital_document_blockers", "ac_capital_executive_snapshots"],
  strategy: ["ac_capital_strategy_scenarios", "ac_capital_strategy_scenario_outputs", "ac_capital_strategy_comparisons", "ac_capital_strategy_stress_tests", "ac_capital_production_readiness_checks", "ac_capital_production_blockers"],
  pipeline: ["ac_capital_pipeline_records", "ac_capital_pipeline_followups", "ac_capital_pipeline_tasks", "ac_capital_pipeline_submissions", "ac_capital_pipeline_negotiations", "ac_capital_pipeline_outcomes"],
  "capital-radar": ["ac_capital_radar_opportunities", "ac_capital_radar_sources", "ac_capital_radar_research_runs", "ac_capital_radar_rejections"],
  radar: ["ac_capital_radar_opportunities", "ac_capital_radar_sources", "ac_capital_radar_research_runs", "ac_capital_radar_rejections"],
  qualification: ["ac_capital_qualification_dossiers", "ac_capital_qualification_scores", "ac_capital_qualification_missing_documents", "ac_capital_qualification_risks", "ac_capital_qualification_decisions"],
  cases: ["ac_capital_cases", "ac_capital_case_stages", "ac_capital_case_documents", "ac_capital_case_risk_plans", "ac_capital_case_founder_approvals", "ac_capital_case_proof_packs"],
  "case-builder": ["ac_capital_cases", "ac_capital_case_stages", "ac_capital_case_documents", "ac_capital_case_risk_plans", "ac_capital_case_founder_approvals", "ac_capital_case_proof_packs"],
  "data-room": ["ac_capital_data_room_documents", "ac_capital_data_room_missing_evidence", "ac_capital_data_room_readiness_scores", "ac_capital_data_room_credibility_scores"],
  approvals: ["ac_capital_coordinator_founder_approvals", "ac_capital_case_founder_approvals", "ac_capital_ai_human_approval_queue"],
  coordinator: ["ac_capital_coordinator_tasks", "ac_capital_coordinator_proof_tasks", "ac_capital_coordinator_submission_readiness", "ac_capital_coordinator_escalations", "ac_capital_coordinator_completion_events"],
  "ai-capital-brain": ["ac_capital_ai_agent_runs", "ac_capital_ai_troubleshooting_issues", "ac_capital_ai_cost_usage", "ac_capital_ai_human_approval_queue"],
};

const SECRET_KEY = /secret|credential|api[_-]?key|token|password|authorization|cookie/i;

const POSITIVE_APPROVAL = /approved|validated|accepted|ready|active|completed|operating|released/i;
const NEGATIVE_APPROVAL = /draft|pending|rejected|declined|blocked|simulated|placeholder|archived|cancelled/i;

function approvedForReport(row: Row) {
  if (row.export_placeholder === true || row.is_placeholder === true || row.simulated === true) return false;
  const explicitBooleanKeys = ["approved", "is_approved", "founder_approved", "human_approved"];
  for (const key of explicitBooleanKeys) {
    if (key in row && row[key] !== true) return false;
  }
  const approvalValues = [row.approval_status, row.approval_state, row.decision_status, row.validation_status].filter((value) => value != null && String(value).trim());
  if (approvalValues.length && !approvalValues.every((value) => POSITIVE_APPROVAL.test(String(value)) && !NEGATIVE_APPROVAL.test(String(value)))) return false;
  if (row.founder_approval_required === true && !row.approved_at && !row.approved_by && !approvalValues.length) return false;
  const status = String(row.status || "").trim();
  if (status && NEGATIVE_APPROVAL.test(status)) return false;
  return true;
}

function safeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[depth-limited]";
  if (value == null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return value.length > 1800 ? `${value.slice(0, 1800)}…` : value;
  if (Array.isArray(value)) return value.slice(0, 30).map((item) => safeValue(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Row).filter(([key]) => !SECRET_KEY.test(key)).slice(0, 60).map(([key, item]) => [key, safeValue(item, depth + 1)]));
  }
  return String(value);
}

async function collectApprovedContext(workspaces: string[]) {
  const selected = workspaces.length ? workspaces : ["command-floor", "strategy", "pipeline"];
  const context: Row = { generatedAt: new Date().toISOString(), workspaces: {}, unavailableTables: [], truncatedTables: [], selectionPolicy: "Exclude explicit draft, pending, rejected, simulated, placeholder, archived or approval-gated-unapproved rows." };
  const workspaceContext = context.workspaces as Row;
  const unavailable = context.unavailableTables as string[];
  const truncated = context.truncatedTables as string[];
  let totalRows = 0;
  let remainingCharacters = 220_000;

  for (const workspace of selected) {
    const key = workspace.trim().toLowerCase();
    const tables = SOURCE_TABLES[key] || [];
    const group: Row = {};
    for (const table of tables) {
      try {
        const rows = await readTable(table, 20);
        const approvedRows = rows.filter(approvedForReport);
        const included: unknown[] = [];
        for (const row of approvedRows) {
          const cleaned = safeValue(row);
          const characterCount = JSON.stringify(cleaned).length;
          if (characterCount > remainingCharacters) { truncated.push(table); break; }
          included.push(cleaned);
          remainingCharacters -= characterCount;
        }
        group[table] = included;
        totalRows += included.length;
      } catch {
        unavailable.push(table);
      }
    }
    workspaceContext[workspace] = group;
  }

  return { context: safeValue(context) as Row, totalRows, unavailableTables: unavailable, truncatedTables: [...new Set(truncated)] };
}

export async function POST(request: Request) {
  try {
    const actor = await requireCapitalApiActor();
    if (!isWriter(actor)) throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    const body = await request.json() as Row;
    const reportType = requiredString(body.reportType, "Report type").slice(0, 160);
    const audience = String(body.audience || "Founder / Management").trim().slice(0, 240);
    const purpose = String(body.purpose || `Controlled ${reportType}`).trim().slice(0, 1200);
    const requestedSections = Array.isArray(body.sections) ? body.sections.map(String).map((item) => item.trim().slice(0, 160)).filter(Boolean).slice(0, 12) : [];
    const sections = requestedSections.length ? [...new Set(requestedSections)] : ["Executive Summary", "Readiness", "Risks", "Next Actions"];
    const requestedWorkspaces = Array.isArray(body.sourceWorkspaces) ? body.sourceWorkspaces.map(String).map((item) => item.trim().toLowerCase()).filter((item) => Boolean(SOURCE_TABLES[item])).slice(0, 12) : [];
    const sourceWorkspaces = requestedWorkspaces.length ? [...new Set(requestedWorkspaces)] : ["command-floor", "strategy", "pipeline"];
    const format = ["markdown", "html", "json"].includes(String(body.format || "markdown")) ? String(body.format || "markdown") : "markdown";
    const approvalRequirement = String(body.approvalRequirement || "Founder / Human review").trim().slice(0, 300);

    const snapshot = await collectApprovedContext(sourceWorkspaces);
    if (!snapshot.totalRows) throw Object.assign(new Error("AC_CAPITAL_REPORT_NO_APPROVED_SOURCE_RECORDS"), { status: 409 });

    const composition = await executeCapitalReportComposition({
      reportType,
      audience,
      purpose,
      sections,
      sourceWorkspaces,
      context: snapshot.context,
      actorId: actor.id || null,
    });

    const report = await insertRow("ac_capital_strategy_reports", {
      report_type: reportType,
      purpose,
      audience,
      source_workspaces: sourceWorkspaces,
      readiness: "AI Draft — Human Review",
      missing_data: composition.result.missingData,
      risk_flags: composition.result.riskFlags,
      approval_requirement: approvalRequirement,
      export_placeholder: false,
      status: "AI Draft — Human Review",
      provider_request_id: composition.requestId,
      provider_model: composition.result.providerModelVersion || composition.model,
      generated_body: composition.result,
      source_snapshot: snapshot.context,
      confidence_score: composition.result.confidence,
    });

    const createdSections: Row[] = [];
    for (const [index, section] of composition.result.sections.entries()) {
      createdSections.push(await insertRow("ac_capital_strategy_report_sections", {
        report_id: report.id,
        section_title: section.title,
        section_order: index + 1,
        source_workspace: section.sourceWorkspaces.join(", ") || sourceWorkspaces[0] || null,
        readiness: section.readiness,
        missing_data: section.missingData,
        risk_flags: section.riskFlags,
        content_placeholder: section.content,
        content_markdown: section.content,
        provider_request_id: composition.requestId,
      }));
    }

    const outputReference = `ac-capital-report://strategy-report/${String(report.id)}`;
    const content = {
      title: `${reportType} — AC CAPITAL OS`,
      audience,
      purpose,
      generatedAt: new Date().toISOString(),
      format,
      executiveSummary: composition.result.executiveSummary,
      sections: composition.result.sections,
      missingData: composition.result.missingData,
      riskFlags: composition.result.riskFlags,
      nextActions: composition.result.nextActions,
      confidence: composition.result.confidence,
      requiresHumanApproval: true,
      outputReference,
      provider: composition.providerType,
      model: composition.result.providerModelVersion || composition.model,
      providerRequestId: composition.requestId,
      usage: composition.usage,
      sourceRecordCount: snapshot.totalRows,
      unavailableTables: snapshot.unavailableTables,
      truncatedTables: snapshot.truncatedTables,
      truthBoundary: "Substantive AI draft composed only from the supplied AC CAPITAL OS record snapshot. Human approval is required before external release.",
    };

    const exportRecord = await insertRow("ac_capital_report_exports", {
      report_id: report.id,
      report_type: reportType,
      format,
      status: "Generated AI Draft — Approval Required",
      output_reference: outputReference,
      metadata: content,
      generated_by: actor.email || actor.name,
      provider_request_id: composition.requestId,
    });

    await insertAudit({
      actor: actor.email || actor.name,
      action: "compose_ai_report",
      objectType: "strategy_report",
      objectId: String(report.id),
      after: { report, sections: createdSections, export: exportRecord, content },
      approval: approvalRequirement,
      risk: composition.result.riskFlags.length ? "High" : "Medium",
    });

    return Response.json(success({ report, sections: createdSections, export: exportRecord, content, requestId: composition.requestId, model: composition.model, usage: composition.usage, affectedRecords: createdSections.length + 2 }));
  } catch (reason) {
    return apiError(reason);
  }
}
