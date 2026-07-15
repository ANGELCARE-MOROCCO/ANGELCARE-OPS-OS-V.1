"use client"
import { shouldStartAutoRefresh, safeRefreshInterval } from '@/lib/runtime/client-live-governor'

import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"

type TabKey = "overview" | "partners" | "pipeline" | "deals" | "programs" | "contracts" | "performance" | "comarketing" | "resources" | "contacts" | "activities" | "insights"
type ModalKey = "new" | "interaction" | "meeting" | "task" | "proposal" | "contract" | "activation" | "referral" | "risk" | "details" | null

type Partner = {
  id: string
  name: string
  organization: string
  partner_type: string
  city: string
  contact_name: string
  contact_role: string
  phone?: string
  email?: string
  owner_name: string
  stage: string
  status: string
  tier: string
  health: string
  pipeline_value_mad: number
  revenue_ytd_mad: number
  referral_potential: number
  influence_score: number
  domination_score: number
  agreement_status: string
  next_action: string
  context?: string
  value_proposition?: string
  activation_plan?: string
  referral_model?: string
  risk_notes?: string
  updated_at?: string
  created_at?: string
}

type ApiState = {
  ok: boolean
  live: boolean
  schemaMissing?: boolean
  partners: Partner[]
  prospects: Array<Record<string, unknown>>
  tasks: Array<Record<string, unknown>>
  appointments: Array<Record<string, unknown>>
  events: Array<Record<string, unknown>>
  syncedAt?: string
  error?: string
}

const sidebar = [
  ["Command Center", "/revenue-command-center", "◎"],
  ["Prospects Directory", "/revenue-command-center/prospects/directory", "♙"],
  ["Partner Program", "/revenue-command-center/partnerships", "◇"],
  ["Tasks & Actions", "/revenue-command-center/daily-tasks", "✓"],
  ["Calendar", "/revenue-command-center/appointments", "▣"],
  ["Email Campaigns", "/revenue-command-center/email-campaigns", "✉"],
  ["WhatsApp Center", "/revenue-command-center/whatsapp-center", "◯"],
  ["Market Map", "/revenue-command-center/market-map", "◎"],
  ["Analytics & Reports", "/revenue-command-center/analytics", "▥"],
  ["Market Insights", "/revenue-command-center/market-insights", "◈"],
]

const tabs: Array<{ key: TabKey; label: string; desc: string }> = [
  { key: "overview", label: "Overview", desc: "Total partnership command room" },
  { key: "partners", label: "Partners", desc: "Kindergartens, preschools, clinics, corporates" },
  { key: "pipeline", label: "Pipeline", desc: "Identification to closed won" },
  { key: "deals", label: "Deals", desc: "Revenue, referrals, co-sales" },
  { key: "programs", label: "Programs", desc: "Training, staffing, events, sourcing" },
  { key: "contracts", label: "Contracts", desc: "Agreement, SLA, renewal" },
  { key: "performance", label: "Performance", desc: "Partner ROI and health" },
  { key: "comarketing", label: "Co-Marketing", desc: "Campaigns and visibility" },
  { key: "resources", label: "Resources", desc: "Decks, offers, playbooks" },
  { key: "contacts", label: "Contacts", desc: "Decision makers and influencers" },
  { key: "activities", label: "Activities", desc: "Live action stream" },
  { key: "insights", label: "Insights", desc: "Domination intelligence" },
]

const emptyPartner = {
  name: "",
  organization: "",
  partner_type: "kindergarten_preschool",
  city: "Rabat",
  contact_name: "",
  contact_role: "Owner / Director",
  phone: "",
  email: "",
  owner_name: "Revenue Operator",
  stage: "identification",
  status: "active",
  tier: "strategic",
  health: "good",
  pipeline_value_mad: 75000,
  revenue_ytd_mad: 0,
  referral_potential: 70,
  influence_score: 72,
  domination_score: 68,
  agreement_status: "none",
  next_action: "Qualify decision maker and prepare partnership activation path.",
  context: "",
  value_proposition: "",
  activation_plan: "",
  referral_model: "",
  risk_notes: "",
}

function money(value: number) {
  return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(Number(value || 0)) + " MAD"
}
function label(value: string) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
}
function compact(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M MAD`
  if (value >= 1000) return `${Math.round(value / 1000)}K MAD`
  return `${value} MAD`
}
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[28px] border border-sky-300/10 bg-[#0d2138]/90 shadow-[0_24px_80px_rgba(0,0,0,.22)] ${className}`}>{children}</section>
}
function Metric({ icon, title, value, sub, tone = "from-violet-500 to-fuchsia-600" }: { icon: string; title: string; value: string; sub: string; tone?: string }) {
  return <Card className="p-5"><div className="flex items-center gap-4"><div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tone} text-xl shadow-lg`}>{icon}</div><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-white">{title}</p><p className="mt-1 text-2xl font-black text-white">{value}</p><p className="text-xs font-bold text-emerald-300">↗ {sub}</p></div></div></Card>
}
function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "danger" | "ghost" }) {
  const styles = {
    primary: "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-950/30 hover:from-violet-500 hover:to-blue-500",
    soft: "border border-sky-300/15 bg-white/5 text-white hover:bg-white/10",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    ghost: "text-white hover:bg-white/10",
  }
  return <button {...props} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${styles[variant]} ${className}`}>{children}</button>
}
function Pill({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "amber" | "red" | "purple" | "slate" }) {
  const tones = {
    blue: "border-blue-400/30 bg-blue-500/10 text-blue-200",
    green: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    red: "border-rose-400/30 bg-rose-500/10 text-rose-200",
    purple: "border-violet-400/30 bg-violet-500/10 text-violet-200",
    slate: "border-slate-400/20 bg-slate-500/10 text-white",
  }
  return <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${tones[tone]}`}>{children}</span>
}
function Field({ label: fieldLabel, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[.2em] text-white">{fieldLabel}</span>{children}</label>
}
const inputClass = "w-full rounded-2xl border border-sky-300/15 bg-[#061222] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"

export default function RevenuePartnershipsEnterpriseLivePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview")
  const [data, setData] = useState<ApiState>({ ok: false, live: false, partners: [], prospects: [], tasks: [], appointments: [], events: [] })
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState("all")
  const [stageFilter, setStageFilter] = useState("all")
  const [selected, setSelected] = useState<Partner | null>(null)
  const [modal, setModal] = useState<ModalKey>(null)
  const [draft, setDraft] = useState<Record<string, string | number>>(emptyPartner)
  const [toast, setToast] = useState("Live partnership engine ready")

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/revenue-command-center/partnerships", { cache: "no-store" })
      const json = await res.json()
      setData({ partners: [], prospects: [], tasks: [], appointments: [], events: [], ...json })
      setSelected((current) => current || json.partners?.[0] || null)
      setToast(json.schemaMissing ? "Apply the included SQL migration to activate live partnerships." : "Live data synced with Revenue Command Center.")
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not load partnerships")
    } finally {
      setLoading(false)
    }
  }

  if (!shouldStartAutoRefresh()) return
  useEffect(() => { load(); const id = setInterval(load, safeRefreshInterval(15000)); return () => clearInterval(id) }, [])

  const partners = data.partners || []
  const filtered = useMemo(() => partners.filter((p) => {
    const hay = `${p.name} ${p.organization} ${p.partner_type} ${p.city} ${p.contact_name} ${p.owner_name} ${p.stage} ${p.context}`.toLowerCase()
    return (!query || hay.includes(query.toLowerCase())) && (typeFilter === "all" || p.partner_type === typeFilter) && (tierFilter === "all" || p.tier === tierFilter) && (stageFilter === "all" || p.stage === stageFilter)
  }), [partners, query, typeFilter, tierFilter, stageFilter])

  const stats = useMemo(() => {
    const totalValue = partners.reduce((sum, p) => sum + Number(p.pipeline_value_mad || 0), 0)
    const revenue = partners.reduce((sum, p) => sum + Number(p.revenue_ytd_mad || 0), 0)
    const active = partners.filter((p) => ["active", "activation", "growth", "closed_won"].includes(p.stage) || p.status === "active").length
    const health = partners.length ? Math.round(partners.reduce((sum, p) => sum + Number(p.domination_score || p.influence_score || 0), 0) / partners.length) : 0
    return { total: partners.length, active, totalValue, revenue, health, prospects: data.prospects?.length || 0, tasks: data.tasks?.length || 0, appointments: data.appointments?.length || 0 }
  }, [partners, data])

  async function run(action: string, partner = selected, payload: Record<string, unknown> = {}) {
    if (!partner && action !== "create") return
    setToast(`Running ${action.replaceAll("_", " ")}...`)
    const body = action === "create" ? { action, payload } : { action, partnerId: partner?.id, payload }
    const res = await fetch("/api/revenue-command-center/partnerships", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.ok) { setToast(json.error || "Action failed"); return }
    setModal(null)
    await load()
    setToast(`Done: ${action.replaceAll("_", " ")} synced live.`)
  }

  function openModal(key: Exclude<ModalKey, null>, partner?: Partner) {
    if (partner) setSelected(partner)
    setModal(key)
  }

  const stages = ["identification", "qualification", "decision_map", "meeting_scheduled", "proposal", "negotiation", "contracting", "activation", "growth", "risk", "closed_won", "closed_lost"]
  const types = Array.from(new Set(["kindergarten_preschool", "nursery", "school", "pediatric_clinic", "corporate_hr", "event_venue", "academy_training", "ngo", "supplier", ...partners.map((p) => p.partner_type).filter(Boolean)]))

  return <main className="rcc-partnerships-production min-h-screen bg-[#040b16] text-white">
    <style jsx global>{`
      .rcc-partnerships-production,
      .rcc-partnerships-production * { color: #ffffff !important; }
      .rcc-partnerships-production input,
      .rcc-partnerships-production textarea,
      .rcc-partnerships-production select { color: #ffffff !important; background-color: #061222 !important; }
      .rcc-partnerships-production input::placeholder,
      .rcc-partnerships-production textarea::placeholder { color: rgba(255,255,255,.72) !important; }
      .rcc-partnerships-production option { color: #ffffff !important; background-color: #061222 !important; }
      .rcc-partnerships-production button { color: #ffffff !important; }
      .rcc-partnerships-production .muted-white { color: rgba(255,255,255,.78) !important; }
    `}</style>
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-sky-300/10 bg-[#07111f] xl:block">
        <div className="p-6"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-600 text-2xl shadow-lg">✦</div><div><p className="text-xl font-black tracking-[.32em]">ANGELCARE</p><p className="text-[10px] font-black uppercase tracking-[.28em] text-white">Prospect Center</p></div></div></div>
        <nav className="space-y-2 px-4">
          {sidebar.map(([name, href, icon]) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${href === "/revenue-command-center/partnerships" ? "bg-gradient-to-r from-violet-700 to-indigo-700 text-white shadow-lg shadow-violet-950/40" : "text-white hover:bg-white/5 hover:text-white"}`}><span className="text-lg">{icon}</span>{name}</Link>)}
        </nav>
        <div className="absolute bottom-6 left-4 right-4 space-y-3"><Card className="p-4"><p className="text-xs font-black text-emerald-300">● Live Sync</p><p className="mt-1 text-xs font-bold text-white">Prospects • Tasks • Calendar • Events</p></Card><Card className="p-4"><p className="text-xs font-black text-blue-300">Voice Terminal</p><div className="mt-3 h-10 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-400/30 to-emerald-500/10" /></Card></div>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-sky-300/10 bg-[#07111f]/95 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"><div><div className="flex items-center gap-2"><h1 className="text-2xl font-black">Partnerships Command</h1><span className="text-white">☆</span></div><p className="text-sm font-semibold text-white">Manage AngelCare B2B domination partnerships live from Revenue Command Center data.</p></div><div className="flex items-center gap-3"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search anything..." className="hidden w-[320px] rounded-2xl border border-sky-300/10 bg-[#0b1b2f] px-4 py-3 text-sm font-bold text-white outline-none lg:block"/><Button variant="soft" onClick={load}>↻ Refresh</Button><Button onClick={() => openModal("new")}>＋ New Partnership</Button></div></div>
          <div className="overflow-x-auto border-t border-sky-300/10 px-6"><div className="flex min-w-max gap-1 py-2">{tabs.map((tab) => <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`rounded-xl px-4 py-3 text-sm font-black transition ${activeTab === tab.key ? "bg-violet-600 text-white" : "text-white hover:bg-white/5 hover:text-white"}`}>{tab.label}</button>)}</div></div>
        </header>

        <div className="space-y-6 p-6">
          <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm font-black text-emerald-100">{loading ? "Syncing live partnerships..." : toast}</div>
          {data.schemaMissing ? <Card className="border-amber-400/30 bg-amber-500/10 p-5"><h2 className="text-xl font-black text-amber-100">Database migration required</h2><p className="mt-2 text-sm font-bold leading-6 text-amber-50/80">The UI is ready, but Supabase does not have <code>revenue_partnerships_enterprise</code> yet. Apply the included SQL migration, then refresh. No fake fallback data is being displayed.</p></Card> : null}

          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-6"><Metric icon="⚭" title="Total Partnerships" value={String(stats.total)} sub="live records"/><Metric icon="◎" title="Active Partners" value={String(stats.active)} sub="activation ready" tone="from-blue-500 to-cyan-500"/><Metric icon="▱" title="Pipeline Value" value={compact(stats.totalValue)} sub="from partners" tone="from-emerald-500 to-green-600"/><Metric icon="◈" title="Revenue YTD" value={compact(stats.revenue)} sub="recorded" tone="from-amber-400 to-orange-600"/><Metric icon="▥" title="Synced Prospects" value={String(stats.prospects)} sub="prospect center" tone="from-rose-500 to-pink-600"/><Metric icon="▰" title="Domination Health" value={`${stats.health}%`} sub="weighted score" tone="from-green-500 to-emerald-600"/></section>

          <section className="grid gap-4 md:grid-cols-4"><Card className="p-4"><p className="text-xs font-black uppercase tracking-[.2em] text-white">Data source</p><p className="mt-2 text-sm font-black text-white">Supabase live tables</p><p className="text-xs font-bold text-white">No localStorage / no fake fallback</p></Card><Card className="p-4"><p className="text-xs font-black uppercase tracking-[.2em] text-white">Connected work</p><p className="mt-2 text-sm font-black text-white">{stats.tasks} tasks • {stats.appointments} appointments</p><p className="text-xs font-bold text-white">Created by partner actions</p></Card><Card className="p-4"><p className="text-xs font-black uppercase tracking-[.2em] text-white">Current workspace</p><p className="mt-2 text-sm font-black text-white">{tabs.find(t => t.key === activeTab)?.label}</p><p className="text-xs font-bold text-white">{tabs.find(t => t.key === activeTab)?.desc}</p></Card><Card className="p-4"><p className="text-xs font-black uppercase tracking-[.2em] text-white">Last refresh</p><p className="mt-2 text-sm font-black text-white">{data.syncedAt ? new Date(data.syncedAt).toLocaleTimeString() : "Waiting"}</p><p className="text-xs font-bold text-white">Auto refresh every 15 seconds</p></Card></section>

          <div className="grid gap-6 2xl:grid-cols-[1fr_360px]">
            <section className="space-y-6">
              <Card className="p-4"><div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_190px_120px]"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search partners, cities, decision makers..." className={inputClass}/><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={inputClass}><option value="all">All Types</option>{types.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select><select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className={inputClass}><option value="all">All Tiers</option><option value="strategic">Strategic</option><option value="preferred">Preferred</option><option value="standard">Standard</option><option value="emerging">Emerging</option></select><select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className={inputClass}><option value="all">All Status</option>{stages.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select><Button variant="soft" onClick={() => openModal("details")}>Filters</Button></div></Card>

              <EnterpriseWorkspace activeTab={activeTab} partners={filtered} selected={selected} setSelected={setSelected} openModal={openModal} run={run} events={data.events} stats={stats} />
            </section>

            <aside className="space-y-6"><PipelineFunnel partners={partners}/><Distribution partners={partners}/><CommandRoom selected={selected} openModal={openModal} run={run}/><RecentActivities events={data.events}/></aside>
          </div>
        </div>
      </section>
    </div>

    {modal ? <Modal modal={modal} selected={selected} draft={draft} setDraft={setDraft} close={() => setModal(null)} run={run}/> : null}
  </main>
}

function PartnersTable({ partners, selected, setSelected, openModal, run }: { partners: Partner[]; selected: Partner | null; setSelected: (p: Partner) => void; openModal: (key: Exclude<ModalKey, null>, p?: Partner) => void; run: (action: string, partner?: Partner, payload?: Record<string, unknown>) => void }) {
  return <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-sky-300/10 p-5"><div><h2 className="text-xl font-black">Strategic Partnerships</h2><p className="text-sm font-semibold text-white">{partners.length} live results</p></div><div className="flex gap-2"><Button variant="soft" onClick={() => openModal("interaction", selected || partners[0])}>Log Interaction</Button><Button variant="soft" onClick={() => openModal("meeting", selected || partners[0])}>Schedule</Button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead className="bg-[#07111f]"><tr className="text-[10px] uppercase tracking-[.22em] text-white"><th className="px-5 py-4">Partner</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Tier</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Pipeline Value</th><th className="px-5 py-4">Revenue YTD</th><th className="px-5 py-4">Health</th><th className="px-5 py-4">Actions</th></tr></thead><tbody className="divide-y divide-sky-300/10">{partners.map((p) => <tr key={p.id} className={`${selected?.id === p.id ? "bg-violet-500/10" : "hover:bg-white/[.03]"}`}><td className="px-5 py-4"><button onClick={() => setSelected(p)} className="text-left"><p className="font-black text-white">{p.name}</p><p className="text-xs font-bold text-white">{p.organization} • {p.city}</p><p className="text-xs font-semibold text-white">{p.contact_name} — {p.contact_role}</p></button></td><td className="px-5 py-4"><Pill>{label(p.partner_type)}</Pill></td><td className="px-5 py-4"><Pill tone="amber">{label(p.tier)}</Pill></td><td className="px-5 py-4"><Pill tone={p.stage === "risk" ? "red" : p.stage === "closed_won" ? "green" : "blue"}>{label(p.stage)}</Pill></td><td className="px-5 py-4 font-black">{compact(p.pipeline_value_mad)}</td><td className="px-5 py-4 font-black">{compact(p.revenue_ytd_mad)}</td><td className="px-5 py-4"><div className="grid h-11 w-11 place-items-center rounded-full border-4 border-emerald-400 text-sm font-black">{p.domination_score || p.influence_score || 0}</div></td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><Button variant="ghost" onClick={() => openModal("details", p)}>View</Button><Button variant="ghost" onClick={() => openModal("proposal", p)}>Proposal</Button><Button variant="ghost" onClick={() => run("qualify", p)}>Qualify</Button></div></td></tr>)}</tbody></table></div></Card>
}

function PipelineBoard({ stages, partners, openModal, run }: { stages: string[]; partners: Partner[]; openModal: (key: Exclude<ModalKey, null>, p?: Partner) => void; run: (action: string, partner?: Partner) => void }) {
  return <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-4">{stages.map((stage) => { const list = partners.filter((p) => p.stage === stage); return <Card key={stage} className="min-h-[260px] p-4"><div className="mb-4 flex items-center justify-between"><h3 className="font-black">{label(stage)}</h3><Pill tone="purple">{list.length}</Pill></div><div className="space-y-3">{list.map((p) => <div key={p.id} className="rounded-2xl border border-sky-300/10 bg-[#07111f] p-4"><p className="font-black">{p.name}</p><p className="text-xs font-bold text-white">{money(p.pipeline_value_mad)}</p><div className="mt-3 flex gap-2"><Button variant="soft" onClick={() => openModal("details", p)}>Open</Button><Button variant="soft" onClick={() => run("qualify", p)}>Next</Button></div></div>)}</div></Card>})}</div>
}

function Performance({ partners }: { partners: Partner[] }) {
  return <div className="grid gap-4 lg:grid-cols-3">{partners.map((p) => <Card key={p.id} className="p-5"><div className="flex items-start justify-between"><div><h3 className="text-lg font-black">{p.name}</h3><p className="text-sm font-bold text-white">{p.organization}</p></div><div className="grid h-14 w-14 place-items-center rounded-full border-4 border-emerald-400 font-black">{p.domination_score || 0}</div></div><div className="mt-5 space-y-3"><Bar label="Referral potential" value={p.referral_potential}/><Bar label="Influence score" value={p.influence_score}/><Bar label="Domination score" value={p.domination_score}/></div><p className="mt-4 text-sm font-bold text-white">{p.next_action}</p></Card>)}</div>
}
function Contracts({ partners, openModal }: { partners: Partner[]; openModal: (key: Exclude<ModalKey, null>, p?: Partner) => void }) { return <div className="grid gap-4 lg:grid-cols-2">{partners.map((p) => <Card key={p.id} className="p-5"><div className="flex items-center justify-between"><div><h3 className="font-black">{p.name}</h3><p className="text-sm font-bold text-white">Agreement: {label(p.agreement_status)}</p></div><Button variant="soft" onClick={() => openModal("contract", p)}>Manage Contract</Button></div></Card>)}</div> }
function Contacts({ partners, openModal }: { partners: Partner[]; openModal: (key: Exclude<ModalKey, null>, p?: Partner) => void }) { return <Card className="overflow-hidden"><table className="w-full text-left"><tbody>{partners.map((p) => <tr key={p.id} className="border-b border-sky-300/10"><td className="p-4"><p className="font-black">{p.contact_name || "Decision maker"}</p><p className="text-sm font-bold text-white">{p.contact_role} • {p.organization}</p></td><td className="p-4 text-sm font-bold text-white">{p.phone || "No phone"}</td><td className="p-4"><Button variant="soft" onClick={() => openModal("interaction", p)}>Contact</Button></td></tr>)}</tbody></table></Card> }
function Activities({ events }: { events: Array<Record<string, unknown>> }) { return <Card className="p-5"><h2 className="mb-4 text-xl font-black">Live Activity Stream</h2><div className="space-y-3">{events.length ? events.map((e, i) => <div key={String(e.id || i)} className="rounded-2xl bg-[#07111f] p-4"><p className="font-black">{String(e.title || e.kind || "Revenue event")}</p><p className="text-xs font-bold text-white">{e.created_at ? new Date(String(e.created_at)).toLocaleString() : "Live event"}</p></div>) : <p className="text-sm font-bold text-white">No events yet.</p>}</div></Card> }
function Bar({ label: l, value }: { label: string; value: number }) { return <div><div className="mb-1 flex justify-between text-xs font-black text-white"><span>{l}</span><span>{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }}/></div></div> }
function PipelineFunnel({ partners }: { partners: Partner[] }) { const rows = ["identification","qualification","proposal","negotiation","closed_won"].map((s) => ({ s, count: partners.filter((p) => p.stage === s).length })); return <Card className="p-5"><h3 className="text-lg font-black">Partnership Pipeline</h3><div className="mt-4 space-y-2">{rows.map((r, i) => <div key={r.s} className="rounded-xl p-3" style={{ background: `rgba(${120+i*20}, ${80+i*18}, 255, .16)` }}><div className="flex justify-between text-sm font-black"><span>{label(r.s)}</span><span>{r.count}</span></div></div>)}</div></Card> }
function Distribution({ partners }: { partners: Partner[] }) { const strategic = partners.filter((p) => p.tier === "strategic").length; return <Card className="p-5"><h3 className="text-lg font-black">Partner Distribution</h3><div className="mt-5 grid place-items-center"><div className="grid h-32 w-32 place-items-center rounded-full border-[18px] border-violet-500 bg-[#07111f]"><div className="text-center"><p className="text-2xl font-black">{partners.length}</p><p className="text-xs font-bold text-white">Total</p></div></div></div><p className="mt-4 text-sm font-bold text-white">Strategic partners: {strategic}</p></Card> }
function CommandRoom({ selected, openModal, run }: { selected: Partner | null; openModal: (key: Exclude<ModalKey, null>, p?: Partner) => void; run: (action: string, partner?: Partner) => void }) { return <Card className="p-5"><h3 className="text-lg font-black">Selected Partner Command Room</h3>{selected ? <div className="mt-4 space-y-3"><p className="text-xl font-black">{selected.name}</p><p className="text-sm font-bold text-white">{selected.next_action}</p><div className="grid grid-cols-2 gap-2"><Button variant="soft" onClick={() => openModal("meeting", selected)}>Meeting</Button><Button variant="soft" onClick={() => openModal("task", selected)}>Task</Button><Button variant="soft" onClick={() => openModal("proposal", selected)}>Proposal</Button><Button variant="soft" onClick={() => openModal("contract", selected)}>Contract</Button><Button variant="soft" onClick={() => openModal("activation", selected)}>Activation</Button><Button variant="soft" onClick={() => openModal("referral", selected)}>Referral</Button><Button variant="danger" onClick={() => openModal("risk", selected)}>Risk</Button><Button onClick={() => run("grow", selected)}>Grow</Button></div></div> : <p className="mt-4 text-sm font-bold text-white">Select a partner.</p>}</Card> }
function RecentActivities({ events }: { events: Array<Record<string, unknown>> }) { return <Card className="p-5"><h3 className="text-lg font-black">Recent Activities</h3><div className="mt-4 space-y-3">{events.slice(0, 5).map((e, i) => <div key={String(e.id || i)} className="rounded-2xl bg-[#07111f] p-3"><p className="text-sm font-black">{String(e.title || e.kind || "Event")}</p><p className="text-xs font-bold text-white">{e.created_at ? new Date(String(e.created_at)).toLocaleString() : "Now"}</p></div>)}</div></Card> }


function EnterpriseWorkspace({ activeTab, partners, selected, setSelected, openModal, run, events, stats }: { activeTab: TabKey; partners: Partner[]; selected: Partner | null; setSelected: (p: Partner) => void; openModal: (key: Exclude<ModalKey, null>, p?: Partner) => void; run: (action: string, partner?: Partner, payload?: Record<string, unknown>) => void; events: Array<Record<string, unknown>>; stats: { total: number; active: number; totalValue: number; revenue: number; health: number; prospects: number; tasks: number; appointments: number } }) {
  const title = tabs.find((t) => t.key === activeTab)?.label || "Workspace"
  if (activeTab === "overview") {
    return <div className="space-y-6"><WorkspaceHero title="AngelCare B2B Partnership Domination Room" subtitle="One operating page for preschools, nurseries, schools, clinics, corporates, event venues, academy alliances and referral channels. Every action writes live to Supabase and syncs with Revenue Command Center." actions={<><Button onClick={() => openModal("new")}>Create Partnership</Button><Button variant="soft" onClick={() => openModal("activation", selected || partners[0])}>Launch Activation</Button></>} />
      <section className="grid gap-4 xl:grid-cols-3"><WorkCard title="Territory Control" body="Map partner density by Rabat, Temara, Casablanca, Kenitra and Tangier, prioritize clusters, and push city-by-city acquisition operations." cta="Open market map" onClick={() => openModal("details", selected || partners[0])}/><WorkCard title="Decision-Maker Capture" body="Track owners, directors, HR leads, clinic managers, school operations and parent-community influencers per partner." cta="Open contacts" onClick={() => openModal("interaction", selected || partners[0])}/><WorkCard title="Revenue + Referral Engine" body="Convert partners into referrals, academy enrollments, staffing deals, family-care contracts and recurring B2B programs." cta="Build referral model" onClick={() => openModal("referral", selected || partners[0])}/></section>
      <PartnersTable partners={partners} selected={selected} setSelected={setSelected} openModal={openModal} run={run}/></div>
  }
  if (activeTab === "partners") return <div className="space-y-6"><WorkspaceHero title="Partner Portfolio Management" subtitle="Segment every real B2B partner by context: preschool, nursery, corporate HR, pediatric clinic, school, event venue, NGO, supplier or academy partner." actions={<><Button onClick={() => openModal("new")}>Add Partner</Button><Button variant="soft" onClick={() => openModal("details", selected || partners[0])}>Open Partner Dossier</Button></>} /><PartnersTable partners={partners} selected={selected} setSelected={setSelected} openModal={openModal} run={run}/></div>
  if (activeTab === "pipeline") return <div className="space-y-6"><WorkspaceHero title="Partnership Pipeline Control" subtitle="Move live partners from identification to qualification, decision map, meeting, proposal, negotiation, contracting, activation and closed won." actions={<><Button variant="soft" onClick={() => openModal("meeting", selected || partners[0])}>Schedule Meeting</Button><Button onClick={() => openModal("proposal", selected || partners[0])}>Prepare Proposal</Button></>} /><PipelineBoard stages={["identification","qualification","decision_map","meeting_scheduled","proposal","negotiation","contracting","activation","growth","closed_won"]} partners={partners} openModal={openModal} run={run}/></div>
  if (activeTab === "deals") return <LayeredWorkspace title="Deals & Commercial Conversion" partners={partners} cards={["B2B service package pricing", "Referral revenue tracking", "Academy graduate sourcing deals", "Family-care corporate benefit offers", "Event kids-session leadership packages", "Preschool staffing replacement deals"]} openModal={openModal} selected={selected} />
  if (activeTab === "programs") return <LayeredWorkspace title="Partnership Programs" partners={partners} cards={["Preschool referral program", "Corporate family-care benefit", "Clinic trust-channel activation", "Kids event leader supply", "Academy training partner track", "School holiday/after-school care channel"]} openModal={openModal} selected={selected} />
  if (activeTab === "contracts") return <div className="space-y-6"><WorkspaceHero title="Contracts, SLA & Renewal Workspace" subtitle="Control agreement status, renewal pressure, SLA commitments, referral terms, revenue share, pilot dates and escalation risks." actions={<><Button onClick={() => openModal("contract", selected || partners[0])}>Manage Contract</Button><Button variant="danger" onClick={() => openModal("risk", selected || partners[0])}>Escalate Risk</Button></>} /><Contracts partners={partners} openModal={openModal}/></div>
  if (activeTab === "performance") return <div className="space-y-6"><WorkspaceHero title="Partner Performance & Health" subtitle="Measure pipeline, revenue, domination score, referral potential, influence score and operational health from live records only." actions={<Button onClick={() => openModal("activation", selected || partners[0])}>Boost Performance</Button>} /><Performance partners={partners}/></div>
  if (activeTab === "comarketing") return <LayeredWorkspace title="Co-Marketing & Trust Campaigns" partners={partners} cards={["Parent trust campaigns", "Preschool open-day partnership", "Clinic flyer/QR referral", "Corporate HR internal launch", "WhatsApp partner referral scripts", "Local city domination content"]} openModal={openModal} selected={selected} />
  if (activeTab === "resources") return <LayeredWorkspace title="Resources, Offers & Playbooks" partners={partners} cards={["B2B partnership deck", "Preschool proposal kit", "Corporate benefit offer", "Clinic referral script", "Contract checklist", "Activation SOP for staff"]} openModal={openModal} selected={selected} />
  if (activeTab === "contacts") return <div className="space-y-6"><WorkspaceHero title="Decision Makers & Influence Map" subtitle="Centralize owners, directors, HR leaders, clinic managers and operators; every interaction creates a live event." actions={<><Button onClick={() => openModal("interaction", selected || partners[0])}>Log Interaction</Button><Button variant="soft" onClick={() => openModal("meeting", selected || partners[0])}>Schedule Follow-up</Button></>} /><Contacts partners={partners} openModal={openModal}/></div>
  if (activeTab === "activities") return <div className="space-y-6"><WorkspaceHero title="Live Partnership Activity Timeline" subtitle="No localStorage. No fake demos. Only Supabase activities and actions created through this command center." actions={<Button onClick={() => openModal("task", selected || partners[0])}>Create Follow-up Task</Button>} /><Activities events={events}/></div>
  return <div className="space-y-6"><WorkspaceHero title="Domination Intelligence" subtitle="Detect which partner categories, cities and stages create the most commercial leverage for AngelCare B2B expansion." actions={<><Button onClick={() => openModal("details", selected || partners[0])}>Open Intelligence Brief</Button><Button variant="soft" onClick={() => openModal("referral", selected || partners[0])}>Build Referral Engine</Button></>} /><section className="grid gap-4 xl:grid-cols-3"><WorkCard title="Total Live Partners" body={`${stats.total} live partner records synced from Supabase.`} cta="Inspect partners" onClick={() => openModal("details", selected || partners[0])}/><WorkCard title="Live Pipeline" body={`${compact(stats.totalValue)} in weighted partnership opportunity value.`} cta="Open pipeline" onClick={() => openModal("proposal", selected || partners[0])}/><WorkCard title="Domination Health" body={`${stats.health}% weighted health from live partner scores.`} cta="Improve health" onClick={() => openModal("activation", selected || partners[0])}/></section><PartnersTable partners={partners} selected={selected} setSelected={setSelected} openModal={openModal} run={run}/></div>
}

function WorkspaceHero({ title, subtitle, actions }: { title: string; subtitle: string; actions: ReactNode }) {
  return <Card className="overflow-hidden p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.28em] text-white">Enterprise workspace</p><h2 className="mt-2 text-3xl font-black text-white">{title}</h2><p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-white">{subtitle}</p></div><div className="flex flex-wrap gap-2">{actions}</div></div><div className="mt-5 grid gap-3 md:grid-cols-4"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-black text-white">Live Source</p><p className="mt-1 text-sm font-bold text-white">Supabase only</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-black text-white">Connected Data</p><p className="mt-1 text-sm font-bold text-white">Prospects • Tasks • Calendar</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-black text-white">No Demo Data</p><p className="mt-1 text-sm font-bold text-white">Empty state until real records exist</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-black text-white">Action Mode</p><p className="mt-1 text-sm font-bold text-white">In-page modals only</p></div></div></Card>
}

function WorkCard({ title, body, cta, onClick }: { title: string; body: string; cta: string; onClick: () => void }) {
  return <Card className="p-5"><h3 className="text-xl font-black text-white">{title}</h3><p className="mt-3 min-h-20 text-sm font-bold leading-6 text-white">{body}</p><Button className="mt-4" variant="soft" onClick={onClick}>{cta}</Button></Card>
}

function LayeredWorkspace({ title, partners, cards, openModal, selected }: { title: string; partners: Partner[]; cards: string[]; openModal: (key: Exclude<ModalKey, null>, p?: Partner) => void; selected: Partner | null }) {
  return <div className="space-y-6"><WorkspaceHero title={title} subtitle="A broadened AngelCare B2B execution layer designed for real team operations, partner conversion, activation, follow-up and cross-module synchronization." actions={<><Button onClick={() => openModal("task", selected || partners[0])}>Create Execution Task</Button><Button variant="soft" onClick={() => openModal("interaction", selected || partners[0])}>Log Progress</Button></>} /><section className="grid gap-4 xl:grid-cols-3">{cards.map((card, index) => <WorkCard key={card} title={card} body={`Use this layer to manage ${card.toLowerCase()} with real partner records, staff ownership, stage movement, activity logging and next-action accountability.`} cta={index % 3 === 0 ? "Open modal" : index % 3 === 1 ? "Create action" : "Sync follow-up"} onClick={() => openModal(index % 3 === 0 ? "details" : index % 3 === 1 ? "task" : "activation", selected || partners[0])}/>)}</section><PartnersTable partners={partners} selected={selected} setSelected={() => {}} openModal={openModal} run={() => {}}/></div>
}

function Modal({ modal, selected, draft, setDraft, close, run }: { modal: Exclude<ModalKey, null>; selected: Partner | null; draft: Record<string, string | number>; setDraft: (d: Record<string, string | number>) => void; close: () => void; run: (action: string, partner?: Partner, payload?: Record<string, unknown>) => void }) {
  const titles: Record<Exclude<ModalKey, null>, string> = {
    new: "Create AngelCare B2B Partnership", interaction: "Log Partner Interaction", meeting: "Schedule Partnership Meeting", task: "Create Partner Task", proposal: "Send Partnership Proposal", contract: "Manage Contract & SLA", activation: "Activation Launch Plan", referral: "Referral Engine", risk: "Risk & Recovery Control", details: "Partnership Details Command Room",
  }
  const actionMap: Record<Exclude<ModalKey, null>, string> = { new: "create", interaction: "log_interaction", meeting: "schedule_meeting", task: "create_task", proposal: "send_proposal", contract: "sign_contract", activation: "activate", referral: "record_referral", risk: "risk", details: "update" }
  function update(key: string, value: string | number) { setDraft({ ...draft, [key]: value }) }
  const isNew = modal === "new"
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-[34px] border border-sky-300/20 bg-[#09182a] p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.28em] text-violet-300">Live synced modal</p><h2 className="mt-2 text-3xl font-black">{titles[modal]}</h2><p className="mt-2 text-sm font-bold text-white">{isNew ? "Creates a real Supabase partnership record." : selected ? `${selected.name} • ${selected.organization}` : "No partner selected"}</p></div><Button variant="soft" onClick={close}>Close</Button></div><div className="mb-5 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-black text-white">Strategic Objective</p><p className="mt-2 text-sm font-bold text-white">Convert this partner into referrals, staffing deals, academy demand or recurring B2B revenue.</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-black text-white">Sync Impact</p><p className="mt-2 text-sm font-bold text-white">Actions can create Revenue tasks, appointments and event timeline entries.</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-black text-white">Execution Rule</p><p className="mt-2 text-sm font-bold text-white">No external page jump. Save here and keep the team inside the command flow.</p></div></div><div className="grid gap-4 md:grid-cols-2"><Field label="Partnership / Action Name"><input className={inputClass} value={String(draft.name || selected?.name || "")} onChange={(e) => update("name", e.target.value)} placeholder="Partnership name"/></Field><Field label="Organization"><input className={inputClass} value={String(draft.organization || selected?.organization || "")} onChange={(e) => update("organization", e.target.value)} placeholder="Organization"/></Field><Field label="Partner Type"><select className={inputClass} value={String(draft.partner_type || selected?.partner_type || "kindergarten_preschool")} onChange={(e) => update("partner_type", e.target.value)}><option value="kindergarten_preschool">Kindergarten / Preschool</option><option value="nursery">Nursery</option><option value="school">School</option><option value="pediatric_clinic">Pediatric Clinic</option><option value="corporate_hr">Corporate HR</option><option value="event_venue">Event Venue</option><option value="academy_training">Academy / Training</option><option value="ngo">NGO / Association</option></select></Field><Field label="City"><input className={inputClass} value={String(draft.city || selected?.city || "Rabat")} onChange={(e) => update("city", e.target.value)}/></Field><Field label="Decision Maker"><input className={inputClass} value={String(draft.contact_name || selected?.contact_name || "")} onChange={(e) => update("contact_name", e.target.value)} placeholder="Owner, director, HR lead..."/></Field><Field label="Role"><input className={inputClass} value={String(draft.contact_role || selected?.contact_role || "")} onChange={(e) => update("contact_role", e.target.value)}/></Field><Field label="Pipeline Value MAD"><input type="number" className={inputClass} value={Number(draft.pipeline_value_mad || selected?.pipeline_value_mad || 0)} onChange={(e) => update("pipeline_value_mad", Number(e.target.value))}/></Field><Field label="Owner"><input className={inputClass} value={String(draft.owner_name || selected?.owner_name || "Revenue Operator")} onChange={(e) => update("owner_name", e.target.value)}/></Field><Field label="Context"><textarea className={`${inputClass} min-h-28 md:col-span-2`} value={String(draft.context || selected?.context || "")} onChange={(e) => update("context", e.target.value)} placeholder="Context, opportunity, decision map, constraints..."/></Field><Field label="AngelCare Value Proposition"><textarea className={`${inputClass} min-h-28`} value={String(draft.value_proposition || selected?.value_proposition || "")} onChange={(e) => update("value_proposition", e.target.value)} placeholder="Training, staffing, kids care operations, referrals..."/></Field><Field label="Activation / Next Action"><textarea className={`${inputClass} min-h-28`} value={String(draft.activation_plan || selected?.activation_plan || selected?.next_action || "")} onChange={(e) => update("activation_plan", e.target.value)} placeholder="What staff should do next"/></Field></div><div className="mt-6 flex flex-wrap justify-end gap-3"><Button variant="soft" onClick={close}>Cancel</Button>{modal === "contract" ? <Button onClick={() => run("sign_contract", selected || undefined, draft)}>Sign Contract</Button> : null}{modal === "activation" ? <Button onClick={() => run("activate", selected || undefined, draft)}>Launch Activation</Button> : null}{modal === "proposal" ? <Button onClick={() => run("send_proposal", selected || undefined, draft)}>Send Proposal</Button> : null}{modal === "meeting" ? <Button onClick={() => run("schedule_meeting", selected || undefined, draft)}>Schedule Meeting</Button> : null}{modal === "risk" ? <Button variant="danger" onClick={() => run("risk", selected || undefined, draft)}>Escalate Risk</Button> : null}<Button onClick={() => run(actionMap[modal], selected || undefined, draft)}>{isNew ? "Create Live Partnership" : "Save & Sync Action"}</Button></div></div></div>
}
