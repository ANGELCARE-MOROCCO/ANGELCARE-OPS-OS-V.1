"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  Copy,
  FileText,
  Gauge,
  Globe,
  LayoutGrid,
  Lightbulb,
  Link2,
  ListChecks,
  Megaphone,
  PenTool,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  Wand2,
} from "lucide-react"
import {
  calcConv,
  calcRead,
  calcSeo,
  emptySeoItem,
  SEO_AUDIENCES,
  SEO_MARKETS,
  SEO_OWNERS,
  SEO_TYPES,
  slugify,
  upsertSeoItem,
  type SeoItem,
  type SeoPriority,
  type SeoType,
} from "./seo-blog-workspace-lib"

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ")
}

const input =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-50"
const button =
  "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
const panel =
  "rounded-[2.2rem] border border-slate-200 bg-white p-5 text-slate-950 shadow-sm"

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="space-y-1.5">
      <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">{label}</span>
      {children}
      {hint ? <span className="block text-xs font-bold text-slate-500">{hint}</span> : null}
    </label>
  )
}

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "pink" | "green" | "amber" | "red" | "violet" | "blue" }) {
  const m = {
    slate: "border-slate-200 bg-slate-100 text-slate-700",
    pink: "border-pink-200 bg-pink-50 text-pink-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  }
  return <span className={cn("rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide", m[tone])}>{children}</span>
}

type Scenario = {
  id: string
  name: string
  type: SeoType
  audience: string
  market: string
  service: string
  keyword: string
  intent: string
  title: string
  meta: string
  outline: string
  priority: SeoPriority
}

const scenarios: Scenario[] = [
  { id: "parent-trust", name: "Parents seeking trustworthy care", type: "blog", audience: "Parents B2C", market: "Morocco", service: "Garde d'enfants", keyword: "garde d'enfants fiable", intent: "Find a trustworthy childcare solution.", title: "Comment choisir une garde d’enfants fiable au Maroc", meta: "Découvrez comment choisir une garde d’enfants fiable, organisée et adaptée à votre famille avec AngelCare.", priority: "high", outline: "H1: Comment choisir une garde d’enfants fiable\nH2: Les critères essentiels\nH2: Les erreurs à éviter\nH2: Pourquoi AngelCare\nH2: FAQ\nH2: CTA WhatsApp" },
  { id: "partner-b2b", name: "Partner acquisition article", type: "landing_page", audience: "Partners B2B", market: "Morocco", service: "Partenariat AngelCare", keyword: "partenariat services famille", intent: "Find partnership opportunity.", title: "Devenir partenaire AngelCare : opportunité de croissance locale", meta: "Découvrez comment collaborer avec AngelCare pour développer des services fiables aux familles.", priority: "urgent", outline: "H1: Devenir partenaire AngelCare\nH2: Pourquoi ce marché\nH2: Avantages partenaires\nH2: Processus\nH2: Demander un rendez-vous" },
  { id: "service-page", name: "Service page SEO", type: "service_page", audience: "Families", market: "Morocco", service: "Accompagnement famille", keyword: "services familles Maroc", intent: "Compare family services.", title: "Services AngelCare pour les familles", meta: "AngelCare accompagne les familles avec des services organisés, humains et adaptés à leurs besoins.", priority: "high", outline: "H1: Services AngelCare\nH2: Pour qui\nH2: Nos services\nH2: Méthode\nH2: Contact" },
  { id: "faq", name: "FAQ search demand", type: "faq", audience: "Parents B2C", market: "Morocco", service: "Support famille", keyword: "questions garde enfants", intent: "Get answers before buying.", title: "FAQ AngelCare : réponses aux questions des familles", meta: "Toutes les réponses utiles pour comprendre les services AngelCare et préparer votre demande.", priority: "normal", outline: "H1: FAQ AngelCare\nH2: Prix\nH2: Sécurité\nH2: Organisation\nH2: Contact" },
  { id: "guide", name: "Long-form educational guide", type: "guide", audience: "Parents B2C", market: "France", service: "Conseil famille", keyword: "guide organisation familiale", intent: "Learn how to organize family care.", title: "Guide complet pour organiser l’aide familiale", meta: "Un guide pratique pour structurer l’aide familiale et choisir les bons services.", priority: "normal", outline: "H1: Guide organisation familiale\nH2: Diagnostic\nH2: Solutions\nH2: Checklists\nH2: AngelCare" },
  { id: "case-study", name: "Case study conversion", type: "case_study", audience: "Partners B2B", market: "UAE", service: "Partenariat AngelCare", keyword: "family services case study", intent: "Evaluate proof before partnership.", title: "Étude de cas : structurer un service famille premium", meta: "Découvrez comment un modèle organisé améliore l’expérience famille et la conversion.", priority: "high", outline: "H1: Étude de cas\nH2: Problème\nH2: Solution\nH2: Résultats\nH2: Contact" },
  { id: "news", name: "Market news post", type: "news", audience: "Investors", market: "Global", service: "AngelCare", keyword: "marché services familles", intent: "Understand market trend.", title: "Le marché des services aux familles évolue rapidement", meta: "Analyse rapide des tendances du marché des services aux familles et opportunités AngelCare.", priority: "normal", outline: "H1: Tendance marché\nH2: Pourquoi maintenant\nH2: Besoin client\nH2: Opportunité" },
  { id: "press", name: "Press style announcement", type: "press", audience: "Corporate HR", market: "Morocco", service: "AngelCare Corporate", keyword: "solution famille entreprise", intent: "Discover corporate family solution.", title: "AngelCare lance une approche organisée pour les familles actives", meta: "AngelCare présente une solution structurée pour accompagner les familles et les organisations.", priority: "normal", outline: "H1: Communiqué\nH2: Le besoin\nH2: La solution\nH2: Contact presse" },
  { id: "whatsapp-cta", name: "WhatsApp conversion page", type: "landing_page", audience: "Parents B2C", market: "Morocco", service: "Orientation WhatsApp", keyword: "aide famille whatsapp", intent: "Contact quickly.", title: "Besoin d’une aide familiale ? Contactez AngelCare sur WhatsApp", meta: "Recevez une orientation rapide et adaptée via WhatsApp avec AngelCare.", priority: "urgent", outline: "H1: Contact WhatsApp AngelCare\nH2: Pourquoi écrire\nH2: Réponse rapide\nH2: Services disponibles" },
  { id: "comparison", name: "Comparison buying intent", type: "blog", audience: "Parents B2C", market: "Morocco", service: "Garde d'enfants", keyword: "nounou ou service garde enfants", intent: "Compare options.", title: "Nounou indépendante ou service organisé : que choisir ?", meta: "Comparez les avantages d’un service organisé AngelCare face aux solutions indépendantes.", priority: "high", outline: "H1: Nounou ou service organisé\nH2: Risques\nH2: Avantages\nH2: Comment choisir" },
  { id: "school-partners", name: "School partnership", type: "landing_page", audience: "Schools", market: "Morocco", service: "Partenariat écoles", keyword: "partenariat école familles", intent: "Explore school partnership.", title: "Partenariat écoles et familles avec AngelCare", meta: "AngelCare aide les écoles à mieux orienter les familles vers des services adaptés.", priority: "normal", outline: "H1: Partenariat écoles\nH2: Besoin familles\nH2: Avantages école\nH2: Processus" },
  { id: "healthcare", name: "Healthcare partner content", type: "service_page", audience: "Healthcare partners", market: "Morocco", service: "Coordination famille santé", keyword: "support famille santé", intent: "Find support services.", title: "Support familial autour de la santé avec AngelCare", meta: "AngelCare accompagne les familles dans l’organisation et l’orientation de leur support quotidien.", priority: "normal", outline: "H1: Support famille santé\nH2: Besoins\nH2: Coordination\nH2: Contact" },
  { id: "ksa-growth", name: "KSA market growth", type: "guide", audience: "Families", market: "KSA", service: "AngelCare KSA", keyword: "family care services KSA", intent: "Explore services in KSA.", title: "Family care services in KSA: what families need", meta: "A practical guide for understanding family care services and structured support in KSA.", priority: "normal", outline: "H1: Family care KSA\nH2: Demand\nH2: Service model\nH2: AngelCare approach" },
  { id: "qatar-premium", name: "Qatar premium families", type: "landing_page", audience: "Families", market: "Qatar", service: "Premium family support", keyword: "premium family support Qatar", intent: "Find premium support.", title: "Premium family support services in Qatar", meta: "AngelCare-style structured family support for premium needs, trust and organization.", priority: "high", outline: "H1: Premium family support\nH2: Needs\nH2: Trust model\nH2: CTA" },
  { id: "france-expat", name: "France expat families", type: "blog", audience: "Families", market: "France", service: "Support familles expatriées", keyword: "aide famille expatriée France", intent: "Get family support abroad.", title: "Aide aux familles expatriées en France : organiser son quotidien", meta: "Conseils pour les familles expatriées cherchant une organisation fiable et un accompagnement adapté.", priority: "normal", outline: "H1: Familles expatriées\nH2: Défis\nH2: Solutions\nH2: AngelCare" },
  { id: "spain-market", name: "Spain market awareness", type: "blog", audience: "Families", market: "Spain", service: "Family assistance", keyword: "family assistance Spain", intent: "Discover services.", title: "Family assistance in Spain: how to choose structured support", meta: "A practical overview of family assistance needs and structured support options in Spain.", priority: "low", outline: "H1: Family assistance Spain\nH2: Needs\nH2: Selection criteria\nH2: Contact" },
  { id: "roi-corporate", name: "Corporate HR ROI", type: "case_study", audience: "Corporate HR", market: "Morocco", service: "AngelCare Corporate", keyword: "family support employee benefit", intent: "Measure HR benefit.", title: "Pourquoi le support familial devient un avantage RH stratégique", meta: "Découvrez pourquoi les entreprises considèrent le support familial comme un levier RH utile.", priority: "high", outline: "H1: Avantage RH\nH2: Impact employés\nH2: Organisation\nH2: AngelCare Corporate" },
  { id: "pricing-intent", name: "Pricing intent", type: "faq", audience: "Parents B2C", market: "Morocco", service: "Services AngelCare", keyword: "prix garde enfants Maroc", intent: "Understand pricing.", title: "Combien coûte un service de garde d’enfants organisé ?", meta: "Comprendre les facteurs de prix d’un service organisé et fiable pour les familles.", priority: "high", outline: "H1: Prix garde enfants\nH2: Facteurs\nH2: Ce qui est inclus\nH2: Demander un devis" },
  { id: "testimonial", name: "Testimonial blog", type: "blog", audience: "Parents B2C", market: "Morocco", service: "AngelCare", keyword: "avis service famille", intent: "Look for proof.", title: "Pourquoi les familles recherchent des services fiables et humains", meta: "Un contenu orienté preuve et confiance pour aider les familles à choisir un accompagnement adapté.", priority: "normal", outline: "H1: Services fiables\nH2: Besoin confiance\nH2: Témoignages\nH2: CTA" },
  { id: "automation-seo", name: "Automation internal article", type: "guide", audience: "Partners B2B", market: "Global", service: "AngelCare Operations", keyword: "automated family services operations", intent: "Understand operating model.", title: "How automation supports structured family services operations", meta: "A strategic guide about automation, workflows and quality control in family services operations.", priority: "low", outline: "H1: Automation operations\nH2: Workflows\nH2: Quality\nH2: Reporting" },
]

const assistantPrompts = [
  { id: "title", label: "Generate 5 titles", icon: PenTool },
  { id: "meta", label: "Generate meta", icon: Search },
  { id: "outline", label: "Build outline", icon: ListChecks },
  { id: "body", label: "Draft starter body", icon: BookOpen },
  { id: "links", label: "Internal links", icon: Link2 },
  { id: "faq", label: "FAQ block", icon: Lightbulb },
]

export default function SeoBlogCreatePage() {
  const [form, setForm] = useState<SeoItem>({ ...emptySeoItem, id: `seo-${Date.now()}` })
  const [createdId, setCreatedId] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("Create a real SEO/blog task with keyword, metadata, brief and publishing controls.")
  const [selectedScenario, setSelectedScenario] = useState("")
  const [assistantOutput, setAssistantOutput] = useState("")
  const [copied, setCopied] = useState("")

  function set<K extends keyof SeoItem>(k: K, v: SeoItem[K]) {
    setForm((f) => {
      const next = { ...f, [k]: v }
      if (k === "title" && !f.slug) next.slug = slugify(String(v))
      return next
    })
  }

  function applyScenario(id: string) {
    const s = scenarios.find((x) => x.id === id)
    if (!s) return
    setSelectedScenario(id)
    setForm((f) => ({
      ...f,
      title: s.title,
      slug: slugify(s.title),
      content_type: s.type,
      audience: s.audience,
      market: s.market,
      service_name: s.service,
      primary_keyword: s.keyword,
      search_intent: s.intent,
      meta_title: `${s.title} | AngelCare`,
      meta_description: s.meta,
      outline: s.outline,
      priority: s.priority,
      updated_at: new Date().toISOString(),
    }))
    setMessage(`Scenario applied: ${s.name}`)
  }

  function runAssistant(kind: string) {
    const service = form.service_name || "AngelCare service"
    const keyword = form.primary_keyword || "main keyword"
    const title = form.title || "AngelCare SEO article"

    const outputs: Record<string, string> = {
      title: `1. ${title}\n2. Guide complet: ${keyword}\n3. Comment choisir ${service}\n4. ${keyword}: critères, erreurs et conseils\n5. Pourquoi AngelCare pour ${service}`,
      meta: `Meta title: ${title} | AngelCare\nMeta description: Découvrez ${service} avec une approche fiable, humaine et organisée. AngelCare vous aide à choisir une solution adaptée.`,
      outline: `H1: ${title}\nH2: Comprendre le besoin\nH2: Les critères essentiels\nH2: Les erreurs à éviter\nH2: L’approche AngelCare\nH2: FAQ\nH2: CTA WhatsApp / devis`,
      body: `Introduction\n\nLe besoin autour de ${service} demande une solution claire, fiable et organisée. Cet article aide le lecteur à comprendre les critères essentiels, les risques à éviter et les étapes pour choisir une solution adaptée.\n\nApproche AngelCare\n\nAngelCare met l’accent sur la confiance, l’organisation, la clarté du service et l’orientation rapide.\n\nConclusion\n\nPour recevoir une orientation personnalisée, contactez AngelCare via WhatsApp ou demandez un devis.`,
      links: `/services\n/contact\n/testimonials\n/blog\n/service/${slugify(service) || "angelcare-service"}`,
      faq: `FAQ\n\nQ: Comment choisir ${service} ?\nR: Vérifiez la clarté de l’offre, l’organisation, les preuves de confiance et le support.\n\nQ: Comment contacter AngelCare ?\nR: Via WhatsApp, formulaire ou demande de devis.\n\nQ: Le service est-il adapté aux familles ?\nR: L’objectif est d’orienter chaque famille vers une solution adaptée.`,
    }
    setAssistantOutput(outputs[kind] || "")
  }

  function applyAssistantToForm() {
    if (!assistantOutput) return
    const output = assistantOutput
    if (output.startsWith("Meta title:")) {
      const lines = output.split("\n")
      setForm((f) => ({
        ...f,
        meta_title: lines[0]?.replace("Meta title: ", "") || f.meta_title,
        meta_description: lines[1]?.replace("Meta description: ", "") || f.meta_description,
      }))
    } else if (output.includes("H1:")) {
      setForm((f) => ({ ...f, outline: `${f.outline}\n\n${output}`.trim() }))
    } else if (output.includes("/services")) {
      setForm((f) => ({ ...f, internal_links: `${f.internal_links}\n\n${output}`.trim() }))
    } else if (output.includes("Introduction")) {
      setForm((f) => ({ ...f, draft_body: `${f.draft_body}\n\n${output}`.trim() }))
    } else {
      setForm((f) => ({ ...f, review_notes: `${f.review_notes}\n\n${output}`.trim() }))
    }
    setMessage("Assistant output applied to task.")
  }

  async function copyAssistant() {
    await navigator.clipboard?.writeText(assistantOutput)
    setCopied("Copied assistant output.")
    setTimeout(() => setCopied(""), 1600)
  }

  function create() {
    if (!form.title.trim()) return setMessage("Title is required.")
    setBusy(true)
    const next = {
      ...form,
      id: form.id || `seo-${Date.now()}`,
      slug: form.slug || slugify(form.title),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const scored = {
      ...next,
      seo_score: calcSeo(next),
      readability_score: calcRead(next),
      conversion_score: calcConv(next),
    }
    upsertSeoItem(scored)
    setCreatedId(scored.id)
    setMessage("SEO/blog task created and synced locally.")
    fetch("/api/market-os/seo-blog-workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scored),
    }).catch(() => {})
    setBusy(false)
  }

  const readiness = calcSeo(form)
  const read = calcRead(form)
  const conv = calcConv(form)
  const selectedPreset = scenarios.find((x) => x.id === selectedScenario)

  const checklist = useMemo(() => [
    ["Title", !!form.title],
    ["Slug", !!form.slug],
    ["Keyword", !!form.primary_keyword],
    ["Intent", !!form.search_intent],
    ["Meta", !!form.meta_title && !!form.meta_description],
    ["Outline", !!form.outline],
    ["Draft", !!form.draft_body],
    ["Links", !!form.internal_links],
    ["CTA", conv > 0],
  ], [form, conv])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe4f0,transparent_30%),linear-gradient(180deg,#f8fafc,#eef2f7)] p-5 text-slate-950 md:p-8">
      <section className="mx-auto max-w-[1750px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/market-os/seo-blog-workspace" className={cn(button, "border border-slate-200 bg-white text-slate-900 shadow-sm")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to SEO center
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/market-os/seo-blog-workspace/calendar" className={cn(button, "border border-slate-200 bg-white text-slate-900")}>
              <CalendarDays className="mr-2 h-4 w-4" /> Editorial calendar
            </Link>
            {createdId ? (
              <Link href={`/market-os/seo-blog-workspace/${createdId}`} className={cn(button, "bg-pink-600 text-white")}>
                Open created task
              </Link>
            ) : null}
          </div>
        </div>

        <header className="overflow-hidden rounded-[2.7rem] border border-slate-900 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,.28),transparent_34%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] text-white shadow-2xl">
          <div className="grid gap-6 p-7 xl:grid-cols-[1.2fr_.9fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="pink">SEO creation studio</Badge>
                <Badge tone="violet">Scenario presets</Badge>
                <Badge tone="green">AI assistant panel</Badge>
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl" style={{ color: "#fff" }}>
                Build a complete SEO / Blog production task
              </h1>
              <p className="mt-4 max-w-4xl text-sm font-semibold leading-7" style={{ color: "rgba(255,255,255,.85)" }}>
                Use presets, keyword strategy, metadata, SERP preview, AI-assisted content blocks, linking plans and publishing controls to create production-ready SEO work.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button disabled={busy || !form.title.trim()} onClick={create} className={cn(button, "bg-pink-600 text-white shadow-lg shadow-pink-500/20")}>
                  <Save className="mr-2 h-4 w-4" /> Create & sync task
                </button>
                <button onClick={() => applyScenario("parent-trust")} className={cn(button, "border border-white/15 bg-white/10 text-white")}>
                  <Sparkles className="mr-2 h-4 w-4" /> Quick trust article
                </button>
                <button onClick={() => runAssistant("meta")} className={cn(button, "border border-white/15 bg-white/10 text-white")}>
                  <Brain className="mr-2 h-4 w-4" /> Generate meta
                </button>
              </div>
              <p className="mt-4 text-sm font-bold" style={{ color: "rgba(255,255,255,.78)" }}>{message}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                ["SEO", readiness, Target],
                ["Read", read, BookOpen],
                ["CTA", conv, Megaphone],
              ].map(([label, value, Icon]: any) => (
                <div key={label} className="rounded-[1.7rem] border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur">
                  <Icon className="h-5 w-5 text-pink-200" />
                  <p className="mt-4 text-xs font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,.72)" }}>{label}</p>
                  <p className="mt-1 text-4xl font-black" style={{ color: "#fff" }}>{value}%</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-pink-500" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[.85fr_1.2fr_.8fr]">
          <aside className="space-y-6">
            <section className={panel}>
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <LayoutGrid className="h-5 w-5 text-pink-600" /> 20 preconfigured scenarios
              </h2>
              <p className="mt-2 text-sm font-bold text-slate-500">
                Select a situation to prefill title, keyword, intent, meta, service, audience and outline.
              </p>
              <div className="mt-5 max-h-[560px] space-y-2 overflow-auto pr-1">
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => applyScenario(s.id)}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5",
                      selectedScenario === s.id ? "border-pink-300 bg-pink-50 ring-4 ring-pink-50" : "border-slate-200 bg-slate-50 hover:bg-white",
                    )}
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={s.priority === "urgent" ? "red" : s.priority === "high" ? "amber" : "blue"}>{s.priority}</Badge>
                      <Badge tone="pink">{SEO_TYPES[s.type]}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-black text-slate-950">{s.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{s.keyword} · {s.market}</p>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="space-y-6">
            <section className={panel}>
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <FileText className="h-5 w-5 text-pink-600" /> Core SEO task configuration
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Title">
                  <input className={input} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex: Comment choisir une garde d’enfants fiable" />
                </Field>
                <Field label="Slug">
                  <input className={input} value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder="seo-url-slug" />
                </Field>
                <Field label="Content type">
                  <select className={input} value={form.content_type} onChange={(e) => set("content_type", e.target.value as SeoType)}>
                    {Object.entries(SEO_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Priority">
                  <select className={input} value={form.priority} onChange={(e) => set("priority", e.target.value as SeoPriority)}>
                    {["urgent", "high", "normal", "low"].map((x) => <option key={x}>{x}</option>)}
                  </select>
                </Field>
                <Field label="Owner">
                  <select className={input} value={form.owner} onChange={(e) => set("owner", e.target.value)}>
                    {SEO_OWNERS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </Field>
                <Field label="Service related to">
                  <input className={input} value={form.service_name} onChange={(e) => set("service_name", e.target.value)} placeholder="AngelCare service name" />
                </Field>
                <Field label="Market">
                  <select className={input} value={form.market} onChange={(e) => set("market", e.target.value)}>
                    {SEO_MARKETS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </Field>
                <Field label="Audience">
                  <select className={input} value={form.audience} onChange={(e) => set("audience", e.target.value)}>
                    {SEO_AUDIENCES.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </Field>
              </div>
            </section>

            <section className={panel}>
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <Search className="h-5 w-5 text-pink-600" /> Keyword, intent & metadata
              </h2>
              <div className="mt-5 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Primary keyword">
                    <input className={input} value={form.primary_keyword} onChange={(e) => set("primary_keyword", e.target.value)} placeholder="main SEO keyword" />
                  </Field>
                  <Field label="Secondary keywords">
                    <input className={input} value={form.secondary_keywords} onChange={(e) => set("secondary_keywords", e.target.value)} placeholder="comma-separated keywords" />
                  </Field>
                </div>
                <Field label="Search intent">
                  <textarea className={cn(input, "min-h-[95px]")} value={form.search_intent} onChange={(e) => set("search_intent", e.target.value)} placeholder="What is the user trying to solve?" />
                </Field>
                <Field label="Meta title">
                  <input className={input} value={form.meta_title} onChange={(e) => set("meta_title", e.target.value)} placeholder="50-60 char SEO title" />
                </Field>
                <Field label="Meta description">
                  <textarea className={cn(input, "min-h-[85px]")} value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} placeholder="150-160 char meta description" />
                </Field>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-lg font-black text-blue-700">{form.meta_title || form.title || "SERP title preview"}</p>
                  <p className="text-sm font-semibold text-emerald-700">angelcare.ma/{form.slug || "seo-url"}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{form.meta_description || "Meta description preview..."}</p>
                </div>
              </div>
            </section>

            <section className={panel}>
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <PenTool className="h-5 w-5 text-pink-600" /> Content production controls
              </h2>
              <div className="mt-5 grid gap-4">
                <Field label="Outline / H structure">
                  <textarea className={cn(input, "min-h-[150px]")} value={form.outline} onChange={(e) => set("outline", e.target.value)} placeholder="H1 / H2 / H3 structure" />
                </Field>
                <Field label="Draft body starter">
                  <textarea className={cn(input, "min-h-[220px]")} value={form.draft_body} onChange={(e) => set("draft_body", e.target.value)} placeholder="Opening, body content, FAQ, CTA..." />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Internal links plan">
                    <textarea className={cn(input, "min-h-[110px]")} value={form.internal_links} onChange={(e) => set("internal_links", e.target.value)} placeholder="/services, /contact, /testimonials..." />
                  </Field>
                  <Field label="External links / sources">
                    <textarea className={cn(input, "min-h-[110px]")} value={form.external_links} onChange={(e) => set("external_links", e.target.value)} placeholder="Trusted external sources..." />
                  </Field>
                </div>
              </div>
            </section>

            <section className={panel}>
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <Globe className="h-5 w-5 text-pink-600" /> Publishing configuration
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Canonical URL">
                  <input className={input} value={form.canonical_url} onChange={(e) => set("canonical_url", e.target.value)} placeholder="Canonical URL if needed" />
                </Field>
                <Field label="Publish URL">
                  <input className={input} value={form.publish_url} onChange={(e) => set("publish_url", e.target.value)} placeholder="Live URL after publish" />
                </Field>
                <Field label="Deadline">
                  <input className={input} value={form.deadline} onChange={(e) => set("deadline", e.target.value)} placeholder="Today 18:00 / This week" />
                </Field>
                <Field label="Review notes">
                  <input className={input} value={form.review_notes} onChange={(e) => set("review_notes", e.target.value)} placeholder="Manager instructions or conditions" />
                </Field>
              </div>
            </section>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2.2rem] border border-slate-900 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,.22),transparent_35%),linear-gradient(145deg,#020617,#0f172a)] p-5 text-white shadow-xl">
              <h2 className="flex items-center gap-2 text-xl font-black" style={{ color: "#fff" }}>
                <Brain className="h-5 w-5 text-pink-300" /> AI SEO assistant panel
              </h2>
              <p className="mt-2 text-sm font-bold" style={{ color: "rgba(255,255,255,.72)" }}>
                Generate selectable SEO outputs, then apply them to the form.
              </p>
              <div className="mt-5 grid gap-2">
                {assistantPrompts.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => runAssistant(id)} className={cn(button, "justify-start border border-white/10 bg-white/10 text-left text-white hover:bg-white/15")}>
                    <Icon className="mr-2 h-4 w-4 text-pink-200" /> {label}
                  </button>
                ))}
              </div>

              {assistantOutput ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <pre className="max-h-[260px] whitespace-pre-wrap text-xs font-bold leading-6" style={{ color: "rgba(255,255,255,.86)" }}>
                    {assistantOutput}
                  </pre>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={applyAssistantToForm} className={cn(button, "bg-pink-600 text-white")}>
                      <Wand2 className="mr-2 h-4 w-4" /> Apply
                    </button>
                    <button onClick={copyAssistant} className={cn(button, "border border-white/10 bg-white/10 text-white")}>
                      <Copy className="mr-2 h-4 w-4" /> Copy
                    </button>
                  </div>
                  {copied ? <p className="mt-2 text-xs font-bold text-white/70">{copied}</p> : null}
                </div>
              ) : null}
            </section>

            <section className={panel}>
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <Gauge className="h-5 w-5 text-pink-600" /> Production readiness
              </h2>
              <div className="mt-5 space-y-4">
                {[
                  ["SEO", readiness],
                  ["Readability", read],
                  ["Conversion", conv],
                ].map(([label, value]: any) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                      <span>{label}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-pink-500" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={panel}>
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <ListChecks className="h-5 w-5 text-pink-600" /> Creation checklist
              </h2>
              <div className="mt-5 space-y-3">
                {checklist.map(([label, ok]: any) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
                    <span>{label}</span>
                    <CheckCircle2 className={cn("h-4 w-4", ok ? "text-emerald-600" : "text-slate-300")} />
                  </div>
                ))}
              </div>
            </section>

            <section className={panel}>
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <ShieldCheck className="h-5 w-5 text-pink-600" /> Preset intelligence
              </h2>
              {selectedPreset ? (
                <div className="mt-4 space-y-3 text-sm font-bold text-slate-700">
                  <div className="rounded-2xl bg-slate-50 p-3">Scenario: {selectedPreset.name}</div>
                  <div className="rounded-2xl bg-slate-50 p-3">Intent: {selectedPreset.intent}</div>
                  <div className="rounded-2xl bg-slate-50 p-3">Market: {selectedPreset.market}</div>
                  <div className="rounded-2xl bg-slate-50 p-3">Audience: {selectedPreset.audience}</div>
                </div>
              ) : (
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                  Select one of the 20 scenarios to preload a full SEO direction.
                </p>
              )}
            </section>

            <button disabled={busy || !form.title.trim()} onClick={create} className={cn(button, "w-full bg-slate-950 text-white shadow-xl")}>
              <Save className="mr-2 h-4 w-4" /> Create & sync SEO task
            </button>
          </aside>
        </div>
      </section>
    </main>
  )
}