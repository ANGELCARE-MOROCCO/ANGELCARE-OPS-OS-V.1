
"use client"

import { useMemo, useState } from "react"
import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Gift,
  History,
  Landmark,
  LineChart,
  LockKeyhole,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Receipt,
  RefreshCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trophy,
  Trash2,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react"

type IncentiveStatus = "Draft" | "Pending" | "Approved" | "Scheduled" | "Paid" | "Held" | "Rejected"
type RiskLevel = "Low" | "Medium" | "High" | "Critical"

type IncentiveRecord = {
  id: string
  ambassador: string
  phone: string
  city: string
  region: string
  group: string
  type: string
  amount: number
  status: IncentiveStatus
  proof: number
  score: number
  missions: number
  owner: string
  approver: string
  payoutDate: string
  risk: RiskLevel
  paymentMethod: string
  budgetLine: string
  audit: string
  exception: string
}

type ModalKey =
  | "create"
  | "review"
  | "approve"
  | "hold"
  | "tier"
  | "export"
  | "notice"
  | "record"
  | "finance"
  | "proof"
  | "rules"
  | "reconcile"
  | "budget"
  | "audit"
  | "simulation"
  | null

const initialRecords: IncentiveRecord[] = [
  { id: "AC-MOS-AMB-INC-001", ambassador: "Youssef El Fassi", phone: "+212 6 12 34 56 78", city: "Casablanca", region: "Casablanca-Settat", group: "Elite Performers", type: "Performance Bonus", amount: 4200, status: "Approved", proof: 97, score: 98, missions: 32, owner: "Finance Control", approver: "Direction Rabat", payoutDate: "May 25, 2026", risk: "Low", paymentMethod: "Bank Transfer", budgetLine: "AMB-PERF-MAY", audit: "Clean", exception: "None" },
  { id: "AC-MOS-AMB-INC-002", ambassador: "Fatima Zahra Ait", phone: "+212 6 98 76 54 32", city: "Rabat", region: "Rabat-Salé-Kénitra", group: "Top Performers", type: "Territory Expansion", amount: 3100, status: "Pending", proof: 96, score: 96, missions: 28, owner: "Regional Manager", approver: "Finance Control", payoutDate: "May 28, 2026", risk: "Low", paymentMethod: "Wallet", budgetLine: "AMB-EXP-RABAT", audit: "Pending approval", exception: "None" },
  { id: "AC-MOS-AMB-INC-003", ambassador: "Omar Kabbaj", phone: "+212 6 55 44 33 22", city: "Marrakech", region: "Marrakech-Safi", group: "Top Performers", type: "Mission Completion", amount: 2600, status: "Paid", proof: 91, score: 92, missions: 26, owner: "Finance Control", approver: "Direction Rabat", payoutDate: "May 20, 2026", risk: "Low", paymentMethod: "Bank Transfer", budgetLine: "AMB-MIS-MAY", audit: "Reconciled", exception: "None" },
  { id: "AC-MOS-AMB-INC-004", ambassador: "Imane Lahlou", phone: "+212 6 77 88 99 00", city: "Fes", region: "Fès-Meknès", group: "Core Team", type: "Training Badge Reward", amount: 1800, status: "Scheduled", proof: 88, score: 86, missions: 24, owner: "Training Academy", approver: "Finance Control", payoutDate: "May 30, 2026", risk: "Low", paymentMethod: "Wallet", budgetLine: "AMB-TRN-CERT", audit: "Scheduled", exception: "None" },
  { id: "AC-MOS-AMB-INC-005", ambassador: "Ahmed Benali", phone: "+212 6 66 77 88 99", city: "Tangier", region: "Tanger-Tétouan-Al Hoceima", group: "Core Team", type: "Referral Reward", amount: 1500, status: "Pending", proof: 84, score: 82, missions: 21, owner: "Operations", approver: "Regional Manager", payoutDate: "Jun 02, 2026", risk: "Medium", paymentMethod: "Bank Transfer", budgetLine: "AMB-REF-MAY", audit: "Needs approver note", exception: "Referral document incomplete" },
  { id: "AC-MOS-AMB-INC-006", ambassador: "Salma El Amrani", phone: "+212 6 11 22 33 44", city: "Agadir", region: "Souss-Massa", group: "Recovery", type: "Recovery Bonus", amount: 900, status: "Held", proof: 68, score: 64, missions: 12, owner: "Quality Control", approver: "Finance Control", payoutDate: "On hold", risk: "High", paymentMethod: "Wallet", budgetLine: "AMB-REC-AGADIR", audit: "Blocked", exception: "Proof below payout threshold" },
  { id: "AC-MOS-AMB-INC-007", ambassador: "Mehdi Tazi", phone: "+212 6 22 33 44 55", city: "Oujda", region: "Oriental", group: "Recovery", type: "Mission Completion", amount: 850, status: "Held", proof: 61, score: 58, missions: 9, owner: "Quality Control", approver: "Regional Manager", payoutDate: "On hold", risk: "Critical", paymentMethod: "Cash Desk", budgetLine: "AMB-MIS-ORIENTAL", audit: "Critical exception", exception: "Missing evidence and low score" },
  { id: "AC-MOS-AMB-INC-008", ambassador: "Hicham Mourad", phone: "+212 6 33 44 55 66", city: "Errachidia", region: "Drâa-Tafilalet", group: "Core Team", type: "Coverage Bonus", amount: 1200, status: "Draft", proof: 79, score: 81, missions: 18, owner: "Operations", approver: "Direction Rabat", payoutDate: "Draft", risk: "Medium", paymentMethod: "Bank Transfer", budgetLine: "AMB-COV-DRT", audit: "Draft", exception: "Awaiting manager validation" },
]

function fmtMad(amount: number) {
  return `${amount.toLocaleString()} MAD`
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function Field({ label, placeholder, type = "text", value, onChange }: { label: string; placeholder: string; type?: string; value?: string; onChange?: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      />
    </label>
  )
}

function SelectField({ label, options, value, onChange }: { label: string; options: string[]; value?: string; onChange?: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      >
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function ToggleRow({ children, defaultChecked = false }: { children: React.ReactNode; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800 transition hover:border-orange-300 hover:bg-orange-50">
      <input type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 accent-orange-500" />
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
          <div className="font-mono text-[10px] font-black uppercase tracking-[.24em] text-emerald-300">AI FINANCE SIGNAL ONLINE</div>
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

function StatusBadge({ status }: { status: IncentiveStatus }) {
  const cls =
    status === "Paid" ? "bg-emerald-100 text-emerald-800 ring-emerald-200" :
    status === "Approved" ? "bg-blue-100 text-blue-800 ring-blue-200" :
    status === "Scheduled" ? "bg-cyan-100 text-cyan-800 ring-cyan-200" :
    status === "Pending" ? "bg-violet-100 text-violet-800 ring-violet-200" :
    status === "Held" ? "bg-rose-100 text-rose-800 ring-rose-200" :
    status === "Rejected" ? "bg-slate-200 text-slate-800 ring-slate-300" :
    "bg-amber-100 text-amber-800 ring-amber-200"
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${cls}`}>{status}</span>
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const cls = risk === "Low" ? "bg-emerald-100 text-emerald-800 ring-emerald-200" : risk === "Medium" ? "bg-amber-100 text-amber-800 ring-amber-200" : risk === "High" ? "bg-rose-100 text-rose-800 ring-rose-200" : "bg-red-900 text-white ring-red-300"
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${cls}`}>{risk}</span>
}

function MetricCard({ label, value, icon: Icon, color, onClick, sub }: { label: string; value: string; icon: typeof Wallet; color: string; onClick: () => void; sub: string }) {
  return (
    <button onClick={onClick} className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl ${color}`}><Icon size={22} /></div>
        <ChevronRight className="text-slate-300" size={18} />
      </div>
      <div className="mt-4 text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-slate-500">{label}</div>
      <div className="mt-2 text-xs font-bold text-slate-500">{sub}</div>
    </button>
  )
}

function ActionModal({
  active,
  selected,
  onClose,
  onSave,
  onUpdateRecord,
  onDeleteRecord,
}: {
  active: ModalKey
  selected: IncentiveRecord | null
  onClose: () => void
  onSave: (message: string) => void
  onUpdateRecord: (id: string, patch: Partial<IncentiveRecord>) => void
  onDeleteRecord: (id: string) => void
}) {
  const [tab, setTab] = useState("Command")
  const [amount, setAmount] = useState(selected ? String(selected.amount) : "")
  const [owner, setOwner] = useState(selected?.owner || "Finance Control")
  const [decision, setDecision] = useState("Approve")
  const [note, setNote] = useState("")
  const [editStatus, setEditStatus] = useState<IncentiveStatus>(selected?.status || "Pending")
  const [editRisk, setEditRisk] = useState<RiskLevel>(selected?.risk || "Low")
  const [editProof, setEditProof] = useState(selected ? String(selected.proof) : "80")
  const [editScore, setEditScore] = useState(selected ? String(selected.score) : "80")
  const [editPayoutDate, setEditPayoutDate] = useState(selected?.payoutDate || "Next payout cycle")
  const [editPaymentMethod, setEditPaymentMethod] = useState(selected?.paymentMethod || "Bank Transfer")
  const [editBudgetLine, setEditBudgetLine] = useState(selected?.budgetLine || "AMB-PERF-MAY")
  const [editException, setEditException] = useState(selected?.exception || "None")
  if (!active) return null

  const config: Record<string, { title: string; icon: typeof Wallet; action: string; subtitle: string; ai: string[]; checklist: string[]; tabs: string[] }> = {
    create: {
      title: "Create Incentive Package",
      icon: Plus,
      action: "Create Package",
      subtitle: "Create a finance-safe incentive package with eligibility rules, proof gate, budget line, approval workflow and payout communication.",
      ai: ["Never create payout without budget line and proof gate.", "Use reward tiers to prevent subjective payouts.", "Every package should create an audit ID and approver owner."],
      checklist: ["Reference generated", "Budget line selected", "Eligibility formula", "Proof gate", "Approver chain", "Notice template"],
      tabs: ["Command", "Eligibility", "Budget", "Proof", "Approval", "Communication", "Audit"],
    },
    review: {
      title: "Review Payout Batch",
      icon: Wallet,
      action: "Save Review",
      subtitle: "Review eligibility, proof quality, payout amount, owner approval and finance controls before payment.",
      ai: ["Only approve payouts with proof above threshold.", "Held payouts must have a reason, owner and next review date.", "Finance exports should include reference IDs and audit status."],
      checklist: ["Eligibility confirmed", "Proof validated", "Score threshold reached", "Amount verified", "Owner approved", "Audit note saved"],
      tabs: ["Command", "Eligibility", "Proof", "Finance", "Exceptions", "Approval", "Audit"],
    },
    approve: {
      title: "Approve Incentive",
      icon: CheckCircle2,
      action: "Approve Incentive",
      subtitle: "Approve a payout with finance-grade control and sync status to reports, profile and payment queue.",
      ai: ["Approved incentives should create a finance queue record.", "Notify ambassador only after final finance approval.", "Avoid approving low-proof profiles."],
      checklist: ["Finance owner assigned", "Proof package clean", "Payout date confirmed", "Approval note saved", "Notification prepared"],
      tabs: ["Command", "Proof", "Approval", "Payment", "Notice", "Audit"],
    },
    hold: {
      title: "Hold Payment",
      icon: AlertTriangle,
      action: "Hold Payment",
      subtitle: "Place an incentive on hold due to proof, compliance, score, duplicate, finance or manager exception.",
      ai: ["Hold reason must be explicit.", "Create unblock task immediately.", "Do not release held payouts without proof revalidation."],
      checklist: ["Hold reason selected", "Manager owner assigned", "Unblock task created", "Ambassador notified", "Review deadline set"],
      tabs: ["Command", "Exception", "Proof", "Unblock Plan", "Notice", "Audit"],
    },
    tier: {
      title: "Reward Tier Builder",
      icon: Gift,
      action: "Save Tier",
      subtitle: "Define performance, territory, proof and mission-based reward tiers with budget caps and eligibility rules.",
      ai: ["Reward quality, not only volume.", "Attach budget caps by city and mission type.", "Make tier rules clear enough for finance and managers."],
      checklist: ["Tier name", "Eligibility rule", "Proof gate", "Budget cap", "Expiry date", "Approval owner"],
      tabs: ["Command", "Tier Rules", "Eligibility", "Caps", "Territories", "Approval", "Audit"],
    },
    export: {
      title: "Finance Export Center",
      icon: Download,
      action: "Generate Export",
      subtitle: "Generate a finance-ready payout file with reference IDs, approved amounts, status, owners and audit notes.",
      ai: ["Export current filter only.", "Include held status and reasons.", "Archive every finance export."],
      checklist: ["Scope selected", "Fields validated", "Sensitive notes excluded", "Finance owner confirmed", "Export archived"],
      tabs: ["Command", "Scope", "Fields", "Privacy", "Reconciliation", "Archive"],
    },
    notice: {
      title: "Reward Notice Center",
      icon: Send,
      action: "Send Notice",
      subtitle: "Send approved, pending or held incentive messages to ambassadors with a clean operational explanation.",
      ai: ["Use positive tone for approved payouts.", "Held notices should include next steps.", "Avoid sharing internal risk scoring."],
      checklist: ["Audience selected", "Template chosen", "Message reviewed", "Channel selected", "Send log ready"],
      tabs: ["Command", "Audience", "Template", "WhatsApp", "Email", "Log"],
    },
    record: {
      title: "Incentive 360 Record",
      icon: Eye,
      action: "Save Record",
      subtitle: "Open full payout profile with ambassador data, proof quality, tasks, comments, finance notes and status controls.",
      ai: ["Use record view to resolve all exceptions.", "Every edit should sync to table and reports.", "Risk notes must be owned and dated."],
      checklist: ["Profile reviewed", "Proof checked", "Status confirmed", "Task created", "Comment saved"],
      tabs: ["Command", "Profile", "Proof", "Tasks", "Comments", "Finance", "History"],
    },
    finance: {
      title: "Finance Control Board",
      icon: Landmark,
      action: "Save Controls",
      subtitle: "Manage payout batches, budget limits, finance approvals, cash planning and reconciliation.",
      ai: ["Separate approved, held and paid amounts.", "High-risk payouts need quality review.", "Monthly budget cap protects margin."],
      checklist: ["Budget checked", "Batch selected", "Approver assigned", "Payment date confirmed", "Reconciliation ready"],
      tabs: ["Command", "Budget", "Batch", "Cash Plan", "Approvals", "Reconciliation", "Audit"],
    },
    proof: {
      title: "Proof Quality Review",
      icon: ShieldCheck,
      action: "Validate Proof",
      subtitle: "Review proof evidence, mission completion, compliance notes and payout eligibility.",
      ai: ["Proof below 70% should hold payout.", "Quality control must leave a reason.", "Validated proof unlocks finance approval."],
      checklist: ["Evidence reviewed", "GPS/time checked", "Manager note read", "Proof score updated", "Eligibility confirmed"],
      tabs: ["Command", "Evidence", "GPS", "Manager Notes", "Validation", "Audit"],
    },
    rules: {
      title: "Incentive Rules Engine",
      icon: Sparkles,
      action: "Save Rules",
      subtitle: "Configure eligibility rules, payout caps, proof locks, tier logic and approval workflows.",
      ai: ["Rules must be understandable by finance and managers.", "Never pay without proof gate.", "Territory bonuses should reflect growth priority."],
      checklist: ["Rule type", "Eligibility formula", "Proof lock", "Approval flow", "Budget cap", "Audit mode"],
      tabs: ["Command", "Formula", "Proof Locks", "Caps", "Approvals", "Simulation", "Audit"],
    },
    reconcile: {
      title: "Payment Reconciliation",
      icon: Receipt,
      action: "Reconcile",
      subtitle: "Match paid incentives against finance confirmation, payment references and ambassador receipt status.",
      ai: ["Paid items must have payment reference.", "Mismatch should create exception task.", "Reconciliation closes the audit loop."],
      checklist: ["Payment ref", "Bank/wallet confirmation", "Ambassador receipt", "Mismatch check", "Audit closed"],
      tabs: ["Command", "Payment Match", "Receipts", "Exceptions", "Audit"],
    },
    budget: {
      title: "Budget Safety Center",
      icon: Banknote,
      action: "Save Budget",
      subtitle: "Control budget caps, city allocation, reward burn, forecast, ROI and approval exposure.",
      ai: ["Track burn rate before approvals.", "Put cap by territory and reward type.", "High ROI missions deserve priority."],
      checklist: ["Budget cap", "Burn rate", "Forecast", "Owner", "Approval exposure"],
      tabs: ["Command", "Caps", "Burn Rate", "Forecast", "ROI", "Audit"],
    },
    audit: {
      title: "Audit & Compliance Log",
      icon: History,
      action: "Archive Audit",
      subtitle: "Review every action, change, approver, decision note, export and payout status movement.",
      ai: ["Audit should explain every payout decision.", "Missing owner means not production ready.", "Exports and payment changes must be archived."],
      checklist: ["Decision note", "Approver", "Timestamp", "Export archive", "Exception closure"],
      tabs: ["Command", "Timeline", "Approvals", "Exports", "Exceptions", "Archive"],
    },
    simulation: {
      title: "Reward Simulation",
      icon: LineChart,
      action: "Run Simulation",
      subtitle: "Simulate payout exposure by score, proof threshold, mission volume, region and reward tier before approval.",
      ai: ["Simulation prevents budget surprises.", "Use strict proof thresholds.", "Compare payout cost to mission ROI."],
      checklist: ["Scenario selected", "Budget impact", "Risk impact", "ROI estimate", "Approval recommendation"],
      tabs: ["Command", "Scenario", "Thresholds", "Budget Impact", "ROI", "Recommendation"],
    },
  }

  const c = config[active] || config.review
  const Icon = c.icon

  const tabControlMap: Record<string, string[]> = {
    Command: ["Owner assigned", "Reference checked", "Decision selected", "SLA defined"],
    Eligibility: ["Score threshold", "Mission count", "Training complete", "No active hold"],
    Proof: ["Evidence reviewed", "Proof score validated", "GPS/time checked", "QC note saved"],
    Finance: ["Budget line valid", "Amount checked", "Payment method verified", "Finance owner assigned"],
    Exceptions: ["Exception reason", "Unblock owner", "Deadline", "Escalation path"],
    Approval: ["Approver chain", "Dual control", "Decision note", "Approval timestamp"],
    Audit: ["Audit ID", "Change log", "Export archived", "Compliance note"],
    Budget: ["Budget cap", "Burn rate", "Forecast", "Margin protection"],
    Payment: ["Payout date", "Payment method", "Finance queue", "Receipt requirement"],
    Notice: ["Message template", "Audience check", "Channel", "Send log"],
    Profile: ["Ambassador verified", "Phone checked", "City matched", "Group matched"],
    Tasks: ["Task owner", "Priority", "SLA", "Closure criteria"],
    Comments: ["Manager comment", "Finance note", "QC note", "Next review"],
    History: ["Status movements", "Approvals", "Exports", "Notices"],
    Formula: ["Rule name", "Formula", "Threshold", "Exclusion"],
    Simulation: ["Scenario", "Threshold", "Budget impact", "Risk exposure"],
    Caps: ["Monthly cap", "Territory cap", "Reward cap", "Exception cap"],
    Reconciliation: ["Payment reference", "Receipt match", "Mismatch queue", "Close audit"],
    Scope: ["Current filters", "Selected status", "Selected region", "Selected fields"],
    Fields: ["Reference ID", "Amount", "Status", "Risk"],
    Privacy: ["No sensitive notes", "Permission checked", "Archive policy", "Export owner"],
    Archive: ["Export ID", "Timestamp", "Owner", "Storage path"],
  }

  const currentControls = tabControlMap[tab] || c.checklist
  const projectedAmount = Number(amount || selected?.amount || 0)

  const operationBlueprint: Record<string, {
    title: string
    description: string
    primaryBlocks: string[]
    dataFields: string[]
    controls: string[]
    outputs: string[]
    risks: string[]
  }> = {
    create: {
      title: "New Incentive Operating File",
      description: "Build a complete payout package from zero: objective, eligible ambassadors, reward logic, proof threshold, budget line, approval chain, payout schedule and communication path.",
      primaryBlocks: ["Reward objective", "Eligible population", "Reward formula", "Budget line", "Approval chain", "Payout calendar"],
      dataFields: ["Reward name", "Reward type", "Eligibility threshold", "Max payout per ambassador", "Monthly cap", "Expiry date"],
      controls: ["Duplicate package check", "Budget cap control", "Proof lock required", "Approver required", "Audit ID generated"],
      outputs: ["Draft incentive package", "Finance task", "Eligibility queue", "Approval request"],
      risks: ["No budget line", "Unclear formula", "No proof lock", "Overpayment exposure"],
    },
    review: {
      title: "Batch Review War Room",
      description: "Review the full payout batch before approval: threshold failures, missing proof, duplicate payments, budget exposure, high-risk profiles and final finance readiness.",
      primaryBlocks: ["Batch scope", "Eligibility review", "Exception queue", "Budget exposure", "Approver readiness", "Export readiness"],
      dataFields: ["Batch name", "Period", "Status scope", "Region scope", "Owner", "Review SLA"],
      controls: ["Threshold check", "Duplicate payment scan", "Exception reason required", "Budget variance", "Final reviewer signoff"],
      outputs: ["Reviewed payout batch", "Exception task list", "Ready-for-approval queue", "Audit summary"],
      risks: ["False eligibility", "Duplicate payout", "Missing review owner", "Unclosed exceptions"],
    },
    approve: {
      title: "Approval & Dual-Control Desk",
      description: "Approve only finance-safe payouts with proof evidence, budget authority, clear approver chain and payment queue preparation.",
      primaryBlocks: ["Approval decision", "Proof validation", "Budget authority", "Payment queue", "Ambassador notice", "Audit lock"],
      dataFields: ["Approver", "Approval level", "Payment date", "Payment method", "Approval note", "Finance reference"],
      controls: ["Dual approval if high value", "Proof score lock", "Budget line lock", "Approver permission", "Payment queue created"],
      outputs: ["Approved status", "Payment queue entry", "Notice ready", "Audit event"],
      risks: ["Approval without evidence", "Wrong amount", "Unauthorized approver", "Payment before notice"],
    },
    hold: {
      title: "Hold & Recovery Control",
      description: "Block unsafe payouts and create a recovery path with reason, unblock task, owner, deadline, ambassador communication and revalidation gate.",
      primaryBlocks: ["Hold reason", "Evidence problem", "Unblock plan", "Owner SLA", "Communication", "Revalidation"],
      dataFields: ["Hold reason", "Unblock owner", "Deadline", "Required evidence", "Escalation level", "Message note"],
      controls: ["Reason mandatory", "Unblock task created", "Manager assigned", "Ambassador informed", "Revalidation required"],
      outputs: ["Held status", "Recovery task", "Manager alert", "Next review date"],
      risks: ["Silent hold", "No unblock owner", "No next review", "Ambassador confusion"],
    },
    tier: {
      title: "Reward Tier Architecture",
      description: "Design scalable reward tiers that protect margin and reward mission quality, proof reliability, territory expansion and ambassador growth.",
      primaryBlocks: ["Tier ladder", "Eligibility", "Proof multipliers", "Territory weights", "Budget caps", "Expiry rules"],
      dataFields: ["Tier name", "Base amount", "Multiplier", "Territory weight", "Cap per city", "Cap per person"],
      controls: ["Cap control", "Formula preview", "Quality multiplier", "Exclusion rules", "Approval workflow"],
      outputs: ["Tier rule", "Eligibility matrix", "Budget forecast", "Policy record"],
      risks: ["Rewarding volume only", "Uncapped spend", "Unclear tier", "Manager discretion abuse"],
    },
    export: {
      title: "Finance Export Control Tower",
      description: "Generate finance-grade payout exports with exact current filters, privacy controls, reference IDs, audit fields and reconciliation requirements.",
      primaryBlocks: ["Export scope", "Field selection", "Privacy control", "Finance format", "Archive", "Reconciliation"],
      dataFields: ["Export name", "Format", "Period", "Included statuses", "Approver", "Archive owner"],
      controls: ["Current filters only", "Sensitive notes excluded", "Reference IDs mandatory", "Archive copy", "Reconciliation flag"],
      outputs: ["CSV export", "Finance archive", "Export audit ID", "Reconciliation queue"],
      risks: ["Wrong scope", "Sensitive data leak", "Missing reference IDs", "No archive"],
    },
    notice: {
      title: "Reward Communication Studio",
      description: "Send clear ambassador messages for approved, scheduled, paid, held or rejected incentives without exposing internal risk logic.",
      primaryBlocks: ["Audience", "Message type", "Channel", "Personalization", "Approval", "Send log"],
      dataFields: ["Audience segment", "Template", "Language", "Channel", "Send timing", "Owner"],
      controls: ["Tone check", "No internal risk score", "Opt-out respected", "Owner approval", "Send log saved"],
      outputs: ["WhatsApp message", "Email copy", "Send log", "Profile note"],
      risks: ["Wrong recipient", "Internal details leaked", "No next step", "No send record"],
    },
    record: {
      title: "Ambassador Incentive 360 Detail File",
      description: "Open the exact incentive case for one ambassador with editable payout amount, proof, score, risk, status, budget line, payment method, exception reason, comments, tasks and audit trail.",
      primaryBlocks: ["Live Profile", "Editable Finance", "Proof & Risk", "Tasks", "Comments", "History"],
      dataFields: ["Payout amount", "Status", "Risk", "Proof score", "Performance score", "Payment method"],
      controls: ["Save live changes", "Delete with confirmation", "Create follow-up task", "Add comment", "Archive audit trail"],
      outputs: ["Updated ledger row", "Synced profile", "Audit event", "Manager task"],
      risks: ["Deleting without reason", "Editing without audit note", "Wrong payment method", "Unresolved exception"],
    },
    finance: {
      title: "Finance Command Board",
      description: "Control budget, approval exposure, payout timing, cash planning, batches, reconciliation and unresolved finance exceptions.",
      primaryBlocks: ["Budget exposure", "Cash plan", "Approval queue", "Payment batch", "Reconciliation", "Exceptions"],
      dataFields: ["Budget owner", "Cash date", "Batch ID", "Payment method", "Variance", "Reconciliation owner"],
      controls: ["Budget cap", "Cash availability", "Batch approval", "Payment method check", "Variance control"],
      outputs: ["Finance plan", "Batch queue", "Risk list", "Reconciliation task"],
      risks: ["Budget overrun", "Cash timing mismatch", "Unapproved batch", "Payment mismatch"],
    },
    proof: {
      title: "Proof Quality Validation Lab",
      description: "Validate mission evidence, timestamps, GPS, manager notes, proof consistency and eligibility locks before any payout moves forward.",
      primaryBlocks: ["Evidence", "GPS/time", "Manager notes", "Quality score", "Eligibility lock", "Validation"],
      dataFields: ["Proof owner", "Evidence type", "GPS status", "Timestamp", "QC score", "Validation note"],
      controls: ["Evidence required", "GPS/time match", "Proof threshold", "QC reviewer", "Validation locked"],
      outputs: ["Proof status", "Eligibility result", "QC note", "Hold/approve recommendation"],
      risks: ["Weak proof", "Wrong mission", "Manipulated timestamp", "No QC reviewer"],
    },
    rules: {
      title: "Incentive Rules Engine",
      description: "Configure payout formulas, proof locks, eligibility thresholds, territory weights, exclusions, budget caps and approval workflows.",
      primaryBlocks: ["Formula", "Thresholds", "Proof locks", "Exclusions", "Caps", "Simulation"],
      dataFields: ["Rule ID", "Formula", "Threshold", "Exclusion", "Cap", "Effective date"],
      controls: ["Formula test", "Proof lock", "Cap validation", "Conflict check", "Approval flow"],
      outputs: ["Active rule", "Simulation result", "Policy log", "Audit event"],
      risks: ["Conflicting rules", "No cap", "No proof lock", "Unapproved formula"],
    },
    reconcile: {
      title: "Payment Reconciliation Desk",
      description: "Match payments against bank/wallet confirmation, ambassador receipt, payment reference, exceptions and finance closeout.",
      primaryBlocks: ["Payment reference", "Bank/wallet match", "Receipt", "Mismatch queue", "Closeout", "Archive"],
      dataFields: ["Payment reference", "Transfer date", "Receipt status", "Mismatch reason", "Closeout owner", "Archive ID"],
      controls: ["Reference required", "Receipt verified", "Mismatch task", "Finance closeout", "Archive proof"],
      outputs: ["Reconciled payment", "Receipt log", "Mismatch task", "Closed audit"],
      risks: ["Paid but no receipt", "Wrong reference", "Unmatched transfer", "No closeout"],
    },
    budget: {
      title: "Budget Safety & Forecast",
      description: "Protect Angelcare margin by forecasting payout exposure, burn rate, city caps, reward caps and approval exposure before spend happens.",
      primaryBlocks: ["Budget cap", "Burn rate", "City allocation", "Forecast", "ROI", "Approval exposure"],
      dataFields: ["Monthly cap", "City cap", "Reward cap", "Forecast period", "ROI target", "Budget owner"],
      controls: ["Burn rate alert", "Cap lock", "Forecast variance", "ROI threshold", "Approval exposure"],
      outputs: ["Budget decision", "Forecast panel", "Cap alerts", "Approval recommendation"],
      risks: ["Overspend", "Poor ROI", "No city cap", "Approval exposure too high"],
    },
    audit: {
      title: "Audit & Compliance Center",
      description: "Track every payout decision, owner, approval, export, status movement, notice, exception and reconciliation event.",
      primaryBlocks: ["Timeline", "Approvals", "Exports", "Changes", "Exceptions", "Archive"],
      dataFields: ["Audit ID", "Actor", "Action", "Timestamp", "Reason", "Archive path"],
      controls: ["Timestamp locked", "Actor recorded", "Reason required", "Export archived", "Exception closed"],
      outputs: ["Audit timeline", "Compliance report", "Archive file", "Exception history"],
      risks: ["Missing reason", "Unknown actor", "No archive", "Unclosed exception"],
    },
    simulation: {
      title: "Reward Simulation Lab",
      description: "Model payout exposure and ROI under different proof thresholds, tiers, regions, mission volumes and caps before approving rules.",
      primaryBlocks: ["Scenario", "Thresholds", "Territory", "Mission volume", "Budget impact", "Recommendation"],
      dataFields: ["Scenario name", "Proof threshold", "Score threshold", "Mission volume", "City scope", "Budget cap"],
      controls: ["Scenario compare", "Risk impact", "Budget variance", "ROI estimate", "Recommendation"],
      outputs: ["Simulation result", "Budget forecast", "Risk forecast", "Approval recommendation"],
      risks: ["Unmodeled exposure", "Bad threshold", "City overpayment", "Low ROI"],
    },
  }

  const blueprint = operationBlueprint[active || "review"] || operationBlueprint.review

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-6 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-[1560px] overflow-y-auto rounded-[38px] border border-white/70 bg-white shadow-2xl">
        <header className="relative overflow-hidden rounded-t-[38px] bg-gradient-to-r from-slate-950 via-orange-700 to-violet-800 p-7 text-white">
          <Icon className="absolute -right-10 -top-10 opacity-15" size={230} />
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15"><Icon size={30} /></div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-orange-100">Angelcare Incentives Enterprise Control</div>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-white">{c.title}</h2>
                <p className="mt-2 max-w-5xl text-sm font-semibold text-white/85">{c.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/25 bg-slate-950/30 p-2 shadow-2xl backdrop-blur-md">
              <button
                onClick={() => {
                  if (selected?.id) {
                    const nextStatus: IncentiveStatus =
                      active === "approve" ? "Approved" :
                      active === "hold" ? "Held" :
                      active === "reconcile" ? "Paid" :
                      selected.status
                    onUpdateRecord(selected.id, { status: nextStatus, owner, amount: projectedAmount || selected.amount, audit: `${c.title} · ${tab}` })
                  }
                  onSave(`${c.title} saved and synced live. Active gate: ${tab}.`)
                  onClose()
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg"
              >
                <CheckCircle2 size={17} /> {c.action}
              </button>
              <button onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-black text-white shadow-lg">
                <X size={17} /> Close
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-[1.35fr_0.75fr] gap-6 p-7">
          <main className="space-y-6">
            <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
              {c.tabs.map((x) => (
                <button key={x} onClick={() => setTab(x)} className={cx("rounded-2xl px-4 py-3 text-xs font-black transition", tab === x ? "bg-orange-500 text-white shadow-lg shadow-orange-100" : "text-slate-700 hover:bg-orange-50 hover:text-orange-700")}>{x}</button>
              ))}
            </div>

            <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">{active} operation workbench</div>
                  <h3 className="mt-2 text-3xl font-black text-slate-950">{blueprint.title}</h3>
                  <p className="mt-2 max-w-5xl text-sm font-semibold leading-relaxed text-slate-600">{blueprint.description}</p>
                </div>
                <div className="rounded-3xl bg-slate-950 p-5 text-white">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">Current gate</div>
                  <div className="mt-1 text-2xl font-black">{tab}</div>
                  <div className="mt-2 text-xs font-bold text-white/60">All fields below are dedicated to this operation.</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-6 gap-3">
                {blueprint.primaryBlocks.map((block, index) => (
                  <button key={block} onClick={() => setTab(block)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-orange-300 hover:bg-orange-50">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange-100 text-sm font-black text-orange-700">{index + 1}</div>
                    <div className="mt-3 text-sm font-black text-slate-950">{block}</div>
                  </button>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-[1fr_1fr_0.9fr] gap-5">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <h4 className="text-lg font-black text-slate-950">Dedicated Data Fields</h4>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {blueprint.dataFields.map((field) => (
                      <Field key={field} label={field} placeholder={`Enter ${field.toLowerCase()}`} />
                    ))}
                  </div>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <h4 className="text-lg font-black text-slate-950">Operation Controls</h4>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {blueprint.controls.map((control) => <ToggleRow key={control}>{control}</ToggleRow>)}
                  </div>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white">
                  <h4 className="text-lg font-black text-white">Expected Outputs</h4>
                  <div className="mt-4 space-y-3">
                    {blueprint.outputs.map((output) => (
                      <div key={output} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-sm font-bold text-white">{output}</div>
                    ))}
                  </div>
                  <h4 className="mt-5 text-lg font-black text-white">Risk Guards</h4>
                  <div className="mt-3 space-y-2">
                    {blueprint.risks.map((risk) => (
                      <div key={risk} className="flex items-center gap-2 text-xs font-bold text-orange-100"><AlertTriangle size={14} />{risk}</div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {active === "record" && selected && (
              <section className="rounded-[34px] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-violet-50 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-orange-700">LIVE INCENTIVE DETAIL · {selected.id}</div>
                    <h3 className="mt-2 text-3xl font-black text-slate-950">{selected.ambassador}</h3>
                    <p className="mt-2 text-sm font-bold text-slate-600">{selected.phone} · {selected.city} · {selected.region} · {selected.group}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        onUpdateRecord(selected.id, {
                          amount: Number(amount || selected.amount) || selected.amount,
                          status: editStatus,
                          risk: editRisk,
                          proof: Number(editProof) || selected.proof,
                          score: Number(editScore) || selected.score,
                          owner,
                          payoutDate: editPayoutDate,
                          paymentMethod: editPaymentMethod,
                          budgetLine: editBudgetLine,
                          exception: editException,
                          audit: `Live detail saved · ${new Date().toLocaleString()}`,
                        })
                        onSave(`Incentive detail saved live for ${selected.ambassador}.`)
                        onClose()
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100"
                    >
                      <CheckCircle2 size={17} /> Save Live
                    </button>
                    <button
                      onClick={() => {
                        const ok = window.confirm(`Delete incentive record ${selected.id} for ${selected.ambassador}?`)
                        if (ok) {
                          onDeleteRecord(selected.id)
                          onSave(`Incentive record deleted: ${selected.id}.`)
                          onClose()
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-100"
                    >
                      <Trash2 size={17} /> Delete
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-5 gap-4">
                  <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="text-xs font-black uppercase text-slate-500">Current Amount</div><div className="mt-2 text-2xl font-black text-slate-950">{fmtMad(selected.amount)}</div></div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="text-xs font-black uppercase text-slate-500">Proof</div><div className="mt-2 text-2xl font-black text-slate-950">{selected.proof}%</div></div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="text-xs font-black uppercase text-slate-500">Score</div><div className="mt-2 text-2xl font-black text-slate-950">{selected.score}/100</div></div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="text-xs font-black uppercase text-slate-500">Status</div><div className="mt-2"><StatusBadge status={selected.status} /></div></div>
                  <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="text-xs font-black uppercase text-slate-500">Risk</div><div className="mt-2"><RiskBadge risk={selected.risk} /></div></div>
                </div>

                <div className="mt-6 grid grid-cols-[1fr_1fr] gap-5">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <h4 className="text-xl font-black text-slate-950">Editable Finance Controls</h4>
                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <Field label="Amount MAD" value={amount} onChange={setAmount} placeholder={String(selected.amount)} />
                      <SelectField label="Status" value={editStatus} onChange={(v) => setEditStatus(v as IncentiveStatus)} options={["Draft", "Pending", "Approved", "Scheduled", "Paid", "Held", "Rejected"]} />
                      <SelectField label="Risk" value={editRisk} onChange={(v) => setEditRisk(v as RiskLevel)} options={["Low", "Medium", "High", "Critical"]} />
                      <Field label="Proof Score" value={editProof} onChange={setEditProof} placeholder="0-100" />
                      <Field label="Performance Score" value={editScore} onChange={setEditScore} placeholder="0-100" />
                      <SelectField label="Payment Method" value={editPaymentMethod} onChange={setEditPaymentMethod} options={["Bank Transfer", "Wallet", "Cash Desk", "Deferred", "Manual Review"]} />
                      <SelectField label="Budget Line" value={editBudgetLine} onChange={setEditBudgetLine} options={["AMB-PERF-MAY", "AMB-MIS-MAY", "AMB-EXP-RABAT", "AMB-TRN-CERT", "AMB-REF-MAY", "AMB-REC-AGADIR", "AMB-COV-DRT"]} />
                      <Field label="Payout Date" value={editPayoutDate} onChange={setEditPayoutDate} placeholder="May 31, 2026" />
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <h4 className="text-xl font-black text-slate-950">Exception, Comments & Tasks</h4>
                    <label className="mt-4 block">
                      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">Exception reason</span>
                      <textarea value={editException} onChange={(e) => setEditException(e.target.value)} className="mt-2 h-24 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-950 outline-none focus:border-orange-400" />
                    </label>
                    <label className="mt-4 block">
                      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">Manager / finance comment</span>
                      <textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-2 h-24 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-950 outline-none focus:border-orange-400" placeholder="Add audit-safe comment..." />
                    </label>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {["Create task", "Escalate", "Notify finance"].map((x) => (
                        <button key={x} className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700 hover:bg-orange-50">{x}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-5">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <h4 className="text-lg font-black text-slate-950">Validation Checklist</h4>
                    <div className="mt-4 space-y-3">
                      {["Proof evidence reviewed", "Amount matches rule", "Budget line approved", "Payment method verified", "Audit note saved"].map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <h4 className="text-lg font-black text-slate-950">Live Tasks</h4>
                    <div className="mt-4 space-y-3">
                      {["Review proof package", "Confirm payment method", "Manager approval", "Finance reconciliation"].map((x) => <button key={x} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-3 text-left text-sm font-black hover:bg-orange-50">{x}<ChevronRight size={15}/></button>)}
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white">
                    <h4 className="text-lg font-black text-white">Audit Trail</h4>
                    <div className="mt-4 space-y-3 text-sm font-bold text-white/80">
                      <p>• Created: {selected.audit}</p>
                      <p>• Owner: {selected.owner}</p>
                      <p>• Approver: {selected.approver}</p>
                      <p>• Last sync: live page state</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {selected && (
              <section className="rounded-[30px] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-violet-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">{selected.id}</div>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">{selected.ambassador}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-700">{selected.city} · {selected.group} · {selected.type} · {selected.phone}</p>
                  </div>
                  <div className="grid grid-cols-5 gap-3 text-center">
                    <div className="rounded-2xl bg-white px-5 py-3 shadow-sm"><div className="text-xl font-black text-slate-950">{fmtMad(selected.amount)}</div><div className="text-[10px] font-black uppercase text-slate-500">Amount</div></div>
                    <div className="rounded-2xl bg-white px-5 py-3 shadow-sm"><div className="text-xl font-black text-slate-950">{selected.proof}%</div><div className="text-[10px] font-black uppercase text-slate-500">Proof</div></div>
                    <div className="rounded-2xl bg-white px-5 py-3 shadow-sm"><div className="text-xl font-black text-slate-950">{selected.score}</div><div className="text-[10px] font-black uppercase text-slate-500">Score</div></div>
                    <div className="rounded-2xl bg-white px-5 py-3 shadow-sm"><div className="text-xl font-black text-slate-950">{selected.missions}</div><div className="text-[10px] font-black uppercase text-slate-500">Missions</div></div>
                    <div className="rounded-2xl bg-white px-5 py-3 shadow-sm"><RiskBadge risk={selected.risk} /><div className="mt-2 text-[10px] font-black uppercase text-slate-500">Risk</div></div>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-[30px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">Active Control Gate · {tab}</div>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">{tab} Execution Layer</h3>
                  <p className="mt-2 max-w-4xl text-sm font-semibold text-slate-600">Every gate requires owner, decision, evidence, audit trail and sync output before the payout is considered production-safe.</p>
                </div>
                <span className="rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-white">Enterprise Gate</span>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-4">
                <Field label="Reference" placeholder={selected?.id || "AC-MOS-AMB-INC-NEW"} />
                <SelectField label="Owner" value={owner} onChange={setOwner} options={["Finance Control", "Quality Control", "Regional Manager", "Operations", "Direction Rabat"]} />
                <SelectField label="Decision" value={decision} onChange={setDecision} options={["Approve", "Hold", "Review", "Reject", "Schedule", "Reconcile"]} />
                <Field label="Amount MAD" value={amount} onChange={setAmount} placeholder={selected ? String(selected.amount) : "0"} />
                <SelectField label="Payment Method" options={["Bank Transfer", "Wallet", "Cash Desk", "Deferred", "Manual Review"]} />
                <SelectField label="Budget Line" options={["AMB-PERF-MAY", "AMB-MIS-MAY", "AMB-EXP-RABAT", "AMB-TRN-CERT", "AMB-REF-MAY", "AMB-REC-AGADIR"]} />
                <SelectField label="Proof Gate" options={["Validated", "Needs Review", "Missing Evidence", "Rejected"]} />
                <Field label="Next Review" placeholder="Today / This week / Custom" />
              </div>
            </section>

            <section className="grid grid-cols-[1fr_0.85fr] gap-5">
              <div className="rounded-[30px] border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-black text-slate-950">Required Controls for {tab}</h3>
                <div className="mt-4 grid grid-cols-2 gap-3">{currentControls.map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
              </div>
              <div className="rounded-[30px] border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-black text-slate-950">Decision Log & Audit Note</h3>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-4 h-40 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-slate-950 outline-none focus:border-orange-400" placeholder="Decision reason, risk, evidence, owner, finance note, exception closure..." />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {["Create task", "Notify owner", "Archive audit"].map((x) => <button key={x} className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700 hover:bg-orange-50">{x}</button>)}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-4 gap-4">
              {[["Budget Exposure", fmtMad(projectedAmount || selected?.amount || 0), Banknote], ["Proof Safety", `${selected?.proof || 84}%`, ShieldCheck], ["Approval Chain", selected?.approver || "Finance Control", UserCheck], ["Audit Status", selected?.audit || "Pending", FileCheck2]].map(([label, value, Icon]) => {
                const I = Icon as typeof Wallet
                return <div key={label as string} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"><I className="text-orange-600" size={22}/><div className="mt-3 text-lg font-black text-slate-950">{value as string}</div><div className="text-xs font-black uppercase text-slate-500">{label as string}</div></div>
              })}
            </section>
          </main>

          <aside className="space-y-5">
            <AiRadio title={`${c.title} AI`} items={c.ai} />
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black text-slate-950">Safety Controls</h3>
              <div className="mt-4 space-y-3">
                {["Role permission checked", "Dual approval if high-risk", "Finance export ready", "Profile synced", "Report synced", "Audit archived"].map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white">
              <h3 className="text-lg font-black">No-Mistake Rules</h3>
              <div className="mt-4 space-y-3 text-sm font-bold text-white/80">
                <p>• No payout under proof threshold.</p>
                <p>• No export without reference IDs.</p>
                <p>• No payment without budget line.</p>
                <p>• No held item without unblock owner.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default function AmbassadorIncentivesWorkspace() {
  const [records, setRecords] = useState<IncentiveRecord[]>(Array.isArray(initialRecords) ? initialRecords : [])
  const [modal, setModal] = useState<ModalKey>(null)
  const [selected, setSelected] = useState<IncentiveRecord | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [riskFilter, setRiskFilter] = useState("All")
  const [status, setStatus] = useState("")

  const safeRecords = Array.isArray(records) ? records : []

  const filtered = useMemo(() => {
    return safeRecords.filter((record) => {
      const matchesQuery = `${record.id} ${record.ambassador} ${record.city} ${record.region} ${record.group} ${record.type} ${record.status} ${record.owner} ${record.budgetLine}`
        .toLowerCase()
        .includes(query.toLowerCase())
      const matchesStatus = statusFilter === "All" || record.status === statusFilter
      const matchesRisk = riskFilter === "All" || record.risk === riskFilter
      return matchesQuery && matchesStatus && matchesRisk
    })
  }, [safeRecords, query, statusFilter, riskFilter])

  const totals = useMemo(() => {
    const total = safeRecords.reduce((sum, r) => sum + r.amount, 0)
    const approved = safeRecords.filter((r) => r.status === "Approved" || r.status === "Scheduled").reduce((sum, r) => sum + r.amount, 0)
    const paid = safeRecords.filter((r) => r.status === "Paid").reduce((sum, r) => sum + r.amount, 0)
    const held = safeRecords.filter((r) => r.status === "Held").reduce((sum, r) => sum + r.amount, 0)
    const pending = safeRecords.filter((r) => r.status === "Pending" || r.status === "Draft").reduce((sum, r) => sum + r.amount, 0)
    const eligible = safeRecords.filter((r) => r.proof >= 80 && r.score >= 80 && r.risk !== "Critical").length
    const highRisk = safeRecords.filter((r) => r.risk === "High" || r.risk === "Critical").length
    return { total, approved, paid, held, pending, eligible, highRisk }
  }, [safeRecords])

  function openModal(key: ModalKey, record?: IncentiveRecord) {
    setSelected(record || null)
    setModal(key)
  }

  function updateRecord(id: string, patch: Partial<IncentiveRecord>) {
    setRecords((prev) => (Array.isArray(prev) ? prev : []).map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function deleteRecord(id: string) {
    setRecords((prev) => (Array.isArray(prev) ? prev : []).filter((r) => r.id !== id))
  }

  function exportCsv() {
    const rows = [
      ["Reference ID", "Ambassador", "Phone", "City", "Region", "Group", "Type", "Amount", "Status", "Proof", "Score", "Missions", "Owner", "Approver", "Payout Date", "Risk", "Payment Method", "Budget Line", "Audit", "Exception"],
      ...filtered.map((r) => [r.id, r.ambassador, r.phone, r.city, r.region, r.group, r.type, r.amount, r.status, r.proof, r.score, r.missions, r.owner, r.approver, r.payoutDate, r.risk, r.paymentMethod, r.budgetLine, r.audit, r.exception]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "angelcare-ambassador-incentives-enterprise.csv"
    a.click()
    URL.revokeObjectURL(url)
    setStatus("Finance-ready incentives CSV exported from current filters.")
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-950">
      <AmbassadorMarketSidebar />
      <main className="flex-1 p-8">
        <header className="relative overflow-hidden rounded-[42px] bg-gradient-to-r from-slate-950 via-orange-700 to-violet-800 p-8 text-white shadow-2xl">
          <Gift className="absolute right-12 top-8 opacity-20" size={170} />
          <div className="relative flex items-start justify-between gap-6">
            <div>
              <div className="text-xs font-black uppercase tracking-[.28em] text-orange-100">Ambassador Management · Enterprise Finance Safety</div>
              <h1 className="mt-3 text-5xl font-black text-white">Incentives & Rewards Command Center</h1>
              <p className="mt-3 max-w-4xl text-sm font-semibold text-white/85">
                Full control of payouts, eligibility, proof locks, reward rules, approval chains, finance exports, reconciliation, exceptions and ambassador communication.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => openModal("simulation")} className="inline-flex items-center gap-2 rounded-2xl border border-white/25 px-5 py-3 text-sm font-black text-white">
                <LineChart size={16} /> Simulate
              </button>
              <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-2xl border border-white/25 px-5 py-3 text-sm font-black text-white">
                <Download size={16} /> Export
              </button>
              <button onClick={() => openModal("create")} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">
                <Plus size={16} /> New Incentive
              </button>
            </div>
          </div>
        </header>

        {status && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-800">{status}</div>}

        <section className="mt-6 grid grid-cols-7 gap-4">
          <MetricCard label="Total Exposure" value={fmtMad(totals.total)} icon={Wallet} color="bg-orange-100 text-orange-700" sub="All reward records" onClick={() => openModal("finance")} />
          <MetricCard label="Approved Queue" value={fmtMad(totals.approved)} icon={CheckCircle2} color="bg-blue-100 text-blue-700" sub="Approved + scheduled" onClick={() => openModal("approve")} />
          <MetricCard label="Paid" value={fmtMad(totals.paid)} icon={Trophy} color="bg-emerald-100 text-emerald-700" sub="Reconciled payouts" onClick={() => openModal("reconcile")} />
          <MetricCard label="Pending Exposure" value={fmtMad(totals.pending)} icon={Clock} color="bg-violet-100 text-violet-700" sub="Draft + pending" onClick={() => openModal("review")} />
          <MetricCard label="Held Risk" value={fmtMad(totals.held)} icon={AlertTriangle} color="bg-rose-100 text-rose-700" sub="Blocked payouts" onClick={() => openModal("hold")} />
          <MetricCard label="Eligible Profiles" value={String(totals.eligible)} icon={ShieldCheck} color="bg-cyan-100 text-cyan-700" sub="Proof and score OK" onClick={() => openModal("proof")} />
          <MetricCard label="High Risk" value={String(totals.highRisk)} icon={ShieldAlert} color="bg-red-100 text-red-700" sub="Needs control" onClick={() => openModal("audit")} />
        </section>

        <section className="mt-5 grid grid-cols-[1fr_0.58fr] gap-5">
          <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-[1.2fr_repeat(5,0.55fr)] gap-4">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
                <Search size={17} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full text-slate-950 outline-none placeholder:text-slate-400" placeholder="Search ambassador, city, reward, budget line, owner..." />
              </label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-950">
                {["All", "Draft", "Pending", "Approved", "Scheduled", "Paid", "Held", "Rejected"].map((x) => <option key={x}>{x}</option>)}
              </select>
              <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-950">
                {["All", "Low", "Medium", "High", "Critical"].map((x) => <option key={x}>{x}</option>)}
              </select>
              <button onClick={() => openModal("rules")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 hover:bg-orange-50"><Sparkles size={16} /> Rules</button>
              <button onClick={() => openModal("budget")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 hover:bg-orange-50"><Banknote size={16} /> Budget</button>
              <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 hover:bg-orange-50"><Download size={16} /> Export</button>
            </div>
          </div>

          <div className="rounded-[32px] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-violet-50 p-5 text-slate-950 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">Safety Snapshot</div>
                <h2 className="mt-1 text-xl font-black text-slate-950">No-Mistake Control</h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-orange-200 bg-orange-100">
                <LockKeyhole className="text-orange-700" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-3">
              {[
                ["Proof Gate", "84%", ShieldCheck, "proof"],
                ["Audit", "96%", History, "audit"],
                ["Budget", "71%", Banknote, "budget"],
                ["Risk", String(totals.highRisk), ShieldAlert, "audit"],
              ].map(([label, value, Icon, key]) => {
                const I = Icon as typeof Wallet
                return (
                  <button
                    key={label as string}
                    onClick={() => openModal(key as ModalKey)}
                    className="group rounded-2xl border border-orange-200 bg-white p-4 text-left shadow-sm transition hover:border-orange-400 hover:bg-orange-50 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <I className="text-orange-700" size={20} />
                      <ChevronRight className="text-slate-400 group-hover:text-orange-700" size={16} />
                    </div>
                    <div className="mt-3 text-3xl font-black text-slate-950">{value as string}</div>
                    <div className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">{label as string}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-[1.35fr_0.65fr] gap-6">
          <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Enterprise Incentives Ledger</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">Finance-grade payout control with proof, status, risk, budget line, approver, audit and exception tracking.</p>
              </div>
              <span className="rounded-full bg-orange-100 px-4 py-2 text-xs font-black text-orange-800">{filtered.length} records</span>
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-600">
                  <tr>
                    <th className="px-4 py-4">Reference</th>
                    <th className="px-4 py-4">Ambassador</th>
                    <th className="px-4 py-4">Reward</th>
                    <th className="px-4 py-4">Amount</th>
                    <th className="px-4 py-4">Proof</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Risk</th>
                    <th className="px-4 py-4">Approver</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(filtered || []).map((record) => (
                    <tr key={record.id} className="border-t border-slate-100 hover:bg-orange-50/50">
                      <td className="px-4 py-4 text-xs font-black text-slate-600">{record.id}</td>
                      <td className="px-4 py-4">
                        <button onClick={() => openModal("record", record)} className="group rounded-2xl p-2 text-left transition hover:bg-orange-50">
                          <div className="font-black text-slate-950 group-hover:text-orange-700">{record.ambassador}</div>
                          <div className="text-xs font-semibold text-slate-600">{record.city} · {record.group}</div>
                          <div className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-orange-600">Open incentive detail</div>
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">{record.type}</div>
                        <div className="text-xs font-semibold text-slate-500">{record.budgetLine}</div>
                      </td>
                      <td className="px-4 py-4 font-black text-slate-950">{fmtMad(record.amount)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-20 rounded-full bg-slate-100"><span className="block h-2 rounded-full bg-gradient-to-r from-orange-500 to-emerald-500" style={{ width: `${record.proof}%` }} /></span>
                          <span className="text-xs font-black text-slate-800">{record.proof}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={record.status} /></td>
                      <td className="px-4 py-4"><RiskBadge risk={record.risk} /></td>
                      <td className="px-4 py-4 text-xs font-bold text-slate-700">{record.approver}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openModal("record", record)} className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-orange-50"><Eye size={16} /></button>
                          <button onClick={() => openModal("approve", record)} className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-orange-50"><CheckCircle2 size={16} /></button>
                          <button onClick={() => openModal("hold", record)} className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-orange-50"><AlertTriangle size={16} /></button>
                          <button onClick={() => openModal("audit", record)} className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-orange-50"><MoreHorizontal size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-5">
            <AiRadio title="Incentives AI Command" items={["Hold payouts below proof threshold until validation improves.", "Approve low-risk high-proof ambassadors before monthly cutoff.", "Require budget line, reference ID and audit owner before export."]} />

            <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Command Actions</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["New Incentive", "Create controlled reward package", Plus, "create", "bg-orange-100 text-orange-700"],
                  ["Review Batch", "Validate eligibility and exceptions", Wallet, "review", "bg-violet-100 text-violet-700"],
                  ["Approve", "Dual-control approval desk", CheckCircle2, "approve", "bg-emerald-100 text-emerald-700"],
                  ["Hold", "Block unsafe payouts", AlertTriangle, "hold", "bg-rose-100 text-rose-700"],
                  ["Rules Engine", "Formula, caps and locks", Sparkles, "rules", "bg-blue-100 text-blue-700"],
                  ["Proof Review", "Evidence and QC validation", ShieldCheck, "proof", "bg-cyan-100 text-cyan-700"],
                  ["Finance Export", "Reference-safe export", Download, "export", "bg-slate-100 text-slate-700"],
                  ["Reconcile", "Payment match and receipt", Receipt, "reconcile", "bg-amber-100 text-amber-700"],
                  ["Budget Safety", "Caps, burn and forecast", Banknote, "budget", "bg-lime-100 text-lime-700"],
                  ["Audit Log", "Trace all decisions", History, "audit", "bg-indigo-100 text-indigo-700"],
                  ["Simulation", "Forecast exposure and ROI", LineChart, "simulation", "bg-fuchsia-100 text-fuchsia-700"],
                  ["Send Notice", "Ambassador communication", Send, "notice", "bg-orange-100 text-orange-700"],
                ].map(([label, sub, Icon, key, color]) => {
                  const I = Icon as typeof Wallet
                  return (
                    <button key={label as string} onClick={() => openModal(key as ModalKey)} className="group min-h-[118px] rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:shadow-lg">
                      <div className="flex items-start justify-between">
                        <div className={`grid h-12 w-12 place-items-center rounded-2xl ${color as string}`}><I size={22} /></div>
                        <ChevronRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500" size={18}/>
                      </div>
                      <div className="mt-4 text-sm font-black text-slate-950">{label as string}</div>
                      <div className="mt-1 text-xs font-bold leading-snug text-slate-500">{sub as string}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6 grid grid-cols-4 gap-6">
          <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Reward Rules Library</h2>
            <div className="mt-5 space-y-4">
              {["Elite score ≥ 92 + proof ≥ 90", "Territory growth reward after 20 missions", "Training certificate reward with manager approval", "Referral reward only after activation", "Recovery bonus requires proof improvement"].map((tier) => (
                <button key={tier} onClick={() => openModal("rules")} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-4 text-left text-sm font-black text-slate-800 hover:bg-orange-50">
                  {tier}<ArrowRight size={16} />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Budget & ROI Signal</h2>
            <div className="mt-5 h-[230px] rounded-3xl bg-gradient-to-t from-orange-50 to-white">
              <svg viewBox="0 0 420 210" className="h-full w-full">
                <path d="M0,160 L50,140 L90,150 L140,100 L185,115 L230,70 L275,90 L320,55 L365,68 L420,30" fill="none" stroke="#f97316" strokeWidth="5" />
                <path d="M0,180 L50,170 L90,160 L140,150 L185,135 L230,125 L275,110 L320,100 L365,90 L420,75" fill="none" stroke="#7c3aed" strokeWidth="4" />
              </svg>
            </div>
            <button onClick={() => openModal("budget")} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-orange-700">Open budget safety <ArrowRight size={15} /></button>
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Exception Queue</h2>
            <div className="mt-5 space-y-4">
              {safeRecords.filter((r) => r.status === "Held" || r.risk === "High" || r.risk === "Critical").map((record) => (
                <button key={record.id} onClick={() => openModal("hold", record)} className="w-full rounded-2xl border border-rose-100 bg-rose-50 p-4 text-left">
                  <div className="flex items-center justify-between"><b className="text-slate-950">{record.ambassador}</b><RiskBadge risk={record.risk} /></div>
                  <p className="mt-1 text-xs font-bold text-rose-800">{record.exception} · {record.proof}% proof · {fmtMad(record.amount)}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Audit Timeline</h2>
            <div className="mt-5 space-y-4">
              {["Rules engine updated", "Finance export generated", "Proof exception held", "Payment reconciled", "Reward notice prepared"].map((item, i) => (
                <button key={item} onClick={() => openModal("audit")} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left hover:bg-orange-50">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-100 text-xs font-black text-orange-700">{i + 1}</span>
                  <span className="text-sm font-black text-slate-800">{item}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <ActionModal active={modal} selected={selected} onClose={() => setModal(null)} onSave={(message) => setStatus(message)} onUpdateRecord={updateRecord} onDeleteRecord={deleteRecord} />
      </main>
    </div>
  )
}
