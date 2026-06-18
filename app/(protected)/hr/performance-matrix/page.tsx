import Link from "next/link";
import {
  Activity,
  Zap,
  ArrowDownRight,
  AlertTriangle,
  Award,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Database,
  FileBadge,
  FileText,
  Filter,
  Flag,
  Gauge,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  Medal,
  MessageSquareText,
  PieChart,
  Rocket,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  TriangleAlert,
  Trophy,
  UserCheck,
  Users,
  Workflow,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getHREmployeesCommandData } from "@/lib/hr-production/employees-command";

export const dynamic = "force-dynamic";

type Row = Record<string, any>;
type EnrichedEmployeeRow = Row & {
  _score: number;
  _band: string;
  _risk: string;
  _potential: string;
  _promotion: string;
};
type ReviewCycleRow = Row & {
  id?: string | number;
  cycle_name?: string;
  name?: string;
  title?: string;
  period?: string;
  date_range?: string;
  status?: string;
  completion?: number;
  completion_percentage?: number;
  deadline?: string;
  due_at?: string;
  pending_reviewers?: number;
};
type GoalRow = Row & {
  id?: string | number;
  title?: string;
  goal_title?: string;
  name?: string;
  owner?: string;
  employee_name?: string;
  department?: string;
  weight?: number;
  progress?: number;
  current_progress?: number;
  completion?: number;
  status?: string;
  deadline?: string;
  due_at?: string;
};
type PipRow = Row & {
  id?: string | number;
  employee_name?: string;
  name?: string;
  reason?: string;
  required_improvement?: string;
  status?: string;
  check_in_frequency?: string;
  success_criteria?: string;
};

const DEPARTMENTS = [
  "Operations",
  "HR",
  "Finance",
  "Sales",
  "Customer Support",
  "CareLink / Dispatch",
  "Academy",
  "Marketing",
  "B2B Partnerships",
  "Field Agents",
  "Administration",
  "Management",
];

const REVIEW_CYCLES = [
  "Monthly review",
  "Quarterly review",
  "Annual review",
  "Probation review",
  "Promotion review",
  "Performance improvement review",
  "Manager check-in",
  "Role-specific evaluation",
];

const REVIEW_WORKFLOW = [
  "Draft cycle",
  "Launch review",
  "Manager evaluation",
  "Self-evaluation",
  "HR calibration",
  "Final approval",
  "Report generated",
  "Closed",
];

const GOAL_TYPES = [
  "Individual goals",
  "Department goals",
  "Role-based KPIs",
  "Company objectives",
  "Training goals",
  "Behavioral goals",
  "Client satisfaction goals",
  "Operational quality goals",
  "Revenue goals",
  "Attendance goals",
];

const ROLE_TEMPLATES = [
  {
    role: "Field Agent / Caregiver",
    items: [
      "Punctuality",
      "Client feedback",
      "Mission completion",
      "Safety compliance",
      "Professional behavior",
      "Reporting discipline",
      "Care standards",
      "Communication quality",
    ],
  },
  {
    role: "Sales / B2B",
    items: [
      "Prospecting activity",
      "Meetings booked",
      "Proposals sent",
      "Conversion rate",
      "Revenue generated",
      "CRM discipline",
      "Follow-up quality",
      "Pipeline movement",
    ],
  },
  {
    role: "Operations / Dispatch",
    items: [
      "Mission coordination",
      "SLA compliance",
      "Incident handling",
      "Communication speed",
      "Resource allocation",
      "Operational accuracy",
      "Escalation management",
    ],
  },
  {
    role: "HR",
    items: [
      "Recruitment delivery",
      "Employee documentation",
      "Payroll support",
      "Compliance",
      "Review completion",
      "Employee support quality",
      "Process discipline",
    ],
  },
  {
    role: "Finance",
    items: [
      "Payment accuracy",
      "Reporting timeliness",
      "Budget control",
      "Invoice follow-up",
      "Payroll accuracy",
      "Financial compliance",
    ],
  },
  {
    role: "Academy / Training",
    items: [
      "Training delivery",
      "Learner progress",
      "Content quality",
      "Attendance control",
      "Certification completion",
      "Evaluation quality",
      "Placement support",
    ],
  },
];

const BASE_SCORING = [
  ["Goal completion", 35],
  ["Manager review", 25],
  ["Attendance / reliability", 15],
  ["Training / skills", 10],
  ["Behavior / values", 10],
  ["Client or internal feedback", 5],
];

const SALES_SCORING = [
  ["Revenue / conversion", 35],
  ["Pipeline activity", 20],
  ["Follow-up discipline", 15],
  ["CRM quality", 10],
  ["Client communication", 10],
  ["Team behavior", 10],
];

const FIELD_AGENT_SCORING = [
  ["Mission quality", 30],
  ["Punctuality", 20],
  ["Client feedback", 20],
  ["Safety compliance", 15],
  ["Reporting discipline", 10],
  ["Professional conduct", 5],
];

const PIP_STATUSES = ["Draft", "Active", "Monitoring", "Improved", "Extended", "Closed", "Escalated"];

function n(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function s(row: Row, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
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

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function score100(row: Row) {
  const direct = n(
    row.performance_score ??
      row.score ??
      row.overall_score ??
      row.final_score ??
      row.rating ??
      row.engagement_score,
    0,
  );

  if (direct > 0 && direct <= 5) return Math.round(direct * 20);
  if (direct > 0) return Math.round(clamp(direct));

  const goals = n(row.goal_completion ?? row.goals_completion ?? row.kpi_completion, 0);
  const attendance = n(row.attendance_score ?? row.reliability_score, 80);
  const training = n(row.training_score ?? row.training_completion, 75);
  const manager = n(row.manager_score ?? row.review_score, 75);
  const behavior = n(row.behavior_score ?? row.values_score, 80);
  const feedback = n(row.feedback_score ?? row.client_feedback_score, 75);

  return Math.round(
    goals * 0.35 +
      manager * 0.25 +
      attendance * 0.15 +
      training * 0.1 +
      behavior * 0.1 +
      feedback * 0.05,
  );
}

function band(score: number) {
  if (score >= 90) return "Exceptional";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Solid";
  if (score >= 60) return "Needs support";
  return "At risk";
}

function toneForScore(score: number) {
  if (score >= 85) return "emerald";
  if (score >= 70) return "blue";
  if (score >= 60) return "amber";
  return "rose";
}

function employeeName(row: Row) {
  return s(row, ["employee_name", "full_name", "name", "candidate_name", "title"], "Unnamed employee");
}

function employeeDepartment(row: Row) {
  return s(row, ["department", "department_name", "team", "business_unit"], "Unassigned");
}

function employeeRole(row: Row) {
  return s(row, ["role", "job_title", "position", "title"], "Role not assigned");
}


function savedEmployeeDepartment(row: Row) {
  // Source of truth: exact department field saved by the Employee creation/edit modal.
  return s(row, ["department"], "Unassigned");
}

function employeeManager(row: Row) {
  return s(row, ["manager", "manager_name", "owner", "reviewer"], "Manager not assigned");
}

function status(row: Row) {
  return s(row, ["status", "review_status", "state"], "Pending");
}

function riskLevel(row: Row) {
  const score = score100(row);
  const raw = s(row, ["risk_level", "risk", "performance_risk"], "");
  if (raw) return raw;
  if (score < 60) return "High";
  if (score < 70) return "Medium";
  return "Low";
}

function potentialLevel(row: Row) {
  const raw = s(row, ["potential_level", "potential", "talent_level"], "");
  if (raw) return raw;
  const score = score100(row);
  if (score >= 88) return "High potential";
  if (score >= 75) return "Growth potential";
  return "Developing";
}

function promotionReadiness(row: Row) {
  const raw = s(row, ["promotion_readiness", "promotion_status"], "");
  if (raw) return raw;
  const score = score100(row);
  const training = n(row.training_score ?? row.training_completion, 0);
  if (score >= 88 && training >= 80) return "Ready now";
  if (score >= 80) return "Ready in 3 months";
  if (score >= 72) return "Ready in 6–12 months";
  return "Needs training first";
}

async function safeRows(tableNames: string[], limit = 1000) {
  const supabase = await createClient();
  const allRows: Row[] = [];
  const sources: string[] = [];
  const seen = new Set<string>();

  for (const table of tableNames) {
    try {
      const { data, error } = await supabase.from(table).select("*").limit(limit);

      if (!error && Array.isArray(data)) {
        sources.push(table);

        for (const row of data as Row[]) {
          const key =
            String(row.id || row.employee_id || row.user_id || row.email || row.phone || row.full_name || row.name || JSON.stringify(row));

          if (!seen.has(`${table}:${key}`)) {
            seen.add(`${table}:${key}`);
            allRows.push({
              ...row,
              _source_table: table,
            });
          }
        }
      }
    } catch {
      // continue to next table
    }
  }

  return {
    rows: allRows,
    table: sources.length ? sources.join(" + ") : "none",
  };
}

function Sparkline({ value = 70 }: { value?: number }) {
  const points = Array.from({ length: 14 }, (_, index) => {
    const wave = Math.sin(index * 0.85) * 8;
    const growth = index * (value / 100) * 2.1;
    return clamp(32 + wave + growth + value * 0.22, 8, 94);
  });

  const width = 210;
  const height = 64;
  const step = width / Math.max(1, points.length - 1);
  const coords = points.map((point, index) => `${index * step},${height - (point / 100) * height}`);
  const area = `0,${height} ${coords.join(" ")} ${width},${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-52">
      <defs>
        <linearGradient id="pm-line" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="48%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="pm-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={area} fill="url(#pm-area)" />
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="url(#pm-line)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={(points.length - 1) * step}
        cy={height - (points[points.length - 1] / 100) * height}
        r="5"
        fill="white"
        stroke="#7c3aed"
        strokeWidth="4"
      />
    </svg>
  );
}

function SectionShell({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  action,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_28px_100px_rgba(15,23,42,0.10)] ring-1 ring-slate-100"
    >
      <div className="relative border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-violet-50/50 p-4 xl:p-5">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute right-40 top-4 h-40 w-40 rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-violet-700 shadow-sm">
                {eyebrow}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700 shadow-sm">
                live enterprise layer
              </span>
            </div>

            <h2 className="mt-4 max-w-6xl text-2xl font-black tracking-[-0.055em] text-slate-950 xl:text-4xl">
              {title}
            </h2>

            <p className="mt-2 max-w-6xl text-xs font-bold leading-7 text-slate-500">
              {subtitle}
            </p>
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>

      <div className="bg-gradient-to-br from-white via-white to-slate-50 p-4 xl:p-5">
        {children}
      </div>
    </section>
  );
}

function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="rounded-[20px] bg-gradient-to-r from-slate-950 via-violet-950 to-slate-900 px-6 py-3 text-sm font-black text-white shadow-2xl shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-violet-300">
      {children}
    </button>
  );
}

function GhostButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="rounded-[20px] border border-slate-200 bg-white/90 px-6 py-3 text-sm font-black text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-xl">
      {children}
    </button>
  );
}

function MiniKpi({
  label,
  value,
  detail,
  icon: Icon,
  tone = "violet",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: any;
  tone?: "violet" | "emerald" | "blue" | "amber" | "rose" | "cyan";
}) {
  const toneClass =
    tone === "emerald"
      ? "from-emerald-500 via-teal-500 to-cyan-400"
      : tone === "blue"
        ? "from-blue-500 via-indigo-500 to-cyan-400"
        : tone === "amber"
          ? "from-amber-400 via-orange-500 to-rose-400"
          : tone === "rose"
            ? "from-rose-500 via-red-500 to-orange-400"
            : tone === "cyan"
              ? "from-cyan-400 via-blue-500 to-violet-500"
              : "from-violet-600 via-fuchsia-500 to-blue-500";

  return (
    <article className="group relative overflow-hidden rounded-[20px] border border-white/80 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_100px_rgba(124,58,237,0.18)]">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${toneClass}`} />
      <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-violet-100 blur-3xl transition group-hover:bg-cyan-100" />

      <div className="relative flex items-start justify-between gap-4">
        <span className={`grid h-11 w-11 place-items-center rounded-[18px] bg-gradient-to-br ${toneClass} text-white shadow-xl shadow-slate-200`}>
          <Icon className="h-5 w-5" />
        </span>

        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
          live
        </span>
      </div>

      <div className="relative mt-4">
        <p className="text-[10px] font-black uppercase leading-5 tracking-[0.22em] text-slate-400">
          {label}
        </p>

        <p className="mt-3 text-2xl font-black tracking-[-0.07em] text-slate-950">
          {value}
        </p>

        <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
          {detail}
        </p>
      </div>

      <div className="relative mt-5 rounded-[18px] border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          <span>enterprise impact</span>
          <span>synced</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white">
          <div className={`h-2 rounded-full bg-gradient-to-r ${toneClass}`} style={{ width: "76%" }} />
        </div>
      </div>
    </article>
  );
}


function EnterpriseImpactPanel({
  overallScore,
  reviewCompletionRate,
  goalCompletionRate,
  trainingImpact,
  atRiskEmployees,
  promotionCandidates,
}: {
  overallScore: number;
  reviewCompletionRate: number;
  goalCompletionRate: number;
  trainingImpact: number;
  atRiskEmployees: number;
  promotionCandidates: number;
}) {
  const impactRows = [
    ["Performance governance", overallScore, "Corporate workforce performance health"],
    ["Review execution", reviewCompletionRate, "Review cycle completion and manager discipline"],
    ["Goal execution", goalCompletionRate, "Goal completion and KPI ownership"],
    ["Training leverage", trainingImpact, "Training contribution to score progression"],
  ];

  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="relative overflow-hidden rounded-[22px] border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute right-32 top-6 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">
              executive performance operating model
            </p>
            <h3 className="mt-3 max-w-4xl text-3xl font-black tracking-[-0.06em]">
              Dynamic enterprise impact projection
            </h3>
            <p className="mt-3 max-w-4xl text-sm font-bold leading-7 text-white/60">
              This layer converts raw HR performance records into board-level visibility:
              risk pressure, promotion capacity, review execution, training leverage and goal ownership.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
              net impact index
            </p>
            <p className="mt-2 text-4xl font-black tracking-[-0.08em]">
              {Math.round((overallScore + reviewCompletionRate + goalCompletionRate + trainingImpact) / 4) || 0}%
            </p>
          </div>
        </div>

        <div className="relative mt-4 grid gap-3 md:grid-cols-4">
          {impactRows.map(([label, value, detail]) => (
            <div key={String(label)} className="rounded-[20px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">{label}</p>
              <p className="mt-2 text-2xl font-black">{value}%</p>
              <p className="mt-2 text-xs font-bold leading-5 text-white/50">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[20px] border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm">
          <ShieldAlert className="h-7 w-7 text-rose-600" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
            risk pressure
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">{atRiskEmployees}</p>
          <p className="mt-2 text-sm font-bold text-slate-500">
            Employees currently requiring support, coaching, PIP or management attention.
          </p>
        </div>

        <div className="rounded-[20px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
          <Rocket className="h-7 w-7 text-emerald-600" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
            growth capacity
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">{promotionCandidates}</p>
          <p className="mt-2 text-sm font-bold text-slate-500">
            Promotion-ready or near-ready employees detected from score, training and readiness logic.
          </p>
        </div>
      </div>
    </div>
  );
}


function canonicalDepartmentName(value: string) {
  const raw = String(value || "").trim();
  const lower = raw.toLowerCase();

  if (!lower || lower === "unassigned") return "Administration";

  if (
    lower.includes("human resources") ||
    lower === "hr" ||
    lower.includes("rh") ||
    lower.includes("recruit") ||
    lower.includes("talent")
  ) {
    return "HR";
  }

  if (
    lower.includes("finance") ||
    lower.includes("account") ||
    lower.includes("payroll") ||
    lower.includes("invoice") ||
    lower.includes("payment")
  ) {
    return "Finance";
  }

  if (
    lower.includes("sales") ||
    lower.includes("commercial") ||
    lower.includes("business developer") ||
    lower.includes("b2b") ||
    lower.includes("partnership")
  ) {
    return lower.includes("b2b") || lower.includes("partnership") ? "B2B Partnerships" : "Sales";
  }

  if (
    lower.includes("support") ||
    lower.includes("customer") ||
    lower.includes("client") ||
    lower.includes("csa")
  ) {
    return "Customer Support";
  }

  if (
    lower.includes("carelink") ||
    lower.includes("dispatch") ||
    lower.includes("mission") ||
    lower.includes("ops")
  ) {
    return "CareLink / Dispatch";
  }

  if (
    lower.includes("academy") ||
    lower.includes("training") ||
    lower.includes("trainer") ||
    lower.includes("learning")
  ) {
    return "Academy";
  }

  if (
    lower.includes("marketing") ||
    lower.includes("communication") ||
    lower.includes("brand") ||
    lower.includes("content")
  ) {
    return "Marketing";
  }

  if (
    lower.includes("agent") ||
    lower.includes("caregiver") ||
    lower.includes("field") ||
    lower.includes("accompagnatrice") ||
    lower.includes("nanny")
  ) {
    return "Field Agents";
  }

  if (
    lower.includes("operation") ||
    lower.includes("coordination") ||
    lower.includes("quality") ||
    lower.includes("supervisor")
  ) {
    return "Operations";
  }

  if (
    lower.includes("manager") ||
    lower.includes("management") ||
    lower.includes("director") ||
    lower.includes("leadership") ||
    lower.includes("ceo")
  ) {
    return "Management";
  }

  if (
    lower.includes("admin") ||
    lower.includes("office") ||
    lower.includes("assistant")
  ) {
    return "Administration";
  }

  return raw;
}

function resolvedDepartment(row: Row) {
  const direct = employeeDepartment(row);
  const role = employeeRole(row);
  const title = s(row, ["title", "position", "job_title", "candidate_position"], "");
  const position = s(row, ["position", "job_position", "desired_position"], "");
  const team = s(row, ["team", "business_unit", "department_name"], "");
  const source = s(row, ["_source_table"], "");

  // IMPORTANT:
  // The source of truth is the final /hr/employees command list.
  // So we resolve from the exact employee row fields first, then role/title fallbacks.
  return canonicalDepartmentName(`${direct} ${team} ${role} ${position} ${title} ${source}`);
}


function departmentSearchText(row: Row) {
  return [
    employeeDepartment(row),
    resolvedDepartment(row),
    employeeRole(row),
    employeeName(row),
    s(row, ["department", "department_name", "team", "business_unit"], ""),
    s(row, ["role", "job_title", "position", "title", "candidate_position"], ""),
    s(row, ["source", "origin", "category", "employee_type", "contract_type"], ""),
    s(row, ["manager", "manager_name", "owner", "reviewer"], ""),
    s(row, ["_source_table"], ""),
    Object.values(row || {})
      .filter((value) => typeof value === "string" || typeof value === "number")
      .slice(0, 80)
      .join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function departmentKeywords(department: string) {
  const key = department.toLowerCase();

  if (key === "operations") {
    return ["operations", "operation", "ops", "coordination", "coordinator", "quality", "supervisor", "mission control"];
  }

  if (key === "hr") {
    return ["hr", "rh", "human resources", "recruitment", "recruiter", "talent", "people", "employee support"];
  }

  if (key === "finance") {
    return ["finance", "financial", "accounting", "accountant", "payroll", "invoice", "payment", "treasury", "budget"];
  }

  if (key === "sales") {
    return ["sales", "commercial", "business developer", "prospecting", "conversion", "revenue", "crm"];
  }

  if (key === "customer support") {
    return ["customer support", "customer", "client support", "client", "csa", "support", "care agent", "success"];
  }

  if (key === "carelink / dispatch") {
    return ["carelink", "dispatch", "dispatcher", "mission", "routing", "allocation", "ops live", "field dispatch"];
  }

  if (key === "academy") {
    return ["academy", "training", "trainer", "learning", "formation", "teacher", "educator", "course"];
  }

  if (key === "marketing") {
    return ["marketing", "brand", "content", "communication", "social media", "campaign", "creative"];
  }

  if (key === "b2b partnerships") {
    return ["b2b", "partnership", "partner", "strategic accounts", "business partner", "alliances"];
  }

  if (key === "field agents") {
    return ["field agent", "agent", "caregiver", "nanny", "accompagnatrice", "mission agent", "home service", "field"];
  }

  if (key === "administration") {
    return ["administration", "admin", "office", "assistant", "back office", "secretary"];
  }

  if (key === "management") {
    return ["management", "manager", "director", "leadership", "ceo", "chief", "head of", "lead"];
  }

  return [key];
}

function departmentMatches(row: Row, department: string) {
  const canonical = resolvedDepartment(row);
  if (canonical === department) return true;

  const haystack = departmentSearchText(row);
  const keywords = departmentKeywords(department);

  return keywords.some((keyword) => {
    const normalized = keyword.toLowerCase().replace(/[_-]+/g, " ");
    return haystack.includes(normalized);
  });
}

function departmentIcon(department: string) {
  const lower = department.toLowerCase();
  if (lower.includes("finance")) return Target;
  if (lower.includes("sales") || lower.includes("b2b")) return Rocket;
  if (lower.includes("customer")) return Users;
  if (lower.includes("carelink") || lower.includes("dispatch")) return Zap;
  if (lower.includes("academy")) return GraduationCap;
  if (lower.includes("field")) return Users;
  if (lower.includes("hr")) return ClipboardCheck;
  if (lower.includes("management")) return Trophy;
  return Building2;
}

function scoreToneClasses(score: number) {
  if (score >= 85) {
    return {
      chip: "bg-emerald-50 text-emerald-700 border-emerald-100",
      bar: "from-emerald-500 to-cyan-400",
      glow: "bg-emerald-200/30",
      label: "Above target",
    };
  }

  if (score >= 70) {
    return {
      chip: "bg-blue-50 text-blue-700 border-blue-100",
      bar: "from-blue-500 to-violet-500",
      glow: "bg-blue-200/30",
      label: "Stable",
    };
  }

  if (score >= 60) {
    return {
      chip: "bg-amber-50 text-amber-700 border-amber-100",
      bar: "from-amber-400 to-orange-500",
      glow: "bg-amber-200/30",
      label: "Needs coaching",
    };
  }

  return {
    chip: "bg-rose-50 text-rose-700 border-rose-100",
    bar: "from-rose-500 to-red-500",
    glow: "bg-rose-200/30",
    label: "At risk",
  };
}

function DepartmentMetric({
  label,
  value,
  icon: Icon,
  tone,
  progress,
}: {
  label: string;
  value: string | number;
  icon: any;
  tone: string;
  progress: number;
}) {
  return (
    <div className="rounded-[22px] border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
            {value}
          </p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50">
          <Icon className="h-5 w-5 text-slate-700" />
        </span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${tone}`}
          style={{ width: `${Math.max(4, Math.min(100, progress || 0))}%` }}
        />
      </div>
    </div>
  );
}

function DepartmentCard({ department, employees }: { department: string; employees: Row[] }) {
  const scoped = employees.filter((row) => savedEmployeeDepartment(row) === department);
  const score = Math.round(avg(scoped.map(score100)));
  const safeScore = scoped.length ? score : 0;
  const tone = scoreToneClasses(safeScore);
  const DeptIcon = departmentIcon(department);

  const reviewed = scoped.filter((row) =>
    ["completed", "reviewed", "approved", "closed"].includes(status(row).toLowerCase()),
  ).length;

  const kpi = Math.round(avg(scoped.map((row) => n(row.kpi_completion ?? row.goal_completion ?? score100(row), 0))));
  const attendance = Math.round(avg(scoped.map((row) => n(row.attendance_score ?? row.reliability_score ?? 80, 80))));
  const managerFeedback = Math.round(avg(scoped.map((row) => n(row.manager_feedback_completion ?? row.manager_score ?? row.review_score ?? 0, 0))));
  const training = Math.round(avg(scoped.map((row) => n(row.training_completion ?? row.training_score ?? 0, 0))));
  const riskCases = scoped.filter((row) => ["high", "medium", "at risk"].includes(riskLevel(row).toLowerCase())).length;

  const sorted = [...scoped].sort((a, b) => score100(b) - score100(a));
  const top = sorted[0];
  const low = sorted[sorted.length - 1];

  const action =
    !scoped.length
      ? "Connect employees or map department values to activate live scoring"
      : safeScore < 60
        ? `Open urgent PIP review for ${Math.max(1, riskCases)} employee(s)`
        : safeScore < 70
          ? `Schedule coaching sprint for ${Math.max(1, riskCases || 1)} employee(s)`
          : riskCases
            ? `Review ${riskCases} risk case(s) with department manager`
            : safeScore >= 85
              ? "Prepare recognition, promotion review and best-practice capture"
              : "Maintain rhythm and monitor next review checkpoint";

  const impactLabel =
    !scoped.length
      ? "No mapped live records"
      : safeScore >= 85
        ? "High impact department"
        : safeScore >= 70
          ? "Healthy performance"
          : safeScore >= 60
            ? "Coaching recommended"
            : "Intervention required";

  return (
    <article className="group relative overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_22px_80px_rgba(15,23,42,0.09)] ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_100px_rgba(124,58,237,0.16)]">
      <div className={`absolute -right-16 -top-16 h-48 w-48 rounded-full ${tone.glow} blur-3xl transition group-hover:scale-125`} />
      <div className={`h-1.5 bg-gradient-to-r ${tone.bar}`} />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className={`grid h-14 w-14 place-items-center rounded-[22px] bg-gradient-to-br ${tone.bar} text-white shadow-xl shadow-slate-200`}>
              <DeptIcon className="h-6 w-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950">
                  {department}
                </h3>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${tone.chip}`}>
                  {tone.label}
                </span>
              </div>

              <p className="mt-1 text-xs font-bold text-slate-500">
                {scoped.length} employee(s) mapped · {impactLabel}
              </p>
            </div>
          </div>

          <div className={`rounded-[22px] border px-5 py-4 text-center ${tone.chip}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
              Score
            </p>
            <p className="mt-1 text-3xl font-black tracking-[-0.06em]">
              {safeScore}%
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Department performance pulse
              </p>
              <p className="mt-1 text-sm font-black text-slate-700">
                KPI, attendance, training and review signals combined
              </p>
            </div>

            <div className="hidden text-right md:block">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                completion
              </p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {Math.round(avg([kpi || 0, attendance || 0, training || 0, managerFeedback || 0]))}%
              </p>
            </div>
          </div>

          <div className="mt-4 h-3 rounded-full bg-white shadow-inner">
            <div
              className={`h-3 rounded-full bg-gradient-to-r ${tone.bar}`}
              style={{ width: `${Math.max(3, safeScore)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DepartmentMetric
            label="Reviewed"
            value={`${reviewed}/${scoped.length}`}
            icon={ClipboardCheck}
            tone={tone.bar}
            progress={pct(reviewed, Math.max(1, scoped.length))}
          />
          <DepartmentMetric
            label="KPI completion"
            value={`${kpi || 0}%`}
            icon={Target}
            tone={tone.bar}
            progress={kpi || 0}
          />
          <DepartmentMetric
            label="Attendance impact"
            value={scoped.length ? `${attendance || 0}%` : "0%"}
            icon={CalendarClock}
            tone={tone.bar}
            progress={attendance || 0}
          />
          <DepartmentMetric
            label="Training"
            value={`${training || 0}%`}
            icon={GraduationCap}
            tone={tone.bar}
            progress={training || 0}
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[0.8fr_0.8fr_1.1fr]">
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-start gap-3">
              <Trophy className="mt-1 h-5 w-5 text-emerald-700" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                  Top performer
                </p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {top ? employeeName(top) : "No data"}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {top ? `${score100(top)}% · ${employeeRole(top)}` : "No mapped employee yet"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-rose-100 bg-rose-50/60 p-4">
            <div className="flex items-start gap-3">
              <ArrowDownRight className="mt-1 h-5 w-5 text-rose-700" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-700">
                  Lowest performer
                </p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {low ? employeeName(low) : "No data"}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {low ? `${score100(low)}% · ${employeeRole(low)}` : "No mapped employee yet"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
            <div className="flex items-start gap-3">
              {riskCases ? (
                <AlertTriangle className="mt-1 h-5 w-5 text-amber-600" />
              ) : (
                <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-600" />
              )}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">
                  Recommended action
                </p>
                <p className="mt-2 text-sm font-black leading-5 text-slate-950">
                  {action}
                </p>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  Risk cases: {riskCases} · Manager feedback: {managerFeedback || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/hr/departments?department=${encodeURIComponent(department)}`}
            className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-lg shadow-slate-200"
          >
            Open department dossier
          </Link>

          <Link
            href={`/hr/performance-matrix?department=${encodeURIComponent(department)}&panel=calibration#department-workspace`}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700"
          >
            Start calibration
          </Link>

          <Link
            href={`/hr/performance-matrix?department=${encodeURIComponent(department)}&panel=coaching#department-workspace`}
            className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-black text-violet-700"
          >
            Assign coaching plan
          </Link>
        </div>
      </div>
    </article>
  );
}


function DepartmentPerformanceWorkspace({
  department,
  panel,
  employees,
}: {
  department: string;
  panel: string;
  employees: Row[];
}) {
  if (!department || department === "all") return null;

  const scoped = employees.filter((row) => savedEmployeeDepartment(row) === department);
  const averageScore = scoped.length ? Math.round(avg(scoped.map(score100))) : 0;
  const reviewed = scoped.filter((row) =>
    ["completed", "reviewed", "approved", "closed"].includes(status(row).toLowerCase()),
  );
  const atRisk = scoped.filter((row) => score100(row) < 60 || riskLevel(row).toLowerCase() === "high");
  const coaching = scoped.filter((row) => score100(row) >= 60 && score100(row) < 75);
  const top = [...scoped].sort((a, b) => score100(b) - score100(a)).slice(0, 5);

  const title =
    panel === "coaching"
      ? "Department coaching command"
      : "Department calibration command";

  const subtitle =
    panel === "coaching"
      ? "Create a concrete coaching plan from the real employees saved under this department."
      : "Review performance scores, risk cases, review coverage and calibration decisions for this department.";

  return (
    <section
      id="department-workspace"
      className="scroll-mt-28 overflow-hidden rounded-[32px] border border-violet-100 bg-white shadow-[0_28px_100px_rgba(124,58,237,0.12)] ring-1 ring-violet-100"
    >
      <div className="relative border-b border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-violet-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">
                {department}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                Source: employee final list
              </span>
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.055em] text-slate-950 xl:text-4xl">
              {title}
            </h2>
            <p className="mt-2 max-w-5xl text-xs font-bold leading-6 text-slate-500">
              {subtitle}
            </p>
          </div>

          <Link
            href="/hr/performance-matrix#departments"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm"
          >
            Close workspace
          </Link>
        </div>
      </div>

      <div className="grid gap-4 p-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Headcount", scoped.length, Users],
            ["Average score", `${averageScore}%`, Gauge],
            ["Reviewed", `${reviewed.length}/${scoped.length}`, ClipboardCheck],
            ["At risk", atRisk.length, ShieldAlert],
            ["Coaching queue", coaching.length, Target],
            ["Top performers", top.length, Trophy],
          ].map(([label, value, Icon]: any) => (
            <div key={label} className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
              <Icon className="h-5 w-5 text-violet-600" />
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                {label}
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-white p-5">
          <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950">
            {panel === "coaching" ? "Coaching plan generated" : "Calibration board generated"}
          </h3>

          <div className="mt-4 grid gap-3">
            {(panel === "coaching" ? [...atRisk, ...coaching] : scoped).slice(0, 12).map((employee, index) => (
              <div key={String(employee.id || index)} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-black text-slate-950">{employeeName(employee)}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {employeeRole(employee)} · {employeeManager(employee)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-black text-slate-950">{score100(employee)}%</p>
                  <p className="text-xs font-black text-violet-700">{band(score100(employee))}</p>
                </div>
              </div>
            ))}

            {!scoped.length ? (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm font-black text-slate-400">
                No employees found for this exact department in the employee final list.
              </p>
            ) : null}
          </div>

          <div className="mt-5 rounded-[22px] border border-violet-100 bg-violet-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">
              Recommended decision
            </p>
            <p className="mt-2 text-sm font-black leading-6 text-slate-950">
              {atRisk.length
                ? `Start manager review and coaching/PIP decision for ${atRisk.length} employee(s).`
                : coaching.length
                  ? `Assign coaching checkpoints for ${coaching.length} employee(s).`
                  : scoped.length
                    ? "Department is stable. Continue normal review rhythm and capture top-performer practices."
                    : "No decision available until employees are mapped to this exact department."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreModel({ title, rows }: { title: string; rows: (string | number)[][] }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black tracking-[-0.03em] text-slate-950">{title}</h3>
      <div className="mt-5 grid gap-3">
        {rows.map(([label, weight]) => (
          <div key={String(label)} className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-700">{label}</p>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">{weight}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white">
              <div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: `${weight}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}


function PerformanceMatrixSidebar() {
  const groups = [
    {
      title: "Overview",
      items: [
        ["Dashboard", "/hr", LayoutDashboard],
      ],
    },
    {
      title: "People",
      items: [
        ["Employees", "/hr/employees", Users],
        ["Teams & Departments", "/hr/departments", Building2],
        ["Recruitment", "/hr/recruitment", UserCheck],
        ["Onboarding", "/hr/onboarding", ClipboardCheck],
        ["Performance", "/hr/performance-matrix", Gauge],
        ["Learning & Development", "/hr/training", GraduationCap],
      ],
    },
    {
      title: "Operations",
      items: [
        ["Attendance", "/hr/attendance", CalendarCheck],
        ["Leave Management", "/hr/leave-management", Clock],
        ["Work Schedules", "/hr/work-schedules", Workflow],
        ["Time Tracking", "/hr/time-tracking", Activity],
      ],
    },
    {
      title: "Compliance & Documents",
      items: [
        ["Documents", "/hr/documents", FileBadge],
        ["Templates", "/hr/templates", FileText],
        ["Policies", "/hr/policies", ShieldCheck],
        ["Compliance Dashboard", "/hr/compliance", TriangleAlert],
      ],
    },
    {
      title: "System",
      items: [
        ["Integrations", "/hr/integrations", Sparkles],
        ["Settings", "/hr/settings", Settings],
      ],
    },
  ];

  return (
    <aside className="sticky top-0 h-screen w-[286px] shrink-0 overflow-y-auto border-r border-white/70 bg-white/95 p-4 shadow-2xl shadow-slate-200/60 backdrop-blur-2xl">
      <Link
        href="/hr"
        className="mb-6 flex items-center gap-3 rounded-[26px] bg-gradient-to-br from-violet-600 via-indigo-600 to-slate-950 p-4 text-white shadow-2xl shadow-violet-200"
      >
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-100">
            AngelCare
          </div>
          <div className="text-lg font-black tracking-tight">
            HR Command OS
          </div>
        </div>
      </Link>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              {group.title}
            </p>

            <nav className="grid gap-1.5">
              {group.items.map(([label, href, Icon]: any) => {
                const active = href === "/hr/performance-matrix";

                return (
                  <Link
                    key={label}
                    href={href}
                    className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-black transition ${
                      active
                        ? "bg-violet-50 text-violet-700 shadow-lg shadow-violet-100 ring-1 ring-violet-100"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 ${
                        active
                          ? "text-violet-600"
                          : "text-slate-500 group-hover:text-violet-600"
                      }`}
                    />

                    <span className="min-w-0 flex-1 truncate">{label}</span>

                    {active ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-violet-500 shadow-[0_0_0_5px_rgba(139,92,246,0.12)]" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}


export default async function Page({ searchParams }: any) {
  const params = searchParams && typeof searchParams.then === "function" ? await searchParams : searchParams || {};
  const query = String(params.q || "").toLowerCase();
  const departmentFilter = String(params.department || "all");
  const departmentPanel = String(params.panel || "");
  const riskFilter = String(params.risk || "all");
  const bandFilter = String(params.band || "all");

  const [employeeCommand, reviewsResult, goalsResult, cyclesResult, trainingResult, pipsResult, feedbackResult] =
    await Promise.all([
      getHREmployeesCommandData(),
      safeRows(["hr_performance_reviews", "performance_reviews", "hr_reviews", "hr_review_records", "hr_employee_reviews"]),
      safeRows(["hr_performance_goals", "performance_goals", "hr_goals", "hr_employee_goals", "hr_kpis"]),
      safeRows(["hr_performance_cycles", "performance_cycles", "hr_review_cycles", "hr_review_campaigns"]),
      safeRows(["hr_training_records", "training_records", "hr_trainings", "hr_training_enrollments", "academy_training_records"]),
      safeRows(["hr_performance_improvement_plans", "performance_improvement_plans", "hr_pips"]),
      safeRows(["hr_feedback", "performance_feedback", "employee_feedback", "hr_manager_feedback", "hr_candidate_comments"]),
    ]);

  const employees = Array.isArray(employeeCommand.employees)
    ? employeeCommand.employees.map((employee: Row) => ({
        ...employee,
        _source_table: "employees_command_final_list",
      }))
    : [];

  const realDepartments = Array.isArray(employeeCommand.departmentBreakdown)
    ? employeeCommand.departmentBreakdown
        .map((department: Row) => String(department.name || "").trim())
        .filter(Boolean)
    : [];

  const performanceDepartments = realDepartments.length
    ? realDepartments
    : Array.from(new Set(employees.map((employee: Row) => savedEmployeeDepartment(employee)).filter(Boolean)));
  const reviews = reviewsResult.rows;
  const goals = goalsResult.rows;
  const cycles = cyclesResult.rows;
  const training = trainingResult.rows;
  const pips = pipsResult.rows;
  const feedback = feedbackResult.rows;

  const enrichedEmployees: EnrichedEmployeeRow[] = employees.map((row): EnrichedEmployeeRow => {
    const score = score100(row);
    return {
      ...row,
      _score: score,
      _band: band(score),
      _risk: riskLevel(row),
      _potential: potentialLevel(row),
      _promotion: promotionReadiness(row),
    };
  });

  const filteredEmployees = enrichedEmployees.filter((row) => {
    const searchable = [
      employeeName(row),
      employeeDepartment(row),
      employeeRole(row),
      employeeManager(row),
      row._band,
      row._risk,
      row._potential,
      row._promotion,
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = !query || searchable.includes(query);
    const matchesDepartment = departmentFilter === "all" || savedEmployeeDepartment(row) === departmentFilter;
    const matchesRisk = riskFilter === "all" || String(row._risk).toLowerCase() === riskFilter.toLowerCase();
    const matchesBand = bandFilter === "all" || String(row._band).toLowerCase() === bandFilter.toLowerCase();

    return matchesQuery && matchesDepartment && matchesRisk && matchesBand;
  });

  const totalEmployees = employees.length;
  const scores = enrichedEmployees.map((row) => row._score);
  const overallScore = Math.round(avg(scores));
  const reviewedEmployees = reviews.length || enrichedEmployees.filter((row) =>
    ["completed", "reviewed", "approved", "closed"].includes(status(row).toLowerCase()),
  ).length;
  const pendingReview = Math.max(0, totalEmployees - reviewedEmployees);
  const topPerformers = enrichedEmployees.filter((row) => row._score >= 85).length;
  const atRiskEmployees = enrichedEmployees.filter((row) => row._score < 60 || String(row._risk).toLowerCase() === "high").length;
  const aboveTargetDepartments = performanceDepartments.filter((department) => {
    const scoped = enrichedEmployees.filter((row) => savedEmployeeDepartment(row) === department);
    return scoped.length && avg(scoped.map((row) => row._score)) >= 75;
  }).length;
  const belowTargetDepartments = performanceDepartments.filter((department) => {
    const scoped = enrichedEmployees.filter((row) => savedEmployeeDepartment(row) === department);
    return scoped.length && avg(scoped.map((row) => row._score)) < 70;
  }).length;
  const completedGoals = goals.filter((row) =>
    ["completed", "exceeded", "closed", "done"].includes(status(row).toLowerCase()),
  ).length;
  const overdueGoals = goals.filter((row) =>
    ["overdue", "behind", "late", "at risk"].includes(status(row).toLowerCase()),
  ).length;
  const reviewCompletionRate = pct(reviewedEmployees, Math.max(1, totalEmployees || reviews.length));
  const goalCompletionRate = pct(completedGoals, Math.max(1, goals.length));
  const trainingImpact = Math.round(avg(training.map((row) => n(row.score ?? row.completion ?? row.training_score ?? 0, 0))));
  const promotionCandidates = enrichedEmployees.filter((row) =>
    ["ready now", "ready in 3 months"].includes(String(row._promotion).toLowerCase()),
  ).length;
  const managerPending = reviews.filter((row) => {
    const state = status(row).toLowerCase();
    return state.includes("manager") || state.includes("pending");
  }).length;

  const nav = [
    ["exec", "Executive"],
    ["departments", "Departments"],
    ["employees", "Employees"],
    ["cycles", "Review cycles"],
    ["goals", "Goals & KPIs"],
    ["templates", "Role templates"],
    ["scoring", "Scoring engine"],
    ["pip", "PIP"],
    ["succession", "Promotion"],
    ["reports", "Reports"],
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eef2ff_0,#f8fafc_32%,#f1f5f9_100%)] text-slate-950">
      <div className="flex min-h-screen w-full items-stretch">
        <PerformanceMatrixSidebar />

        <div className="min-w-0 flex-1 px-4 py-4 lg:px-5">
        <header className="relative overflow-hidden rounded-[26px] border border-white/80 bg-white p-4 shadow-[0_20px_70px_rgba(15,23,42,0.10)] ring-1 ring-slate-100">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />
          <div className="absolute right-40 top-16 h-64 w-64 rounded-full bg-cyan-200/30 blur-3xl" />
          <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                  Live synced performance matrix
                </span>
                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-violet-700">
                  Unified HR performance command
                </span>
              </div>
              <h1 className="mt-4 max-w-5xl text-3xl font-black tracking-[-0.06em] xl:text-5xl">
                Unified Performance Management Page
              </h1>
              <p className="mt-3 max-w-5xl text-xs font-bold leading-7 text-slate-500">
                One enterprise workspace for executive performance health, department performance, employee evaluation,
                review cycles, goals, role-based templates, scoring logic, improvement plans and succession readiness.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Employee source</p>
                <p className="mt-2 text-sm font-black">"employees_command_final_list"</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Review source</p>
                <p className="mt-2 text-sm font-black">{reviewsResult.table}</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Goal source</p>
                <p className="mt-2 text-sm font-black">{goalsResult.table}</p>
              </div>
            </div>
          </div>

          
        </header>

        <SectionShell
          id="exec"
          eyebrow="01 · Executive Performance Command Center"
          title="Corporate performance health"
          subtitle="Leadership-level live signal from employee scores, review cycle status, goals, training, risk, feedback and promotion readiness."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/api/hr/performance-matrix/report" target="_blank">
                <PrimaryButton>Generate executive report</PrimaryButton>
              </Link>
              <Link href="/api/hr/performance-matrix/calibration" target="_blank">
                <GhostButton>Launch calibration</GhostButton>
              </Link>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <MiniKpi label="Corporate performance health" value={`${overallScore || 0}%`} detail="Weighted live health score" icon={Gauge} tone="blue" />
            <MiniKpi label="Review cycle completion" value={`${reviewCompletionRate}%`} detail={`${reviewedEmployees} reviewed · ${pendingReview} pending`} icon={ClipboardCheck} tone="emerald" />
            <MiniKpi label="High performers" value={topPerformers} detail="Employees above strong threshold" icon={Trophy} tone="amber" />
            <MiniKpi label="At-risk employees" value={atRiskEmployees} detail="Employees needing immediate support" icon={ShieldAlert} tone="rose" />
            <MiniKpi label="Goals overdue" value={overdueGoals} detail="Behind or at-risk goals" icon={Flag} tone="violet" />
            <MiniKpi label="Promotion candidates" value={promotionCandidates} detail="Ready now or ready soon" icon={Rocket} tone="cyan" />
          </div>

          <EnterpriseImpactPanel
            overallScore={overallScore || 0}
            reviewCompletionRate={reviewCompletionRate || 0}
            goalCompletionRate={goalCompletionRate || 0}
            trainingImpact={trainingImpact || 0}
            atRiskEmployees={atRiskEmployees || 0}
            promotionCandidates={promotionCandidates || 0}
          />

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[26px] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-300">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/50">Executive signal</p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.05em]">Performance trend projection</h3>
                  <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-white/60">
                    Score combines weighted goals, manager review, attendance, training, behavior and feedback.
                  </p>
                </div>
                <Sparkline value={overallScore || 72} />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {[
                  ["Departments above target", aboveTargetDepartments],
                  ["Departments below target", belowTargetDepartments],
                  ["Training impact", `${trainingImpact || 0}%`],
                  ["Manager feedback pending", managerPending],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-[18px] bg-white/10 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">{label}</p>
                    <p className="mt-2 text-2xl font-black">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">Smart decision queue</p>
              <div className="mt-4 grid gap-3">
                {[
                  ["Start reviews", `${pendingReview} employee(s) pending review`, ClipboardCheck],
                  ["Create improvement plans", `${atRiskEmployees} risk case(s) detected`, AlertTriangle],
                  ["Prepare promotions", `${promotionCandidates} candidate(s) ready`, Medal],
                  ["Assign overdue goals", `${overdueGoals} overdue goal(s)`, Target],
                ].map(([title, detail, Icon]: any) => (
                  <button key={title} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                    <span>
                      <span className="block text-sm font-black">{title}</span>
                      <span className="mt-1 block text-xs font-bold text-slate-500">{detail}</span>
                    </span>
                    <Icon className="h-5 w-5 text-violet-600" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionShell>

        <SectionShell
          id="departments"
          eyebrow="02 · Department Performance Dashboard"
          title="Department intelligence and recommended action"
          subtitle="Every department gets a live score, headcount, review coverage, KPI completion, training signal, risk cases and next action recommendation."
          action={<PrimaryButton>Open department calibration</PrimaryButton>}
        >
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {performanceDepartments.map((department) => (
              <DepartmentCard key={department} department={department} employees={enrichedEmployees} />
            ))}
          </div>
        </SectionShell>

        <DepartmentPerformanceWorkspace
          department={departmentFilter}
          panel={departmentPanel}
          employees={enrichedEmployees}
        />

        <SectionShell
          id="employees"
          eyebrow="03 · Universal Employee Performance Table"
          title="Searchable performance register"
          subtitle="Central employee performance command table with filters, risk signals, potential levels, promotion readiness and operational action buttons."
          action={<PrimaryButton>Generate employee report</PrimaryButton>}
        >
          <form method="get" className="mb-5 grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[1.3fr_repeat(3,0.7fr)_auto]">
            <label className="rounded-2xl bg-white px-4 py-3">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                <Search className="h-4 w-4" /> Search
              </span>
              <input name="q" defaultValue={params.q || ""} placeholder="Employee, role, manager, risk..." className="mt-2 w-full bg-transparent text-sm font-bold outline-none" />
            </label>

            <label className="rounded-2xl bg-white px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Department</span>
              <select name="department" defaultValue={departmentFilter} className="mt-2 w-full bg-transparent text-sm font-bold outline-none">
                <option value="all">All departments</option>
                {performanceDepartments.map((department) => <option key={department}>{department}</option>)}
              </select>
            </label>

            <label className="rounded-2xl bg-white px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Risk level</span>
              <select name="risk" defaultValue={riskFilter} className="mt-2 w-full bg-transparent text-sm font-bold outline-none">
                <option value="all">All risk</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>

            <label className="rounded-2xl bg-white px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Performance band</span>
              <select name="band" defaultValue={bandFilter} className="mt-2 w-full bg-transparent text-sm font-bold outline-none">
                <option value="all">All bands</option>
                <option>Exceptional</option>
                <option>Strong</option>
                <option>Solid</option>
                <option>Needs support</option>
                <option>At risk</option>
              </select>
            </label>

            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
              <Filter className="mr-2 inline h-4 w-4" />
              Apply
            </button>
          </form>

          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
            <div className="max-h-[720px] overflow-auto">
              <table className="w-full min-w-[1500px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    {[
                      "Employee",
                      "Department",
                      "Role",
                      "Manager",
                      "Performance",
                      "Goals",
                      "Attendance",
                      "Training",
                      "Review status",
                      "Risk",
                      "Potential",
                      "Promotion",
                      "Last review",
                      "Next review",
                      "Action needed",
                    ].map((header) => (
                      <th key={header} className="px-4 py-4 font-black">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length ? filteredEmployees.map((row, index) => (
                    <tr key={String(row.id || index)} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-4 font-black">{employeeName(row)}</td>
                      <td className="px-4 py-4 font-bold text-slate-600">{employeeDepartment(row)}</td>
                      <td className="px-4 py-4 font-bold text-slate-600">{employeeRole(row)}</td>
                      <td className="px-4 py-4 font-bold text-slate-600">{employeeManager(row)}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">{row._score}% · {row._band}</span>
                      </td>
                      <td className="px-4 py-4">{n(row.goal_completion ?? row.kpi_completion ?? row._score, row._score)}%</td>
                      <td className="px-4 py-4">{n(row.attendance_score ?? row.reliability_score, 80)}%</td>
                      <td className="px-4 py-4">{n(row.training_score ?? row.training_completion, 0)}%</td>
                      <td className="px-4 py-4">{status(row)}</td>
                      <td className="px-4 py-4">{row._risk}</td>
                      <td className="px-4 py-4">{row._potential}</td>
                      <td className="px-4 py-4">{row._promotion}</td>
                      <td className="px-4 py-4">{s(row, ["last_review_date", "reviewed_at", "updated_at"], "No review")}</td>
                      <td className="px-4 py-4">{s(row, ["next_review_date", "due_at"], "Not scheduled")}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/hr/employees?employee=${encodeURIComponent(String(row.id || employeeName(row)))}`} className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">Open dossier</Link>
                          <button className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">Start review</button>
                          <button className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Assign goal</button>
                          <button className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">Coaching</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={15} className="px-4 py-12 text-center text-sm font-black text-slate-400">
                        No employee performance records found in the synced source tables yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </SectionShell>

        <SectionShell
          id="cycles"
          eyebrow="04 · Performance Review Cycles"
          title="Central review cycle management"
          subtitle="Monthly, quarterly, annual, probation, promotion, PIP, manager check-in and role-specific review cycles managed in one place."
          action={<PrimaryButton>Launch new review cycle</PrimaryButton>}
        >
          <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-black">Cycle types</h3>
              <div className="mt-4 grid gap-2">
                {REVIEW_CYCLES.map((cycle) => (
                  <button key={cycle} className="flex items-center justify-between rounded-2xl bg-white p-4 text-left text-sm font-black shadow-sm">
                    {cycle}
                    <ChevronRight className="h-4 w-4 text-violet-600" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                {((cycles.length ? cycles : REVIEW_CYCLES.map((cycle, index) => ({
                  cycle_name: cycle,
                  period: "Current period",
                  status: REVIEW_WORKFLOW[Math.min(index, REVIEW_WORKFLOW.length - 1)],
                  completion: index === 0 ? reviewCompletionRate : Math.max(20, reviewCompletionRate - index * 6),
                  deadline: "To schedule",
                  pending_reviewers: managerPending,
                }))) as ReviewCycleRow[]).slice(0, 8).map((cycle, index) => (
                  <article key={String(cycle.id || index)} className="rounded-[20px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Review cycle</p>
                    <h3 className="mt-2 text-lg font-black">{s(cycle, ["cycle_name", "name", "title"], REVIEW_CYCLES[index] || "Review cycle")}</h3>
                    <p className="mt-1 text-xs font-bold text-slate-500">{s(cycle, ["period", "date_range"], "Current period")}</p>
                    <div className="mt-4 h-3 rounded-full bg-white">
                      <div className="h-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: `${clamp(n(cycle.completion ?? cycle.completion_percentage, reviewCompletionRate))}%` }} />
                    </div>
                    <div className="mt-4 grid gap-2 text-xs font-bold text-slate-600">
                      <p>Status: <span className="font-black text-slate-950">{s(cycle, ["status"], "Draft cycle")}</span></p>
                      <p>Deadline: <span className="font-black text-slate-950">{s(cycle, ["deadline", "due_at"], "Not scheduled")}</span></p>
                      <p>Pending reviewers: <span className="font-black text-slate-950">{n(cycle.pending_reviewers, managerPending)}</span></p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </SectionShell>

        <SectionShell
          id="goals"
          eyebrow="05 · Goal & KPI Management"
          title="Weighted goals connected to performance scores"
          subtitle="Performance score is connected to weighted goals, not only subjective reviews. Goals include owner, department, weight, target, progress, deadline, evidence and final score."
          action={<PrimaryButton>Create weighted goal</PrimaryButton>}
        >
          <div className="grid gap-4 xl:grid-cols-[0.55fr_1.45fr]">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-black">Goal types</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {GOAL_TYPES.map((goal) => (
                  <span key={goal} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">
                    {goal}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {((goals.length ? goals : GOAL_TYPES.map((goal, index) => ({
                  title: goal,
                  owner: "Performance owner",
                  department: DEPARTMENTS[index % DEPARTMENTS.length],
                  weight: index < 3 ? 35 : 15,
                  progress: index < 4 ? 76 : 42,
                  status: index < 4 ? "On track" : "At risk",
                  deadline: "To define",
                }))) as GoalRow[]).slice(0, 10).map((goal, index) => {
                const progress = clamp(n(goal.progress ?? goal.current_progress ?? goal.completion, 0));
                return (
                  <article key={String(goal.id || index)} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Weighted goal</p>
                        <h3 className="mt-2 text-lg font-black">{s(goal, ["title", "goal_title", "name"], "Goal title")}</h3>
                        <p className="mt-1 text-xs font-bold text-slate-500">{s(goal, ["department"], "Department")} · {s(goal, ["owner", "employee_name"], "Owner")}</p>
                      </div>
                      <span className="rounded-2xl bg-slate-50 px-4 py-2 text-sm font-black">{n(goal.weight, 10)}%</span>
                    </div>
                    <div className="mt-5 h-3 rounded-full bg-slate-100">
                      <div className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">{progress}% progress</span>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{s(goal, ["status"], "On track")}</span>
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">{s(goal, ["deadline", "due_at"], "No deadline")}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </SectionShell>

        <SectionShell
          id="templates"
          eyebrow="06 · Role-Based Evaluation Templates"
          title="Evaluation templates adapted to each role"
          subtitle="A single generic form cannot evaluate all staff correctly. This section defines role-specific criteria for field agents, sales, operations, HR, finance and academy."
          action={<PrimaryButton>Create role template</PrimaryButton>}
        >
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {ROLE_TEMPLATES.map((template) => (
              <article key={template.role} className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Role template</p>
                    <h3 className="mt-2 text-lg font-black">{template.role}</h3>
                  </div>
                  <BookOpenCheck className="h-5 w-5 text-violet-600" />
                </div>
                <div className="mt-5 grid gap-2">
                  {template.items.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          id="scoring"
          eyebrow="07 · Scoring Engine"
          title="Smart weighted performance calculation"
          subtitle="The engine supports universal scoring plus role-specific models for sales and field agents, with clear performance bands and decision rules."
          action={<PrimaryButton>Configure scoring weights</PrimaryButton>}
        >
          <div className="grid gap-4 xl:grid-cols-3">
            <ScoreModel title="Universal model" rows={BASE_SCORING} />
            <ScoreModel title="Sales / B2B model" rows={SALES_SCORING} />
            <ScoreModel title="Field agent model" rows={FIELD_AGENT_SCORING} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {[
              ["90–100", "Exceptional", "bg-emerald-50 text-emerald-700"],
              ["80–89", "Strong", "bg-blue-50 text-blue-700"],
              ["70–79", "Solid", "bg-cyan-50 text-cyan-700"],
              ["60–69", "Needs support", "bg-amber-50 text-amber-700"],
              ["Below 60", "At risk", "bg-rose-50 text-rose-700"],
            ].map(([range, label, cls]) => (
              <div key={range} className={`rounded-[18px] p-5 ${cls}`}>
                <p className="text-2xl font-black">{range}</p>
                <p className="mt-1 text-sm font-black">{label}</p>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          id="pip"
          eyebrow="11 · Performance Improvement Plans"
          title="Improvement plan command center"
          subtitle="Plan reason, performance gap, required improvement, action plan, manager support, assigned training, check-in frequency, success criteria and final decision."
          action={<PrimaryButton>Create improvement plan</PrimaryButton>}
        >
          <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-[24px] border border-rose-100 bg-rose-50 p-5">
              <h3 className="text-lg font-black text-rose-950">Smart PIP alerts</h3>
              <div className="mt-4 grid gap-3">
                {["PIP review due", "No progress recorded", "Manager feedback missing", "Employee improved", "Escalation recommended"].map((alert) => (
                  <div key={alert} className="rounded-2xl bg-white p-4 text-sm font-black text-rose-700">
                    <AlertTriangle className="mr-2 inline h-4 w-4" />
                    {alert}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {((pips.length ? pips : PIP_STATUSES.map((pipStatus, index) => ({
                  employee_name: enrichedEmployees[index]?.employee_name || employeeName(enrichedEmployees[index] || {}),
                  reason: index % 2 ? "Performance gap" : "Manager support required",
                  required_improvement: "Improve KPI consistency and reporting discipline",
                  status: pipStatus,
                  check_in_frequency: "Weekly",
                  success_criteria: "Score above 75% for two consecutive checkpoints",
                }))) as PipRow[]).slice(0, 7).map((pip, index) => (
                <article key={String(pip.id || index)} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600">Improvement plan</p>
                  <h3 className="mt-2 text-lg font-black">{s(pip, ["employee_name", "name"], "Employee")}</h3>
                  <p className="mt-2 text-sm font-bold text-slate-500">{s(pip, ["reason"], "Performance gap")}</p>
                  <div className="mt-4 grid gap-2 text-xs font-bold text-slate-600">
                    <p>Required improvement: <span className="font-black text-slate-950">{s(pip, ["required_improvement"], "Define improvement")}</span></p>
                    <p>Check-in frequency: <span className="font-black text-slate-950">{s(pip, ["check_in_frequency"], "Weekly")}</span></p>
                    <p>Success criteria: <span className="font-black text-slate-950">{s(pip, ["success_criteria"], "Define criteria")}</span></p>
                  </div>
                  <span className="mt-4 inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">{s(pip, ["status"], "Draft")}</span>
                </article>
              ))}
            </div>
          </div>
        </SectionShell>

        <SectionShell
          id="succession"
          eyebrow="12 · Promotion & Succession Readiness"
          title="Growth, promotion and succession intelligence"
          subtitle="Identify ready-now promotion candidates, 3-month readiness, 6–12 month readiness, high potential employees and critical role backups."
          action={<PrimaryButton>Open succession board</PrimaryButton>}
        >
          <div className="grid gap-4 xl:grid-cols-4">
            {[
              ["Ready now", enrichedEmployees.filter((row) => String(row._promotion).toLowerCase() === "ready now")],
              ["Ready in 3 months", enrichedEmployees.filter((row) => String(row._promotion).toLowerCase() === "ready in 3 months")],
              ["Ready in 6–12 months", enrichedEmployees.filter((row) => String(row._promotion).toLowerCase().includes("6"))],
              ["Needs training first", enrichedEmployees.filter((row) => String(row._promotion).toLowerCase().includes("training"))],
            ].map(([label, rows]: any) => (
              <article key={label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Promotion readiness</p>
                <h3 className="mt-2 text-2xl font-black">{label}</h3>
                <p className="mt-1 text-sm font-bold text-slate-500">{rows.length} employee(s)</p>
                <div className="mt-4 grid gap-2">
                  {rows.slice(0, 5).map((row: Row, index: number) => (
                    <div key={String(row.id || index)} className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-sm font-black">{employeeName(row)}</p>
                      <p className="text-xs font-bold text-slate-500">{employeeRole(row)} · {row._score}%</p>
                    </div>
                  ))}
                  {!rows.length ? (
                    <p className="rounded-2xl bg-slate-50 p-3 text-xs font-black text-slate-400">No synced candidates in this readiness band.</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-black">Decision support criteria</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Performance trend",
                "Skills readiness",
                "Manager recommendation",
                "Training completion",
                "Attendance reliability",
                "Behavior score",
                "Leadership potential",
                "Critical role backup",
              ].map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </SectionShell>

        <SectionShell
          id="reports"
          eyebrow="08–10 · Feedback, Training Impact & Reporting"
          title="Performance governance, calibration and reporting center"
          subtitle="The unified workspace also includes manager feedback, training impact, calibration decisions, exportable reporting and action queue monitoring."
          action={
            <div className="flex flex-wrap gap-2">
              <PrimaryButton>Export performance report</PrimaryButton>
              <GhostButton>Schedule leadership review</GhostButton>
            </div>
          }
        >
          <div className="grid gap-4 xl:grid-cols-3">
            {[
              ["Manager feedback queue", `${managerPending} pending`, MessageSquareText, "Managers must complete review comments before calibration."],
              ["Training impact", `${trainingImpact || 0}%`, GraduationCap, "Training completion and score feed into the final score model."],
              ["Calibration decisions", `${cycles.length || REVIEW_CYCLES.length} cycles`, Workflow, "HR can align ratings, promotion readiness and improvement decisions."],
              ["Report generation", "Ready", FileText, "Generate employee, department, cycle and executive reports."],
              ["Action needed", `${atRiskEmployees + overdueGoals}`, Activity, "Risk, overdue goals, missing feedback and PIP alerts."],
              ["Governance confidence", "Live", ShieldAlert, "All visible metrics are recalculated from synced arrays where available."],
            ].map(([title, value, Icon, detail]: any) => (
              <article key={title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <Icon className="h-5 w-5 text-violet-600" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</p>
                <p className="mt-2 text-2xl font-black tracking-[-0.05em]">{value}</p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{detail}</p>
              </article>
            ))}
          </div>
        </SectionShell>
        </div>
      </div>
    </main>
  );
}
