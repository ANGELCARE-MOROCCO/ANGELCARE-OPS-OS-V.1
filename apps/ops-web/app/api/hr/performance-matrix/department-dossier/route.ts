import { NextRequest, NextResponse } from "next/server";
import { getHREmployeesCommandData } from "@/lib/hr-production/employees-command";

export const dynamic = "force-dynamic";

type Row = Record<string, any>;

function val(row: Row, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return fallback;
}

function employeeName(row: Row) {
  return val(row, ["employee_name", "full_name", "name", "candidate_name", "title"], "Unnamed employee");
}

function employeeDepartment(row: Row) {
  return val(row, ["department", "department_name", "team", "business_unit"], "Unassigned");
}

function employeeRole(row: Row) {
  return val(row, ["role", "job_title", "position", "title"], "Role not assigned");
}

function employeeManager(row: Row) {
  return val(row, ["manager", "manager_name", "owner", "reviewer"], "Manager not assigned");
}

function num(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function score100(row: Row) {
  const direct = num(
    row.performance_score ??
      row.score ??
      row.overall_score ??
      row.final_score ??
      row.rating ??
      row.engagement_score,
    0,
  );

  if (direct > 0 && direct <= 5) return Math.round(direct * 20);
  if (direct > 0) return Math.max(0, Math.min(100, Math.round(direct)));

  const sync = row.__sync || {};
  const readiness = num(sync.readiness, 0);
  const risk = num(sync.risk, 0);

  if (readiness || risk) return Math.max(0, Math.min(100, Math.round(readiness - risk * 0.15)));

  return 50;
}

function canonicalDepartmentName(value: string) {
  const lower = String(value || "").toLowerCase().replace(/[_-]+/g, " ");

  if (lower.includes("human resources") || lower === "hr" || lower.includes(" rh ") || lower.includes("recruit")) return "HR";
  if (lower.includes("finance") || lower.includes("payroll") || lower.includes("invoice") || lower.includes("payment")) return "Finance";
  if (lower.includes("sales") || lower.includes("commercial")) return "Sales";
  if (lower.includes("b2b") || lower.includes("partnership") || lower.includes("partner")) return "B2B Partnerships";
  if (lower.includes("customer") || lower.includes("client") || lower.includes("csa") || lower.includes("support")) return "Customer Support";
  if (lower.includes("carelink") || lower.includes("dispatch") || lower.includes("mission")) return "CareLink / Dispatch";
  if (lower.includes("academy") || lower.includes("training") || lower.includes("trainer")) return "Academy";
  if (lower.includes("marketing") || lower.includes("brand") || lower.includes("content")) return "Marketing";
  if (lower.includes("field") || lower.includes("agent") || lower.includes("caregiver") || lower.includes("nanny") || lower.includes("accompagnatrice")) return "Field Agents";
  if (lower.includes("operation") || lower.includes("ops") || lower.includes("coordination")) return "Operations";
  if (lower.includes("manager") || lower.includes("management") || lower.includes("director") || lower.includes("leadership")) return "Management";
  if (lower.includes("admin") || lower.includes("office") || lower.includes("assistant")) return "Administration";

  return String(value || "Administration");
}

function resolvedDepartment(row: Row) {
  return canonicalDepartmentName(
    [
      employeeDepartment(row),
      employeeRole(row),
      val(row, ["position", "job_position", "title", "job_title"], ""),
      val(row, ["team", "business_unit", "department_name"], ""),
    ].join(" "),
  );
}

function matchesDepartment(row: Row, department: string) {
  return resolvedDepartment(row).toLowerCase() === department.toLowerCase();
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const department = url.searchParams.get("department") || "All";

  const command = await getHREmployeesCommandData();
  const allEmployees = Array.isArray(command.employees) ? command.employees : [];

  const employees =
    department === "All"
      ? allEmployees
      : allEmployees.filter((employee: Row) => matchesDepartment(employee, department));

  const enriched = employees.map((employee: Row) => ({
    id: employee.id,
    name: employeeName(employee),
    department: resolvedDepartment(employee),
    raw_department: employeeDepartment(employee),
    role: employeeRole(employee),
    manager: employeeManager(employee),
    city: val(employee, ["city", "location"], "Not mapped"),
    status: val(employee, ["employment_status", "status"], "active"),
    score: score100(employee),
    readiness: num(employee.__sync?.readiness, 0),
    risk: num(employee.__sync?.risk, 0),
    sync: employee.__sync || {},
  }));

  const averageScore = enriched.length
    ? Math.round(enriched.reduce((sum, employee) => sum + employee.score, 0) / enriched.length)
    : 0;

  const atRisk = enriched.filter((employee) => employee.score < 60 || employee.risk >= 50);
  const highPerformers = enriched.filter((employee) => employee.score >= 85 || employee.readiness >= 85);

  return NextResponse.json(
    {
      ok: true,
      type: "department_dossier",
      source_of_truth: "/hr/employees · getHREmployeesCommandData()",
      department,
      generated_at: new Date().toISOString(),
      summary: {
        headcount: enriched.length,
        average_score: averageScore,
        high_performers: highPerformers.length,
        at_risk: atRisk.length,
        active: enriched.filter((e) => !String(e.status).toLowerCase().includes("archiv")).length,
      },
      recommended_actions: [
        atRisk.length ? `Open coaching/PIP review for ${atRisk.length} employee(s).` : "No urgent PIP pressure detected.",
        highPerformers.length ? `Prepare recognition or promotion review for ${highPerformers.length} high performer(s).` : "No high performer detected yet.",
        "Validate department mapping from the employee final list.",
        "Require manager feedback for employees without recent review evidence.",
      ],
      employees: enriched,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
