
"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  Filter,
  Gift,
  Grid2X2,
  LineChart,
  MapPinned,
  Megaphone,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react"

type TupleIcon = React.ComponentType<{ size?: number; className?: string }>

type ModalKey =
  | "add"
  | "assign"
  | "activity"
  | "announcement"
  | "report"
  | "dashboard"
  | "performance"
  | "map"
  | "goals"
  | "ambassador"
  | null

const ambassadors = [
  { name: "Youssef El Fassi", city: "Casablanca", region: "Casablanca-Settat", group: "Elite Performers", status: "Active", score: 98, tasks: 42, last: "Today, 10:45 AM" },
  { name: "Fatima Zahra Ait", city: "Rabat", region: "Rabat-Salé-Kénitra", group: "Top Performers", status: "Active", score: 96, tasks: 38, last: "Today, 09:15 AM" },
  { name: "Omar Kabbaj", city: "Marrakech", region: "Marrakech-Safi", group: "Top Performers", status: "Active", score: 94, tasks: 35, last: "Yesterday, 06:30 PM" },
  { name: "Imane Lahlou", city: "Fes", region: "Fès-Meknès", group: "Core Team", status: "Active", score: 92, tasks: 31, last: "Yesterday, 04:20 PM" },
  { name: "Ahmed Benali", city: "Tangier", region: "Tanger-Tétouan-Al Hoceima", group: "Core Team", status: "Active", score: 91, tasks: 29, last: "May 29, 2025" },
]

const sideGroups = [
  {
    title: "MAIN",
    links: [
      ["Overview", "/market-os/ambassadors", Users],
      ["Ambassadors", "/market-os/ambassadors/directory", Users],
      ["Territories", "/market-os/ambassadors/territories", MapPinned],
      ["Performance", "/market-os/ambassadors/performance", LineChart],
      ["Activities", "/market-os/ambassadors/activities", Activity],
      ["Reports", "/market-os/ambassadors/reports", FileText],
    ],
  },
  {
    title: "AMBASSADOR MANAGEMENT",
    links: [
      ["Recruitment", "/market-os/ambassadors/recruitment", UserPlus],
      ["Onboarding", "/market-os/ambassadors/onboarding", ClipboardCheck],
      ["Training & Certification", "/market-os/ambassadors/training-certification", ShieldCheck],
      ["Goals & KPIs", "/market-os/ambassadors/goals-kpis", Target],
      ["Incentives", "/market-os/ambassadors/incentives", Gift],
    ],
  },
  {
    title: "FIELD OPERATIONS",
    links: [
      ["Missions", "/market-os/ambassadors/missions", Activity],
      ["Visits & Check-ins", "/market-os/ambassadors/visits", CheckCircle2],
      ["Task Management", "/market-os/ambassadors/tasks", ClipboardCheck],
      ["Tickets & Requests", "/market-os/ambassadors/tickets", FileText],
    ],
  },
  {
    title: "SYSTEM",
    links: [
      ["Settings", "/market-os/ambassadors/settings", Settings],
      ["Integrations", "/market-os/ambassadors/integrations", Grid2X2],
      ["Access & Permissions", "/market-os/ambassadors/access", ShieldCheck],
    ],
  },
] as const

function Sidebar() {
  return (
    <aside className="sticky top-0 h-screen w-[252px] shrink-0 border-r border-slate-100 bg-white px-5 py-6">
      <div className="mb-7">
        <div className="text-xs font-black uppercase tracking-[0.28em] text-violet-600">Angelcare</div>
        <div className="mt-1 text-xl font-black text-slate-950">Ambassadors</div>
      </div>
      <nav className="space-y-6">
        {sideGroups.map((group) => (
          <section key={group.title}>
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{group.title}</div>
            <div className="space-y-1">
              {group.links.map(([label, href, Icon]) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-black transition ${
                    href === "/market-os/ambassadors" ? "bg-violet-50 text-violet-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </nav>
      <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Sparkles className="text-violet-600" size={20} />
          <div>
            <div className="text-sm font-black text-violet-700">Ask Angel AI</div>
            <div className="text-xs font-semibold text-slate-500">Your AI Assistant</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function KpiCard({ label, value, meta, icon: Icon, tint, onClick }: any) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:bg-violet-50">
      <div className="flex items-center gap-3">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl ${tint}`}><Icon size={20}/></div>
        <div>
          <div className="text-[11px] font-black text-slate-500">{label as string}</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{value as string}</div>
          <div className="mt-1 text-[11px] font-black text-emerald-600">{meta}</div>
        </div>
      </div>
    </button>
  )
}

function MoroccoMap({ onOpen }: { onOpen: () => void }) {
  return (
    <div onClick={onOpen} className="relative h-[420px] cursor-pointer overflow-hidden rounded-[26px] bg-violet-50">
      <div className="absolute left-[155px] top-[42px] h-[330px] w-[500px] rotate-[-18deg] rounded-[38%_62%_45%_55%] bg-gradient-to-br from-violet-300/70 via-violet-200/75 to-violet-100" />
      {[
        ["86", "Tangier", "left-[405px] top-[25px]"],
        ["112", "Rabat", "left-[315px] top-[100px]"],
        ["234", "Casablanca", "left-[215px] top-[165px]"],
        ["68", "Fes", "left-[460px] top-[122px]"],
        ["45", "Oujda", "left-[610px] top-[145px]"],
        ["124", "Marrakech", "left-[350px] top-[265px]"],
        ["67", "Agadir", "left-[235px] top-[330px]"],
      ].map(([v, c, p]) => (
        <div key={c} className={`absolute ${p} flex items-center gap-2`}>
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-sm font-black text-violet-700 shadow-xl">{v}</span>
          <span className="text-xs font-black text-slate-600">{c}</span>
        </div>
      ))}
    </div>
  )
}

function AiPanel() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-emerald-400/40 bg-[#06140d] p-5 text-emerald-100 shadow-[0_0_34px_rgba(16,185,129,0.18)]">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(52,211,153,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.11)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative flex gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10"><Bot /></div>
        <div>
          <div className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">AI SIGNAL ONLINE</div>
          <h3 className="font-mono text-lg font-black uppercase">Network Intelligence</h3>
        </div>
      </div>
      <div className="relative mt-5 space-y-3">
        {["Casablanca leads coverage and should mentor new cities.", "Agadir and Oujda require weekly recovery actions.", "High performers can support onboarding and proof quality."].map((x, i) => (
          <div key={x} className="rounded-2xl border border-emerald-400/25 bg-black/30 p-4 font-mono text-sm font-bold">
            <span className="text-emerald-300">[{String(i+1).padStart(2,"0")}] </span>{x}
          </div>
        ))}
      </div>
    </div>
  )
}

function Modal({ active, onClose }: { active: ModalKey; onClose: () => void }) {
  if (!active) return null
  const titles: Record<string, [string, any]> = {
    add: ["Add Ambassador", UserPlus],
    assign: ["Assign Territory", MapPinned],
    activity: ["Create Activity", Activity],
    announcement: ["Send Announcement", Megaphone],
    report: ["Generate Report", FileText],
    dashboard: ["View Dashboard", Eye],
    performance: ["Performance Report", LineChart],
    map: ["Coverage Map", MapPinned],
    goals: ["Goals Achievement", Target],
    ambassador: ["Ambassador 360 Profile", Users],
  }
  const [title, Icon] = titles[active] || titles.dashboard

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-[1260px] overflow-y-auto rounded-[36px] bg-white shadow-2xl">
        <header className="relative overflow-hidden rounded-t-[36px] bg-gradient-to-r from-slate-950 via-violet-800 to-blue-700 p-7 text-white">
          <Icon className="absolute -right-10 -top-10 opacity-15" size={220} />
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15"><Icon /></div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-white/70">Ambassador Overview Action</div>
                <h2 className="mt-2 text-3xl font-black">{title as string}</h2>
                <p className="mt-2 text-sm font-semibold text-white/75">Production workflow with owner, deadline, task creation, audit and report sync.</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-black">Close</button>
          </div>
        </header>
        <div className="grid grid-cols-[1.2fr_.8fr] gap-6 p-7">
          <main className="space-y-5">
            <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-xl font-black">Action Setup</h3>
              <div className="mt-5 grid grid-cols-3 gap-4">
                {["Reference", "Owner", "Priority", "Region", "Status", "Deadline"].map((x) => (
                  <label key={x} className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{x}</span>
                    <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none" placeholder={x} />
                  </label>
                ))}
              </div>
            </section>
            <section className="grid grid-cols-2 gap-5">
              <div className="rounded-[28px] border border-slate-200 p-5">
                <h3 className="font-black">Execution Checklist</h3>
                {["Owner assigned", "Task generated", "Report synced", "Audit logged", "Notification ready"].map((x) => (
                  <label key={x} className="mt-3 flex gap-3 rounded-2xl border p-3 text-sm font-bold"><input type="checkbox" />{x}</label>
                ))}
              </div>
              <textarea className="h-64 rounded-[28px] border border-slate-200 p-5 text-sm font-bold" placeholder="Decision notes..." />
            </section>
          </main>
          <AiPanel />
        </div>
      </div>
    </div>
  )
}

export default function AmbassadorMainOverviewPage() {
  const [modal, setModal] = useState<ModalKey>(null)
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => ambassadors.filter((a) => `${a.name} ${a.city} ${a.region} ${a.group}`.toLowerCase().includes(query.toLowerCase())), [query])

  function exportCsv() {
    const rows = [["Name","Region","City","Group","Status","Score","Tasks","Last Activity"], ...filtered.map(a => [a.name,a.region,a.city,a.group,a.status,a.score,a.tasks,a.last])]
    const csv = rows.map(r => r.map(c => `"${String(c).replaceAll('"','""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ambassador-overview.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex min-h-screen bg-white text-slate-950">
      <Sidebar />
      <main className="flex-1 px-8 py-7">
        <header className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[30px] font-black tracking-tight">Ambassador Network Overview</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Here&apos;s what&apos;s happening across your ambassador network in Morocco.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black"><Download size={16}/>Export</button>
            <button onClick={() => setModal("add")} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white"><Plus size={16}/>Add Ambassador</button>
          </div>
        </header>

        <section className="grid grid-cols-7 gap-3">
          {[
            ["Total Ambassadors", "1,248", "↑ 12% vs Apr 2025", Users, "bg-violet-100 text-violet-700", "ambassador"],
            ["Active Ambassadors", "1,089", "87% of total", Activity, "bg-emerald-100 text-emerald-700", "dashboard"],
            ["Coverage (Cities)", "168 / 230", "73% Coverage", MapPinned, "bg-blue-100 text-blue-700", "map"],
            ["Total Activities", "4,562", "↑ 18% vs Apr 2025", FileText, "bg-violet-100 text-violet-700", "activity"],
            ["Tasks Completed", "3,847", "84% Completion", Calendar, "bg-emerald-100 text-emerald-700", "dashboard"],
            ["Avg. Performance", "86/100", "↑ 6 pts vs Apr 2025", Trophy, "bg-orange-100 text-orange-700", "performance"],
            ["Incentives Paid", "1.28M MAD", "↑ 15% vs Apr 2025", Wallet, "bg-orange-100 text-orange-700", "report"],
          ].map(([label, value, meta, Icon, tint, key]) => (
            <KpiCard key={String(label)} label={label} value={value} meta={meta} icon={Icon} tint={tint} onClick={() => setModal(key as ModalKey)} />
          ))}
        </section>

        <section className="mt-5 grid grid-cols-[0.95fr_1.25fr_0.85fr] gap-5">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-black">Performance Overview</h2>
              <button onClick={() => setModal("performance")} className="mt-5 flex w-full items-center gap-7 text-left">
                <div className="grid h-48 w-48 place-items-center rounded-full bg-[conic-gradient(#10b981_0_49%,#3b82f6_49%_79%,#f59e0b_79%_95%,#fb7185_95%_100%)]">
                  <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center"><div><div className="text-4xl font-black">86</div><div className="text-xs font-bold">/100</div></div></div>
                </div>
                <div className="space-y-3 text-xs font-black">
                  {["Excellent 612 (49%)", "Good 371 (30%)", "Average 198 (16%)", "Below Average 67 (5%)"].map(x => <div key={x}>{x}</div>)}
                </div>
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="font-black">Top Performing Ambassadors</h2><button onClick={() => setModal("performance")} className="text-xs font-black text-violet-600">This Month</button></div>
              <div className="mt-4 space-y-3">{ambassadors.map((a,i)=><button key={a.name} onClick={()=>setModal("ambassador")} className="grid w-full grid-cols-[28px_1fr_0.8fr_40px] text-left text-xs hover:bg-violet-50 rounded-xl p-2"><span>{i+1}</span><b>{a.name}</b><span>{a.city}</span><b>{a.score}</b></button>)}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Coverage Map</h2><button onClick={() => setModal("map")}><Filter size={18}/></button></div>
            <p className="text-xs font-semibold text-slate-500">Ambassador presence & activity across Morocco</p>
            <MoroccoMap onOpen={() => setModal("map")} />
          </div>

          <div className="space-y-5">
            <button onClick={() => setModal("activity")} className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
              <div className="flex items-center justify-between"><h2 className="font-black">Activity Summary</h2><span className="rounded-xl border px-3 py-2 text-xs font-black">This Month</span></div>
              <div className="mt-5 h-[210px] rounded-2xl bg-gradient-to-t from-violet-50 to-white">
                <svg viewBox="0 0 420 200" className="h-full w-full">
                  <path d="M0,170 L40,130 L85,105 L130,52 L175,112 L220,88 L265,45 L310,65 L355,38 L420,18" fill="none" stroke="#7c3aed" strokeWidth="4"/>
                </svg>
              </div>
            </button>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="font-black">Recent Activities</h2><button onClick={() => setModal("activity")} className="text-xs font-black text-violet-600">View all</button></div>
              <div className="mt-4 space-y-3">{["Completed store visit", "Submitted survey", "Reported issue", "Completed training", "Achieved target"].map((x,i)=><button key={x} onClick={()=>setModal("activity")} className="flex w-full items-center gap-3 rounded-xl p-2 text-left text-xs font-bold hover:bg-violet-50"><Activity size={15} className="text-violet-600"/>{ambassadors[i]?.name} {x}</button>)}</div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-6 gap-3">
          {[
            ["Planned Activities","5,620",Calendar],
            ["Visits Completed","4,102",CheckCircle2],
            ["Surveys Completed","2,876",FileText],
            ["Issues Reported","236",ShieldCheck],
            ["Training Completed","1,026",Trophy],
            ["New Ambassadors","78",UserPlus],
          ].map(([label,value,Icon]) => {
            const I = Icon as any
            return <button key={String(label)} onClick={() => setModal("dashboard")} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-violet-50"><I className="text-violet-600" size={20}/><div className="mt-2 text-xl font-black">{value as string}</div><div className="text-xs font-black text-slate-500">{label as string}</div></button>
          })}
        </section>

        <section className="mt-5 grid grid-cols-[1fr_0.9fr_0.9fr_0.8fr] gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">Ambassadors Directory Snapshot</h2>
            <label className="mt-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold text-slate-500"><Search size={16}/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full outline-none" placeholder="Search ambassadors..." /></label>
            <div className="mt-4 space-y-2">{filtered.map(a=><button key={a.name} onClick={()=>setModal("ambassador")} className="grid w-full grid-cols-[1fr_80px_70px] rounded-xl p-2 text-left text-xs hover:bg-violet-50"><b>{a.name}</b><span>{a.city}</span><span>{a.score}/100</span></button>)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><AiPanel /></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">Goals Achievement</h2>
            <button onClick={() => setModal("goals")} className="mt-5 grid h-48 w-full place-items-center rounded-full bg-[conic-gradient(#10b981_0_75%,#60a5fa_75%_94%,#fb7185_94%_100%)]"><span className="grid h-28 w-28 place-items-center rounded-full bg-white text-center text-3xl font-black">75%</span></button>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">Quick Actions</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[["Add Ambassador",UserPlus,"add"],["Assign Territory",MapPinned,"assign"],["Create Activity",Calendar,"activity"],["Send Announcement",Megaphone,"announcement"],["Generate Report",FileText,"report"],["View Dashboard",Eye,"dashboard"]].map(([label,Icon,key])=>{
                const I = Icon as any
                return <button key={String(label)} onClick={()=>setModal(key as ModalKey)} className="grid min-h-[86px] place-items-center rounded-2xl border text-center text-xs font-black hover:bg-violet-50"><I className="text-violet-600" size={20}/>{label as string}</button>
              })}
            </div>
          </div>
        </section>

        <Modal active={modal} onClose={() => setModal(null)} />
      </main>
    </div>
  )
}
