"use client"

import { useState } from "react"
import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  Grid2X2,
  MapPinned,
  PackageCheck,
  Plus,
  Route,
  Search,
  ShieldCheck,
  Target,
  UserCheck,
  Users,
  X
} from "lucide-react"

type ModalKey =
  | "ai"
  | "new"
  | "task"
  | "stage"
  | "candidate"
  | "timeline"
  | "map"
  | "calendar"
  | "urgent"
  | "activity"
  | "documents"
  | "training"
  | "equipment"
  | "territory"
  | "activation"
  | "columns"
  | "export"
  | null

const candidates = [
  { name: "Youssef El Fassi", region: "Casablanca", stage: "Training", score: 82, progress: 75, owner: "Salma E.", next: "Complete Training", due: "May 31, 2025", status: "In Progress" },
  { name: "Fatima Zahra Ait", region: "Rabat", stage: "Equipment", score: 76, progress: 60, owner: "Omar K.", next: "Assign Equipment", due: "May 31, 2025", status: "In Progress" },
  { name: "Omar Kabbaj", region: "Marrakech", stage: "Territory", score: 70, progress: 50, owner: "Imane L.", next: "Assign Territory", due: "Jun 1, 2025", status: "Pending" },
  { name: "Imane Lahlou", region: "Fes", stage: "Activation", score: 88, progress: 90, owner: "Ahmed B.", next: "Activate Ambassador", due: "Jun 2, 2025", status: "Ready" },
  { name: "Ahmed Benali", region: "Tangier", stage: "Completed", score: 95, progress: 100, owner: "Salma E.", next: "—", due: "—", status: "Completed" },
]

const tasks = [
  ["Verify ID Documents", "Youssef El Fassi", "May 31, 2025", "Overdue", "Critical"],
  ["Assign Training Modules", "Fatima Zahra Ait", "May 31, 2025", "Overdue", "High"],
  ["Equipment Allocation", "Omar Kabbaj", "Jun 1, 2025", "Due Today", "High"],
  ["Territory Assignment", "Imane Lahlou", "Jun 2, 2025", "Upcoming", "Medium"],
  ["Compliance Check", "Ahmed Benali", "Jun 3, 2025", "Upcoming", "Medium"],
]

const stages = [
  ["Documents", 128, 96, 20, 12, 75],
  ["Training", 96, 84, 8, 4, 66],
  ["Equipment", 84, 64, 12, 8, 76],
  ["Territory", 64, 48, 8, 8, 64],
  ["Activation", 41, 31, 6, 4, 75],
]

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input type={type} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
    </label>
  )
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function ToggleRow({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold transition hover:border-violet-300 hover:bg-violet-50">
      <input type="checkbox" className="h-4 w-4 accent-violet-600" />
      <span>{children}</span>
    </label>
  )
}

function RadioAiPanel({ title, subtitle, items }: { title: string; subtitle: string; items: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-emerald-400/40 bg-[#06140d] p-5 text-emerald-100 shadow-[0_0_34px_rgba(16,185,129,0.18)]">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(52,211,153,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.11)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10 text-emerald-300"><Bot size={24} /></div>
        <div>
          <div className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">AI ONBOARDING SIGNAL ONLINE</div>
          <h3 className="font-mono text-lg font-black uppercase tracking-wide text-emerald-100">{title}</h3>
          <p className="font-mono text-xs font-bold text-emerald-300/80">{subtitle}</p>
        </div>
      </div>
      <div className="relative mt-5 space-y-3">
        {items.map((item, index) => (
          <div key={item} className="rounded-2xl border border-emerald-400/25 bg-black/30 p-4 font-mono text-sm font-bold leading-relaxed text-emerald-100">
            <span className="mr-2 text-emerald-300">[{String(index + 1).padStart(2, "0")}]</span>{item}
          </div>
        ))}
      </div>
    </div>
  )
}

function ModalShell({
  title,
  subtitle,
  icon: Icon,
  action,
  onClose,
  children,
  right,
}: {
  title: string
  subtitle: string
  icon: typeof Users
  action: string
  onClose: () => void
  children: React.ReactNode
  right: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-[1480px] overflow-y-auto rounded-[38px] border border-white/70 bg-white shadow-2xl">
        <header className="relative overflow-hidden rounded-t-[38px] bg-gradient-to-r from-slate-950 via-violet-800 to-blue-700 p-7 text-white">
          <Icon className="absolute -right-10 -top-10 opacity-15" size={230} />
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15"><Icon size={30} /></div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Angelcare Onboarding Operations</div>
                <h2 className="mt-2 text-3xl font-black tracking-tight">{title}</h2>
                <p className="mt-2 max-w-4xl text-sm font-semibold text-white/80">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/25 bg-slate-950/30 p-2 shadow-2xl backdrop-blur-md">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-violet-50"><CheckCircle2 size={17} />{action}</button>
              <button onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-white/25"><X size={17} />Close</button>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-[1.35fr_0.75fr] gap-6 p-7">
          <main className="space-y-6">{children}</main>
          <aside className="space-y-5">{right}</aside>
        </div>
      </div>
    </div>
  )
}

function OnboardingActionModal({ active, onClose }: { active: ModalKey; onClose: () => void }) {
  if (!active) return null
  const config: Record<string, { title: string; subtitle: string; icon: typeof Users; action: string; ai: string[]; sections: string[] }> = {
    ai: { title: "AI Onboarding Assistant", subtitle: "Automatically detect blockers, recommend next actions and generate activation workflows.", icon: Bot, action: "Apply AI Plan", ai: ["Overdue documents and expiring documents need immediate manager escalation.", "Candidates with readiness above 80% should move to activation batch.", "Blocked journeys must receive owner, SLA and next proof requirement."], sections: ["Blocker scan", "Readiness scoring", "Owner routing", "Task generation", "Activation recommendation"] },
    new: { title: "New Onboarding Journey", subtitle: "Create a complete candidate-to-ambassador activation journey with documents, training, equipment, territory and proof gates.", icon: Plus, action: "Create Journey", ai: ["Every journey must start with required documents.", "Training must complete before territory activation.", "Ready candidates should automatically enter activation calendar."], sections: ["Candidate selected", "Documents gate", "Training plan", "Equipment kit", "Territory owner", "Activation date"] },
    task: { title: "Onboarding Task Control", subtitle: "Create, edit, escalate, close and assign onboarding tasks with SLA and evidence.", icon: ClipboardCheck, action: "Save Task", ai: ["Critical tasks need same-day SLA.", "Overdue ID verification blocks all downstream stages.", "Task closure must include evidence and manager note."], sections: ["Task owner", "SLA", "Evidence", "Escalation", "Status log"] },
    stage: { title: "Stage Control Center", subtitle: "Control onboarding stage gates, conversion, blockers and handoff requirements.", icon: Route, action: "Update Stage", ai: ["Stage conversion below 70% needs root-cause review.", "Equipment and territory are common blockers.", "Close a stage only when its proof checklist is complete."], sections: ["Documents", "Training", "Equipment", "Territory", "Activation"] },
    candidate: { title: "Candidate 360 Onboarding Profile", subtitle: "Review candidate progress, readiness, documents, assigned tasks, comments and activation decision.", icon: Users, action: "Save Candidate", ai: ["Candidate is ready when readiness, proof and equipment gates are green.", "Add manager note before moving to activation.", "Candidate profile should sync with ambassador directory after activation."], sections: ["Profile", "Readiness", "Tasks", "Documents", "Comments", "Activation"] },
    timeline: { title: "Onboarding Timeline", subtitle: "Open the full timeline of submitted application, verified documents, training, equipment, territory and activation.", icon: Clock, action: "Save Timeline", ai: ["Timeline gaps longer than 48h need escalation.", "Each completed step should have timestamp and owner.", "Activation must be auditable."], sections: ["Application", "Documents", "Training", "Equipment", "Territory", "Activation"] },
    map: { title: "Onboarding Map", subtitle: "Review onboarding readiness by region and launch regional activation actions.", icon: MapPinned, action: "Launch Regional Action", ai: ["Casablanca and Tangier are activation-ready.", "Agadir needs urgent document recovery.", "Regional manager should own low-readiness cities."], sections: ["Region readiness", "Candidate density", "Risk cities", "Manager owner", "Activation batch"] },
    calendar: { title: "Onboarding Calendar", subtitle: "Manage interviews, training sessions, activation batches and manager checkpoints.", icon: Calendar, action: "Save Calendar Event", ai: ["Batch activation candidates by readiness score.", "Training sessions need capacity owner.", "Calendar events should notify candidate and manager."], sections: ["Event type", "Candidate group", "Capacity", "Owner", "Reminder"] },
    urgent: { title: "Urgent Actions Queue", subtitle: "Resolve overdue tasks, expiring documents and equipment pending items.", icon: AlertTriangle, action: "Resolve Urgent Actions", ai: ["14 overdue tasks require same-day escalation.", "8 expiring documents should trigger WhatsApp reminders.", "Equipment pending blocks activation readiness."], sections: ["Overdue", "Expiring documents", "Equipment pending", "Escalation", "Resolution proof"] },
    activity: { title: "Recent Activity Audit", subtitle: "Review and audit onboarding activity events, owner updates and candidate progress.", icon: Activity, action: "Save Audit", ai: ["Recent activity should match task status.", "Missing comments reduce audit quality.", "Activity feed should sync to candidate profile."], sections: ["Event log", "Owner", "Candidate", "Timestamp", "Audit status"] },
    documents: { title: "Documents Gate", subtitle: "Verify ID, contract, compliance files and missing document recovery.", icon: FileText, action: "Verify Documents", ai: ["ID verification blocks all later stages.", "Expiring documents need reminders.", "No document gate closes without reviewer."], sections: ["ID", "Contract", "Compliance", "Expiry", "Reviewer"] },
    training: { title: "Training Gate", subtitle: "Assign modules, monitor completion, test readiness and release candidates to next stage.", icon: Target, action: "Assign Training", ai: ["Training below 76% needs manager follow-up.", "Failed module creates remediation task.", "Training completion unlocks equipment stage."], sections: ["Modules", "Progress", "Assessment", "Remediation", "Release"] },
    equipment: { title: "Equipment Gate", subtitle: "Allocate kits, track inventory, confirm receipt and unblock activation.", icon: PackageCheck, action: "Assign Equipment", ai: ["Equipment pending blocks activation.", "Kit delivery needs receipt proof.", "Low stock should create procurement task."], sections: ["Kit type", "Inventory", "Delivery", "Receipt proof", "Stock risk"] },
    territory: { title: "Territory Gate", subtitle: "Assign territory, manager, first route and local activation plan.", icon: MapPinned, action: "Assign Territory", ai: ["Territory should match candidate city and demand.", "First route must be assigned before activation.", "Manager owner is mandatory."], sections: ["Region", "City", "Manager", "First route", "Coverage goal"] },
    activation: { title: "Activation Gate", subtitle: "Convert ready candidates into confirmed ambassadors with first mission and profile sync.", icon: CheckCircle2, action: "Activate Ambassador", ai: ["Activation requires readiness above threshold.", "Activated candidates sync to ambassador directory.", "Create first mission and manager review automatically."], sections: ["Readiness", "Profile sync", "First mission", "Manager review", "Activation proof"] },
    columns: { title: "Onboarding Columns", subtitle: "Configure table columns, saved views, export fields and manager visibility.", icon: Grid2X2, action: "Save Columns", ai: ["Keep stage, readiness, owner and next action visible.", "Managers need actionable columns, not vanity data.", "Saved views should match team roles."], sections: ["Visible fields", "Pinned fields", "Manager view", "Export fields", "Saved layout"] },
    export: { title: "Export Onboarding Workspace", subtitle: "Export current onboarding candidates, tasks, readiness, blockers and activity.", icon: Download, action: "Generate Export", ai: ["Export only current filters.", "Include blockers and owners.", "Archive every export under onboarding reports."], sections: ["Scope", "Fields", "Format", "Permission", "Archive"] },
  }
  const c = config[active] || config.new
  return (
    <ModalShell title={c.title} subtitle={c.subtitle} icon={c.icon} action={c.action} onClose={onClose}
      right={<><RadioAiPanel title={`${c.title} AI`} subtitle="Onboarding execution guidance" items={c.ai} /><div className="rounded-[28px] border border-slate-200 bg-white p-5"><h3 className="text-lg font-black">Production Controls</h3><div className="mt-4 space-y-3">{c.sections.map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}</div></div></>}>
      <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-xl font-black">{c.title} Setup</h3>
        <div className="mt-5 grid grid-cols-3 gap-4">
          <Field label="Reference" placeholder="AC-MOS-ONB-NEW" />
          <SelectField label="Candidate" options={["Youssef El Fassi", "Fatima Zahra Ait", "Omar Kabbaj", "Imane Lahlou", "Ahmed Benali", "Activation Batch #15"]} />
          <SelectField label="Stage" options={["Documents", "Training", "Equipment", "Territory", "Activation", "Completed"]} />
          <SelectField label="Owner" options={["Onboarding Lead", "Regional Manager", "Training Lead", "Compliance", "Operations"]} />
          <SelectField label="Priority" options={["Critical", "High", "Medium", "Low"]} />
          <Field label="Deadline" placeholder="Today / This week / Custom" />
        </div>
      </section>
      <section className="grid grid-cols-2 gap-5">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-black">Execution Checklist</h3>
          <div className="mt-4 space-y-3">{c.sections.map((x) => <ToggleRow key={`wf-${x}`}>{x}</ToggleRow>)}</div>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-black">Decision & Notes</h3>
          <textarea className="mt-4 h-48 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-violet-400" placeholder="Add onboarding decision, blocker resolution, owner, deadline and next control point..." />
          <button className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Save Decision</button>
        </div>
      </section>
    </ModalShell>
  )
}

function MoroccoReadinessMap() {
  return (
    <div className="relative h-[265px] overflow-hidden rounded-[26px] bg-violet-50">
      <div className="absolute left-[70px] top-[18px] h-[220px] w-[340px] rotate-[-18deg] rounded-[38%_62%_45%_55%] bg-gradient-to-br from-violet-500/70 via-violet-300/65 to-violet-100" />
      {[["78%","Tangier","left-[300px] top-[20px]"],["72%","Rabat","left-[220px] top-[58px]"],["82%","Casablanca","left-[120px] top-[110px]"],["74%","Fes","left-[325px] top-[95px]"],["76%","Marrakech","left-[260px] top-[160px]"],["70%","Agadir","left-[150px] top-[215px]"],["68%","Oujda","left-[405px] top-[92px]"]].map(([v,c,p]) => <div key={c} className={`absolute ${p} flex items-center gap-2`}><span className="grid h-12 w-12 place-items-center rounded-full bg-white text-sm font-black text-violet-700 shadow-xl">{v}</span><span className="text-xs font-black text-slate-600">{c}</span></div>)}
    </div>
  )
}

export default function AmbassadorOnboardingWorkspace() {
  const [activeModal, setActiveModal] = useState<ModalKey>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [status, setStatus] = useState("")

  const filtered = candidates.filter((c) => {
    const q = `${c.name} ${c.region} ${c.stage} ${c.owner} ${c.status}`.toLowerCase().includes(query.toLowerCase())
    const s = statusFilter === "All" || c.status === statusFilter
    return q && s
  })

  function exportCsv() {
    const rows = [["Candidate", "Region", "Stage", "Readiness", "Progress", "Owner", "Next Action", "Due Date", "Status"], ...filtered.map((c) => [c.name, c.region, c.stage, c.score, c.progress, c.owner, c.next, c.due, c.status])]
    const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "angelcare-onboarding-workspace.csv"
    a.click()
    URL.revokeObjectURL(url)
    setStatus("Onboarding workspace CSV exported from current filters.")
  }

  return (
    <div className="flex min-h-screen bg-white text-slate-950">
      <AmbassadorMarketSidebar />
      <main className="flex-1 bg-white px-7 py-6">
        <header className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-[30px] font-black tracking-tight">Onboarding Operations Center</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Orchestrate and monitor the complete onboarding journey from candidate to confirmed ambassador.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveModal("ai")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black shadow-sm"><Bot size={16}/> AI Assistant</button>
            <button onClick={() => setActiveModal("new")} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-violet-100"><Plus size={16}/> New Onboarding</button>
          </div>
        </header>

        {status && <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">{status}</div>}

        <section className="grid grid-cols-6 gap-3">
          {[
            ["In Progress", "128", UserCheck, "bg-blue-100 text-blue-700", "↑ 18% vs Apr 1 – Apr 30"],
            ["Completed", "96", CheckCircle2, "bg-emerald-100 text-emerald-700", "↑ 22% vs Apr 1 – Apr 30"],
            ["Pending Actions", "32", Users, "bg-pink-100 text-pink-700", "↑ 5% vs Apr 1 – Apr 30"],
            ["Overdue", "14", Clock, "bg-violet-100 text-violet-700", "↑ 27% vs Apr 1 – Apr 30"],
            ["Ready for Activation", "41", PackageCheck, "bg-emerald-100 text-emerald-700", "↑ 20% vs Apr 1 – Apr 30"],
            ["Conversion Rate", "75%", BarChart3, "bg-violet-100 text-violet-700", "↑ 8% vs Apr 1 – Apr 30"],
          ].map(([label, value, Icon, tint, meta]) => {
            const I = Icon as typeof Users
            return (
              <button key={label as string} onClick={() => setStatus(`${label} gateway opened and synced to onboarding workspace.`)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:bg-violet-50">
                <div className="flex items-center gap-3">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl ${tint as string}`}><I size={20}/></div>
                  <div>
                    <div className="text-[11px] font-black text-slate-500">{label as string}</div>
                    <div className="mt-1 text-2xl font-black">{value as string}</div>
                    <div className="mt-1 text-[11px] font-black text-emerald-600">{meta as string}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </section>

        <section className="mt-4 grid grid-cols-[1fr_1fr_1fr_.72fr] gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Onboarding Journey Overview</h2><button className="rounded-xl border px-3 py-2 text-xs font-black">This Month</button></div>
            <div className="mt-6 grid grid-cols-[0.9fr_1fr] gap-4">
              <div className="space-y-1">
                {["Documents", "Training", "Equipment", "Territory", "Activation"].map((x, i) => (
                  <button key={x} onClick={() => setActiveModal(x.toLowerCase() as ModalKey)} className="mx-auto block h-13 bg-gradient-to-r from-violet-700 to-violet-500 text-xs font-black text-white shadow-sm" style={{ width: `${165 - i * 18}px`, clipPath: "polygon(0 0, 100% 0, 86% 100%, 14% 100%)" }}>×</button>
                ))}
              </div>
              <div className="space-y-6 pt-2 text-sm font-black text-slate-600">
                {["Documents 128 · 75%", "Training 96 · 66%", "Equipment 84 · 76%", "Territory 64 · 64%", "Activation 41 · 75%"].map((x) => <div key={x} className="flex items-center gap-4"><span className="h-px flex-1 bg-slate-200"/>{x}</div>)}
              </div>
            </div>
          </div>

          <button onClick={() => setActiveModal("stage")} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-violet-300">
            <div className="flex items-center justify-between"><h2 className="font-black">Onboarding Progress Trend</h2><span className="rounded-xl border px-3 py-2 text-xs font-black">Daily</span></div>
            <div className="mt-5 h-[255px] rounded-2xl bg-gradient-to-t from-violet-50 to-white">
              <svg viewBox="0 0 420 230" className="h-full w-full">
                <defs><linearGradient id="onbFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/></linearGradient></defs>
                <path d="M0,160 L40,145 L80,168 L120,122 L165,116 L210,80 L260,92 L305,55 L350,68 L390,42 L420,28 L420,230 L0,230 Z" fill="url(#onbFill)" />
                <polyline fill="none" stroke="#6d28d9" strokeWidth="4" points="0,160 40,145 80,168 120,122 165,116 210,80 260,92 305,55 350,68 390,42 420,28" />
              </svg>
            </div>
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Onboarding by Region</h2><button onClick={() => setActiveModal("map")} className="rounded-xl border px-3 py-2 text-xs font-black">All Regions</button></div>
            <MoroccoReadinessMap />
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-black">Onboarding Readiness</h2>
              <div className="mt-4 flex items-center gap-4">
                <div className="grid h-24 w-24 place-items-center rounded-full bg-[conic-gradient(#10b981_0_78%,#7c3aed_78%_86%,#e5e7eb_86%_100%)]"><div className="grid h-16 w-16 place-items-center rounded-full bg-white text-2xl font-black">78%</div></div>
                <div><div className="text-sm font-black">Average Readiness Score</div><div className="text-xs font-black text-emerald-600">↑ 12% vs Apr 1 – Apr 30</div></div>
              </div>
              <div className="mt-5 space-y-3">
                {["Documents 82%", "Training 76%", "Equipment 74%", "Territory 72%", "Compliance 86%"].map((x, i) => <button key={x} onClick={() => setActiveModal(["documents","training","equipment","territory","activation"][i] as ModalKey)} className="grid w-full grid-cols-[1fr_120px] items-center gap-3 text-left text-xs font-black"><span>{x}</span><span className="h-2 rounded-full bg-slate-100"><span className="block h-2 rounded-full bg-violet-600" style={{ width: `${82 - i * 3}%` }} /></span></button>)}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="font-black">Urgent Actions</h2><button onClick={() => setActiveModal("urgent")} className="text-xs font-black text-violet-600">View All</button></div>
              <div className="mt-4 space-y-4">
                {[["14", "Overdue Tasks", "Require immediate attention"], ["8", "Expiring Documents", "Expire within 7 days"], ["6", "Equipment Pending", "Awaiting assignment"]].map(([n,t,b]) => <button key={t} onClick={() => setActiveModal("urgent")} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-violet-50"><span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 font-black text-rose-600">{n}</span><span><b className="block text-xs">{t}</b><span className="text-xs text-slate-500">{b}</span></span></button>)}
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-4 grid grid-cols-[1fr_1fr_0.85fr_.72fr] gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Onboarding Tasks</h2><button onClick={() => setActiveModal("task")} className="text-xs font-black text-violet-600">View All</button></div>
            <div className="mt-3 flex gap-2">{["All (32)", "My Tasks (8)", "Pending (18)", "Overdue (6)"].map((x) => <button key={x} onClick={() => setActiveModal("task")} className="rounded-xl border px-3 py-2 text-xs font-black hover:bg-violet-50">{x}</button>)}</div>
            <div className="mt-4 space-y-4">{tasks.map((t) => <button key={t[0]} onClick={() => setActiveModal("task")} className="grid w-full grid-cols-[1fr_0.8fr_0.6fr_0.5fr] items-center gap-3 rounded-xl p-2 text-left text-xs font-bold hover:bg-violet-50"><span className="font-black">{t[0]}</span><span>{t[1]}</span><span>{t[2]}</span><span className="rounded-lg bg-rose-50 px-2 py-1 text-center font-black text-rose-600">{t[3]}</span></button>)}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Onboarding by Stage</h2><button onClick={() => setActiveModal("stage")} className="text-xs font-black text-violet-600">View Full Report</button></div>
            <table className="mt-4 w-full text-left text-xs">
              <thead><tr className="text-slate-500"><th>Stage</th><th>In Progress</th><th>Completed</th><th>Pending</th><th>Overdue</th><th>Rate</th></tr></thead>
              <tbody>{stages.map((s) => <tr key={s[0] as string} onClick={() => setActiveModal(String(s[0]).toLowerCase() as ModalKey)} className="cursor-pointer border-b border-slate-100 hover:bg-violet-50"><td className="py-3 font-black">{s[0]}</td><td>{s[1]}</td><td>{s[2]}</td><td>{s[3]}</td><td>{s[4]}</td><td><div className="flex items-center gap-2"><span className="h-2 w-14 rounded-full bg-slate-100"><span className="block h-2 rounded-full bg-emerald-500" style={{ width: `${s[5]}%` }} /></span>{s[5]}%</div></td></tr>)}</tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Onboarding Timeline</h2><button onClick={() => setActiveModal("timeline")} className="text-xs font-black text-violet-600">View Timeline</button></div>
            <div className="mt-5 space-y-4">
              {["Application Submitted", "Documents Verified", "Training In Progress", "Equipment Assigned", "Territory Assigned", "Ready for Activation", "Activated"].map((x, i) => <button key={x} onClick={() => setActiveModal("timeline")} className="flex w-full items-center gap-3 text-left text-xs font-black"><span className="grid h-7 w-7 place-items-center rounded-full bg-violet-600 text-white">{i+1}</span><span>→ {x}</span></button>)}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="font-black">Recent Activity</h2><button onClick={() => setActiveModal("activity")} className="text-xs font-black text-violet-600">View All</button></div>
              <div className="mt-4 space-y-4 text-xs">{["Youssef El Fassi · Completed training module · 2m ago", "Fatima Zahra Ait · Documents verified · 15m ago", "Omar Kabbaj · Equipment assigned · 32m ago", "Imane Lahlou · Territory assigned · 1h ago", "Ahmed Benali · Onboarding completed · 2h ago"].map((x) => <button key={x} onClick={() => setActiveModal("activity")} className="block w-full rounded-xl p-2 text-left font-bold hover:bg-violet-50">{x}</button>)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-black">Onboarding Calendar</h2>
              <div className="mt-4 space-y-4">{[["Interview Batch #48", "Today, 10:00 AM", "12 Candidates"], ["Training Session", "Today, 02:00 PM", "24 Ambassadors"], ["Activation Batch #15", "Tomorrow, 11:00 AM", "8 Ambassadors"]].map(([a,b,c]) => <button key={a} onClick={() => setActiveModal("calendar")} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-violet-50"><Calendar className="text-violet-600" size={18}/><span className="flex-1"><b className="block text-xs">{a}</b><span className="text-xs text-slate-500">{b}</span></span><span className="rounded-lg bg-violet-50 px-2 py-1 text-xs font-black text-violet-700">{c}</span></button>)}</div>
            </div>
          </aside>
        </section>

        <section className="mt-4 grid grid-cols-[1fr_.72fr] gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-black">Onboarding Candidates</h2>
              <div className="flex gap-2"><button onClick={() => setActiveModal("columns")} className="rounded-xl border px-3 py-2 text-xs font-black">Columns</button><button onClick={exportCsv} className="rounded-xl border px-3 py-2 text-xs font-black">Export</button></div>
            </div>
            <div className="mb-4 grid grid-cols-[1fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-2">
              <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold text-slate-500"><Search size={14}/><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full outline-none" placeholder="Search candidate..." /></label>
              {["All", "In Progress", "Ready", "Completed", "Cancelled"].map((x) => <button key={x} onClick={() => setStatusFilter(x)} className={`rounded-xl px-3 py-2 text-xs font-black ${statusFilter === x ? "bg-violet-100 text-violet-700" : "border border-slate-200"}`}>{x}</button>)}
            </div>
            <table className="w-full text-left text-xs">
              <thead><tr className="border-b border-slate-200 text-slate-500"><th className="pb-3">Candidate</th><th>Region</th><th>Current Stage</th><th>Readiness</th><th>Progress</th><th>Owner</th><th>Next Action</th><th>Due Date</th><th>Status</th></tr></thead>
              <tbody>{filtered.map((c) => <tr key={c.name} className="border-b border-slate-100 hover:bg-violet-50"><td onClick={() => setActiveModal("candidate")} className="cursor-pointer py-3 font-black underline-offset-4 hover:underline">{c.name}</td><td>{c.region}</td><td>{c.stage}</td><td>{c.score}%</td><td><div className="flex items-center gap-2"><span className="h-2 w-16 rounded-full bg-slate-100"><span className="block h-2 rounded-full bg-emerald-500" style={{ width: `${c.progress}%` }} /></span>{c.progress}%</div></td><td>{c.owner}</td><td><button onClick={() => setActiveModal(c.next.includes("Training") ? "training" : c.next.includes("Equipment") ? "equipment" : c.next.includes("Territory") ? "territory" : "activation")} className="rounded-lg border px-3 py-1 font-black">{c.next}</button></td><td>{c.due}</td><td><span className="rounded-md bg-violet-100 px-2 py-1 font-black text-violet-700">{c.status}</span></td></tr>)}</tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-black">Onboarding Map</h2>
              <button onClick={() => setActiveModal("map")} className="text-xs font-black text-violet-600">View Full Map</button>
            </div>
            <div onClick={() => setActiveModal("map")} className="cursor-pointer">
              <MoroccoReadinessMap />
            </div>
          </div>
        </section>

        <OnboardingActionModal active={activeModal} onClose={() => setActiveModal(null)} />
      </main>
    </div>
  )
}
