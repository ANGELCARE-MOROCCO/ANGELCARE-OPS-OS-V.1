
"use client"

import { useMemo, useState } from "react"
import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  FolderDown,
  Gift,
  LineChart,
  MapPinned,
  Megaphone,
  MoreHorizontal,
  PieChart,
  Plus,
  Save,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  ToggleLeft,
  ToggleRight,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react"

type ReportTab = "Ambassadors" | "Missions" | "Coverage" | "Performance" | "Incentives" | "Activities" | "Compliance"
type ReportTemplateId = string

type WorkspaceModal =
  | "template"
  | "create"
  | "export"
  | "schedule"
  | "insights"
  | "save-view"
  | "preview"
  | null

type ReportTemplate = {
  id: string
  refId: string
  title: string
  category: ReportTab
  owner: string
  reportType: string
  confidentiality: "Internal" | "Management" | "Restricted" | "Finance Controlled"
  frequency: "Ad hoc" | "Daily" | "Weekly" | "Monthly" | "Quarterly"
  purpose: string
  executiveQuestion: string
  kpis: string[]
  sections: string[]
  controls: string[]
  risks: string[]
  actions: string[]
  exportName: string
}

const templates: ReportTemplate[] = [
  {
    id: "ambassador-performance",
    refId: "AC-MOS-AMB-RPT-PERF-001",
    title: "Ambassador Network Performance Board",
    category: "Performance",
    owner: "Operations",
    reportType: "Executive performance control",
    confidentiality: "Management",
    frequency: "Weekly",
    purpose: "Measure ambassador productivity, quality, conversion, coaching needs and leadership decisions across the entire network.",
    executiveQuestion: "Which ambassadors are creating measurable value, who needs intervention, and what decisions must be taken this week?",
    kpis: ["Network Score 86/100", "Top Performer Score 92/100", "2 recovery profiles", "Proof Quality 84%", "Coaching Queue 2"],
    sections: ["Executive Summary", "Leaderboard", "Score Distribution", "Proof Quality Review", "Coaching Queue", "Next-Week Decisions"],
    controls: ["Unique report ID", "Owner approval", "Data refresh timestamp", "Role-restricted export", "Decision log required"],
    risks: ["Low proof quality creates payout risk", "Recovery ambassadors below 70 require manager follow-up", "High performers risk overload without territory balancing"],
    actions: ["Create coaching tasks for recovery profiles", "Assign mentors from elite ambassadors", "Approve only proof-validated incentives"],
    exportName: "AC-MOS-AMB-RPT-PERF-001-ambassador-network-performance",
  },
  {
    id: "single-ambassador-360",
    refId: "AC-MOS-AMB-RPT-360-001",
    title: "Single Ambassador 360 Report",
    category: "Ambassadors",
    owner: "Regional Manager",
    reportType: "Individual ambassador review",
    confidentiality: "Restricted",
    frequency: "Ad hoc",
    purpose: "Create a complete one-by-one ambassador report covering profile, score, missions, proof, tasks, comments, incentives, risks and next actions.",
    executiveQuestion: "Should this ambassador be scaled, coached, rewarded, held, reassigned, or escalated?",
    kpis: ["Individual Score", "Proof Quality", "Mission Completion", "Open Tasks", "Incentive Eligibility"],
    sections: ["Identity & Territory", "Performance Snapshot", "Mission & Activity History", "Proof & Compliance", "Comments & Manager Notes", "Task Plan", "Decision & Next Actions"],
    controls: ["Ambassador ID", "Manager signature", "Task linkage", "Comment log", "Export access control"],
    risks: ["Incomplete proof may block incentives", "No comments means weak accountability", "Tasks without owner do not count as action"],
    actions: ["Create personal coaching plan", "Approve or hold payout", "Assign next sprint", "Schedule manager review"],
    exportName: "AC-MOS-AMB-RPT-360-001-single-ambassador-360",
  },
  {
    id: "mission-analytics",
    refId: "AC-MOS-AMB-RPT-MIS-002",
    title: "Mission Analytics & Execution Report",
    category: "Missions",
    owner: "Field Operations",
    reportType: "Mission execution analytics",
    confidentiality: "Internal",
    frequency: "Weekly",
    purpose: "Analyze missions by type, completion, region, route performance and execution bottlenecks.",
    executiveQuestion: "Which missions are delivering execution impact, where are blockers, and how should next routes be deployed?",
    kpis: ["2,156 Missions", "84% Completion", "539 Promotions", "431 Surveys", "388 Events"],
    sections: ["Executive Summary", "Mission Mix", "Completion by Region", "Route Productivity", "Blocked Missions", "Execution Plan"],
    controls: ["Mission IDs", "Route proof", "Supervisor validation", "Closure status", "Exception register"],
    risks: ["Survey missions are underperforming in low-coverage cities", "Route saturation in Casablanca may reduce quality", "Field proof gaps delay mission closure"],
    actions: ["Launch route optimization for Agadir and Oujda", "Rebalance promotional missions", "Create blocked-mission escalation workflow"],
    exportName: "AC-MOS-AMB-RPT-MIS-002-mission-analytics",
  },
  {
    id: "coverage-reach",
    refId: "AC-MOS-AMB-RPT-COV-003",
    title: "Coverage & Reach Expansion Report",
    category: "Coverage",
    owner: "Market Intelligence",
    reportType: "Territory coverage intelligence",
    confidentiality: "Management",
    frequency: "Monthly",
    purpose: "Map ambassador reach, coverage gaps, city density and expansion priorities.",
    executiveQuestion: "Where is Angelcare under-covered, over-covered, and ready to expand next?",
    kpis: ["168 Cities Covered", "73% National Coverage", "Casablanca 91%", "Agadir 69%", "Oujda 88%"],
    sections: ["Executive Summary", "Coverage Map", "Region Ranking", "Gap Analysis", "Expansion Priority", "Deployment Plan"],
    controls: ["Geo scope", "City coverage rules", "Density threshold", "Expansion owner", "Budget flag"],
    risks: ["Low coverage in Agadir limits growth", "City density mismatch creates inefficient ambassador allocation", "Expansion without proof controls can lower quality"],
    actions: ["Deploy coverage sprint in Souss-Massa", "Assign ambassadors by density and lead potential", "Create weekly coverage report"],
    exportName: "AC-MOS-AMB-RPT-COV-003-coverage-reach",
  },
  {
    id: "activity-summary",
    refId: "AC-MOS-AMB-RPT-ACT-004",
    title: "Activity Summary & Velocity Report",
    category: "Activities",
    owner: "Operations",
    reportType: "Activity execution summary",
    confidentiality: "Internal",
    frequency: "Daily",
    purpose: "Summarize visits, check-ins, surveys, trainings, events and execution velocity.",
    executiveQuestion: "Is the ambassador network executing enough activity with enough quality to meet monthly targets?",
    kpis: ["3,847 Visits", "6,421 Tasks", "90% Trainings", "72% Surveys", "65% Events"],
    sections: ["Executive Summary", "Activity Mix", "Daily Trend", "Completion Rate", "Low-Activity Profiles", "Operational Actions"],
    controls: ["Daily cut-off", "Proof linkage", "Task status", "Manager review", "Exception list"],
    risks: ["Events completion below target", "Survey completion needs tighter follow-up", "Activity volume must not outpace proof quality"],
    actions: ["Create event recovery sprint", "Add daily activity closeout", "Push automated manager reminders"],
    exportName: "AC-MOS-AMB-RPT-ACT-004-activity-summary",
  },
  {
    id: "incentives",
    refId: "AC-MOS-AMB-RPT-FIN-005",
    title: "Incentives & Rewards Finance Report",
    category: "Incentives",
    owner: "Finance",
    reportType: "Payout control report",
    confidentiality: "Finance Controlled",
    frequency: "Monthly",
    purpose: "Prepare payout review, eligibility, proof locks, reward tiers and finance approval decisions.",
    executiveQuestion: "Who should be paid, who should be held, and what proof is required before payout?",
    kpis: ["1.28M MAD Paid", "5 Ready Payouts", "2 Held Payouts", "84% Proof Quality", "15% Growth"],
    sections: ["Executive Summary", "Payout Summary", "Eligibility Rules", "Held Payouts", "Proof Validation", "Finance Decision Log"],
    controls: ["Finance approval", "Proof lock", "Payout owner", "Exception reason", "Audit trail"],
    risks: ["Payout without proof validation", "Rewarding high volume with weak quality", "Late finance approvals slow motivation"],
    actions: ["Approve eligible payouts", "Hold low-proof profiles", "Send finance-ready payout CSV"],
    exportName: "AC-MOS-AMB-RPT-FIN-005-incentives-rewards",
  },
  {
    id: "compliance",
    refId: "AC-MOS-AMB-RPT-CMP-006",
    title: "Compliance & Proof Quality Report",
    category: "Compliance",
    owner: "Quality Control",
    reportType: "Compliance assurance",
    confidentiality: "Restricted",
    frequency: "Weekly",
    purpose: "Audit proof quality, GPS validation, visit evidence, approval workflow and compliance gaps.",
    executiveQuestion: "Can leadership trust the field data, and what needs audit before decisions or payments?",
    kpis: ["94% Compliance", "42 Proof Reviews", "11 Exceptions", "7 Manager Overrides", "2 Critical Gaps"],
    sections: ["Executive Summary", "Proof Audit", "GPS Validation", "Exception Log", "Manager Overrides", "Compliance Actions"],
    controls: ["GPS proof", "Photo evidence", "Manager override", "Exception owner", "Closure proof"],
    risks: ["Manual overrides without evidence", "GPS gaps in field visits", "Unreviewed proof blocks reliable reporting"],
    actions: ["Audit exception queue", "Lock payouts with missing proof", "Create compliance review tasks"],
    exportName: "AC-MOS-AMB-RPT-CMP-006-compliance-proof",
  },
  {
    id: "recruitment-pipeline",
    refId: "AC-MOS-AMB-RPT-REC-007",
    title: "Ambassador Recruitment Pipeline Report",
    category: "Ambassadors",
    owner: "Recruitment",
    reportType: "Pipeline and hiring capacity",
    confidentiality: "Internal",
    frequency: "Weekly",
    purpose: "Track ambassador sourcing, interviews, acceptance, onboarding capacity and city staffing gaps.",
    executiveQuestion: "Do we have enough qualified ambassadors entering the system to cover growth needs?",
    kpis: ["78 New Ambassadors", "34 Interviews", "21 Accepted", "12 Pending Training", "6 Critical Cities"],
    sections: ["Executive Summary", "Pipeline Funnel", "City Staffing Gaps", "Candidate Quality", "Onboarding Capacity", "Hiring Actions"],
    controls: ["Candidate source", "Interview status", "Training slot", "City need", "Recruiter owner"],
    risks: ["Critical cities under-staffed", "Low candidate quality slows onboarding", "Training capacity may block activation"],
    actions: ["Open recruitment sprint", "Prioritize high-gap cities", "Schedule onboarding cohorts"],
    exportName: "AC-MOS-AMB-RPT-REC-007-recruitment-pipeline",
  },
  {
    id: "training-certification",
    refId: "AC-MOS-AMB-RPT-TRN-008",
    title: "Training & Certification Report",
    category: "Performance",
    owner: "Training Academy",
    reportType: "Learning and certification control",
    confidentiality: "Internal",
    frequency: "Weekly",
    purpose: "Control ambassador training, certification readiness, skill gaps and learning compliance.",
    executiveQuestion: "Which ambassadors are ready to represent Angelcare quality standards in the field?",
    kpis: ["90% Training Completion", "42 Certifications", "11 Pending", "7 Skill Gaps", "3 Overdue"],
    sections: ["Executive Summary", "Certification Status", "Skill Gaps", "Training Attendance", "Assessment Results", "Learning Actions"],
    controls: ["Attendance proof", "Certification status", "Trainer validation", "Expiry date", "Retraining rule"],
    risks: ["Uncertified ambassadors in active missions", "Expired certification", "Training gaps affecting brand quality"],
    actions: ["Schedule certification exam", "Block high-risk missions", "Assign refresher training"],
    exportName: "AC-MOS-AMB-RPT-TRN-008-training-certification",
  },
  {
    id: "territory-profitability",
    refId: "AC-MOS-AMB-RPT-TER-009",
    title: "Territory Profitability & ROI Report",
    category: "Coverage",
    owner: "Direction Rabat",
    reportType: "Commercial territory ROI",
    confidentiality: "Management",
    frequency: "Monthly",
    purpose: "Compare territory cost, incentives, visits, partner leads and ROI to guide expansion priorities.",
    executiveQuestion: "Which territories deserve more investment and which require operational correction?",
    kpis: ["ROI Index 1.7x", "Top ROI Casablanca", "Lowest ROI Agadir", "Cost / Lead 42 MAD", "Expansion Priority 3 Cities"],
    sections: ["Executive Summary", "Territory ROI", "Cost per Lead", "Incentives vs Output", "Expansion Ranking", "Investment Decisions"],
    controls: ["Cost source", "Revenue assumption", "ROI formula", "Finance validation", "Expansion owner"],
    risks: ["Expansion without ROI clarity", "Incentives not linked to output", "Low ROI territories consuming budget"],
    actions: ["Increase investment in top ROI cities", "Correct low ROI cities", "Set city budget caps"],
    exportName: "AC-MOS-AMB-RPT-TER-009-territory-profitability",
  },
]
const topAmbassadors = [
  ["Youssef El Fassi", "Casablanca-Settat", 32, 48, 78, 92],
  ["Fatima Zahra Ait", "Rabat-Salé-Kénitra", 28, 42, 64, 89],
  ["Omar Kabbaj", "Marrakech-Safi", 26, 38, 61, 88],
  ["Imane Lahlou", "Fès-Meknès", 24, 36, 58, 85],
  ["Ahmed Benali", "Tanger-Tétouan-Al Hoceima", 23, 34, 56, 84],
]

function downloadFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function buildReportHtml(template: ReportTemplate) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${template.title}</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;margin:0;background:#f8fafc;color:#0f172a}
    .page{max-width:980px;margin:32px auto;background:white;border:1px solid #e2e8f0;border-radius:28px;padding:42px}
    .eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.22em;color:#7c3aed;font-weight:900}
    h1{font-size:34px;margin:10px 0 8px}
    h2{font-size:18px;margin-top:28px;border-top:1px solid #e2e8f0;padding-top:22px}
    p,li{font-size:13px;line-height:1.55}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}
    .card{border:1px solid #e2e8f0;border-radius:16px;padding:14px;background:#fafafa;font-weight:800}
    .rule{border-left:4px solid #7c3aed;padding-left:14px;margin-top:18px}
    @media print{body{background:white}.page{border:0;margin:0;max-width:none;border-radius:0}.no-print{display:none}}
  </style>
</head>
<body>
  <div class="page">
    <div class="eyebrow">Angelcare · McKinsey-style execution report</div>
    <h1>${template.title}</h1>
    <p><strong>Reference ID:</strong> ${template.refId}</p>
    <p><strong>Owner:</strong> ${template.owner} · <strong>Category:</strong> ${template.category} · <strong>Type:</strong> ${template.reportType} · <strong>Confidentiality:</strong> ${template.confidentiality} · <strong>Frequency:</strong> ${template.frequency} · <strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <div class="rule"><strong>Executive question:</strong><br/>${template.executiveQuestion}</div>
    <h2>1. Executive Summary</h2>
    <p>${template.purpose}</p>
    <h2>2. KPI Snapshot</h2>
    <div class="grid">${template.kpis.map((x) => `<div class="card">${x}</div>`).join("")}</div>
    <h2>3. Report Sections</h2>
    <ul>${template.sections.map((x) => `<li>${x}</li>`).join("")}</ul>
    <h2>4. Enterprise Controls</h2>
    <ul>${template.controls.map((x) => `<li>${x}</li>`).join("")}</ul>
    <h2>5. Risks / Watchpoints</h2>
    <ul>${template.risks.map((x) => `<li>${x}</li>`).join("")}</ul>
    <h2>6. Recommended Actions</h2>
    <ul>${template.actions.map((x) => `<li>${x}</li>`).join("")}</ul>
    <h2>7. Decision Log</h2>
    <p>Decision owner must confirm action owner, deadline, proof requirement, and next review date before closing this report.</p>
    <button class="no-print" onclick="window.print()">Export PDF / Print</button>
  </div>
</body>
</html>`
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input type={type} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
    </label>
  )
}

function SelectField({ label, options, value, onChange }: { label: string; options: string[]; value?: string; onChange?: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange?.(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function ToggleRow({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold transition hover:border-violet-300 hover:bg-violet-50">
      <input type="checkbox" defaultChecked className="h-4 w-4 accent-violet-600" />
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
          <div className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">AI REPORT SIGNAL ONLINE</div>
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

function TemplateWorkspaceModal({ template, onClose }: { template: ReportTemplate; onClose: () => void }) {
  const [status, setStatus] = useState("")
  const [scheduleEnabled, setScheduleEnabled] = useState(false)

  function exportHtml() {
    downloadFile(`${template.exportName}.html`, buildReportHtml(template), "text/html")
    setStatus("HTML/PDF-ready report generated. Open the file and use Print → Save as PDF.")
  }

  function exportCsv() {
    const rows = [
      ["Report", template.title],
      ["Owner", template.owner],
      ["Category", template.category],
      ["Executive Question", template.executiveQuestion],
      [],
      ["KPIs"],
      ...template.kpis.map((x) => [x]),
      [],
      ["Risks"],
      ...template.risks.map((x) => [x]),
      [],
      ["Actions"],
      ...template.actions.map((x) => [x]),
    ]
    downloadFile(`${template.exportName}.csv`, rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n"), "text/csv")
    setStatus("CSV export generated.")
  }

  function openPrintable() {
    const popup = window.open("", "_blank")
    if (!popup) return
    popup.document.write(buildReportHtml(template))
    popup.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-[1540px] overflow-y-auto rounded-[38px] border border-white/70 bg-white shadow-2xl">
        <header className="relative overflow-hidden rounded-t-[38px] bg-gradient-to-r from-slate-950 via-violet-800 to-blue-700 p-7 text-white">
          <FileText className="absolute -right-10 -top-10 opacity-15" size={230} />
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15"><FileText size={30} /></div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Enterprise Report Template Workspace</div>
                <h2 className="mt-2 text-3xl font-black tracking-tight">{template.title}</h2>
                <p className="mt-2 max-w-4xl text-sm font-semibold text-white/80">{template.refId} · {template.reportType} · {template.confidentiality} · {template.frequency}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/25 bg-slate-950/30 p-2 shadow-2xl backdrop-blur-md">
              <button onClick={exportHtml} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-violet-50"><Download size={17} />Export PDF Ready</button>
              <button onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-white/25"><X size={17} />Close</button>
            </div>
          </div>
        </header>

        {status && <div className="mx-7 mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">{status}</div>}

        <div className="grid grid-cols-[1.2fr_0.8fr] gap-6 p-7">
          <main className="space-y-6">
            <section className="grid grid-cols-4 gap-4">
              {template.kpis.slice(0, 4).map((kpi, index) => (
                <div key={kpi} className="rounded-[24px] bg-violet-50 p-5 text-violet-700">
                  {[BarChart3, Users, Target, ShieldCheck][index] && (() => {
                    const Icon = [BarChart3, Users, Target, ShieldCheck][index]
                    return <Icon size={22} />
                  })()}
                  <div className="mt-3 text-xl font-black">{kpi}</div>
                  <div className="text-xs font-black uppercase">Template KPI</div>
                </div>
              ))}
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-2xl font-black">Executive Question</h3>
              <p className="mt-3 rounded-2xl border-l-4 border-violet-600 bg-violet-50 p-5 text-sm font-bold text-slate-700">{template.executiveQuestion}</p>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-black">Enterprise Reference & Governance</h3>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {[["Reference", template.refId], ["Type", template.reportType], ["Confidentiality", template.confidentiality], ["Frequency", template.frequency]].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-black uppercase text-slate-500">{label}</div><div className="mt-1 text-sm font-black">{value}</div></div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-5">
              <div className="rounded-[30px] border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-black">McKinsey Template Sections</h3>
                <div className="mt-4 space-y-3">{template.sections.map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
              </div>
              <div className="rounded-[30px] border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-black">Decision Actions</h3>
                <div className="mt-4 space-y-3">{template.actions.map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-black">Export & Delivery Controls</h3>
              <div className="mt-5 grid grid-cols-3 gap-4">
                <button onClick={openPrintable} className="rounded-2xl border border-slate-200 p-5 text-left font-black hover:border-violet-300 hover:bg-violet-50"><Eye className="mb-3 text-violet-600" />Preview Printable</button>
                <button onClick={exportHtml} className="rounded-2xl border border-slate-200 p-5 text-left font-black hover:border-violet-300 hover:bg-violet-50"><Download className="mb-3 text-violet-600" />Export PDF-Ready HTML</button>
                <button onClick={exportCsv} className="rounded-2xl border border-slate-200 p-5 text-left font-black hover:border-violet-300 hover:bg-violet-50"><FolderDown className="mb-3 text-violet-600" />Export CSV</button>
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <RadioAiPanel
              title="Template Intelligence"
              subtitle="Executive reporting rules"
              items={[
                "Start with the decision question, not raw data.",
                "Every chart must answer a management action.",
                "Every risk must have an owner, deadline and proof requirement.",
                "Export should include summary, evidence and action plan.",
              ]}
            />

            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-black">Report Settings</h3>
              <div className="mt-5 space-y-4">
                <SelectField label="Audience" options={["Direction Rabat", "Operations", "HR", "Finance", "Regional managers"]} />
                <SelectField label="Period" options={["May 1 – May 31, 2025", "This week", "This quarter", "Custom"]} />
                <SelectField label="Region scope" options={["All Morocco", "Casablanca-Settat", "Rabat-Salé-Kénitra", "Souss-Massa", "Oriental"]} />
                <Field label="Decision owner" placeholder="Owner name" />
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-black">Schedule & Share</h3>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-sm font-black">Recurring report</div>
                  <div className="text-xs font-semibold text-slate-500">Weekly Monday 09:00</div>
                </div>
                <button onClick={() => setScheduleEnabled(!scheduleEnabled)}>{scheduleEnabled ? <ToggleRight className="text-emerald-500" size={34} /> : <ToggleLeft className="text-slate-300" size={34} />}</button>
              </div>
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><Send size={16} />Send to stakeholders</button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}


const reportAmbassadors = [
  { id: "AMB-0001", name: "Youssef El Fassi", city: "Casablanca", region: "Casablanca-Settat", group: "Elite Performers", score: 92, proof: 97, missions: 32, visits: 48, tasks: 78, incentives: "12,800 MAD", risk: "Low" },
  { id: "AMB-0002", name: "Fatima Zahra Ait", city: "Rabat", region: "Rabat-Salé-Kénitra", group: "Top Performers", score: 89, proof: 96, missions: 28, visits: 42, tasks: 64, incentives: "11,600 MAD", risk: "Low" },
  { id: "AMB-0003", name: "Omar Kabbaj", city: "Marrakech", region: "Marrakech-Safi", group: "Top Performers", score: 88, proof: 91, missions: 26, visits: 38, tasks: 61, incentives: "9,800 MAD", risk: "Low" },
  { id: "AMB-0004", name: "Imane Lahlou", city: "Fès", region: "Fès-Meknès", group: "Core Team", score: 85, proof: 88, missions: 24, visits: 36, tasks: 58, incentives: "7,600 MAD", risk: "Low" },
  { id: "AMB-0005", name: "Ahmed Benali", city: "Tangier", region: "Tanger-Tétouan-Al Hoceima", group: "Core Team", score: 84, proof: 84, missions: 23, visits: 34, tasks: 56, incentives: "6,900 MAD", risk: "Medium" },
  { id: "AMB-0006", name: "Salma El Amrani", city: "Agadir", region: "Souss-Massa", group: "Recovery", score: 65, proof: 68, missions: 13, visits: 22, tasks: 31, incentives: "3,200 MAD", risk: "High" },
]

function buildSingleAmbassadorHtml(ambassador: typeof reportAmbassadors[number]) {
  const ref = `AC-MOS-AMB-RPT-360-${ambassador.id}`
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${ref} ${ambassador.name}</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;margin:0;background:#f8fafc;color:#0f172a}
    .page{max-width:980px;margin:32px auto;background:white;border:1px solid #e2e8f0;border-radius:28px;padding:42px}
    .eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.22em;color:#7c3aed;font-weight:900}
    h1{font-size:34px;margin:10px 0 8px}
    h2{font-size:18px;margin-top:28px;border-top:1px solid #e2e8f0;padding-top:22px}
    p,li{font-size:13px;line-height:1.55}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px}
    .card{border:1px solid #e2e8f0;border-radius:16px;padding:14px;background:#fafafa;font-weight:800}
    .rule{border-left:4px solid #7c3aed;padding-left:14px;margin-top:18px}
    @media print{body{background:white}.page{border:0;margin:0;max-width:none;border-radius:0}.no-print{display:none}}
  </style>
</head>
<body>
  <div class="page">
    <div class="eyebrow">Angelcare · Single Ambassador 360 Report</div>
    <h1>${ambassador.name}</h1>
    <p><strong>Reference ID:</strong> ${ref}</p>
    <p><strong>Ambassador ID:</strong> ${ambassador.id} · <strong>Region:</strong> ${ambassador.region} · <strong>City:</strong> ${ambassador.city} · <strong>Group:</strong> ${ambassador.group} · <strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <div class="rule"><strong>Decision question:</strong><br/>Should this ambassador be scaled, coached, rewarded, held, reassigned, or escalated?</div>
    <h2>1. Individual KPI Snapshot</h2>
    <div class="grid">
      <div class="card">Score ${ambassador.score}/100</div>
      <div class="card">Proof ${ambassador.proof}%</div>
      <div class="card">Missions ${ambassador.missions}</div>
      <div class="card">Visits ${ambassador.visits}</div>
      <div class="card">Tasks ${ambassador.tasks}</div>
      <div class="card">Incentives ${ambassador.incentives}</div>
      <div class="card">Risk ${ambassador.risk}</div>
      <div class="card">Group ${ambassador.group}</div>
    </div>
    <h2>2. Performance Interpretation</h2>
    <p>${ambassador.name} is currently classified as ${ambassador.risk} risk with a score of ${ambassador.score}/100 and proof quality of ${ambassador.proof}%.</p>
    <h2>3. Controls</h2>
    <ul><li>Manager review required</li><li>Task owner must be assigned</li><li>Proof evidence must be validated before incentive decision</li><li>Report must be archived under ambassador profile</li></ul>
    <h2>4. Recommended Actions</h2>
    <ul><li>Create or update coaching plan</li><li>Approve or hold payout according to proof quality</li><li>Assign next territory sprint</li><li>Add manager comment and next review date</li></ul>
    <button class="no-print" onclick="window.print()">Export PDF / Print</button>
  </div>
</body>
</html>`
}

function SingleAmbassadorReportModal({ ambassador, onClose }: { ambassador: typeof reportAmbassadors[number]; onClose: () => void }) {
  const [status, setStatus] = useState("")
  const ref = `AC-MOS-AMB-RPT-360-${ambassador.id}`

  function exportSingleHtml() {
    downloadFile(`${ref}-${ambassador.name.toLowerCase().replaceAll(" ", "-")}.html`, buildSingleAmbassadorHtml(ambassador), "text/html")
    setStatus("Single ambassador PDF-ready report exported. Open and Print → Save as PDF.")
  }

  function openPrintable() {
    const popup = window.open("", "_blank")
    if (!popup) return
    popup.document.write(buildSingleAmbassadorHtml(ambassador))
    popup.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-[1480px] overflow-y-auto rounded-[38px] border border-white/70 bg-white shadow-2xl">
        <header className="relative overflow-hidden rounded-t-[38px] bg-gradient-to-r from-slate-950 via-violet-800 to-blue-700 p-7 text-white">
          <Users className="absolute -right-10 -top-10 opacity-15" size={230} />
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15 text-lg font-black">{ambassador.name.split(" ").map((x) => x[0]).slice(0,2).join("")}</div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Single Ambassador 360 Report</div>
                <h2 className="mt-2 text-3xl font-black tracking-tight">{ambassador.name}</h2>
                <p className="mt-2 max-w-4xl text-sm font-semibold text-white/80">{ref} · {ambassador.city} · {ambassador.group}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/25 bg-slate-950/30 p-2 shadow-2xl backdrop-blur-md">
              <button onClick={exportSingleHtml} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-violet-50"><Download size={17}/>Export PDF Ready</button>
              <button onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-white/25"><X size={17}/>Close</button>
            </div>
          </div>
        </header>

        {status && <div className="mx-7 mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">{status}</div>}

        <div className="grid grid-cols-[1.15fr_0.85fr] gap-6 p-7">
          <main className="space-y-6">
            <section className="grid grid-cols-4 gap-4">
              {[
                ["Score", `${ambassador.score}/100`],
                ["Proof", `${ambassador.proof}%`],
                ["Missions", String(ambassador.missions)],
                ["Incentives", ambassador.incentives],
              ].map(([label, value]) => <div key={label} className="rounded-[24px] bg-violet-50 p-5 text-violet-700"><BarChart3 size={22}/><div className="mt-3 text-2xl font-black">{value}</div><div className="text-xs font-black uppercase">{label}</div></div>)}
            </section>
            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-2xl font-black">Report Decision Frame</h3>
              <p className="mt-3 rounded-2xl border-l-4 border-violet-600 bg-violet-50 p-5 text-sm font-bold text-slate-700">Should this ambassador be scaled, coached, rewarded, held, reassigned, or escalated?</p>
            </section>
            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-2xl font-black">One-by-one Report Sections</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">{["Identity & Territory", "Performance Snapshot", "Mission History", "Proof & Compliance", "Comments & Notes", "Task Plan", "Incentive Decision", "Next Review"].map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
            </section>
            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-black">Export Controls</h3>
              <div className="mt-5 grid grid-cols-3 gap-4">
                <button onClick={openPrintable} className="rounded-2xl border border-slate-200 p-5 text-left font-black hover:border-violet-300 hover:bg-violet-50"><Eye className="mb-3 text-violet-600"/>Preview</button>
                <button onClick={exportSingleHtml} className="rounded-2xl border border-slate-200 p-5 text-left font-black hover:border-violet-300 hover:bg-violet-50"><Download className="mb-3 text-violet-600"/>PDF-ready HTML</button>
                <button onClick={() => downloadFile(`${ref}.csv`, `Reference,${ref}\\nAmbassador,${ambassador.name}\\nScore,${ambassador.score}\\nProof,${ambassador.proof}\\nRisk,${ambassador.risk}`, "text/csv")} className="rounded-2xl border border-slate-200 p-5 text-left font-black hover:border-violet-300 hover:bg-violet-50"><FolderDown className="mb-3 text-violet-600"/>CSV</button>
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <RadioAiPanel title="Individual Report AI" subtitle="Ambassador decision signal" items={[
              ambassador.risk === "High" ? "High-risk ambassador: prioritize coaching and proof validation before incentives." : "Stable profile: consider mentor or territory scale if proof remains strong.",
              "Every single ambassador report must end with a decision owner and next review date.",
              "Export should be archived under the ambassador profile history.",
            ]} />
            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-black">Enterprise Controls</h3>
              <div className="mt-4 space-y-3">{["Reference ID locked", "Manager review required", "Comment log included", "Task plan included", "Export audit enabled"].map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}



function ReportTabGatewayModal({
  tab,
  gateway,
  template,
  onClose,
  openTemplate,
  saveCurrentView,
}: {
  tab: ReportTab
  gateway: { title: string; summary: string; actions: readonly string[]; template: string }
  template: ReportTemplate
  onClose: () => void
  openTemplate: (template: ReportTemplate) => void
  saveCurrentView: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-[1220px] overflow-y-auto rounded-[38px] border border-white/70 bg-white shadow-2xl">
        <header className="relative overflow-hidden rounded-t-[38px] bg-gradient-to-r from-slate-950 via-violet-800 to-blue-700 p-7 text-white">
          <BarChart3 className="absolute -right-10 -top-10 opacity-15" size={220} />
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Horizontal Report Gateway</div>
              <h2 className="mt-2 text-3xl font-black tracking-tight">{gateway.title}</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold text-white/80">{gateway.summary}</p>
            </div>
            <div className="flex gap-2 rounded-3xl border border-white/25 bg-slate-950/30 p-2">
              <button onClick={() => openTemplate(template)} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">Open Template</button>
              <button onClick={onClose} className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-black text-white">Close</button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-[1.15fr_0.85fr] gap-6 p-7">
          <main className="space-y-6">
            <section className="grid grid-cols-4 gap-4">
              {[
                ["Active Tab", tab],
                ["Template", template.refId],
                ["Owner", template.owner],
                ["Reports", "Synced"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[24px] bg-violet-50 p-5 text-violet-700">
                  <BarChart3 size={22} />
                  <div className="mt-3 text-lg font-black">{value}</div>
                  <div className="text-xs font-black uppercase">{label}</div>
                </div>
              ))}
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-2xl font-black">Gateway Actions</h3>
              <div className="mt-5 grid grid-cols-2 gap-4">
                {gateway.actions.map((action, index) => (
                  <button
                    key={action}
                    onClick={() => index === 0 ? openTemplate(template) : saveCurrentView()}
                    className="rounded-2xl border border-slate-200 p-5 text-left text-sm font-black transition hover:border-violet-300 hover:bg-violet-50"
                  >
                    <CheckCircle2 className="mb-3 text-violet-600" size={20} />
                    {action}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-2xl font-black">Connected Workspace Areas</h3>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {["KPI Cards", "Trend Chart", "Map / Coverage", "Report Shortcuts", "Reports Center", "Exports", "Saved Views", "Scheduled Reports", "AI Insights"].map((item) => (
                  <ToggleRow key={item}>{item}</ToggleRow>
                ))}
              </div>
            </section>
          </main>

          <aside className="space-y-5">
            <RadioAiPanel
              title="Tab Sync AI"
              subtitle="Gateway synchronization"
              items={[
                `${tab} is now the active reporting context.`,
                `Default enterprise template: ${template.refId}.`,
                "All exports, report rows, shortcuts and saved views inherit this context.",
              ]}
            />
            <div className="rounded-[28px] border border-slate-200 p-5">
              <h3 className="text-lg font-black">Default Template</h3>
              <div className="mt-3 rounded-2xl bg-slate-50 p-4">
                <div className="text-sm font-black">{template.title}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">{template.reportType}</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function AdvancedReportFiltersModal({
  onClose,
  scoreBand,
  setScoreBand,
  ownerFilter,
  setOwnerFilter,
  confidentialityFilter,
  setConfidentialityFilter,
  saveCurrentView,
}: {
  onClose: () => void
  scoreBand: string
  setScoreBand: (value: string) => void
  ownerFilter: string
  setOwnerFilter: (value: string) => void
  confidentialityFilter: string
  setConfidentialityFilter: (value: string) => void
  saveCurrentView: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-[1180px] overflow-y-auto rounded-[38px] border border-white/70 bg-white shadow-2xl">
        <header className="relative overflow-hidden rounded-t-[38px] bg-gradient-to-r from-slate-950 via-violet-800 to-blue-700 p-7 text-white">
          <Filter className="absolute -right-10 -top-10 opacity-15" size={220} />
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Reports Gateway Control</div>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Advanced Filters</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold text-white/80">Filter reports by performance band, owner, confidentiality, proof quality and execution status. These filters sync the report center, shortcuts, exports and saved views.</p>
            </div>
            <div className="flex gap-2 rounded-3xl border border-white/25 bg-slate-950/30 p-2">
              <button onClick={() => { saveCurrentView(); onClose() }} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950">Apply & Save View</button>
              <button onClick={onClose} className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-black text-white">Close</button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-[1.2fr_0.8fr] gap-6 p-7">
          <main className="space-y-6">
            <section className="rounded-[30px] border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-2xl font-black">Filter Gateway</h3>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <SelectField label="Score Band" value={scoreBand} onChange={setScoreBand} options={["All Scores", "Elite 90+", "Strong 75-89", "Recovery <75"]} />
                <SelectField label="Owner" value={ownerFilter} onChange={setOwnerFilter} options={["All Owners", "Operations", "Regional Manager", "Field Operations", "Market Intelligence", "Finance", "Quality Control", "Recruitment", "Training Academy", "Direction Rabat"]} />
                <SelectField label="Confidentiality" value={confidentialityFilter} onChange={setConfidentialityFilter} options={["All Confidentiality", "Internal", "Management", "Restricted", "Finance Controlled"]} />
              </div>
            </section>

            <section className="grid grid-cols-3 gap-4">
              {["Proof validated only", "Exportable reports only", "Include single ambassador reports", "Scheduled reports only", "Reports with action plan", "Reports requiring approval"].map((item) => (
                <ToggleRow key={item}>{item}</ToggleRow>
              ))}
            </section>
          </main>

          <aside className="space-y-5">
            <RadioAiPanel
              title="Filter Sync AI"
              subtitle="Workspace connection status"
              items={[
                "Saved views preserve tab, region, city, group and advanced filters.",
                "Report center rows, shortcuts and exports respect the active gateway.",
                "Use confidentiality filters before sharing or exporting management reports.",
              ]}
            />
            <div className="rounded-[28px] border border-slate-200 p-5">
              <h3 className="text-lg font-black">Connected Areas</h3>
              {["Top tabs", "KPI cards", "Reports center", "Shortcuts", "Exports", "Scheduled reports"].map((x) => (
                <div key={x} className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black">{x}</div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function MoroccoReportMap() {
  return (
    <div className="relative h-[285px] overflow-hidden rounded-[26px] bg-violet-50">
      <div className="absolute left-[80px] top-[32px] h-[225px] w-[330px] rotate-[-18deg] rounded-[38%_62%_45%_55%] bg-violet-100/90" />
      {[["82%","Tangier","left-[285px] top-[18px]"],["76%","Rabat","left-[210px] top-[72px]"],["91%","Casablanca","left-[130px] top-[120px]"],["72%","Fès","left-[295px] top-[120px]"],["88%","Oujda","left-[390px] top-[108px]"],["85%","Marrakech","left-[235px] top-[205px]"],["69%","Agadir","left-[100px] top-[235px]"]].map(([v,c,p]) => (
        <button key={c} onClick={() => alert(`${c} coverage opened`)} className={`absolute ${p} flex items-center gap-2`}>
          <div className="grid h-14 w-14 place-items-center rounded-full border border-violet-200 bg-white text-base font-black text-violet-700 shadow-lg">{v}</div>
          <div className="text-xs font-black text-slate-600">{c}</div>
        </button>
      ))}
      <div className="absolute bottom-3 left-5 flex items-center gap-2 text-xs font-black text-slate-500"><span>0%</span><div className="h-2 w-28 rounded-full bg-gradient-to-r from-violet-200 to-violet-700"/><span>100%</span></div>
    </div>
  )
}

export default function AmbassadorReportsCommandCenter() {
  const [tab, setTab] = useState<ReportTab>("Ambassadors")
  const [activeModal, setActiveModal] = useState<WorkspaceModal>(null)
  const [activeTemplate, setActiveTemplate] = useState<ReportTemplate>(templates[0])
  const [selectedAmbassadorReport, setSelectedAmbassadorReport] = useState<typeof reportAmbassadors[number] | null>(null)
  const [reportCenterTab, setReportCenterTab] = useState<"All Reports" | "My Reports" | "Shared With Me" | "Favorites">("All Reports")
  const [actionStatus, setActionStatus] = useState("")
  const [favoriteReports, setFavoriteReports] = useState<Record<string, boolean>>({})
  const [region, setRegion] = useState("All Regions")
  const [city, setCity] = useState("All Cities")
  const [group, setGroup] = useState("All Groups")
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  const [tabControlOpen, setTabControlOpen] = useState(false)
  const [scoreBand, setScoreBand] = useState("All Scores")
  const [ownerFilter, setOwnerFilter] = useState("All Owners")
  const [confidentialityFilter, setConfidentialityFilter] = useState("All Confidentiality")
  const [savedView, setSavedView] = useState("")
  const [enabledReports, setEnabledReports] = useState<Record<string, boolean>>({
    weekly: true,
    monthly: true,
    regional: false,
    incentives: true,
  })

  const visibleTemplates = useMemo(() => {
    let rows = tab === "Ambassadors" ? templates : templates.filter((t) => t.category === tab || t.category === "Performance")
    if (ownerFilter !== "All Owners") rows = rows.filter((t) => t.owner === ownerFilter)
    if (confidentialityFilter !== "All Confidentiality") rows = rows.filter((t) => t.confidentiality === confidentialityFilter)
    return rows
  }, [tab, ownerFilter, confidentialityFilter])

  const tabGateway = {
    Ambassadors: {
      template: "single-ambassador-360",
      title: "Ambassador Reporting Gateway",
      summary: "Individual profiles, network status, one-by-one 360 reports and ambassador governance.",
      actions: ["Open Single Ambassador 360", "Generate network board", "Review recruitment pipeline", "Export ambassador register"],
    },
    Missions: {
      template: "mission-analytics",
      title: "Mission Reporting Gateway",
      summary: "Mission completion, route analytics, execution bottlenecks and field deployment decisions.",
      actions: ["Open mission analytics", "Review blocked missions", "Export route performance", "Create mission action plan"],
    },
    Coverage: {
      template: "coverage-reach",
      title: "Coverage Reporting Gateway",
      summary: "Regional coverage, city density, expansion gaps and territory deployment decisions.",
      actions: ["Open coverage map", "Generate expansion report", "Review low coverage cities", "Create territory sprint"],
    },
    Performance: {
      template: "ambassador-performance",
      title: "Performance Reporting Gateway",
      summary: "Leaderboard, score movement, coaching queue, proof quality and performance decisions.",
      actions: ["Open performance board", "Create coaching report", "Review recovery profiles", "Export scorecard"],
    },
    Incentives: {
      template: "incentives",
      title: "Incentives Reporting Gateway",
      summary: "Payout eligibility, proof locks, finance approvals and reward governance.",
      actions: ["Open finance report", "Review held payouts", "Export payout file", "Create approval log"],
    },
    Activities: {
      template: "activity-summary",
      title: "Activities Reporting Gateway",
      summary: "Visits, check-ins, surveys, training, events and execution velocity.",
      actions: ["Open activity summary", "Review low activity profiles", "Export activity log", "Create recovery tasks"],
    },
    Compliance: {
      template: "compliance",
      title: "Compliance Reporting Gateway",
      summary: "Proof quality, GPS evidence, exceptions, overrides and compliance assurance.",
      actions: ["Open proof audit", "Review exceptions", "Export compliance pack", "Create audit tasks"],
    },
  } as const

  function activateReportTab(nextTab: ReportTab) {
    setTab(nextTab)
    const gateway = tabGateway[nextTab]
    const template = templates.find((t) => t.id === gateway.template) || templates[0]
    setActiveTemplate(template)
    setActionStatus(`${gateway.title} opened. KPIs, templates, reports center, shortcuts and exports are synced to ${nextTab}.`)
  }

  function openTabControl(nextTab: ReportTab) {
    activateReportTab(nextTab)
    setTabControlOpen(true)
  }

  function openTemplate(template: ReportTemplate) {
    setActiveTemplate(template)
    setActiveModal("template")
  }

  function quickTemplate(id: ReportTemplateId) {
    const template = templates.find((t) => t.id === id) || templates[0]
    openTemplate(template)
  }

  function exportWorkspaceCsv() {
    const rows = [
      ["Reference ID", "Template", "Type", "Category", "Owner", "Confidentiality", "Frequency", "Purpose"],
      ...templates.map((t) => [t.refId, t.title, t.reportType, t.category, t.owner, t.confidentiality, t.frequency, t.purpose]),
    ]
    downloadFile("angelcare-reports-workspace.csv", rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n"), "text/csv")
  }

  function saveCurrentView() {
    const view = `Saved view: ${tab} · ${region} · ${city} · ${group} · ${scoreBand} · ${ownerFilter}`
    setSavedView(view)
    setActionStatus(`${view}. Reports center, shortcuts and exports are now synced to this view.`)
  }

  function clearReportFilters() {
    setRegion("All Regions")
    setCity("All Cities")
    setGroup("All Groups")
    setScoreBand("All Scores")
    setOwnerFilter("All Owners")
    setConfidentialityFilter("All Confidentiality")
    setSavedView("")
    setActionStatus("Report filters cleared. Workspace reset to all reports.")
  }

  function openAdvancedFilters() {
    setAdvancedFiltersOpen(true)
    setActionStatus("Advanced report filters opened.")
  }

  function visibleReportRows() {
    let rows = visibleTemplates
    if (reportCenterTab === "My Reports") rows = rows.filter((t) => ["Operations", "Finance", "Direction Rabat"].includes(t.owner))
    if (reportCenterTab === "Shared With Me") rows = rows.filter((t) => t.confidentiality !== "Restricted")
    if (reportCenterTab === "Favorites") rows = rows.filter((t) => favoriteReports[t.id])
    return rows
  }

  function downloadTemplateReport(template: ReportTemplate) {
    downloadFile(`${template.exportName}.html`, buildReportHtml(template), "text/html")
    setActionStatus(`${template.refId} exported as PDF-ready HTML. Open it and use Print → Save as PDF.`)
  }

  function shareTemplateReport(template: ReportTemplate) {
    const shareText = `${template.title} (${template.refId}) is ready for review. Owner: ${template.owner}. Type: ${template.reportType}.`
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareText)
    }
    setActionStatus(`Share package prepared for ${template.refId}. Summary copied when browser permission allows it.`)
  }

  function duplicateTemplateReport(template: ReportTemplate) {
    setActionStatus(`Duplicate created in workspace draft mode: ${template.refId}-COPY. Open the template to rename and export.`)
    setActiveTemplate(template)
    setActiveModal("template")
  }

  function toggleFavoriteReport(template: ReportTemplate) {
    setFavoriteReports((prev) => ({ ...prev, [template.id]: !prev[template.id] }))
    setActionStatus(`${template.refId} ${favoriteReports[template.id] ? "removed from" : "added to"} Favorites.`)
  }

  const kpiCards = [
    ["Total Ambassadors", "1,248", Users, "bg-violet-100 text-violet-700", "↑ 12% vs Apr 1 – Apr 30"],
    ["Active Ambassadors", "1,089", Users, "bg-emerald-100 text-emerald-700", "↑ 9% vs Apr 1 – Apr 30"],
    ["Missions Completed", "2,156", ClipboardCheck, "bg-blue-100 text-blue-700", "↑ 18% vs Apr 1 – Apr 30"],
    ["Total Visits", "3,847", Activity, "bg-orange-100 text-orange-700", "↑ 14% vs Apr 1 – Apr 30"],
    ["Tasks Completed", "6,421", CheckCircle2, "bg-emerald-100 text-emerald-700", "↑ 21% vs Apr 1 – Apr 30"],
    ["Incentives Paid", "1.28M MAD", Wallet, "bg-orange-100 text-orange-700", "↑ 15% vs Apr 1 – Apr 30"],
    ["Avg. Performance Score", "86/100", LineChart, "bg-violet-100 text-violet-700", "↑ 6 pts vs Apr 1 – Apr 30"],
  ]

  return (
    <div className="flex min-h-screen bg-white text-slate-950">
      <AmbassadorMarketSidebar />

      <main className="flex-1 bg-white px-8 py-7">
        <header className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[30px] font-black tracking-tight">Reports Command Center</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Track performance, measure impact and drive decisions with exportable McKinsey-style reports and live operating templates.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportWorkspaceCsv} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black shadow-sm"><Download size={16}/> Export CSV</button>
            <button onClick={() => openTemplate(templates[0])} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-violet-100"><Plus size={16}/> Create Report</button>
          </div>
        </header>

        <nav className="mb-5 flex gap-6 border-b border-slate-200">
          {(["Ambassadors", "Missions", "Coverage", "Performance", "Incentives", "Activities", "Compliance"] as ReportTab[]).map((item) => (
            <button
              key={item}
              onClick={() => activateReportTab(item)}
              onDoubleClick={() => openTabControl(item)}
              className={`border-b-2 px-1 pb-4 text-sm font-black transition ${tab === item ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-violet-700"}`}
            >
              {item}
            </button>
          ))}
        </nav>

        <section className="mb-5 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-black text-violet-800">{tabGateway[tab].title}</div>
              <div className="mt-1 text-xs font-semibold text-slate-600">{tabGateway[tab].summary}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openTemplate(activeTemplate)} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white">Open Active Template</button>
              <button onClick={() => setTabControlOpen(true)} className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-xs font-black text-violet-700">Gateway Control</button>
              <button onClick={saveCurrentView} className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-xs font-black text-violet-700">Save Tab View</button>
            </div>
          </div>
        </section>

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-[0.75fr_repeat(3,0.55fr)_0.65fr_1fr_0.55fr_0.5fr] gap-4">
            <button onClick={() => setActionStatus("Date gateway active: May 1 – May 31, 2025. All report exports use this period.")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black hover:border-violet-300 hover:bg-violet-50"><Calendar size={16}/> May 1 – May 31, 2025</button>
            <SelectField label="" value={region} onChange={setRegion} options={["All Regions", "Casablanca-Settat", "Rabat-Salé-Kénitra", "Marrakech-Safi", "Souss-Massa", "Oriental"]} />
            <SelectField label="" value={city} onChange={setCity} options={["All Cities", "Casablanca", "Rabat", "Marrakech", "Agadir", "Oujda", "Tangier"]} />
            <SelectField label="" value={group} onChange={setGroup} options={["All Groups", "Elite Performers", "Top Performers", "Core Team", "Recovery"]} />
            <button onClick={openAdvancedFilters} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black hover:border-violet-300 hover:bg-violet-50"><Filter size={16}/> More Filters</button>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs font-black text-slate-500">{savedView || "No saved view yet"}</div>
            <button onClick={saveCurrentView} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black"><Save size={16}/> Save View</button>
            <button onClick={clearReportFilters} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700">Clear</button>
          </div>
        </section>

        <section className="grid grid-cols-7 gap-3">
          {kpiCards.map(([label, value, Icon, tint, meta]) => {
            const I = Icon as typeof Users
            return (
              <button key={label as string} onClick={() => openTemplate(templates[0])} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:bg-violet-50">
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

        <section className="mt-5 grid grid-cols-[1.25fr_0.9fr_0.75fr] gap-5">
          <button onClick={() => quickTemplate("ambassador-performance")} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-violet-300">
            <div className="flex items-center justify-between"><h2 className="font-black">Performance Over Time</h2><span className="rounded-xl border px-3 py-2 text-xs font-black">Performance Score</span></div>
            <div className="mt-5 h-[270px] rounded-2xl bg-gradient-to-t from-violet-50 to-white">
              <svg viewBox="0 0 620 250" className="h-full w-full">
                <defs><linearGradient id="reportFillWorking" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.28"/><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/></linearGradient></defs>
                <path d="M0,160 L40,145 L80,158 L120,120 L160,95 L200,125 L240,140 L280,128 L320,142 L360,112 L400,100 L440,118 L480,108 L520,132 L560,116 L600,82 L620,68 L620,250 L0,250 Z" fill="url(#reportFillWorking)"/>
                <polyline fill="none" stroke="#7c3aed" strokeWidth="4" points="0,160 40,145 80,158 120,120 160,95 200,125 240,140 280,128 320,142 360,112 400,100 440,118 480,108 520,132 560,116 600,82 620,68"/>
              </svg>
            </div>
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Coverage by Region</h2><button onClick={() => quickTemplate("coverage-reach")} className="rounded-xl border px-3 py-2 text-xs font-black">Coverage %</button></div>
            <MoroccoReportMap />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">Report Insights</h2>
            <div className="mt-6 space-y-5">
              {[
                ["Top Performing Region", "Casablanca-Settat · 91% Performance Score", Trophy, "bg-violet-100 text-violet-700"],
                ["Most Active Ambassadors", "Youssef El Fassi · 32 Missions Completed", Users, "bg-orange-100 text-orange-700"],
                ["Highest Growth", "Rabat-Salé-Kénitra · ↑ 18% vs last month", BarChart3, "bg-emerald-100 text-emerald-700"],
              ].map(([title, body, Icon, tint]) => {
                const I = Icon as typeof Trophy
                return <button key={title as string} onClick={() => setActiveModal("insights")} className="flex w-full gap-3 text-left"><div className={`grid h-12 w-12 place-items-center rounded-2xl ${tint as string}`}><I size={20}/></div><div><div className="text-sm font-black">{title as string}</div><div className="text-xs font-semibold text-slate-500">{body as string}</div></div></button>
              })}
            </div>
            <button onClick={() => setActiveModal("insights")} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-violet-600">View all insights <ArrowRight size={14}/></button>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-[1.25fr_0.9fr_0.75fr] gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-black">Top Performing Ambassadors</h2><button onClick={() => quickTemplate("ambassador-performance")} className="text-sm font-black text-violet-600">View full report →</button></div>
            <table className="w-full text-left text-xs">
              <thead><tr className="border-b border-slate-200 text-slate-500"><th className="pb-3">#</th><th>Ambassador</th><th>Region</th><th>Missions</th><th>Visits</th><th>Tasks</th><th>Performance Score</th></tr></thead>
              <tbody>{topAmbassadors.map((a,i)=><tr key={a[0] as string} onClick={() => setSelectedAmbassadorReport(reportAmbassadors[i])} className="cursor-pointer border-b border-slate-100 hover:bg-violet-50"><td className="py-3">{i < 3 ? ["🥇","🥈","🥉"][i] : i+1}</td><td className="font-black underline-offset-4 hover:underline">{a[0]}</td><td>{a[1]}</td><td>{a[2]}</td><td>{a[3]}</td><td>{a[4]}</td><td><div className="flex items-center gap-2"><b>{a[5]}/100</b><span className="h-2 w-16 rounded-full bg-slate-100"><span className="block h-2 rounded-full bg-emerald-500" style={{width:`${a[5]}%`}} /></span></div></td></tr>)}</tbody>
            </table>
          </div>

          <button onClick={() => quickTemplate("mission-analytics")} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-violet-300">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-black">Missions by Type</h2><span className="text-sm font-black text-violet-600">View full report →</span></div>
            <div className="flex items-center gap-7">
              <div className="grid h-44 w-44 place-items-center rounded-full bg-[conic-gradient(#7c3aed_0_25%,#3b82f6_25%_45%,#10b981_45%_61%,#fb923c_61%_79%,#fb7185_79%_91%,#94a3b8_91%_100%)]">
                <div className="grid h-28 w-28 place-items-center rounded-full bg-white"><div className="text-center"><div className="text-3xl font-black">2,156</div><div className="text-xs font-bold text-slate-500">Total</div></div></div>
              </div>
              <div className="space-y-2 text-xs font-black text-slate-600">{["Promotions 25%", "Surveys 20%", "Events 18%", "Brand Awareness 16%", "Product Training 12%", "Other 9%"].map((x) => <div key={x} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-violet-500"/>{x}</div>)}</div>
            </div>
          </button>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-black">Report Shortcuts</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  ["Network Performance", "ambassador-performance", Users],
                  ["Single Ambassador 360", "single-ambassador-360", Users],
                  ["Mission Analytics", "mission-analytics", Target],
                  ["Coverage & Reach", "coverage-reach", MapPinned],
                  ["Activity Summary", "activity-summary", Activity],
                  ["Incentives Finance", "incentives", Gift],
                  ["Compliance Proof", "compliance", ShieldCheck],
                  ["Recruitment Pipeline", "recruitment-pipeline", Users],
                  ["Training Certification", "training-certification", ShieldCheck],
                  ["Territory ROI", "territory-profitability", BarChart3],
                ].map(([label, key, Icon]) => {
                  const I = Icon as typeof Users
                  return <button key={label as string} onClick={() => quickTemplate(key as ReportTemplateId)} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left text-xs font-black hover:border-violet-300 hover:bg-violet-50"><I className="text-violet-600" size={18}/>{label as string}</button>
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-black">Scheduled Reports</h2><button onClick={() => setActiveModal("schedule")} className="text-xs font-black text-violet-600">View all</button></div>
              {[
                ["weekly", "Weekly Performance Summary", "Every Monday at 09:00 AM"],
                ["monthly", "Monthly Ambassador Report", "1st of every month at 08:00 AM"],
                ["regional", "Regional Coverage Report", "15th of every month at 10:00 AM"],
                ["incentives", "Incentives & Rewards Report", "Last day of every month at 06:00 PM"],
              ].map(([key, title, body]) => (
                <div key={key} className="mb-4 flex items-center gap-3">
                  <FileText className="text-slate-400" size={18}/>
                  <button onClick={() => quickTemplate(key === "incentives" ? "incentives" : "ambassador-performance")} className="flex-1 text-left"><div className="text-xs font-black">{title}</div><div className="text-[11px] font-semibold text-slate-500">{body}</div></button>
                  <button onClick={() => setEnabledReports((v)=>({...v,[key]:!v[key]}))}>{enabledReports[key] ? <ToggleRight className="text-emerald-500" size={30}/> : <ToggleLeft className="text-slate-300" size={30}/>}</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        
        {actionStatus && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">
            {actionStatus}
          </div>
        )}

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-black">Single Ambassador Reports</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Generate one-by-one ambassador reports with unique reference IDs, task plan, comments, proof and incentive decision.</p>
            </div>
            <button onClick={() => quickTemplate("single-ambassador-360")} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white">Open 360 Template</button>
          </div>
          <div className="grid grid-cols-6 gap-3">
            {reportAmbassadors.map((ambassador) => (
              <button key={ambassador.id} onClick={() => setSelectedAmbassadorReport(ambassador)} className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-xs font-black text-violet-700">{ambassador.name.split(" ").map((x) => x[0]).slice(0,2).join("")}</div>
                <div className="mt-3 text-sm font-black">{ambassador.name}</div>
                <div className="text-[11px] font-bold text-slate-500">{ambassador.id} · {ambassador.city}</div>
                <div className="mt-3 flex items-center justify-between text-xs font-black"><span>{ambassador.score}/100</span><span className={ambassador.risk === "High" ? "text-rose-600" : "text-emerald-600"}>{ambassador.risk}</span></div>
              </button>
            ))}
          </div>
        </section>

<section className="mt-5 grid grid-cols-[1.25fr_0.75fr] gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-6">
              <h2 className="font-black">Reports Center</h2>
              {(["All Reports", "My Reports", "Shared With Me", "Favorites"] as const).map((x)=><button key={x} onClick={() => setReportCenterTab(x)} className={`border-b-2 pb-2 text-sm font-black ${reportCenterTab===x?"border-violet-600 text-violet-700":"border-transparent text-slate-500 hover:text-violet-700"}`}>{x}</button>)}
            </div>
            <table className="w-full text-left text-xs">
              <thead><tr className="border-b border-slate-200 text-slate-500"><th className="pb-3">Reference ID</th><th>Report Name</th><th>Type</th><th>Owner</th><th>Actions</th></tr></thead>
              <tbody>{visibleReportRows().map((r)=><tr key={r.id} className="border-b border-slate-100 hover:bg-violet-50"><td className="py-3 font-black text-violet-700">{r.refId}</td><td onClick={()=>openTemplate(r)} className="cursor-pointer font-black underline-offset-4 hover:underline">{r.title}</td><td>{r.reportType}</td><td>{r.owner}</td><td><div className="flex gap-3">
                <button title="Preview / open report workspace" onClick={()=>openTemplate(r)} className="rounded-lg p-1 hover:bg-violet-100"><Eye size={16}/></button>
                <button title="Export PDF-ready report" onClick={()=>downloadTemplateReport(r)} className="rounded-lg p-1 hover:bg-violet-100"><Download size={16}/></button>
                <button title="Share report package" onClick={()=>shareTemplateReport(r)} className="rounded-lg p-1 hover:bg-violet-100"><Share2 size={16}/></button>
                <button title="Favorite report" onClick={()=>toggleFavoriteReport(r)} className={`rounded-lg px-2 py-1 text-xs font-black hover:bg-violet-100 ${favoriteReports[r.id] ? "text-violet-700" : "text-slate-400"}`}>★</button>
                <button title="Duplicate and manage report" onClick={()=>duplicateTemplateReport(r)} className="rounded-lg p-1 hover:bg-violet-100"><MoreHorizontal size={16}/></button>
              </div></td></tr>)}</tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">Create Custom Report</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">Build a report tailored to your needs.</p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <button onClick={() => openTemplate(templates[0])} className="h-24 w-32 rounded-xl bg-violet-100 p-3"><BarChart3 className="text-violet-600" /></button>
              <button onClick={() => openTemplate(templates[2])} className="h-24 w-32 rounded-xl bg-violet-100 p-3"><PieChart className="text-violet-600" /></button>
            </div>
            <button onClick={() => openTemplate(templates[0])} className="mx-auto mt-8 flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white"><Plus size={16}/> New Custom Report</button>
          </div>
        </section>

        {activeModal === "template" && <TemplateWorkspaceModal template={activeTemplate} onClose={() => setActiveModal(null)} />}
        {activeModal === "insights" && <TemplateWorkspaceModal template={templates[2]} onClose={() => setActiveModal(null)} />}
        {activeModal === "schedule" && <TemplateWorkspaceModal template={templates[0]} onClose={() => setActiveModal(null)} />}
        {selectedAmbassadorReport && <SingleAmbassadorReportModal ambassador={selectedAmbassadorReport} onClose={() => setSelectedAmbassadorReport(null)} />}
        {tabControlOpen && (
          <ReportTabGatewayModal
            tab={tab}
            gateway={tabGateway[tab]}
            template={activeTemplate}
            onClose={() => setTabControlOpen(false)}
            openTemplate={openTemplate}
            saveCurrentView={saveCurrentView}
          />
        )}
        {advancedFiltersOpen && (
          <AdvancedReportFiltersModal
            onClose={() => setAdvancedFiltersOpen(false)}
            scoreBand={scoreBand}
            setScoreBand={setScoreBand}
            ownerFilter={ownerFilter}
            setOwnerFilter={setOwnerFilter}
            confidentialityFilter={confidentialityFilter}
            setConfidentialityFilter={setConfidentialityFilter}
            saveCurrentView={saveCurrentView}
          />
        )}
      </main>
    </div>
  )
}
