import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  FileCode2,
  Globe2,
  LockKeyhole,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { submitInterviewAssessment } from "./_actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, any>;
const QUESTIONNAIRES_TABLE = "hr_interview_questionnaires";

function text(row: Row, keys: string[], fallback = "—") {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return fallback;
}

function isExpired(row: Row) {
  const today = new Date();
  const validFrom = row?.valid_from ? new Date(row.valid_from) : null;
  const validUntil = row?.valid_until ? new Date(row.valid_until) : null;
  if (validFrom && today < validFrom) return true;
  if (validUntil && today > validUntil) return true;
  return false;
}

function stripCodeFence(raw: string) {
  return String(raw || "")
    .trim()
    .replace(/^```(?:html|HTML)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function assessmentHtml(raw: string) {
  const html = stripCodeFence(raw);
  const styleBlocks = Array.from(html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/gi)).map((match) => match[0]).join("\n");
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : html;
  body = body
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<html[^>]*>|<\/html>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>|<\/body>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?form\b[^>]*>/gi, "");

  const fullWidthOverride = `
<style>
  .ac-html-assessment-canvas {
    width: 100% !important;
    max-width: none !important;
    overflow: visible !important;
  }
  .ac-html-assessment-canvas > * {
    max-width: none !important;
  }
  .ac-html-assessment-canvas .ac-shell,
  .ac-html-assessment-canvas .container,
  .ac-html-assessment-canvas .wrapper,
  .ac-html-assessment-canvas [class*="container"],
  .ac-html-assessment-canvas [class*="shell"] {
    width: 100% !important;
    max-width: none !important;
  }
  .ac-html-assessment-canvas #angelcare-dispatch-assessment {
    width: 100% !important;
    max-width: none !important;
  }
  .ac-html-assessment-canvas table {
    max-width: 100% !important;
  }
  @media print {
    .ac-assessment-chrome,
    .ac-candidate-shell,
    .ac-submit-shell {
      display: none !important;
    }
    .ac-html-assessment-canvas {
      padding: 0 !important;
      margin: 0 !important;
    }
  }
</style>`;

  return `${fullWidthOverride}\n${styleBlocks}\n${body}`.trim();
}


type A4PrintBrief = {
  docReference: string;
  role: string;
  department: string;
  title: string;
  language: string;
  duration: string;
  passScore: string;
  sectionTitles: string[];
  scenarioTitles: string[];
  competencyTags: string[];
  scenarioCount: number;
  openQuestionCount: number;
};

function stripHtmlToText(raw: string) {
  return String(raw || "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(value: string, max = 150) {
  const clean = stripHtmlToText(value);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function uniqueClean(values: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];
  values.forEach((value) => {
    const clean = stripHtmlToText(value);
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) return;
    seen.add(key);
    output.push(clean);
  });
  return output;
}

function extractTagTexts(html: string, tag: string) {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  return Array.from(html.matchAll(pattern)).map((match) => stripHtmlToText(match[1])).filter(Boolean);
}

function buildA4PrintBrief(row: Row, rawHtml: string): A4PrintBrief {
  const html = stripCodeFence(rawHtml);
  const docRefMatch = html.match(/\bAC-[A-Z0-9][A-Z0-9-]{6,}-V\d+\b/i);
  const sectionTitles = uniqueClean(extractTagTexts(html, "h2"))
    .filter((item) => !/informations? candidat|identit|évaluation complétée|candidate identity/i.test(item))
    .slice(0, 7);
  const scenarioTitles = uniqueClean(extractTagTexts(html, "h3"))
    .filter((item) => !/nom complet|téléphone|email|ville|disponibilit|candidate|signature/i.test(item))
    .map((item) => compactText(item, 168))
    .slice(0, 14);
  const rawTags = Array.from(html.matchAll(/<span[^>]*class=["'][^"']*ac-pill[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)).map((match) => match[1]);
  const competencyTags = uniqueClean(rawTags)
    .filter((item) => !/scénario|scenario|question|\d+\/\d+/i.test(item))
    .slice(0, 18);
  const scenarioCount = (html.match(/Sc[ée]nario\s*\d+\s*\/\s*\d+/gi) || []).length || scenarioTitles.length;
  const openQuestionCount = (html.match(/Question\s*\d+\s*\/\s*\d+/gi) || []).length;

  return {
    docReference: docRefMatch?.[0] || text(row, ["questionnaire_code"], "AC-HR-IQ-PRINT-V1"),
    title: text(row, ["title"], "Questionnaire d’entretien"),
    role: text(row, ["role_target"], "Missions Dispatch Operations Assistant Manager"),
    department: text(row, ["department"], "HR Recruitment / Operations"),
    language: text(row, ["language"], "fr"),
    duration: text(row, ["duration_minutes"], "45"),
    passScore: text(row, ["pass_score"], "70"),
    sectionTitles,
    scenarioTitles,
    competencyTags,
    scenarioCount,
    openQuestionCount,
  };
}

function A4PrintSheet({ questionnaire, brief }: { questionnaire: Row; brief: A4PrintBrief }) {
  const totalItems = Math.max(brief.scenarioCount + brief.openQuestionCount, brief.scenarioTitles.length);
  const printedScenarios = brief.scenarioTitles.slice(0, 12);
  const remaining = Math.max(0, brief.scenarioTitles.length - printedScenarios.length);

  return (
    <section className="ac-a4-print-only" aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen {
          .ac-a4-print-only { display: none !important; }
        }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .ac-screen-only { display: none !important; }
          .ac-a4-print-only {
            display: block !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 7mm 8mm !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: Calibri, Arial, sans-serif !important;
            font-size: 8pt !important;
            line-height: 1.12 !important;
            box-sizing: border-box !important;
          }
          .ac-a4-print-only * {
            box-sizing: border-box !important;
            font-family: Calibri, Arial, sans-serif !important;
          }
          .ac-a4-page {
            height: 283mm !important;
            max-height: 283mm !important;
            overflow: hidden !important;
            border: 0.35mm solid #0f172a !important;
            background: #ffffff !important;
            padding: 4mm !important;
          }
          .ac-a4-top {
            display: grid !important;
            grid-template-columns: 26mm 1fr 52mm !important;
            gap: 4mm !important;
            align-items: stretch !important;
            border-bottom: 0.35mm solid #0f172a !important;
            padding-bottom: 3mm !important;
          }
          .ac-a4-logo {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border: 0.25mm solid #cbd5e1 !important;
            height: 20mm !important;
            padding: 2mm !important;
          }
          .ac-a4-logo img { max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; }
          .ac-a4-kicker {
            margin: 0 0 1.2mm !important;
            font-size: 7pt !important;
            line-height: 1 !important;
            letter-spacing: 1.6pt !important;
            text-transform: uppercase !important;
            color: #1d4ed8 !important;
            font-weight: 700 !important;
          }
          .ac-a4-title {
            margin: 0 !important;
            font-size: 10pt !important;
            line-height: 1.05 !important;
            text-transform: uppercase !important;
            color: #020617 !important;
            font-weight: 700 !important;
          }
          .ac-a4-subtitle {
            margin: 1.5mm 0 0 !important;
            font-size: 8pt !important;
            color: #334155 !important;
            font-weight: 700 !important;
          }
          .ac-a4-ref {
            border-left: 0.35mm solid #0f172a !important;
            padding-left: 3mm !important;
            font-size: 7.5pt !important;
            line-height: 1.15 !important;
          }
          .ac-a4-ref b { display: block !important; font-size: 8pt !important; color: #020617 !important; }
          .ac-a4-band {
            margin-top: 3mm !important;
            display: grid !important;
            grid-template-columns: repeat(5, 1fr) !important;
            gap: 1.6mm !important;
          }
          .ac-a4-chip {
            border: 0.25mm solid #cbd5e1 !important;
            padding: 1.8mm !important;
            min-height: 12mm !important;
          }
          .ac-a4-chip span {
            display: block !important;
            font-size: 6.5pt !important;
            letter-spacing: 0.7pt !important;
            text-transform: uppercase !important;
            color: #64748b !important;
            font-weight: 700 !important;
          }
          .ac-a4-chip strong {
            display: block !important;
            margin-top: 0.8mm !important;
            font-size: 8pt !important;
            line-height: 1.1 !important;
            color: #020617 !important;
          }
          .ac-a4-block {
            margin-top: 3mm !important;
            border: 0.25mm solid #cbd5e1 !important;
            padding: 2.5mm !important;
          }
          .ac-a4-block h2 {
            margin: 0 0 1.7mm !important;
            font-size: 8.5pt !important;
            line-height: 1 !important;
            letter-spacing: 1pt !important;
            text-transform: uppercase !important;
            color: #020617 !important;
            font-weight: 700 !important;
          }
          .ac-a4-block p,
          .ac-a4-block li {
            font-size: 7.6pt !important;
            line-height: 1.16 !important;
            color: #1e293b !important;
          }
          .ac-a4-two {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 3mm !important;
          }
          .ac-a4-list {
            margin: 0 !important;
            padding-left: 4mm !important;
          }
          .ac-a4-list li { margin: 0 0 1.05mm !important; }
          .ac-a4-tags {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 1.2mm !important;
          }
          .ac-a4-tag {
            border: 0.25mm solid #cbd5e1 !important;
            background: #f8fafc !important;
            padding: 1.1mm 1.6mm !important;
            font-size: 7.2pt !important;
            font-weight: 700 !important;
            color: #0f172a !important;
          }
          .ac-a4-scenarios {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 1.5mm 3mm !important;
            counter-reset: item !important;
            margin: 0 !important;
            padding: 0 !important;
            list-style: none !important;
          }
          .ac-a4-scenarios li {
            counter-increment: item !important;
            position: relative !important;
            padding-left: 5mm !important;
            min-height: 6.5mm !important;
            border-bottom: 0.2mm solid #e2e8f0 !important;
          }
          .ac-a4-scenarios li::before {
            content: counter(item) !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 3.5mm !important;
            height: 3.5mm !important;
            background: #0f172a !important;
            color: #ffffff !important;
            border-radius: 999px !important;
            font-size: 6pt !important;
            line-height: 3.5mm !important;
            text-align: center !important;
            font-weight: 700 !important;
          }
          .ac-a4-footer {
            margin-top: 3mm !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 2mm !important;
            border-top: 0.35mm solid #0f172a !important;
            padding-top: 2mm !important;
          }
          .ac-a4-sign {
            border: 0.25mm solid #cbd5e1 !important;
            height: 12mm !important;
            padding: 1.5mm !important;
            font-size: 7pt !important;
            color: #475569 !important;
            font-weight: 700 !important;
          }
          .ac-a4-confidential {
            margin-top: 1.8mm !important;
            font-size: 6.6pt !important;
            color: #64748b !important;
            text-align: center !important;
          }
        }
      ` }} />
      <div className="ac-a4-page">
        <header className="ac-a4-top">
          <div className="ac-a4-logo"><img src="/logo.png" alt="AngelCare" /></div>
          <div>
            <p className="ac-a4-kicker">AngelCare · HR Recruitment Assessment</p>
            <h1 className="ac-a4-title">Synthèse A4 — Questionnaire d’entretien opérationnel</h1>
            <p className="ac-a4-subtitle">Poste : {brief.role}</p>
          </div>
          <aside className="ac-a4-ref">
            <b>Référence document</b>
            {brief.docReference}<br />
            Version HTML : {text(questionnaire, ["html_version"], "1")}<br />
            Format : A4 ISO · Calibri<br />
            Confidentialité : Interne RH
          </aside>
        </header>

        <section className="ac-a4-band">
          <div className="ac-a4-chip"><span>Département</span><strong>{brief.department}</strong></div>
          <div className="ac-a4-chip"><span>Langue</span><strong>{brief.language.toUpperCase()}</strong></div>
          <div className="ac-a4-chip"><span>Durée</span><strong>{brief.duration} min</strong></div>
          <div className="ac-a4-chip"><span>Score cible</span><strong>{brief.passScore}%</strong></div>
          <div className="ac-a4-chip"><span>Items évalués</span><strong>{totalItems || "HTML"}</strong></div>
        </section>

        <section className="ac-a4-two">
          <div className="ac-a4-block">
            <h2>Objectif RH & opérations</h2>
            <p>
              Évaluer rapidement l’aptitude du candidat à sécuriser le dispatch, prioriser les urgences, protéger l’expérience client,
              contrôler les données CareLink, encadrer les intervenantes et prendre des décisions fiables sous pression.
            </p>
          </div>
          <div className="ac-a4-block">
            <h2>Structure synchronisée</h2>
            <ul className="ac-a4-list">
              <li>{brief.openQuestionCount || 3} questions ouvertes ciblées pour vision, organisation et signaux faibles.</li>
              <li>{brief.scenarioCount || 27} scénarios à choix multiples pour jugement opérationnel.</li>
              <li>Score automatique basé sur les réponses HTML nommées et la matrice du questionnaire.</li>
              <li>Aucune zone candidat à remplir sur cette fiche : document de synthèse interne.</li>
            </ul>
          </div>
        </section>

        <section className="ac-a4-block">
          <h2>Axes d’évaluation principaux</h2>
          <div className="ac-a4-tags">
            {(brief.competencyTags.length ? brief.competencyTags : ["Priorisation", "Dispatch", "Urgence", "Communication client", "Contrôle", "CareLink", "Leadership", "Éthique", "Qualité", "Reporting", "Stress", "Ownership"]).slice(0, 18).map((tag) => (
              <span className="ac-a4-tag" key={tag}>{tag}</span>
            ))}
          </div>
        </section>

        <section className="ac-a4-block">
          <h2>Contenu opérationnel condensé depuis le HTML</h2>
          <ul className="ac-a4-scenarios">
            {(printedScenarios.length ? printedScenarios : brief.sectionTitles).slice(0, 12).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {remaining > 0 ? <p style={{ margin: "1.5mm 0 0", fontWeight: 700 }}>+ {remaining} autres éléments dans la version HTML interactive.</p> : null}
        </section>

        <section className="ac-a4-two">
          <div className="ac-a4-block">
            <h2>Lecture décisionnelle</h2>
            <ul className="ac-a4-list">
              <li>≥ 88% : très fort fit opérationnel.</li>
              <li>78–87% : fit solide, entretien final recommandé.</li>
              <li>68–77% : potentiel à valider par test terrain.</li>
              <li>&lt; 68% : risque opérationnel à challenger.</li>
            </ul>
          </div>
          <div className="ac-a4-block">
            <h2>Usage entretien</h2>
            <ul className="ac-a4-list">
              <li>Comparer les choix du candidat avec ses explications verbales.</li>
              <li>Rejouer 2 scénarios critiques en entretien live.</li>
              <li>Valider calme, rigueur, traçabilité et ownership.</li>
            </ul>
          </div>
        </section>

        <footer>
          <div className="ac-a4-footer">
            <div className="ac-a4-sign">Validation RH</div>
            <div className="ac-a4-sign">Validation Opérations</div>
            <div className="ac-a4-sign">Décision finale</div>
          </div>
          <p className="ac-a4-confidential">AngelCare · Document confidentiel · Impression A4 corporate générée depuis le questionnaire HTML actif · {brief.docReference}</p>
        </footer>
      </div>
    </section>
  );
}

async function getQuestionnaire(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(QUESTIONNAIRES_TABLE)
    .select("*")
    .eq("public_slug", slug)
    .maybeSingle();
  return { questionnaire: data as Row | null, error: error?.message };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ submitted?: string; duplicate?: string; error?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const submitted = query?.submitted === "1";
  const duplicate = query?.duplicate === "1";
  const { questionnaire, error } = await getQuestionnaire(slug);

  if (!questionnaire || error) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto mt-20 max-w-2xl rounded-[36px] border border-white/10 bg-white/10 p-8 text-center shadow-2xl">
          <FileCode2 className="mx-auto h-12 w-12 text-violet-200" />
          <h1 className="mt-5 text-3xl font-black">Assessment unavailable</h1>
          <p className="mt-3 text-sm font-bold leading-7 text-white/60">This HTML interview questionnaire does not exist or is not currently available.</p>
        </div>
      </main>
    );
  }

  const unavailable = text(questionnaire, ["status"], "draft") === "archived" || !questionnaire.is_public || isExpired(questionnaire);
  const rawHtml = String(questionnaire.html_code || "");
  const cleanHtml = assessmentHtml(rawHtml);
  const printBrief = buildA4PrintBrief(questionnaire, rawHtml);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f7f8fc] text-slate-900">
      <A4PrintSheet questionnaire={questionnaire} brief={printBrief} />
      <div className="ac-screen-only">
      <section className="ac-assessment-chrome border-b border-slate-200 bg-white">
        <div className="flex w-full flex-col gap-5 px-5 py-6 md:px-8 xl:flex-row xl:items-center xl:justify-between 2xl:px-12">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200"><Sparkles className="h-6 w-6" /></span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">AngelCare HR Online HTML Assessment</p>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">{text(questionnaire, ["title"], "Interview assessment")}</h1>
              <p className="mt-1 text-sm font-bold text-slate-500">{text(questionnaire, ["role_target"], "Candidate assessment")} · {text(questionnaire, ["department"], "Recruitment")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/assessments/interview/${slug}/print`} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5">
              Print A4 corporate
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600"><Clock3 className="h-4 w-4 text-violet-600" /> {text(questionnaire, ["duration_minutes"], "45")} minutes</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600"><Target className="h-4 w-4 text-violet-600" /> Pass score {text(questionnaire, ["pass_score"], "70")}%</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600"><Globe2 className="h-4 w-4 text-violet-600" /> {text(questionnaire, ["language"], "fr")}</span>
          </div>
        </div>
      </section>

      <div className="w-full px-4 py-6 md:px-8 2xl:px-12">
        <div className="ac-assessment-chrome mb-5 grid w-full gap-4 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-[30px] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300">
            <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-300" /><h2 className="text-base font-black">Assessment rules</h2></div>
            <p className="mt-3 text-sm font-bold leading-6 text-white/65">Complete every required field inside the custom HTML questionnaire. Your answers are stored securely for AngelCare recruitment review.</p>
          </section>
          <section className="rounded-[30px] border border-white bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-100">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">HTML capture logic</p>
            <p className="mt-3 text-sm font-bold leading-7 text-slate-600">Any input, textarea, radio, checkbox or select in the HTML code with a <span className="font-black text-slate-950">name</span> attribute is captured into the candidate response.</p>
          </section>
        </div>

        <section className="w-full rounded-[34px] border border-white bg-white p-4 shadow-2xl shadow-slate-200/70 ring-1 ring-slate-100 md:p-6">
          {submitted ? (
            <div className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-8 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
              <h2 className="mt-4 text-2xl font-black text-slate-950">Assessment submitted successfully</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm font-bold leading-7 text-slate-600">{duplicate ? "A previous submission already existed for this email, so the questionnaire was not submitted again." : "Thank you. AngelCare HR has received your HTML online assessment and will review your answers."}</p>
              <Link href="/" className="mt-5 inline-flex rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-xs font-black text-emerald-700">Close page</Link>
            </div>
          ) : unavailable ? (
            <div className="rounded-[30px] border border-amber-200 bg-amber-50 p-8 text-center">
              <LockKeyhole className="mx-auto h-12 w-12 text-amber-600" />
              <h2 className="mt-4 text-2xl font-black text-slate-950">Assessment is currently closed</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm font-bold leading-7 text-slate-600">Please contact the recruitment team if you believe this HTML assessment should be active.</p>
            </div>
          ) : (
            <form action={submitInterviewAssessment} className="w-full space-y-6">
              <input type="hidden" name="questionnaire_id" value={questionnaire.id} />
              <input type="hidden" name="slug" value={slug} />
              {query?.error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">Submission error: {query.error}</div>}

              <div className="ac-candidate-shell rounded-[30px] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-5 flex items-center gap-3"><UserCheck className="h-5 w-5 text-violet-600" /><h2 className="text-lg font-black text-slate-950">Candidate identity</h2></div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <input name="candidate_name" required placeholder="Full name" className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                  <input name="candidate_email" type="email" placeholder="Email" className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                  <input name="candidate_phone" placeholder="Phone" className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                  <input name="city" placeholder="City" className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                  <input name="desired_position" defaultValue={text(questionnaire, ["role_target"], "")} placeholder="Desired position" className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                </div>
              </div>

              <section className="w-full rounded-[30px] border border-slate-200 bg-white p-0 shadow-sm">
                <div className="ac-assessment-chrome flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">HTML questionnaire</p>
                    <h2 className="text-lg font-black text-slate-950">Complete the custom assessment below</h2>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-500"><FileCode2 className="h-3.5 w-3.5 text-violet-600" /> FULL WIDTH HTML/CSS</span>
                </div>
                <div className="ac-html-assessment-canvas w-full max-w-none overflow-visible" dangerouslySetInnerHTML={{ __html: cleanHtml }} />
              </section>

              <div className="ac-submit-shell space-y-4">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
                  <input required name="candidate_consent" type="checkbox" className="mt-1" />
                  I confirm that the information provided is accurate and I authorize AngelCare to process this assessment for recruitment purposes.
                </label>
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-4 text-sm font-black text-white shadow-xl shadow-violet-200 transition hover:-translate-y-0.5">
                  <Send className="h-4 w-4" /> Submit HTML online assessment
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
      </div>
    </main>
  );
}
