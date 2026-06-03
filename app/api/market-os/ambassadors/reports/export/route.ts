import { ambassadorJson, readBody } from "@/lib/market-os/ambassadors/api"
import { createAmbassadorEntity, loadAmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/server"
import { buildCsv, datedFilename } from "@/lib/market-os/ambassadors/validation"

export const dynamic = "force-dynamic"

function rowsForReport(type: string, snapshot: NonNullable<Awaited<ReturnType<typeof loadAmbassadorWorkspaceSnapshot>>["data"]>) {
  if (type === "territories") {
    return {
      headers: ["Territory", "City", "Region", "Zone", "Coverage Goal", "Active Ambassadors", "Manager", "Status"],
      rows: snapshot.territories.map((item) => [item.name, item.city, item.region, item.zone, item.coverage_goal, item.active_ambassadors_count, item.manager_name, item.status]),
    }
  }
  if (type === "recruitment") {
    return {
      headers: ["Candidate", "Email", "Phone", "City", "Region", "Source", "Stage", "Score", "Next Step"],
      rows: snapshot.recruitment.map((item) => [item.candidate_name, item.email, item.phone, item.city, item.region, item.source, item.stage, item.evaluation_score, item.next_step]),
    }
  }
  if (type === "missions") {
    return {
      headers: ["Mission", "Type", "Priority", "Status", "Ambassador", "City", "Region", "Due", "Completed"],
      rows: snapshot.missions.map((item) => [item.title, item.mission_type, item.priority, item.status, item.ambassador_id, item.city, item.region, item.due_date, item.completed_at]),
    }
  }
  if (type === "goals") {
    return {
      headers: ["Goal", "Period", "Ambassador", "Target", "Current", "Completion", "Status", "Notes"],
      rows: snapshot.goals.map((item) => [item.goal_type, item.period, item.ambassador_id, item.target_value, item.current_value, item.completion_rate, item.status, item.manager_notes]),
    }
  }
  if (type === "incentives") {
    return {
      headers: ["Ambassador", "Type", "Amount", "Currency", "Status", "Reason", "Approved By", "Approved At", "Paid At"],
      rows: snapshot.incentives.map((item) => [item.ambassador_id, item.incentive_type, item.amount, item.currency, item.status, item.reason, item.approved_by, item.approved_at, item.paid_at]),
    }
  }
  return {
    headers: ["Name", "Email", "Phone", "City", "Region", "Territory", "Status", "Lifecycle", "Performance", "KPI", "Missions Completed", "Incentives Balance"],
    rows: snapshot.ambassadors.map((item) => [item.full_name, item.email, item.phone, item.city, item.region, item.territory_name, item.status, item.lifecycle_stage, item.performance_score, item.kpi_score, item.missions_completed, item.incentives_balance]),
  }
}

export async function POST(request: Request) {
  const body = await readBody(request)
  const reportType = String(body.report_type || body.reportType || "ambassadors").toLowerCase()
  const snapshot = await loadAmbassadorWorkspaceSnapshot()
  if (!snapshot.data) return ambassadorJson({ ok: false, error: snapshot.error || "Could not load Ambassador data for export" })
  const exportRows = rowsForReport(reportType, snapshot.data)
  const csv = buildCsv(exportRows.headers, exportRows.rows)
  const filename = datedFilename("market-os-ambassadors", reportType)
  const report = await createAmbassadorEntity("reports", {
    report_type: reportType,
    title: String(body.title || `${reportType} export`),
    filters: body.filters || {},
    generated_by: body.generated_by || "AngelCare Operator",
    status: "exported",
    export_payload: { filename, rows: exportRows.rows.length },
  })
  return ambassadorJson({
    ok: true,
    data: {
      filename,
      content_type: "text/csv",
      csv,
      report: report.data || null,
      diagnostics: snapshot.data.diagnostics,
    },
    details: report.ok ? undefined : report.error,
  })
}
