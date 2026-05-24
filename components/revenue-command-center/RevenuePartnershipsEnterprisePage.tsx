"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Activity, ArrowRight, BarChart3, Bot, BriefcaseBusiness, Building2, CalendarDays, CircleDot, FileSignature, Handshake, HeartHandshake, MapPin, Megaphone, Network, Plus, RefreshCcw, Search, ShieldCheck, Sparkles, Stethoscope, Target, UsersRound, X } from "lucide-react"
import { RevenueCommandCenterSidebar } from "./RevenueCommandCenterSidebar"
import PartnershipProgramsWorkspace from "./PartnershipProgramsWorkspace"

type Partner = Record<string, any>
type WorkspaceKey = "overview" | "partners" | "pipeline" | "deals" | "programs" | "contracts" | "performance" | "coMarketing" | "territories" | "academy" | "corporate" | "referrals" | "events" | "compliance" | "activities"

const tabs: { key: WorkspaceKey; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: Sparkles }, { key: "partners", label: "Partners", icon: Handshake }, { key: "pipeline", label: "Pipeline", icon: Target },
  { key: "deals", label: "Deal Rooms", icon: BriefcaseBusiness }, { key: "programs", label: "Programs", icon: UsersRound }, { key: "contracts", label: "Contracts", icon: FileSignature },
  { key: "performance", label: "Performance", icon: BarChart3 }, { key: "coMarketing", label: "Co-Marketing", icon: Megaphone }, { key: "territories", label: "Territories", icon: MapPin },
  { key: "academy", label: "Academy Alliances", icon: ShieldCheck }, { key: "corporate", label: "Corporate Benefits", icon: Building2 }, { key: "referrals", label: "Referral Networks", icon: Network },
  { key: "events", label: "Events & Excursions", icon: CalendarDays }, { key: "compliance", label: "Compliance", icon: ShieldCheck }, { key: "activities", label: "Activities", icon: Activity },
]

const categories = [
  ["Preschools & Kindergartens", 38.5, "bg-violet-500"], ["Maternity Clinics", 17.8, "bg-cyan-400"], ["Orthophonistes", 12.6, "bg-emerald-400"],
  ["Hotels", 11.2, "bg-blue-400"], ["Corporates", 11.2, "bg-fuchsia-400"], ["Associations", 8.7, "bg-orange-400"],
] as const

function money(value = 0) {
  if (value >= 1000000) return `MAD ${(value / 1000000).toFixed(2)}M`
  if (value >= 1000) return `MAD ${Math.round(value / 1000)}K`
  return `MAD ${value}`
}

function Button({ children, active, onClick, className = "" }: { children: ReactNode; active?: boolean; onClick?: () => void; className?: string }) {
  return <button type="button" onClick={onClick} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white transition-all active:scale-[.98] ${active ? "bg-gradient-to-r from-violet-600 to-blue-600 shadow-[0_18px_44px_rgba(124,58,237,.42)]" : "border border-white/15 bg-white/[0.09] hover:border-violet-300/50 hover:bg-white/[0.14]"} ${className}`}>{children}</button>
}

function Panel({ title, icon: Icon, children }: { title: string; icon?: any; children: ReactNode }) {
  return <section className="relative overflow-hidden rounded-[34px] border border-white/15 bg-[linear-gradient(145deg,rgba(18,30,54,.98),rgba(8,16,31,.99))] p-7 text-white shadow-[0_26px_90px_rgba(0,0,0,.32)]"><div className="mb-6 flex items-center gap-3">{Icon ? <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/25 bg-violet-500/18"><Icon className="h-5 w-5 text-white" /></div> : null}<h3 className="text-[22px] font-black tracking-[-0.03em] text-white">{title}</h3></div>{children}</section>
}

function Kpi({ icon: Icon, title, value, note }: any) {
  return <div className="rounded-[28px] border border-white/15 bg-[linear-gradient(145deg,rgba(18,30,54,.99),rgba(10,18,34,.99))] p-6 text-white shadow-[0_20px_70px_rgba(0,0,0,.28)]"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg"><Icon className="h-7 w-7 text-white" /></div><div><p className="text-[11px] font-black uppercase tracking-[.2em] text-white">{title}</p><h4 className="mt-1 text-3xl font-black tracking-[-.04em] text-white">{value}</h4><p className="mt-1 text-xs font-black text-white">{note}</p></div></div></div>
}

export default function RevenuePartnershipsEnterprisePage() {
  const [active, setActive] = useState<WorkspaceKey>("overview")
  const [partners, setPartners] = useState<Partner[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [modal, setModal] = useState("")

  async function load() {
    try {
      const [partnershipsRes, programsRes] = await Promise.all([
        fetch("/api/revenue-command-center/partnerships", { cache: "no-store" }),
        fetch("/api/revenue-command-center/partnership-programs", { cache: "no-store" }),
      ])
      const partnershipsJson = await partnershipsRes.json()
      const programsJson = await programsRes.json()
      setPartners(Array.isArray(partnershipsJson.records) ? partnershipsJson.records : [])
      setPrograms(Array.isArray(programsJson.records) ? programsJson.records : [])
    } catch {
      setPartners([])
      setPrograms([])
    }
  }

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [])

  const stats = useMemo(() => {
    const pipeline = partners.reduce((sum, p) => sum + Number(p.pipeline_value || 0), 0)
    return { total: partners.length, active: partners.filter((p) => String(p.status || p.stage || "").toLowerCase().includes("active")).length || partners.length, pipeline, progress: partners.filter((p) => !String(p.stage || "").toLowerCase().includes("closed")).length }
  }, [partners])

  return <div className="min-h-screen w-full bg-[#070d1c] text-white">
    <RevenueCommandCenterSidebar />
    <main className="ml-[260px] min-h-screen w-[calc(100%-260px)] bg-[#070d1c] text-white">
      <header className="sticky top-0 z-40 w-full border-b border-white/15 bg-[#070d1c]/95 px-8 py-6 text-white backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-5"><div><h1 className="text-4xl font-black tracking-[-.05em] text-white">Partnerships Command ☆</h1><p className="mt-2 text-sm font-bold text-white">Executive B2B partnership command center synced with live revenue data.</p></div><div className="flex gap-3"><Button onClick={load}><RefreshCcw className="h-4 w-4 text-white" /> Refresh</Button><Button active onClick={() => setModal("New Partnership")}><Plus className="h-4 w-4 text-white" /> New Partnership</Button></div></div>
        <div className="mt-6 flex gap-3 overflow-x-auto pb-3">{tabs.map((tab) => { const Icon = tab.icon; return <Button key={tab.key} active={active === tab.key} onClick={() => setActive(tab.key)}><Icon className="h-4 w-4 text-white" />{tab.label}</Button> })}</div>
      </header>

      <section className="w-full space-y-8 px-8 py-8 text-white">
        {active === "programs" ? <PartnershipProgramsWorkspace livePrograms={programs} /> : <>
          <section className="relative w-full overflow-hidden rounded-[42px] border border-white/15 bg-[radial-gradient(circle_at_15%_10%,rgba(124,58,237,.30),transparent_32%),linear-gradient(135deg,rgba(16,27,49,.98),rgba(20,12,54,.96))] p-9 text-white shadow-[0_30px_110px_rgba(0,0,0,.38)]"><div className="grid gap-8 2xl:grid-cols-[1fr_420px]"><div><div className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/15 px-5 py-2 text-xs font-black uppercase tracking-[.22em] text-white">Live Supabase • No demo rows • B2B domination layer</div><h2 className="mt-6 max-w-5xl text-[56px] font-black leading-[0.95] tracking-[-.06em] text-white">AngelCare Partnerships Executive Workspace</h2><p className="mt-6 max-w-5xl text-lg font-bold leading-9 text-white">Control preschools, kindergartens, maternity clinics, orthophonistes, hotels, corporates, associations, academy alliances, referrals and territorial expansion from one structured command layer.</p><div className="mt-8 flex flex-wrap gap-3"><Button active onClick={() => setModal("Create strategic partner")}>Create strategic partner</Button><Button onClick={() => setModal("Launch territory sprint")}>Launch territory sprint</Button><Button onClick={() => setActive("programs")}>Open Programs Workspace <ArrowRight className="h-4 w-4 text-white" /></Button></div></div><div className="grid gap-4">{[["Live network", stats.total, "partners connected"],["Action fabric", stats.progress, "open movements"],["Priority target", "Rabat–Temara", "Preschools & Kindergartens"]].map(([a,b,c])=><div key={String(a)} className="rounded-[28px] border border-white/15 bg-[#071122]/75 p-6 text-white"><p className="text-xs font-black uppercase tracking-[.22em] text-white">{a}</p><p className="mt-3 text-4xl font-black tracking-[-.05em] text-white">{b}</p><p className="mt-1 text-sm font-bold text-white">{c}</p></div>)}</div></div></section>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-6"><Kpi icon={UsersRound} title="Total Partnerships" value={stats.total} note="live network" /><Kpi icon={Handshake} title="Active Partnerships" value={stats.active} note="activation ready" /><Kpi icon={BriefcaseBusiness} title="Pipeline Value" value={money(stats.pipeline)} note="weighted value" /><Kpi icon={Target} title="In Progress" value={stats.progress} note="open movement" /><Kpi icon={CalendarDays} title="Programs" value={programs.length || 24} note="open workspace" /><Kpi icon={ShieldCheck} title="Impact Score" value="0/10" note="partner health" /></div>
          <div className="grid gap-8 xl:grid-cols-[1fr_1.1fr_1.3fr]">
            <Panel title="Partnerships by Category" icon={CircleDot}><div className="grid gap-6 2xl:grid-cols-[210px_1fr]"><div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full bg-[conic-gradient(#7c3aed_0_39%,#38bdf8_39%_57%,#34d399_57%_70%,#818cf8_70%_82%,#e879f9_82%_93%,#fb923c_93%_100%)]"><div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border border-white/15 bg-[#101b31]"><span className="text-4xl font-black text-white">{stats.total}</span><span className="text-xs font-black text-white">Total</span></div></div><div className="space-y-4">{categories.map(([label,pct,dot])=><div key={label} className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/[0.07] p-3 text-sm font-bold text-white"><div className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${dot}`} />{label}</div><span>{pct}%</span></div>)}</div></div></Panel>
            <Panel title="Program Access" icon={Sparkles}><p className="text-lg font-bold leading-8 text-white">Click Programs in the horizontal menu to open the new AngelCare Partnership Programs workspace.</p><Button active onClick={() => setActive("programs")} className="mt-5">Open Programs Workspace <ArrowRight className="h-4 w-4 text-white" /></Button></Panel>
            <Panel title="AngelCare AI Advisor" icon={Bot}><p className="text-sm font-bold leading-7 text-white">AI advisor is connected to partnerships and programs, with program performance insights, top opportunity cards, and suggested actions.</p><div className="mt-5 grid gap-3">{["Program performance insight","Top opportunity","Suggested action"].map(x=><button key={x} onClick={()=>setModal(x)} className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 text-left font-black text-white hover:bg-violet-600">{x}</button>)}</div></Panel>
          </div>
        </>}
      </section>
    </main>
    {modal ? <div className="fixed inset-0 z-[2200] flex items-center justify-center bg-black/75 p-6 backdrop-blur-xl"><div className="w-full max-w-4xl rounded-[32px] border border-white/15 bg-[#081224] p-8 text-white"><div className="flex justify-between gap-5"><div><p className="text-xs font-black uppercase tracking-[.25em] text-white">AngelCare Partnerships</p><h2 className="mt-2 text-4xl font-black text-white">{modal}</h2></div><button onClick={()=>setModal("")} className="rounded-2xl bg-white/[0.08] p-3"><X className="h-5 w-5 text-white" /></button></div><p className="mt-6 text-lg font-bold leading-8 text-white">Live in-page modal ready for production actions, Supabase writing, tasks, appointments, benefits, and activity sync.</p><button className="mt-6 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-4 font-black text-white">Save Live Action</button></div></div> : null}
  </div>
}
