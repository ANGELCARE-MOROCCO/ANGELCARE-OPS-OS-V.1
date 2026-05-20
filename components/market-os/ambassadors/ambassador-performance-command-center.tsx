
"use client"

import { useMemo, useState } from "react"
import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Download,
  PlusCircle,
  Radio,
  PackageCheck,
  Route,
  MapPinned,
  Mail,
  Phone,
  History,
  Edit3,
  FileText,
  Filter,
  Gauge,
  Medal,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react"

type ProfileMode = "overview" | "edit" | "tasks" | "comments" | "history"

type Ambassador = {
  name: string
  city: string
  region: string
  group: string
  score: number
  visits: number
  leads: number
  conversion: number
  proofQuality: number
  training: number
  incentives: number
  risk: "Low" | "Medium" | "High"
  trend: "up" | "down" | "stable"
}

type DecisionModal = "coaching" | "incentives" | "risk" | "praise" | "report" | "kpi" | null

type ProfileModalState = Ambassador | null

const ambassadors: Ambassador[] = [
  { name: "Youssef El Fassi", city: "Casablanca", region: "Casablanca-Settat", group: "Elite Performers", score: 98, visits: 84, leads: 39, conversion: 31, proofQuality: 97, training: 100, incentives: 12800, risk: "Low", trend: "up" },
  { name: "Fatima Zahra Ait", city: "Rabat", region: "Rabat-Salé-Kénitra", group: "Top Performers", score: 96, visits: 78, leads: 36, conversion: 29, proofQuality: 96, training: 98, incentives: 11600, risk: "Low", trend: "up" },
  { name: "Omar Kabbaj", city: "Marrakech", region: "Marrakech-Safi", group: "Top Performers", score: 92, visits: 71, leads: 31, conversion: 24, proofQuality: 91, training: 94, incentives: 9800, risk: "Low", trend: "stable" },
  { name: "Imane Lahlou", city: "Fès", region: "Fès-Meknès", group: "Core Team", score: 86, visits: 62, leads: 25, conversion: 19, proofQuality: 88, training: 90, incentives: 7600, risk: "Low", trend: "up" },
  { name: "Ahmed Benali", city: "Tangier", region: "Tanger-Tétouan-Al Hoceima", group: "Core Team", score: 82, visits: 59, leads: 23, conversion: 17, proofQuality: 84, training: 85, incentives: 6900, risk: "Medium", trend: "stable" },
  { name: "Salma El Amrani", city: "Agadir", region: "Souss-Massa", group: "Recovery", score: 64, visits: 38, leads: 11, conversion: 9, proofQuality: 68, training: 72, incentives: 3200, risk: "High", trend: "down" },
  { name: "Mehdi Tazi", city: "Oujda", region: "Oriental", group: "Recovery", score: 58, visits: 31, leads: 8, conversion: 6, proofQuality: 61, training: 66, incentives: 2400, risk: "High", trend: "down" },
]

function scoreColor(score: number) {
  if (score >= 90) return "bg-emerald-500"
  if (score >= 75) return "bg-violet-500"
  if (score >= 60) return "bg-amber-500"
  return "bg-rose-500"
}

function riskBadge(risk: Ambassador["risk"]) {
  if (risk === "High") return "bg-rose-100 text-rose-700"
  if (risk === "Medium") return "bg-amber-100 text-amber-700"
  return "bg-emerald-100 text-emerald-700"
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label as string}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
      />
    </label>
  )
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label as string}</span>
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

function ModalShell({
  title,
  subtitle,
  icon: Icon,
  gradient,
  children,
  right,
  action,
  onClose,
}: {
  title: string
  subtitle: string
  icon: typeof MessageSquare
  gradient: string
  children: React.ReactNode
  right: React.ReactNode
  action: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[93vh] w-full max-w-[1480px] overflow-y-auto rounded-[38px] border border-white/70 bg-white shadow-2xl">
        <header className={`relative overflow-hidden rounded-t-[38px] bg-gradient-to-r ${gradient} p-7 text-white`}>
          <Icon className="absolute -right-8 -top-10 opacity-15" size={220} />
          <button onClick={onClose} className="absolute right-6 top-6 grid h-11 w-11 place-items-center rounded-2xl bg-white/15 transition hover:bg-white/25">
            <X size={20} />
          </button>
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15">
              <Icon size={30} />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Angelcare Performance Execution</div>
              <h2 className="mt-2 text-3xl font-black tracking-tight">{title as string}</h2>
              <p className="mt-2 max-w-4xl text-sm font-semibold text-white/80">{subtitle}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-[1.35fr_0.75fr] gap-6 p-7">
          <main className="space-y-6">{children}</main>
          <aside className="space-y-5">
            {right}
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-200">
              <CheckCircle2 size={18} />
              {action}
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}


function RadioAiPanel({
  title,
  subtitle,
  icon: Icon,
  items,
}: {
  title: string
  subtitle: string
  icon: typeof Bot
  items: string[]
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-emerald-400/40 bg-[#06140d] p-5 text-emerald-100 shadow-[0_0_34px_rgba(16,185,129,0.18)]">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(52,211,153,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.11)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(16,185,129,0.28),transparent_34%),radial-gradient(circle_at_92%_78%,rgba(34,197,94,0.16),transparent_32%)]" />

      <div className="relative flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10 text-emerald-300 shadow-[inset_0_0_18px_rgba(16,185,129,0.22)]">
          <Icon size={24} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">AI SIGNAL ONLINE</span>
          </div>
          <h3 className="mt-1 font-mono text-lg font-black uppercase tracking-wide text-emerald-100">{title as string}</h3>
          <p className="font-mono text-xs font-bold text-emerald-300/80">{subtitle}</p>
        </div>
      </div>

      <div className="relative mt-5 space-y-3">
        {items.map((item, index) => (
          <div
            key={item}
            className="rounded-2xl border border-emerald-400/25 bg-black/30 p-4 font-mono text-sm font-bold leading-relaxed text-emerald-100 shadow-[inset_0_0_14px_rgba(16,185,129,0.08)]"
          >
            <span className="mr-2 text-emerald-300">[{String(index + 1).padStart(2, "0")}]</span>
            {item}
          </div>
        ))}
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-emerald-400/20 pt-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300/80">
        <span>Angelcare Tactical AI</span>
        <span>RX-86.7 MHz</span>
      </div>
    </div>
  )
}


function DecisionModalView({ active, onClose }: { active: DecisionModal; onClose: () => void }) {
  if (!active) return null

  if (active === "coaching") {
    return (
      <ModalShell
        title="Create Coaching Plan"
        subtitle="Build a complete coaching sprint for underperforming or high-potential ambassadors with clear targets, sessions, owners, follow-ups and measurable improvement."
        icon={MessageSquare}
        gradient="from-violet-700 via-blue-600 to-cyan-500"
        action="Create Coaching Sprint"
        onClose={onClose}
        right={
          <>
            <RadioAiPanel
              title="AI Coaching Diagnosis"
              subtitle="Recovery signal analysis"
              icon={Bot}
              items={["Focus on proof discipline before increasing mission volume.", "Pair recovery ambassadors with elite performers for 7 days.", "Set daily check-in and proof review until score improves by 12 points."]}
            />
            <div className="rounded-[28px] border border-slate-200 p-5">
              <h3 className="text-lg font-black">Improvement Forecast</h3>
              {["Score +12 pts", "Proof +18%", "Visits +24", "Review weekly"].map((x) => <div key={x} className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black">{x}</div>)}
            </div>
          </>
        }
      >
        <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-xl font-black">Coaching Sprint Setup</h3>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <SelectField label="Ambassador" options={ambassadors.filter(a => a.risk !== "Low").map(a => `${a.name} — ${a.city}`)} />
            <SelectField label="Coaching Focus" options={["Proof quality", "Lead conversion", "Field discipline", "Training completion", "Partner communication"]} />
            <SelectField label="Coach" options={["Regional manager", "Elite performer mentor", "Training lead", "Operations supervisor"]} />
            <Field label="Target Score" type="number" placeholder="Example: 80" />
            <Field label="Start Date" type="date" placeholder="" />
            <Field label="Review Date" type="date" placeholder="" />
          </div>
        </section>
        <section className="grid grid-cols-2 gap-5">
          <div className="rounded-[28px] border border-slate-200 p-5">
            <h3 className="text-lg font-black">Coaching Actions</h3>
            <div className="mt-4 space-y-3">{["Daily score review", "Proof checklist training", "Shadow elite ambassador", "Roleplay partner pitch", "Manager follow-up call", "End-of-week assessment"].map(x => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
          </div>
          <div className="rounded-[28px] border border-slate-200 p-5">
            <h3 className="text-lg font-black">Success Metrics</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Field label="Minimum Visits" type="number" placeholder="30" />
              <Field label="Proof Rate %" type="number" placeholder="90" />
              <Field label="Lead Target" type="number" placeholder="12" />
              <Field label="Training %" type="number" placeholder="95" />
            </div>
          </div>
        </section>
      </ModalShell>
    )
  }

  if (active === "incentives") {
    return (
      <ModalShell
        title="Approve Incentives"
        subtitle="Review performance, proof quality, compliance, payout eligibility and finance controls before incentive approval."
        icon={Wallet}
        gradient="from-emerald-600 via-violet-600 to-blue-600"
        action="Approve Eligible Payouts"
        onClose={onClose}
        right={
          <>
            <RadioAiPanel
              title="Finance Guardrails"
              subtitle="Payout compliance scanner"
              icon={ShieldCheck}
              items={["Hold payouts below 70% proof quality.", "Require manager override for recovery group incentives.", "Release elite bonuses immediately after audit confirmation."]}
            />
            <div className="rounded-[28px] border border-slate-200 p-5">
              <h3 className="text-lg font-black">Payout Summary</h3>
              {[
                ["Eligible", "5 ambassadors"],
                ["Hold", "2 ambassadors"],
                ["Total", "54,300 MAD"],
                ["Risk block", "2 profiles"],
              ].map(([a,b]) => <div key={a} className="mt-3 flex justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"><b className="text-slate-500">{a}</b><b>{b}</b></div>)}
            </div>
          </>
        }
      >
        <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-xl font-black">Incentive Approval Batch</h3>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <SelectField label="Payout Period" options={["May 2025", "April 2025", "Custom cycle"]} />
            <SelectField label="Approval Policy" options={["Strict proof validation", "Manager override allowed", "Elite fast-track", "Finance review only"]} />
            <SelectField label="Payout Channel" options={["Payroll", "Bank transfer", "Cash desk", "Pending finance"]} />
          </div>
        </section>
        <section className="rounded-[28px] border border-slate-200 p-5">
          <h3 className="text-lg font-black">Eligible Ambassadors</h3>
          <div className="mt-4 space-y-3">
            {ambassadors.map(a => (
              <label key={a.name} className="grid grid-cols-[24px_1fr_100px_100px_100px] items-center gap-3 rounded-2xl border border-slate-200 p-3 text-sm font-bold">
                <input type="checkbox" className="accent-violet-600" defaultChecked={a.risk === "Low"} />
                <span>{a.name}</span>
                <span>{a.score}/100</span>
                <span>{a.proofQuality}% proof</span>
                <span>{a.incentives.toLocaleString()} MAD</span>
              </label>
            ))}
          </div>
        </section>
      </ModalShell>
    )
  }

  if (active === "risk") {
    return (
      <ModalShell
        title="Flag Performance Risk"
        subtitle="Create a risk case with reason codes, severity, owner, intervention plan, escalation and follow-up deadline."
        icon={AlertTriangle}
        gradient="from-rose-600 via-orange-500 to-violet-700"
        action="Create Risk Case"
        onClose={onClose}
        right={
          <>
            <RadioAiPanel
              title="Risk Intelligence"
              subtitle="Threat detection channel"
              icon={ShieldAlert}
              items={["High risk is mainly proof quality + declining visits.", "Escalate if no improvement after 72 hours.", "Block new incentives until the risk case is closed."]}
            />
            <div className="rounded-[28px] border border-slate-200 p-5">
              <h3 className="text-lg font-black">Risk SLA</h3>
              {["Critical: 24h", "High: 72h", "Medium: 7 days", "Manager sign-off required"].map(x => <div key={x} className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black">{x}</div>)}
            </div>
          </>
        }
      >
        <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-xl font-black">Risk Case Details</h3>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <SelectField label="Ambassador" options={ambassadors.map(a => `${a.name} — ${a.score}/100`)} />
            <SelectField label="Risk Severity" options={["Critical", "High", "Medium", "Watch"]} />
            <SelectField label="Owner" options={["Regional manager", "HR", "Operations supervisor", "Training lead"]} />
            <Field label="Follow-up Deadline" type="date" placeholder="" />
            <Field label="Minimum Recovery Score" type="number" placeholder="75" />
            <Field label="Escalation Hours" type="number" placeholder="72" />
          </div>
        </section>
        <section className="grid grid-cols-2 gap-5">
          <div className="rounded-[28px] border border-slate-200 p-5">
            <h3 className="text-lg font-black">Reason Codes</h3>
            <div className="mt-4 space-y-3">{["Low proof quality", "Low visits", "Declining conversion", "Training incomplete", "Late reporting", "Manager complaint"].map(x => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
          </div>
          <div className="rounded-[28px] border border-slate-200 p-5">
            <h3 className="text-lg font-black">Intervention Actions</h3>
            <div className="mt-4 space-y-3">{["Create coaching sprint", "Freeze incentives", "Assign mentor", "Daily reporting", "Supervisor field review", "Reassign territory"].map(x => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
          </div>
        </section>
      </ModalShell>
    )
  }

  if (active === "praise") {
    return (
      <ModalShell
        title="Send Praise"
        subtitle="Recognize top performers with a professional praise note, public recognition, incentive nomination and leadership visibility."
        icon={Trophy}
        gradient="from-amber-500 via-orange-500 to-violet-700"
        action="Send Recognition"
        onClose={onClose}
        right={
          <>
            <RadioAiPanel
              title="Suggested Message"
              subtitle="Recognition transmission draft"
              icon={Sparkles}
              items={["Excellent execution this month. Your consistency, proof quality and field discipline are setting the standard for Angelcare ambassadors."]}
            />
            <div className="rounded-[28px] border border-slate-200 p-5">
              <h3 className="text-lg font-black">Recognition Impact</h3>
              {["Motivation boost", "Leaderboard visibility", "Retention signal", "Mentor eligibility"].map(x => <div key={x} className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black">{x}</div>)}
            </div>
          </>
        }
      >
        <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-xl font-black">Recognition Setup</h3>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <SelectField label="Recipient" options={ambassadors.filter(a => a.score >= 90).map(a => `${a.name} — ${a.score}/100`)} />
            <SelectField label="Recognition Type" options={["Private praise", "Team announcement", "Leaderboard award", "Incentive nomination", "Mentor nomination"]} />
            <SelectField label="Channel" options={["Internal notification", "WhatsApp", "Email", "Team board", "All channels"]} />
          </div>
        </section>
        <section className="rounded-[28px] border border-slate-200 p-5">
          <h3 className="text-lg font-black">Praise Message</h3>
          <textarea className="mt-4 h-40 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-violet-400" defaultValue="Excellent execution this month. Your consistency, proof quality and field discipline are setting the standard for Angelcare ambassadors." />
        </section>
      </ModalShell>
    )
  }

  if (active === "report") {
    return (
      <ModalShell
        title="Generate Performance Report"
        subtitle="Create a management-ready report with score trends, risk list, incentive readiness, coaching queue and action recommendations."
        icon={FileText}
        gradient="from-slate-900 via-blue-700 to-violet-700"
        action="Generate Report"
        onClose={onClose}
        right={
          <>
            <RadioAiPanel
              title="Report Sections"
              subtitle="Executive report generator"
              icon={BarChart3}
              items={["Executive summary", "Leaderboard", "Risk cases", "Incentive readiness", "Coaching recommendations"]}
            />
            <div className="rounded-[28px] border border-slate-200 p-5">
              <h3 className="text-lg font-black">Delivery</h3>
              {["PDF export", "CSV appendix", "Leadership email", "Archive in reports"].map(x => <div key={x} className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black">{x}</div>)}
            </div>
          </>
        }
      >
        <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-xl font-black">Report Configuration</h3>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <SelectField label="Report Type" options={["Executive monthly report", "Operations report", "Coaching report", "Incentive report", "Risk report"]} />
            <SelectField label="Audience" options={["Direction Rabat", "Operations team", "HR team", "Finance", "Regional managers"]} />
            <SelectField label="Format" options={["PDF", "Dashboard snapshot", "CSV + PDF", "Email summary"]} />
          </div>
        </section>
        <section className="rounded-[28px] border border-slate-200 p-5">
          <h3 className="text-lg font-black">Include Sections</h3>
          <div className="mt-4 grid grid-cols-3 gap-3">{["KPI summary", "Leaderboard", "Risk ambassadors", "Coaching queue", "Incentive readiness", "Proof quality", "Regional breakdown", "Recommendations", "Action plan"].map(x => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
        </section>
      </ModalShell>
    )
  }

  return (
    <ModalShell
      title="Create KPI Tasks"
      subtitle="Convert performance gaps into executable tasks with owners, deadlines, proof requirements, KPIs and follow-up controls."
      icon={ClipboardCheck}
      gradient="from-violet-700 via-fuchsia-600 to-rose-500"
      action="Create KPI Task Pack"
      onClose={onClose}
      right={
        <>
          <RadioAiPanel
            title="Task Automation"
            subtitle="KPI task generator signal"
            icon={Zap}
            items={["Auto-create proof improvement tasks.", "Assign conversion tasks to low-lead ambassadors.", "Notify supervisors and lock weekly review."]}
          />
          <div className="rounded-[28px] border border-slate-200 p-5">
            <h3 className="text-lg font-black">Task Pack Preview</h3>
            {["18 tasks", "7 owners", "5-day sprint", "Daily proof check"].map(x => <div key={x} className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black">{x}</div>)}
          </div>
        </>
      }
    >
      <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-xl font-black">KPI Task Generator</h3>
        <div className="mt-5 grid grid-cols-3 gap-4">
          <SelectField label="KPI Focus" options={["Proof quality", "Visits", "Lead conversion", "Training completion", "Risk recovery", "All performance gaps"]} />
          <SelectField label="Owners" options={["Ambassadors", "Supervisors", "Training team", "Operations team", "Mixed ownership"]} />
          <SelectField label="Sprint Duration" options={["3 days", "5 days", "7 days", "14 days", "Monthly"]} />
          <Field label="Minimum Target" type="number" placeholder="Example: 85" />
          <Field label="Start Date" type="date" placeholder="" />
          <Field label="Deadline" type="date" placeholder="" />
        </div>
      </section>
      <section className="rounded-[28px] border border-slate-200 p-5">
        <h3 className="text-lg font-black">Tasks to Generate</h3>
        <div className="mt-4 grid grid-cols-3 gap-3">{["Improve proof upload", "Complete training", "Increase visits", "Submit daily summary", "Generate leads", "Attend coaching", "Fix data quality", "Close open tasks", "Manager review"].map(x => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
      </section>
    </ModalShell>
  )
}



function AmbassadorProfile360Modal({
  ambassador,
  onClose,
}: {
  ambassador: Ambassador
  onClose: () => void
}) {
  const [profileMode, setProfileMode] = useState<"overview" | "edit" | "tasks" | "comments" | "history">("overview")
  const [saveStatus, setSaveStatus] = useState("")
  const [commentDraft, setCommentDraft] = useState("")
  const [taskDraft, setTaskDraft] = useState("")
  const [localComments, setLocalComments] = useState([
    {
      author: "Regional Manager",
      note: `${ambassador.name} needs structured follow-up on proof quality and conversion discipline.`,
      time: "Today · 09:40",
    },
    {
      author: "Operations Lead",
      note: "Next review should include visits, lead quality, partner response and training completion.",
      time: "Yesterday · 17:20",
    },
  ])

  const [localTasks, setLocalTasks] = useState([
    { title: "Review proof quality package", owner: "Performance Manager", sla: "Today", status: "Open", priority: "High" },
    { title: "Schedule field coaching checkpoint", owner: "Regional Supervisor", sla: "24h", status: "Open", priority: "High" },
    { title: "Validate incentive eligibility", owner: "Finance Control", sla: "48h", status: "Pending", priority: "Medium" },
    { title: "Assign next territory sprint", owner: "Operations Lead", sla: "3 days", status: "Open", priority: "Medium" },
    { title: "Update manager performance notes", owner: "HR Ops", sla: "Weekly", status: "Recurring", priority: "Low" },
  ])

  function updateTask(index: number, patch: Partial<{ title: string; owner: string; sla: string; status: string; priority: string }>) {
    setLocalTasks((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }

  function toggleTaskDone(index: number, checked: boolean) {
    updateTask(index, { status: checked ? "Done" : "Open" })
  }

  function escalateTask(index: number) {
    updateTask(index, { status: "Escalated", priority: "Critical", owner: "Regional Manager" })
  }

  function addComment() {
    const clean = commentDraft.trim()
    if (!clean) return
    setLocalComments([
      { author: "Current User", note: clean, time: "Just now" },
      ...localComments,
    ])
    setCommentDraft("")
  }

  function addTask() {
    const clean = taskDraft.trim()
    if (!clean) return
    setLocalTasks([
      { title: clean, owner: "Performance Manager", sla: "24h", status: "Open", priority: "High" },
      ...localTasks,
    ])
    setTaskDraft("")
  }

  const scoreGap = Math.max(0, 90 - ambassador.score)
  function saveProfileChanges() {
    setSaveStatus("Profile changes saved in this workspace. Backend persistence can be connected next.")
    setProfileMode("overview")
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-[1580px] overflow-y-auto rounded-[38px] border border-white/70 bg-white shadow-2xl">
        <header className="relative overflow-hidden rounded-t-[38px] bg-gradient-to-r from-slate-950 via-violet-800 to-blue-700 p-7 text-white">
          <Users className="absolute -right-10 -top-10 opacity-15" size={230} />
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white/15 text-xl font-black">
                {ambassador.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">360 Ambassador Profile · Live Control</div>
                <h2 className="mt-2 text-4xl font-black tracking-tight">{ambassador.name}</h2>
                <p className="mt-2 text-sm font-semibold text-white/75">{ambassador.city} · {ambassador.region} · {ambassador.group}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black">Score {ambassador.score}/100</span>
                  <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black">Risk {ambassador.risk}</span>
                  <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black">{ambassador.visits} visits</span>
                  <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black">{ambassador.leads} leads</span>
                  <span className="rounded-full bg-emerald-400/20 px-4 py-2 text-xs font-black text-emerald-100">Synced Profile</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-3xl border border-white/25 bg-slate-950/30 p-2 shadow-2xl backdrop-blur-md">
              <button
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-violet-50"
              >
                <CheckCircle2 size={17} />
                Save Changes
              </button>

              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-white/25"
              >
                <X size={17} />
                Close
              </button>
            </div>
          </div>
        </header>

        <div className="border-b border-slate-200 bg-white px-7 py-4">
          <div className="flex flex-wrap gap-2">
            {[
              ["overview", "Overview"],
              ["edit", "Edit Profile"],
              ["tasks", `Tasks (${localTasks.length})`],
              ["comments", `Comments (${localComments.length})`],
              ["history", "Timeline"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setProfileMode(key as typeof profileMode)}
                className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                  profileMode === key
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-100"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {saveStatus && (
          <div className="mx-7 mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">
            {saveStatus}
          </div>
        )}

        <div className="grid grid-cols-[1.15fr_0.85fr] gap-6 p-7">
          <main className="space-y-6">
            <section className="grid grid-cols-5 gap-4">
              {[
                ["Performance", `${ambassador.score}/100`, Gauge, "bg-violet-50 text-violet-700"],
                ["Visits", String(ambassador.visits), CalendarCheck, "bg-blue-50 text-blue-700"],
                ["Leads", String(ambassador.leads), Target, "bg-emerald-50 text-emerald-700"],
                ["Proof", `${ambassador.proofQuality}%`, ShieldCheck, "bg-cyan-50 text-cyan-700"],
                ["Incentives", `${ambassador.incentives.toLocaleString()} MAD`, Wallet, "bg-orange-50 text-orange-700"],
              ].map(([label, value, Icon, tint]) => {
                const I = Icon as typeof Gauge
                return (
                  <div key={label as string} className={`rounded-[24px] p-5 ${tint as string}`}>
                    <I size={22} />
                    <div className="mt-3 text-2xl font-black">{value as string}</div>
                    <div className="text-xs font-black uppercase">{label as string}</div>
                  </div>
                )
              })}
            </section>

            {profileMode === "overview" && (
              <>
                <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black">Performance Breakdown</h3>
                      <p className="text-sm font-semibold text-slate-500">Full operational view of execution, proof, learning and conversion quality.</p>
                    </div>
                    <button onClick={() => setProfileMode("history")} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black">Open history</button>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-5">
                    {[
                      ["Score target gap", scoreGap, 100 - scoreGap, "points to elite threshold"],
                      ["Conversion", ambassador.conversion, ambassador.conversion, "qualified conversion rate"],
                      ["Proof quality", ambassador.proofQuality, ambassador.proofQuality, "validated proof compliance"],
                      ["Training", ambassador.training, ambassador.training, "learning completion"],
                    ].map(([label, value, width, desc]) => (
                      <div key={label as string} className="rounded-2xl border border-slate-200 p-4">
                        <div className="mb-2 flex justify-between text-sm font-black">
                          <span>{label as string}</span>
                          <span>{String(value)}{label === "Score target gap" ? "" : "%"}</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100">
                          <div className="h-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: `${width}%` }} />
                        </div>
                        <div className="mt-2 text-xs font-semibold text-slate-500">{desc as string}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="grid grid-cols-3 gap-5">
                  {[
                    ["Contact", "Phone, email and preferred channel", Phone],
                    ["Territory", `${ambassador.city} field operations`, MapPinned],
                    ["Current Sprint", "Performance recovery / scale plan", Route],
                  ].map(([title, body, Icon]) => {
                    const I = Icon as typeof Phone
                    return (
                      <div key={title as string} className="rounded-[26px] border border-slate-200 bg-white p-5">
                        <I className="text-violet-600" size={22} />
                        <h4 className="mt-4 text-lg font-black">{title as string}</h4>
                        <p className="mt-2 text-sm font-semibold text-slate-500">{body as string}</p>
                      </div>
                    )
                  })}
                </section>
              </>
            )}

            {profileMode === "edit" && (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                <h3 className="text-2xl font-black">Edit Ambassador Profile</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Production-ready profile editor structure for identity, territory, status, permissions and operational ownership.</p>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <Field label="Full name" placeholder={ambassador.name} />
                  <Field label="Phone" placeholder="+212 6 XX XX XX XX" />
                  <Field label="Email" placeholder="ambassador@angelcare.ma" />
                  <SelectField label="Status" options={["Active", "On Watch", "Recovery", "Suspended", "Pending"]} />
                  <SelectField label="Group" options={["Elite Performers", "Top Performers", "Core Team", "Recovery", "New Ambassador"]} />
                  <SelectField label="Region" options={["Casablanca-Settat", "Rabat-Salé-Kénitra", "Marrakech-Safi", "Fès-Meknès", "Souss-Massa", "Oriental"]} />
                  <Field label="Manager owner" placeholder="Regional Manager" />
                  <Field label="Monthly target visits" type="number" placeholder="80" />
                  <Field label="Monthly lead target" type="number" placeholder="35" />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {["Can create visits", "Can upload proof", "Can request incentive", "Can access scripts", "Can submit surveys", "Needs approval"].map((item) => (
                    <ToggleRow key={item}>{item}</ToggleRow>
                  ))}
                </div>
                <button type="button" onClick={saveProfileChanges} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white">
                  <CheckCircle2 size={17} />
                  Save Profile Changes
                </button>
              </section>
            )}

            {profileMode === "tasks" && (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black">Task Control</h3>
                    <p className="text-sm font-semibold text-slate-500">Create, track and close operational tasks tied to this ambassador.</p>
                  </div>
                  <button onClick={addTask} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2 text-sm font-black text-white">
                    <PlusCircle size={16} />
                    Add Task
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-[1fr_150px] gap-3">
                  <input
                    value={taskDraft}
                    onChange={(event) => setTaskDraft(event.target.value)}
                    placeholder="Create new task for this ambassador..."
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-violet-400"
                  />
                  <SelectField label="Priority" options={["High", "Medium", "Low"]} />
                </div>

                <div className="mt-5 space-y-3">
                  {localTasks.map((task, index) => (
                    <div key={`${task.title}-${index}`} className="grid grid-cols-[28px_1.25fr_0.75fr_0.55fr_0.55fr_110px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold shadow-sm">
                      <input
                        type="checkbox"
                        checked={task.status === "Done"}
                        onChange={(event) => toggleTaskDone(index, event.target.checked)}
                        className="h-4 w-4 accent-violet-600"
                      />

                      <div className="space-y-2">
                        <input
                          value={task.title}
                          onChange={(event) => updateTask(index, { title: event.target.value })}
                          className="w-full rounded-xl border border-transparent bg-transparent px-2 py-1 text-base font-black outline-none transition hover:border-slate-200 hover:bg-slate-50 focus:border-violet-400 focus:bg-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={task.owner}
                            onChange={(event) => updateTask(index, { owner: event.target.value })}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-violet-400"
                            placeholder="Owner"
                          />
                          <input
                            value={task.sla}
                            onChange={(event) => updateTask(index, { sla: event.target.value })}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-violet-400"
                            placeholder="SLA"
                          />
                        </div>
                      </div>

                      <select
                        value={task.status}
                        onChange={(event) => updateTask(index, { status: event.target.value })}
                        className="rounded-full border border-violet-100 bg-violet-50 px-3 py-2 text-center text-xs font-black text-violet-700 outline-none focus:border-violet-400"
                      >
                        {["Open", "Pending", "Recurring", "Escalated", "Blocked", "Done"].map((status) => <option key={status}>{status}</option>)}
                      </select>

                      <select
                        value={task.priority}
                        onChange={(event) => updateTask(index, { priority: event.target.value })}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-700 outline-none focus:border-violet-400"
                      >
                        {["Critical", "High", "Medium", "Low"].map((priority) => <option key={priority}>{priority}</option>)}
                      </select>

                      <button
                        onClick={() => escalateTask(index)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs font-black text-rose-700 transition hover:bg-rose-100"
                      >
                        Escalate
                      </button>

                      <button
                        onClick={() => updateTask(index, { status: "Done" })}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Mark Done
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {profileMode === "comments" && (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black">Comments & Manager Notes</h3>
                    <p className="text-sm font-semibold text-slate-500">Operational comments, coaching notes, risk details and decision history.</p>
                  </div>
                  <button onClick={addComment} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Save comment</button>
                </div>

                <textarea
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Add manager comment, coaching note, risk detail, or operational instruction..."
                  className="mt-5 h-28 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-violet-400"
                />

                <div className="mt-5 space-y-4">
                  {localComments.map((comment, index) => (
                    <div key={`${comment.time}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-black">{comment.author}</div>
                        <div className="text-xs font-bold text-slate-500">{comment.time}</div>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-600">{comment.note}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {profileMode === "history" && (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                <h3 className="text-2xl font-black">Profile Timeline & Audit Trail</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Prepared for production audit logs, manager decisions, proof validation and profile changes.</p>
                <div className="mt-6 space-y-4">
                  {[
                    ["Performance score recalculated", `Score updated to ${ambassador.score}/100`, "Today · 08:00"],
                    ["Proof quality reviewed", `${ambassador.proofQuality}% proof quality validated`, "Yesterday · 18:30"],
                    ["Manager note added", "Follow-up note created by operations", "Yesterday · 17:20"],
                    ["Incentive reviewed", `${ambassador.incentives.toLocaleString()} MAD incentive marked for review`, "May 28 · 11:00"],
                  ].map(([title, body, time]) => (
                    <div key={title as string} className="flex gap-4 rounded-2xl border border-slate-200 p-4">
                      <div className="mt-1 h-3 w-3 rounded-full bg-violet-600" />
                      <div className="flex-1">
                        <div className="font-black">{title as string}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-500">{body as string}</div>
                      </div>
                      <div className="text-xs font-bold text-slate-500">{time}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className="space-y-6">
            <RadioAiPanel
              title="Profile Intelligence"
              subtitle="Tactical profile recommendations"
              icon={Bot}
              items={[
                ambassador.risk === "High" ? "Immediate coaching and proof validation required before next payout." : "Profile is stable; use as benchmark or mentor if performance stays above threshold.",
                "Create next sprint based on proof quality, lead conversion and training completion.",
                "Manager should add weekly comments until all profile controls are closed.",
              ]}
            />

            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-2xl font-black">Production Controls</h3>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["Create coaching", MessageSquare, "comments" as const],
                  ["Approve payout", Wallet, "overview" as const],
                  ["Flag risk", AlertTriangle, "tasks" as const],
                  ["Generate report", FileText, "history" as const],
                  ["Assign task", ClipboardCheck, "tasks" as const],
                  ["Edit profile", Edit3, "edit" as const],
                ].map(([label, Icon, mode]) => {
                  const I = Icon as typeof MessageSquare
                  return (
                    <button
                      key={label as string}
                      onClick={() => setProfileMode(mode as ProfileMode)}
                      className="grid min-h-[84px] place-items-center rounded-2xl border border-slate-200 text-center text-xs font-black transition hover:border-violet-300 hover:bg-violet-50"
                    >
                      <I className="text-violet-600" size={20} />
                      {label as string}
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-2xl font-black">Live Sync Readiness</h3>
              <div className="mt-5 space-y-3">
                {[
                  ["Profile DB", "Ready for ambassador_profiles"],
                  ["Tasks DB", "Ready for ambassador_tasks"],
                  ["Comments DB", "Ready for ambassador_comments"],
                  ["Audit Logs", "Ready for profile_activity_logs"],
                  ["Permissions", "Ready for role-gated actions"],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <b className="text-slate-500">{label}</b>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default function AmbassadorPerformanceCommandCenter() {
  const [query, setQuery] = useState("")
  const [period] = useState("May 2025")
  const [mode, setMode] = useState<"score" | "conversion" | "proof">("score")
  const [activeModal, setActiveModal] = useState<DecisionModal>(null)
  const [selectedProfile, setSelectedProfile] = useState<ProfileModalState>(null)

  const filtered = ambassadors.filter((a) =>
    `${a.name} ${a.city} ${a.region} ${a.group}`.toLowerCase().includes(query.toLowerCase())
  )

  const totals = useMemo(() => {
    const avgScore = Math.round(ambassadors.reduce((s, a) => s + a.score, 0) / ambassadors.length)
    const visits = ambassadors.reduce((s, a) => s + a.visits, 0)
    const leads = ambassadors.reduce((s, a) => s + a.leads, 0)
    const incentives = ambassadors.reduce((s, a) => s + a.incentives, 0)
    const risk = ambassadors.filter((a) => a.risk === "High").length
    const proof = Math.round(ambassadors.reduce((s, a) => s + a.proofQuality, 0) / ambassadors.length)
    return { avgScore, visits, leads, incentives, risk, proof }
  }, [])

  const quickActions: [string, typeof MessageSquare, DecisionModal][] = [
    ["Create Coaching Plan", MessageSquare, "coaching"],
    ["Approve Incentives", Wallet, "incentives"],
    ["Flag Risk", AlertTriangle, "risk"],
    ["Send Praise", Trophy, "praise"],
    ["Generate Report", FileText, "report"],
    ["Create KPI Tasks", ClipboardCheck, "kpi"],
  ]

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-slate-950">
      <AmbassadorMarketSidebar />

      <main className="flex-1 px-8 py-7">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-violet-700">
              <Sparkles size={14} />
              Performance Intelligence
            </div>
            <h1 className="mt-4 text-[34px] font-black tracking-tight">Ambassador Performance Command</h1>
            <p className="mt-2 max-w-4xl text-sm font-semibold text-slate-500">
              Advanced performance control for Angelcare ambassadors: scoring, conversion, proof quality, incentives, risk detection, coaching and operational improvement.
            </p>
          </div>

          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black shadow-sm">
              {period}
              <ChevronDown size={16} />
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black shadow-sm">
              <RefreshCw size={16} />
              Sync Performance
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200">
              <Download size={16} />
              Export Board
            </button>
          </div>
        </header>

        <section className="grid grid-cols-6 gap-4">
          {[
            ["Network Score", `${totals.avgScore}/100`, Gauge, "bg-violet-100 text-violet-700", "↑ 6 pts vs April"],
            ["Field Visits", totals.visits.toLocaleString(), CalendarCheck, "bg-blue-100 text-blue-700", "Monthly execution"],
            ["Qualified Leads", totals.leads.toLocaleString(), Target, "bg-emerald-100 text-emerald-700", "B2B/B2C pipeline"],
            ["Proof Quality", `${totals.proof}%`, ShieldCheck, "bg-cyan-100 text-cyan-700", "Validation strength"],
            ["Incentives", `${Math.round(totals.incentives / 1000)}K MAD`, Wallet, "bg-orange-100 text-orange-700", "Payout estimate"],
            ["Risk Ambassadors", String(totals.risk), AlertTriangle, "bg-rose-100 text-rose-700", "Needs coaching"],
          ].map(([label, value, Icon, tint, meta]) => {
            const CardIcon = Icon as typeof Gauge
            return (
              <div key={label as string} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`grid h-14 w-14 place-items-center rounded-2xl ${tint as string}`}>
                    <CardIcon size={22} />
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label as string}</div>
                    <div className="mt-1 text-3xl font-black">{value as string}</div>
                    <div className="mt-1 text-[11px] font-bold text-emerald-600">{meta as string}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </section>

        <section className="mt-6 grid grid-cols-[1.45fr_0.85fr] gap-5">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Performance Radar</h2>
                <p className="text-sm font-semibold text-slate-500">Multi-layer scoring, execution, proof reliability, training and conversion intelligence.</p>
              </div>
              <div className="flex gap-2">
                {[
                  ["score", "Score"],
                  ["conversion", "Conversion"],
                  ["proof", "Proof"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setMode(key as typeof mode)}
                    className={`rounded-xl px-4 py-2 text-xs font-black ${mode === key ? "bg-violet-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[0.72fr_1.28fr] gap-6">
              <div className="rounded-[30px] border border-violet-100 bg-[radial-gradient(circle_at_center,#f5f3ff_0,#ffffff_62%)] p-6">
                <div className="grid place-items-center">
                  <div className="relative grid h-80 w-80 place-items-center rounded-full bg-[conic-gradient(#10b981_0_46%,#7c3aed_46%_76%,#f59e0b_76%_91%,#fb7185_91%_100%)] shadow-2xl shadow-violet-100">
                    <div className="absolute inset-5 rounded-full border-[14px] border-white/40" />
                    <div className="absolute inset-12 rounded-full border border-violet-200/80" />
                    <div className="grid h-44 w-44 place-items-center rounded-full bg-white shadow-inner">
                      <div className="text-center">
                        <div className="text-5xl font-black">{totals.avgScore}</div>
                        <div className="text-sm font-black text-slate-500">Network Score</div>
                        <div className="mt-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">+6 pts</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    ["Elite", "42%", "bg-emerald-500"],
                    ["Strong", "30%", "bg-violet-500"],
                    ["Watch", "16%", "bg-amber-500"],
                    ["Recovery", "12%", "bg-rose-500"],
                  ].map(([label, value, color]) => (
                    <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-500"><span className={`h-3 w-3 rounded-full ${color}`} />{label as string}</div>
                      <div className="mt-1 text-xl font-black">{value as string}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5 rounded-[30px] border border-slate-200 bg-slate-50 p-5">
                {[
                  ["Field Execution", 88, Activity, "Visits, attendance and field discipline"],
                  ["Lead Conversion", 74, TrendingUp, "Qualified pipeline and partner progression"],
                  ["Proof Reliability", totals.proof, ShieldCheck, "GPS, photo, notes and manager validation"],
                  ["Training Completion", 86, Award, "Certification progress and learning compliance"],
                  ["Brand Discipline", 91, Star, "Scripts, tone, image and partner handling"],
                  ["Response Speed", 79, Zap, "Task reaction time and escalation speed"],
                ].map(([label, value, Icon, desc]) => {
                  const I = Icon as typeof Activity
                  return (
                    <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-center justify-between text-sm font-black">
                        <span className="flex items-center gap-2"><I className="text-violet-600" size={16} />{label as string}</span>
                        <span>{value as number}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100">
                        <div className="h-3 rounded-full bg-gradient-to-r from-violet-600 via-blue-400 to-cyan-400" style={{ width: `${value}%` }} />
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-500">{desc as string}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <RadioAiPanel
              title="AI Performance Coach"
              subtitle="Automatic coaching signals for managers."
              icon={Bot}
              items={[
                "Move Youssef and Fatima into mentor roles for recovery ambassadors.",
                "Agadir and Oujda require weekly coaching until proof quality exceeds 80%.",
                "Conversion is strongest in Rabat; reuse scripts for Marrakech and Tangier.",
                "Hold incentives for profiles below 70% proof quality until validation improves.",
              ]}
            />

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Quick Decisions</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Open production workflows directly from performance signals.</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {quickActions.map(([label, Icon, key]) => {
                  const I = Icon as typeof MessageSquare
                  return (
                    <button
                      key={label as string}
                      onClick={() => setActiveModal(key)}
                      className="grid min-h-[92px] place-items-center rounded-2xl border border-slate-200 text-center text-xs font-black transition hover:border-violet-300 hover:bg-violet-50"
                    >
                      <I className="text-violet-600" size={22} />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-[1.5fr_0.55fr_0.55fr_0.55fr_0.55fr] gap-3">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full outline-none" placeholder="Search ambassador, city, group, region..." />
            </label>
            {["All Groups", "All Risk", "All Regions", "All Scores"].map((label) => (
              <button key={label as string} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600">
                {label}
                <Filter size={15} />
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 grid grid-cols-[1.55fr_0.75fr] gap-5">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Ambassador Performance Board</h2>
                <p className="text-sm font-semibold text-slate-500">Ranked by score, conversion, proof quality, visits and training completion.</p>
              </div>
              <button className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black">Export CSV</button>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wide text-slate-500">
                  <th className="pb-4">Ambassador</th>
                  <th className="pb-4">Score</th>
                  <th className="pb-4">Visits</th>
                  <th className="pb-4">Leads</th>
                  <th className="pb-4">Proof</th>
                  <th className="pb-4">Training</th>
                  <th className="pb-4">Risk</th>
                  <th className="pb-4">Trend</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, index) => (
                  <tr key={a.name} className="border-b border-slate-100">
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-xs font-black text-violet-700">
                          #{index + 1}
                        </div>
                        <button
                          onClick={() => setSelectedProfile(a)}
                          className="text-left transition hover:text-violet-700"
                        >
                          <div className="font-black underline-offset-4 hover:underline">{a.name}</div>
                          <div className="text-xs font-semibold text-slate-500">{a.city} · {a.group}</div>
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <b>{a.score}</b>
                        <div className="h-2 w-20 rounded-full bg-slate-100">
                          <div className={`h-2 rounded-full ${scoreColor(a.score)}`} style={{ width: `${a.score}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="font-black">{a.visits}</td>
                    <td className="font-black">{a.leads}</td>
                    <td className="font-black">{a.proofQuality}%</td>
                    <td className="font-black">{a.training}%</td>
                    <td><span className={`rounded-full px-3 py-1 text-xs font-black ${riskBadge(a.risk)}`}>{a.risk}</span></td>
                    <td>
                      {a.trend === "up" && <TrendingUp className="text-emerald-600" size={18} />}
                      {a.trend === "down" && <TrendingDown className="text-rose-600" size={18} />}
                      {a.trend === "stable" && <Activity className="text-violet-600" size={18} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-5">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Leaderboard</h2>
              <div className="mt-5 space-y-3">
                {ambassadors.slice(0, 5).map((a, i) => (
                  <div key={a.name} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                    <div className={`grid h-10 w-10 place-items-center rounded-2xl ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"}`}>
                      {i === 0 ? <Trophy size={18} /> : <Medal size={18} />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-black">{a.name}</div>
                      <div className="text-xs font-semibold text-slate-500">{a.city}</div>
                    </div>
                    <div className="text-lg font-black">{a.score}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Performance Distribution</h2>
              <div className="mt-6 grid place-items-center">
                <div className="grid h-44 w-44 place-items-center rounded-full bg-[conic-gradient(#10b981_0_42%,#7c3aed_42%_72%,#f59e0b_72%_88%,#fb7185_88%_100%)]">
                  <div className="grid h-28 w-28 place-items-center rounded-full bg-white">
                    <div className="text-center">
                      <div className="text-3xl font-black">{ambassadors.length}</div>
                      <div className="text-xs font-bold text-slate-500">profiles</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-2 text-xs font-black text-slate-600">
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Elite 90+</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-violet-500" /> Strong 75–89</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" /> Watch 60–74</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose-500" /> Recovery below 60</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-4 gap-5">
          {[
            ["Coaching Queue", "2 ambassadors need immediate coaching", MessageSquare, "Create coaching sprint", "coaching"],
            ["Incentive Readiness", "5 ambassadors eligible for payout", Wallet, "Review payouts", "incentives"],
            ["Proof Quality Risk", "2 profiles below validation threshold", ShieldCheck, "Open proof review", "risk"],
            ["Manager Report", "Performance summary ready", FileText, "Generate report", "report"],
          ].map(([title, body, Icon, action, key]) => {
            const I = Icon as typeof MessageSquare
            return (
              <div key={title as string} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><I size={21} /></div>
                <h3 className="mt-4 text-lg font-black">{title as string}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-500">{body as string}</p>
                <button onClick={() => setActiveModal(key as DecisionModal)} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-violet-600">
                  {action as string}
                  <ArrowRight size={15} />
                </button>
              </div>
            )
          })}
        </section>

        <DecisionModalView active={activeModal} onClose={() => setActiveModal(null)} />
        {selectedProfile && <AmbassadorProfile360Modal ambassador={selectedProfile} onClose={() => setSelectedProfile(null)} />}
      </main>
    </div>
  )
}
