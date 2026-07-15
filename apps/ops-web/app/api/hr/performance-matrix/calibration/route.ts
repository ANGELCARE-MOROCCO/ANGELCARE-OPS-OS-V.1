import { NextRequest, NextResponse } from "next/server";
import { loadPerformanceMatrixData } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const department = url.searchParams.get("department") || "All";

  const data = await loadPerformanceMatrixData();

  const relevantAtRisk =
    department === "All"
      ? data.at_risk_employees
      : data.at_risk_employees.filter((employee: any) =>
          String([employee.department, employee.role, employee.name, employee.source].join(" ")).toLowerCase().includes(department.toLowerCase()),
        );

  const relevantPromotion =
    department === "All"
      ? data.promotion_candidates
      : data.promotion_candidates.filter((employee: any) =>
          String([employee.department, employee.role, employee.name, employee.source].join(" ")).toLowerCase().includes(department.toLowerCase()),
        );

  const calibrationQueue = [
    ...relevantAtRisk.slice(0, 25).map((employee) => ({
      type: "risk_calibration",
      priority: "high",
      employee,
      action: "Manager coaching / PIP decision required",
    })),
    ...relevantPromotion.slice(0, 25).map((employee) => ({
      type: "promotion_calibration",
      priority: "medium",
      employee,
      action: "Review promotion readiness and succession backup",
    })),
  ];

  return NextResponse.json(
    {
      ok: true,
      type: "performance_calibration_board",
      title: "AngelCare HR Performance Calibration Board",
      generated_at: data.generated_at,
      sources: data.sources,
      metrics: data.metrics,
      calibration_queue: calibrationQueue,
      decision_rules: {
        exceptional: "90–100",
        strong: "80–89",
        solid: "70–79",
        needs_support: "60–69",
        at_risk: "below 60",
      },
      next_actions: [
        "Validate scoring outliers with direct managers.",
        "Confirm missing review coverage.",
        "Review at-risk employees before next payroll/performance governance checkpoint.",
        "Prepare promotion candidates for leadership calibration.",
        "Assign corrective goals to employees below target.",
      ],
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
