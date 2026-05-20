
"use client"

import { useMemo, useState } from "react"
import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import {
  AlertTriangle, BarChart3, Bot, Calendar, CheckCircle2, ClipboardCheck, Clock, Download,
  Filter, Gift, GraduationCap, Grid2X2, LineChart, MapPinned, MoreHorizontal, Plus,
  Search, Send, ShieldCheck, Target, Trophy, Users, Wallet, X, UserPlus, Route, BadgeCheck
} from "lucide-react"

type ModalKey = "__none__" | null

const kpis = [{"label": "Overall Goal", "value": "75%", "icon": "Target", "color": "text-violet-600"}, {"label": "KPIs Active", "value": "42", "icon": "BarChart3", "color": "text-blue-600"}, {"label": "At Risk", "value": "8", "icon": "AlertTriangle", "color": "text-rose-600"}, {"label": "Achieved", "value": "936", "icon": "CheckCircle2", "color": "text-emerald-600"}, {"label": "Reviews", "value": "18", "icon": "Clock", "color": "text-orange-600"}]
const rows = [["Monthly visits target", "Operations", "Tracking", 78, "Open"], ["Proof quality KPI", "Quality Control", "Validation", 84, "In Progress"], ["B2B lead conversion", "Growth", "Target Gap", 61, "Critical"], ["Training completion KPI", "Academy", "Achieved", 95, "Approved"]]
const actions = [{"key": "kpi-0", "label": "Create Goal", "icon": "Target", "description": "Create measurable network, regional or individual goals.", "ref": "AC-MOS-AMB-KPI-001", "workflow": ["Define metric", "Set target", "Assign owner", "Link tasks", "Schedule review"], "controls": ["Unique reference ID", "Owner assigned", "Deadline required", "Audit log", "Role-gated approval"], "ai": ["Use this workflow only with owner and deadline.", "Create action tasks automatically after execution.", "Sync output to reports and ambassador profile."]}, {"key": "kpi-1", "label": "Build KPI Scorecard", "icon": "BarChart3", "description": "Build a scorecard combining visits, leads, proof and training.", "ref": "AC-MOS-AMB-KPI-002", "workflow": ["Select KPIs", "Set weights", "Test score", "Approve version", "Publish"], "controls": ["Unique reference ID", "Owner assigned", "Deadline required", "Audit log", "Role-gated approval"], "ai": ["Use this workflow only with owner and deadline.", "Create action tasks automatically after execution.", "Sync output to reports and ambassador profile."]}, {"key": "kpi-2", "label": "Assign Targets", "icon": "Users", "description": "Assign goals to groups, cities or individual ambassadors.", "ref": "AC-MOS-AMB-KPI-003", "workflow": ["Choose scope", "Set target", "Assign owner", "Notify team", "Track progress"], "controls": ["Unique reference ID", "Owner assigned", "Deadline required", "Audit log", "Role-gated approval"], "ai": ["Use this workflow only with owner and deadline.", "Create action tasks automatically after execution.", "Sync output to reports and ambassador profile."]}, {"key": "kpi-3", "label": "Review Gap", "icon": "AlertTriangle", "description": "Investigate KPI underperformance and create recovery plan.", "ref": "AC-MOS-AMB-KPI-004", "workflow": ["Identify gap", "Find cause", "Create tasks", "Assign owner", "Review progress"], "controls": ["Unique reference ID", "Owner assigned", "Deadline required", "Audit log", "Role-gated approval"], "ai": ["Use this workflow only with owner and deadline.", "Create action tasks automatically after execution.", "Sync output to reports and ambassador profile."]}, {"key": "kpi-4", "label": "Create Tasks", "icon": "ClipboardCheck", "description": "Turn KPI gaps into executable tasks with SLAs.", "ref": "AC-MOS-AMB-KPI-005", "workflow": ["Select KPI", "Create task", "Assign owner", "Set SLA", "Track close"], "controls": ["Unique reference ID", "Owner assigned", "Deadline required", "Audit log", "Role-gated approval"], "ai": ["Use this workflow only with owner and deadline.", "Create action tasks automatically after execution.", "Sync output to reports and ambassador profile."]}, {"key": "kpi-5", "label": "Export KPI Pack", "icon": "Download", "description": "Export goals, scorecards, gaps and action plans.", "ref": "AC-MOS-AMB-KPI-006", "workflow": ["Select scope", "Pick fields", "Generate file", "Share owners", "Archive"], "controls": ["Unique reference ID", "Owner assigned", "Deadline required", "Audit log", "Role-gated approval"], "ai": ["Use this workflow only with owner and deadline.", "Create action tasks automatically after execution.", "Sync output to reports and ambassador profile."]}]

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span><input type={type} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" /></label>
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span><select className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100">{options.map((x) => <option key={x}>{x}</option>)}</select></label>
}

function ToggleRow({ children }: { children: React.ReactNode }) {
  return <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold hover:border-violet-300 hover:bg-violet-50"><input type="checkbox" className="h-4 w-4 accent-violet-600" /><span>{children}</span></label>
}

function RadioAiPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-emerald-400/40 bg-[#06140d] p-5 text-emerald-100 shadow-[0_0_34px_rgba(16,185,129,0.18)]">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(52,211,153,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.11)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10 text-emerald-300"><Bot size={24} /></div><div><div className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">AI SIGNAL ONLINE</div><h3 className="font-mono text-lg font-black uppercase tracking-wide text-emerald-100">{title}</h3><p className="font-mono text-xs font-bold text-emerald-300/80">Operational decision layer</p></div></div>
      <div className="relative mt-5 space-y-3">{items.map((item, i) => <div key={item} className="rounded-2xl border border-emerald-400/25 bg-black/30 p-4 font-mono text-sm font-bold leading-relaxed text-emerald-100"><span className="mr-2 text-emerald-300">[{String(i + 1).padStart(2, "0")}]</span>{item}</div>)}</div>
    </div>
  )
}

function IconByName({ name, className = "", size = 22 }: { name: string; className?: string; size?: number }) {
  const map: Record<string, any> = { AlertTriangle, BarChart3, Calendar, CheckCircle2, ClipboardCheck, Clock, Download, Filter, Gift, GraduationCap, Grid2X2, LineChart, MapPinned, Plus, Search, Send, ShieldCheck, Target, Trophy, Users, Wallet, UserPlus, Route, BadgeCheck }
  const Icon = map[name] || Users
  return <Icon className={className} size={size} />
}

function ActionModal({ action, onClose }: { action: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-[1460px] overflow-y-auto rounded-[38px] border border-white/70 bg-white shadow-2xl">
        <header className="relative overflow-hidden rounded-t-[38px] bg-gradient-to-r from-slate-950 via-violet-800 to-blue-700 p-7 text-white">
          <IconByName name={action.icon} className="absolute -right-10 -top-10 opacity-15" size={230} />
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15"><IconByName name={action.icon} size={30} /></div>
              <div><div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Angelcare Ambassador Management</div><h2 className="mt-2 text-3xl font-black tracking-tight">{action.label}</h2><p className="mt-2 max-w-4xl text-sm font-semibold text-white/80">{action.description}</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/25 bg-slate-950/30 p-2 shadow-2xl backdrop-blur-md">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg"><CheckCircle2 size={17} />Execute</button>
              <button onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-black text-white shadow-lg"><X size={17} />Close</button>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-[1.35fr_0.75fr] gap-6 p-7">
          <main className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"><h3 className="text-xl font-black">Production Setup</h3><div className="mt-5 grid grid-cols-3 gap-4"><Field label="Reference" placeholder={action.ref} /><SelectField label="Owner" options={["Operations","HR","Finance","Regional Manager","Training Lead","Direction Rabat"]} /><SelectField label="Priority" options={["Critical","High","Medium","Low"]} /><Field label="Deadline" placeholder="Today / This week / Custom" /><SelectField label="Region" options={["All Morocco","Casablanca-Settat","Rabat-Salé-Kénitra","Marrakech-Safi","Souss-Massa","Oriental"]} /><SelectField label="Status" options={["Draft","Open","In Progress","Approved","Closed"]} /></div></section>
            <section className="grid grid-cols-2 gap-5"><div className="rounded-[28px] border border-slate-200 bg-white p-5"><h3 className="text-lg font-black">Workflow Checklist</h3><div className="mt-4 space-y-3">{action.workflow.map((x: string) => <ToggleRow key={x}>{x}</ToggleRow>)}</div></div><div className="rounded-[28px] border border-slate-200 bg-white p-5"><h3 className="text-lg font-black">Decision Log</h3><textarea className="mt-4 h-48 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-violet-400" placeholder="Add decision, justification, owner, deadline and next control point..." /><button className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Save Decision</button></div></section>
          </main>
          <aside className="space-y-5"><RadioAiPanel title={action.label + " AI"} items={action.ai} /><div className="rounded-[28px] border border-slate-200 bg-white p-5"><h3 className="text-lg font-black">Controls</h3><div className="mt-4 space-y-3">{action.controls.map((x: string) => <ToggleRow key={x}>{x}</ToggleRow>)}</div></div></aside>
        </div>
      </div>
    </div>
  )
}

export default function AmbassadorGoalsKpisWorkspace() {
  const [active, setActive] = useState<any>(null)
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"board" | "table">("board")
  const [status, setStatus] = useState("")

  const filteredRows = rows.filter((row: any[]) => row.join(" ").toLowerCase().includes(query.toLowerCase()))

  function exportCsv() {
    const csv = [["Name","Owner","Stage","Score","Status"], ...filteredRows].map((r) => r.map((c: any) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "goals-kpis-workspace-export.csv"
    a.click()
    URL.revokeObjectURL(url)
    setStatus("CSV export generated for the current filtered workspace.")
  }

  return (
    <div className="flex min-h-screen bg-white text-slate-950">
      <AmbassadorMarketSidebar />
      <main className="flex-1 bg-white px-8 py-7">
        <header className="mb-6 flex items-start justify-between"><div><div className="text-xs font-black uppercase tracking-[0.24em] text-violet-600">Ambassador Management</div><h1 className="mt-2 text-[32px] font-black tracking-tight">Goals & KPIs Command Center</h1><p className="mt-1 text-sm font-semibold text-slate-500">Set, monitor, adjust and govern ambassador goals, KPI scorecards and execution outcomes.</p></div><div className="flex gap-2"><button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black shadow-sm"><Download size={16} />Export</button><button onClick={() => setActive(actions[0])} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-100"><Plus size={16} />New Action</button></div></header>
        {status && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">{status}</div>}
        <section className="grid grid-cols-5 gap-4">{kpis.map((kpi: any) => <button key={kpi.label} onClick={() => setStatus(kpi.label + " gateway opened and synced.")} className="rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-violet-300 hover:bg-violet-50"><IconByName name={kpi.icon} className={kpi.color} size={23}/><div className="mt-3 text-2xl font-black">{kpi.value}</div><div className="text-xs font-black uppercase text-slate-500">{kpi.label}</div></button>)}</section>
        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="grid grid-cols-[1.3fr_repeat(4,0.55fr)_0.4fr] gap-4"><label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full outline-none" placeholder="Search workspace..." /></label><SelectField label="" options={["All Regions","Casablanca-Settat","Rabat-Salé-Kénitra","Marrakech-Safi","Souss-Massa"]} /><SelectField label="" options={["All Owners","Operations","HR","Finance","Regional Manager"]} /><SelectField label="" options={["All Status","Draft","Open","In Progress","Approved","Closed"]} /><button onClick={() => setStatus("Advanced filters connected to this workspace.")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black"><Filter size={16}/>More Filters</button><button onClick={() => setView(view === "board" ? "table" : "board")} className="grid place-items-center rounded-2xl border border-slate-200"><Grid2X2 size={18}/></button></div></section>
        <section className="mt-5 grid grid-cols-[1.15fr_0.85fr] gap-5"><div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">Goals & KPIs Control Board</h2><span className="rounded-full bg-violet-100 px-4 py-2 text-xs font-black text-violet-700">{filteredRows.length} records</span></div>{view === "board" ? <div className="grid grid-cols-2 gap-4">{filteredRows.map((row: any[], index: number) => <button key={row.join("-")} onClick={() => setActive(actions[index % actions.length])} className="rounded-[24px] border border-slate-200 p-5 text-left transition hover:border-violet-300 hover:bg-violet-50"><div className="flex items-center justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 font-black text-violet-700">{index + 1}</div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">{row[4]}</span></div><h3 className="mt-4 text-lg font-black">{row[0]}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{row[1]} · {row[2]}</p><div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: `${row[3]}%` }} /></div></button>)}</div> : <table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs font-black text-slate-500"><th className="pb-3">Name</th><th>Owner</th><th>Stage</th><th>Score</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredRows.map((row: any[], index: number) => <tr key={row.join("-")} className="border-b border-slate-100"><td className="py-3 font-black">{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}%</td><td>{row[4]}</td><td><button onClick={() => setActive(actions[index % actions.length])}><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table>}</div><aside className="space-y-5"><RadioAiPanel title="Goals & KPIs AI Command" items={["Prioritize records with risk, missing owners or blocked approvals.", "Every action requires owner, deadline, evidence and next review date.", "Exports and dashboards are synced to the current filters."]} /><div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Quick Actions</h2><div className="mt-5 grid grid-cols-2 gap-3">{actions.map((a: any) => <button key={a.key} onClick={() => setActive(a)} className="grid min-h-[92px] place-items-center rounded-2xl border border-slate-200 text-center text-xs font-black transition hover:border-violet-300 hover:bg-violet-50"><IconByName name={a.icon} className="text-violet-600" size={22}/>{a.label}</button>)}</div></div></aside></section>
        {active && <ActionModal action={active} onClose={() => setActive(null)} />}
      </main>
    </div>
  )
}
