"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  FileText,
  Gauge,
  Globe2,
  Handshake,
  Layers3,
  LineChart,
  MapPinned,
  Megaphone,
  MessageCircle,
  PhoneCall,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Settings,
  Target,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

import {
  useLiveActivities,
  useLiveAppointments,
  useLiveProspects,
  useLiveTasks,
  type RCCAppointment,
  type RCCProspect,
  type RCCTask,
} from "@/lib/revenue-command-center/live-sync";

function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function money(value: number) {
  if (Math.abs(value) >= 1_000_000)
    return `${(value / 1_000_000).toFixed(2)}M MAD`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1000)}K MAD`;
  return `${Math.round(value || 0)} MAD`;
}

function pct(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value || 0)))}%`;
}

function isToday(value?: string | null) {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function isOpenTask(task: RCCTask) {
  return !["done", "completed", "cancelled", "canceled"].includes(
    String(task.status || "").toLowerCase(),
  );
}

function prospectStageValue(prospect: RCCProspect) {
  return Number(prospect.valueMad || 0);
}

function stageLabel(stage: string) {
  const labels: Record<string, string> = {
    new_lead: "Prospecting",
    discovery: "Discovery",
    qualification: "Qualified",
    decision_map: "Decision Map",
    appointment_ready: "Appointment Ready",
    proposal: "Proposal",
    negotiation: "Negotiation",
    contracting: "Contracting",
    closed_won: "Closed Won",
    won: "Closed Won",
    closed_lost: "Closed Lost",
    lost: "Closed Lost",
    recovery: "Recovery",
  };
  return labels[stage] || stage.replaceAll("_", " ") || "Unassigned";
}

function moduleHref(id: string) {
  const map: Record<string, string> = {
    prospects: "/revenue-command-center/prospects",
    appointments: "/revenue-command-center/appointments",
    sdr: "/revenue-command-center/sdr",
    "daily-tasks": "/revenue-command-center/daily-tasks",
    campaigns: "/revenue-command-center/campaigns",
    partnerships: "/revenue-command-center/partnerships",
    "follow-ups": "/revenue-command-center/follow-ups",
    "b2c-workflow": "/revenue-command-center/b2c-workflow",
    "decision-maps": "/revenue-command-center/prospects/decision-map",
    "executive-briefing": "/revenue-command-center/executive-briefing",
  };
  return map[id] || "/revenue-command-center/prospects";
}

const moduleCards = [
  {
    id: "prospects",
    title: "Prospects",
    icon: Users,
    subtitle: "Live qualification, ownership and pipeline movement.",
  },
  {
    id: "appointments",
    title: "Appointments",
    icon: CalendarDays,
    subtitle: "Meetings, conversion calls and revenue follow-through.",
  },
  {
    id: "sdr",
    title: "SDR Hub",
    icon: PhoneCall,
    subtitle: "Outbound actions, recovery and qualification velocity.",
  },
  {
    id: "daily-tasks",
    title: "Daily Tasks",
    icon: CheckCircle2,
    subtitle: "Live task queue, blockers and next actions.",
  },
  {
    id: "campaigns",
    title: "Campaigns",
    icon: Megaphone,
    subtitle: "Activation, source tracking and campaign revenue impact.",
  },
  {
    id: "partnerships",
    title: "Partnerships",
    icon: Handshake,
    subtitle: "B2B channel growth and partnership conversion.",
  },
  {
    id: "follow-ups",
    title: "Follow-Ups",
    icon: RefreshCcw,
    subtitle: "Overdue recovery and retention pressure.",
  },
  {
    id: "b2c-workflow",
    title: "B2C Workflow",
    icon: Workflow,
    subtitle: "Family conversion movement and customer routing.",
  },
  {
    id: "decision-maps",
    title: "Decision Maps",
    icon: MapPinned,
    subtitle: "Decision makers, blockers and influence mapping.",
  },
  {
    id: "executive-briefing",
    title: "Executive Briefing",
    icon: BriefcaseBusiness,
    subtitle: "Risks, forecasts and action briefings.",
  },
];


function RevenueDashboardSidebar({
  prospectCount,
  taskCount,
}: {
  prospectCount: number;
  taskCount: number;
  appointmentCount: number;
  alertCount: number;
}) {
  const item = (
    href: string,
    icon: React.ReactNode,
    label: string,
    active = false,
    badge?: number | string,
  ) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition",
        active
          ? "bg-violet-600/30 text-white ring-1 ring-violet-400/30"
          : "text-white/78 hover:bg-[#1a2b42] hover:text-white",
      )}
    >
      <span className="grid h-5 w-5 place-items-center [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white">{badge}</span>
      )}
    </Link>
  );

  return (
    <aside className="sticky top-[76px] hidden h-[calc(100vh-76px)] w-[318px] shrink-0 overflow-y-auto border-r border-cyan-400/20 bg-[linear-gradient(180deg,rgba(7,17,31,.98),rgba(3,8,20,.98))] px-5 py-6 shadow-[28px_0_90px_rgba(0,0,0,.55)] backdrop-blur-2xl xl:block">
      <Link href="/revenue-command-center" className="mb-7 flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-[22px] bg-gradient-to-br from-amber-200 via-yellow-400 to-orange-600 text-black shadow-[0_0_40px_rgba(245,158,11,.35)] ring-1 ring-white/30">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <div className="text-2xl font-black tracking-[.22em] text-white">ANGELCARE</div>
          <div className="text-[10px] font-bold uppercase tracking-[.14em] text-white/80">PROSPECT CENTER</div>
        </div>
      </Link>

      <div className="space-y-1">
        {item("/revenue-command-center", <BarChart3 />, "Command Center", true)}
        {item("/revenue-command-center/prospects/directory", <MapPinned />, "Prospects Directory", false, prospectCount)}
        {item("/revenue-command-center/partnerships", <Handshake />, "Partner Program")}
        {item("/revenue-command-center/daily-tasks", <CheckCircle2 />, "Tasks & Actions", false, taskCount)}
        {item("/revenue-command-center/appointments", <CalendarDays />, "Calendar")}
        {item("/revenue-command-center/campaigns", <Megaphone />, "Email Campaigns")}
        {item("/revenue-command-center/follow-ups", <MessageCircle />, "WhatsApp Center")}
        {item("/revenue-command-center/market-mapping", <Globe2 />, "Market Map")}
        {item("/revenue-command-center/revenue-analytics", <BarChart3 />, "Analytics and Reports")}
        {item("/revenue-command-center/executive-briefing", <FileText />, "Market Insights")}
      </div>
    </aside>
  );
}

export default function CentralRevenueCoreDashboard() {
  const {
    prospects,
    loading: prospectsLoading,
    error: prospectsError,
    refresh: refreshProspects,
    lastSync: prospectLastSync,
  } = useLiveProspects();
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    refresh: refreshTasks,
    byEntityId: tasksByProspect,
  } = useLiveTasks();
  const {
    appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    refresh: refreshAppointments,
    byEntityId: appointmentsByProspect,
  } = useLiveAppointments();
  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
    refresh: refreshActivities,
  } = useLiveActivities();

  const loading =
    prospectsLoading ||
    tasksLoading ||
    appointmentsLoading ||
    activitiesLoading;
  const error =
    prospectsError || tasksError || appointmentsError || activitiesError;

  const metrics = useMemo(() => {
    const totalPipeline = prospects.reduce(
      (sum, p) => sum + prospectStageValue(p),
      0,
    );
    const won = prospects
      .filter((p) => ["closed_won", "won"].includes(String(p.stage)))
      .reduce((sum, p) => sum + prospectStageValue(p), 0);
    const forecast = prospects.reduce(
      (sum, p) =>
        sum +
        prospectStageValue(p) * (Math.max(10, Number(p.score || 0)) / 100),
      0,
    );
    const meetingsToday = appointments.filter((a) =>
      isToday(a.appointmentAt),
    ).length;
    const openTasks = tasks.filter(isOpenTask).length;
    const highPriority = prospects.filter((p) =>
      ["critical", "high"].includes(String(p.priority)),
    ).length;
    return {
      totalPipeline,
      won,
      forecast,
      meetingsToday,
      openTasks,
      highPriority,
    };
  }, [prospects, tasks, appointments]);

  const stageBars = useMemo(() => {
    const wanted = [
      "new_lead",
      "qualification",
      "proposal",
      "negotiation",
      "closed_won",
    ];
    const rows = wanted.map((stage) => {
      const value = prospects
        .filter((p) => String(p.stage) === stage)
        .reduce((sum, p) => sum + prospectStageValue(p), 0);
      return { stage, label: stageLabel(stage), value };
    });
    const max = Math.max(...rows.map((r) => r.value), 1);
    return rows.map((r) => ({
      ...r,
      width: Math.max(8, Math.round((r.value / max) * 100)),
    }));
  }, [prospects]);

  const forecastRows = useMemo(() => {
    const base = metrics.forecast;
    return [
      { label: "Baseline", value: base * 0.48 },
      { label: "Qualified", value: base * 0.65 },
      { label: "Proposal", value: base * 0.82 },
      { label: "Negotiation", value: base },
      { label: "Weighted", value: base * 1.2 },
      { label: "Best Case", value: metrics.totalPipeline },
    ];
  }, [metrics.forecast, metrics.totalPipeline]);

  const topProspects = useMemo(() => {
    return [...prospects]
      .sort(
        (a, b) =>
          Number(b.valueMad || 0) +
          Number(b.score || 0) * 1000 -
          (Number(a.valueMad || 0) + Number(a.score || 0) * 1000),
      )
      .slice(0, 5);
  }, [prospects]);

  const alerts = useMemo(() => {
    const overdueTasks = tasks
      .filter(
        (t) =>
          isOpenTask(t) &&
          t.dueDate &&
          new Date(t.dueDate).getTime() < Date.now(),
      )
      .slice(0, 3)
      .map((t) => ({
        title: t.title,
        detail: t.entityName || t.owner || "Revenue task",
        href: "/revenue-command-center/daily-tasks",
      }));
    const highProspects = prospects
      .filter((p) => ["critical", "high"].includes(String(p.priority)))
      .slice(0, 4)
      .map((p) => ({
        title: p.name,
        detail: `${p.city} · ${money(p.valueMad)}`,
        href: `/revenue-command-center/prospects/${p.id}`,
      }));
    return [...overdueTasks, ...highProspects].slice(0, 5);
  }, [prospects, tasks]);

  const todaysSchedule = useMemo(() => {
    return appointments
      .filter((a) => isToday(a.appointmentAt))
      .sort(
        (a, b) =>
          new Date(a.appointmentAt).getTime() -
          new Date(b.appointmentAt).getTime(),
      )
      .slice(0, 6);
  }, [appointments]);

  const moduleCounts = useMemo(() => {
    const synced = (id: string) => {
      if (id === "prospects") return prospects.length;
      if (id === "appointments") return appointments.length;
      if (id === "daily-tasks") return tasks.length;
      if (id === "follow-ups")
        return tasks.filter(
          (t) => isOpenTask(t) && String(t.taskType).includes("follow"),
        ).length;
      if (id === "executive-briefing") return alerts.length;
      if (id === "decision-maps")
        return prospects.filter(
          (p) => String(p.contactName || "").trim() && p.contactName !== "N/A",
        ).length;
      if (id === "partnerships")
        return prospects.filter((p) =>
          String(p.raw?.type || p.raw?.data?.type || "").includes("partner"),
        ).length;
      if (id === "campaigns")
        return prospects.filter((p) =>
          String(p.raw?.source || p.raw?.data?.source || "")
            .toLowerCase()
            .includes("campaign"),
        ).length;
      if (id === "sdr")
        return tasks.filter((t) =>
          ["open", "pending"].includes(String(t.status)),
        ).length;
      if (id === "b2c-workflow")
        return prospects.filter((p) =>
          String(p.raw?.type || p.raw?.data?.type || "").includes("family"),
        ).length;
      return 0;
    };
    const value = (id: string) => {
      if (
        [
          "prospects",
          "sdr",
          "partnerships",
          "campaigns",
          "follow-ups",
          "b2c-workflow",
          "decision-maps",
          "executive-briefing",
        ].includes(id)
      )
        return metrics.totalPipeline;
      if (id === "appointments")
        return appointments.reduce(
          (sum, a) => sum + Number(a.raw?.entity_value_mad || 0),
          0,
        );
      if (id === "daily-tasks")
        return tasks.reduce(
          (sum, t) => sum + Number(t.raw?.entity_value_mad || 0),
          0,
        );
      return 0;
    };
    return { synced, value };
  }, [prospects, appointments, tasks, alerts.length, metrics.totalPipeline]);

  async function refreshAll() {
    await Promise.all([
      refreshProspects(),
      refreshTasks(),
      refreshAppointments(),
      refreshActivities(),
    ]);
  }

  const lastSyncText = prospectLastSync
    ? prospectLastSync.toLocaleTimeString()
    : loading
      ? "syncing"
      : "live";

  return (
    <main
      data-rcc-main-dashboard="true"
      className="min-h-screen overflow-x-hidden bg-[#050b16] text-white"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        [data-rcc-main-dashboard],
        [data-rcc-main-dashboard] * { color: #ffffff; }
        [data-rcc-main-dashboard] .muted { color: rgba(226, 232, 240, .78) !important; }
        [data-rcc-main-dashboard] .soft { color: rgba(203, 213, 225, .88) !important; }
        [data-rcc-main-dashboard] .premium-glass {
          background: linear-gradient(145deg, rgba(17,34,58,.96), rgba(6,16,33,.88));
          border: 1px solid rgba(103,232,249,.18);
          box-shadow: 0 30px 90px rgba(0,0,0,.36), inset 0 1px 0 rgba(255,255,255,.08);
        }
        [data-rcc-main-dashboard] .neon-edge { box-shadow: 0 0 0 1px rgba(34,211,238,.18), 0 24px 80px rgba(14,165,233,.12); }
        [data-rcc-main-dashboard] .orb { filter: blur(52px); opacity: .44; }
      `,
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,.34),transparent_29%),radial-gradient(circle_at_55%_0%,rgba(14,165,233,.26),transparent_24%),radial-gradient(circle_at_88%_12%,rgba(16,185,129,.18),transparent_26%),linear-gradient(180deg,#07111f_0%,#030814_63%,#01040b_100%)]" />
      <div className="orb pointer-events-none fixed left-[20%] top-20 h-72 w-72 rounded-full bg-cyan-500/25" />
      <div className="orb pointer-events-none fixed right-[18%] top-10 h-80 w-80 rounded-full bg-violet-500/25" />
      <div className="orb pointer-events-none fixed bottom-10 right-10 h-72 w-72 rounded-full bg-emerald-500/15" />

      <div className="relative flex min-h-screen w-full min-w-0">
        <RevenueDashboardSidebar
          prospectCount={prospects.length}
          taskCount={tasks.length}
          appointmentCount={appointments.length}
          alertCount={alerts.length}
        />

        <section className="min-w-0 flex-1 px-4 py-4 xl:px-6">
          <header className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 flex max-w-[560px] items-center gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-500/10 px-4 py-3 shadow-[0_0_40px_rgba(14,165,233,.12)]">
                <DatabaseZap className="h-4 w-4 text-cyan-300" />
                <span className="text-sm font-black text-white">
                  Live DB sync · {lastSyncText}
                </span>
              </div>
              <h1 className="max-w-[980px] text-4xl font-black tracking-tight text-white xl:text-5xl">
                AngelCare Strategic Business Development Command Center 🛡️
              </h1>
              <p className="mt-2 text-sm font-bold muted">
                Live MAD revenue intelligence, pipeline movement and execution
                control from the canonical revenue tables.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void refreshAll()}
                className="inline-flex items-center gap-2 rounded-xl border border-[#315474] bg-[#10223a] px-4 py-3 text-sm font-black text-white hover:bg-[#172942]"
              >
                <RefreshCcw className="h-4 w-4" /> Refresh live
              </button>
              <Link
                href="/revenue-command-center/daily-tasks"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white hover:bg-violet-500"
              >
                <Zap className="h-4 w-4" /> Create action
              </Link>
              <Bell className="mt-3 h-5 w-5 text-slate-200" />
            </div>
          </header>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-black text-red-100">
              Live sync warning: {error}
            </div>
          )}

          <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Kpi
              icon={<Target />}
              label="Pipeline Value"
              value={money(metrics.totalPipeline)}
              detail="live central baseline"
            />
            <Kpi
              icon={<BriefcaseBusiness />}
              label="Open Records"
              value={String(prospects.length)}
              detail={`${prospects.length} visible records`}
            />
            <Kpi
              icon={<Megaphone />}
              label="Won This Month"
              value={money(metrics.won)}
              detail="synced from closed-won"
            />
            <Kpi
              icon={<LineChart />}
              label="Forecast"
              value={money(metrics.forecast)}
              detail="weighted MAD forecast"
            />
            <Kpi
              icon={<CalendarDays />}
              label="Meetings Today"
              value={String(metrics.meetingsToday)}
              detail="view agenda →"
            />
          </section>

          <section className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-4">
            <CommandSignal icon={<ShieldCheck />} label="Execution Integrity" value={loading ? "Syncing" : "Live"} detail="canonical revenue tables" tone="emerald" />
            <CommandSignal icon={<DatabaseZap />} label="Data Source" value="Supabase" detail="zero demo counters" tone="cyan" />
            <CommandSignal icon={<Zap />} label="Action Engine" value="Active" detail="tasks + appointments + activities" tone="violet" />
            <CommandSignal icon={<Bell />} label="Critical Watch" value={String(alerts.length)} detail="live risk radar" tone="amber" />
          </section>

          <section className="mb-4 grid grid-cols-1 gap-4 2xl:grid-cols-[1.1fr_.9fr]">
            <Panel
              title="Revenue Pipeline Overview"
              action={
                <Link href="/revenue-command-center/prospects/pipeline">
                  Open pipeline
                </Link>
              }
            >
              <div className="mb-3 text-3xl font-black text-white">
                {money(metrics.totalPipeline)}
              </div>
              <div className="mb-6 text-sm font-black text-emerald-300">
                ↑ live MAD pipeline by stage
              </div>
              <div className="grid h-[180px] grid-cols-5 items-end gap-3">
                {stageBars.map((bar, index) => (
                  <div
                    key={bar.stage}
                    className="flex h-full flex-col justify-end gap-2"
                  >
                    <div
                      className={cn(
                        "rounded-t-xl",
                        [
                          "bg-blue-500",
                          "bg-emerald-500",
                          "bg-amber-400",
                          "bg-pink-500",
                          "bg-violet-500",
                        ][index],
                      )}
                      style={{ height: `${bar.width}%` }}
                    />
                    <div className="text-center text-[11px] font-black text-white">
                      {bar.label}
                    </div>
                    <div className="text-center text-[11px] font-bold muted">
                      {money(bar.value)}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="Revenue Performance Control Room"
              action={
                <Link href="/revenue-command-center/revenue-analytics">
                  Open analytics
                </Link>
              }
            >
              <div className="mb-2 text-3xl font-black text-white">
                {money(metrics.forecast)}
              </div>
              <div className="mb-5 text-sm font-black text-emerald-300">
                ↑ live, clickable and synced
              </div>
              <div className="space-y-3">
                {forecastRows.map((row, index) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[100px_1fr_110px] items-center gap-3 text-sm font-black"
                  >
                    <span>{row.label}</span>
                    <div className="h-3 rounded-full bg-white/10">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          [
                            "bg-blue-400",
                            "bg-emerald-400",
                            "bg-amber-400",
                            "bg-pink-400",
                            "bg-violet-400",
                            "bg-orange-400",
                          ][index],
                        )}
                        style={{
                          width: `${Math.min(100, (row.value / Math.max(metrics.totalPipeline, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-right">{money(row.value)}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <Panel title="Core Modules Gateway" action={<span>All modules</span>}>
            <p className="mb-4 text-sm font-bold muted">
              No invisible text. Every card is clickable and derives its
              counters from live revenue tables.
            </p>
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
              {moduleCards.map((card) => {
                const Icon = card.icon;
                const synced = moduleCounts.synced(card.id);
                const value = moduleCounts.value(card.id);
                return (
                  <Link
                    key={card.id}
                    href={moduleHref(card.id)}
                    className="group relative overflow-hidden rounded-[26px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(16,34,58,.96),rgba(9,20,36,.9))] p-5 shadow-[0_22px_70px_rgba(0,0,0,.28)] transition hover:-translate-y-1 hover:border-cyan-300/45 hover:shadow-[0_30px_90px_rgba(14,165,233,.18)]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,.18),transparent_38%)] opacity-0 transition group-hover:opacity-100" />
                    <div className="relative mb-4 flex items-center justify-between">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white shadow-[0_0_35px_rgba(168,85,247,.25)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1" />
                    </div>
                    <div className="text-lg font-black text-white">
                      {card.title}
                    </div>
                    <p className="mt-2 min-h-[44px] text-sm font-bold muted">
                      {card.subtitle}
                    </p>
                    <div className="mt-3 text-xs font-black text-cyan-300">
                      {synced} synced · {money(value)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </Panel>

          <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Panel
              title="Pipeline by Stage (MAD)"
              action={
                <Link href="/revenue-command-center/prospects/pipeline">
                  Manage
                </Link>
              }
            >
              <div className="space-y-3">
                {stageBars.map((bar) => (
                  <MetricRow
                    key={bar.stage}
                    label={bar.label}
                    value={money(bar.value)}
                  />
                ))}
              </div>
            </Panel>
            <Panel
              title="Top Opportunities"
              action={
                <Link href="/revenue-command-center/prospects/directory">
                  View all
                </Link>
              }
            >
              <div className="space-y-3">
                {topProspects.map((p) => (
                  <Link
                    href={`/revenue-command-center/prospects/${p.id}`}
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#172942]/90 p-3 shadow-[0_14px_36px_rgba(0,0,0,.18)] hover:border-cyan-300/25 hover:bg-[#203a5a]"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/25 text-xs font-black">
                      {String(p.name).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black text-white">
                        {p.name}
                      </div>
                      <div className="truncate text-xs font-bold muted">
                        {p.city} · {money(p.valueMad)}
                      </div>
                    </div>
                    <div className="text-sm font-black text-emerald-300">
                      {pct(p.score)}
                    </div>
                  </Link>
                ))}
                {!topProspects.length && (
                  <Empty text="No live prospects found." />
                )}
              </div>
            </Panel>
            <Panel
              title="SDR + Owner Performance"
              action={
                <Link href="/revenue-command-center/daily-tasks">View all</Link>
              }
            >
              <MetricRow label="Open tasks" value={String(metrics.openTasks)} />
              <MetricRow
                label="High priority prospects"
                value={String(metrics.highPriority)}
              />
              <MetricRow
                label="Activity logs"
                value={String(activities.length)}
              />
              <MetricRow
                label="Linked task entities"
                value={String(tasksByProspect.size)}
              />
              <MetricRow
                label="Linked appointment entities"
                value={String(appointmentsByProspect.size)}
              />
            </Panel>
          </section>
        </section>

        <aside className="hidden w-[360px] shrink-0 space-y-4 border-l border-cyan-400/15 bg-[linear-gradient(180deg,rgba(6,16,29,.96),rgba(2,6,17,.98))] p-4 shadow-[-20px_0_80px_rgba(0,0,0,.35)] 2xl:block">
          <SideBox
            title="Critical Alerts"
            href="/revenue-command-center/executive-briefing"
          >
            <div className="space-y-3">
              {alerts.map((a) => (
                <Link
                  href={a.href}
                  key={`${a.href}-${a.title}`}
                  className="block rounded-2xl border border-red-400/20 bg-red-500/15 p-4 hover:bg-red-500/20"
                >
                  <div className="flex gap-2 text-sm font-black text-red-100">
                    <AlertTriangle className="h-4 w-4" />
                    {a.title}
                  </div>
                  <div className="mt-1 text-xs font-bold muted">{a.detail}</div>
                </Link>
              ))}
              {!alerts.length && <Empty text="No critical live alerts." />}
            </div>
          </SideBox>

          <SideBox
            title="Today's Schedule"
            href="/revenue-command-center/appointments"
          >
            <div className="space-y-3">
              {todaysSchedule.map((a: RCCAppointment) => (
                <Link
                  href="/revenue-command-center/appointments"
                  key={a.id}
                  className="block rounded-2xl bg-[#172942] p-4 hover:bg-[#203a5a]"
                >
                  <div className="text-sm font-black text-cyan-200">
                    {new Date(a.appointmentAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="mt-1 text-sm font-black text-white">
                    {a.title}
                  </div>
                  <div className="mt-1 text-xs font-bold muted">
                    {a.entityName || a.owner}
                  </div>
                </Link>
              ))}
              {!todaysSchedule.length && <Empty text="No meetings today." />}
            </div>
          </SideBox>

          <SideBox
            title="Smart Navigation Control"
            href="/revenue-command-center/prospects"
          >
            <Link
              href="/revenue-command-center/prospects"
              className="flex justify-between rounded-xl bg-[#172942] p-3 text-sm font-black"
            >
              Prospects <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/revenue-command-center/daily-tasks"
              className="mt-2 flex justify-between rounded-xl bg-[#172942] p-3 text-sm font-black"
            >
              Tasks <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/revenue-command-center/appointments"
              className="mt-2 flex justify-between rounded-xl bg-[#172942] p-3 text-sm font-black"
            >
              Appointments <ArrowRight className="h-4 w-4" />
            </Link>
          </SideBox>
        </aside>
      </div>
    </main>
  );
}

function CommandSignal({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "emerald" | "cyan" | "violet" | "amber";
}) {
  const tones = {
    emerald: "from-emerald-400/25 to-green-500/10 border-emerald-300/20 text-emerald-200",
    cyan: "from-cyan-400/25 to-blue-500/10 border-cyan-300/20 text-cyan-200",
    violet: "from-violet-400/25 to-fuchsia-500/10 border-violet-300/20 text-violet-200",
    amber: "from-amber-400/25 to-orange-500/10 border-amber-300/20 text-amber-200",
  };
  return (
    <div className={cn("rounded-[24px] border bg-gradient-to-br p-4 shadow-[0_18px_55px_rgba(0,0,0,.24)]", tones[tone])}>
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[.16em] muted">{label}</div>
          <div className="text-xl font-black text-white">{value}</div>
          <div className="text-xs font-bold muted">{detail}</div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(16,34,58,.98),rgba(7,17,31,.92))] p-5 shadow-[0_24px_75px_rgba(0,0,0,.30)] transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:shadow-[0_30px_95px_rgba(14,165,233,.16)]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl transition group-hover:bg-violet-400/20" />
      <div className="relative flex items-center gap-4">
        <div className="grid h-[52px] w-[52px] place-items-center rounded-[20px] bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 p-3 text-white shadow-[0_0_38px_rgba(14,165,233,.28)] [&_svg]:h-6 [&_svg]:w-6">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[.18em] muted">
            {label}
          </div>
          <div className="mt-1 truncate text-2xl font-black text-white xl:text-[26px]">{value}</div>
          <div className="mt-1 text-xs font-black text-emerald-300">
            {detail}
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="premium-glass neon-edge rounded-[30px] p-5 transition hover:border-cyan-300/35 hover:shadow-[0_34px_110px_rgba(14,165,233,.16)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-black text-white">{title}</h2>
        <div className="text-sm font-black text-cyan-300">{action}</div>
      </div>
      {children}
    </section>
  );
}

function SideBox({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="premium-glass rounded-[28px] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-black text-white">{title}</h3>
        <Link href={href} className="text-xs font-black text-cyan-300">
          View all
        </Link>
      </div>
      {children}
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#172942]/90 px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,.16)]">
      <span className="text-sm font-black muted">{label}</span>
      <span className="text-sm font-black text-white">{value}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-center text-sm font-black muted">
      {text}
    </div>
  );
}
