
"use client"

import { useMemo, useState } from "react"
import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Flag,
  Globe2,
  Grid2X2,
  Layers3,
  LineChart,
  MapPinned,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  Navigation,
  Plus,
  RefreshCcw,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react"

type MissionStatus = "Active" | "In Progress" | "Planned" | "On Hold" | "Completed"
type MissionPriority = "Critical" | "High" | "Medium" | "Low"
type ModalKey =
  | "create"
  | "analytics"
  | "export"
  | "map"
  | "mission"
  | "template"
  | "automation"
  | "settings"
  | "feed"
  | null

type Mission = {
  id: string
  name: string
  territory: string
  type: string
  priority: MissionPriority
  ambassadors: string[]
  progress: number
  impact: string
  status: MissionStatus
  score: number
  owner: string
  start: string
  end: string
}

const initialMissions: Mission[] = [
  { id: "AC-MOS-MIS-001", name: "Market Domination - Q2", territory: "Casablanca-Settat", type: "Strategic", priority: "High", ambassadors: ["Youssef", "Fatima", "Omar", "Imane"], progress: 68, impact: "450K MAD", status: "In Progress", score: 92, owner: "Angelcare Ops", start: "May 1", end: "May 31" },
  { id: "AC-MOS-MIS-002", name: "Rabat Preschool Awareness Drive", territory: "Rabat-Salé-Kénitra", type: "Awareness", priority: "Critical", ambassadors: ["Fatima", "Ahmed", "Salma"], progress: 75, impact: "320K MAD", status: "Active", score: 95, owner: "Regional Manager", start: "May 6", end: "Jun 3" },
  { id: "AC-MOS-MIS-003", name: "Marrakech Community Engagement", territory: "Marrakech-Safi", type: "Engagement", priority: "Medium", ambassadors: ["Omar", "Imane"], progress: 93, impact: "210K MAD", status: "Completed", score: 93, owner: "Field Operations", start: "Apr 20", end: "May 20" },
  { id: "AC-MOS-MIS-004", name: "Tangier Partner Acquisition Sprint", territory: "Tanger-Tétouan-Al Hoceima", type: "Partnership", priority: "High", ambassadors: ["Ahmed", "Hicham"], progress: 52, impact: "180K MAD", status: "In Progress", score: 84, owner: "Partnerships", start: "May 12", end: "Jun 12" },
  { id: "AC-MOS-MIS-005", name: "Agadir Recovery & Proof Quality", territory: "Souss-Massa", type: "Quality", priority: "Critical", ambassadors: ["Salma", "Mehdi"], progress: 36, impact: "90K MAD", status: "On Hold", score: 61, owner: "Quality Control", start: "May 18", end: "Jun 5" },
]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function StatusBadge({ status }: { status: MissionStatus }) {
  const cls =
    status === "Completed" ? "bg-emerald-100 text-emerald-700 ring-emerald-200" :
    status === "Active" ? "bg-violet-100 text-violet-700 ring-violet-200" :
    status === "In Progress" ? "bg-blue-100 text-blue-700 ring-blue-200" :
    status === "On Hold" ? "bg-orange-100 text-orange-700 ring-orange-200" :
    "bg-slate-100 text-slate-700 ring-slate-200"
  return <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${cls}`}>{status}</span>
}

function PriorityBadge({ priority }: { priority: MissionPriority }) {
  const cls =
    priority === "Critical" ? "bg-rose-100 text-rose-700 ring-rose-200" :
    priority === "High" ? "bg-orange-100 text-orange-700 ring-orange-200" :
    priority === "Medium" ? "bg-amber-100 text-amber-700 ring-amber-200" :
    "bg-emerald-100 text-emerald-700 ring-emerald-200"
  return <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${cls}`}>{priority}</span>
}

function Field({ label, placeholder, value, onChange, type = "text" }: { label: string; placeholder: string; value?: string; onChange?: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
    </label>
  )
}

function SelectField({ label, options, value, onChange }: { label: string; options: string[]; value?: string; onChange?: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange?.(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
        {options.map((x) => <option key={x}>{x}</option>)}
      </select>
    </label>
  )
}

function ToggleRow({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800 transition hover:border-violet-300 hover:bg-violet-50">
      <input type="checkbox" className="h-4 w-4 accent-violet-600" />
      <span>{children}</span>
    </label>
  )
}

function AiRadio({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-emerald-400/40 bg-[#06140d] p-5 text-emerald-100 shadow-[0_0_34px_rgba(16,185,129,0.18)]">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(52,211,153,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,.11)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative flex gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10"><Bot /></div>
        <div>
          <div className="font-mono text-[10px] font-black uppercase tracking-[.24em] text-emerald-300">AI MISSION SIGNAL ONLINE</div>
          <h3 className="font-mono text-lg font-black uppercase text-emerald-50">{title}</h3>
        </div>
      </div>
      <div className="relative mt-5 space-y-3">
        {items.map((item, i) => (
          <div key={item} className="rounded-2xl border border-emerald-400/25 bg-black/30 p-4 font-mono text-sm font-bold leading-relaxed text-emerald-50">
            <span className="text-emerald-300">[{String(i + 1).padStart(2, "0")}] </span>{item}
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, icon: Icon, color, onClick }: { label: string; value: string; sub: string; icon: typeof Flag; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-[26px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg">
      <div className="flex items-center gap-4">
        <div className={`grid h-14 w-14 place-items-center rounded-2xl ${color}`}><Icon size={24} /></div>
        <div>
          <div className="text-xs font-black text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
          <div className="mt-1 text-xs font-bold text-emerald-600">{sub}</div>
        </div>
      </div>
    </button>
  )
}

function MissionMap({ onOpen }: { onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="relative h-[290px] w-full overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 text-left">
      <div className="absolute left-12 top-12 h-52 w-[460px] rounded-[50%] bg-violet-100 blur-2xl" />
      <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:18px_18px]" />
      {[
        ["24", "Casablanca", "left-[80px] top-[115px]"],
        ["31", "Rabat", "left-[180px] top-[70px]"],
        ["43", "Marrakech", "left-[260px] top-[180px]"],
        ["32", "Tangier", "left-[360px] top-[70px]"],
        ["16", "Agadir", "left-[130px] top-[215px]"],
        ["19", "Oujda", "left-[430px] top-[150px]"],
      ].map(([v, c, p]) => (
        <div key={c} className={`absolute ${p} flex items-center gap-2`}>
          <span className="grid h-12 w-12 place-items-center rounded-full bg-violet-600 text-sm font-black text-white shadow-xl">{v}</span>
          <span className="text-xs font-black text-slate-600">{c}</span>
        </div>
      ))}
      <div className="absolute bottom-4 left-4 rounded-2xl bg-white/90 px-4 py-3 text-xs font-black text-slate-700 shadow-sm">Morocco Mission Coverage</div>
    </button>
  )
}

function CreateMissionModal({
  active,
  selected,
  onClose,
  onSave,
  onDelete,
}: {
  active: ModalKey
  selected: Mission | null
  onClose: () => void
  onSave: (mission: Mission, message: string) => void
  onDelete: (id: string) => void
}) {
  const [step, setStep] = useState("Mission Blueprint")
  const [name, setName] = useState(selected?.name || "")
  const [territory, setTerritory] = useState(selected?.territory || "Casablanca-Settat")
  const [type, setType] = useState(selected?.type || "Growth")
  const [priority, setPriority] = useState<MissionPriority>(selected?.priority || "High")
  const [owner, setOwner] = useState(selected?.owner || "Angelcare Ops")
  const [impact, setImpact] = useState(selected?.impact || "250K MAD")
  const [progress, setProgress] = useState(String(selected?.progress || 0))
  const [description, setDescription] = useState("")
  if (!active) return null

  const modalTitle = active === "create" ? "Create New Mission" : active === "mission" ? "Mission 360 Control File" : active === "analytics" ? "Mission Analytics Control" : active === "template" ? "Mission Templates Studio" : active === "automation" ? "Mission Automation Center" : active === "settings" ? "Mission Settings" : "Mission Command Action"
  const steps = ["Mission Blueprint", "Objectives & KPIs", "Target & Territory", "Ambassadors", "Execution Plan", "Resources & Budget", "Communication", "Review & Launch"]

  const blueprint: Record<string, { title: string; objective: string; controls: string[]; outputs: string[] }> = {
    "Mission Blueprint": { title: "Mission Fundamentals", objective: "Define the mission purpose, business reason, priority, mission code and strategic category.", controls: ["Mission code generated", "Priority selected", "Owner assigned", "Business impact defined"], outputs: ["Mission shell", "Audit ID", "Owner task"] },
    "Objectives & KPIs": { title: "Objectives and KPI Architecture", objective: "Set measurable outcomes: visits, leads, conversions, partners, content, proof quality and revenue impact.", controls: ["KPI target", "Success threshold", "Proof quality gate", "ROI estimate"], outputs: ["KPI board", "Score formula", "Manager reporting"] },
    "Target & Territory": { title: "Territory and Coverage Control", objective: "Choose regions, cities, segments and coverage pressure based on Angelcare domination strategy.", controls: ["Territory selected", "Coverage gap mapped", "Priority city set", "Route logic created"], outputs: ["Territory sprint", "Coverage map", "Route queue"] },
    Ambassadors: { title: "Ambassador Assignment", objective: "Assign the right ambassadors by score, city, proof quality, availability, training and risk.", controls: ["Eligibility checked", "Availability checked", "Role assigned", "Backup ambassador selected"], outputs: ["Team assignment", "Ambassador tasks", "Notification queue"] },
    "Execution Plan": { title: "Execution Workflow", objective: "Break down the mission into tasks, checkpoints, deadlines, controls and escalation paths.", controls: ["Task sequence", "Checkpoint SLA", "Escalation rule", "Completion gate"], outputs: ["Execution plan", "Task board", "Control calendar"] },
    "Resources & Budget": { title: "Resources and Budget", objective: "Allocate budget, assets, scripts, proof requirements, documents and operational resources.", controls: ["Budget cap", "Asset pack", "Proof checklist", "Manager approval"], outputs: ["Resource pack", "Budget tracker", "Proof gate"] },
    Communication: { title: "Communication and Channels", objective: "Prepare WhatsApp scripts, ambassador brief, manager updates and partner communication.", controls: ["Brief approved", "WhatsApp script", "Manager update", "Partner template"], outputs: ["Message pack", "Announcement", "Briefing note"] },
    "Review & Launch": { title: "Review and Launch", objective: "Validate readiness, generate mission summary, activate tasks and sync to reporting.", controls: ["Readiness score", "Risk review", "Launch approval", "Report sync"], outputs: ["Launched mission", "Live dashboard", "Audit archive"] },
  }

  const data = blueprint[step] || blueprint["Mission Blueprint"]

  function saveMission() {
    const mission: Mission = {
      id: selected?.id || `AC-MOS-MIS-${String(Date.now()).slice(-4)}`,
      name: name || "New Angelcare Mission",
      territory,
      type,
      priority,
      ambassadors: selected?.ambassadors || ["Youssef", "Fatima", "Omar"],
      progress: Number(progress) || 0,
      impact,
      status: selected?.status || "Planned",
      score: selected?.score || 82,
      owner,
      start: selected?.start || "Today",
      end: selected?.end || "Next 30 days",
    }
    onSave(mission, `${mission.name} saved live and synced to mission board.`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-[1560px] overflow-y-auto rounded-[38px] border border-white bg-white shadow-2xl">
        <header className="relative overflow-hidden rounded-t-[38px] bg-gradient-to-r from-slate-950 via-violet-900 to-blue-700 p-7 text-white">
          <Flag className="absolute -right-10 -top-10 opacity-15" size={250} />
          <div className="flex items-start justify-between">
            <div className="flex gap-5">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15"><Flag size={30} /></div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-violet-100">Angelcare Mission Command</div>
                <h2 className="mt-2 text-3xl font-black">{modalTitle}</h2>
                <p className="mt-2 max-w-4xl text-sm font-semibold text-white/80">Deep mission operating system: plan, assign, budget, brief, execute, track and report every mission from A to Z.</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-3xl border border-white/20 bg-white/10 p-2">
              {selected && <button onClick={() => { onDelete(selected.id); onClose() }} className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white">Delete</button>}
              <button onClick={saveMission} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">Save Live</button>
              <button onClick={onClose} className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white">Close</button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-[260px_1fr_330px] gap-6 p-7">
          <aside className="rounded-[30px] border border-slate-200 bg-slate-50 p-4">
            {steps.map((s, i) => (
              <button key={s} onClick={() => setStep(s)} className={cx("mb-2 flex w-full items-center gap-3 rounded-2xl p-3 text-left text-xs font-black transition", step === s ? "bg-violet-600 text-white shadow-lg" : "bg-white text-slate-700 hover:bg-violet-50")}>
                <span className={cx("grid h-8 w-8 place-items-center rounded-full", step === s ? "bg-white/20" : "bg-slate-100")}>{i + 1}</span>{s}
              </button>
            ))}
          </aside>

          <main className="space-y-5">
            <section className="rounded-[30px] border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">Active Step · {step}</div>
                  <h3 className="mt-2 text-3xl font-black text-slate-950">{data.title}</h3>
                  <p className="mt-2 max-w-4xl text-sm font-semibold text-slate-600">{data.objective}</p>
                </div>
                <span className="rounded-full bg-violet-600 px-4 py-2 text-xs font-black text-white">Production Gate</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {data.controls.map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-black text-slate-950">Mission Blueprint</h3>
              <div className="mt-5 grid grid-cols-3 gap-4">
                <Field label="Mission Name" value={name} onChange={setName} placeholder="Enter mission name" />
                <Field label="Mission Code" placeholder="Auto-generated" />
                <SelectField label="Mission Type" value={type} onChange={setType} options={["Growth", "Awareness", "Engagement", "Sales", "Partnership", "Quality", "Custom"]} />
                <SelectField label="Priority" value={priority} onChange={(v) => setPriority(v as MissionPriority)} options={["Critical", "High", "Medium", "Low"]} />
                <SelectField label="Territory" value={territory} onChange={setTerritory} options={["Casablanca-Settat", "Rabat-Salé-Kénitra", "Marrakech-Safi", "Tanger-Tétouan-Al Hoceima", "Fès-Meknès", "Souss-Massa", "Oriental", "All Morocco"]} />
                <SelectField label="Owner" value={owner} onChange={setOwner} options={["Angelcare Ops", "Regional Manager", "Field Operations", "Quality Control", "Direction Rabat"]} />
                <Field label="Impact Target" value={impact} onChange={setImpact} placeholder="250K MAD" />
                <Field label="Progress %" value={progress} onChange={setProgress} placeholder="0" />
                <Field label="Budget Cap" placeholder="ex: 12,000 MAD" />
              </div>
              <label className="mt-5 block">
                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Mission Description</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe mission goal, expected outcomes, field instructions and control points..." className="mt-2 h-32 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-950 outline-none focus:border-violet-400" />
              </label>
            </section>

            <section className="grid grid-cols-3 gap-5">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <h4 className="font-black">KPI Targets</h4>
                <div className="mt-4 space-y-3">{["Visits", "Leads", "Partners", "Proof Quality", "Revenue Impact"].map((x) => <Field key={x} label={x} placeholder="Target value" />)}</div>
              </div>
              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <h4 className="font-black">Ambassador Roles</h4>
                <div className="mt-4 space-y-3">{["Mission lead", "Field execution", "Proof owner", "Partner contact", "Backup"].map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
              </div>
              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <h4 className="font-black">Launch Outputs</h4>
                <div className="mt-4 space-y-3">{data.outputs.map((x) => <div key={x} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-black">{x}</div>)}</div>
              </div>
            </section>
          </main>

          <aside className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black">Mission Summary</h3>
              <div className="mt-4 space-y-3 text-sm font-bold text-slate-700">
                <p>Type: <b className="text-slate-950">{type}</b></p>
                <p>Territory: <b className="text-slate-950">{territory}</b></p>
                <p>Priority: <b className="text-slate-950">{priority}</b></p>
                <p>Budget: <b className="text-slate-950">Pending</b></p>
                <p>Ambassadors: <b className="text-slate-950">{selected?.ambassadors.length || 3}</b></p>
              </div>
            </div>
            <AiRadio title="Mission Assistant" items={["Prioritize missions tied to coverage gaps and revenue impact.", "Assign ambassadors with proof quality above 80% for high-risk territories.", "Create checkpoints every 48h for critical missions."]} />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default function AmbassadorMissionsCommandCenter() {
  const [missions, setMissions] = useState<Mission[]>(initialMissions)
  const [modal, setModal] = useState<ModalKey>(null)
  const [selected, setSelected] = useState<Mission | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [territoryFilter, setTerritoryFilter] = useState("All")
  const [status, setStatus] = useState("")

  const safeMissions = Array.isArray(missions) ? missions : []

  const filtered = useMemo(() => {
    return safeMissions.filter((m) => {
      const q = `${m.id} ${m.name} ${m.territory} ${m.type} ${m.priority} ${m.status} ${m.owner}`.toLowerCase().includes(query.toLowerCase())
      const s = statusFilter === "All" || m.status === statusFilter
      const t = territoryFilter === "All" || m.territory === territoryFilter
      return q && s && t
    })
  }, [safeMissions, query, statusFilter, territoryFilter])

  const totals = useMemo(() => {
    const active = safeMissions.filter((m) => m.status === "Active" || m.status === "In Progress").length
    const completed = safeMissions.filter((m) => m.status === "Completed").length
    const avg = Math.round(safeMissions.reduce((s, m) => s + m.score, 0) / Math.max(safeMissions.length, 1))
    return { active, completed, avg }
  }, [safeMissions])

  function openModal(key: ModalKey, mission?: Mission) {
    setSelected(mission || null)
    setModal(key)
  }

  function saveMission(mission: Mission, message: string) {
    setMissions((prev) => {
      const exists = prev.some((m) => m.id === mission.id)
      return exists ? prev.map((m) => (m.id === mission.id ? mission : m)) : [mission, ...prev]
    })
    setStatus(message)
  }

  function deleteMission(id: string) {
    setMissions((prev) => prev.filter((m) => m.id !== id))
    setStatus(`Mission deleted: ${id}`)
  }

  function exportCsv() {
    const rows = [["ID", "Mission", "Territory", "Type", "Priority", "Status", "Progress", "Impact", "Score", "Owner"], ...filtered.map((m) => [m.id, m.name, m.territory, m.type, m.priority, m.status, m.progress, m.impact, m.score, m.owner])]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "angelcare-ambassador-missions.csv"
    a.click()
    URL.revokeObjectURL(url)
    setStatus("Mission CSV exported from current filters.")
  }

  return (
    <div className="flex min-h-screen bg-white text-slate-950">
      <AmbassadorMarketSidebar />
      <main className="flex-1 p-8">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Ambassadors Missions Command Center</h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">Plan, execute and dominate with precision. Every mission. Every territory. Every ambassador.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black shadow-sm"><Download size={16}/>Export</button>
            <button onClick={() => openModal("analytics")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black shadow-sm"><BarChart3 size={16}/>Mission Analytics</button>
            <button onClick={() => openModal("create")} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-100"><Plus size={16}/>Create Mission</button>
          </div>
        </header>

        {status && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">{status}</div>}

        <nav className="mt-6 flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {["Overview", "Missions", "Templates", "Ambassadors", "Territories", "Analytics", "Automations", "Settings"].map((x) => (
            <button key={x} onClick={() => openModal(x === "Templates" ? "template" : x === "Analytics" ? "analytics" : x === "Automations" ? "automation" : x === "Settings" ? "settings" : null)} className="rounded-xl px-4 py-3 text-xs font-black text-slate-700 hover:bg-violet-50 hover:text-violet-700">{x}</button>
          ))}
        </nav>

        <section className="mt-5 grid grid-cols-6 gap-4">
          <MetricCard label="Active Missions" value={String(totals.active)} sub="↑ 33% vs last 30 days" icon={Flag} color="bg-violet-100 text-violet-700" onClick={() => openModal("mission")} />
          <MetricCard label="Total Ambassadors" value="1,248" sub="↑ 18% vs last 30 days" icon={Users} color="bg-blue-100 text-blue-700" onClick={() => openModal("analytics")} />
          <MetricCard label="Missions Completed" value={String(totals.completed + 156)} sub="↑ 28% vs last 30 days" icon={CheckCircle2} color="bg-emerald-100 text-emerald-700" onClick={() => openModal("analytics")} />
          <MetricCard label="Success Rate" value="87.4%" sub="↑ 6.2% vs last 30 days" icon={Target} color="bg-cyan-100 text-cyan-700" onClick={() => openModal("analytics")} />
          <MetricCard label="Total Impact" value="2.4M" sub="↑ 41% vs last 30 days" icon={Activity} color="bg-orange-100 text-orange-700" onClick={() => openModal("analytics")} />
          <MetricCard label="Avg. Mission Score" value={`${totals.avg}/100`} sub="↑ 9 pts vs last 30 days" icon={Star} color="bg-violet-100 text-violet-700" onClick={() => openModal("analytics")} />
        </section>

        <section className="mt-5 grid grid-cols-[1.3fr_0.85fr_0.9fr] gap-5">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Mission Execution Overview</h2><button onClick={() => openModal("analytics")} className="rounded-xl border px-3 py-2 text-xs font-black">This Month</button></div>
            <div className="mt-5 h-[240px] rounded-3xl bg-gradient-to-t from-violet-50 to-white">
              <svg viewBox="0 0 700 230" className="h-full w-full">
                <path d="M0,190 C80,140 120,120 190,130 C270,142 290,62 370,77 C450,92 500,118 560,112 C620,106 650,70 700,52" fill="none" stroke="#10b981" strokeWidth="4" />
                <path d="M0,210 C90,130 160,112 220,116 C270,120 300,152 360,126 C430,94 520,140 610,124 C660,112 680,110 700,108" fill="none" stroke="#6366f1" strokeWidth="4" />
                <path d="M0,220 C120,180 200,160 280,118 C340,88 430,128 520,130 C600,132 650,150 700,160" fill="none" stroke="#94a3b8" strokeWidth="3" />
              </svg>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Missions by Status</h2><button onClick={() => openModal("analytics")} className="rounded-xl border px-3 py-2 text-xs font-black">View All</button></div>
            <button onClick={() => openModal("analytics")} className="mt-7 grid w-full place-items-center">
              <div className="grid h-48 w-48 place-items-center rounded-full bg-[conic-gradient(#10b981_0_37%,#3b82f6_37%_70%,#7c3aed_70%_91%,#f97316_91%_100%)]">
                <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center"><div><div className="text-4xl font-black">24</div><div className="text-xs font-bold">Total</div></div></div>
              </div>
            </button>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Live Mission Feed</h2><button onClick={() => openModal("feed")} className="rounded-xl border px-3 py-2 text-xs font-black">View All</button></div>
            <div className="mt-4 space-y-3">
              {["New mission created", "Rabat awareness mission completed", "Ambassador joined mission", "Agadir proof sprint is on hold", "Community update posted"].map((x, i) => (
                <button key={x} onClick={() => openModal("feed")} className="flex w-full items-start gap-3 rounded-2xl border border-slate-100 p-3 text-left hover:bg-violet-50">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-violet-700"><Activity size={16}/></span>
                  <span><b className="text-sm">{x}</b><span className="block text-xs text-slate-500">{i * 15 + 2}m ago</span></span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-[0.7fr_0.95fr_1fr] gap-5">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Top Performing Missions</h2><button onClick={() => openModal("analytics")} className="rounded-xl border px-3 py-2 text-xs font-black">View All</button></div>
            <div className="mt-4 space-y-3">
              {safeMissions.slice(0,5).map((m, i) => (
                <button key={m.id} onClick={() => openModal("mission", m)} className="grid w-full grid-cols-[32px_1fr_55px] items-center rounded-2xl p-3 text-left hover:bg-violet-50">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-xs font-black">{i+1}</span>
                  <span><b className="text-sm">{m.name}</b><span className="block text-xs text-slate-500">{m.territory}</span></span>
                  <b className="text-sm">{m.score}%</b>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Mission Map</h2><button onClick={() => openModal("map")} className="rounded-xl border px-3 py-2 text-xs font-black">View Full Map</button></div>
            <div className="mt-4"><MissionMap onOpen={() => openModal("map")} /></div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Mission Impact Breakdown</h2><button onClick={() => openModal("analytics")} className="rounded-xl border px-3 py-2 text-xs font-black">This Month</button></div>
            <div className="mt-5 space-y-5">
              {[["Brand Awareness","1.2M",82],["Community Growth","860K",72],["Revenue Impact","620K",55],["Partner Acquisition","430K",46],["Content Creation","310K",34]].map(([label,value,p]) => (
                <button key={label as string} onClick={() => openModal("analytics")} className="w-full text-left">
                  <div className="flex justify-between text-sm font-black"><span>{label}</span><span>{value}</span></div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-500" style={{ width: `${p}%` }} /></div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="mr-4 text-xl font-black">All Missions</h2>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black">
              {["All", "Active", "In Progress", "Planned", "On Hold", "Completed"].map(x => <option key={x}>{x}</option>)}
            </select>
            <select value={territoryFilter} onChange={(e) => setTerritoryFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black">
              {["All", ...Array.from(new Set(safeMissions.map(m => m.territory)))].map(x => <option key={x}>{x}</option>)}
            </select>
            <label className="ml-auto flex min-w-[360px] items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500">
              <Search size={16}/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full outline-none" placeholder="Search missions..." />
            </label>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                <tr><th className="px-4 py-4">Mission</th><th className="px-4 py-4">Territory</th><th className="px-4 py-4">Type</th><th className="px-4 py-4">Ambassadors</th><th className="px-4 py-4">Progress</th><th className="px-4 py-4">Impact</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100 hover:bg-violet-50/50">
                    <td className="px-4 py-4"><button onClick={() => openModal("mission", m)} className="text-left"><b>{m.name}</b><span className="block text-xs text-slate-500">{m.id} · {m.owner}</span></button></td>
                    <td className="px-4 py-4 font-bold">{m.territory}</td>
                    <td className="px-4 py-4"><PriorityBadge priority={m.priority}/></td>
                    <td className="px-4 py-4 font-bold">{m.ambassadors.length} assigned</td>
                    <td className="px-4 py-4"><div className="flex items-center gap-2"><span className="h-2 w-28 rounded-full bg-slate-100"><span className="block h-2 rounded-full bg-violet-600" style={{ width: `${m.progress}%` }}/></span><b>{m.progress}%</b></div></td>
                    <td className="px-4 py-4 font-black">{m.impact}</td>
                    <td className="px-4 py-4"><StatusBadge status={m.status}/></td>
                    <td className="px-4 py-4"><div className="flex gap-2"><button onClick={() => openModal("mission", m)} className="rounded-xl border p-2"><Eye size={16}/></button><button onClick={() => openModal("analytics", m)} className="rounded-xl border p-2"><BarChart3 size={16}/></button><button onClick={() => openModal("mission", m)} className="rounded-xl border p-2"><MoreHorizontal size={16}/></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <CreateMissionModal active={modal} selected={selected} onClose={() => setModal(null)} onSave={saveMission} onDelete={deleteMission} />
      </main>
    </div>
  )
}
