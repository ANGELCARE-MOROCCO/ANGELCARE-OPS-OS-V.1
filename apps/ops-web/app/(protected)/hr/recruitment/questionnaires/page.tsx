import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Eye,
  FileCode2,
  FileText,
  Globe2,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  bulkCreateHtmlInterviewQuestionnaires,
  createHtmlInterviewQuestionnaire,
  deleteHtmlInterviewQuestionnaire,
  setHtmlInterviewQuestionnaireStatus,
} from "./_actions";
import { QUESTIONNAIRES_PATH, QUESTIONNAIRES_TABLE, RESPONSES_TABLE } from "./_constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, any>;

const sidebarGroups = [
  { label: "Overview", items: [["Dashboard", "/hr", LayoutDashboard]] },
  {
    label: "People",
    items: [
      ["Employees", "/hr/employees", Users],
      ["Recruitment", "/hr/recruitment", UserCheck],
      ["Interview Questionnaires", QUESTIONNAIRES_PATH, FileCode2],
      ["Onboarding", "/hr/onboarding", ClipboardCheck],
      ["Learning & Development", "/hr/training", GraduationCap],
    ],
  },
  {
    label: "Operations",
    items: [
      ["Attendance", "/hr/attendance", CalendarCheck],
      ["Work Schedules", "/hr/work-schedules", Activity],
    ],
  },
  { label: "System", items: [["Documents", "/hr/documents", ShieldCheck], ["Settings", "/hr/settings", Settings]] },
] as const;

function text(row: Row, keys: string[], fallback = "—") {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return fallback;
}

function dateText(value: any) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function htmlSize(row: Row) {
  return Math.max(0, String(row?.html_code || "").length);
}

function publicPath(row: Row) {
  return `/assessments/interview/${text(row, ["public_slug"], "missing-slug")}`;
}

function statusTone(status: string) {
  const normalized = String(status || "draft").toLowerCase();
  if (normalized === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "archived") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function Input(props: any) {
  return <input {...props} className={`h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${props.className || ""}`} />;
}

function Select(props: any) {
  return <select {...props} className={`h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${props.className || ""}`}>{props.children}</select>;
}

function Textarea(props: any) {
  return <textarea {...props} className={`rounded-2xl border border-slate-200 bg-white p-4 font-mono text-xs font-bold leading-6 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${props.className || ""}`} />;
}

function defaultHtmlSample() {
  return `<style>
  .ac-box{font-family:Inter,Arial,sans-serif;background:#ffffff;color:#0f172a;border:1px solid #e2e8f0;border-radius:28px;padding:24px;box-shadow:0 20px 44px rgba(15,23,42,.08)}
  .ac-title{font-size:32px;line-height:1.05;margin:0;font-weight:950;color:#111827}
  .ac-sub{font-size:14px;font-weight:700;color:#64748b;margin:10px 0 22px}
  .ac-card{border:1px solid #e5e7eb;background:#f8fafc;border-radius:22px;padding:18px;margin-top:14px}
  .ac-card label{display:block;font-weight:900;font-size:14px;color:#111827;margin-bottom:10px}
  .ac-card textarea,.ac-card input,.ac-card select{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:16px;padding:13px 14px;font-size:14px;font-weight:700;background:white;color:#0f172a}
  .ac-option{display:flex;gap:10px;align-items:flex-start;border:1px solid #e2e8f0;background:white;border-radius:16px;padding:11px 12px;margin-top:9px;font-size:13px;font-weight:800;color:#334155}
  .ac-option input{width:auto;margin-top:3px}
</style>
<div class="ac-box">
  <h1 class="ac-title">AngelCare Interview Questionnaire</h1>
  <p class="ac-sub">Premium HTML assessment. Add your own sections, scenarios, inputs, radio buttons, selects, and textareas.</p>

  <div class="ac-card">
    <label for="motivation">1. Why do you want to join AngelCare?</label>
    <textarea id="motivation" name="motivation" rows="5" required></textarea>
  </div>

  <div class="ac-card">
    <label>2. A parent is worried because an update was late. What is the strongest response?</label>
    <label class="ac-option"><input type="radio" name="parent_trust_scenario" value="acknowledge_verify_correct" required> Acknowledge, verify facts, apologize if needed, and provide corrective follow-up.</label>
    <label class="ac-option"><input type="radio" name="parent_trust_scenario" value="wait"> Wait until the end of the day.</label>
    <label class="ac-option"><input type="radio" name="parent_trust_scenario" value="avoid"> Avoid answering.</label>
  </div>

  <div class="ac-card">
    <label for="execution_plan">3. How do you organize five urgent tasks due today?</label>
    <textarea id="execution_plan" name="execution_plan" rows="5" required></textarea>
  </div>
</div>`;
}

async function loadQuestionnaireData() {
  const supabase = await createClient();
  const [questionnairesResult, responsesResult] = await Promise.all([
    supabase.from(QUESTIONNAIRES_TABLE).select("*").order("updated_at", { ascending: false }).limit(200),
    supabase.from(RESPONSES_TABLE).select("id,questionnaire_id,candidate_name,submitted_at").order("submitted_at", { ascending: false }).limit(500),
  ]);

  return {
    questionnaires: Array.isArray(questionnairesResult.data) ? questionnairesResult.data : [],
    responses: Array.isArray(responsesResult.data) ? responsesResult.data : [],
    errors: [questionnairesResult.error?.message, responsesResult.error?.message].filter(Boolean),
  };
}

function EmptyMigrationNotice({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-800">
      Database is not ready yet for HTML interview questionnaires. Run <span className="font-black">database/20260626_hr_interview_questionnaires_html.sql</span>, then refresh. Supabase message: {errors.join(" | ")}
    </div>
  );
}

function CreateQuestionnairePanel() {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <form action={createHtmlInterviewQuestionnaire} className="overflow-hidden rounded-[34px] border border-white bg-white shadow-2xl shadow-slate-200/80 ring-1 ring-slate-100">
        <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200"><Code2 className="h-5 w-5" /></span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">HTML questionnaire builder</p>
              <h2 className="text-xl font-black text-slate-950">Create an HTML interview questionnaire</h2>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-3">
          <Input name="title" required placeholder="Questionnaire title" className="md:col-span-2" />
          <Select name="status" defaultValue="draft">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Select>
          <Input name="role_target" placeholder="Target role" />
          <Input name="department" placeholder="Department" />
          <Select name="language" defaultValue="fr">
            <option value="fr">French</option>
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </Select>
          <Input name="owner" placeholder="Owner / recruiter" />
          <Input name="duration_minutes" type="number" defaultValue="45" min="5" placeholder="Duration min" />
          <Input name="pass_score" type="number" defaultValue="70" min="0" max="100" placeholder="Pass score" />
          <Input name="valid_from" type="date" />
          <Input name="valid_until" type="date" />
          <Select name="assessment_mode" defaultValue="online">
            <option value="online">Online assessment</option>
            <option value="onsite">On-site interview</option>
            <option value="hybrid">Hybrid</option>
          </Select>
          <label className="flex h-12 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-700">
            <input name="is_public" type="checkbox" defaultChecked /> Public HTML page
          </label>
          <label className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600">
            <input name="allow_multiple_submissions" type="checkbox" /> Multiple submissions
          </label>
          <Textarea name="instructions" rows={4} placeholder="Short admin notes / candidate instructions shown above the online assessment..." className="md:col-span-3 font-sans text-sm" />
          <div className="md:col-span-3 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-white">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">HTML source code</p>
                <h3 className="text-base font-black">Paste the full questionnaire UI as HTML/CSS</h3>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/70">No normal question parser</span>
            </div>
            <Textarea name="html_code" rows={24} defaultValue={defaultHtmlSample()} className="min-h-[520px] w-full rounded-none border-0 bg-slate-950 text-[12px] text-emerald-100 placeholder:text-white/35 focus:ring-0" />
          </div>
          <Textarea name="html_design_notes" rows={4} placeholder="Internal design notes: scoring logic, what each HTML field means, review rules..." className="md:col-span-2" />
          <Textarea name="scoring_rules" rows={4} placeholder="Scoring rules for reviewers. The HTML fields are saved as response answers." />
          <button className="md:col-span-3 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-4 text-sm font-black text-white shadow-xl shadow-violet-200 transition hover:-translate-y-0.5">
            Save HTML questionnaire and open HTML view
          </button>
        </div>
      </form>

      <form action={bulkCreateHtmlInterviewQuestionnaires} className="rounded-[34px] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-white"><Layers3 className="h-5 w-5" /></span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-200">Multiple HTML questionnaire generator</p>
            <h2 className="text-xl font-black">Create many HTML assessment cards</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Input name="default_department" placeholder="Default department" className="border-white/10 bg-white/10 text-white placeholder:text-white/45" />
          <Input name="default_owner" placeholder="Default owner" className="border-white/10 bg-white/10 text-white placeholder:text-white/45" />
          <Input name="default_role" placeholder="Default target role" className="border-white/10 bg-white/10 text-white placeholder:text-white/45" />
          <Select name="default_language" defaultValue="fr" className="border-white/10 bg-white/10 text-white">
            <option value="fr">French</option>
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </Select>
          <Input name="default_duration_minutes" type="number" defaultValue="45" className="border-white/10 bg-white/10 text-white placeholder:text-white/45" />
          <Input name="default_pass_score" type="number" defaultValue="70" className="border-white/10 bg-white/10 text-white placeholder:text-white/45" />
          <Select name="default_status" defaultValue="draft" className="border-white/10 bg-white/10 text-white sm:col-span-2">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </Select>
        </div>
        <Textarea name="bulk_titles" required rows={7} placeholder={"One questionnaire title per line:\nAdmin Sales Officer · Screening HTML\nCaregiver Field Agent · Scenario HTML\nAcademy Trainer · Pedagogy HTML"} className="mt-4 border-white/10 bg-white/10 text-white placeholder:text-white/40" />
        <Textarea name="bulk_html_code" rows={10} placeholder="Optional shared HTML/CSS template for every created questionnaire. Leave empty to generate the AngelCare sample HTML." className="mt-3 border-white/10 bg-white/10 text-white placeholder:text-white/40" />
        <Textarea name="bulk_instructions" rows={3} placeholder="Shared instructions for all generated HTML assessments" className="mt-3 border-white/10 bg-white/10 text-white placeholder:text-white/40" />
        <button className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5">
          Generate multiple HTML questionnaires
        </button>
      </form>
    </section>
  );
}

function QuestionnaireCard({ item, responseCount }: { item: Row; responseCount: number }) {
  const codeSize = htmlSize(item);
  return (
    <section className="group overflow-hidden rounded-[32px] border border-white bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-100">
      <Link href={`${QUESTIONNAIRES_PATH}/${item.id}`} className="block p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-slate-950 to-violet-700 text-white shadow-lg"><FileCode2 className="h-5 w-5" /></span>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-black capitalize ${statusTone(text(item, ["status"], "draft"))}`}>{text(item, ["status"], "draft")}</span>
        </div>
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-violet-600">{text(item, ["questionnaire_code"], "IQ")}</p>
        <h3 className="mt-2 text-xl font-black leading-6 text-slate-950 group-hover:text-violet-700">{text(item, ["title"], "Untitled HTML questionnaire")}</h3>
        <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-slate-500">{text(item, ["role_target"], "Open role")} · {text(item, ["department"], "Recruitment")}</p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-violet-50 p-3"><p className="text-[10px] font-black uppercase text-violet-700">HTML</p><p className="mt-1 text-lg font-black text-slate-950">{codeSize > 999 ? `${Math.round(codeSize / 1000)}k` : codeSize}</p></div>
          <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-[10px] font-black uppercase text-emerald-700">Answers</p><p className="mt-1 text-lg font-black text-slate-950">{responseCount}</p></div>
          <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Version</p><p className="mt-1 text-lg font-black text-slate-950">v{text(item, ["html_version"], "1")}</p></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-black text-slate-500">
          <span className="rounded-full border border-slate-200 px-3 py-1"><Globe2 className="mr-1 inline h-3.5 w-3.5 text-violet-600" /> HTML page</span>
          <span className="rounded-full border border-slate-200 px-3 py-1"><Eye className="mr-1 inline h-3.5 w-3.5 text-violet-600" /> Click to open view</span>
        </div>
      </Link>
      <div className="border-t border-slate-100 p-4">
        <div className="grid grid-cols-3 gap-2">
          {["draft", "active", "archived"].map((status) => (
            <form key={status} action={setHtmlInterviewQuestionnaireStatus}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="status" value={status} />
              <button className={`w-full rounded-2xl border px-3 py-2.5 text-xs font-black capitalize ${text(item, ["status"], "draft") === status ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-500"}`}>{status}</button>
            </form>
          ))}
        </div>
        <form action={deleteHtmlInterviewQuestionnaire} className="mt-3">
          <input type="hidden" name="id" value={item.id} />
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-black text-rose-700 transition hover:bg-rose-100">
            <Trash2 className="h-4 w-4" /> Delete permanently
          </button>
        </form>
      </div>
    </section>
  );
}

export default async function Page({ searchParams }: { searchParams?: Promise<{ error?: string; deleted?: string }> }) {
  const params = await searchParams;
  const { questionnaires, responses, errors } = await loadQuestionnaireData();
  const activeCount = questionnaires.filter((item: Row) => text(item, ["status"], "draft") === "active").length;
  const htmlBytes = questionnaires.reduce((sum: number, item: Row) => sum + htmlSize(item), 0);
  const responseCountByQuestionnaire = responses.reduce((map: Record<string, number>, response: Row) => {
    const key = text(response, ["questionnaire_id"], "");
    if (key) map[key] = (map[key] || 0) + 1;
    return map;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white/95 p-4 lg:block">
          <Link href="/hr" className="mb-6 flex items-center gap-3 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-4 text-white shadow-lg shadow-violet-200">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15"><Sparkles className="h-5 w-5" /></div>
            <div><p className="text-sm font-black">Angelcare HR</p><p className="text-[11px] font-bold text-violet-100">People Operating System</p></div>
          </Link>
          <nav className="space-y-6">
            {sidebarGroups.map((group: any) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map(([label, href, Icon]: any) => (
                    <Link key={label} href={href} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-black transition ${href === QUESTIONNAIRES_PATH ? "bg-violet-50 text-violet-700 ring-1 ring-violet-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
                      <Icon className="h-4 w-4" /> {label}
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
                <Link href="/hr/recruitment" className="mb-2 inline-flex items-center gap-2 text-xs font-black text-violet-700"><ArrowLeft className="h-4 w-4" /> Recruitment</Link>
                <h1 className="text-2xl font-black tracking-tight text-slate-950">Interview Questionnaires</h1>
                <p className="mt-1 text-sm font-semibold text-slate-500">HTML-first interview assessments. Paste full HTML/CSS, save it, and open each card as a dedicated HTML view page.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a href="#questionnaire-cards" className="flex h-11 min-w-[300px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-400 shadow-sm"><Search className="h-4 w-4" /> Search HTML questionnaires...</a>
                <Link href="/hr/recruitment" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700">Recruitment</Link>
                <Link href="/hr/recruitment/interviews" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700">Interviews</Link>
              </div>
            </div>
          </header>

          <div className="space-y-7 p-5 md:p-8">
            {params?.error && <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-700">{params.error}</div>}
            {params?.deleted && <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 text-sm font-bold text-emerald-700">Assessment permanently deleted.</div>}
            <EmptyMigrationNotice errors={errors as string[]} />

            <section className="overflow-hidden rounded-[40px] border border-white bg-white p-5 shadow-2xl shadow-slate-200/80 ring-1 ring-slate-100">
              <div className="rounded-[34px] bg-slate-950 p-6 text-white">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950">HTML assessment command center</span>
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">Code based questionnaires</span>
                    </div>
                    <h2 className="mt-4 max-w-5xl text-4xl font-black tracking-[-0.06em] xl:text-6xl">Premium HTML interview questionnaire cockpit</h2>
                    <p className="mt-3 max-w-4xl text-sm font-bold leading-7 text-white/60">No question parser. No plain text blocks. Each questionnaire is saved as a real HTML/CSS assessment page that candidates can open online.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4 xl:min-w-[560px]">
                    {[
                      ["Total", questionnaires.length, FileText],
                      ["Active", activeCount, CheckCircle2],
                      ["HTML KB", Math.round(htmlBytes / 1024), Code2],
                      ["Responses", responses.length, BarChart3],
                    ].map(([label, value, Icon]: any) => (
                      <div key={label} className="rounded-[24px] bg-white/10 p-4">
                        <Icon className="h-5 w-5 text-violet-200" />
                        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">{label}</p>
                        <p className="mt-1 text-2xl font-black">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <CreateQuestionnairePanel />

            <section id="questionnaire-cards" className="rounded-[34px] border border-white bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-100">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">Existing HTML questionnaires</p>
                  <h2 className="text-xl font-black text-slate-950">Premium HTML assessment cards</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-500"><Star className="mr-1 inline h-3.5 w-3.5 text-amber-500" /> Card click opens HTML view</span>
                  <span className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-500"><Globe2 className="mr-1 inline h-3.5 w-3.5 text-violet-600" /> Public online assessment</span>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {questionnaires.map((item: Row) => <QuestionnaireCard key={item.id} item={item} responseCount={responseCountByQuestionnaire[item.id] || 0} />)}
              </div>
              {!questionnaires.length && !errors.length && (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <BadgeCheck className="mx-auto h-10 w-10 text-violet-500" />
                  <h3 className="mt-4 text-lg font-black text-slate-950">No HTML questionnaires yet</h3>
                  <p className="mt-2 text-sm font-bold text-slate-500">Create the first AngelCare HTML interview questionnaire above, then it will appear here as a premium card.</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
