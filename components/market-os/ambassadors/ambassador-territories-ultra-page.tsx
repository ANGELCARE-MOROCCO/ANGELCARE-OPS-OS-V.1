
"use client"

import { useMemo, useState } from "react"
import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileText,
  Filter,
  Flag,
  MapPinned,
  Megaphone,
  MessageSquare,
  PackageCheck,
  Plus,
  Radio,
  Route,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react"

type ModalKey = "deploy" | "route" | "assign" | "operations" | null

const territories = [
  { city: "Casablanca", region: "Casablanca-Settat", ambassadors: 234, score: 92, coverage: 94, risk: "Low", status: "Scaling" },
  { city: "Rabat", region: "Rabat-Salé-Kénitra", ambassadors: 198, score: 89, coverage: 87, risk: "Low", status: "Stable" },
  { city: "Marrakech", region: "Marrakech-Safi", ambassadors: 176, score: 84, coverage: 78, risk: "Medium", status: "Watch" },
  { city: "Tangier", region: "Tanger-Tétouan-Al Hoceima", ambassadors: 148, score: 86, coverage: 76, risk: "Low", status: "Scaling" },
  { city: "Agadir", region: "Souss-Massa", ambassadors: 126, score: 73, coverage: 61, risk: "High", status: "Recover" },
  { city: "Oujda", region: "Oriental", ambassadors: 92, score: 68, coverage: 48, risk: "High", status: "Critical" },
]

function TextField({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input type={type} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
    </label>
  )
}

function TextArea({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <textarea placeholder={placeholder} className="mt-2 h-32 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
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

function ToggleCard({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold transition hover:border-violet-300 hover:bg-violet-50">
      <input type="checkbox" className="h-4 w-4 accent-violet-600" />
      <span>{children}</span>
    </label>
  )
}

function ModalShell({
  title,
  eyebrow,
  subtitle,
  icon: Icon,
  gradient,
  children,
  right,
  actionLabel,
  onClose,
}: {
  title: string
  eyebrow: string
  subtitle: string
  icon: typeof Target
  gradient: string
  children: React.ReactNode
  right: React.ReactNode
  actionLabel: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[93vh] w-full max-w-[1480px] overflow-y-auto rounded-[38px] border border-white/60 bg-white shadow-2xl">
        <header className={`relative overflow-hidden rounded-t-[38px] bg-gradient-to-r ${gradient} p-7 text-white`}>
          <div className="absolute -right-10 -top-10 opacity-15"><Icon size={220} /></div>
          <button onClick={onClose} className="absolute right-6 top-6 grid h-11 w-11 place-items-center rounded-2xl bg-white/15 transition hover:bg-white/25"><X size={20} /></button>
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15"><Icon size={30} /></div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">{eyebrow}</div>
              <h2 className="mt-2 text-3xl font-black tracking-tight">{title}</h2>
              <p className="mt-2 max-w-4xl text-sm font-semibold text-white/75">{subtitle}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-[1.35fr_0.75fr] gap-6 p-7">
          <main className="space-y-6">{children}</main>
          <aside className="space-y-5">
            {right}
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-200">
              <CheckCircle2 size={18} />
              {actionLabel}
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}

function DeployTeamModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell
      title="Deploy Territory Team"
      eyebrow="Field Force Deployment"
      subtitle="Build a real deployment order: choose territory, field roles, capacity, schedule, assets, validation protocol, budget and supervisor escalation."
      icon={Target}
      gradient="from-violet-700 via-blue-600 to-cyan-500"
      actionLabel="Create Deployment Order"
      onClose={onClose}
      right={
        <>
          <div className="rounded-[28px] bg-slate-950 p-5 text-white">
            <h3 className="flex items-center gap-2 text-lg font-black"><Sparkles className="text-violet-300" size={20} />AI Deployment Plan</h3>
            <div className="mt-4 space-y-3 text-sm font-semibold text-slate-300">
              <p className="rounded-2xl border border-white/10 bg-white/5 p-4">Send 1 supervisor + 6 ambassadors to high-risk zones first, then reinforce top-performing cities with 2 closers.</p>
              <p className="rounded-2xl border border-white/10 bg-white/5 p-4">Require proof package: GPS, partner contact, photo, signed visit outcome and next action.</p>
              <p className="rounded-2xl border border-white/10 bg-white/5 p-4">Escalate any territory below 60% coverage before incentive approval.</p>
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 p-5">
            <h3 className="text-lg font-black">Impact Forecast</h3>
            {[
              ["Projected visits", "420"],
              ["Ambassadors required", "36"],
              ["Coverage lift", "+18%"],
              ["Budget estimate", "18,500 MAD"],
              ["Expected partner leads", "85"],
            ].map(([a,b]) => <div key={a} className="mt-3 flex justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"><b className="text-slate-500">{a}</b><b>{b}</b></div>)}
          </div>
        </>
      }
    >
      <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-xl font-black">Deployment Command</h3>
        <div className="mt-5 grid grid-cols-3 gap-4">
          <SelectField label="Target Territory" options={territories.map((t) => `${t.city} — ${t.region}`)} />
          <SelectField label="Deployment Type" options={["Recovery strike team", "Growth activation team", "Audit & compliance sweep", "Partner acquisition sprint", "Event support unit"]} />
          <SelectField label="Priority" options={["Critical today", "High this week", "Normal", "Monitor only"]} />
          <TextField label="Team size" type="number" placeholder="Example: 12 ambassadors" />
          <TextField label="Supervisor" placeholder="Regional supervisor name" />
          <TextField label="Budget cap MAD" type="number" placeholder="Example: 18500" />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-5">
        <div className="rounded-[28px] border border-slate-200 p-5">
          <h3 className="flex items-center gap-2 text-lg font-black"><Users className="text-violet-600" size={20}/> Team Composition</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {["Lead ambassador", "Quality auditor", "B2B prospector", "Nursery relation agent", "Survey collector", "Content proof runner", "Issue resolver", "Backup pool"].map((x) => <ToggleCard key={x}>{x}</ToggleCard>)}
          </div>
        </div>
        <div className="rounded-[28px] border border-slate-200 p-5">
          <h3 className="flex items-center gap-2 text-lg font-black"><ShieldCheck className="text-violet-600" size={20}/> Validation Protocol</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {["GPS check-in", "Photo evidence", "Partner signature", "Manager approval", "Daily close report", "Incentive lock", "Incident escalation", "CRM update"].map((x) => <ToggleCard key={x}>{x}</ToggleCard>)}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 p-5">
        <h3 className="text-lg font-black">Mission Briefing</h3>
        <TextArea label="Instructions" placeholder="Define exact execution expectations, visit scripts, proof requirements, escalation rules, reporting time and success criteria..." />
      </section>
    </ModalShell>
  )
}

function LaunchRouteModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell
      title="Launch Route"
      eyebrow="Route Optimization"
      subtitle="Create route waves for field visits, check-ins, partner activation, surveys, incident resolution and time-boxed city coverage."
      icon={Route}
      gradient="from-cyan-600 via-violet-600 to-fuchsia-600"
      actionLabel="Launch Optimized Route"
      onClose={onClose}
      right={
        <>
          <div className="rounded-[28px] bg-slate-950 p-5 text-white">
            <h3 className="flex items-center gap-2 text-lg font-black"><Route className="text-cyan-300" size={20} />Route Intelligence</h3>
            <div className="mt-4 space-y-3 text-sm font-semibold text-slate-300">
              {["Start with highest lead-density clusters before 11:30.", "Group visits by 15-minute travel radius to reduce wasted time.", "Add mandatory check-in checkpoint after every 5 visits.", "Trigger manager alert if route completion drops below 70% by 16:00."].map((x) => <p key={x} className="rounded-2xl border border-white/10 bg-white/5 p-4">{x}</p>)}
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 p-5">
            <h3 className="text-lg font-black">Route KPIs</h3>
            {[
              ["Estimated duration", "6h 45m"],
              ["Planned stops", "28"],
              ["Expected check-ins", "24"],
              ["Travel efficiency", "87%"],
              ["Critical visits", "6"],
            ].map(([a,b]) => <div key={a} className="mt-3 flex justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"><b className="text-slate-500">{a}</b><b>{b}</b></div>)}
          </div>
        </>
      }
    >
      <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-xl font-black">Route Builder</h3>
        <div className="mt-5 grid grid-cols-3 gap-4">
          <SelectField label="City" options={["Casablanca", "Rabat", "Marrakech", "Tangier", "Agadir", "Oujda"]} />
          <SelectField label="Route Objective" options={["Partner acquisition", "Store visits", "Check-ins", "Survey sweep", "Incident follow-up", "Training attendance"]} />
          <SelectField label="Optimization Logic" options={["Shortest time", "Highest revenue potential", "Risk first", "Coverage gap first", "Balanced"]} />
          <TextField label="Start Location" placeholder="Hub, office or first stop" />
          <TextField label="Max Stops" type="number" placeholder="Example: 28" />
          <TextField label="Route Date" type="date" placeholder="" />
        </div>
      </section>

      <section className="grid grid-cols-3 gap-5">
        <div className="rounded-[28px] border border-slate-200 p-5">
          <h3 className="text-lg font-black">Stop Types</h3>
          <div className="mt-4 space-y-3">{["Nursery partner", "Preschool prospect", "Parent community point", "Training venue", "Complaint location", "Brand visibility point"].map((x) => <ToggleCard key={x}>{x}</ToggleCard>)}</div>
        </div>
        <div className="rounded-[28px] border border-slate-200 p-5">
          <h3 className="text-lg font-black">Checkpoints</h3>
          <div className="mt-4 space-y-3">{["Morning confirmation", "Midday route progress", "Proof after each stop", "Issue escalation", "End-of-day report", "Supervisor validation"].map((x) => <ToggleCard key={x}>{x}</ToggleCard>)}</div>
        </div>
        <div className="rounded-[28px] border border-slate-200 p-5">
          <h3 className="text-lg font-black">Auto Actions</h3>
          <div className="mt-4 space-y-3">{["Create visit tasks", "Send WhatsApp brief", "Attach route sheet", "Notify supervisor", "Generate proof folder", "Prepare report"].map((x) => <ToggleCard key={x}>{x}</ToggleCard>)}</div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 p-5">
        <h3 className="text-lg font-black">Route Notes</h3>
        <TextArea label="Special instructions" placeholder="Add route constraints, travel notes, sensitive partners, blocked zones, priority stops and proof rules..." />
      </section>
    </ModalShell>
  )
}

function AssignTerritoryModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell
      title="Assign Territory"
      eyebrow="Ownership & Governance"
      subtitle="Assign ownership of territories to ambassadors or supervisors with quotas, rights, approval limits, coverage obligations and performance rules."
      icon={MapPinned}
      gradient="from-emerald-600 via-violet-600 to-blue-600"
      actionLabel="Assign Territory Ownership"
      onClose={onClose}
      right={
        <>
          <div className="rounded-[28px] bg-slate-950 p-5 text-white">
            <h3 className="flex items-center gap-2 text-lg font-black"><ShieldCheck className="text-emerald-300" size={20} />Assignment Guardrails</h3>
            <div className="mt-4 space-y-3 text-sm font-semibold text-slate-300">
              {["Do not assign high-risk territory without supervisor backup.", "Elite performers should own expansion cities, not only stable cities.", "New ambassadors should receive narrow zones with daily validation.", "Reassign automatically if proof quality drops below target."].map((x) => <p key={x} className="rounded-2xl border border-white/10 bg-white/5 p-4">{x}</p>)}
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 p-5">
            <h3 className="text-lg font-black">Ownership Preview</h3>
            {[
              ["Assigned cities", "3"],
              ["Monthly quota", "160 visits"],
              ["Proof target", "95%"],
              ["Revenue target", "220K MAD"],
              ["Review cycle", "Weekly"],
            ].map(([a,b]) => <div key={a} className="mt-3 flex justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"><b className="text-slate-500">{a}</b><b>{b}</b></div>)}
          </div>
        </>
      }
    >
      <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-xl font-black">Assignment Setup</h3>
        <div className="mt-5 grid grid-cols-3 gap-4">
          <SelectField label="Territory" options={territories.map((t) => `${t.city} — ${t.status}`)} />
          <SelectField label="Assign To" options={["Elite ambassador", "Regional supervisor", "Recruitment pod", "Field operations team", "Temporary strike team"]} />
          <SelectField label="Ownership Type" options={["Primary owner", "Backup owner", "Temporary owner", "Supervisor-only", "Shared team ownership"]} />
          <TextField label="Owner Name" placeholder="Ambassador or team name" />
          <TextField label="Start Date" type="date" placeholder="" />
          <TextField label="Review Date" type="date" placeholder="" />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-5">
        <div className="rounded-[28px] border border-slate-200 p-5">
          <h3 className="flex items-center gap-2 text-lg font-black"><ClipboardCheck className="text-violet-600" size={20}/> KPIs & Quotas</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <TextField label="Monthly Visits" type="number" placeholder="160" />
            <TextField label="Partner Leads" type="number" placeholder="45" />
            <TextField label="Survey Target" type="number" placeholder="90" />
            <TextField label="Training Target" type="number" placeholder="12" />
          </div>
        </div>
        <div className="rounded-[28px] border border-slate-200 p-5">
          <h3 className="flex items-center gap-2 text-lg font-black"><Wallet className="text-violet-600" size={20}/> Incentive Rules</h3>
          <div className="mt-4 space-y-3">
            {["Pay only after proof validation", "Bonus for 95%+ coverage", "Penalty for missed weekly report", "Manager override required", "Unlock tiered incentives"].map((x) => <ToggleCard key={x}>{x}</ToggleCard>)}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 p-5">
        <h3 className="text-lg font-black">Access & Permissions</h3>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {["View leads", "Create visits", "Approve tasks", "Edit partners", "Access reports", "Request budget", "Escalate tickets", "Send announcements"].map((x) => <ToggleCard key={x}>{x}</ToggleCard>)}
        </div>
      </section>
    </ModalShell>
  )
}

function OpenOperationsModal({ onClose }: { onClose: () => void }) {
  const incidents = ["Coverage drop in Oujda", "Agadir recruitment shortage", "Marrakech proof delay", "Rabat partner follow-up"]
  return (
    <ModalShell
      title="Open Territory Operations"
      eyebrow="Enterprise Control Room"
      subtitle="Central command for territory incidents, approvals, live tasks, budget signals, communication, proof validation and executive reporting."
      icon={Building2}
      gradient="from-slate-950 via-violet-800 to-fuchsia-700"
      actionLabel="Open Control Room"
      onClose={onClose}
      right={
        <>
          <div className="rounded-[28px] bg-slate-950 p-5 text-white">
            <h3 className="flex items-center gap-2 text-lg font-black"><Radio className="text-fuchsia-300" size={20} />Live Command Feed</h3>
            <div className="mt-4 space-y-3 text-sm font-semibold text-slate-300">
              {incidents.map((x, i) => <p key={x} className="rounded-2xl border border-white/10 bg-white/5 p-4"><b className="text-white">T-{i + 1}</b> · {x}</p>)}
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 p-5">
            <h3 className="text-lg font-black">Decision Queue</h3>
            {[
              ["Budget approvals", "7"],
              ["Proof validations", "42"],
              ["Escalated tickets", "11"],
              ["Route exceptions", "5"],
              ["Manager reviews", "9"],
            ].map(([a,b]) => <div key={a} className="mt-3 flex justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"><b className="text-slate-500">{a}</b><b>{b}</b></div>)}
          </div>
        </>
      }
    >
      <section className="grid grid-cols-4 gap-4">
        {[
          ["Critical tickets", "11", ShieldAlert, "bg-rose-50 text-rose-700"],
          ["Open tasks", "186", ClipboardList, "bg-violet-50 text-violet-700"],
          ["Pending proofs", "42", PackageCheck, "bg-blue-50 text-blue-700"],
          ["Reports due", "9", FileText, "bg-amber-50 text-amber-700"],
        ].map(([a,b,Icon,tint]) => {
          const I = Icon as typeof ShieldAlert
          return <div key={a as string} className={`rounded-[24px] p-5 ${tint as string}`}><I size={22}/><div className="mt-3 text-3xl font-black">{b as string}</div><div className="text-xs font-black uppercase">{a as string}</div></div>
        })}
      </section>

      <section className="grid grid-cols-2 gap-5">
        <div className="rounded-[28px] border border-slate-200 p-5">
          <h3 className="text-lg font-black">Create Operational Action</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <SelectField label="Action Type" options={["Escalation", "Budget approval", "Task sprint", "Proof audit", "Emergency deployment", "Executive report"]} />
            <SelectField label="Owner" options={["Regional manager", "Field supervisor", "Operations lead", "Marketing lead", "Finance approver"]} />
            <TextField label="Deadline" type="datetime-local" placeholder="" />
            <TextField label="SLA Hours" type="number" placeholder="24" />
          </div>
          <div className="mt-4"><TextArea label="Action Brief" placeholder="Describe what must happen, who owns it, what proof is required and what escalation applies..." /></div>
        </div>
        <div className="rounded-[28px] border border-slate-200 p-5">
          <h3 className="text-lg font-black">Control Room Modules</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ["Task War Room", ClipboardList],
              ["Proof Center", PackageCheck],
              ["Budget Desk", Wallet],
              ["Announcements", Megaphone],
              ["Incident Board", AlertTriangle],
              ["Executive Report", BarChart3],
              ["Team Chat", MessageSquare],
              ["Calendar Ops", CalendarClock],
            ].map(([label, Icon]) => {
              const I = Icon as typeof ClipboardList
              return <button key={label as string} className="grid min-h-[88px] place-items-center rounded-2xl border border-slate-200 text-center text-xs font-black hover:border-violet-300 hover:bg-violet-50"><I className="text-violet-600" size={20}/>{label as string}</button>
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 p-5">
        <h3 className="text-lg font-black">Executive Closure Requirements</h3>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {["All proofs validated", "Finance checked", "Supervisor signed", "Partner outcomes logged", "Report generated", "Risks updated", "Next sprint created", "Leadership notified"].map((x) => <ToggleCard key={x}>{x}</ToggleCard>)}
        </div>
      </section>
    </ModalShell>
  )
}

function ExecutionModal({ active, onClose }: { active: ModalKey; onClose: () => void }) {
  if (active === "deploy") return <DeployTeamModal onClose={onClose} />
  if (active === "route") return <LaunchRouteModal onClose={onClose} />
  if (active === "assign") return <AssignTerritoryModal onClose={onClose} />
  if (active === "operations") return <OpenOperationsModal onClose={onClose} />
  return null
}

export default function AmbassadorTerritoriesUltraPage() {
  const [activeModal, setActiveModal] = useState<ModalKey>(null)

  const totals = useMemo(() => ({
    ambassadors: territories.reduce((s, t) => s + t.ambassadors, 0),
    coverage: Math.round(territories.reduce((s, t) => s + t.coverage, 0) / territories.length),
    score: Math.round(territories.reduce((s, t) => s + t.score, 0) / territories.length),
    critical: territories.filter((t) => t.risk === "High").length,
  }), [])

  const actions = [
    ["Deploy Team", Target, "deploy" as ModalKey],
    ["Launch Route", Route, "route" as ModalKey],
    ["Assign Territory", MapPinned, "assign" as ModalKey],
    ["Open Operations", Building2, "operations" as ModalKey],
  ]

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-slate-950">
      <AmbassadorMarketSidebar />

      <main className="flex-1 px-8 py-7">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-violet-700">
              <Sparkles size={14} />
              Territory Intelligence
            </div>
            <h1 className="mt-4 text-[34px] font-black tracking-tight">Ambassador Territories Command</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-500">
              Real-time territory monitoring, operational coverage, deployment control, ambassador density analysis and enterprise execution workflows across Morocco.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black shadow-sm">This Month</button>
            <button className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200">Sync Territories</button>
          </div>
        </div>

        <section className="grid grid-cols-6 gap-4">
          {[
            ["Live Territories", "48", MapPinned, "bg-violet-100 text-violet-700"],
            ["Coverage Rate", `${totals.coverage}%`, Activity, "bg-blue-100 text-blue-700"],
            ["Active Ambassadors", totals.ambassadors.toLocaleString(), Users, "bg-emerald-100 text-emerald-700"],
            ["Territory Health", `${totals.score}/100`, ShieldCheck, "bg-orange-100 text-orange-700"],
            ["Mission Velocity", "3,847", Zap, "bg-cyan-100 text-cyan-700"],
            ["Critical Zones", String(totals.critical), AlertTriangle, "bg-rose-100 text-rose-700"],
          ].map(([label, value, Icon, tint]) => {
            const CardIcon = Icon as typeof MapPinned
            return (
              <div key={label as string} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`grid h-14 w-14 place-items-center rounded-2xl ${tint as string}`}><CardIcon size={22} /></div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label as string}</div>
                    <div className="mt-1 text-3xl font-black">{value as string}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </section>

        <section className="mt-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-[1.6fr_0.6fr_0.6fr_0.6fr] gap-4">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <Search size={18} className="text-slate-400" />
              <input className="w-full outline-none" placeholder="Search territories, cities, regions..." />
            </label>
            <button className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black">Risk Level <Filter size={16} /></button>
            <button className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black">Coverage <Filter size={16} /></button>
            <button className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black">Deployment <Route size={16} /></button>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-[1.35fr_0.9fr] gap-5">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Morocco Operational Grid</h2>
                <p className="text-sm font-semibold text-slate-500">Live ambassador territory distribution and activity monitoring.</p>
              </div>
              <div className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-700">LIVE SYNCED</div>
            </div>
            <div className="relative h-[620px] overflow-hidden rounded-[32px] border border-violet-100 bg-[radial-gradient(circle_at_40%_20%,#ede9fe_0,#ffffff_40%,#f8fafc_100%)]">
              <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,#e9d5ff_1px,transparent_1px),linear-gradient(to_bottom,#e9d5ff_1px,transparent_1px)] [background-size:40px_40px]" />
              <div className="absolute left-[18%] top-[10%] h-[470px] w-[560px] rotate-[-18deg] rounded-[40%_60%_48%_52%] bg-violet-100/70 shadow-inner" />
              {territories.map((t, i) => (
                <div key={t.city} className={`absolute ${["left-[48%] top-[14%]","left-[40%] top-[30%]","left-[48%] top-[55%]","left-[62%] top-[18%]","left-[30%] top-[72%]","left-[72%] top-[42%]"][i]}`}>
                  <div className={`grid h-20 w-20 place-items-center rounded-full border-4 shadow-2xl ${t.risk === "High" ? "border-rose-300 bg-rose-50 text-rose-700" : t.risk === "Medium" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-violet-300 bg-white text-violet-700"}`}>
                    <div className="text-center"><div className="text-xl font-black">{t.ambassadors}</div><div className="text-[10px] font-black uppercase">agents</div></div>
                  </div>
                  <div className="mt-2 rounded-full bg-white/90 px-3 py-1 text-xs font-black shadow-sm">{t.city}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-500"><Zap size={24} /></div>
                <div><h2 className="text-xl font-black">AI Territory Engine</h2><p className="text-sm font-semibold text-slate-400">Real-time operational recommendations.</p></div>
              </div>
              <div className="mt-6 space-y-4">
                {["Increase ambassador deployment in Casablanca by 14%", "Agadir territory requires immediate recruitment reinforcement", "Tangier shows strong activation performance", "Deploy new campaign routes in Oujda"].map((x) => (
                  <div key={x} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-slate-200">{x}</div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Territory Execution</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Each action opens its own enterprise workflow.</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {actions.map(([label, Icon, key]) => {
                  const ActionIcon = Icon as typeof Target
                  return (
                    <button key={label as string} onClick={() => setActiveModal(key as ModalKey)} className="grid min-h-[110px] place-items-center rounded-2xl border border-slate-200 text-center text-xs font-black transition hover:border-violet-300 hover:bg-violet-50">
                      <ActionIcon className="text-violet-600" size={24} />
                      {label as string}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="text-2xl font-black">Territory Operational Matrix</h2><p className="text-sm font-semibold text-slate-500">Live territory health, ambassador density and coverage analytics.</p></div>
            <button className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black">Export Matrix</button>
          </div>
          <table className="w-full text-left">
            <thead><tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wide text-slate-500"><th className="pb-4">Territory</th><th className="pb-4">Ambassadors</th><th className="pb-4">Coverage</th><th className="pb-4">Performance</th><th className="pb-4">Risk</th><th className="pb-4">Status</th></tr></thead>
            <tbody>
              {territories.map((t) => (
                <tr key={t.city} className="border-b border-slate-100">
                  <td className="py-5"><div className="font-black">{t.city}</div><div className="text-xs font-semibold text-slate-500">{t.region}</div></td>
                  <td className="font-black">{t.ambassadors}</td>
                  <td><div className="flex items-center gap-3"><div className="h-3 w-32 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${t.coverage}%` }} /></div><span className="text-sm font-black">{t.coverage}%</span></div></td>
                  <td className="font-black">{t.score}/100</td>
                  <td><span className={`rounded-full px-4 py-2 text-xs font-black ${t.risk === "High" ? "bg-rose-100 text-rose-700" : t.risk === "Medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{t.risk}</span></td>
                  <td><span className="rounded-full bg-violet-100 px-4 py-2 text-xs font-black text-violet-700">{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <ExecutionModal active={activeModal} onClose={() => setActiveModal(null)} />
      </main>
    </div>
  )
}
