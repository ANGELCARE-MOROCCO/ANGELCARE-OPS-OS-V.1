import { NextRequest, NextResponse } from "next/server";
import {
  employeeDepartment,
  employeeManager,
  employeeName,
  employeeRole,
  loadPerformanceMatrixData,
} from "../_shared";

export const dynamic = "force-dynamic";

function searchText(employee: any) {
  return [
    employee.name,
    employee.department,
    employee.role,
    employee.manager,
    employee.source,
    employeeDepartment(employee),
    employeeRole(employee),
    employeeName(employee),
    employeeManager(employee),
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function keywords(department: string) {
  const key = department.toLowerCase();

  if (key === "operations") return ["operations", "operation", "ops", "coordination", "quality", "supervisor"];
  if (key === "hr") return ["hr", "rh", "human resources", "recruitment", "talent", "people"];
  if (key === "finance") return ["finance", "accounting", "payroll", "invoice", "payment", "budget"];
  if (key === "sales") return ["sales", "commercial", "business developer", "prospecting", "revenue"];
  if (key === "customer support") return ["customer", "client", "csa", "support", "success"];
  if (key === "carelink / dispatch") return ["carelink", "dispatch", "mission", "routing", "allocation"];
  if (key === "academy") return ["academy", "training", "trainer", "learning", "formation"];
  if (key === "marketing") return ["marketing", "brand", "content", "communication", "campaign"];
  if (key === "b2b partnerships") return ["b2b", "partnership", "partner", "strategic accounts"];
  if (key === "field agents") return ["field", "agent", "caregiver", "nanny", "accompagnatrice"];
  if (key === "administration") return ["administration", "admin", "office", "assistant"];
  if (key === "management") return ["management", "manager", "director", "leadership", "ceo"];

  return [key];
}

function matchesDepartment(employee: any, department: string) {
  if (String(employee.department || "").toLowerCase() === department.toLowerCase()) return true;
  const haystack = searchText(employee);
  return keywords(department).some((keyword) => haystack.includes(keyword));
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const department = url.searchParams.get("department") || "All";
  const action = url.searchParams.get("action") || "coaching_plan";

  const data = await loadPerformanceMatrixData();
  const employees =
    department === "All"
      ? data.employees
      : data.employees.filter((employee: any) => matchesDepartment(employee, department));

  const atRisk = employees.filter((employee: any) => employee.score < 60 || employee.risk === "High");
  const needsSupport = employees.filter((employee: any) => employee.score >= 60 && employee.score < 70);
  const highPerformers = employees.filter((employee: any) => employee.score >= 85);

  return NextResponse.json(
    {
      ok: true,
      type: "department_performance_action",
      department,
      action,
      generated_at: new Date().toISOString(),
      summary: {
        employees_loaded: employees.length,
        at_risk: atRisk.length,
        needs_support: needsSupport.length,
        high_performers: highPerformers.length,
        average_score:
          employees.length > 0
            ? Math.round(employees.reduce((sum: number, employee: any) => sum + Number(employee.score || 0), 0) / employees.length)
            : 0,
      },
      coaching_plan: {
        title: `${department} performance coaching plan`,
        priority: atRisk.length ? "High" : needsSupport.length ? "Medium" : "Normal",
        recommended_actions: [
          atRisk.length
            ? `Open urgent coaching/PIP review for ${atRisk.length} at-risk employee(s).`
            : "No urgent PIP pressure detected.",
          needsSupport.length
            ? `Schedule weekly coaching check-ins for ${needsSupport.length} employee(s) in support band.`
            : "No immediate support-band coaching required.",
          highPerformers.length
            ? `Capture best practices from ${highPerformers.length} high performer(s).`
            : "No high-performance benchmark detected yet.",
          "Assign measurable KPI improvement goals with a 30-day review checkpoint.",
          "Require manager feedback and evidence for every score adjustment.",
        ],
      },
      employees,
      at_risk_employees: atRisk,
      support_band_employees: needsSupport,
      high_performers: highPerformers,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
