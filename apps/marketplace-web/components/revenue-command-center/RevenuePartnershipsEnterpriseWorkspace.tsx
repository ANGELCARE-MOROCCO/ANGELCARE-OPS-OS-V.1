"use client"
import { shouldStartAutoRefresh, safeRefreshInterval } from '@/lib/runtime/client-live-governor'

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type React from "react"

type PartnershipStatus = "target" | "qualified" | "meeting" | "proposal" | "agreement" | "active" | "growth" | "risk" | "recovery" | "lost"
type PartnershipKind = "preschool" | "kindergarten" | "corporate" | "clinic" | "academy" | "event_venue" | "agency" | "institution" | "supplier" | "referral_partner"
type EnterpriseTab = "overview" | "partners" | "pipeline" | "outreach" | "meetings" | "proposals" | "agreements" | "activation" | "referrals" | "performance" | "risk" | "insights"

type Partner = {
  id: string
  name: string
  organization: string
  city: string
  kind: PartnershipKind
  status: PartnershipStatus
  owner: string
  contact_name: string
  phone: string
  email: string
  value_mad: number
  probability: number
  health_score: number
  referral_potential: number
  next_action: string
  context: string
  source_prospect_id?: string | null
  last_activity?: string | null
  created_at?: string | null
  updated_at?: string | null
}

type Activity = { id: string; partner_id?: string | null; title: string; note: string; action: string; created_at: string }
type Metrics = { total: number; active: number; pipeline_mad: number; forecast_mad: number; high_value: number; risk: number; referral_potential: number; synced_prospects: number }
type ApiPayload = { ok: boolean; partners: Partner[]; activities: Activity[]; metrics: Metrics; sync?: { live: boolean; source: string; warning?: string } }
type ModalKind = "create" | "qualify" | "meeting" | "proposal" | "agreement" | "activate" | "referral" | "risk" | "note" | null

const tabs: Array<{ id: EnterpriseTab; label: string; subtitle: string }> = [
  { id: "overview", label: "Vue exécutive", subtitle: "Commandement partenariats" },
  { id: "partners", label: "Partenaires", subtitle: "Tous les comptes B2B" },
  { id: "pipeline", label: "Pipeline", subtitle: "Mouvement des étapes" },
  { id: "outreach", label: "Prospection", subtitle: "Comptes à activer" },
  { id: "meetings", label: "Rendez-vous", subtitle: "Agenda des décideurs" },
  { id: "proposals", label: "Propositions", subtitle: "Offres et formules" },
  { id: "agreements", label: "Accords", subtitle: "Contrats et engagements" },
  { id: "activation", label: "Activation", subtitle: "Mise en opération" },
  { id: "referrals", label: "Recommandations", subtitle: "Flux d’opportunités partenaire" },
  { id: "performance", label: "Performance", subtitle: "Revenu et santé" },
  { id: "risk", label: "Risques", subtitle: "Contrôle de récupération" },
  { id: "insights", label: "Intelligence", subtitle: "Lecture du marché" },
]

const statusFlow: PartnershipStatus[] = ["target", "qualified", "meeting", "proposal", "agreement", "active", "growth", "risk", "recovery", "lost"]
const menu = [
  ["Poste de commandement", "/revenue-command-center", "⌁"],
  ["Prospects et comptes", "/revenue-command-center/prospects/directory", "♙"],
  ["Partenariats", "/revenue-command-center/partnerships", "◇"],
  ["Tâches et actions", "/revenue-command-center/daily-tasks", "✓"],
  ["Rendez-vous", "/revenue-command-center/appointments", "▣"],
  ["Campagnes", "/revenue-command-center/campaigns", "✉"],
  ["Relances", "/revenue-command-center/follow-ups", "○"],
  ["Cartographie marché", "/revenue-command-center/market-mapping", "◎"],
  ["Analytics revenu", "/revenue-command-center/revenue-analytics", "▥"],
  ["Briefing exécutif", "/revenue-command-center/executive-briefing", "◈"],
] as const

function money(value: number) { return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(value || 0))} Dh` }
function title(v: string) { return v.replaceAll("_", " ").replace(/\b\w/g, m => m.toUpperCase()) }
function tone(status: PartnershipStatus) {
  if (["active", "growth"].includes(status)) return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (["proposal", "agreement", "meeting"].includes(status)) return "bg-blue-50 text-blue-700 border-blue-200"
  if (["risk", "recovery", "lost"].includes(status)) return "bg-rose-50 text-rose-700 border-rose-200"
  return "bg-slate-100 text-slate-700 border-slate-200"
}
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <section className={`rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_rgba(23,58,91,.07)] ${className}`}>{children}</section> }
function Button({ children, className = "", variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "danger" }) {
  const classes = variant === "primary" ? "bg-[#123f6e] text-white hover:bg-[#0d3158] shadow-[0_10px_24px_rgba(18,63,110,.16)]" : variant === "danger" ? "bg-rose-600 text-white hover:bg-rose-500" : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
  return <button {...props} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${classes} ${className}`}>{children}</button>
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${props.className || ""}`} /> }
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${props.className || ""}`} /> }
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={`min-h-[110px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${props.className || ""}`} /> }

function defaultPayload(): ApiPayload {
  return { ok: true, partners: [], activities: [], metrics: { total: 0, active: 0, pipeline_mad: 0, forecast_mad: 0, high_value: 0, risk: 0, referral_potential: 0, synced_prospects: 0 }, sync: { live: false, source: "loading" } }
}

export default function RevenuePartnershipsEnterpriseWorkspace({ initialTab = "overview" as EnterpriseTab }: { initialTab?: EnterpriseTab }) {
  const [payload, setPayload] = useState<ApiPayload>(() => defaultPayload())
  const [tab, setTab] = useState<EnterpriseTab>(initialTab)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<PartnershipStatus | "all">("all")
  const [selected, setSelected] = useState<Partner | null>(null)
  const [modal, setModal] = useState<ModalKind>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  async function load() {
    const res = await fetch("/api/revenue-command-center/partnerships/enterprise", { cache: "no-store" })
    const data = await res.json() as ApiPayload
    setPayload(data)
    setSelected(current => current ? (data.partners.find(p => p.id === current.id) || data.partners[0] || null) : data.partners[0] || null)
  }

  if (!shouldStartAutoRefresh()) return
  useEffect(() => { void load(); const timer = window.setInterval(() => { void load() }, safeRefreshInterval(15000)); return () => window.clearInterval(timer) }, [])

  const filtered = useMemo(() => payload.partners.filter(p => {
    const hay = `${p.name} ${p.organization} ${p.city} ${p.owner} ${p.contact_name} ${p.context} ${p.next_action}`.toLowerCase()
    const tabMatch = tab === "overview" || tab === "partners" || tab === "insights" ||
      (tab === "pipeline" && !["active", "growth"].includes(p.status)) ||
      (tab === "outreach" && ["target", "qualified"].includes(p.status)) ||
      (tab === "meetings" && p.status === "meeting") ||
      (tab === "proposals" && p.status === "proposal") ||
      (tab === "agreements" && p.status === "agreement") ||
      (tab === "activation" && ["agreement", "active"].includes(p.status)) ||
      (tab === "referrals" && ["active", "growth"].includes(p.status)) ||
      (tab === "performance" && ["active", "growth"].includes(p.status)) ||
      (tab === "risk" && ["risk", "recovery", "lost"].includes(p.status))
    return tabMatch && (status === "all" || p.status === status) && (!query || hay.includes(query.toLowerCase()))
  }), [payload.partners, query, status, tab])

  function open(kind: ModalKind, partner?: Partner) {
    if (partner) setSelected(partner)
    setModal(kind)
    setForm({})
  }

  async function submit(action: string) {
    setBusy(true)
    try {
      await fetch("/api/revenue-command-center/partnerships/enterprise", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, partnerId: selected?.id, payload: form }) })
      setModal(null)
      await load()
    } finally { setBusy(false) }
  }

  const stageCards = statusFlow.map(s => ({ status: s, items: payload.partners.filter(p => p.status === s) }))

  return <main className="min-h-screen bg-[radial-gradient(circle_at_80%_-10%,rgba(65,151,221,.11),transparent_30%),linear-gradient(180deg,#f8fbfe_0%,#eef4f9_100%)] text-slate-900">
    <div className="flex">
      <aside className="sticky top-0 hidden h-screen w-[292px] shrink-0 border-r border-white/10 bg-[#071120] p-6 text-white xl:block">
        <div className="mb-9 flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/15 bg-white/[0.08]"><span className="h-0 w-0 border-b-[20px] border-l-[12px] border-r-[12px] border-b-[#e2384f] border-l-transparent border-r-transparent" /></div><div><p className="text-lg font-black tracking-[0.16em]">ANGELCARE</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/55">Revenue Command OS</p></div></div>
        <nav className="space-y-2">{menu.map(([label, href, icon]) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${href.includes("partnerships") ? "bg-violet-700 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}><span className="w-6 text-lg">{icon}</span>{label}</Link>)}</nav>
        <Card className="mt-8 !border-white/10 !bg-[#091a31] !text-white"><p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Live sync</p><p className="mt-2 text-sm font-black text-emerald-300">{payload.sync?.live ? "Supabase connecté" : "Source en attente"}</p><p className="mt-1 text-xs font-bold text-slate-400">{payload.sync?.source}</p></Card>
      </aside>

      <section className="min-w-0 flex-1 p-5 xl:p-8">
        <header className="mb-5 flex flex-col gap-4 rounded-[28px] border border-[#173b62]/10 bg-gradient-to-r from-[#0a2445] via-[#103c68] to-[#0d2b4d] p-7 text-white shadow-[0_28px_80px_rgba(14,48,82,.16)] lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.3em] text-violet-300">Revenue Command Center / Partenariats</p><h1 className="mt-2 text-3xl font-black lg:text-5xl">Commandement des partenariats</h1><p className="mt-2 max-w-3xl text-sm font-semibold text-slate-300">Pilotage B2B des écoles, crèches, cliniques, entreprises, institutions, lieux partenaires et comptes stratégiques.</p></div>
          <div className="flex flex-wrap gap-3"><Button variant="soft" onClick={() => void load()}>Actualiser</Button><Button onClick={() => open("create")}>+ Nouveau partenariat</Button></div>
        </header>

        <div className="mb-5 overflow-x-auto rounded-[20px] border border-slate-200 bg-white p-2 shadow-[0_14px_42px_rgba(23,58,91,.055)]"><div className="flex min-w-max gap-2">{tabs.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-2xl px-4 py-3 text-left transition ${tab === item.id ? "bg-[#123f6e] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}><p className="text-sm font-black">{item.label}</p><p className="text-[11px] font-bold opacity-70">{item.subtitle}</p></button>)}</div></div>

        <section className="mb-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-7">
          {[ ["Partenaires", payload.metrics.total], ["Actifs", payload.metrics.active], ["Pipeline", money(payload.metrics.pipeline_mad)], ["Prévision", money(payload.metrics.forecast_mad)], ["Forte valeur", payload.metrics.high_value], ["À risque", payload.metrics.risk], ["Prospects synchronisés", payload.metrics.synced_prospects] ].map(([label, value]) => <Card key={String(label)}><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</p><p className="mt-3 text-2xl font-black">{value}</p></Card>)}
        </section>

        <Card className="mb-5"><div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_180px]"><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un partenaire, contact, ville, contexte ou responsable..." /><Select value={status} onChange={e => setStatus(e.target.value as PartnershipStatus | "all")}><option value="all">Tous les statuts</option>{statusFlow.map(s => <option key={s} value={s}>{title(s)}</option>)}</Select><Button variant="soft" onClick={() => open("note")}>Consigner une activité</Button><Button onClick={() => open("create")}>Créer un partenaire</Button></div></Card>

        {tab === "pipeline" ? <section className="mb-5 grid gap-4 xl:grid-cols-5">{stageCards.map(group => <Card key={group.status} className="min-h-[240px]"><div className="mb-3 flex items-center justify-between"><p className="font-black">{title(group.status)}</p><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{group.items.length}</span></div><div className="space-y-3">{group.items.map(p => <button key={p.id} onClick={() => setSelected(p)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-slate-300 hover:bg-white"><p className="font-black">{p.name}</p><p className="mt-1 text-xs font-bold text-slate-400">{p.city} • {money(p.value_mad)}</p></button>)}</div></Card>)}</section> : null}

        <div className="grid gap-5 2xl:grid-cols-[1fr_420px]">
          <section className="space-y-4">{filtered.length ? filtered.map(p => <Card key={p.id} className={selected?.id === p.id ? "ring-2 ring-violet-400" : ""}><div className="grid gap-5 xl:grid-cols-[1fr_220px_290px]"><div><div className="flex flex-wrap gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-black ${tone(p.status)}`}>{title(p.status)}</span><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">{title(p.kind)}</span><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">{p.city}</span></div><h2 className="mt-3 text-2xl font-black">{p.name}</h2><p className="mt-1 text-sm font-bold text-slate-600">{p.organization} • {p.contact_name || "Décideur à identifier"}</p><p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{p.context || p.next_action || "Aucun contexte enregistré."}</p></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Impact commercial</p><p className="mt-2 text-xl font-black">{money(p.value_mad)}</p><p className="mt-2 text-sm font-bold text-slate-600">Probabilité {p.probability}%</p><p className="text-sm font-bold text-slate-600">Santé {p.health_score}%</p><p className="text-sm font-bold text-slate-600">Recommandation {p.referral_potential}%</p></div><div className="grid grid-cols-2 gap-2"><Button variant="soft" onClick={() => setSelected(p)}>Ouvrir le dossier</Button><Button variant="soft" onClick={() => open("qualify", p)}>Qualifier</Button><Button variant="soft" onClick={() => open("meeting", p)}>Rendez-vous</Button><Button variant="soft" onClick={() => open("proposal", p)}>Proposition</Button><Button variant="soft" onClick={() => open("agreement", p)}>Accord</Button><Button variant="soft" onClick={() => open("activate", p)}>Activer</Button><Button variant="soft" onClick={() => open("referral", p)}>Recommandation</Button><Button variant="danger" onClick={() => open("risk", p)}>Risque</Button></div></div></Card>) : <Card><p className="text-lg font-black">Aucun partenariat actif ne correspond à cette vue.</p><p className="mt-2 text-sm font-bold text-slate-400">Créez un partenariat ou synchronisez les prospects présentant un potentiel. Aucun enregistrement artificiel n’est affiché.</p></Card>}</section>

          <aside className="space-y-5"><Card className="!bg-[#0b2345] !text-white"><p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Dossier de commandement sélectionné</p><h2 className="mt-2 text-2xl font-black">{selected?.name || "Aucun partenaire sélectionné"}</h2>{selected ? <div className="mt-4 space-y-3"><p className="text-sm font-bold text-slate-200">{selected.next_action}</p><div className="grid grid-cols-2 gap-3"><Button variant="soft" onClick={() => open("meeting")}>Planifier</Button><Button variant="soft" onClick={() => open("proposal")}>Proposition</Button><Button variant="soft" onClick={() => open("agreement")}>Contrat</Button><Button onClick={() => open("activate")}>Activer</Button></div></div> : null}</Card><Card><p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Activité récente</p><div className="mt-4 space-y-3">{payload.activities.slice(0, 12).map(a => <div key={a.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-sm font-black">{a.title}</p><p className="mt-1 text-xs font-bold text-slate-400">{a.note}</p><p className="mt-1 text-[11px] font-bold text-slate-500">{new Date(a.created_at).toLocaleString()}</p></div>)}</div></Card></aside>
        </div>
      </section>
    </div>
    {modal ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-[28px] border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"><div className="mb-5 flex items-start justify-between gap-5"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Action partenariat</p><h3 className="mt-2 text-3xl font-black">{title(modal)}</h3><p className="mt-2 text-sm font-bold text-slate-400">{selected?.name || "Nouveau partenariat"}</p></div><button onClick={() => setModal(null)} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-black text-slate-700">×</button></div><div className="grid gap-3 md:grid-cols-2">{modal === "create" ? <><Input placeholder="Nom du partenaire ou compte" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /><Input placeholder="Organisation" onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} /><Input placeholder="Ville" onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /><Select onChange={e => setForm(f => ({ ...f, kind: e.target.value }))}>{["preschool", "kindergarten", "corporate", "clinic", "academy", "event_venue", "agency", "institution", "supplier", "referral_partner"].map(k => <option key={k} value={k}>{title(k)}</option>)}</Select><Input placeholder="Décideur" onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} /><Input placeholder="Téléphone" onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /><Input placeholder="Email" onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /><Input placeholder="Valeur pipeline Dh" type="number" onChange={e => setForm(f => ({ ...f, value_mad: e.target.value }))} /><Textarea className="md:col-span-2" placeholder="Contexte du partenariat ANGELCARE, objectif et impact attendu..." onChange={e => setForm(f => ({ ...f, context: e.target.value }))} /></> : <><Input placeholder="Titre de l’action" onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /><Input placeholder="Responsable" onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} /><Input placeholder="Date ou échéance" onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /><Input placeholder="Valeur, volume de recommandations ou score" onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /><Textarea className="md:col-span-2" placeholder="Notes d’exécution, contexte décideur, offre, blocages, engagements et mécanisme de recommandation..." onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></>}</div><div className="mt-6 flex justify-end gap-3"><Button variant="soft" onClick={() => setModal(null)}>Annuler</Button><Button disabled={busy} onClick={() => submit(modal === "create" ? "create" : modal)}>{busy ? "Synchronisation..." : "Enregistrer l’action"}</Button></div></div></div> : null}
  </main>
}
