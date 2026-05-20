"use client"

import { useMemo, useState } from "react"
import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import {
  AlertTriangle, ArrowRight, BadgeCheck, BarChart3, Bot, CalendarClock, CheckCircle2,
  ClipboardCheck, Clock, Download, Eye, FileText, Filter, Gift, GraduationCap, Grid2X2,
  LineChart, MapPinned, MessageSquare, MoreHorizontal, Plus, Radar, Route, Search, Send,
  ShieldCheck, Sparkles, Target, Trophy, UserPlus, Users, Wallet, X, Zap
} from "lucide-react"

function cx(...v: Array<string | false | null | undefined>) { return v.filter(Boolean).join(" ") }

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span><input type={type} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" /></label>
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span><select className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100">{options.map((o) => <option key={o}>{o}</option>)}</select></label>
}

function AiRadio({ title, items }: { title: string; items: string[] }) {
  return <div className="relative overflow-hidden rounded-[30px] border border-emerald-400/40 bg-[#06140d] p-5 text-emerald-100 shadow-[0_0_34px_rgba(16,185,129,0.18)]"><div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(52,211,153,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,.11)_1px,transparent_1px)] [background-size:18px_18px]" /><div className="relative flex gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10"><Bot /></div><div><div className="font-mono text-[10px] font-black uppercase tracking-[.24em] text-emerald-300">AI COMMAND ONLINE</div><h3 className="font-mono text-lg font-black uppercase">{title}</h3></div></div><div className="relative mt-5 space-y-3">{items.map((x,i)=><div key={x} className="rounded-2xl border border-emerald-400/25 bg-black/30 p-4 font-mono text-sm font-bold"><span className="text-emerald-300">[{String(i+1).padStart(2,"0")}] </span>{x}</div>)}</div></div>
}

function ToggleRow({ children }: { children: React.ReactNode }) {
  return <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold hover:border-violet-300 hover:bg-violet-50"><input type="checkbox" className="h-4 w-4 accent-violet-600" /><span>{children}</span></label>
}

function ModalShell({ title, subtitle, children, onClose, tone = "violet" }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void; tone?: string }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-6 backdrop-blur-sm"><div className="max-h-[94vh] w-full max-w-[1500px] overflow-y-auto rounded-[38px] bg-white shadow-2xl"><header className={cx("relative overflow-hidden rounded-t-[38px] p-7 text-white", tone==="dark"?"bg-gradient-to-r from-slate-950 via-blue-950 to-violet-900":"bg-gradient-to-r from-slate-950 via-violet-800 to-blue-700")}><Sparkles className="absolute -right-8 -top-8 opacity-15" size={220}/><div className="flex justify-between gap-6"><div><div className="text-xs font-black uppercase tracking-[.24em] text-white/70">Angelcare Production Workspace</div><h2 className="mt-2 text-3xl font-black">{title}</h2><p className="mt-2 max-w-4xl text-sm font-semibold text-white/80">{subtitle}</p></div><div className="flex h-fit gap-2 rounded-3xl border border-white/25 bg-slate-950/30 p-2"><button className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">Execute</button><button onClick={onClose} className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-black text-white">Close</button></div></div></header>{children}</div></div>
}







function exportCsv(arg1: any, arg2?: any) {
  const filename = typeof arg1 === "string" ? arg1 : typeof arg2 === "string" ? arg2 : "goals-kpis-export.csv"
  const rows = Array.isArray(arg1) ? arg1 : Array.isArray(arg2) ? arg2 : []
  const csv = (Array.isArray(rows) ? rows : [])
    .map((row: any) => (Array.isArray(row) ? row : Object.values(row || {}))
      .map((cell: any) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
      .join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const records: any[][] = [["Monthly visits target","Operations","Tracking",78,"Open"],["Proof quality KPI","Quality Control","Validation",84,"In Progress"],["B2B lead conversion","Growth","Target Gap",61,"Critical"],["Training completion KPI","Academy","Achieved",95,"Approved"]];export default function AmbassadorGoalsKpisWorkspace() {
 const [modal,setModal]=useState<string|null>(null)
 const [grid,setGrid]=useState(true)
 return <div className="flex min-h-screen bg-[#fbfbff] text-slate-950"><AmbassadorMarketSidebar/><main className="flex-1 p-8">
  <header className="bg-gradient-to-r from-slate-950 via-blue-800 to-cyan-500 relative overflow-hidden rounded-[42px] p-8 text-white shadow-2xl"><Target className="absolute right-12 top-8 opacity-20" size={170}/><div className="relative"><div className="text-xs font-black uppercase tracking-[.28em]">Ambassador Management</div><h1 className="mt-3 text-5xl font-black">Goals & KPIs Command Center</h1><p className="mt-3 max-w-3xl text-sm font-semibold text-white/80">Purpose-built production workspace for goals & kpis, not a generic template.</p><div className="mt-6 flex gap-3"><button onClick={()=>setModal("Primary Command")} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">Primary Command</button><button onClick={()=>exportCsv(records, "goals-kpis-export.csv")} className="rounded-2xl border border-white/25 px-5 py-3 text-sm font-black">Export</button></div></div></header>
  <section className="mt-6 grid grid-cols-4 gap-5">{(Array.isArray(records) ? records : []).map((r:any,i:number)=><button key={r[0]} onClick={()=>setModal(r[0])} className="rounded-[30px] border bg-white p-5 text-left shadow-sm hover:border-violet-300"><div className="flex justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700 font-black">{i+1}</div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">{r[4]}</span></div><h3 className="mt-5 text-lg font-black">{r[0]}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{r[1]} · {r[2]}</p><div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{width:`${r[3]}%`}}/></div></button>)}</section>
  <section className="mt-6 grid grid-cols-[1.1fr_.9fr] gap-6"><div className="rounded-[36px] border bg-white p-6 shadow-sm"><div className="flex justify-between"><h2 className="text-2xl font-black">Goals & KPIs Operating Matrix</h2><button onClick={()=>setGrid(!grid)} className="rounded-2xl border px-4 py-2 font-black">Switch View</button></div><div className="mt-5 grid grid-cols-3 gap-3">{['Create Goal', 'Build KPI Scorecard', 'Assign Targets', 'Review Gap', 'Create KPI Tasks', 'Export KPI Pack'].map((a:string)=><button onClick={()=>setModal(a)} key={a} className="min-h-[110px] rounded-2xl border p-4 font-black hover:bg-violet-50">{a}</button>)}</div></div><aside className="space-y-5"><AiRadio title="Goals & KPIs AI" items={["Every execution must create evidence, owner and deadline.", "Critical records create tasks and reports automatically.", "Workspace exports are scoped to active decisions."]}/><div className="rounded-[36px] border bg-white p-6"><h2 className="font-black">Live Controls</h2>{["Approval gate","Task sync","Report sync","Audit log","Role permission"].map(x=><ToggleRow key={x}>{x}</ToggleRow>)}</div></aside></section>
  {modal && <ModalShell title={modal} subtitle="Dedicated goals & kpis operational modal with workflow, governance, owner and decision log." onClose={()=>setModal(null)}><div className="grid grid-cols-[1.2fr_.8fr] gap-6 p-7"><main className="space-y-5"><section className="rounded-[28px] border p-5"><h3 className="text-xl font-black">Goals & KPIs Execution Form</h3><div className="mt-5 grid grid-cols-3 gap-4"><Field label="Reference" placeholder="AC-MOS-GOA-NEW"/><SelectField label="Owner" options={["Operations","Finance","Training Lead","Quality Control","Direction Rabat"]}/><SelectField label="Decision" options={["Draft","Approve","Hold","Escalate","Close"]}/></div></section><section className="grid grid-cols-2 gap-5"><div className="rounded-[28px] border p-5">{["Prepare","Validate","Approve","Notify","Archive"].map(x=><ToggleRow key={x}>{x}</ToggleRow>)}</div><textarea className="h-64 rounded-[28px] border p-5 font-bold" placeholder="Decision log..." /></section></main><AiRadio title="Goals & KPIs Modal AI" items={["Keep the workflow evidence-based.", "Do not close without owner and next review.", "Sync result to reports center."]}/></div></ModalShell>}
 </main></div>
}
