import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Edit3,
  Eye,
  FileBadge2,
  FileText,
  Filter,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  MessageSquareText,
  Network,
  Phone,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserCheck,
  Users,
  Video,
  WalletCards,
  Workflow,
  X,
} from "lucide-react";
import { HR_TABLES, getHRDashboardData } from "@/lib/hr-production/repository";
import {
  addRecruitmentComment,
  createRecruitmentTask,
  deleteRecruitmentInterview,
  quickCandidateDecision,
  scheduleRecruitmentInterview,
} from "../_actions";

export const dynamic = "force-dynamic";

type Row = Record<string, any>;
type SearchParams = Record<string, string | string[] | undefined>;

const interviewTypes = [
  "Screening",
  "Technical",
  "HR Interview",
  "Assessment",
  "Final Interview",
  "Panel Interview",
];
const defaultInterviewers = [
  "Salma El Alami",
  "Ahmed Benali",
  "Imane Lahlou",
  "Youssef El Fassi",
  "Fatima Zahra Ait",
  "Omar Kabbaj",
];
const hours = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

const sidebarGroups = [
  {
    label: "Overview",
    items: [
      ["Dashboard", "/hr", LayoutDashboard],
      ["Analytics", "/hr/analytics", BarChart3],
      ["Reports", "/hr/reports", FileText],
      ["Alerts", "/hr/notifications", Bell],
    ],
  },
  {
    label: "People",
    items: [
      ["Employees", "/hr/employees", Users],
      ["Organization", "/hr/departments", Network],
      ["Teams & Departments", "/hr/departments", Building2],
      ["Positions & Roles", "/hr/positions", BriefcaseBusiness],
      ["Recruitment", "/hr/recruitment", UserCheck],
      ["Interviews", "/hr/recruitment/interviews", CalendarCheck],
      ["Onboarding", "/hr/onboarding", ClipboardCheck],
      ["Performance", "/hr/performance-matrix", Gauge],
      ["Learning & Development", "/hr/training", GraduationCap],
    ],
  },
  {
    label: "Operations",
    items: [
      ["Attendance", "/hr/attendance", CalendarCheck],
      ["Leave Management", "/hr/approvals", Clock3],
      ["Work Schedules", "/hr/rosters", Workflow],
      ["Time Tracking", "/hr/workforce-ops", Activity],
      ["Overtime & Approvals", "/hr/approvals", CheckCircle2],
    ],
  },
  {
    label: "Compensation & Benefits",
    items: [
      ["Payroll", "/hr/payroll", WalletCards],
      ["Compensation", "/hr/compensation", BadgeCheck],
      ["Benefits & Insurance", "/hr/benefits", ShieldCheck],
    ],
  },
  {
    label: "Compliance & Documents",
    items: [
      ["Policies & Procedures", "/hr/templates", ShieldCheck],
      ["Documents", "/hr/documents", FileBadge2],
      ["Compliance Dashboard", "/hr/compliance", AlertTriangle],
    ],
  },
  {
    label: "System",
    items: [
      ["Integrations", "/hr/sync-center", Sparkles],
      ["Settings", "/hr/settings", Settings],
      ["Access & Permissions", "/hr/permissions", ShieldCheck],
    ],
  },
] as const;

const text = (row: Row | undefined, keys: string[], fallback = "") => {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim()) return String(v);
  }
  return fallback;
};
const norm = (v: any) =>
  String(v || "")
    .toLowerCase()
    .trim();
const idOf = (row: Row) =>
  text(
    row,
    ["id", "candidate_id", "uuid"],
    text(row, ["full_name", "name"], "candidate"),
  );
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase() || "AC";
const pct = (a: number, b: number) =>
  `${Math.round((a / Math.max(1, b)) * 100)}%`;
const pad2 = (n: number) => String(n).padStart(2, "0");
const dateOnly = (value: any) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m?.[1]) return m[1];
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return raw.slice(0, 10);
};
const time24FromAny = (value: any, fallback = "09:00") => {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  const iso = raw.match(/T(\d{2}:\d{2})/) || raw.match(/\s(\d{2}:\d{2})/);
  if (iso?.[1]) return iso[1];
  if (/^\d{2}:\d{2}/.test(raw)) return raw.slice(0, 5);
  const m = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (m) {
    let h = Number(m[1]);
    const min = m[2] || "00";
    const ap = m[3].toUpperCase();
    if (ap === "PM" && h < 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    return `${pad2(h)}:${min}`;
  }
  return fallback;
};
const timeLabelFrom24 = (value: any) => {
  const t = time24FromAny(value, "09:00");
  const [hh, mm] = t.split(":").map(Number);
  const suffix = hh >= 12 ? "PM" : "AM";
  const hour = hh % 12 || 12;
  return `${hour}:${pad2(mm || 0)} ${suffix}`;
};
const interviewDateOf = (row: Row) =>
  dateOnly(text(row, ["interview_date", "interview_datetime", "scheduled_at"]));
const interviewTime24Of = (row: Row) =>
  time24FromAny(
    text(row, ["interview_time", "scheduled_time"]) ||
      text(row, ["interview_datetime", "scheduled_at", "interview_date"]),
    "09:00",
  );
const interviewTimeLabel = (row: Row) => timeLabelFrom24(interviewTime24Of(row));
const hourKeyFrom24 = (value: any) => {
  const [hh] = time24FromAny(value, "09:00").split(":").map(Number);
  const suffix = hh >= 12 ? "PM" : "AM";
  const hour = hh % 12 || 12;
  return `${hour}:00 ${suffix}`;
};
const hourKeyForInterview = (row: Row) => hourKeyFrom24(interviewTime24Of(row));

const toDateTimeLocal = (isoDate: string, hour: string) => {
  return `${isoDate}T${time24FromAny(hour, "09:00")}`;
};
const encodeQ = (v: string) => encodeURIComponent(v);

const addDays = (iso: string, amount: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + amount);
  return d.toISOString().slice(0, 10);
};
const longDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
const monthLabel = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
const isInterview = (row: Row) =>
  Boolean(text(row, ["interview_date"])) ||
  ["interview", "assessment", "offer"].some((s) =>
    norm(text(row, ["pipeline_stage", "stage"])).includes(s),
  );
const stageOf = (row: Row) =>
  text(
    row,
    ["source", "interview_type", "pipeline_stage", "stage"],
    "HR Interview",
  );
const interviewerOf = (row: Row, fallbackIndex = 0) =>
  text(
    row,
    ["owner", "interviewer", "recruiter", "assigned_to"],
    defaultInterviewers[fallbackIndex % defaultInterviewers.length],
  );
const typeClass = (type: string) => {
  const t = norm(type);
  if (t.includes("technical"))
    return "border-blue-200 bg-blue-50 text-blue-700 shadow-blue-100";
  if (t.includes("final"))
    return "border-rose-200 bg-rose-50 text-rose-700 shadow-rose-100";
  if (t.includes("assessment"))
    return "border-orange-200 bg-orange-50 text-orange-700 shadow-orange-100";
  if (t.includes("screen"))
    return "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-100";
  if (t.includes("panel"))
    return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 shadow-fuchsia-100";
  return "border-violet-200 bg-violet-50 text-violet-700 shadow-violet-100";
};
const dotClass = (type: string) => {
  const t = norm(type);
  if (t.includes("technical")) return "bg-blue-500";
  if (t.includes("final")) return "bg-rose-500";
  if (t.includes("assessment")) return "bg-orange-500";
  if (t.includes("screen")) return "bg-emerald-500";
  if (t.includes("panel")) return "bg-fuchsia-500";
  return "bg-violet-500";
};

function Stat({ icon: Icon, label, value, note, tone = "violet" }: any) {
  const tones: Row = {
    violet: "from-violet-50 to-white text-violet-600",
    emerald: "from-emerald-50 to-white text-emerald-600",
    blue: "from-blue-50 to-white text-blue-600",
    orange: "from-orange-50 to-white text-orange-600",
    rose: "from-rose-50 to-white text-rose-600",
  };
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br ${tones[tone] || tones.violet}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-black text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-xs font-bold text-emerald-600">{note}</p>
        </div>
      </div>
    </section>
  );
}
function Card({ title, subtitle, action, children, className = "" }: any) {
  return (
    <section
      className={`rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-950">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-xs font-bold text-slate-500">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
function Input(props: any) {
  return (
    <input
      {...props}
      className={`h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${props.className || ""}`}
    />
  );
}
function Select(props: any) {
  return (
    <select
      {...props}
      className={`h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${props.className || ""}`}
    >
      {props.children}
    </select>
  );
}
function Textarea(props: any) {
  return (
    <textarea
      {...props}
      className={`rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${props.className || ""}`}
    />
  );
}

function MiniCalendar({
  selectedDate,
  activeDates,
}: {
  selectedDate: string;
  activeDates: Set<string>;
}) {
  const d = new Date(`${selectedDate}T12:00:00`);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const firstDay = start.getDay();
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  return (
    <Card
      title={monthLabel(selectedDate)}
      subtitle="Click a date to load that day's agenda"
      action={
        <div className="flex gap-2">
          <Link
            href={`/hr/recruitment/interviews?date=${addDays(selectedDate, -30)}`}
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/hr/recruitment/interviews?date=${addDays(selectedDate, 30)}`}
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black text-slate-400">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <span key={`blank-${idx}`} />;
          const iso = `${selectedDate.slice(0, 8)}${String(day).padStart(2, "0")}`;
          const selected = iso === selectedDate;
          const has = activeDates.has(iso);
          return (
            <Link
              key={iso}
              href={`/hr/recruitment/interviews?date=${iso}`}
              className={`relative grid h-9 place-items-center rounded-xl text-xs font-black transition ${selected ? "bg-violet-600 text-white shadow-lg shadow-violet-200" : has ? "bg-violet-50 text-violet-700 hover:bg-violet-100" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {day}
              {has && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${selected ? "bg-white" : "bg-violet-500"}`}
                />
              )}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function ScheduleModal({
  candidates,
  open,
  edit,
  defaultDate,
  defaultHour,
  defaultInterviewer,
}: {
  candidates: Row[];
  open: boolean;
  edit?: Row;
  defaultDate: string;
  defaultHour: string;
  defaultInterviewer: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[99999] grid place-items-center overflow-y-auto bg-slate-950/70 px-4 py-8 backdrop-blur-xl">
      <div className="w-full max-w-7xl overflow-hidden rounded-[38px] border border-white/70 bg-white shadow-[0_40px_120px_rgba(15,23,42,.35)]">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-7 py-5 backdrop-blur-xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />{" "}
              {edit ? "Edit synced interview" : "Live interview orchestration"}
            </div>
            <p className="mt-3 text-2xl font-black text-slate-950">
              {edit ? "Edit Interview" : "Create Interview"}
            </p>
            <p className="text-sm font-bold text-slate-500">
              Candidate, slot, interviewer, room, tasks, comments and
              candidate-stage sync in one production modal. Clicked calendar
              slots are prefilled automatically.
            </p>
          </div>
          <Link
            href="/hr/recruitment/interviews"
            className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
        <div className="max-h-[calc(100vh-11rem)] overflow-y-auto p-7">
          <form
            action={scheduleRecruitmentInterview}
            className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]"
          >
            <input
              type="hidden"
              name="candidate_id"
              value={text(edit, ["id"])}
            />
            <input type="hidden" name="selected_date" value={defaultDate} />
            <input type="hidden" name="selected_time" value={defaultHour} />
            <input type="hidden" name="selected_interviewer" value={defaultInterviewer} />
            <section className="rounded-[30px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-sm">
              <h4 className="text-base font-black text-slate-950">
                Candidate & schedule
              </h4>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Choose an existing candidate or fill new details.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-violet-100 bg-white/80 p-3 text-xs font-black text-violet-700">
                <CalendarCheck className="h-4 w-4" /> Selected slot:{" "}
                {longDate(defaultDate)} • {defaultHour} •{" "}
                {defaultInterviewer || "Lead interviewer"}
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {!edit && (
                  <Select name="candidate_id">
                    <option value="">New candidate or choose existing</option>
                    {candidates.map((c) => (
                      <option key={idOf(c)} value={text(c, ["id"])}>
                        {text(
                          c,
                          ["full_name", "name", "candidate_name"],
                          "Candidate",
                        )}
                      </option>
                    ))}
                  </Select>
                )}
                <Input
                  name="full_name"
                  placeholder="Candidate full name"
                  defaultValue={text(edit, ["full_name", "name"])}
                />
                <Input
                  name="desired_position"
                  required
                  placeholder="Role / position"
                  defaultValue={text(edit, [
                    "desired_position",
                    "job_title",
                    "position",
                  ])}
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="candidate@email.com"
                  defaultValue={text(edit, ["email"])}
                />
                <Input
                  name="phone"
                  placeholder="+212 ..."
                  defaultValue={text(edit, ["phone"])}
                />
                <Input
                  name="city"
                  placeholder="Casablanca, Rabat, Remote..."
                  defaultValue={text(edit, ["city", "location"])}
                />
                <Input
                  name="interview_date"
                  required
                  type="datetime-local"
                  defaultValue={
                    edit
                      ? `${interviewDateOf(edit) || defaultDate}T${interviewTime24Of(edit)}`
                      : toDateTimeLocal(defaultDate, defaultHour)
                  }
                />
                <Select
                  name="interview_type"
                  defaultValue={stageOf(edit || {})}
                >
                  {interviewTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
                <Input
                  name="owner"
                  placeholder="Lead interviewer"
                  defaultValue={
                    edit ? interviewerOf(edit, 0) : defaultInterviewer
                  }
                />
                <Input
                  name="meeting_url"
                  placeholder="Google Meet / Zoom / Teams link"
                  defaultValue={text(edit, ["meeting_url", "video_url"])}
                />
                <Select name="priority">
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                  <option value="urgent">Urgent priority</option>
                </Select>
                <Select name="pipeline_stage" defaultValue="interview">
                  <option value="interview">Move candidate to Interview</option>
                  <option value="assessment">
                    Move candidate to Assessment
                  </option>
                  <option value="offer">Move candidate to Offer</option>
                </Select>
              </div>
            </section>
            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-base font-black text-slate-950">
                Execution controls
              </h4>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Every control writes useful HR execution data.
              </p>
              <div className="mt-5 grid gap-4">
                <Input
                  name="score"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Target score / readiness"
                  defaultValue={text(edit, ["score"])}
                />
                <Input
                  name="expected_salary"
                  type="number"
                  placeholder="Expected salary MAD"
                  defaultValue={text(edit, ["expected_salary"])}
                />
                <Input
                  name="task_title"
                  placeholder="Preparation task title"
                  defaultValue={`Prepare interview scorecard for ${text(edit, ["full_name", "name"], "candidate")}`}
                />
                <Select
                  name="decision"
                  defaultValue={text(edit, ["decision"], "pending")}
                >
                  <option value="pending">Pending decision</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="on_hold">On hold</option>
                  <option value="rejected">Rejected after interview</option>
                </Select>
              </div>
            </section>
            <section className="rounded-[30px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-violet-600" />
                <h4 className="text-base font-black text-slate-950">
                  Interview plan
                </h4>
              </div>
              <Textarea
                name="notes"
                rows={8}
                defaultValue={text(
                  edit,
                  ["notes"],
                  "Score competencies, culture fit, availability, salary expectation, and operational readiness.",
                )}
              />
            </section>
            <section className="rounded-[30px] border border-violet-100 bg-violet-50/60 p-5">
              <h4 className="text-base font-black text-slate-950">
                Live sync actions
              </h4>
              <div className="mt-4 grid gap-3">
                {[
                  "Create preparation task",
                  "Add candidate activity comment",
                  "Refresh recruitment analytics",
                ].map((x) => (
                  <div
                    key={x}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm font-black text-slate-700"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {x}
                  </div>
                ))}
              </div>
            </section>
            <div className="xl:col-span-2 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
              <Link
                href="/hr/recruitment/interviews"
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black"
              >
                Cancel
              </Link>
              <button className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-200">
                Save & Sync Interview
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ interview }: { interview?: Row }) {
  if (!interview) return null;
  const id = idOf(interview);
  return (
    <div className="fixed inset-0 z-[99998] grid place-items-center overflow-y-auto bg-slate-950/70 px-4 py-8 backdrop-blur-xl">
      <div className="w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/70 bg-white shadow-[0_40px_120px_rgba(15,23,42,.35)]">
        <div className="flex items-start justify-between gap-6 border-b border-slate-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-7">
          <div className="flex gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-violet-600 text-lg font-black text-white shadow-lg shadow-violet-200">
              {initials(text(interview, ["full_name", "name"], "AC"))}
            </div>
            <div>
              <p className="text-2xl font-black text-slate-950">
                {text(interview, ["full_name", "name"], "Candidate")}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-500">
                {text(
                  interview,
                  ["desired_position", "job_title", "position"],
                  "Candidate role",
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black ${typeClass(stageOf(interview))}`}
                >
                  {stageOf(interview)}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                  <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                  {interviewTimeLabel(interview)}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                  <MapPin className="mr-1 inline h-3.5 w-3.5" />
                  {text(interview, ["city", "location"], "Morocco")}
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/hr/recruitment/interviews"
            className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
        <div className="grid gap-5 p-7 lg:grid-cols-[1.2fr_.8fr]">
          <Card
            title="Interview intelligence"
            subtitle="Live details from candidate record"
          >
            <div className="grid gap-3 md:grid-cols-2">
              {[
                [
                  "Date",
                  longDate(
                    interviewDateOf(interview) ||
                      new Date().toISOString().slice(0, 10),
                  ),
                ],
                ["Lead interviewer", interviewerOf(interview)],
                ["Email", text(interview, ["email"], "Not provided")],
                ["Phone", text(interview, ["phone"], "Not provided")],
                ["Decision", text(interview, ["decision"], "Pending")],
                ["Score", text(interview, ["score"], "0")],
              ].map(([a, b]) => (
                <div key={a} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase text-slate-400">
                    {a}
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-800">{b}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm font-bold leading-6 text-slate-600">
              {text(
                interview,
                ["notes"],
                "No detailed notes yet. Add plan, feedback, risks and next steps through the edit modal.",
              )}
            </p>
          </Card>
          <Card
            title="Execution actions"
            subtitle="Edit and delete are synced live"
          >
            <div className="grid gap-3">
              <Link
                href={`/hr/recruitment/interviews?edit=${id}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-200"
              >
                <Edit3 className="h-4 w-4" />
                Edit Interview
              </Link>
              <form action={deleteRecruitmentInterview}>
                <input type="hidden" name="candidate_id" value={id} />
                <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-black text-rose-700">
                  <Trash2 className="h-4 w-4" />
                  Delete Interview
                </button>
              </form>
              <a
                href={text(interview, ["meeting_url", "video_url"], "#")}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-4 text-sm font-black text-slate-700"
              >
                <Video className="h-4 w-4" />
                Join Meeting
              </a>
            </div>
          </Card>
          <Card title="Candidate tasks" subtitle="Create a follow-up task">
            <form action={createRecruitmentTask} className="grid gap-3">
              <input type="hidden" name="related_record_id" value={id} />
              <Input
                name="title"
                placeholder="Task title"
                defaultValue={`Follow up with ${text(interview, ["full_name", "name"], "candidate")}`}
              />
              <Select name="priority">
                <option>high</option>
                <option>medium</option>
                <option>urgent</option>
              </Select>
              <Input
                name="owner"
                placeholder="Owner"
                defaultValue={interviewerOf(interview)}
              />
              <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                Create Task
              </button>
            </form>
          </Card>
          <Card title="Candidate comments" subtitle="Add a live activity note">
            <form action={addRecruitmentComment} className="grid gap-3">
              <input
                type="hidden"
                name="source_table"
                value={HR_TABLES.candidates}
              />
              <input type="hidden" name="record_id" value={id} />
              <Textarea
                name="comment"
                rows={4}
                placeholder="Add internal comment, feedback, concern, or next step..."
              />
              <button className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white">
                Add Comment
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function RecruitmentInterviewsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = await Promise.resolve(searchParams || {});
  const data: Row = await getHRDashboardData();
  const candidates: Row[] = Array.isArray(data.candidates)
    ? data.candidates
    : [];
  const interviewCandidates = candidates.filter(isInterview);
  const activeDates = new Set(
    interviewCandidates
      .map((c) => interviewDateOf(c))
      .filter(Boolean),
  );
  const selectedDate =
    String(sp.date || "") ||
    Array.from(activeDates).sort()[0] ||
    new Date().toISOString().slice(0, 10);
  const dayInterviews = interviewCandidates.filter(
    (c) => interviewDateOf(c) === selectedDate,
  );
  const selectedId = String(sp.interview || "");
  const editId = String(sp.edit || "");
  const preview = interviewCandidates.find((c) => idOf(c) === selectedId);
  const edit = interviewCandidates.find((c) => idOf(c) === editId);
  const requestedHour = String(sp.hour || "9:00 AM");
  const requestedInterviewer = String(sp.interviewer || "");
  const openSchedule = Boolean(sp.schedule) || Boolean(edit);
  const interviewers = Array.from(
    new Set([
      ...defaultInterviewers,
      ...dayInterviews.map((c, i) => interviewerOf(c, i)),
    ]),
  ).slice(0, 6);
  const byHourAndInterviewer = (hour: string, interviewer: string) =>
    dayInterviews.filter(
      (c, i) =>
        hourKeyForInterview(c) === hour &&
        interviewerOf(c, i) === interviewer,
    );
  const counts = interviewTypes.map((t) => ({
    label: t,
    value: interviewCandidates.filter(
      (c) =>
        norm(stageOf(c)).includes(norm(t)) ||
        norm(text(c, ["source"])).includes(norm(t)),
    ).length,
  }));
  const upcoming = interviewCandidates
    .filter((c) => interviewDateOf(c) >= selectedDate)
    .sort((a, b) =>
      `${interviewDateOf(a)}T${interviewTime24Of(a)}`.localeCompare(
        `${interviewDateOf(b)}T${interviewTime24Of(b)}`,
      ),
    );

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <ScheduleModal
        candidates={candidates}
        open={openSchedule}
        edit={edit}
        defaultDate={selectedDate}
        defaultHour={requestedHour}
        defaultInterviewer={requestedInterviewer}
      />
      <PreviewModal interview={preview} />
      <div className="grid lg:grid-cols-[280px_1fr]">
        <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-slate-200 bg-white p-4 lg:block">
          <Link
            href="/hr"
            className="mb-4 flex items-center gap-3 rounded-3xl bg-gradient-to-br from-violet-50 to-white p-4"
          >
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black">Angelcare HR</p>
              <p className="text-[11px] font-bold text-slate-500">
                Unified workspace
              </p>
            </div>
          </Link>
          <div className="space-y-5">
            {sidebarGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[.16em] text-slate-400">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map(([label, href, Icon]: any) => (
                    <Link
                      key={`${group.label}-${label}`}
                      href={href}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold ${href === "/hr/recruitment/interviews" ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
        <main className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight">
                  Interview Calendar
                </h1>
                <p className="text-sm font-bold text-slate-500">
                  Live agenda, date navigation, preview/edit/delete, and
                  candidate sync.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="hidden h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm md:flex">
                  <Search className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400">
                    Search interviews, candidates, interviewers...
                  </span>
                </div>
                <Link
                  href="/hr/recruitment"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black"
                >
                  Candidates
                </Link>
                <Link
                  href={`/hr/recruitment/interviews?date=${selectedDate}&schedule=1`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200"
                >
                  <Plus className="h-4 w-4" />
                  Schedule Interview
                </Link>
              </div>
            </div>
          </header>
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <Stat
                icon={CalendarDays}
                label="Selected Date"
                value={dayInterviews.length}
                note={longDate(selectedDate)}
                tone="violet"
              />
              <Stat
                icon={CalendarCheck}
                label="All Interviews"
                value={interviewCandidates.length}
                note="Synced candidates"
                tone="emerald"
              />
              <Stat
                icon={CheckCircle2}
                label="Completed"
                value={
                  interviewCandidates.filter((c) =>
                    norm(text(c, ["decision"])).includes("short"),
                  ).length
                }
                note="From decisions"
                tone="blue"
              />
              <Stat
                icon={Clock3}
                label="To Be Scheduled"
                value={
                  candidates.filter(
                    (c) =>
                      !interviewDateOf(c) &&
                      norm(text(c, ["pipeline_stage"])).includes("interview"),
                  ).length
                }
                note="Need date"
                tone="orange"
              />
              <Stat
                icon={MessageSquareText}
                label="Feedback Due"
                value={upcoming.length}
                note="Open follow-ups"
                tone="rose"
              />
              <Stat
                icon={Target}
                label="Success Rate"
                value={pct(
                  interviewCandidates.filter((c) =>
                    ["shortlisted", "hired"].includes(
                      norm(text(c, ["decision"])),
                    ),
                  ).length,
                  interviewCandidates.length,
                )}
                note="Live conversion"
                tone="violet"
              />
            </div>
            <div className="mt-6 grid gap-5 xl:grid-cols-[280px_1fr_340px]">
              <aside className="space-y-5">
                <MiniCalendar
                  selectedDate={selectedDate}
                  activeDates={activeDates}
                />
                <Card title="Interviewers" subtitle="Filter-ready roster">
                  <div className="space-y-3">
                    {interviewers.map((name) => (
                      <div
                        key={name}
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-xs font-black text-violet-700 shadow-sm">
                          {initials(name)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">
                            {name}
                          </p>
                          <p className="text-[11px] font-bold text-slate-500">
                            Interviewer
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card title="Interview Types" subtitle="Color indicators">
                  <div className="space-y-2">
                    {interviewTypes.map((type) => (
                      <div
                        key={type}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-xs font-black"
                      >
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${dotClass(type)}`}
                          />
                          {type}
                        </span>
                        <span>
                          {counts.find((c) => c.label === type)?.value || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </aside>
              <section
                id="calendar"
                className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/hr/recruitment/interviews?date=${addDays(selectedDate, -1)}`}
                      className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black">
                      {longDate(selectedDate)}
                    </div>
                    <Link
                      href={`/hr/recruitment/interviews?date=${addDays(selectedDate, 1)}`}
                      className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/hr/recruitment/interviews?date=${new Date().toISOString().slice(0, 10)}`}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black"
                    >
                      Today
                    </Link>
                    <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black">
                      <Filter className="h-4 w-4" />
                      View Options
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <div
                    className="min-w-[1040px] grid"
                    style={{
                      gridTemplateColumns: `90px repeat(${interviewers.length}, minmax(150px,1fr))`,
                    }}
                  >
                    <div className="border-b border-r border-slate-100 bg-slate-50 p-4 text-xs font-black text-slate-600">
                      GMT+1
                    </div>
                    {interviewers.map((name) => (
                      <div
                        key={`head-${name}`}
                        className="border-b border-r border-slate-100 bg-slate-50 p-4"
                      >
                        <p className="text-sm font-black text-slate-700">
                          {name}
                        </p>
                        <p className="text-xs font-bold text-slate-500">
                          Interviewer
                        </p>
                      </div>
                    ))}
                    {hours.flatMap((hour) => [
                      <div
                        key={`${hour}-time`}
                        className="min-h-[128px] border-b border-r border-slate-100 bg-gradient-to-b from-white to-slate-50/60 p-4 text-sm font-black text-slate-500"
                      >
                        {hour}
                      </div>,
                      ...interviewers.map((name) => {
                        const slotInterviews = byHourAndInterviewer(hour, name);
                        return (
                          <div
                            key={`${hour}-${name}`}
                            className="group relative min-h-[128px] border-b border-r border-slate-100 bg-white p-2 transition hover:bg-violet-50/40"
                          >
                            <Link
                              href={`/hr/recruitment/interviews?date=${selectedDate}&schedule=1&hour=${encodeQ(hour)}&interviewer=${encodeQ(name)}`}
                              className="absolute inset-2 z-0 grid place-items-center rounded-3xl border border-dashed border-transparent text-xs font-black text-transparent transition group-hover:border-violet-200 group-hover:bg-white/70 group-hover:text-violet-600"
                            >
                              <span className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-3 py-2 text-white shadow-lg shadow-violet-200">
                                <Plus className="h-3.5 w-3.5" /> Add interview
                              </span>
                            </Link>
                            <div className="relative z-10 space-y-2 pointer-events-none">
                              {slotInterviews.map((interview) => {
                                const type = stageOf(interview);
                                return (
                                  <Link
                                    key={idOf(interview)}
                                    href={`/hr/recruitment/interviews?date=${selectedDate}&interview=${idOf(interview)}`}
                                    className={`pointer-events-auto block rounded-2xl border p-3 shadow-md transition hover:-translate-y-0.5 hover:shadow-xl ${typeClass(type)}`}
                                  >
                                    <div className="mb-2 flex items-center justify-between">
                                      <span className="inline-flex items-center gap-1 text-[11px] font-black">
                                        <Clock3 className="h-3 w-3" />
                                        {interviewTimeLabel(interview)}
                                      </span>
                                      <Eye className="h-3.5 w-3.5" />
                                    </div>
                                    <p className="text-sm font-black uppercase leading-4">
                                      {text(
                                        interview,
                                        ["full_name", "name"],
                                        "Candidate",
                                      )}
                                    </p>
                                    <p className="mt-1 text-[11px] font-bold uppercase opacity-80">
                                      {text(
                                        interview,
                                        ["desired_position", "position"],
                                        "Role",
                                      )}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <span className="rounded-xl bg-white/70 px-2 py-1 text-[10px] font-black">
                                        Preview
                                      </span>
                                      <span className="rounded-xl bg-white/70 px-2 py-1 text-[10px] font-black">
                                        Edit
                                      </span>
                                      <span className="rounded-xl bg-white/70 px-2 py-1 text-[10px] font-black">
                                        Live
                                      </span>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }),
                    ])}
                    {dayInterviews.length === 0 && (
                      <div className="col-span-7 p-10 text-center">
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-50 text-slate-400">
                          <CalendarCheck className="h-7 w-7" />
                        </div>
                        <p className="mt-4 text-lg font-black text-slate-800">
                          No interviews on this date
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          Choose another date from the calendar or schedule a
                          new interview.
                        </p>
                        <Link
                          href={`/hr/recruitment/interviews?schedule=1&date=${selectedDate}`}
                          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white"
                        >
                          <Plus className="h-4 w-4" />
                          Schedule Interview
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </section>
              <aside className="space-y-5">
                <Card
                  title="Selected Day Agenda"
                  subtitle={`${dayInterviews.length} interview(s) on ${selectedDate}`}
                >
                  <div className="space-y-3">
                    {dayInterviews.map((c, i) => (
                      <Link
                        key={`agenda-${idOf(c)}`}
                        href={`/hr/recruitment/interviews?date=${selectedDate}&interview=${idOf(c)}`}
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 hover:bg-violet-50"
                      >
                        <div
                          className={`h-3 w-3 rounded-full ${dotClass(stageOf(c))}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black">
                            {text(c, ["full_name", "name"], "Candidate")}
                          </p>
                          <p className="text-xs font-bold text-slate-500">
                            {interviewTimeLabel(c)} •{" "}
                            {interviewerOf(c, i)}
                          </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-slate-400" />
                      </Link>
                    ))}
                    {dayInterviews.length === 0 && (
                      <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                        No agenda items for this day.
                      </p>
                    )}
                  </div>
                </Card>
                <Card title="Upcoming Interview" subtitle="Next live session">
                  {upcoming[0] ? (
                    <div className="rounded-3xl bg-gradient-to-br from-violet-50 to-white p-4">
                      <p className="text-xs font-black text-violet-600">
                        {longDate(
                          interviewDateOf(upcoming[0]) ||
                            selectedDate,
                        )}
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-sm font-black shadow-sm">
                          {initials(
                            text(upcoming[0], ["full_name", "name"], "AC"),
                          )}
                        </div>
                        <div>
                          <p className="font-black">
                            {text(
                              upcoming[0],
                              ["full_name", "name"],
                              "Candidate",
                            )}
                          </p>
                          <p className="text-xs font-bold text-slate-500">
                            {text(
                              upcoming[0],
                              ["desired_position", "position"],
                              "Candidate",
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <a
                          href={text(
                            upcoming[0],
                            ["meeting_url", "video_url"],
                            "#calendar",
                          )}
                          className="rounded-2xl bg-violet-600 px-4 py-3 text-center text-xs font-black text-white"
                        >
                          <Video className="mr-1 inline h-4 w-4" />
                          Join
                        </a>
                        <Link
                          href={`/hr/recruitment/interviews?date=${interviewDateOf(upcoming[0])}&interview=${idOf(upcoming[0])}`}
                          className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-xs font-black"
                        >
                          Preview
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                      No interview dates found.
                    </p>
                  )}
                </Card>
                <Card title="Quick Actions" subtitle="Active controls">
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href={`/hr/recruitment/interviews?date=${selectedDate}&schedule=1`}
                      className="rounded-2xl border border-slate-200 p-3 text-center text-xs font-black hover:bg-violet-50"
                    >
                      <Plus className="mx-auto mb-1 h-4 w-4" />
                      Schedule
                    </Link>
                    <Link
                      href="/hr/recruitment"
                      className="rounded-2xl border border-slate-200 p-3 text-center text-xs font-black hover:bg-violet-50"
                    >
                      <Users className="mx-auto mb-1 h-4 w-4" />
                      Candidates
                    </Link>
                    <a
                      href="#calendar"
                      className="rounded-2xl border border-slate-200 p-3 text-center text-xs font-black hover:bg-violet-50"
                    >
                      <CalendarDays className="mx-auto mb-1 h-4 w-4" />
                      Calendar
                    </a>
                    <Link
                      href="/hr/recruitment?create=1"
                      className="rounded-2xl border border-slate-200 p-3 text-center text-xs font-black hover:bg-violet-50"
                    >
                      <BriefcaseBusiness className="mx-auto mb-1 h-4 w-4" />
                      Requisition
                    </Link>
                  </div>
                </Card>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
