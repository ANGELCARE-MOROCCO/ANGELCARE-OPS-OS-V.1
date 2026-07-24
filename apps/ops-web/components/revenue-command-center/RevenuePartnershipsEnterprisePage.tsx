"use client"
import { shouldStartAutoRefresh, safeRefreshInterval } from '@/lib/runtime/client-live-governor'

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Activity, ArrowRight, BarChart3, Bot, BriefcaseBusiness, Building2, CalendarDays, CircleDot, FileSignature, Handshake, HeartHandshake, MapPin, Megaphone, Network, Plus, RefreshCcw, Search, ShieldCheck, Sparkles, Stethoscope, Target, UsersRound, X } from "lucide-react"
import { RevenueCommandCenterSidebar } from "./RevenueCommandCenterSidebar"
import PartnershipProgramsWorkspace from "./PartnershipProgramsWorkspace"
import PartnersDirectoryWorkspace from "./PartnersDirectoryWorkspace"

type Partner = Record<string, any>
type WorkspaceKey = "overview" | "partners" | "programs"

const tabs: { key: WorkspaceKey; label: string; icon: any }[] = [
  { key: "overview", label: "Vue exécutive", icon: Sparkles },
  { key: "partners", label: "Partenaires", icon: Handshake },
  { key: "programs", label: "Programmes", icon: UsersRound },
]

const categories = [
  ["Preschools & Kindergartens", 38.5, "bg-violet-500"], ["Maternity Clinics", 17.8, "bg-cyan-400"], ["Orthophonistes", 12.6, "bg-emerald-400"],
  ["Hotels", 11.2, "bg-blue-400"], ["Corporates", 11.2, "bg-fuchsia-400"], ["Associations", 8.7, "bg-orange-400"],
] as const

function money(value = 0) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)} M Dh`
  if (value >= 1000) return `${Math.round(value / 1000)} k Dh`
  return `${value} Dh`
}

function Button({ children, active, onClick, className = "" }: { children: ReactNode; active?: boolean; onClick?: () => void; className?: string }) {
  return <button type="button" onClick={onClick} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition-all active:scale-[.98] ${active ? "bg-[#123f6e] text-white shadow-[0_12px_28px_rgba(18,63,110,.20)] hover:bg-[#0d3158]" : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"} ${className}`}>{children}</button>
}

function Panel({ title, icon: Icon, children }: { title: string; icon?: any; children: ReactNode }) {
  return <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-7 text-slate-900 shadow-[0_16px_48px_rgba(23,58,91,.07)]"><div className="mb-6 flex items-center gap-3">{Icon ? <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50"><Icon className="h-5 w-5 text-[#1768aa]" /></div> : null}<h3 className="text-[22px] font-black tracking-[-0.03em] text-[#0b2345]">{title}</h3></div>{children}</section>
}

function Kpi({ icon: Icon, title, value, note }: any) {
  return <div className="rounded-[20px] border border-slate-200 bg-white p-6 text-slate-900 shadow-[0_14px_42px_rgba(23,58,91,.06)]"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50"><Icon className="h-6 w-6 text-[#1768aa]" /></div><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{title}</p><h4 className="mt-1 text-3xl font-black tracking-[-.04em] text-[#0b2345]">{value}</h4><p className="mt-1 text-xs font-bold text-slate-500">{note}</p></div></div></div>
}

export default function RevenuePartnershipsEnterprisePage() {
  const [active, setActive] = useState<WorkspaceKey>("overview")
  const [partners, setPartners] = useState<Partner[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [modal, setModal] = useState("")

  async function load() {
    try {
      const [partnershipsRes, programsRes] = await Promise.all([
        fetch("/api/revenue-command-center/partnerships/enterprise", { cache: "no-store" }),
        fetch("/api/revenue-command-center/partnership-programs", { cache: "no-store" }),
      ])
      const partnershipsJson = await partnershipsRes.json()
      const programsJson = await programsRes.json()
      setPartners(Array.isArray(partnershipsJson.partners) ? partnershipsJson.partners : Array.isArray(partnershipsJson.records) ? partnershipsJson.records : [])
      setPrograms(Array.isArray(programsJson.records) ? programsJson.records : [])
    } catch {
      setPartners([])
      setPrograms([])
    }
  }

  if (!shouldStartAutoRefresh()) return
  useEffect(() => { load(); const t = setInterval(load, safeRefreshInterval(15000)); return () => clearInterval(t) }, [])

  const stats = useMemo(() => {
    const pipeline = partners.reduce((sum, p) => sum + Number(p.pipeline_value || 0), 0)
    return { total: partners.length, active: partners.filter((p) => String(p.status || p.stage || "").toLowerCase().includes("active")).length || partners.length, pipeline, progress: partners.filter((p) => !String(p.stage || "").toLowerCase().includes("closed")).length }
  }, [partners])

  return <div className="min-h-screen w-full bg-[radial-gradient(circle_at_80%_-10%,rgba(65,151,221,.11),transparent_30%),linear-gradient(180deg,#f8fbfe_0%,#eef4f9_100%)] text-slate-900">
    <RevenueCommandCenterSidebar />
    <main className="min-h-screen w-full bg-transparent text-slate-900 xl:ml-[260px] xl:w-[calc(100%-260px)]">
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/92 px-8 py-5 text-slate-900 shadow-[0_8px_28px_rgba(24,52,80,.04)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-5"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#1768aa]">ANGELCARE Revenue Command OS</p><h1 className="mt-1 text-4xl font-black tracking-[-.05em] text-[#0b2345]">Commandement des partenariats</h1><p className="mt-2 text-sm font-semibold text-slate-500">Pilotage exécutif B2B synchronisé avec les données revenu existantes.</p></div><div className="flex gap-3"><Button onClick={load}><RefreshCcw className="h-4 w-4" /> Actualiser</Button><Button active onClick={() => setModal("Nouveau partenariat")}><Plus className="h-4 w-4" /> Nouveau partenariat</Button></div></div>
        <div className="mt-6 flex gap-3 overflow-x-auto pb-3">{tabs.map((tab) => { const Icon = tab.icon; return <Button key={tab.key} active={active === tab.key} onClick={() => setActive(tab.key)}><Icon className="h-4 w-4" />{tab.label}</Button> })}</div>
      </header>

      <section className="w-full space-y-8 px-8 py-8 text-slate-900">
        {active === "partners" ? <PartnersDirectoryWorkspace partners={partners} programs={programs} onClose={() => setActive("overview")} onRefresh={load} /> : active === "programs" ? <PartnershipProgramsWorkspace livePrograms={programs} /> : <>
          <section className="relative w-full overflow-hidden rounded-[42px] border border-white/15 bg-[radial-gradient(circle_at_15%_10%,rgba(124,58,237,.30),transparent_32%),linear-gradient(135deg,rgba(16,27,49,.98),rgba(20,12,54,.96))] p-9 text-white shadow-[0_30px_110px_rgba(0,0,0,.38)]"><div className="grid gap-8 2xl:grid-cols-[1fr_420px]"><div><div className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/15 px-5 py-2 text-xs font-black uppercase tracking-[.22em] text-white">Données actives • Aucun enregistrement artificiel • Gouvernance B2B</div><h2 className="mt-6 max-w-5xl text-[56px] font-black leading-[0.95] tracking-[-.06em] text-white">Espace exécutif des partenariats ANGELCARE</h2><p className="mt-6 max-w-5xl text-lg font-bold leading-9 text-white">Pilotez les écoles, crèches, cliniques, orthophonistes, hôtels, entreprises, associations, alliances Academy, recommandations et expansion territoriale depuis une seule couche structurée.</p><div className="mt-8 flex flex-wrap gap-3"><Button active onClick={() => setModal("Créer un partenaire stratégique")}>Créer un partenaire stratégique</Button><Button onClick={() => setModal("Lancer un sprint territorial")}>Lancer un sprint territorial</Button><Button onClick={() => setActive("programs")}>Ouvrir les programmes <ArrowRight className="h-4 w-4" /></Button></div></div><div className="grid gap-4">{[["Réseau actif", stats.total, "partenaires connectés"],["Tissu d’exécution", stats.progress, "mouvements ouverts"],["Cible prioritaire", "Rabat–Temara", "Preschools & Kindergartens"]].map(([a,b,c])=><div key={String(a)} className="rounded-[28px] border border-white/15 bg-[#071122]/75 p-6 text-white"><p className="text-xs font-black uppercase tracking-[.22em] text-white">{a}</p><p className="mt-3 text-4xl font-black tracking-[-.05em] text-white">{b}</p><p className="mt-1 text-sm font-bold text-white">{c}</p></div>)}</div></div></section>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-6"><Kpi icon={UsersRound} title="Partenariats" value={stats.total} note="réseau actif" /><Kpi icon={Handshake} title="Partenariats actifs" value={stats.active} note="activation et croissance" /><Kpi icon={BriefcaseBusiness} title="Valeur pipeline" value={money(stats.pipeline)} note="valeur disponible" /><Kpi icon={Target} title="En progression" value={stats.progress} note="mouvements ouverts" /><Kpi icon={CalendarDays} title="Programmes" value={programs.length} note="programmes disponibles" /><Kpi icon={ShieldCheck} title="Taux actif" value={stats.total ? `${Math.round((stats.active / stats.total) * 100)}%` : "—"} note="partenaires actuellement actifs" /></div>
          <div className="grid gap-8 xl:grid-cols-[1fr_1.1fr_1.3fr]">
            <Panel title="Partenariats par catégorie" icon={CircleDot}><div className="grid gap-6 2xl:grid-cols-[210px_1fr]"><div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full bg-[conic-gradient(#7c3aed_0_39%,#38bdf8_39%_57%,#34d399_57%_70%,#818cf8_70%_82%,#e879f9_82%_93%,#fb923c_93%_100%)]"><div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border border-white/15 bg-[#101b31]"><span className="text-4xl font-black text-white">{stats.total}</span><span className="text-xs font-black text-white">Total</span></div></div><div className="space-y-4">{categories.map(([label,pct,dot])=><div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700"><div className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${dot}`} />{label}</div><span>{pct}%</span></div>)}</div></div></Panel>
            <Panel title="Accès aux programmes" icon={Sparkles}><p className="text-lg font-semibold leading-8 text-slate-600">Ouvrez les programmes depuis le menu horizontal pour accéder à l’espace de gestion des programmes partenaires ANGELCARE.</p><Button active onClick={() => setActive("programs")} className="mt-5">Ouvrir les programmes <ArrowRight className="h-4 w-4 text-white" /></Button></Panel>
            <Panel title="Conseiller d’intelligence ANGELCARE" icon={Bot}><p className="text-sm font-semibold leading-7 text-slate-600">Le conseiller est relié aux partenariats et programmes existants pour présenter les analyses, opportunités et actions disponibles.</p><div className="mt-5 grid gap-3">{["Analyse de performance programme","Opportunité prioritaire","Action recommandée"].map(x=><button key={x} onClick={()=>setModal(x)} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left font-black text-slate-700 hover:border-blue-200 hover:bg-blue-50">{x}</button>)}</div></Panel>
          </div>
        </>}
      </section>
    </main>
    {modal ? <div className="fixed inset-0 z-[2200] flex items-center justify-center bg-black/55 p-6 backdrop-blur-xl"><div className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white p-8 text-slate-900 shadow-2xl"><div className="flex justify-between gap-5"><div><p className="text-xs font-black uppercase tracking-[.25em] text-[#1768aa]">ANGELCARE • Partenariats</p><h2 className="mt-2 text-4xl font-black text-[#0b2345]">{modal}</h2></div><button onClick={()=>setModal("")} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700"><X className="h-5 w-5 text-slate-700" /></button></div><p className="mt-6 text-lg font-semibold leading-8 text-slate-600">Cette action reste reliée aux écritures, tâches, rendez-vous, bénéfices et activités déjà prévus par le module partenariats.</p><button className="mt-6 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-4 font-black text-white">Enregistrer l’action</button></div></div> : null}
  </div>
}
