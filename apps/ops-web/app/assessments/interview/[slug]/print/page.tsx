import { createClient } from "@/lib/supabase/server";
import AutoPrintBar from "./AutoPrintBar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, any>;
const QUESTIONNAIRES_TABLE = "hr_interview_questionnaires";

function txt(row: Row | null, keys: string[], fallback = "—") {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return fallback;
}

function stripCodeFence(raw: string) {
  return String(raw || "")
    .trim()
    .replace(/^```(?:html|HTML)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function cleanText(raw: string) {
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

function extractTagTexts(html: string, tag: string) {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  return Array.from(html.matchAll(pattern)).map((match) => cleanText(match[1])).filter(Boolean);
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const item = cleanText(value);
    const key = item.toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function compact(value: string, max = 140) {
  const clean = cleanText(value);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
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

function buildBrief(questionnaire: Row | null) {
  const html = stripCodeFence(String(questionnaire?.html_code || ""));
  const docRefMatch = html.match(/\bAC-[A-Z0-9][A-Z0-9-]{6,}-V\d+\b/i);
  const h2 = unique(extractTagTexts(html, "h2"))
    .filter((item) => !/informations? candidat|identit|évaluation complétée|candidate identity/i.test(item));
  const h3 = unique(extractTagTexts(html, "h3"))
    .filter((item) => !/nom complet|téléphone|email|ville|disponibilit|candidate|signature/i.test(item))
    .map((item) => compact(item, 148));
  const tags = unique(Array.from(html.matchAll(/<span[^>]*class=["'][^"']*ac-pill[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)).map((match) => match[1]))
    .filter((item) => !/scénario|scenario|question|\d+\s*\/\s*\d+/i.test(item));
  const scenarioCount = (html.match(/Sc[ée]nario\s*\d+\s*\/\s*\d+/gi) || []).length || h3.length;
  const openQuestionCount = (html.match(/Question\s*\d+\s*\/\s*\d+/gi) || []).length;

  const role = txt(questionnaire, ["role_target"], "Strategic Marketing & Communication Digital Officer Polyvalent et Performant");
  const isMarketing = /marketing|communication|digital/i.test(`${role} ${txt(questionnaire, ["department"], "")}`);

  return {
    docRef: docRefMatch?.[0] || txt(questionnaire, ["questionnaire_code"], isMarketing ? "AC-HR-IQ-MCDO-2026-V1" : "AC-HR-IQ-PRINT-V1"),
    title: txt(questionnaire, ["title"], "Questionnaire d’entretien"),
    role,
    department: txt(questionnaire, ["department"], isMarketing ? "Marketing / Communication" : "HR Recruitment"),
    language: txt(questionnaire, ["language"], "fr"),
    duration: txt(questionnaire, ["duration_minutes"], "45"),
    passScore: txt(questionnaire, ["pass_score"], "70"),
    version: txt(questionnaire, ["html_version"], "1"),
    sections: h2.slice(0, 6),
    scenarios: h3.slice(0, 12),
    tags: tags.slice(0, 18),
    scenarioCount,
    openQuestionCount,
    isMarketing,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { questionnaire, error } = await getQuestionnaire(slug);

  if (!questionnaire || error) {
    return (
      <main className="ac-error-page">
        <h1>Questionnaire introuvable</h1>
        <p>Impossible de générer la synthèse A4 pour ce questionnaire.</p>
      </main>
    );
  }

  const brief = buildBrief(questionnaire);
  const fallbackTags = brief.isMarketing
    ? ["Stratégie", "Marque", "Contenu", "Copywriting", "Campagnes", "Funnel", "CRM", "B2B", "Réputation", "Data", "Reporting", "Ownership"]
    : ["Priorisation", "Dispatch", "Urgence", "Communication", "Qualité", "Contrôle", "CareLink", "Leadership", "Éthique", "Reporting", "Stress", "Ownership"];

  const objective = brief.isMarketing
    ? "Évaluer la capacité du candidat à construire une communication premium, générer des leads qualifiés, piloter des campagnes digitales, soutenir la conversion commerciale et transformer la marque AngelCare en actif de confiance et de performance."
    : "Évaluer la capacité du candidat à sécuriser le dispatch, prioriser les urgences, protéger l’expérience client, contrôler les données, encadrer les intervenantes et prendre des décisions fiables sous pression.";

  const quickRead = brief.isMarketing
    ? "Le candidat doit démontrer une approche business-first : la beauté visuelle ne suffit pas. Les meilleurs profils relient marque, confiance, acquisition, conversion, reporting, coordination commerciale et amélioration continue."
    : "Le candidat doit démontrer calme, rigueur, sens du risque, traçabilité et ownership. Les meilleurs profils décident vite sans perdre la qualité, la sécurité opérationnelle et la communication client.";

  const practicalCase = brief.isMarketing
    ? "Cas pratique recommandé : créer un post premium, une séquence WhatsApp de conversion, une idée de campagne Meta avec petit budget et un mini reporting KPI hebdomadaire."
    : "Cas pratique recommandé : rejouer deux incidents de dispatch en entretien live, demander une priorisation minute par minute et valider la qualité de communication client/intervenante.";

  return (
    <main className="ac-print-root">
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { margin: 0; background: #e5e7eb; color: #0f172a; font-family: Calibri, Arial, sans-serif; }
        .ac-error-page { min-height: 100vh; display: grid; place-items: center; text-align: center; font-family: Arial, sans-serif; }
        .ac-printbar { position: sticky; top: 0; z-index: 20; display: flex; justify-content: center; gap: 12px; padding: 14px; background: #0f172a; box-shadow: 0 14px 30px rgba(15,23,42,.18); }
        .ac-printbar a, .ac-printbar button { border: 1px solid rgba(255,255,255,.18); border-radius: 999px; background: #ffffff; color: #0f172a; padding: 10px 16px; font: 800 13px Inter, Arial, sans-serif; text-decoration: none; cursor: pointer; }
        .ac-paper-wrap { width: 210mm; min-height: 297mm; margin: 18px auto; background: #ffffff; box-shadow: 0 30px 80px rgba(15,23,42,.18); }
        .ac-a4-page { width: 210mm; height: 297mm; overflow: hidden; padding: 8mm; box-sizing: border-box; background: #ffffff; }
        .ac-a4-frame { height: 281mm; border: 0.35mm solid #0f172a; padding: 4.5mm; box-sizing: border-box; display: flex; flex-direction: column; gap: 3.2mm; overflow: hidden; }
        .ac-a4-header { display: grid; grid-template-columns: 25mm 1fr 52mm; gap: 4mm; align-items: stretch; border-bottom: 0.35mm solid #0f172a; padding-bottom: 3mm; }
        .ac-logo-box { border: 0.25mm solid #cbd5e1; display: flex; align-items: center; justify-content: center; padding: 2mm; }
        .ac-logo-box img { max-width: 100%; max-height: 17mm; object-fit: contain; }
        .ac-kicker { margin: 0 0 1.2mm; color: #1d4ed8; font-size: 7pt; font-weight: 700; letter-spacing: 1.55pt; text-transform: uppercase; }
        .ac-title { margin: 0; font-size: 10pt; line-height: 1.06; font-weight: 700; text-transform: uppercase; color: #020617; }
        .ac-role { margin: 1.5mm 0 0; font-size: 8pt; line-height: 1.14; font-weight: 700; color: #334155; }
        .ac-ref { border-left: 0.35mm solid #0f172a; padding-left: 3mm; font-size: 7.15pt; line-height: 1.18; color: #1e293b; }
        .ac-ref strong { display: block; font-size: 8pt; color: #020617; margin-bottom: 1mm; }
        .ac-band { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1.5mm; }
        .ac-chip { border: 0.25mm solid #cbd5e1; padding: 1.55mm; min-height: 11.5mm; box-sizing: border-box; }
        .ac-chip span { display: block; font-size: 6.3pt; letter-spacing: .65pt; text-transform: uppercase; font-weight: 700; color: #64748b; }
        .ac-chip strong { display: block; margin-top: .8mm; font-size: 7.6pt; line-height: 1.08; color: #020617; }
        .ac-two { display: grid; grid-template-columns: 1.05fr .95fr; gap: 3mm; }
        .ac-block { border: 0.25mm solid #cbd5e1; padding: 2.35mm; box-sizing: border-box; }
        .ac-block h2 { margin: 0 0 1.4mm; font-size: 8.3pt; line-height: 1; letter-spacing: .9pt; text-transform: uppercase; color: #020617; font-weight: 700; }
        .ac-block p, .ac-block li { margin: 0; font-size: 7.05pt; line-height: 1.18; color: #1e293b; }
        .ac-block ul { margin: 0; padding-left: 4mm; }
        .ac-block li { margin-bottom: .9mm; }
        .ac-tags { display: flex; flex-wrap: wrap; gap: 1.15mm; }
        .ac-tag { border: 0.25mm solid #cbd5e1; background: #f8fafc; padding: 1mm 1.45mm; font-size: 6.85pt; line-height: 1; font-weight: 700; color: #0f172a; }
        .ac-table { width: 100%; border-collapse: collapse; font-size: 6.85pt; }
        .ac-table th { background: #0f172a; color: #ffffff; border: 0.2mm solid #0f172a; padding: 1.1mm; text-align: left; font-weight: 700; }
        .ac-table td { border: 0.2mm solid #cbd5e1; padding: 1mm; vertical-align: top; line-height: 1.14; }
        .ac-scenarios { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25mm 3mm; counter-reset: scenario; list-style: none; margin: 0; padding: 0; }
        .ac-scenarios li { counter-increment: scenario; position: relative; padding-left: 5mm; min-height: 5.7mm; border-bottom: 0.2mm solid #e2e8f0; font-size: 6.7pt; line-height: 1.13; }
        .ac-scenarios li:before { content: counter(scenario); position: absolute; left: 0; top: .1mm; width: 3.4mm; height: 3.4mm; border-radius: 50%; background: #0f172a; color: #fff; font-size: 5.8pt; line-height: 3.4mm; text-align: center; font-weight: 700; }
        .ac-mini-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.2mm; }
        .ac-mini { border: 0.25mm solid #cbd5e1; padding: 1.8mm; min-height: 12.5mm; }
        .ac-mini strong { display: block; font-size: 7.5pt; line-height: 1.1; margin-bottom: .8mm; }
        .ac-mini span { display: block; font-size: 6.65pt; line-height: 1.14; color: #334155; }
        .ac-footer { margin-top: auto; border-top: 0.35mm solid #0f172a; padding-top: 2mm; }
        .ac-signs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2mm; }
        .ac-sign { height: 11.5mm; border: 0.25mm dashed #94a3b8; padding: 1.4mm; font-size: 6.8pt; font-weight: 700; color: #475569; }
        .ac-note { margin: 1.6mm 0 0; text-align: center; font-size: 6.3pt; line-height: 1.05; color: #64748b; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { width: 210mm !important; height: 297mm !important; margin: 0 !important; padding: 0 !important; background: #fff !important; overflow: hidden !important; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .ac-paper-wrap { margin: 0 !important; width: 210mm !important; min-height: 297mm !important; box-shadow: none !important; }
          .ac-a4-page { width: 210mm !important; height: 297mm !important; padding: 8mm !important; page-break-after: avoid !important; page-break-before: avoid !important; page-break-inside: avoid !important; }
        }
      ` }} />
      <AutoPrintBar backHref={`/assessments/interview/${slug}`} />
      <section className="ac-paper-wrap">
        <div className="ac-a4-page">
          <div className="ac-a4-frame">
            <header className="ac-a4-header">
              <div className="ac-logo-box"><img src="/logo.png" alt="AngelCare" /></div>
              <div>
                <p className="ac-kicker">AngelCare · HR Recruitment Assessment</p>
                <h1 className="ac-title">Synthèse A4 — Questionnaire d’entretien</h1>
                <p className="ac-role">Poste : {brief.role}</p>
              </div>
              <aside className="ac-ref">
                <strong>Référence document</strong>
                {brief.docRef}<br />
                Version HTML : {brief.version}<br />
                Format : A4 ISO · Calibri<br />
                Confidentialité : Interne RH
              </aside>
            </header>

            <section className="ac-band">
              <div className="ac-chip"><span>Département</span><strong>{brief.department}</strong></div>
              <div className="ac-chip"><span>Langue</span><strong>{brief.language.toUpperCase()}</strong></div>
              <div className="ac-chip"><span>Durée</span><strong>{brief.duration} min</strong></div>
              <div className="ac-chip"><span>Score cible</span><strong>{brief.passScore}%</strong></div>
              <div className="ac-chip"><span>Structure</span><strong>{brief.openQuestionCount || 3} Q · {brief.scenarioCount || 24} scénarios</strong></div>
            </section>

            <section className="ac-two">
              <div className="ac-block"><h2>Objectif du test</h2><p>{objective}</p></div>
              <div className="ac-block"><h2>Structure d’évaluation</h2><ul><li>10% questions ouvertes : vision, plan et indicateurs.</li><li>90% scénarios à choix multiples : jugement et réflexes.</li><li>Notation interne : score global + bande décisionnelle.</li><li>Aucune zone candidat à remplir sur cette fiche A4.</li></ul></div>
            </section>

            <section className="ac-block">
              <h2>Axes d’évaluation synchronisés</h2>
              <div className="ac-tags">
                {(brief.tags.length ? brief.tags : fallbackTags).slice(0, 18).map((tag) => <span className="ac-tag" key={tag}>{tag}</span>)}
              </div>
            </section>

            <section className="ac-block">
              <h2>Grille de lecture rapide</h2>
              <table className="ac-table">
                <thead><tr><th>Axe</th><th>Ce qui est recherché</th><th>Signal faible à challenger</th></tr></thead>
                <tbody>
                  <tr><td>Stratégie</td><td>Capacité à relier objectifs, cible, message, canal et résultat attendu.</td><td>Réponses limitées au design, aux likes ou à l’exécution sans logique.</td></tr>
                  <tr><td>Performance</td><td>Analyse des chiffres, priorisation des actions et amélioration continue.</td><td>Décisions basées sur intuition sans données ni hypothèse testable.</td></tr>
                  <tr><td>Communication</td><td>Ton premium, clarté, confiance, protection de l’image AngelCare.</td><td>Promesses vagues, langage agressif, absence de preuve ou de cadrage.</td></tr>
                  <tr><td>Ownership</td><td>Rigueur, correction rapide, reporting utile et responsabilité sur le résultat.</td><td>Blâme, attente passive, absence de suivi ou de documentation.</td></tr>
                </tbody>
              </table>
            </section>

            <section className="ac-block">
              <h2>Contenu condensé depuis la version HTML</h2>
              <ul className="ac-scenarios">
                {(brief.scenarios.length ? brief.scenarios : brief.sections).slice(0, 12).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section className="ac-mini-grid">
              <div className="ac-mini"><strong>≥ 88% · Très fort fit</strong><span>Profil autonome, structuré, orienté résultat et compatible avec un contexte premium exigeant.</span></div>
              <div className="ac-mini"><strong>78–87% · Fit solide</strong><span>Profil prometteur, à compléter par cas pratique et entretien final.</span></div>
              <div className="ac-mini"><strong>68–77% · Potentiel à valider</strong><span>Profil à challenger sur exécution, rigueur, reporting et maturité terrain.</span></div>
            </section>

            <section className="ac-two">
              <div className="ac-block"><h2>Lecture RH rapide</h2><p>{quickRead}</p></div>
              <div className="ac-block"><h2>Cas pratique recommandé</h2><p>{practicalCase}</p></div>
            </section>

            <footer className="ac-footer">
              <div className="ac-signs"><div className="ac-sign">Validation RH / Date</div><div className="ac-sign">Validation Direction</div><div className="ac-sign">Décision finale / Commentaire</div></div>
              <p className="ac-note">AngelCare · Document confidentiel · Synthèse A4 corporate générée depuis le questionnaire HTML actif · {brief.docRef}</p>
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}
