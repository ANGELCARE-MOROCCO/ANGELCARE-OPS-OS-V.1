"use client"

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
  { id: "overview", label: "Overview", subtitle: "Executive partnership command" },
  { id: "partners", label: "Partners", subtitle: "All B2B accounts" },
  { id: "pipeline", label: "Pipeline", subtitle: "Stage movement" },
  { id: "outreach", label: "Outreach", subtitle: "Domination targets" },
  { id: "meetings", label: "Meetings", subtitle: "Decision-maker agenda" },
  { id: "proposals", label: "Proposals", subtitle: "Offers and packages" },
  { id: "agreements", label: "Agreements", subtitle: "Contracts and SLAs" },
  { id: "activation", label: "Activation", subtitle: "Launch execution" },
  { id: "referrals", label: "Referrals", subtitle: "Partner lead flow" },
  { id: "performance", label: "Performance", subtitle: "Revenue and health" },
  { id: "risk", label: "Risk", subtitle: "Recovery control" },
  { id: "insights", label: "Insights", subtitle: "Market intelligence" },
]

const statusFlow: PartnershipStatus[] = ["target", "qualified", "meeting", "proposal", "agreement", "active", "growth", "risk", "recovery", "lost"]
const menu = [
  ["Command Center", "/revenue-command-center", "⌁"],
  ["Prospects Directory", "/revenue-command-center/prospects/directory", "♙"],
  ["Partner Program", "/revenue-command-center/partnerships", "◇"],
  ["Tasks & Actions", "/revenue-command-center/daily-tasks", "✓"],
  ["Calendar", "/revenue-command-center/appointments", "▣"],
  ["Email Campaigns", "/revenue-command-center/email-campaigns", "✉"],
  ["Whatsapp Center", "/revenue-command-center/whatsapp-center", "○"],
  ["Market Map", "/revenue-command-center/market-map", "◎"],
  ["Analytics & Reports", "/revenue-command-center/analytics", "▥"],
  ["Market Insights", "/revenue-command-center/market-insights", "◈"],
] as const

function money(value: number) { return `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(Number(value || 0))} MAD` }
function title(v: string) { return v.replaceAll("_", " ").replace(/\b\w/g, m => m.toUpperCase()) }
function n(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
function tone(status: PartnershipStatus) {
  if (["active", "growth"].includes(status)) return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30"
  if (["proposal", "agreement", "meeting"].includes(status)) return "bg-blue-500/15 text-blue-200 border-blue-400/30"
  if (["risk", "recovery", "lost"].includes(status)) return "bg-rose-500/15 text-rose-200 border-rose-400/30"
  return "bg-violet-500/15 text-violet-200 border-violet-400/30"
}
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <section className={`rounded-[28px] border border-white/10 bg-[#0d223d]/85 p-5 shadow-2xl shadow-black/20 ${className}`}>{children}</section> }
function Button({ children, className = "", variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "danger" }) {
  const classes = variant === "primary" ? "bg-violet-600 text-white hover:bg-violet-500" : variant === "danger" ? "bg-rose-600 text-white hover:bg-rose-500" : "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
  return <button {...props} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${classes} ${className}`}>{children}</button>
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={`w-full rounded-2xl border border-white/10 bg-[#061428] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-violet-400 ${props.className || ""}`} /> }
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={`w-full rounded-2xl border border-white/10 bg-[#061428] px-4 py-3 text-sm font-bold text-white outline-none focus:border-violet-400 ${props.className || ""}`} /> }
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={`min-h-[110px] w-full rounded-2xl border border-white/10 bg-[#061428] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-violet-400 ${props.className || ""}`} /> }

function defaultPayload(): ApiPayload {
  return { ok: true, partners: [], activities: [], metrics: { total: 0, active: 0, pipeline_mad: 0, forecast_mad: 0, high_value: 0, risk: 0, referral_potential: 0, synced_prospects: 0 }, sync: { live: false, source: "loading" } }
}

function normalizeKind(value: unknown): PartnershipKind {
  const key = String(value || "preschool").toLowerCase()
  const allowed: PartnershipKind[] = ["preschool", "kindergarten", "corporate", "clinic", "academy", "event_venue", "agency", "institution", "supplier", "referral_partner"]
  return allowed.includes(key as PartnershipKind) ? key as PartnershipKind : "institution"
}

function normalizeStatus(value: unknown): PartnershipStatus {
  const key = String(value || "target").toLowerCase()
  if (statusFlow.includes(key as PartnershipStatus)) return key as PartnershipStatus
  if (["prospecting", "new", "active"].includes(key)) return key === "active" ? "active" : "target"
  return "target"
}

function partnerFromOperational(row: Record<string, any>): Partner {
  const value = n(row.value_mad ?? row.valueMad ?? row.potential_value_mad ?? row.potentialValueMad)
  const probability = n(row.probability ?? row.score, 45)
  return {
    id: String(row.id),
    name: String(row.name || row.organization || "Unnamed partner"),
    organization: String(row.organization || row.name || "B2B partner"),
    city: String(row.city || row.location || "Unassigned"),
    kind: normalizeKind(row.kind || row.partnership_type || row.partnershipType),
    status: normalizeStatus(row.status || row.stage),
    owner: String(row.owner || "Partnership Lead"),
    contact_name: String(row.contact_name || row.contactName || ""),
    phone: String(row.phone || ""),
    email: String(row.email || ""),
    value_mad: value,
    probability,
    health_score: n(row.health_score ?? row.score, probability),
    referral_potential: n(row.referral_potential, Math.round(probability / 2)),
    next_action: String(row.next_action || row.nextAction || "Define partnership next step."),
    context: String(row.notes || row.relationship_notes || row.relationshipNotes || ""),
    source_prospect_id: row.source_prospect_id || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  }
}

function activityFromOperational(row: Record<string, any>): Activity {
  return {
    id: String(row.id || `${row.entity_id || "activity"}-${row.created_at || Date.now()}`),
    partner_id: row.partnership_id || row.partnershipId || (row.entity_type === "partnership" ? row.entity_id : null),
    title: String(row.title || row.event_title || row.action || "Partnership activity"),
    note: String(row.body || row.event_body || row.note || ""),
    action: String(row.event_type || row.action_type || row.action || "activity"),
    created_at: String(row.created_at || new Date().toISOString()),
  }
}

function computeMetrics(partners: Partner[]): Metrics {
  const pipeline = partners.reduce((sum, p) => sum + n(p.value_mad), 0)
  return {
    total: partners.length,
    active: partners.filter((p) => ["active", "growth"].includes(p.status)).length,
    pipeline_mad: pipeline,
    forecast_mad: Math.round(partners.reduce((sum, p) => sum + n(p.value_mad) * (n(p.probability) / 100), 0)),
    high_value: partners.filter((p) => n(p.value_mad) >= 100000 || n(p.referral_potential) >= 75).length,
    risk: partners.filter((p) => ["risk", "recovery", "lost"].includes(p.status) || n(p.health_score, 100) < 45).length,
    referral_potential: partners.length ? Math.round(partners.reduce((sum, p) => sum + n(p.referral_potential), 0) / partners.length) : 0,
    synced_prospects: 0,
  }
}

export default function RevenuePartnershipsEnterpriseWorkspace({
  initialTab = "overview" as EnterpriseTab,
  focusPartnerId,
}: {
  initialTab?: EnterpriseTab
  focusPartnerId?: string
}) {
  const [payload, setPayload] = useState<ApiPayload>(() => defaultPayload())
  const [tab, setTab] = useState<EnterpriseTab>(initialTab)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<PartnershipStatus | "all">("all")
  const [selected, setSelected] = useState<Partner | null>(null)
  const [modal, setModal] = useState<ModalKind>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<Record<string, string>>({})

  async function load() {
    setError("")
    const [partnerRes, activityRes] = await Promise.all([
      fetch("/api/revenue-command-center/partnerships?limit=1000", { cache: "no-store" }),
      fetch("/api/revenue-command-center/activity?entityType=partnership&limit=80", { cache: "no-store" }),
    ])
    const partnerPayload = await partnerRes.json()
    const activityPayload = await activityRes.json().catch(() => ({ activities: [] }))
    if (!partnerRes.ok || partnerPayload.ok === false) throw new Error(partnerPayload.error || "Unable to load partnerships")
    const partners = (partnerPayload.partnerships || partnerPayload.data || []).map(partnerFromOperational)
    const data: ApiPayload = {
      ok: true,
      partners,
      activities: (activityPayload.activities || activityPayload.events || activityPayload.data || []).map(activityFromOperational),
      metrics: computeMetrics(partners),
      sync: { live: true, source: "revenue_partnerships" },
    }
    setPayload(data)
    setSelected(current => {
      const focused = focusPartnerId ? data.partners.find(p => p.id === focusPartnerId) : null
      if (focused) return focused
      return current ? (data.partners.find(p => p.id === current.id) || data.partners[0] || null) : data.partners[0] || null
    })
  }

  useEffect(() => {
    void load().catch((error) => setError(error instanceof Error ? error.message : "Unable to load partnerships"))
    const timer = window.setInterval(() => { void load().catch((error) => setError(error instanceof Error ? error.message : "Unable to load partnerships")) }, 15000)
    return () => window.clearInterval(timer)
  }, [])

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
    setError("")
    try {
      let res: Response
      if (action === "create") {
        if (!String(form.name || form.organization || "").trim()) throw new Error("Partner name is required")
        res = await fetch("/api/revenue-command-center/partnerships", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            ...form,
            organization: form.organization || form.name,
            partnershipType: form.kind,
            valueMad: form.value_mad,
            potentialValueMad: form.value_mad,
            notes: form.context,
          }),
        })
      } else {
        if (!selected?.id) throw new Error("Select a partner before saving this action")
        const actionMap: Record<string, Record<string, unknown>> = {
          qualify: { action: "stage_change", stage: "qualified", status: "qualified" },
          proposal: { action: "stage_change", stage: "proposal", status: "proposal" },
          agreement: { action: "stage_change", stage: "agreement", status: "agreement" },
          activate: { action: "stage_change", stage: "active", status: "active" },
          referral: { action: "add_note", noteType: "comment", body: form.note || form.title || "Referral action logged" },
          risk: { action: "stage_change", stage: "risk", status: "risk" },
          note: { action: "add_note", noteType: "note", body: form.note || form.title || "Partnership note" },
        }
        const meetingAt = form.due_date ? `${form.due_date}T10:00:00` : new Date(Date.now() + 86400000).toISOString()
        const body = action === "meeting"
          ? { id: selected.id, action: "schedule_appointment", title: form.title || `Meeting with ${selected.name}`, appointmentAt: meetingAt, owner: form.owner || selected.owner, notes: form.note }
          : { id: selected.id, ...(actionMap[action] || { action: "update" }), ...form }
        res = await fetch("/api/revenue-command-center/partnerships", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify(body),
        })
      }
      const result = await res.json().catch(() => ({}))
      if (!res.ok || result.ok === false) throw new Error(result.error || "Unable to save partnership action")
      setModal(null)
      await load()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save partnership action")
    } finally { setBusy(false) }
  }

  const stageCards = statusFlow.map(s => ({ status: s, items: payload.partners.filter(p => p.status === s) }))

  return <main className="min-h-screen bg-[#06101f] text-white">
    <div className="flex">
      <aside className="sticky top-0 hidden h-screen w-[292px] shrink-0 border-r border-white/10 bg-[#071120] p-6 xl:block">
        <div className="mb-9 flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-400 text-2xl shadow-lg shadow-amber-500/30">✦</div><div><p className="text-xl font-black tracking-[0.28em]">ANGELCARE</p><p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Prospect Center</p></div></div>
        <nav className="space-y-2">{menu.map(([label, href, icon]) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${href.includes("partnerships") ? "bg-violet-700 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}><span className="w-6 text-lg">{icon}</span>{label}</Link>)}</nav>
        <Card className="mt-8 bg-[#091a31]"><p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Live sync</p><p className="mt-2 text-sm font-black text-emerald-300">{payload.sync?.live ? "Supabase connected" : "Waiting for live source"}</p><p className="mt-1 text-xs font-bold text-slate-400">{payload.sync?.source}</p></Card>
      </aside>

      <section className="min-w-0 flex-1 p-5 xl:p-8">
        <header className="mb-5 flex flex-col gap-4 rounded-[32px] border border-white/10 bg-gradient-to-r from-[#101b3d] via-[#082846] to-[#06101f] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.3em] text-violet-300">Revenue Command Center / Partnerships</p><h1 className="mt-2 text-3xl font-black lg:text-5xl">Partnerships Command</h1><p className="mt-2 max-w-3xl text-sm font-semibold text-slate-300">Live B2B partnership execution for kindergartens, preschools, clinics, corporates, referral partners, institutions, venues, and strategic accounts.</p></div>
          <div className="flex flex-wrap gap-3"><Button variant="soft" onClick={() => void load()}>Refresh live</Button><Button onClick={() => open("create")}>+ New Partnership</Button></div>
        </header>
        {error ? <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-black text-red-100">{error}</div> : null}

        <div className="mb-5 overflow-x-auto rounded-[24px] border border-white/10 bg-[#081a30] p-2"><div className="flex min-w-max gap-2">{tabs.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-2xl px-4 py-3 text-left transition ${tab === item.id ? "bg-violet-600 text-white" : "text-slate-300 hover:bg-white/5"}`}><p className="text-sm font-black">{item.label}</p><p className="text-[11px] font-bold opacity-70">{item.subtitle}</p></button>)}</div></div>

        <section className="mb-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-7">
          {[ ["Total Partners", payload.metrics.total], ["Active", payload.metrics.active], ["Pipeline", money(payload.metrics.pipeline_mad)], ["Forecast", money(payload.metrics.forecast_mad)], ["High Value", payload.metrics.high_value], ["Risk", payload.metrics.risk], ["Prospect Sync", payload.metrics.synced_prospects] ].map(([label, value]) => <Card key={String(label)}><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</p><p className="mt-3 text-2xl font-black">{value}</p></Card>)}
        </section>

        <Card className="mb-5"><div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_180px]"><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search partner, contact, city, context, owner..." /><Select value={status} onChange={e => setStatus(e.target.value as PartnershipStatus | "all")}><option value="all">All statuses</option>{statusFlow.map(s => <option key={s} value={s}>{title(s)}</option>)}</Select><Button variant="soft" onClick={() => open("note")}>Log Activity</Button><Button onClick={() => open("create")}>Create Partner</Button></div></Card>

        {tab === "pipeline" ? <section className="mb-5 grid gap-4 xl:grid-cols-5">{stageCards.map(group => <Card key={group.status} className="min-h-[240px]"><div className="mb-3 flex items-center justify-between"><p className="font-black">{title(group.status)}</p><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">{group.items.length}</span></div><div className="space-y-3">{group.items.map(p => <button key={p.id} onClick={() => setSelected(p)} className="block w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"><p className="font-black">{p.name}</p><p className="mt-1 text-xs font-bold text-slate-400">{p.city} • {money(p.value_mad)}</p></button>)}</div></Card>)}</section> : null}

        <div className="grid gap-5 2xl:grid-cols-[1fr_420px]">
          <section className="space-y-4">{filtered.length ? filtered.map(p => <Card key={p.id} className={selected?.id === p.id ? "ring-2 ring-violet-400" : ""}><div className="grid gap-5 xl:grid-cols-[1fr_220px_290px]"><div><div className="flex flex-wrap gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-black ${tone(p.status)}`}>{title(p.status)}</span><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-200">{title(p.kind)}</span><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-200">{p.city}</span></div><Link href={`/revenue-command-center/partnerships/${p.id}`} className="mt-3 block text-2xl font-black text-white hover:text-violet-200">{p.name}</Link><p className="mt-1 text-sm font-bold text-slate-300">{p.organization} • {p.contact_name || "Decision maker pending"}</p><p className="mt-3 text-sm font-semibold leading-6 text-slate-400">{p.context || p.next_action || "No context recorded yet."}</p></div><div className="rounded-2xl bg-white/5 p-4"><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Commercial impact</p><p className="mt-2 text-xl font-black">{money(p.value_mad)}</p><p className="mt-2 text-sm font-bold text-slate-300">Probability {p.probability}%</p><p className="text-sm font-bold text-slate-300">Health {p.health_score}%</p><p className="text-sm font-bold text-slate-300">Referral {p.referral_potential}%</p></div><div className="grid grid-cols-2 gap-2"><Button variant="soft" onClick={() => setSelected(p)}>Open Room</Button><Button variant="soft" onClick={() => open("qualify", p)}>Qualify</Button><Button variant="soft" onClick={() => open("meeting", p)}>Meeting</Button><Button variant="soft" onClick={() => open("proposal", p)}>Proposal</Button><Button variant="soft" onClick={() => open("agreement", p)}>Agreement</Button><Button variant="soft" onClick={() => open("activate", p)}>Activate</Button><Button variant="soft" onClick={() => open("referral", p)}>Referral</Button><Button variant="danger" onClick={() => open("risk", p)}>Risk</Button></div></div></Card>) : <Card><p className="text-lg font-black">No live partnerships found for this view.</p><p className="mt-2 text-sm font-bold text-slate-400">Create a partnership or verify the revenue_partnerships table connection.</p></Card>}</section>

          <aside className="space-y-5"><Card className="bg-[#0b1530]"><p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Selected command room</p><h2 className="mt-2 text-2xl font-black">{selected?.name || "No partner selected"}</h2>{selected ? <div className="mt-4 space-y-3"><p className="text-sm font-bold text-slate-300">{selected.next_action}</p><div className="grid grid-cols-2 gap-3"><Button variant="soft" onClick={() => open("meeting")}>Schedule</Button><Button variant="soft" onClick={() => open("proposal")}>Proposal</Button><Button variant="soft" onClick={() => open("agreement")}>Contract</Button><Button onClick={() => open("activate")}>Activate</Button></div></div> : null}</Card><Card><p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Recent live activity</p><div className="mt-4 space-y-3">{payload.activities.slice(0, 12).map(a => <div key={a.id} className="rounded-2xl border border-white/10 bg-white/5 p-3"><p className="text-sm font-black">{a.title}</p><p className="mt-1 text-xs font-bold text-slate-400">{a.note}</p><p className="mt-1 text-[11px] font-bold text-slate-500">{new Date(a.created_at).toLocaleString()}</p></div>)}</div></Card></aside>
        </div>
      </section>
    </div>
    {modal ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-[32px] border border-white/10 bg-[#081a30] p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between gap-5"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">In-page action modal</p><h3 className="mt-2 text-3xl font-black">{title(modal)}</h3><p className="mt-2 text-sm font-bold text-slate-400">{selected?.name || "New partnership"}</p></div><button onClick={() => setModal(null)} className="rounded-2xl bg-white/10 px-4 py-2 font-black">×</button></div><div className="grid gap-3 md:grid-cols-2">{modal === "create" ? <><Input placeholder="Partner / account name" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /><Input placeholder="Organization" onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} /><Input placeholder="City" onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /><Select onChange={e => setForm(f => ({ ...f, kind: e.target.value }))}>{["preschool", "kindergarten", "corporate", "clinic", "academy", "event_venue", "agency", "institution", "supplier", "referral_partner"].map(k => <option key={k} value={k}>{title(k)}</option>)}</Select><Input placeholder="Decision maker" onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} /><Input placeholder="Phone" onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /><Input placeholder="Email" onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /><Input placeholder="Pipeline value MAD" type="number" onChange={e => setForm(f => ({ ...f, value_mad: e.target.value }))} /><Textarea className="md:col-span-2" placeholder="AngelCare B2B partnership context, objective, expected domination impact..." onChange={e => setForm(f => ({ ...f, context: e.target.value }))} /></> : <><Input placeholder="Action title" onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /><Input placeholder="Owner / responsible" onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} /><Input placeholder="Date / deadline" onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /><Input placeholder="Value / referral count / score" onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /><Textarea className="md:col-span-2" placeholder="Execution notes, decision-maker context, offer details, blockers, SLA, referral mechanics..." onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></>}</div><div className="mt-6 flex justify-end gap-3"><Button variant="soft" onClick={() => setModal(null)}>Cancel</Button><Button disabled={busy} onClick={() => submit(modal === "create" ? "create" : modal)}>{busy ? "Syncing..." : "Save live action"}</Button></div></div></div> : null}
  </main>
}
