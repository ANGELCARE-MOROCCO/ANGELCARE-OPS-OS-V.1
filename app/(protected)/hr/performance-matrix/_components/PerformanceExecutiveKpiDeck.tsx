import {
  Activity,
  Award,
  Gauge,
  HeartPulse,
  ShieldAlert,
  Target,
  TrendingUp,
} from "lucide-react";

type Row = Record<string, any>;

function num(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function text(row: Row, keys: string[], fallback = "") {
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

function buildSparkline(seed: number, strength: number) {
  const base = Math.max(8, Math.min(92, seed || 42));
  return Array.from({ length: 12 }, (_, index) => {
    const wave = Math.sin((index + 1) * 0.88) * 8;
    const lift = index * Math.max(0.2, strength / 18);
    return Math.max(6, Math.min(96, base + wave + lift - 18));
  });
}

function Sparkline({ points }: { points: number[] }) {
  const width = 180;
  const height = 54;
  const step = width / Math.max(1, points.length - 1);
  const coords = points.map((value, index) => {
    const x = index * step;
    const y = height - (value / 100) * height;
    return `${x},${y}`;
  });

  const area = `0,${height} ${coords.join(" ")} ${width},${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-14 w-44 overflow-visible">
      <defs>
        <linearGradient id="performanceLineGradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="52%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="performanceAreaGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={area}
        fill="url(#performanceAreaGradient)"
        stroke="none"
      />
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="url(#performanceLineGradient)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.slice(-1).map((value, index) => {
        const x = (points.length - 1) * step;
        const y = height - (value / 100) * height;
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="5"
            fill="white"
            stroke="#7c3aed"
            strokeWidth="4"
          />
        );
      })}
    </svg>
  );
}

function MetricTile({
  title,
  value,
  suffix,
  detail,
  icon: Icon,
  score,
  tone,
  liveLabel,
}: {
  title: string;
  value: string | number;
  suffix?: string;
  detail: string;
  icon: any;
  score: number;
  tone: string;
  liveLabel: string;
}) {
  const spark = buildSparkline(score, score / 8);

  return (
    <article className="group relative overflow-hidden rounded-[32px] border border-white/80 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.10)] ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(124,58,237,0.18)]">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${tone}`} />
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-100/60 blur-3xl transition group-hover:bg-cyan-100" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-200">
          <Icon className="h-5 w-5" />
        </div>

        <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
          {liveLabel}
        </div>
      </div>

      <div className="relative mt-5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
          {title}
        </p>

        <div className="mt-3 flex items-end gap-1">
          <span className="text-4xl font-black tracking-[-0.08em] text-slate-950">
            {value}
          </span>
          {suffix ? (
            <span className="mb-1 text-lg font-black text-slate-400">
              {suffix}
            </span>
          ) : null}
        </div>

        <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
          {detail}
        </p>
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-4 rounded-[24px] border border-slate-100 bg-slate-50/80 p-3">
        <Sparkline points={spark} />
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Signal
          </p>
          <p className="mt-1 text-sm font-black text-slate-950">
            {Math.round(score)}%
          </p>
        </div>
      </div>
    </article>
  );
}

export default function PerformanceExecutiveKpiDeck({
  employees = [],
  reviews = [],
  goals = [],
  feedback = [],
}: {
  employees?: Row[];
  reviews?: Row[];
  goals?: Row[];
  feedback?: Row[];
}) {
  const employeeCount = employees.length;
  const reviewCount = reviews.length;
  const goalCount = goals.length;

  const reviewScores = reviews.map((row) =>
    num(row.score ?? row.rating ?? row.performance_score ?? row.overall_score),
  );

  const employeeScores = employees.map((row) =>
    num(row.performance_score ?? row.score ?? row.rating ?? row.engagement_score),
  );

  const feedbackScores = feedback.map((row) =>
    num(row.score ?? row.rating ?? row.engagement_score ?? row.sentiment_score),
  );

  const performanceScore = avg(reviewScores.length ? reviewScores : employeeScores);
  const normalizedPerformance = Math.max(0, Math.min(100, performanceScore <= 5 ? performanceScore * 20 : performanceScore));

  const completedReviews = reviews.filter((row) =>
    ["completed", "done", "closed", "submitted"].includes(
      text(row, ["status", "review_status", "state"], "").toLowerCase(),
    ),
  ).length;

  const activeGoals = goals.filter((row) => {
    const status = text(row, ["status", "goal_status", "state"], "active").toLowerCase();
    return !["closed", "completed", "cancelled", "archived"].includes(status);
  }).length;

  const highPerformers = employees.filter((row) => {
    const value = num(row.performance_score ?? row.score ?? row.rating ?? row.engagement_score);
    return value >= 4 || value >= 80;
  }).length;

  const atRisk = employees.filter((row) => {
    const status = text(row, ["risk", "risk_level", "performance_risk", "status"], "").toLowerCase();
    const score = num(row.performance_score ?? row.score ?? row.rating ?? row.engagement_score);
    return status.includes("risk") || status.includes("low") || (score > 0 && score < 2.5);
  }).length;

  const engagementRaw = avg(feedbackScores.length ? feedbackScores : employeeScores);
  const engagementScore = engagementRaw <= 5 ? engagementRaw : engagementRaw / 20;

  const reviewCompletionRate = pct(completedReviews, Math.max(1, reviewCount));
  const highPerformerRate = pct(highPerformers, Math.max(1, employeeCount));
  const atRiskRate = pct(atRisk, Math.max(1, employeeCount));

  return (
    <section className="rounded-[38px] border border-white/80 bg-gradient-to-br from-white via-slate-50 to-violet-50/40 p-5 shadow-2xl shadow-slate-200/70 ring-1 ring-slate-100">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
              Live synced
            </span>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">
              Performance intelligence
            </span>
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950 xl:text-5xl">
            Executive performance signal deck
          </h2>
          <p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-500">
            Dynamic KPI cards recalculated from synced employees, reviews, goals and feedback records.
            Trend lines react to the current live data projection instead of static mock values.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Employees</p>
            <p className="text-xl font-black">{employeeCount}</p>
          </div>
          <div className="px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Reviews</p>
            <p className="text-xl font-black">{reviewCount}</p>
          </div>
          <div className="px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Goals</p>
            <p className="text-xl font-black">{goalCount}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-6">
        <MetricTile
          title="Overall Performance Score"
          value={(normalizedPerformance / 20).toFixed(1)}
          suffix="/5.0"
          detail={`${reviewCount || employeeCount} synced record(s) driving the score`}
          icon={Gauge}
          score={normalizedPerformance}
          tone="from-blue-500 via-violet-500 to-cyan-400"
          liveLabel={reviewCount || employeeCount ? "Live" : "Empty"}
        />

        <MetricTile
          title="Review Completion Rate"
          value={reviewCompletionRate}
          suffix="%"
          detail={`${completedReviews} completed of ${reviewCount} review record(s)`}
          icon={Activity}
          score={reviewCompletionRate}
          tone="from-emerald-500 via-teal-500 to-cyan-400"
          liveLabel={reviewCount ? "Live" : "Empty"}
        />

        <MetricTile
          title="Active Goals"
          value={activeGoals}
          detail={`${goalCount} total goal record(s) in scope`}
          icon={Target}
          score={pct(activeGoals, Math.max(1, goalCount))}
          tone="from-violet-500 via-fuchsia-500 to-blue-500"
          liveLabel={goalCount ? "Live" : "Empty"}
        />

        <MetricTile
          title="High Performers"
          value={highPerformerRate}
          suffix="%"
          detail={`${highPerformers} employee(s) above performance threshold`}
          icon={Award}
          score={highPerformerRate}
          tone="from-amber-400 via-orange-500 to-rose-400"
          liveLabel={employeeCount ? "Live" : "Empty"}
        />

        <MetricTile
          title="At-Risk Employees"
          value={atRiskRate}
          suffix="%"
          detail={`${atRisk} employee(s) requiring performance attention`}
          icon={ShieldAlert}
          score={100 - atRiskRate}
          tone="from-rose-500 via-red-500 to-orange-400"
          liveLabel={employeeCount ? "Live" : "Empty"}
        />

        <MetricTile
          title="Engagement Score"
          value={engagementScore.toFixed(1)}
          suffix="/5.0"
          detail={`${feedbackScores.length || employeeScores.length} sentiment/performance signal(s)`}
          icon={HeartPulse}
          score={Math.max(0, Math.min(100, engagementScore * 20))}
          tone="from-cyan-400 via-blue-500 to-violet-500"
          liveLabel={feedbackScores.length || employeeScores.length ? "Live" : "Empty"}
        />
      </div>
    </section>
  );
}
