import { NextResponse } from "next/server";
import { loadPerformanceMatrixData } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await loadPerformanceMatrixData();

  return NextResponse.json(
    {
      ok: true,
      type: "executive_performance_report",
      title: "AngelCare HR Executive Performance Report",
      ...data,
      recommendations: [
        data.metrics.employees_pending_review > 0
          ? `Launch review completion sprint for ${data.metrics.employees_pending_review} pending employee(s).`
          : "Review completion is currently under control.",
        data.metrics.at_risk_employees > 0
          ? `Create coaching or improvement plans for ${data.metrics.at_risk_employees} at-risk employee(s).`
          : "No urgent at-risk employee pressure detected.",
        data.metrics.goals_overdue > 0
          ? `Recalibrate ${data.metrics.goals_overdue} overdue goal(s) with managers.`
          : "No overdue goals detected in synced goal sources.",
        data.metrics.promotion_candidates > 0
          ? `Prepare succession review for ${data.metrics.promotion_candidates} promotion candidate(s).`
          : "No promotion-ready employees detected by the current score logic.",
      ],
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
