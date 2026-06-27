import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Code2,
  Copy,
  Edit3,
  ExternalLink,
  FileCode2,
  Globe2,
  MonitorPlay,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteHtmlInterviewQuestionnaire, updateHtmlInterviewQuestionnaire } from "../_actions";
import { QUESTIONNAIRES_PATH, QUESTIONNAIRES_TABLE, RESPONSES_TABLE } from "../_constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, any>;

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
    return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function sanitizeHtmlCode(raw: string) {
  return String(raw || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/g)
    .filter((line) => !/^\s*```(?:[A-Za-z0-9_-]+)?\s*$/.test(line))
    .filter((line) => !/^\s*:::writing[^\n]*\s*$/.test(line))
    .filter((line) => !/^\s*:::\s*$/.test(line))
    .join("\n")
    .trim();
}

function htmlDocument(row: Row) {
  const html = sanitizeHtmlCode(String(row?.html_code || ""));
  if (/<html[\s>]/i.test(html) || /<!doctype/i.test(html)) return html;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${text(row, ["title"], "AngelCare HTML Interview")}</title>
  <style>body{margin:0;background:#f7f8fc;padding:28px;font-family:Inter,Arial,sans-serif;color:#0f172a}</style>
</head>
<body>${html}</body>
</html>`;
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

async function loadQuestionnaire(id: string) {
  const supabase = await createClient();
  const [questionnaireResult, responsesResult] = await Promise.all([
    supabase.from(QUESTIONNAIRES_TABLE).select("*").eq("id", id).maybeSingle(),
    supabase.from(RESPONSES_TABLE).select("*").eq("questionnaire_id", id).order("submitted_at", { ascending: false }).limit(100),
  ]);
  return {
    questionnaire: questionnaireResult.data as Row | null,
    responses: Array.isArray(responsesResult.data) ? responsesResult.data : [],
    error: questionnaireResult.error?.message || responsesResult.error?.message,
  };
}

function EditHtmlForm({ item }: { item: Row }) {
  return (
    <form action={updateHtmlInterviewQuestionnaire} className="grid gap-6 xl:grid-cols-[.78fr_1.22fr]">
      <input type="hidden" name="id" value={item.id} />
      <section className="rounded-[34px] border border-white bg-white p-6 shadow-xl shadow-slate-200/70 ring-1 ring-slate-100">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Edit3 className="h-5 w-5" /></span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">Edit metadata</p>
            <h2 className="text-xl font-black text-slate-950">Questionnaire controls</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Input name="title" required defaultValue={text(item, ["title"], "")} placeholder="Title" className="md:col-span-2" />
          <Input name="questionnaire_code" defaultValue={text(item, ["questionnaire_code"], "")} placeholder="Code" />
          <Select name="status" defaultValue={text(item, ["status"], "draft")}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Select>
          <Input name="role_target" defaultValue={text(item, ["role_target"], "")} placeholder="Role target" />
          <Input name="department" defaultValue={text(item, ["department"], "")} placeholder="Department" />
          <Select name="language" defaultValue={text(item, ["language"], "fr")}>
            <option value="fr">French</option>
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </Select>
          <Select name="assessment_mode" defaultValue={text(item, ["assessment_mode"], "online")}>
            <option value="online">Online</option>
            <option value="onsite">On-site</option>
            <option value="hybrid">Hybrid</option>
          </Select>
          <Input name="owner" defaultValue={text(item, ["owner"], "")} placeholder="Owner" />
          <Input name="duration_minutes" type="number" defaultValue={text(item, ["duration_minutes"], "45")} />
          <Input name="pass_score" type="number" defaultValue={text(item, ["pass_score"], "70")} />
          <Input name="valid_from" type="date" defaultValue={text(item, ["valid_from"], "")} />
          <Input name="valid_until" type="date" defaultValue={text(item, ["valid_until"], "")} />
          <label className="flex h-12 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-700">
            <input name="is_public" type="checkbox" defaultChecked={Boolean(item.is_public)} /> Public HTML page
          </label>
          <label className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600">
            <input name="allow_multiple_submissions" type="checkbox" defaultChecked={Boolean(item.allow_multiple_submissions)} /> Multiple submissions
          </label>
          <Textarea name="instructions" rows={4} defaultValue={text(item, ["instructions"], "")} placeholder="Instructions" className="md:col-span-2 font-sans text-sm" />
          <Textarea name="html_design_notes" rows={5} defaultValue={text(item, ["html_design_notes"], "")} placeholder="Internal design notes" className="md:col-span-2" />
          <Textarea name="scoring_rules" rows={5} defaultValue={text(item, ["scoring_rules"], "")} placeholder="Review / scoring rules" className="md:col-span-2" />
        </div>
      </section>
      <section className="overflow-hidden rounded-[34px] border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-300">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-white">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">HTML source editor</p>
            <h2 className="text-xl font-black">Edit the exact online questionnaire page</h2>
          </div>
          <button className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-950"><Save className="h-4 w-4" /> Save HTML</button>
        </div>
        <Textarea name="html_code" rows={34} defaultValue={sanitizeHtmlCode(String(item.html_code || ""))} className="min-h-[760px] w-full rounded-none border-0 bg-slate-950 text-[12px] text-emerald-100 focus:ring-0" />
      </section>
    </form>
  );
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ edit?: string; error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const editMode = query?.edit === "1";
  const { questionnaire, responses, error } = await loadQuestionnaire(id);

  if (!questionnaire || error) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto mt-24 max-w-2xl rounded-[36px] border border-white/10 bg-white/10 p-8 text-center shadow-2xl">
          <FileCode2 className="mx-auto h-12 w-12 text-violet-200" />
          <h1 className="mt-5 text-3xl font-black">HTML questionnaire unavailable</h1>
          <p className="mt-3 text-sm font-bold leading-7 text-white/60">The questionnaire was not found or the database migration still needs to be applied.</p>
          <Link href={QUESTIONNAIRES_PATH} className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">Back to questionnaires</Link>
        </div>
      </main>
    );
  }

  const publicUrl = `/assessments/interview/${text(questionnaire, ["public_slug"], "missing-slug")}`;

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-xl md:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Link href={QUESTIONNAIRES_PATH} className="mb-2 inline-flex items-center gap-2 text-xs font-black text-violet-700"><ArrowLeft className="h-4 w-4" /> Interview questionnaires</Link>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">{text(questionnaire, ["title"], "HTML questionnaire")}</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Dedicated HTML view page. This is what opens when the user clicks the saved questionnaire card.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`${QUESTIONNAIRES_PATH}/${questionnaire.id}${editMode ? "" : "?edit=1"}`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700"><Edit3 className="h-4 w-4" /> {editMode ? "Close editor" : "Edit HTML"}</Link>
            <Link href={publicUrl} target="_blank" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white"><ExternalLink className="h-4 w-4" /> Public online assessment</Link>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-5 md:p-8">
        {query?.error && <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-700">{query.error}</div>}

        <section className="overflow-hidden rounded-[40px] border border-white bg-white p-5 shadow-2xl shadow-slate-200/80 ring-1 ring-slate-100">
          <div className="rounded-[34px] bg-slate-950 p-6 text-white">
            <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950">{text(questionnaire, ["questionnaire_code"], "IQ")}</span>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">HTML view ready</span>
                </div>
                <h2 className="mt-4 max-w-5xl text-4xl font-black tracking-[-0.06em] xl:text-6xl">Live HTML questionnaire page</h2>
                <p className="mt-3 max-w-4xl text-sm font-bold leading-7 text-white/60">Saved HTML/CSS is rendered in a real browser frame. Edit the code, save it, then open the public version for candidate online assessment.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ["Status", text(questionnaire, ["status"], "draft"), CheckCircle2],
                  ["Version", `v${text(questionnaire, ["html_version"], "1")}`, Code2],
                  ["Responses", responses.length, Users],
                  ["Duration", `${text(questionnaire, ["duration_minutes"], "45")}m`, Clock3],
                ].map(([label, value, Icon]: any) => (
                  <div key={label} className="rounded-[24px] bg-white/10 p-4">
                    <Icon className="h-5 w-5 text-violet-200" />
                    <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">{label}</p>
                    <p className="mt-1 truncate text-xl font-black">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {editMode ? <EditHtmlForm item={questionnaire} /> : (
          <div className="grid gap-6 xl:grid-cols-[.34fr_.66fr]">
            <aside className="space-y-5">
              <section className="rounded-[34px] border border-white bg-white p-6 shadow-xl shadow-slate-200/70 ring-1 ring-slate-100">
                <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-violet-600" /><h2 className="text-lg font-black text-slate-950">HTML assessment details</h2></div>
                <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                  <p><span className="text-slate-950">Role:</span> {text(questionnaire, ["role_target"], "Open role")}</p>
                  <p><span className="text-slate-950">Department:</span> {text(questionnaire, ["department"], "Recruitment")}</p>
                  <p><span className="text-slate-950">Language:</span> {text(questionnaire, ["language"], "fr")}</p>
                  <p><span className="text-slate-950">Owner:</span> {text(questionnaire, ["owner"], "HR")}</p>
                  <p><span className="text-slate-950">Last update:</span> {dateText(questionnaire.updated_at)}</p>
                </div>
                <div className="mt-5 grid gap-2">
                  <Link href={publicUrl} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-violet-200"><Globe2 className="h-4 w-4" /> Open public HTML assessment</Link>
                  <Link href={`${QUESTIONNAIRES_PATH}/${questionnaire.id}?edit=1`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700"><Edit3 className="h-4 w-4" /> Edit HTML code</Link>
                </div>
              </section>

              <section className="rounded-[34px] border border-white bg-white p-6 shadow-xl shadow-slate-200/70 ring-1 ring-slate-100">
                <div className="flex items-center gap-3"><UserCheck className="h-6 w-6 text-emerald-600" /><h2 className="text-lg font-black text-slate-950">Recent submissions</h2></div>
                <div className="mt-5 space-y-3">
                  {responses.slice(0, 8).map((response: Row) => (
                    <div key={response.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="font-black text-slate-950">{text(response, ["candidate_name"], "Candidate")}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{text(response, ["candidate_email"], "No email")} · {dateText(response.submitted_at)}</p>
                    </div>
                  ))}
                  {!responses.length && <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm font-bold text-slate-400">No online submissions yet.</div>}
                </div>
              </section>
            </aside>

            <section className="overflow-hidden rounded-[36px] border border-white bg-white shadow-2xl shadow-slate-200/80 ring-1 ring-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white"><MonitorPlay className="h-5 w-5" /></span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600">Rendered HTML preview</p>
                    <h2 className="text-lg font-black text-slate-950">Exact saved HTML view</h2>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-500"><Copy className="h-3.5 w-3.5" /> slug: {text(questionnaire, ["public_slug"], "—")}</span>
                </div>
              </div>
              <iframe title="AngelCare HTML Interview Questionnaire Preview" srcDoc={htmlDocument(questionnaire)} className="h-[880px] w-full bg-white" sandbox="allow-forms allow-same-origin" />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
