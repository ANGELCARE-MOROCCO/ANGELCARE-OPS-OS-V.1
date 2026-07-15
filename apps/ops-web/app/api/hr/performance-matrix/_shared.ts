import { createClient } from "@/lib/supabase/server";
import { getHREmployeesCommandData } from "@/lib/hr-production/employees-command";

type Row = Record<string, any>;

function num(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function txt(row: Row, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value);
    }
  }
  return fallback;
}

function avg(values: number[]) {
  const safe = values.filter((value) => Number.isFinite(value));
  if (!safe.length) return 0;
  return safe.reduce((sum, value) => sum + value, 0) / safe.length;
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function employeeName(row: Row) {
  return txt(row, ["employee_name", "full_name", "name", "candidate_name", "title"], "Unnamed employee");
}

export function employeeDepartment(row: Row) {
  return txt(row, ["department", "department_name", "team", "business_unit"], "Unassigned");
}

export function employeeRole(row: Row) {
  return txt(row, ["role", "job_title", "position", "title"], "Role not assigned");
}

export function employeeManager(row: Row) {
  return txt(row, ["manager", "manager_name", "owner", "reviewer"], "Manager not assigned");
}

export function score100(row: Row) {
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

  const goals = num(row.goal_completion ?? row.goals_completion ?? row.kpi_completion, 0);
  const attendance = num(row.attendance_score ?? row.reliability_score, 80);
  const training = num(row.training_score ?? row.training_completion, 75);
  const manager = num(row.manager_score ?? row.review_score, 75);
  const behavior = num(row.behavior_score ?? row.values_score, 80);
  const feedback = num(row.feedback_score ?? row.client_feedback_score, 75);

  return Math.round(
    goals * 0.35 +
      manager * 0.25 +
      attendance * 0.15 +
      training * 0.1 +
      behavior * 0.1 +
      feedback * 0.05,
  );
}

export function band(score: number) {
  if (score >= 90) return "Exceptional";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Solid";
  if (score >= 60) return "Needs support";
  return "At risk";
}

export async function collectRows(tableNames: string[], limit = 1000) {
  const supabase = await createClient();
  const rows: Row[] = [];
  const sources: string[] = [];

  for (const table of tableNames) {
    try {
      const { data, error } = await supabase.from(table).select("*").limit(limit);
      if (!error && Array.isArray(data)) {
        sources.push(table);
        rows.push(...data.map((row) => ({ ...row, _source_table: table })));
      }
    } catch {
      // table may not exist in this installation
    }
  }

  return { rows, sources };
}

export async function loadPerformanceMatrixData() {
  const [employeeCommand, reviews, goals, cycles, training, pips, feedback] = await Promise.all([
    getHREmployeesCommandData(),
    collectRows(["hr_performance_reviews", "performance_reviews", "hr_reviews", "hr_review_records", "hr_employee_reviews"]),
    collectRows(["hr_performance_goals", "performance_goals", "hr_goals", "hr_employee_goals", "hr_kpis"]),
    collectRows(["hr_performance_cycles", "performance_cycles", "hr_review_cycles", "hr_review_campaigns"]),
    collectRows(["hr_training_records", "training_records", "hr_trainings", "hr_training_enrollments", "academy_training_records"]),
    collectRows(["hr_performance_improvement_plans", "performance_improvement_plans", "hr_pips"]),
    collectRows(["hr_feedback", "performance_feedback", "employee_feedback", "hr_manager_feedback", "hr_candidate_comments"]),
  ]);

  const employees = {
    rows: Array.isArray(employeeCommand.employees)
      ? employeeCommand.employees.map((employee: Row) => ({
          ...employee,
          _source_table: "employees_command_final_list",
        }))
      : [],
    sources: ["employees_command_final_list"],
  };

  const enrichedEmployees = employees.rows.map((row: Row) => {
    const score = score100(row);
    return {
      id: row.id ?? null,
      name: employeeName(row),
      department: employeeDepartment(row),
      role: employeeRole(row),
      manager: employeeManager(row),
      score,
      band: band(score),
      risk: score < 60 ? "High" : score < 70 ? "Medium" : "Low",
      source: row._source_table,
    };
  });

  const totalEmployees = enrichedEmployees.length;
  const reviewedEmployees =
    reviews.rows.length ||
    enrichedEmployees.filter((row) => ["Strong", "Exceptional", "Solid"].includes(row.band)).length;

  const highPerformers = enrichedEmployees.filter((row) => row.score >= 85);
  const atRiskEmployees = enrichedEmployees.filter((row) => row.score < 60);
  const promotionCandidates = enrichedEmployees.filter((row) => row.score >= 82);
  const overdueGoals = goals.rows.filter((row) =>
    ["overdue", "behind", "late", "at risk"].includes(txt(row, ["status", "state"], "").toLowerCase()),
  );

  const completedGoals = goals.rows.filter((row) =>
    ["completed", "exceeded", "closed", "done"].includes(txt(row, ["status", "state"], "").toLowerCase()),
  );

  const trainingScores = training.rows.map((row) =>
    num(row.score ?? row.completion ?? row.training_score ?? row.training_completion, 0),
  );

  return {
    generated_at: new Date().toISOString(),
    sources: {
      employees: employees.sources,
      reviews: reviews.sources,
      goals: goals.sources,
      cycles: cycles.sources,
      training: training.sources,
      pips: pips.sources,
      feedback: feedback.sources,
    },
    metrics: {
      overall_performance_score: Math.round(avg(enrichedEmployees.map((row) => row.score))),
      total_employees_loaded: totalEmployees,
      total_employees_reviewed: reviewedEmployees,
      employees_pending_review: Math.max(0, totalEmployees - reviewedEmployees),
      review_completion_rate: pct(reviewedEmployees, Math.max(1, totalEmployees)),
      high_performers: highPerformers.length,
      at_risk_employees: atRiskEmployees.length,
      goals_completion_rate: pct(completedGoals.length, Math.max(1, goals.rows.length)),
      goals_overdue: overdueGoals.length,
      training_impact: Math.round(avg(trainingScores)),
      promotion_candidates: promotionCandidates.length,
      review_cycles: cycles.rows.length,
      active_improvement_plans: pips.rows.length,
      feedback_records: feedback.rows.length,
    },
    employees: enrichedEmployees,
    high_performers: highPerformers,
    at_risk_employees: atRiskEmployees,
    promotion_candidates: promotionCandidates,
    overdue_goals: overdueGoals,
  };
}
