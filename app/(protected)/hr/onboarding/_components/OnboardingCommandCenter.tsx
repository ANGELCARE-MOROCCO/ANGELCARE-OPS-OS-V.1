"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  DatabaseZap,
  FileBadge2,
  Gauge,
  Network,
  Workflow,
  ArrowRight,
  Bell,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  Edit3,
  FileCheck2,
  FileText,
  Filter,
  GraduationCap,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  addOnboardingNote,
  createOnboardingDocument,
  createOnboardingJourney,
  createOnboardingReminder,
  createOnboardingTask,
  deleteOnboardingDocument,
  deleteOnboardingJourney,
  deleteOnboardingTask,
  reassignOnboardingOwner,
  updateOnboardingDocument,
  updateOnboardingJourney,
  updateOnboardingTask,
} from "../_actions";

type Journey = {
  id: string;
  title: string;
  position: string;
  status: string;
  startDate: string;
  department: string;
  manager: string;
  location: string;
  employmentType: string;
  email: string;
  phone: string;
  progress: number;
  owner: string;
};
type Row = Record<string, any>;
export type OnboardingSeedData = {
  journeys: Journey[];
  tasks: Row[];
  documents: Row[];
  activity: Row[];
};

const fallbackJourneys: Journey[] = [
  {
    id: "onb-imane",
    title: "Imane Lahlou",
    position: "HR Business Partner",
    status: "In Progress",
    startDate: "2025-05-20",
    department: "Human Resources",
    manager: "Salma El Alami",
    location: "Casablanca HQ",
    employmentType: "Full Time",
    email: "imane.lahlou@angelcare.ma",
    phone: "+212 6 77 88 99 00",
    progress: 42,
    owner: "Salma El Alami",
  },
  {
    id: "onb-mehdi",
    title: "Mehdi Tazi",
    position: "Business Analyst",
    status: "In Progress",
    startDate: "2025-05-20",
    department: "Operations",
    manager: "Ahmed Benali",
    location: "Rabat",
    employmentType: "Full Time",
    email: "mehdi.tazi@angelcare.ma",
    phone: "+212 6 70 11 22 33",
    progress: 38,
    owner: "Imane Lahlou",
  },
  {
    id: "onb-sara",
    title: "Sara Bennani",
    position: "Customer Care Agent",
    status: "Document Collection",
    startDate: "2025-05-21",
    department: "Customer Care",
    manager: "Imane Lahlou",
    location: "Casablanca",
    employmentType: "Full Time",
    email: "sara.bennani@angelcare.ma",
    phone: "+212 6 55 44 33 22",
    progress: 28,
    owner: "Imane Lahlou",
  },
];
const phases = [
  "Offer & Acceptance",
  "Pre-Boarding",
  "Document Collection",
  "Orientation",
  "Training & Setup",
  "Integration",
  "Probation & Review",
];
const tabs = [
  "Tasks",
  "Documents",
  "Timeline",
  "Checklist",
  "Notes",
  "Activity",
];
const groups = [
  [
    "Personal Information",
    [
      "Provide personal information",
      "Emergency contact details",
      "ID card copy",
    ],
  ],
  [
    "Contract & Legal Documents",
    ["Employment contract", "Sign company policies", "NDA agreement"],
  ],
  [
    "Company Setup",
    [
      "IT equipment setup",
      "System access provisioning",
      "Email & communication setup",
    ],
  ],
  [
    "Training & Compliance",
    [
      "Compliance training",
      "Role-specific training",
      "Safety & quality briefing",
    ],
  ],
];
const navGroups = [
  { label: "Overview", items: [
    { label: "Dashboard", href: "/hr", icon: LayoutDashboard },
    { label: "Analytics", href: "/hr/analytics", icon: BarChart3 },
    { label: "Reports", href: "/hr/reports", icon: FileText },
    { label: "Alerts", href: "/hr/notifications", icon: Bell },
  ]},
  { label: "People", items: [
    { label: "Employees", href: "/hr/employees", icon: Users },
    { label: "Organization", href: "/hr/departments", icon: Network },
    { label: "Teams & Departments", href: "/hr/departments", icon: Building2 },
    { label: "Positions & Roles", href: "/hr/positions", icon: Briefcase },
    { label: "Recruitment", href: "/hr/recruitment", icon: UserCheck },
    { label: "Onboarding", href: "/hr/onboarding", icon: ClipboardCheck },
    { label: "Performance", href: "/hr/performance-matrix", icon: Gauge },
    { label: "Learning & Development", href: "/hr/training", icon: GraduationCap },
  ]},
  { label: "Operations", items: [
    { label: "Attendance", href: "/hr/attendance", icon: CalendarDays },
    { label: "Leave Management", href: "/hr/approvals", icon: Clock },
    { label: "Work Schedules", href: "/hr/rosters", icon: Workflow },
    { label: "Time Tracking", href: "/hr/workforce-ops", icon: Activity },
    { label: "Overtime & Approvals", href: "/hr/approvals", icon: CheckCircle2 },
  ]},
  { label: "Compliance & Documents", items: [
    { label: "Policies & Procedures", href: "/hr/templates", icon: ShieldCheck },
    { label: "Documents", href: "/hr/documents", icon: FileBadge2 },
    { label: "Compliance Dashboard", href: "/hr/compliance", icon: AlertTriangle },
  ]},
  { label: "System", items: [
    { label: "Integrations", href: "/hr/sync-center", icon: Sparkles },
    { label: "Settings", href: "/hr/settings", icon: Settings },
    { label: "Access & Permissions", href: "/hr/permissions", icon: ShieldCheck },
  ]},
] as const;
function cn(...c: Array<string | false | undefined | null>) {
  return c.filter(Boolean).join(" ");
}
function d(v: any) {
  return String(v || "").slice(0, 10) || "Pending";
}
function initials(n: string) {
  return n
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function OnboardingCommandCenter({
  initialData,
}: {
  initialData: OnboardingSeedData;
}) {
  const [journeys, setJourneys] = useState<Journey[]>(
    initialData.journeys.length ? initialData.journeys : fallbackJourneys,
  );
  const [tasksLive, setTasksLive] = useState<Row[]>(initialData.tasks || []);
  const [docsLive, setDocsLive] = useState<Row[]>(initialData.documents || []);
  const [feed, setFeed] = useState<Row[]>(initialData.activity || []);
  const [selectedId, setSelectedId] = useState(
    (initialData.journeys[0] || fallbackJourneys[0]).id,
  );
  const [activeTab, setActiveTab] = useState("Tasks");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState<
    | null
    | "journey"
    | "editJourney"
    | "task"
    | "document"
    | "note"
    | "reminder"
    | "reassign"
    | "timeline"
    | "profile"
  >(null);
  const [taskOverrides, setTaskOverrides] = useState<Record<string, Row>>({});
  const [deletedTaskIds, setDeletedTaskIds] = useState<Record<string, true>>({});
  const [toast, setToast] = useState("Live sync ready");
  const [isPending, startTransition] = useTransition();
  const selected = journeys.find((j) => j.id === selectedId) || journeys[0];
  const filtered = journeys.filter((j) =>
    `${j.title} ${j.position} ${j.status} ${j.department}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  const generated = useMemo(
    () =>
      groups.flatMap(([g, items], gi) =>
        (items as string[]).map((title, i) => ({
          id: `${selected?.id}-${gi}-${i}`,
          journey_id: selected?.id,
          group: g,
          title,
          due_at: `2025-05-${String(20 + gi + i).padStart(2, "0")}`,
          owner:
            gi < 2 ? selected?.owner : gi === 2 ? "IT Team" : "Training Team",
          status:
            gi === 0
              ? "Completed"
              : gi === 1 && i === 0
                ? "In Progress"
                : "Pending",
          priority: gi === 1 ? "High" : "Normal",
        })),
      ),
    [selected],
  );
  const persistedTasks = tasksLive.filter(
    (t) => String(t.journey_id || "") === String(selected?.id) && !deletedTaskIds[String(t.id)],
  );
  const generatedTasks = generated
    .map((task) => ({ ...task, ...(taskOverrides[String(task.id)] || {}) }))
    .filter((task) => !deletedTaskIds[String(task.id)]);
  const persistedIds = new Set(persistedTasks.map((task) => String(task.id)));
  const allTasks = [
    ...persistedTasks,
    ...generatedTasks.filter((task) => !persistedIds.has(String(task.id))),
  ];
  const visibleTasks = allTasks.filter(
    (t) => filter === "All" || String(t.status) === filter,
  );
  const completed = allTasks.filter(
    (t) => String(t.status) === "Completed",
  ).length;
  const docs = docsLive.filter(
    (x) => String(x.journey_id || "") === String(selected?.id),
  );
  const completion = Math.round(
    (completed / Math.max(1, allTasks.length)) * 100,
  );

  function log(title: string) {
    setToast(`${title} · synced ${new Date().toLocaleTimeString()}`);
    setFeed((f) => [
      {
        id: `local-${Date.now()}`,
        title,
        body: `${selected.title} · ${new Date().toLocaleTimeString()}`,
        type: "activity",
      },
      ...f,
    ]);
  }
  function toggleTask(task: Row) {
    const next = task.status === "Completed" ? "In Progress" : "Completed";
    const updated = { ...task, status: next, updated_at: new Date().toISOString() };
    setTaskOverrides((current) => ({ ...current, [String(task.id)]: updated }));
    setTasksLive((list) => {
      const exists = list.some((x) => String(x.id) === String(task.id));
      return exists
        ? list.map((x) => (String(x.id) === String(task.id) ? { ...x, status: next } : x))
        : [updated, ...list];
    });
    startTransition(() => {
      void (async () => {
        const existing = tasksLive.some((x) => String(x.id) === String(task.id));
        if (existing && !String(task.id).startsWith(`${selected?.id}-`)) {
          await updateOnboardingTask(String(task.id), { status: next });
        } else {
          await createOnboardingTask({ ...updated, journey_id: selected?.id });
        }
        log(`Task ${next.toLowerCase()}: ${task.title}`);
      })();
    });
  }
  function deleteTask(task: Row) {
    setDeletedTaskIds((current) => ({ ...current, [String(task.id)]: true }));
    setTasksLive((list) => list.filter((x) => String(x.id) !== String(task.id)));
    startTransition(() => {
      void (async () => {
        if (!String(task.id).startsWith(`${selected?.id}-`)) {
          await deleteOnboardingTask(String(task.id));
        }
        await addOnboardingNote({
          journey_id: selected?.id,
          title: `Task deleted: ${task.title}`,
          body: `Removed by onboarding operator from ${task.group || "task board"}.`,
          type: "task_delete",
        });
        log(`Task deleted: ${task.title}`);
      })();
    });
  }
  function completePhase() {
    const nextProgress = Math.min(100, Number(selected.progress || 0) + 14);
    setJourneys((j) =>
      j.map((x) =>
        x.id === selected.id
          ? {
              ...x,
              progress: nextProgress,
              status: nextProgress >= 100 ? "Completed" : x.status,
            }
          : x,
      ),
    );
    startTransition(() => {
      void (async () => {
        await updateOnboardingJourney(selected.id, { progress: nextProgress });
        log("Journey phase advanced");
      })();
    });
  }
  function deleteJourney() {
    const rest = journeys.filter((j) => j.id !== selected.id);
    setJourneys(rest.length ? rest : fallbackJourneys);
    setSelectedId((rest[0] || fallbackJourneys[0]).id);
    startTransition(() => {
      void (async () => {
        await deleteOnboardingJourney(selected.id);
        log("Onboarding journey removed");
      })();
    });
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef2ff,transparent_34%),#f7f8fc] text-slate-950">
      <UiStyles />
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-[286px] shrink-0 overflow-y-auto border-r border-white/70 bg-white/92 p-4 shadow-2xl shadow-slate-200/60 backdrop-blur-2xl xl:block">
          <Link href="/hr" className="flex items-center gap-3 rounded-[26px] bg-gradient-to-br from-violet-600 via-indigo-600 to-slate-950 p-4 text-white shadow-2xl shadow-violet-200">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Sparkles className="h-5 w-5" /></div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-100">AngelCare</div>
              <div className="text-lg font-black tracking-tight">HR Command OS</div>
            </div>
          </Link>

          <div className="mt-5 space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{group.label}</div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = item.href === "/hr/onboarding";
                    return (
                      <Link
                        key={`${group.label}-${item.label}`}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-black transition",
                          active
                            ? "bg-violet-50 text-violet-700 ring-1 ring-violet-100 shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                        )}
                      >
                        <Icon className={cn("h-4 w-4", active ? "text-violet-600" : "text-slate-400 group-hover:text-violet-600")} />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {active ? <span className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_14px_rgba(139,92,246,0.7)]" /> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[24px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4 shadow-lg shadow-violet-100/50">
            <div className="flex items-center gap-2 text-sm font-black text-violet-800"><DatabaseZap className="h-4 w-4" />Onboarding sync layer</div>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-600">Same HR navigation as the main module. Onboarding stays connected to candidates, employees, tasks, documents, WhatsApp reminders, owners and activity logs.</p>
            <div className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-violet-100">{toast}</div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-5">
          <header className="sticky top-0 z-40 -mx-5 -mt-5 mb-5 border-b border-slate-200/80 bg-white/85 px-6 py-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-black tracking-[0.24em] text-violet-600">
                  HR / CANDIDATE ONBOARDING
                </div>
                <h1 className="text-3xl font-black tracking-tight">
                  Onboarding Command Center
                </h1>
                <p className="text-sm font-semibold text-slate-500">
                  Every journey, task, document, reminder, note and escalation
                  works from one live workspace.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setModal("timeline")}
                  className="btn-lite"
                >
                  <Activity className="h-4 w-4" />
                  View Timeline
                </button>
                <button
                  onClick={() => setModal("editJourney")}
                  className="btn-lite"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Journey
                </button>
                <button
                  onClick={() => setModal("journey")}
                  className="btn-lite"
                >
                  <Plus className="h-4 w-4" />
                  New Journey
                </button>
                <button
                  onClick={() => setModal("task")}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </button>
              </div>
            </div>
          </header>

          <section className="mb-5 grid gap-4 md:grid-cols-4">
            <Kpi label="Active journeys" value={journeys.length} icon={Users} />
            <Kpi
              label="Tasks completed"
              value={`${completed}/${allTasks.length}`}
              icon={CheckCircle2}
            />
            <Kpi label="Documents" value={docs.length || 4} icon={FileCheck2} />
            <Kpi label="Avg. progress" value={`${completion}%`} icon={Zap} />
          </section>

          <section className="grid gap-4 lg:grid-cols-[320px_1fr] 2xl:grid-cols-[320px_1fr_370px]">
            <div className="card p-4">
              <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-black">
                <button className="rounded-xl bg-white py-2 text-violet-700 shadow-sm">
                  All Onboardings
                </button>
                <button
                  onClick={() => setQuery(selected.owner)}
                  className="rounded-xl py-2 text-slate-500 hover:bg-white"
                >
                  My Onboardings
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search candidate, position..."
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                  />
                </div>
                <button
                  onClick={() => setQuery("")}
                  className="rounded-2xl border px-3"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 max-h-[740px] space-y-2 overflow-auto pr-1">
                {filtered.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => setSelectedId(j.id)}
                    className={cn(
                      "group w-full rounded-[26px] border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-xl",
                      selected.id === j.id
                        ? "border-violet-200 bg-violet-50 shadow-violet-100"
                        : "border-transparent bg-white hover:border-slate-200",
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-violet-200 to-cyan-100 text-sm font-black text-violet-700">
                        {initials(j.title)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-black">{j.title}</div>
                        <div className="truncate text-xs font-bold text-slate-500">
                          {j.position}
                        </div>
                        <span className="mt-1 inline-flex rounded-full bg-violet-100 px-2 py-1 text-[11px] font-black text-violet-700">
                          {j.status}
                        </span>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                            style={{ width: `${j.progress}%` }}
                          />
                        </div>
                      </div>
                      <ChevronRight className="mt-4 h-4 w-4 text-slate-300 group-hover:text-violet-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                <ProfileCard selected={selected} onDelete={deleteJourney} />
                <JourneyStepper
                  progress={selected.progress}
                  onAdvance={completePhase}
                />
              </div>
              <div className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {tabs.map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={cn(
                          "rounded-2xl px-4 py-2 text-sm font-black transition",
                          activeTab === t
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-100"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setToast("Refreshing live onboarding data...");
                        window.location.reload();
                      }}
                      className="btn-mini"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Refresh
                    </button>
                    <button
                      onClick={() => setModal("note")}
                      className="btn-mini"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Comment
                    </button>
                  </div>
                </div>
                {activeTab === "Tasks" ? (
                  <TasksBoard
                    tasks={visibleTasks}
                    allTasks={allTasks}
                    filter={filter}
                    setFilter={setFilter}
                    toggleTask={toggleTask}
                    deleteTask={deleteTask}
                    setModal={setModal}
                  />
                ) : (
                  <Workspace
                    tab={activeTab}
                    selected={selected}
                    docs={docs}
                    feed={feed}
                    setModal={setModal}
                    setDocsLive={setDocsLive}
                  />
                )}
              </div>
            </div>

            <aside className="space-y-4 lg:col-span-2 2xl:col-span-1">
              <SummaryPanel
                progress={selected.progress}
                completed={completed}
                total={allTasks.length}
              />
              <DocumentsPanel
                docs={docs}
                setModal={setModal}
                setDocsLive={setDocsLive}
              />
              <ActivityPanel
                feed={feed}
                selected={selected}
                setModal={setModal}
              />
              <QuickActions selected={selected} setModal={setModal} />
            </aside>
          </section>
        </main>
      </div>
      {modal && (
        <ExecutionModal
          modal={modal}
          selected={selected}
          isPending={isPending}
          onClose={() => setModal(null)}
          onCreateJourney={(j: Journey) => {
            setJourneys([j, ...journeys]);
            setSelectedId(j.id);
            setModal(null);
            log("Journey created live");
          }}
          onCreateTask={(t: Row) => {
            setTasksLive([t, ...tasksLive]);
            setModal(null);
            log("Task created live");
          }}
          onCreateDoc={(x: Row) => {
            setDocsLive([x, ...docsLive]);
            setModal(null);
            log("Document added live");
          }}
          onNote={(x: Row) => {
            setFeed([x, ...feed]);
            setModal(null);
            log("Note saved live");
          }}
          onReassign={(owner: string) => {
            setJourneys((j) =>
              j.map((x) => (x.id === selected.id ? { ...x, owner } : x)),
            );
            setModal(null);
            startTransition(() => {
              void reassignOnboardingOwner(selected.id, owner);
            });
            log("Owner reassigned");
          }}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, icon: Icon }: any) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-black">{value}</div>
        <div className="text-xs font-black text-slate-500">{label}</div>
      </div>
    </div>
  );
}
function ProfileCard({ selected, onDelete }: any) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-r from-violet-700 via-indigo-600 to-cyan-500 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-xl font-black">
            {initials(selected.title)}
          </div>
          <div>
            <div className="text-xl font-black">{selected.title}</div>
            <div className="font-semibold text-white/75">
              {selected.position}
            </div>
            <span className="mt-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-black">
              {selected.status}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-5 text-sm font-semibold">
        {[
          ["Onboarding ID", selected.id],
          ["Start Date", d(selected.startDate)],
          ["Department", selected.department],
          ["Manager", selected.manager],
          ["Location", selected.location],
          ["Employment Type", selected.employmentType],
        ].map(([a, b]) => (
          <div key={a} className="flex justify-between gap-4">
            <span className="text-slate-500">{a}</span>
            <b className="text-right">{b}</b>
          </div>
        ))}
        <button
          onClick={onDelete}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-3 text-xs font-black text-rose-600 hover:bg-rose-100"
        >
          <Trash2 className="h-4 w-4" />
          Archive journey
        </button>
      </div>
    </div>
  );
}
function JourneyStepper({ progress, onAdvance }: any) {
  return (
    <div className="card p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">Onboarding Journey</h2>
          <p className="text-sm font-semibold text-slate-500">
            Operational phase control and completion tracking
          </p>
        </div>
        <button onClick={onAdvance} className="btn-primary">
          <CheckCircle2 className="h-4 w-4" />
          Advance Phase
        </button>
      </div>
      <div className="relative grid grid-cols-7 gap-2">
        <div className="absolute left-8 right-8 top-5 h-1 rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-violet-600"
            style={{ width: `${progress}%` }}
          />
        </div>
        {phases.map((p, i) => {
          const done = progress >= (i + 1) * 14;
          const active = !done && progress >= i * 14;
          return (
            <div key={p} className="relative text-center">
              <div
                className={cn(
                  "relative z-10 mx-auto grid h-10 w-10 place-items-center rounded-full text-sm font-black shadow-sm",
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-violet-600 text-white"
                      : "bg-slate-200 text-slate-500",
                )}
              >
                {done ? "✓" : i + 1}
              </div>
              <div className="mt-3 text-xs font-black text-slate-600">{p}</div>
              <div
                className={cn(
                  "mt-1 text-[11px] font-black",
                  done
                    ? "text-emerald-600"
                    : active
                      ? "text-violet-600"
                      : "text-slate-400",
                )}
              >
                {done ? "Completed" : active ? "In Progress" : "Pending"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function TasksBoard({
  tasks,
  allTasks,
  filter,
  setFilter,
  toggleTask,
  deleteTask,
  setModal,
}: any) {
  const done = allTasks.filter((t: any) => t.status === "Completed").length;
  return (
    <div className="pt-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <b>
          {done} of {allTasks.length} tasks completed
        </b>
        <div className="h-2 w-44 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
            style={{ width: `${(done / Math.max(1, allTasks.length)) * 100}%` }}
          />
        </div>
        {["All", "Completed", "In Progress", "Pending"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-black",
              filter === f
                ? "bg-violet-100 text-violet-700"
                : "bg-slate-50 text-slate-500",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {groups.map(([group]) => (
          <div
            key={group as string}
            className="overflow-hidden rounded-[26px] border border-slate-200 bg-white"
          >
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
              <b>{group as string}</b>
              <button
                onClick={() => setModal("task")}
                className="text-xs font-black text-violet-600"
              >
                + add
              </button>
            </div>
            {tasks
              .filter((t: any) => t.group === group || !t.group)
              .slice(0, 8)
              .map((task: any) => (
                <div
                  key={task.id}
                  className="grid grid-cols-[1fr_120px_120px_88px] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm"
                >
                  <button
                    onClick={() => { toggleTask(task); }}
                    className="flex items-center gap-3 text-left"
                  >
                    <CheckCircle2
                      className={cn(
                        "h-5 w-5",
                        task.status === "Completed"
                          ? "text-emerald-500"
                          : task.status === "In Progress"
                            ? "text-violet-500"
                            : "text-slate-300",
                      )}
                    />
                    <span>
                      <b>{task.title}</b>
                      <br />
                      <span className="text-xs font-semibold text-slate-500">
                        {task.status} · {task.priority || "Normal"}
                      </span>
                    </span>
                  </button>
                  <span className="font-semibold text-slate-500">
                    {d(task.due_at)}
                  </span>
                  <span className="font-semibold text-slate-500">
                    {task.owner}
                  </span>
                  <div className="flex gap-2">
                    <button
                      title="Toggle task status live"
                      onClick={() => { toggleTask(task); }}
                      className="rounded-xl bg-slate-50 p-2 transition hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button
                      title="Delete task live"
                      onClick={() => { deleteTask(task); }}
                      className="rounded-xl bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
      <button
        onClick={() => setModal("task")}
        className="mt-4 w-full rounded-2xl border border-violet-200 py-3 text-sm font-black text-violet-700 hover:bg-violet-50"
      >
        <Plus className="mr-2 inline h-4 w-4" />
        Add Task
      </button>
    </div>
  );
}
function SummaryPanel({ progress, completed, total }: any) {
  return (
    <div className="card p-5">
      <h3 className="font-black">Onboarding Summary</h3>
      <div className="mt-4 flex items-center gap-5">
        <div
          className="grid h-28 w-28 place-items-center rounded-full bg-[conic-gradient(#7c3aed_var(--p),#e5e7eb_0)]"
          style={{ "--p": `${progress}%` } as any}
        >
          <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center">
            <b className="text-2xl">{progress}%</b>
            <span className="text-[10px] font-black text-slate-400">
              Complete
            </span>
          </div>
        </div>
        <div className="space-y-2 text-sm font-semibold">
          <div>
            Completed <b>{completed}</b>
          </div>
          <div>
            Remaining <b>{Math.max(0, total - completed)}</b>
          </div>
          <div>
            Risk <b className="text-emerald-600">Controlled</b>
          </div>
        </div>
      </div>
    </div>
  );
}
function DocumentsPanel({ docs, setModal, setDocsLive }: any) {
  function del(x: any) {
    setDocsLive((d: Row[]) => d.filter((y) => y.id !== x.id));
    deleteOnboardingDocument(String(x.id));
  }
  return (
    <div className="card p-5">
      <div className="mb-3 flex justify-between">
        <h3 className="font-black">Important Documents</h3>
        <button
          onClick={() => setModal("document")}
          className="text-xs font-black text-violet-600"
        >
          Add
        </button>
      </div>
      {(docs.length
        ? docs
        : [
            { id: "doc-1", title: "Employment Contract", status: "Uploaded" },
            { id: "doc-2", title: "ID Card Copy", status: "Required" },
            { id: "doc-3", title: "Diploma & Certificates", status: "Pending" },
          ]
      ).map((doc: any) => (
        <div
          key={doc.id}
          className="flex items-center justify-between border-t border-slate-100 py-3"
        >
          <div className="flex gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <div>
              <b className="text-sm">{doc.title}</b>
              <div className="text-xs font-semibold text-slate-400">
                {doc.status}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                updateOnboardingDocument(String(doc.id), {
                  status: "Downloaded",
                })
              }
              className="rounded-xl bg-slate-50 p-2"
            >
              <Download className="h-4 w-4" />
            </button>
            {String(doc.id).startsWith("doc-") ? null : (
              <button
                onClick={() => del(doc)}
                className="rounded-xl bg-rose-50 p-2 text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
function ActivityPanel({ feed, selected, setModal }: any) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex justify-between">
        <h3 className="font-black">Activity Feed</h3>
        <button
          onClick={() => setModal("note")}
          className="text-xs font-black text-violet-600"
        >
          Add note
        </button>
      </div>
      {(feed.length
        ? feed
        : [
            {
              id: "a1",
              title: `${selected.title} uploaded ID Card Copy`,
              body: "May 21, 2025 · 10:30 AM",
            },
            {
              id: "a2",
              title: "IT Team started equipment setup",
              body: "May 21, 2025 · 02:20 PM",
            },
          ]
      )
        .slice(0, 5)
        .map((a: any) => (
          <div
            key={a.id || a.title}
            className="flex gap-3 border-t border-slate-100 py-3"
          >
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-violet-50 text-violet-600">
              <Activity className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold">
              <b>{a.title}</b>
              <br />
              <span className="text-xs text-slate-400">
                {a.body || a.created_at || "Live activity"}
              </span>
            </p>
          </div>
        ))}
    </div>
  );
}
function QuickActions({ selected, setModal }: any) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-black">Quick Actions</h3>
        <Settings className="h-4 w-4 text-slate-400" />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs font-black">
        <button onClick={() => setModal("reminder")} className="qa">
          <Send />
          Send Reminder
        </button>
        <button onClick={() => setModal("document")} className="qa">
          <Upload />
          Add Document
        </button>
        <button onClick={() => setModal("reassign")} className="qa">
          <UserCheck />
          Reassign Owner
        </button>
        <button onClick={() => setModal("profile")} className="qa">
          <User />
          View Profile
        </button>
      </div>
    </div>
  );
}
function Workspace({ tab, selected, docs, feed, setModal, setDocsLive }: any) {
  if (tab === "Documents")
    return (
      <div className="pt-4">
        <DocumentsPanel
          docs={docs}
          setModal={setModal}
          setDocsLive={setDocsLive}
        />
      </div>
    );
  if (tab === "Activity")
    return (
      <div className="pt-4">
        <ActivityPanel feed={feed} selected={selected} setModal={setModal} />
      </div>
    );
  return (
    <div className="pt-4">
      <div className="rounded-[28px] border border-dashed border-violet-200 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-8">
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-violet-600 shadow-sm">
          <ClipboardCheck className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-black">{tab} workspace</h3>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
          Live execution space for {selected.title}. Manage ownership, due
          dates, audit trail, attachments, comments and escalations.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setModal(tab === "Notes" ? "note" : "timeline")}
            className="btn-primary"
          >
            Launch action <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => setModal("document")} className="btn-lite">
            <Paperclip className="h-4 w-4" />
            Attach
          </button>
        </div>
      </div>
    </div>
  );
}
function ExecutionModal({
  modal,
  selected,
  isPending,
  onClose,
  onCreateJourney,
  onCreateTask,
  onCreateDoc,
  onNote,
  onReassign,
}: any) {
  const [candidateName, setCandidateName] = useState(selected.title || "");
  const [position, setPosition] = useState(selected.position || "");
  const [department, setDepartment] = useState(
    selected.department || "Human Resources",
  );
  const [location, setLocation] = useState(
    selected.location || "Casablanca HQ",
  );
  const [employmentType, setEmploymentType] = useState(
    selected.employmentType || "Full Time",
  );
  const [owner, setOwner] = useState(selected.owner || "HR Team");
  const [manager, setManager] = useState(selected.manager || "Salma El Alami");
  const [stage, setStage] = useState(
    phases.includes(selected.status) ? selected.status : "Pre-Boarding",
  );
  const [priority, setPriority] = useState("Normal priority");
  const [due, setDue] = useState(new Date().toISOString().slice(0, 10));
  const [progress, setProgress] = useState(Number(selected.progress || 0));
  const [note, setNote] = useState("");
  const [risk, setRisk] = useState("");
  const [activePanel, setActivePanel] = useState<
    "stages" | "tasks" | "documents" | "automation" | "governance"
  >("stages");
  const [timelineDraft, setTimelineDraft] = useState("");
  const [evidenceOpen, setEvidenceOpen] = useState<string | null>(null);
  const [commentOpen, setCommentOpen] = useState<string | null>(null);
  const [escalationOpen, setEscalationOpen] = useState<string | null>(null);
  const [localEvents, setLocalEvents] = useState<Row[]>([]);
  const isTimeline = modal === "timeline";
  const isEdit = modal === "editJourney";
  const isJourney = modal === "journey";
  const isTask = modal === "task";
  const isDocument = modal === "document";
  const isReminder = modal === "reminder";
  const isReassign = modal === "reassign";
  const isProfile = modal === "profile";
  const isQuickAction = isDocument || isReminder || isReassign || isProfile;
  const title = isTimeline
    ? "Onboarding Timeline Control Room"
    : isEdit
      ? "Edit Current Onboarding Journey"
      : isJourney
        ? "Create Candidate Onboarding Journey"
        : isDocument
          ? "Add Onboarding Document"
          : isReminder
            ? "Send Onboarding Reminder"
            : isReassign
              ? "Reassign Onboarding Owner"
              : isProfile
                ? "Candidate / Employee Profile Control"
                : "Create Onboarding Task";
  const subtitle = isTimeline
    ? "Operate the same timeline used by the main onboarding journey: milestones, evidence, comments, escalations, owners, blockers and audit trail."
    : isEdit
      ? "Edit the selected journey using the exact stages, task groups, documents, owner model and progress logic used on the main onboarding page."
      : isJourney
        ? "Create a new journey from the same Angelcare onboarding lifecycle: offer, pre-boarding, documents, orientation, training, integration and probation."
        : isDocument
          ? "Upload or register a required onboarding document, link it to the selected journey, assign an owner, set evidence status and write to the activity trail."
          : isReminder
            ? "Send an operational reminder to the candidate, onboarding owner, manager or compliance team and record it in the onboarding activity feed."
            : isReassign
              ? "Move ownership with reason, SLA impact, manager visibility and audit log so the onboarding journey remains fully controlled."
              : isProfile
                ? "Preview the selected joiner profile, onboarding status, role, contact, manager, documents, risks and direct operational navigation."
                : "Create a task inside the same grouped task structure visible on the onboarding page.";

  const stageMeta = phases.map((p, i) => ({
    name: p,
    percent: Math.min(100, Math.round(((i + 1) / phases.length) * 100)),
    owner:
      i < 2
        ? owner
        : i === 2
          ? "HR Ops / Compliance"
          : i === 3
            ? manager
            : i === 4
              ? "IT + Training Team"
              : i === 5
                ? manager
                : "HR + Manager",
    docs:
      i === 0
        ? "Offer confirmation + contract intent"
        : i === 1
          ? "Welcome pack + start checklist"
          : i === 2
            ? "CIN, contract, diploma, emergency forms"
            : i === 3
              ? "Orientation agenda + first week plan"
              : i === 4
                ? "Access, equipment, training proof"
                : i === 5
                  ? "Team handoff + integration notes"
                  : "30/60/90 review evidence",
    tasks:
      i === 0
        ? 2
        : i === 1
          ? 4
          : i === 2
            ? 6
            : i === 3
              ? 3
              : i === 4
                ? 5
                : i === 5
                  ? 4
                  : 3,
  }));
  const selectedStageMeta =
    stageMeta.find((s) => s.name === stage) || stageMeta[1];
  const automationRules = [
    "Create audit activity instantly",
    "Notify onboarding owner",
    "Notify reporting manager",
    "Attach default document pack",
    "Generate first-week checklist",
    "Create compliance evidence trail",
    "Refresh dashboard widgets",
    "Keep candidate profile linked",
  ];
  const defaultDocs = [
    "CIN / Passport copy",
    "Employment contract",
    "CNSS / AMO details",
    "Diploma & certificates",
    "Emergency contact form",
    "Company policy acknowledgement",
  ];
  const defaultTasks = groups.flatMap(([group, items]) =>
    (items as string[]).map((title) => `${group} · ${title}`),
  );
  const timelineRows = stageMeta.map((m, i) => [
    m.name,
    progress >= m.percent
      ? "Completed"
      : stage === m.name
        ? "In Progress"
        : "Pending",
    `${m.docs}. Owner: ${m.owner}. ${m.tasks} operational tasks linked to this phase.`,
    m.owner,
    progress >= m.percent
      ? "Evidence ready"
      : stage === m.name
        ? "Active control"
        : "Waiting phase",
  ]);

  const reminderTemplates = [
    {
      id: "documents",
      label: "Documents manquants",
      tone: "Priorité conformité",
      stage: "Document Collection",
      message: `Bonjour ${candidateName || selected.title}, ici l’équipe RH Angelcare. Afin de finaliser votre intégration, merci de nous envoyer aujourd’hui les documents restants liés à votre dossier d’onboarding. En cas de difficulté, répondez directement à ce message. Merci.`
    },
    {
      id: "welcome",
      label: "Bienvenue & prochaines étapes",
      tone: "Accueil candidat",
      stage: "Pre-Boarding",
      message: `Bonjour ${candidateName || selected.title}, bienvenue chez Angelcare. Votre parcours d’intégration est en cours. Nous vous confirmerons les prochaines étapes, les documents requis et votre planning de démarrage. Merci de rester disponible sur WhatsApp.`
    },
    {
      id: "orientation",
      label: "Rappel orientation",
      tone: "Rendez-vous onboarding",
      stage: "Orientation",
      message: `Bonjour ${candidateName || selected.title}, nous vous rappelons votre session d’orientation Angelcare. Merci de confirmer votre disponibilité et d’arriver à l’heure prévue. L’équipe RH reste disponible pour toute question.`
    },
    {
      id: "training",
      label: "Formation & accès",
      tone: "Setup opérationnel",
      stage: "Training & Setup",
      message: `Bonjour ${candidateName || selected.title}, votre phase de formation et de configuration des accès est en cours. Merci de confirmer la réception de vos accès, supports et consignes de formation afin que nous puissions valider l’étape.`
    },
    {
      id: "probation",
      label: "Suivi période d’essai",
      tone: "Gouvernance RH",
      stage: "Probation & Review",
      message: `Bonjour ${candidateName || selected.title}, dans le cadre du suivi de votre intégration Angelcare, nous préparons votre point de période d’essai. Merci de partager tout retour, besoin d’accompagnement ou blocage avant notre échange.`
    },
    {
      id: "custom",
      label: "Message personnalisé",
      tone: "Libre",
      stage,
      message: note || `Bonjour ${candidateName || selected.title}, l’équipe RH Angelcare vous contacte concernant votre onboarding. Merci de revenir vers nous dès que possible.`
    },
  ];
  const [selectedReminderId, setSelectedReminderId] = useState("documents");
  const selectedReminder = reminderTemplates.find((template) => template.id === selectedReminderId) || reminderTemplates[0];
  const [whatsappMessage, setWhatsappMessage] = useState(selectedReminder.message);
  const candidatePhone = String(selected.phone || selected.mobile || selected.whatsapp || "+212 6 77 88 99 00");
  const normalizedWhatsappPhone = candidatePhone.replace(/[^0-9]/g, "").replace(/^0/, "212");
  const whatsappHref = `https://wa.me/${normalizedWhatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  function selectReminderTemplate(id: string) {
    const template = reminderTemplates.find((item) => item.id === id) || reminderTemplates[0];
    setSelectedReminderId(template.id);
    setStageAndProgress(template.stage);
    setWhatsappMessage(template.message);
    setNote(template.message);
    setPriority("Candidate");
  }

  function setStageAndProgress(next: string) {
    setStage(next);
    const meta = stageMeta.find((s) => s.name === next);
    if (meta) setProgress(meta.percent);
  }
  function pushEvent(title: string, body: string, type = "activity") {
    const event = {
      id: `local-event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      journey_id: selected.id,
      title,
      body,
      type,
      created_at: new Date().toISOString(),
    };
    setLocalEvents((e) => [event, ...e]);
    addOnboardingNote(event);
  }
  function save() {
    if (isJourney) {
      const j: Journey = {
        id: `local-${Date.now()}`,
        title: candidateName || "New Angelcare Joiner",
        position: position || "Role to define",
        status: stage,
        startDate: due,
        department,
        manager,
        location,
        employmentType,
        email: `${(candidateName || "new.joiner").toLowerCase().replace(/\s+/g, ".")}@angelcare.ma`,
        phone: "+212 6 00 00 00 00",
        progress: progress || selectedStageMeta.percent,
        owner,
      };
      createOnboardingJourney({
        ...j,
        candidate_name: j.title,
        job_title: j.position,
        priority,
        risk_notes: risk,
        launch_note: note,
        current_phase: stage,
        stage_pack: selectedStageMeta,
      });
      groups.forEach(([group, items], gi) =>
        (items as string[]).forEach((task, i) =>
          createOnboardingTask({
            journey_id: j.id,
            title: task,
            group,
            owner: gi < 2 ? owner : gi === 2 ? "IT Team" : "Training Team",
            priority: gi < 2 ? "High" : "Normal",
            status:
              gi === 0 && stageMeta.findIndex((x) => x.name === stage) > 1
                ? "Completed"
                : "Pending",
            due_at: due,
          }),
        ),
      );
      defaultDocs.forEach((doc, i) =>
        createOnboardingDocument({
          journey_id: j.id,
          title: doc,
          owner: i < 3 ? owner : "Compliance Team",
          status: i < 2 ? "Required" : "Pending",
        }),
      );
      addOnboardingNote({
        journey_id: j.id,
        title: "Journey launched from onboarding lifecycle modal",
        body: `${j.title} · ${stage} · ${progress || selectedStageMeta.percent}% · ${priority}`,
        type: "journey_create",
      });
      onCreateJourney(j);
      return;
    }
    if (isEdit) {
      updateOnboardingJourney(selected.id, {
        title: candidateName,
        position,
        status: stage,
        department,
        location,
        employment_type: employmentType,
        owner,
        manager,
        progress,
        risk_notes: risk,
        current_phase: stage,
        updated_at: new Date().toISOString(),
      });
      pushEvent(
        "Journey updated from lifecycle control",
        `${candidateName || selected.title} moved/control set to ${stage} · ${progress}% · owner ${owner} · manager ${manager}`,
        "journey_update",
      );
      onClose();
      return;
    }
    if (isDocument) {
      const doc = {
        id: `local-doc-${Date.now()}`,
        journey_id: selected.id,
        title: note || `${stage} document evidence`,
        owner,
        status: priority.includes("critical") ? "Compliance review" : "Uploaded",
        category: stage,
        due_at: due,
        comment: risk || "Document registered from onboarding quick action.",
      };
      createOnboardingDocument(doc);
      addOnboardingNote({
        journey_id: selected.id,
        title: "Document added from quick action",
        body: `${doc.title} · owner ${owner} · status ${doc.status}`,
        type: "document",
      });
      onCreateDoc(doc);
      return;
    }
    if (isReminder) {
      const reminder = {
        id: `local-reminder-${Date.now()}`,
        journey_id: selected.id,
        title: `WhatsApp · ${selectedReminder.label}`,
        body: whatsappMessage,
        target: "Candidate WhatsApp",
        channel: "whatsapp",
        phone: candidatePhone,
        wa_url: whatsappHref,
        stage,
        due_at: due,
        created_at: new Date().toISOString(),
      };
      createOnboardingReminder(reminder);
      onNote(reminder);
      window.open(whatsappHref, "_blank", "noopener,noreferrer");
      return;
    }
    if (isReassign) {
      reassignOnboardingOwner(selected.id, owner);
      addOnboardingNote({
        journey_id: selected.id,
        title: "Owner reassigned from quick action",
        body: `${selected.title} reassigned to ${owner}. Reason: ${risk || note || "Operational continuity"}`,
        type: "reassign",
      });
      onReassign(owner);
      return;
    }
    if (isProfile) {
      addOnboardingNote({
        journey_id: selected.id,
        title: "Profile reviewed from quick action",
        body: `${selected.title} profile opened and reviewed by onboarding operator.`,
        type: "profile_review",
      });
      window.location.href = `/hr/employees?search=${encodeURIComponent(selected.title)}`;
      return;
    }
    if (isTask) {
      const t = {
        id: `local-task-${Date.now()}`,
        journey_id: selected.id,
        group: stage,
        title: note || `${stage} execution task`,
        owner,
        priority,
        status: "Pending",
        due_at: due,
        comment: risk || "Created from the onboarding stage-aware task modal.",
      };
      createOnboardingTask(t);
      onCreateTask(t);
      return;
    }
    const n = {
      id: `local-timeline-${Date.now()}`,
      journey_id: selected.id,
      title: "Timeline note saved",
      body:
        timelineDraft || `Timeline checkpoint recorded for ${selected.title}`,
      type: "timeline_note",
      created_at: new Date().toISOString(),
    };
    addOnboardingNote(n);
    onNote(n);
  }
  function timelineAction(kind: string, milestone: string) {
    const label =
      kind === "evidence"
        ? "Evidence opened"
        : kind === "comment"
          ? "Comment added"
          : "Escalation launched";
    const body = `${milestone} · ${kind === "evidence" ? "Document pack, owner proof, files and compliance evidence reviewed." : kind === "comment" ? timelineDraft || "Operational comment captured and attached to this milestone." : "Escalation routed to owner, manager and compliance watchlist."}`;
    if (kind === "evidence") setEvidenceOpen(milestone);
    if (kind === "comment") setCommentOpen(milestone);
    if (kind === "escalate") setEscalationOpen(milestone);
    pushEvent(label, body, kind);
  }

  const modalIcon = isTimeline
    ? Activity
    : isEdit
      ? Edit3
      : isJourney
        ? Plus
        : isDocument
          ? Upload
          : isReminder
            ? Send
            : isReassign
              ? UserCheck
              : isProfile
                ? User
                : ClipboardCheck;
  const ModalIcon = modalIcon;

  return (
    <div className="fixed inset-x-0 bottom-0 top-[132px] z-[95] bg-slate-950/35 p-4 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[36px] border border-white/60 bg-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-white via-violet-50/70 to-cyan-50/80 p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-200">
              <ModalIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-black tracking-[0.25em] text-violet-600">
                ONBOARDING LIFECYCLE MODAL
              </div>
              <h2 className="text-2xl font-black tracking-tight">{title}</h2>
              <p className="max-w-4xl text-sm font-semibold text-slate-500">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-3 shadow-sm hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          {isTimeline ? (
            <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
              <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black">
                      Live Journey Timeline
                    </h3>
                    <p className="text-sm font-semibold text-slate-500">
                      Every row mirrors the main onboarding stages and writes to
                      the audit trail.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      pushEvent(
                        "Timeline synced",
                        "Manual timeline sync completed from control room.",
                        "sync",
                      )
                    }
                    className="btn-mini"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sync now
                  </button>
                </div>
                <div className="relative space-y-4 before:absolute before:left-5 before:top-3 before:h-[calc(100%-24px)] before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-violet-400 before:to-slate-200">
                  {timelineRows.map(
                    ([name, status, body, ownerName, signal], i) => (
                      <div
                        key={`${name}-${i}`}
                        className="relative flex gap-4 rounded-3xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-violet-200 hover:bg-white hover:shadow-md"
                      >
                        <div
                          className={cn(
                            "z-10 grid h-10 w-10 place-items-center rounded-2xl text-white shadow-sm",
                            status === "Completed"
                              ? "bg-emerald-500"
                              : status === "In Progress"
                                ? "bg-violet-600"
                                : "bg-slate-300",
                          )}
                        >
                          {status === "Completed" ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : status === "In Progress" ? (
                            <Zap className="h-5 w-5" />
                          ) : (
                            <Clock className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <b>{name}</b>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                              {status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {body}
                          </p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div className="rounded-2xl bg-white p-3 text-xs font-black text-slate-500">
                              Owner
                              <br />
                              <span className="text-slate-900">
                                {ownerName}
                              </span>
                            </div>
                            <div className="rounded-2xl bg-white p-3 text-xs font-black text-slate-500">
                              Evidence
                              <br />
                              <span className="text-slate-900">{signal}</span>
                            </div>
                            <div className="rounded-2xl bg-white p-3 text-xs font-black text-slate-500">
                              SLA
                              <br />
                              <span className="text-emerald-600">On track</span>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                timelineAction("evidence", String(name))
                              }
                              className="btn-mini"
                            >
                              <FileCheck2 className="h-3.5 w-3.5" />
                              Open evidence
                            </button>
                            <button
                              onClick={() =>
                                timelineAction("comment", String(name))
                              }
                              className="btn-mini"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Add comment
                            </button>
                            <button
                              onClick={() =>
                                timelineAction("escalate", String(name))
                              }
                              className="btn-mini"
                            >
                              <Bell className="h-3.5 w-3.5" />
                              Escalate
                            </button>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[32px] border border-violet-100 bg-violet-50 p-5">
                  <h3 className="font-black text-violet-900">
                    Timeline Health
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-black">
                    <div className="rounded-2xl bg-white p-4">
                      Progress
                      <br />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(Number(e.target.value))}
                        className="mt-2 w-full accent-violet-600"
                      />
                      <span className="text-2xl text-violet-700">
                        {progress}%
                      </span>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      Open risks
                      <br />
                      <span className="text-2xl text-orange-500">
                        {risk ? 1 : 0}
                      </span>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      Evidence
                      <br />
                      <span className="text-2xl text-cyan-600">
                        {evidenceOpen ? "Open" : "Ready"}
                      </span>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      SLA
                      <br />
                      <span className="text-2xl text-emerald-600">
                        On track
                      </span>
                    </div>
                  </div>
                </div>
                {(evidenceOpen || commentOpen || escalationOpen) && (
                  <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-black text-slate-900">
                      Active operational panel
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {evidenceOpen
                        ? `Evidence room for ${evidenceOpen}: documents, proof, contracts and compliance files.`
                        : commentOpen
                          ? `Comment thread for ${commentOpen}: decision notes, mentions and manager instruction.`
                          : `Escalation room for ${escalationOpen}: owner alert, risk reason, SLA and follow-up task.`}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEvidenceOpen(null);
                          setCommentOpen(null);
                          setEscalationOpen(null);
                        }}
                        className="btn-mini"
                      >
                        Close panel
                      </button>
                      <button
                        onClick={() =>
                          pushEvent(
                            "Panel action confirmed",
                            "Operational panel action confirmed and attached to the audit trail.",
                            "panel",
                          )
                        }
                        className="btn-mini"
                      >
                        Confirm action
                      </button>
                    </div>
                  </div>
                )}
                <textarea
                  value={timelineDraft}
                  onChange={(e) => setTimelineDraft(e.target.value)}
                  className="input min-h-44 w-full"
                  placeholder="Add timeline note, decision, blocker, manager instruction, mention, or compliance observation..."
                />
                <input
                  value={risk}
                  onChange={(e) => setRisk(e.target.value)}
                  className="input w-full"
                  placeholder="Risk / blocker / escalation reason"
                />
                <div className="rounded-[28px] border border-slate-200 bg-white p-4">
                  <div className="mb-3 text-sm font-black">
                    Live events from this session
                  </div>
                  {localEvents.length ? (
                    localEvents.slice(0, 5).map((e) => (
                      <div
                        key={e.id}
                        className="mb-2 rounded-2xl bg-slate-50 p-3 text-xs font-bold"
                      >
                        <b>{e.title}</b>
                        <br />
                        <span className="text-slate-500">{e.body}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-semibold text-slate-400">
                      No local actions yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : isQuickAction ? (
            <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-start gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                    {isDocument ? <Upload className="h-6 w-6" /> : isReminder ? <Send className="h-6 w-6" /> : isReassign ? <UserCheck className="h-6 w-6" /> : <User className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{title}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
                  </div>
                </div>
                {isProfile ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[["Name", selected.title], ["Role", selected.position], ["Department", selected.department], ["Manager", selected.manager], ["Owner", selected.owner], ["Location", selected.location], ["Employment type", selected.employmentType], ["Progress", `${selected.progress}%`]].map(([k,v]) => (
                      <div key={k} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold">
                        <span className="text-slate-400">{k}</span><br/><span className="text-slate-900">{v}</span>
                      </div>
                    ))}
                  </div>
                ) : isReminder ? (
                  <div className="space-y-5">
                    <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-black tracking-[0.22em] text-emerald-600">WHATSAPP CANDIDAT</div>
                          <h3 className="mt-1 text-2xl font-black text-slate-950">Rappels automatiques en français</h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500">Sélectionnez un scénario, vérifiez le message préinstallé, puis envoyez directement sur le numéro WhatsApp du candidat.</p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-right text-xs font-black text-slate-500 shadow-sm">
                          Mobile lié<br/><span className="text-base text-emerald-700">{candidatePhone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {reminderTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => selectReminderTemplate(template.id)}
                          className={cn(
                            "rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg",
                            selectedReminderId === template.id
                              ? "border-emerald-300 bg-emerald-50 shadow-emerald-100"
                              : "border-slate-200 bg-white hover:border-violet-200"
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-slate-950">{template.label}</span>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-emerald-700">{template.tone}</span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{template.message}</p>
                        </button>
                      ))}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <input className="input w-full" value={candidateName} onChange={(e)=>setCandidateName(e.target.value)} placeholder="Candidat" />
                      <input className="input w-full" value={candidatePhone} readOnly placeholder="Téléphone WhatsApp" />
                      <select className="input w-full" value={stage} onChange={(e)=>setStageAndProgress(e.target.value)}>{phases.map(p=><option key={p}>{p}</option>)}</select>
                      <input className="input w-full" type="date" value={due} onChange={(e)=>setDue(e.target.value)} />
                      <textarea className="input min-h-44 w-full md:col-span-2" value={whatsappMessage} onChange={(e)=>{setWhatsappMessage(e.target.value); setNote(e.target.value)}} />
                      <textarea className="input min-h-24 w-full md:col-span-2" value={risk} onChange={(e)=>setRisk(e.target.value)} placeholder="Note interne RH, risque, blocage ou consigne manager — non envoyée au candidat." />
                    </div>
                    <div className="rounded-[26px] border border-slate-200 bg-slate-950 p-4 text-sm font-bold text-white/80">
                      <div className="mb-2 flex items-center gap-2 text-white"><MessageCircle className="h-4 w-4 text-emerald-300" /> Aperçu action</div>
                      Le bouton d’envoi ouvre WhatsApp avec le message français déjà prérempli pour <b>{selected.title}</b>. L’action est aussi enregistrée dans l’activité onboarding avec numéro, étape, date, modèle et contenu envoyé.
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="input w-full" value={candidateName} onChange={(e)=>setCandidateName(e.target.value)} placeholder="Candidate / employee" />
                    <input className="input w-full" value={owner} onChange={(e)=>setOwner(e.target.value)} placeholder="Owner / assignee" />
                    <select className="input w-full" value={stage} onChange={(e)=>setStageAndProgress(e.target.value)}>{phases.map(p=><option key={p}>{p}</option>)}</select>
                    <input className="input w-full" type="date" value={due} onChange={(e)=>setDue(e.target.value)} />
                    <select className="input w-full" value={priority} onChange={(e)=>setPriority(e.target.value)}><option>Normal priority</option><option>High priority</option><option>Compliance critical</option><option>Executive escalation</option></select>
                    <input className="input w-full" value={manager} onChange={(e)=>setManager(e.target.value)} placeholder="Manager / validator" />
                    <textarea className="input min-h-36 w-full md:col-span-2" value={note} onChange={(e)=>setNote(e.target.value)} placeholder={isDocument ? "Document title, file reference, expiry date, validation notes..." : "Reassignment instruction, operational reason, handoff notes..."} />
                    <textarea className="input min-h-24 w-full md:col-span-2" value={risk} onChange={(e)=>setRisk(e.target.value)} placeholder="Risk, blocker, compliance observation, manager instruction or escalation note..." />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5">
                  <h3 className="font-black text-slate-900">Production execution checklist</h3>
                  <div className="mt-4 space-y-3">
                    {[
                      isDocument ? 'Attach document to selected onboarding journey' : isReminder ? 'Create reminder activity and notify target' : isReassign ? 'Update owner on the journey live' : 'Open synced employee profile workspace',
                      'Write immutable activity/audit trail',
                      'Refresh onboarding page state immediately',
                      'Keep candidate, owner, manager and stage linked',
                      'Preserve compliance evidence and SLA context',
                    ].map((x,i)=>(
                      <label key={x} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm font-black">
                        <input type="checkbox" defaultChecked className="h-4 w-4 accent-violet-600" /> {x}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-black">Selected onboarding context</h3>
                  <div className="mt-4 space-y-2 text-sm font-bold text-slate-500">
                    <p><b className="text-slate-900">{selected.title}</b> · {selected.position}</p>
                    <p>{selected.status} · {selected.progress}% complete · {selected.location}</p>
                    <p>Owner: {owner} · Manager: {manager}</p>
                    <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500" style={{width:`${Math.min(100, Math.max(0, progress))}%`}} /></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[.9fr_1.15fr_.95fr]">
              <div className="space-y-5">
                <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-1 text-lg font-black">
                    {isJourney
                      ? "Candidate from recruitment/onboarding"
                      : "Selected journey identity"}
                  </h3>
                  <p className="mb-4 text-sm font-semibold text-slate-500">
                    This uses the same person, role, manager, location and
                    status shown in the left onboarding profile panel.
                  </p>
                  <div className="space-y-3">
                    <input
                      className="input w-full"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="Candidate / employee name"
                    />
                    <input
                      className="input w-full"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="Position / role"
                    />
                    <input
                      className="input w-full"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Department"
                    />
                    <input
                      className="input w-full"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Location / branch"
                    />
                    <select
                      className="input w-full"
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                    >
                      <option>Full Time</option>
                      <option>Part Time</option>
                      <option>Internship</option>
                      <option>Contractor</option>
                      <option>Remote</option>
                      <option>Temporary reinforcement</option>
                    </select>
                    <input
                      className="input w-full"
                      type="date"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                    />
                  </div>
                </div>
                <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-lg font-black">Main page alignment</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-black">
                    <div className="rounded-2xl bg-white p-4">
                      Current stage
                      <br />
                      <span className="text-violet-700">{stage}</span>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      Progress
                      <br />
                      <span className="text-cyan-600">{progress}%</span>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      Owner
                      <br />
                      <span className="text-slate-900">{owner}</span>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      Manager
                      <br />
                      <span className="text-slate-900">{manager}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 shadow-sm">
                <h3 className="mb-1 text-lg font-black">
                  Seven-stage Onboarding Control
                </h3>
                <p className="mb-4 text-sm font-semibold text-slate-500">
                  Select the same lifecycle stage used in the page stepper.
                  Progress and task packs update from this selection.
                </p>
                <div className="mb-4 grid gap-2 md:grid-cols-2">
                  {stageMeta.map((m, i) => (
                    <button
                      key={m.name}
                      onClick={() => setStageAndProgress(m.name)}
                      className={cn(
                        "rounded-3xl border p-4 text-left transition",
                        stage === m.name
                          ? "border-violet-300 bg-white shadow-lg shadow-violet-100"
                          : "border-white bg-white/60 hover:border-violet-200 hover:bg-white",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <b className="text-sm">
                          {i + 1}. {m.name}
                        </b>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-black",
                            progress >= m.percent
                              ? "bg-emerald-50 text-emerald-700"
                              : stage === m.name
                                ? "bg-violet-50 text-violet-700"
                                : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {progress >= m.percent
                            ? "Completed"
                            : stage === m.name
                              ? "Active"
                              : "Pending"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {m.docs}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[11px] font-black text-slate-400">
                        <span>{m.owner}</span>
                        <span>{m.tasks} tasks</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  <input
                    className="input w-full"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Onboarding owner"
                  />
                  <input
                    className="input w-full"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    placeholder="Reporting manager"
                  />
                  <select
                    className="input w-full"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option>High priority</option>
                    <option>Normal priority</option>
                    <option>Compliance critical</option>
                    <option>Executive escalation</option>
                    <option>Urgent branch launch</option>
                  </select>
                  <label className="block rounded-2xl bg-white p-3 text-sm font-black">
                    Progress {progress}%
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      className="mt-2 w-full accent-violet-600"
                    />
                  </label>
                  <textarea
                    className="input min-h-24 w-full"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      isTask
                        ? "Task title / action to execute"
                        : "Journey note matching the selected onboarding stage..."
                    }
                  />
                  <textarea
                    className="input min-h-20 w-full"
                    value={risk}
                    onChange={(e) => setRisk(e.target.value)}
                    placeholder="Stage blockers, compliance risks, manager constraints, document gaps..."
                  />
                </div>
              </div>
              <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-lg font-black">
                  Stage-linked execution packs
                </h3>
                <p className="mb-4 text-sm font-semibold text-slate-500">
                  These controls mirror the page tabs: Tasks, Documents,
                  Timeline, Checklist, Notes and Activity.
                </p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(
                    [
                      "stages",
                      "tasks",
                      "documents",
                      "automation",
                      "governance",
                    ] as const
                  ).map((p) => (
                    <button
                      key={p}
                      onClick={() => setActivePanel(p)}
                      className={cn(
                        "rounded-2xl px-3 py-2 text-xs font-black",
                        activePanel === p
                          ? "bg-violet-600 text-white"
                          : "bg-slate-50 text-slate-500",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {(activePanel === "tasks"
                    ? defaultTasks
                    : activePanel === "documents"
                      ? defaultDocs
                      : activePanel === "automation"
                        ? automationRules
                        : activePanel === "governance"
                          ? [
                              "Owner SLA locked",
                              "Manager handoff required",
                              "Compliance evidence mandatory",
                              "Probation checkpoints created",
                              "Activity audit enabled",
                            ]
                          : phases
                  ).map((x, i) => (
                    <label
                      key={x}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm font-bold"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={
                          i < 4 ||
                          (activePanel === "stages" &&
                            progress >= ((i + 1) / phases.length) * 100)
                        }
                        className="h-4 w-4 accent-violet-600"
                      />
                      {x}
                    </label>
                  ))}
                </div>
                <div className="mt-4 rounded-3xl bg-slate-950 p-4 text-xs font-bold text-white/80">
                  <div className="mb-2 text-white">Live sync contract</div>Save
                  updates the selected journey, stage/progress, owner/manager,
                  task/document packs and activity trail used on the main
                  onboarding page.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />{" "}
            {isDocument
              ? "Document will be attached and logged live"
              : isReminder
                ? "WhatsApp reminder will open with French message and save activity"
                : isReassign
                  ? "Owner will be reassigned and audited"
                  : isProfile
                    ? "Profile workspace will open with selected person context"
                    : isJourney
                      ? "Create a journey aligned to the same onboarding stages"
                      : "Update the selected journey without changing the page model"}{" "}
            for {candidateName || selected.title}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-black hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              onClick={save}
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-black text-white shadow-lg shadow-violet-200"
            >
              {isTimeline
                ? "Save Timeline Note"
                : isDocument
                  ? "Add Document Live"
                  : isReminder
                    ? "Envoyer via WhatsApp"
                    : isReassign
                      ? "Reassign Owner Live"
                      : isProfile
                        ? "Open Profile"
                        : isEdit
                          ? "Save Stage-Aware Journey"
                          : isTask
                            ? "Create Task Live"
                            : "Create Stage-Aware Journey"}{" "}
              <CheckCircle2 className="ml-2 inline h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UiStyles() {
  return (
    <style>{`
.card{border:1px solid rgb(226 232 240 / .9);background:rgb(255 255 255 / .92);border-radius:28px;box-shadow:0 14px 34px rgb(15 23 42 / .06)}
.btn-lite{display:inline-flex;align-items:center;gap:.5rem;border:1px solid rgb(226 232 240);background:white;border-radius:1rem;padding:.75rem 1rem;font-size:.875rem;font-weight:900;box-shadow:0 1px 2px rgb(15 23 42 / .06)}
.btn-lite:hover{background:#f8fafc;transform:translateY(-1px)}
.btn-primary{display:inline-flex;align-items:center;gap:.5rem;border-radius:1rem;padding:.75rem 1rem;font-size:.875rem;font-weight:900;color:white;background:linear-gradient(90deg,#7c3aed,#06b6d4);box-shadow:0 16px 28px rgb(124 58 237 / .22)}
.btn-primary:hover{transform:translateY(-1px) scale(1.01)}
.btn-mini{display:inline-flex;align-items:center;gap:.35rem;border:1px solid rgb(226 232 240);border-radius:1rem;padding:.55rem .8rem;font-size:.75rem;font-weight:900;background:white}
.input{border:1px solid rgb(226 232 240);border-radius:1rem;padding:1rem;font-weight:700;outline:none;background:white}
.input:focus{border-color:#8b5cf6;box-shadow:0 0 0 4px rgb(139 92 246 / .12)}
.qa{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;border:1px solid rgb(226 232 240);border-radius:1rem;padding:1rem;background:white;color:#334155;min-height:86px}
.qa svg{height:1.25rem;width:1.25rem;color:#7c3aed}
.qa:hover{background:#f5f3ff;border-color:#ddd6fe;transform:translateY(-1px)}
`}</style>
  );
}
