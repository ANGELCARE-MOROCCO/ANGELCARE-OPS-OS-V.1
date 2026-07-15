import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileBadge2,
  FileText,
  Filter,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  Network,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UserCheck,
  Users,
  WalletCards,
  Workflow,
  X,
} from "lucide-react";
import { createHrRecord, advanceHrStatus } from "../_lib/actions";
import {
  addRecruitmentComment,
  createRecruitmentTask,
  scheduleRecruitmentInterview,
} from "./_actions";
import { HR_TABLES, getHRDashboardData } from "@/lib/hr-production/repository";
import HRModuleCommandBridge from '@/components/hr-production/HRModuleCommandBridge'
import HRRealtimeSyncPanel from '@/components/hr-production/HRRealtimeSyncPanel'
import RecruitmentPipelineCommand from "./_components/RecruitmentPipelineCommand";
import LiveScheduledInterviewsPanel from "./_components/LiveScheduledInterviewsPanel";
import RecruitmentLiveGeoMapPanel from "./_components/RecruitmentLiveGeoMapPanel";
import RequisitionCommandCenter from "./_components/RequisitionCommandCenter";
import RecruitmentCandidateCommandCenter from "./_components/RecruitmentCandidateCommandCenter";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, any>;
const stages = [
  "applied",
  "screening",
  "interview",
  "assessment",
  "offer",
  "hired",
];
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
const toDateTimeLocal = (isoDate: string, hour = "9:00 AM") => {
  const [hRaw, meridiem] = hour.split(" ");
  const [h, m = "00"] = hRaw.split(":");
  let hour24 = Number(h);
  if (meridiem === "PM" && hour24 !== 12) hour24 += 12;
  if (meridiem === "AM" && hour24 === 12) hour24 = 0;
  return `${isoDate}T${String(hour24).padStart(2, "0")}:${m}`;
};
const stageLabel: Record<string, string> = {
  applied: "Applied",
  new: "Applied",
  screening: "Screening",
  interview: "Interview",
  assessment: "Assessment",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
  on_hold: "On Hold",
  pending: "Pending",
};
const sidebarGroups = [
  {
    label: "Overview",
    items: [
      ["Dashboard", "/hr", LayoutDashboard],
    ],
  },
  {
    label: "People",
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
    label: "Operations",
    items: [
      ["Attendance", "/hr/attendance", CalendarCheck],
      ["Leave Management", "/hr/leave", Clock3],
      ["Work Schedules", "/hr/work-schedules", Workflow],
      ["Time Tracking", "/hr/time-tracking", Activity],
    ],
  },
  {
    label: "Compliance & Documents",
    items: [
      ["Documents", "/hr/documents", FileBadge2],
      ["Templates", "/hr/templates", FileText],
      ["Policies", "/hr/policies", ShieldCheck],
      ["Compliance Dashboard", "/hr/compliance", AlertTriangle],
    ],
  },
  {
    label: "System",
    items: [
      ["Integrations", "/hr/integrations", Sparkles],
      ["Settings", "/hr/settings", Settings],
    ],
  },
] as const;

function text(row: Row, keys: string[], fallback = "—") {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim()) return String(v);
  }
  return fallback;
}
function num(row: Row, keys: string[], fallback = 0) {
  const n = Number(text(row, keys, ""));
  return Number.isFinite(n) ? n : fallback;
}
function norm(v: any) {
  return String(v || "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .trim();
}
function normalizeStage(c: Row) {
  const s = norm(
    text(c, ["pipeline_stage", "stage", "status", "decision"], "applied"),
  );
  return s === "new" ? "applied" : s;
}
function pct(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}
function dateText(v: any) {
  if (!v) return "—";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(v));
  } catch {
    return String(v);
  }
}
function cityOf(row: Row) {
  return text(row, ["city", "location", "work_city"], "Morocco");
}
function sourceOf(row: Row) {
  return text(row, ["source", "candidate_source", "channel"], "Manual");
}
function positionOf(row: Row) {
  return text(
    row,
    ["desired_position", "job_title", "position", "title"],
    "Open role",
  );
}
function tone(stage: string) {
  const s = norm(stage);
  if (s.includes("hired"))
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s.includes("reject")) return "border-rose-200 bg-rose-50 text-rose-700";
  if (s.includes("hold")) return "border-amber-200 bg-amber-50 text-amber-700";
  if (s.includes("interview") || s.includes("assessment"))
    return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}
function nextStage(stage: string) {
  return stage === "offer"
    ? "hired"
    : stage === "assessment"
      ? "offer"
      : stage === "interview"
        ? "assessment"
        : stage === "screening"
          ? "interview"
          : "screening";
}

function Pill({ children, className = "" }: any) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${className}`}
    >
      {children}
    </span>
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
      className={`h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${props.className || ""}`}
    />
  );
}
function Select(props: any) {
  return (
    <select
      {...props}
      className={`h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${props.className || ""}`}
    >
      {props.children}
    </select>
  );
}
function Textarea(props: any) {
  return (
    <textarea
      {...props}
      className={`rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${props.className || ""}`}
    />
  );
}

function MoroccoMap({
  locations,
}: {
  locations: Array<{ city: string; count: number }>;
}) {
  const max = Math.max(1, ...locations.map((x) => x.count || 0));
  const points: any = {
    casablanca: [37, 58],
    rabat: [45, 43],
    kenitra: [46, 38],
    tangier: [52, 20],
    tanger: [52, 20],
    fes: [61, 42],
    fez: [61, 42],
    marrakech: [42, 70],
    agadir: [34, 82],
    oujda: [76, 40],
  };
  return (
    <div className="relative h-64 overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
      <svg viewBox="0 0 320 240" className="absolute inset-0 h-full w-full">
        <path
          d="M170 20 L205 55 L244 70 L265 100 L250 126 L275 150 L238 165 L218 195 L180 214 L140 199 L104 170 L84 135 L104 100 L132 76 Z"
          fill="#ede9fe"
          stroke="#a78bfa"
          strokeWidth="3"
        />
        <path
          d="M160 38 C185 75 190 105 170 132 C150 158 145 184 158 206"
          fill="none"
          stroke="#c4b5fd"
          strokeDasharray="7 8"
        />
        <path
          d="M115 118 L228 107 M105 150 L220 140 M142 76 L194 183"
          stroke="#c4b5fd"
          strokeWidth="2"
          opacity=".7"
        />
      </svg>
      {locations.slice(0, 8).map((l, i) => {
        const [x, y] = points[norm(l.city)] || [
          38 + ((i * 13) % 38),
          34 + ((i * 17) % 50),
        ];
        const size = 28 + ((l.count || 1) / max) * 34;
        return (
          <div
            key={l.city}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span
              className="absolute left-1/2 top-1/2 rounded-full bg-violet-500/15 blur-xl"
              style={{
                width: size + 18,
                height: size + 18,
                transform: "translate(-50%,-50%)",
              }}
            />
            <span
              className="relative grid place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xs font-black text-white shadow-xl shadow-violet-300"
              style={{ width: size, height: size }}
            >
              {l.count}
            </span>
            <span className="relative mt-1 inline-flex rounded-full bg-white/90 px-2 py-1 text-[10px] font-black uppercase text-slate-600 shadow">
              {l.city}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ModalShell({ title, subtitle, children }: any) {
  return (
    <section
      id="recruitment-create-workflow"
      className="relative z-[80] mx-5 mt-6 md:mx-8"
    >
      <div className="overflow-hidden rounded-[34px] border border-white/80 bg-white shadow-2xl shadow-slate-300/60 ring-1 ring-slate-200/70">
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-7 py-5 backdrop-blur-xl">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-500">
              Recruitment live workflow
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{subtitle}</p>
          </div>
          <Link
            href="/hr/recruitment"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Close
          </Link>
        </div>
        {children}
      </div>
    </section>
  );
}

function CreateModal({ candidates }: { candidates: Row[] }) {
  const candidateOptions = candidates.slice(0, 60);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  return (
    <div className="relative">
      <details className="group/create relative">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300">
          <Plus className="h-4 w-4" /> Create{" "}
          <ChevronDown className="h-4 w-4 transition group-open/create:rotate-180" />
        </summary>
        <div className="absolute right-0 top-[calc(100%+12px)] z-[99990] hidden w-[390px] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/50 group-open/create:block">
          <div className="px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-500">
              Recruitment command
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">
              Choose the workflow you want to launch.
            </p>
          </div>
          <Link
            href="/hr/recruitment?create=candidate"
            className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-violet-50"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700">
              <Users className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-black text-slate-950">
                Create a candidate
              </span>
              <span className="block text-xs font-bold text-slate-500">
                Profile, score, tasks, comments, follow-up.
              </span>
            </span>
          </Link>
          <Link
            href="/hr/recruitment?create=interview"
            className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-blue-50"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700">
              <CalendarCheck className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-black text-slate-950">
                Create an interview
              </span>
              <span className="block text-xs font-bold text-slate-500">
                Schedule directly into interview calendar.
              </span>
            </span>
          </Link>
          <Link
            href="/hr/recruitment?create=requisition"
            className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-emerald-50"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-black text-slate-950">
                Create a new requisition
              </span>
              <span className="block text-xs font-bold text-slate-500">
                Broad Angelcare hiring request.
              </span>
            </span>
          </Link>
          <Link
            href="/hr/recruitment/questionnaires"
            className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-fuchsia-50"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-fuchsia-100 text-fuchsia-700">
              <FileText className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-black text-slate-950">
                Interview questionnaires
              </span>
              <span className="block text-xs font-bold text-slate-500">
                Create questionnaire workflow and public HTML assessment pages.
              </span>
            </span>
          </Link>
        </div>
      </details>
    </div>
  );
}

function CreateWorkflowPanel({
  candidates,
  mode,
}: {
  candidates: Row[];
  mode?: string;
}) {
  const candidateOptions = candidates.slice(0, 60);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  if (!mode) return null;
  return (
    <>
      {mode === "candidate" && (
        <ModalShell
          title="Create Candidate"
          subtitle="Modern live candidate workspace with dedicated tasks and comments."
        >
          <div className="grid gap-6 p-7 xl:grid-cols-[1.3fr_.7fr]">
            <form
              action={createHrRecord}
              className="rounded-[30px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white p-6 shadow-sm"
            >
              <input type="hidden" name="_table" value={HR_TABLES.candidates} />
              <input type="hidden" name="_redirect" value="/hr/recruitment" />
              <div className="mb-6 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 text-white">
                  <UserCheck className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-black">
                    Candidate identity & pipeline
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    Everything needed to make the candidate immediately
                    operational.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input name="full_name" required placeholder="Full name" />
                <Input name="email" type="email" placeholder="Email" />
                <Input name="phone" placeholder="Phone" />
                <Input
                  name="desired_position"
                  required
                  placeholder="Target position"
                />
                <Input name="city" placeholder="City / branch" />
                <Input
                  name="source"
                  placeholder="Source: website, referral, LinkedIn"
                />
                <Select name="pipeline_stage">
                  <option value="applied">Applied</option>
                  <option value="screening">Screening</option>
                  <option value="interview">Interview</option>
                  <option value="assessment">Assessment</option>
                  <option value="offer">Offer</option>
                </Select>
                <Input
                  name="score"
                  type="number"
                  min="0"
                  max="5"
                  placeholder="Rating / 5"
                />
                <Input
                  name="expected_salary"
                  type="number"
                  placeholder="Expected salary MAD"
                />
                <Input name="availability_date" type="date" />
                <Input name="interview_date" type="datetime-local" />
                <Select name="decision">
                  <option value="pending">Pending decision</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="on_hold">On hold</option>
                  <option value="rejected">Rejected</option>
                </Select>
                <Textarea
                  name="notes"
                  rows={7}
                  placeholder="Candidate summary, experience, strengths, risks, salary expectation, language level, availability, compliance notes..."
                  className="md:col-span-3"
                />
                <button className="md:col-span-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5">
                  Save candidate live
                </button>
              </div>
            </form>
            <div className="grid gap-6">
              <form
                action={createRecruitmentTask}
                className="rounded-[30px] border border-emerald-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <ClipboardCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black">Candidate tasks</h3>
                    <p className="text-xs font-bold text-slate-500">
                      ClickUp-style ownership, priority and deadlines.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Input name="title" required placeholder="Task title" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input name="owner" placeholder="Owner" />
                    <Input name="due_date" type="date" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select name="priority">
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                      <option value="low">Low</option>
                    </Select>
                    <Select name="related_record_id">
                      <option value="">Link to candidate</option>
                      {candidateOptions.map((c) => (
                        <option
                          key={`task-${text(c, ["id", "full_name"])}`}
                          value={text(c, ["id"], "")}
                        >
                          {text(c, ["full_name", "name"])}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Textarea
                    name="description"
                    rows={4}
                    placeholder="Checklist, dependency, instruction..."
                  />
                  <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                    Create task
                  </button>
                </div>
              </form>
              <form
                action={addRecruitmentComment}
                className="rounded-[30px] border border-blue-100 bg-white p-6 shadow-sm"
              >
                <input
                  type="hidden"
                  name="source_table"
                  value={HR_TABLES.candidates}
                />
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                    <MessageSquareText className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black">Candidate comments</h3>
                    <p className="text-xs font-bold text-slate-500">
                      Decision log, mentions and timeline.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Select name="record_id">
                    <option value="">General / link to candidate</option>
                    {candidateOptions.map((c) => (
                      <option
                        key={`comment-${text(c, ["id", "full_name"])}`}
                        value={text(c, ["id"], "")}
                      >
                        {text(c, ["full_name", "name"])}
                      </option>
                    ))}
                  </Select>
                  <Textarea
                    name="comment"
                    rows={6}
                    required
                    placeholder="Write note, decision reason, risk, blocker, next action..."
                  />
                  <Input name="next_step" placeholder="Next step" />
                  <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
                    Add comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalShell>
      )}

      {mode === "interview" && (
        <ModalShell
          title="Create Interview"
          subtitle="Same production interview modal logic as the interview calendar. Saved interviews appear automatically in /hr/recruitment/interviews."
        >
          <div className="p-7">
            <form
              action={scheduleRecruitmentInterview}
              className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]"
            >
              <section className="rounded-[30px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-violet-700">
                      <Sparkles className="h-3.5 w-3.5" /> Live interview
                      orchestration
                    </div>
                    <h4 className="mt-4 text-lg font-black text-slate-950">
                      Candidate & schedule
                    </h4>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Choose an existing candidate or create a new one, then
                      write the interview directly into the synced calendar
                      agenda.
                    </p>
                  </div>
                  <Link
                    href="/hr/recruitment"
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-violet-100 bg-white/80 p-3 text-xs font-black text-violet-700">
                  <CalendarCheck className="h-4 w-4" /> Live sync target:
                  recruitment candidates database + interview calendar agenda
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Select name="candidate_id" className="md:col-span-2">
                    <option value="">New candidate or choose existing</option>
                    {candidateOptions.map((c) => (
                      <option
                        key={`interview-sync-${text(c, ["id", "full_name"])}`}
                        value={text(c, ["id"], "")}
                      >
                        {text(c, ["full_name", "name"], "Candidate")} •{" "}
                        {positionOf(c)}
                      </option>
                    ))}
                  </Select>
                  <Input name="full_name" placeholder="Candidate full name" />
                  <Input
                    name="desired_position"
                    required
                    placeholder="Role / position"
                  />
                  <Input
                    name="email"
                    type="email"
                    placeholder="candidate@email.com"
                  />
                  <Input name="phone" placeholder="+212 ..." />
                  <Input
                    name="city"
                    placeholder="Casablanca, Rabat, Remote..."
                  />
                  <Input
                    name="interview_date"
                    required
                    type="datetime-local"
                    defaultValue={tomorrow}
                  />
                  <Select name="interview_type" defaultValue="HR Interview">
                    {interviewTypes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </Select>
                  <Select name="owner" defaultValue="Salma El Alami">
                    {defaultInterviewers.map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </Select>
                  <Input
                    name="meeting_url"
                    placeholder="Google Meet / Zoom / Teams link"
                  />
                  <Select name="priority" defaultValue="high">
                    <option value="medium">Medium priority</option>
                    <option value="high">High priority</option>
                    <option value="urgent">Urgent priority</option>
                  </Select>
                  <Select name="pipeline_stage" defaultValue="interview">
                    <option value="interview">
                      Move candidate to Interview
                    </option>
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
                  Every control writes useful HR execution data and triggers
                  page revalidation.
                </p>
                <div className="mt-5 grid gap-4">
                  <Input
                    name="score"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Target score / readiness"
                  />
                  <Input
                    name="expected_salary"
                    type="number"
                    placeholder="Expected salary MAD"
                  />
                  <Input
                    name="task_title"
                    placeholder="Preparation task title"
                    defaultValue="Prepare interview scorecard and candidate file"
                  />
                  <Select name="decision" defaultValue="pending">
                    <option value="pending">Pending decision</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="on_hold">On hold</option>
                    <option value="rejected">Rejected after interview</option>
                  </Select>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-700">
                      Auto-sync included
                    </p>
                    <div className="mt-3 grid gap-2 text-sm font-black text-slate-700">
                      {[
                        "Create or update candidate record",
                        "Set candidate stage to interview",
                        "Create preparation task",
                        "Revalidate recruitment dashboard",
                        "Revalidate interview agenda",
                      ].map((x) => (
                        <span key={x} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />{" "}
                          {x}
                        </span>
                      ))}
                    </div>
                  </div>
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
                  placeholder="Score competencies, culture fit, availability, salary expectation, risk factors, interview questions, technical checks, legal/compliance notes and next-step rules..."
                />
              </section>
              <section className="rounded-[30px] border border-violet-100 bg-violet-50/60 p-5">
                <h4 className="text-base font-black text-slate-950">
                  Calendar readiness
                </h4>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                  Once saved, this interview becomes a live candidate interview
                  record. The interview page reads the same candidate source and
                  will immediately show it in the correct day agenda after
                  refresh/revalidation.
                </p>
                <Link
                  href="/hr/recruitment/interviews"
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-black text-violet-700"
                >
                  Open interview calendar <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
              <div className="xl:col-span-2 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
                <Link
                  href="/hr/recruitment"
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black"
                >
                  Cancel
                </Link>
                <button className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl">
                  Save & Sync Interview
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      )}

      {mode === "requisition" && (
        <ModalShell
          title="Create New Requisition"
          subtitle="Broadened requisition control for Angelcare hiring across Morocco."
        >
          <form
            action={createHrRecord}
            className="grid gap-6 p-7 xl:grid-cols-3"
          >
            <input type="hidden" name="_table" value={HR_TABLES.openings} />
            <input type="hidden" name="_redirect" value="/hr/recruitment" />
            <section className="rounded-[30px] border border-violet-100 bg-violet-50/40 p-5">
              <h3 className="mb-4 text-lg font-black">Role definition</h3>
              <div className="grid gap-3">
                <Input name="title" required placeholder="Job title" />
                <Input name="department" placeholder="Department" />
                <Input name="position" placeholder="Position family" />
                <Input name="city" placeholder="City / branch / remote" />
                <Select name="contract_type">
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="fixed_term">Fixed-term</option>
                  <option value="internship">Internship</option>
                  <option value="contractor">Contractor</option>
                </Select>
                <Input
                  name="openings_count"
                  type="number"
                  placeholder="Number of hires"
                />
              </div>
            </section>

            <section className="w-full">
              
            </section>
            <section className="rounded-[30px] border border-emerald-100 bg-emerald-50/40 p-5">
              <h3 className="mb-4 text-lg font-black">Budget & urgency</h3>
              <div className="grid gap-3">
                <Input
                  name="salary_min"
                  type="number"
                  placeholder="Salary min MAD"
                />
                <Input
                  name="salary_max"
                  type="number"
                  placeholder="Salary max MAD"
                />
                <Input name="target_start_date" type="date" />
                <Input
                  name="approval_owner"
                  placeholder="Approver / budget owner"
                />
                <Select name="hiring_priority">
                  <option value="normal">Normal priority</option>
                  <option value="high">High priority</option>
                  <option value="urgent">Urgent / critical</option>
                </Select>
                <Select name="status">
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="on_hold">On hold</option>
                </Select>
              </div>
            </section>
            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-black">Execution coverage</h3>
              <div className="grid gap-3">
                <Textarea
                  name="mission_context"
                  rows={5}
                  placeholder="Why this role is needed, business impact, city coverage..."
                />
                <Textarea
                  name="required_skills"
                  rows={5}
                  placeholder="Skills, languages, certifications, legal/compliance requirements..."
                />
                <Textarea
                  name="notes"
                  rows={4}
                  placeholder="Hiring plan, sourcing channels, screening rules, interview panel, risks..."
                />
                <button className="rounded-2xl bg-gradient-to-r from-emerald-600 to-violet-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5">
                  Save requisition live
                </button>
              </div>
            </section>
          </form>
        </ModalShell>
      )}
    </>
  );
}


function RecruitmentExecutiveCommandPanel({
  candidates,
  openings,
  stageCounts,
  sources,
  locations,
  interviews,
  hired,
}: {
  candidates: Row[];
  openings: Row[];
  stageCounts: { stage: string; count: number }[];
  sources: { source: string; count: number }[];
  locations: { city: string; count: number }[];
  interviews: Row[];
  hired: number;
}) {
  const activePipeline = Math.max(0, candidates.length - hired);
  const openRoles = openings.filter((job) => {
    const status = norm(text(job, ["status"], "open"));
    return !["closed", "cancelled", "filled", "archived"].includes(status);
  }).length;

  const offerCount = stageCounts.find((s) => s.stage === "offer")?.count || 0;
  const interviewCount = stageCounts.find((s) => s.stage === "interview")?.count || 0;
  const screeningCount = stageCounts.find((s) => s.stage === "screening")?.count || 0;
  const assessmentCount = stageCounts.find((s) => s.stage === "assessment")?.count || 0;
  const hiredRate = pct(hired, Math.max(1, candidates.length));
  const interviewRate = pct(interviewCount + assessmentCount + offerCount + hired, Math.max(1, candidates.length));
  const pipelineHealth = Math.min(100, Math.round((hiredRate * 0.35) + (interviewRate * 0.35) + (Math.min(100, activePipeline * 8) * 0.3)));
  const urgentOpenings = openings.filter((job) => {
    const priority = norm(text(job, ["hiring_priority", "priority", "urgency"], ""));
    return priority.includes("urgent") || priority.includes("high") || priority.includes("critical");
  }).length;
  const topSource = [...sources].sort((a, b) => b.count - a.count)[0];
  const topLocation = [...locations].sort((a, b) => b.count - a.count)[0];
  const nextInterview = [...interviews].sort((a, b) => String(text(a, ["interview_date"], "")).localeCompare(String(text(b, ["interview_date"], ""))))[0];

  const metricCards = [
    {
      label: "Open requisitions",
      value: openRoles,
      subtitle: `${openings.length} total job files`,
      icon: BriefcaseBusiness,
      tone: "from-violet-50 to-white text-violet-700 border-violet-100",
    },
    {
      label: "Candidates",
      value: candidates.length,
      subtitle: "Live synced candidate records",
      icon: Users,
      tone: "from-cyan-50 to-white text-cyan-700 border-cyan-100",
    },
    {
      label: "Active pipeline",
      value: activePipeline,
      subtitle: `${hired} hired · ${hiredRate}% conversion`,
      icon: Workflow,
      tone: "from-emerald-50 to-white text-emerald-700 border-emerald-100",
    },
    {
      label: "Interviews",
      value: interviews.length,
      subtitle: nextInterview ? `Next: ${dateText(text(nextInterview, ["interview_date"], ""))}` : "No interview date detected",
      icon: CalendarCheck,
      tone: "from-amber-50 to-white text-amber-700 border-amber-100",
    },
    {
      label: "Pipeline health",
      value: `${pipelineHealth}%`,
      subtitle: "Computed from stages and conversion",
      icon: Gauge,
      tone: "from-rose-50 to-white text-rose-700 border-rose-100",
    },
  ];

  const stageColors: Record<string, string> = {
    applied: "from-blue-500 to-cyan-400",
    screening: "from-violet-500 to-fuchsia-500",
    interview: "from-amber-400 to-orange-500",
    assessment: "from-indigo-500 to-blue-500",
    offer: "from-emerald-500 to-teal-500",
    hired: "from-slate-900 to-slate-700",
  };

  return (
    <section className="rounded-[40px] border border-white/80 bg-white p-5 shadow-2xl shadow-slate-200/70 ring-1 ring-slate-100">
      <div className="overflow-hidden rounded-[34px] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950">
                Recruitment Command Center
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                Live production synced
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                Candidates · requisitions · interviews
              </span>
            </div>
            <h2 className="mt-4 max-w-5xl text-4xl font-black tracking-[-0.06em] text-white xl:text-6xl">
              Hiring pipeline executive cockpit
            </h2>
            <p className="mt-3 max-w-4xl text-sm font-bold leading-7 text-white/60">
              Live command view for openings, candidates, interviews, stage velocity, sourcing quality,
              conversion pressure, urgent requisitions and hiring execution readiness.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[460px]">
            <div className="rounded-[26px] bg-white/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Top source</p>
              <p className="mt-2 text-2xl font-black">{topSource?.source || "—"}</p>
              <p className="mt-1 text-xs font-bold text-white/55">{topSource?.count || 0} candidate(s)</p>
            </div>
            <div className="rounded-[26px] bg-white/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Top location</p>
              <p className="mt-2 text-2xl font-black">{topLocation?.city || "—"}</p>
              <p className="mt-1 text-xs font-bold text-white/55">{topLocation?.count || 0} record(s)</p>
            </div>
            <div className="rounded-[26px] bg-white/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Urgent openings</p>
              <p className="mt-2 text-2xl font-black">{urgentOpenings}</p>
              <p className="mt-1 text-xs font-bold text-white/55">High priority hiring demand</p>
            </div>
            <div className="rounded-[26px] bg-white/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Interview rate</p>
              <p className="mt-2 text-2xl font-black">{interviewRate}%</p>
              <p className="mt-1 text-xs font-bold text-white/55">Reached interview+ stages</p>
            </div>
          </div>
        </div>
      </div>


    </section>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ create?: string }>;
}) {
  const params = await searchParams;
  const createMode = params?.create;
  const data = await getHRDashboardData();
  const candidates: Row[] = data.candidates || [];
  const openings: Row[] = data.openings || [];
  const tasks: Row[] = data.tasks || [];
  const activity: Row[] = data.activity || data.audit || [];
  const stageCounts = stages.map((s) => ({
    stage: s,
    count: candidates.filter(
      (c) =>
        normalizeStage(c) === s ||
        (s === "applied" && normalizeStage(c) === "new"),
    ).length,
  }));
  const topStage = Math.max(1, ...stageCounts.map((x) => x.count));
  const sources = Array.from(
    candidates.reduce<Map<string, number>>(
      (m, c) => m.set(sourceOf(c), (m.get(sourceOf(c)) || 0) + 1),
      new Map(),
    ),
  ).map(([source, count]) => ({ source, count }));
  const locations = Array.from(
    [...candidates, ...openings].reduce<Map<string, number>>(
      (m, r) => m.set(cityOf(r), (m.get(cityOf(r)) || 0) + 1),
      new Map(),
    ),
  ).map(([city, count]) => ({ city, count }));
  const recent = [...candidates]
    .sort((a, b) =>
      String(b.created_at || b.applied_on || "").localeCompare(
        String(a.created_at || a.applied_on || ""),
      ),
    )
    .slice(0, 8);
  const interviews = candidates
    .filter((c) => text(c, ["interview_date"], "") !== "")
    .slice(0, 5);
  const hired = candidates.filter((c) => normalizeStage(c) === "hired").length;
  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white/95 p-4 lg:block">
          <Link
            href="/hr"
            className="mb-6 flex items-center gap-3 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-4 text-white shadow-lg shadow-violet-200"
          >
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black">Angelcare HR</p>
              <p className="text-[11px] font-bold text-violet-100">
                People Operating System
              </p>
            </div>
          </Link>
          <nav className="space-y-6">
            {sidebarGroups.map((g: any) => (
              <div key={g.label}>
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {g.label}
                </p>
                <div className="space-y-1">
                  {g.items.map(([label, href, Icon]: any) => (
                    <Link
                      key={label}
                      href={href}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-black transition ${href === "/hr/recruitment" ? "bg-violet-50 text-violet-700 ring-1 ring-violet-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-xl md:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950">
                  Recruitment
                </h1>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Manage candidates, requisitions, interviews, tasks and hiring
                  decisions from your live HR database.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#candidates"
                  className="flex h-11 min-w-[340px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-400 shadow-sm"
                >
                  <Search className="h-4 w-4" /> Search candidates, jobs,
                  skills, departments...
                </a>
                <Link
                  href="/hr/recruitment/candidates"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700"
                >
                  Candidates
                </Link>
                <Link
                  href="/hr/recruitment/kanban"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700"
                >
                  Pipeline
                </Link>
                <Link
                  href="/hr/recruitment/interviews"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-violet-700"
                >
                  Interviews
                </Link>
                <Link
                  href="/hr/recruitment/questionnaires"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700"
                >
                  Interview Questionnaires
                </Link>
                <CreateModal candidates={candidates} />
              </div>
            </div>
          </header>
          <CreateWorkflowPanel candidates={candidates} mode={createMode} />

          <RecruitmentExecutiveCommandPanel
            candidates={candidates}
            openings={openings}
            stageCounts={stageCounts}
            sources={sources}
            locations={locations}
            interviews={interviews}
            hired={hired}
          />
          <div className="space-y-6 p-5 md:p-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              {[
                [
                  "Total Requisitions",
                  openings.length,
                  "Live from openings",
                  BriefcaseBusiness,
                ],
                [
                  "Open Requisitions",
                  openings.filter(
                    (j) => norm(text(j, ["status"], "open")) === "open",
                  ).length,
                  "Ready to hire",
                  ClipboardCheck,
                ],
                [
                  "Total Candidates",
                  candidates.length,
                  "Synced candidates",
                  Users,
                ],
                [
                  "In Progress",
                  candidates.length - hired,
                  "Active pipeline",
                  UserCheck,
                ],
                ["Hired This Month", hired, "Converted profiles", BadgeCheck],
                [
                  "Avg. Time to Hire",
                  "24 Days",
                  "Based on requisitions",
                  Clock3,
                ],
              ].map(([label, value, sub, Icon]: any) => (
                <Card key={label} title="" className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-500">
                        {label}
                      </p>
                      <p className="mt-1 text-3xl font-black text-slate-950">
                        {value}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {sub}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="grid gap-6 xl:grid-cols-4">
              <div className="xl:col-span-2">
                <RecruitmentPipelineCommand candidates={candidates} openings={openings} />
              </div>

              <div className="xl:col-span-2">
                <LiveScheduledInterviewsPanel
                  interviews={interviews}
                  candidates={candidates}
                  openings={openings}
                />

                <div className="mt-6">
<div className="w-full min-w-0 xl:relative xl:left-[calc(-100%_-_1.5rem)] xl:w-[calc(200%_+_1.5rem)]">
                <RecruitmentLiveGeoMapPanel
                  candidates={candidates}
                  openings={openings}
                  interviews={interviews}
                />
              </div>

</div>
              </div>
              
              
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
              <div className="xl:col-span-2">
                <RequisitionCommandCenter
                  openings={openings}
                  candidates={candidates}
                  departments={Array.from(new Set([
                    ...openings.map((item) => text(item, ["department", "department_name", "team", "business_unit"], "")).filter(Boolean),
                    ...candidates.map((item) => text(item, ["department", "department_name", "team", "business_unit"], "")).filter(Boolean),
                  ]))}
                />
              </div>
              <div className="xl:col-span-full">
                <RecruitmentCandidateCommandCenter
                  candidates={candidates}
                  openings={openings}
                  departments={Array.from(new Set([
                    ...openings.map((item) => text(item, ["department", "department_name", "team", "business_unit"], "")).filter(Boolean),
                    ...candidates.map((item) => text(item, ["department", "department_name", "team", "business_unit"], "")).filter(Boolean),
                  ]))}
                />
              </div>
            </div>
            <div
              id="candidates"
              className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]"
            >
</div>
</div>
        </main>
      </div>
    </div>
  );
}
