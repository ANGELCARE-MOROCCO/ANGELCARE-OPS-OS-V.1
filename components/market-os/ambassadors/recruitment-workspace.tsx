"use client"

import { useMemo, useState } from "react"
import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import {
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
  Grid2X2,
  Import,
  Mail,
  MapPinned,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap
} from "lucide-react"

type ModalKey =
  | "add"
  | "import"
  | "bulk-whatsapp"
  | "campaign"
  | "schedule"
  | "offers"
  | "report"
  | "map"
  | "strategy"
  | "prospect"
  | "columns"
  | "export"
  | null

const prospects = [
  { name: "Youssef Lahbabi", phone: "+212 6 12 34 56 78", city: "Casablanca", source: "MessageCircle", status: "Interested", score: 84, next: "Schedule Interview", owner: "Youssef El Fassi", last: "Today, 11:20 AM" },
  { name: "Fatima Ezzahra", phone: "+212 6 98 76 54 32", city: "Rabat", source: "Referral", status: "In Process", score: 78, next: "Send Offer", owner: "Fatima Zahra Ait", last: "Today, 10:15 AM" },
  { name: "Omar Benjelloun", phone: "+212 6 55 21 43 87", city: "Marrakech", source: "Walk-in", status: "Shortlisted", score: 72, next: "Interview", owner: "Omar Kabbaj", last: "Yesterday, 4:30 PM" },
  { name: "Imane Berada", phone: "+212 6 77 88 99 00", city: "Tangier", source: "WhatsApp", status: "Contacted", score: 62, next: "Follow Up", owner: "Imane Lahlou", last: "Yesterday, 2:10 PM" },
  { name: "Ahmed Tazi", phone: "+212 6 33 44 55 66", city: "Fes", source: "Facebook", status: "New", score: 48, next: "First Contact", owner: "Ahmed Benali", last: "May 30, 2025" },
]

const tabs = ["Pipeline Overview", "Outreach", "Prospects", "Interviews", "Shortlisted", "Offers", "Confirmed"] as const

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
          <div className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">AI RECRUITMENT SIGNAL ONLINE</div>
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
  onPrimaryAction,
  children,
  right,
}: {
  title: string
  subtitle: string
  icon: typeof Users
  action: string
  onClose: () => void
  onPrimaryAction?: () => void
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
                <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Angelcare Recruitment Domination</div>
                <h2 className="mt-2 text-3xl font-black tracking-tight">{title}</h2>
                <p className="mt-2 max-w-4xl text-sm font-semibold text-white/80">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/25 bg-slate-950/30 p-2 shadow-2xl backdrop-blur-md">
              <button
                onClick={onPrimaryAction}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-violet-50"
              >
                <CheckCircle2 size={17} />{action}
              </button>
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

function RecruitmentActionModal({
  active,
  onClose,
  onSave,
}: {
  active: ModalKey
  onClose: () => void
  onSave?: (payload: any) => void
}) {
  if (!active) return null

  const [prospectName, setProspectName] = useState("")
  const [prospectPhone, setProspectPhone] = useState("")
  const [prospectCity, setProspectCity] = useState("Casablanca")
  const [prospectSource, setProspectSource] = useState("MessageCircle")
  const [prospectStage, setProspectStage] = useState("New")
  const [prospectOwner, setProspectOwner] = useState("Recruitment Lead")
  const [prospectScore, setProspectScore] = useState("72")
  const [prospectNextAction, setProspectNextAction] = useState("First Contact")

  const [campaignName, setCampaignName] = useState("")
  const [campaignChannel, setCampaignChannel] = useState("WhatsApp")
  const [campaignAudience, setCampaignAudience] = useState("Interested prospects")
  const [campaignCity, setCampaignCity] = useState("All Morocco")
  const [campaignObjective, setCampaignObjective] = useState("Book interviews")
  const [campaignMessage, setCampaignMessage] = useState("Bonjour, Angelcare recrute des ambassadeurs terrain. Êtes-vous disponible pour un court échange cette semaine ?")
  const [campaignOwner, setCampaignOwner] = useState("Recruitment Lead")
  const [campaignSchedule, setCampaignSchedule] = useState("Today 18:00")
  const [modalTab, setModalTab] = useState("Command")

  function saveProspectLive() {
    const name = prospectName.trim() || "New Prospect"
    onSave?.({
      type: "prospect",
      data: {
        name,
        phone: prospectPhone.trim() || "+212 6 00 00 00 00",
        city: prospectCity,
        source: prospectSource,
        status: prospectStage,
        score: Number(prospectScore) || 72,
        next: prospectNextAction,
        owner: prospectOwner,
        last: "Just now",
      },
    })
  }

  function saveOutreachLive() {
    onSave?.({
      type: "outreach",
      data: {
        name: campaignName.trim() || "New Outreach Campaign",
        channel: campaignChannel,
        audience: campaignAudience,
        city: campaignCity,
        objective: campaignObjective,
        owner: campaignOwner,
        schedule: campaignSchedule,
        message: campaignMessage,
        status: "Scheduled",
        createdAt: "Just now",
      },
    })
  }

  const ModalTabs = ({ tabs }: { tabs: string[] }) => (
    <div className="sticky top-0 z-10 mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setModalTab(tab)}
            className={`relative rounded-2xl px-5 py-3 text-sm font-black transition ${modalTab === tab ? "bg-violet-600 text-white shadow-lg shadow-violet-100" : "text-slate-700 hover:bg-violet-50 hover:text-violet-700"}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-black text-slate-500">
        Active workspace: <span className="text-violet-700">{modalTab}</span> · all controls below are synced to this step.
      </div>
    </div>
  )

  const ControlPill = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-black text-slate-950">{value}</div>
    </div>
  )

  const TabExecutionPanel = ({ type }: { type: "prospect" | "campaign" }) => {
    const prospectMap: Record<string, { title: string; objective: string; controls: string[]; outputs: string[] }> = {
      Command: { title: "Command Summary", objective: "Create one accountable prospect record with owner, SLA, score, next action and onboarding path.", controls: ["Reference generated", "Owner assigned", "Pipeline stage selected", "Next action created", "Live save enabled"], outputs: ["Pipeline row", "Recruitment task", "Owner notification", "Audit trail"] },
      Identity: { title: "Identity & Contact Quality", objective: "Capture clean identity, phone, WhatsApp, backup contact, city and source attribution.", controls: ["Phone checked", "WhatsApp available", "Duplicate scan", "Source attribution", "City mapped"], outputs: ["Verified contact", "Source ROI update", "City signal"] },
      Qualification: { title: "Qualification & Domination Fit", objective: "Score candidate potential for coverage, B2B access, influence and field readiness.", controls: ["City demand", "B2B access", "Availability", "Communication quality", "Mobility signal"], outputs: ["Fit score", "Priority band", "Recommended stage"] },
      Risk: { title: "Risk, Consent & Compliance", objective: "Control data quality, contact permission and manager review before outreach or offer.", controls: ["Consent recorded", "Blacklist check", "Duplicate check", "Manager review", "Document request"], outputs: ["Risk status", "Compliance gate", "Hold reason"] },
      Interview: { title: "Interview Readiness", objective: "Prepare interview path, scorecard, interviewer assignment and deadline.", controls: ["Interview type", "Scorecard ready", "Interviewer assigned", "Calendar slot", "Decision deadline"], outputs: ["Interview task", "Candidate reminder", "Decision SLA"] },
      Offer: { title: "Offer Route", objective: "Choose offer path and conversion trigger from interested candidate to accepted ambassador.", controls: ["Offer route", "Terms confirmed", "Acceptance deadline", "Message template", "Rejection reason"], outputs: ["Offer package", "WhatsApp queue", "Acceptance tracker"] },
      Onboarding: { title: "Onboarding Handoff", objective: "Convert confirmed prospect into a structured onboarding journey.", controls: ["Journey rule", "Training path", "Documents gate", "Manager owner", "First task"], outputs: ["Onboarding journey", "Checklist", "Manager assignment"] },
      Automation: { title: "Automation & Sync", objective: "Make record live across table, reports, reminders, tasks and management view.", controls: ["Save live", "Create next task", "Update KPIs", "Sync report", "Archive audit"], outputs: ["Live row", "Status banner", "CSV-ready data", "Dashboard signal"] },
    }
    const campaignMap: Record<string, { title: string; objective: string; controls: string[]; outputs: string[] }> = {
      Command: { title: "Campaign Command", objective: "Define campaign objective, owner, channel, audience and conversion target.", controls: ["Objective selected", "Owner assigned", "Schedule set", "Target volume", "Conversion KPI"], outputs: ["Campaign record", "Owner task", "Execution status"] },
      Audience: { title: "Audience Segmentation", objective: "Target the right prospects without messaging confirmed candidates or wrong territories.", controls: ["Segment selected", "Duplicate removed", "Confirmed excluded", "City pressure matched", "Score band applied"], outputs: ["Clean audience", "Expected reach", "Safe send list"] },
      Message: { title: "Message & Script", objective: "Prepare WhatsApp/DM copy with variants, CTA and Angelcare positioning.", controls: ["Primary script", "Variant A/B", "CTA", "Language", "Objection response"], outputs: ["Message pack", "A/B test", "Follow-up copy"] },
      Sequence: { title: "Follow-up Sequence", objective: "Automate first message, 24h reminder, final reminder and next actions.", controls: ["Send window", "24h follow-up", "Final reminder", "Stop rules", "Reply routing"], outputs: ["Reminder queue", "Interview rules", "Recovery list"] },
      Territory: { title: "Territory Pressure", objective: "Use campaigns to solve Moroccan coverage gaps, not random volume.", controls: ["City gap", "Coverage target", "Recruiter owner", "Local source", "Weekly target"], outputs: ["Territory sprint", "Coverage KPI", "Domination score"] },
      Compliance: { title: "Compliance & Brand Safety", objective: "Control consent, frequency, opt-out, privacy and brand tone.", controls: ["Consent filter", "Frequency cap", "Opt-out rule", "Approved wording", "Data archive"], outputs: ["Safe send list", "Audit log", "Compliance note"] },
      Analytics: { title: "Campaign Analytics", objective: "Track delivery, replies, interested prospects, interviews, offers and confirmed ambassadors.", controls: ["Delivery rate", "Reply rate", "Interview rate", "Offer rate", "Confirmed rate"], outputs: ["ROI panel", "Report line", "Source performance"] },
      Automation: { title: "Automation & Live Sync", objective: "Save campaign, create queues, update status and prepare reporting.", controls: ["Save live", "Create task queue", "Sync KPIs", "Generate report", "Archive campaign"], outputs: ["Live campaign", "Status banner", "Report-ready data"] },
    }
    const data = type === "prospect" ? prospectMap[modalTab] || prospectMap.Command : campaignMap[modalTab] || campaignMap.Command
    return (
      <section className="rounded-[30px] border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-slate-50 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">{type === "prospect" ? "Prospect Step" : "Campaign Step"} · {modalTab}</div>
            <h3 className="mt-2 text-2xl font-black text-slate-950">{data.title}</h3>
            <p className="mt-2 max-w-4xl text-sm font-semibold text-slate-600">{data.objective}</p>
          </div>
          <span className="rounded-full bg-violet-600 px-4 py-2 text-xs font-black text-white">Production Gate</span>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_0.8fr] gap-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h4 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Required controls</h4>
            <div className="mt-4 grid grid-cols-2 gap-3">{data.controls.map((item) => <ToggleRow key={item}>{item}</ToggleRow>)}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h4 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Synced outputs</h4>
            <div className="mt-4 grid grid-cols-2 gap-3">{data.outputs.map((item) => <ControlPill key={item} label="Output" value={item} />)}</div>
          </div>
        </div>
      </section>
    )
  }

  const config: Record<string, { title: string; subtitle: string; icon: typeof Users; action: string; ai: string[]; sections: string[] }> = {
    add: {
      title: "Add Prospect · Full Recruitment Profile",
      subtitle: "Create a serious live prospect record covering identity, contact, source, city need, scoring, interview readiness, documents, WhatsApp path, owner, SLA and next action.",
      icon: UserPlus,
      action: "Save Prospect",
      ai: ["Prioritize prospects from cities with coverage gaps.", "Auto-create next action after saving.", "High-score prospects should jump directly to interview scheduling."],
      sections: ["Identity verified", "Source captured", "City need mapped", "Owner assigned", "Next action created"],
    },
    import: {
      title: "Import Prospects",
      subtitle: "Bulk import prospects with duplicate detection, source mapping, owner assignment and city domination scoring.",
      icon: Import,
      action: "Validate Import",
      ai: ["Deduplicate by phone before import.", "Auto-map city and source fields.", "Create campaigns for imported cohorts."],
      sections: ["Column mapping", "Duplicate scan", "Phone validation", "Owner routing", "Import audit"],
    },
    "bulk-whatsapp": {
      title: "Bulk WhatsApp Outreach",
      subtitle: "Send segmented WhatsApp outreach messages by stage, city, source and candidate readiness.",
      icon: MessageCircle,
      action: "Launch WhatsApp Batch",
      ai: ["Use short message variants for cold prospects.", "Schedule follow-up after 24h.", "Do not message confirmed candidates."],
      sections: ["Audience segment", "Message template", "Timing window", "A/B variant", "Response tracking"],
    },
    campaign: {
      title: "New Outreach · Campaign Execution Builder",
      subtitle: "Build a live outreach campaign with audience segmentation, WhatsApp/script content, channel mix, territory pressure, owner, timing, compliance checks and conversion tracking.",
      icon: Zap,
      action: "Create Campaign",
      ai: ["Campaigns should target city gaps first.", "Use MessageCircle for volume and referrals for quality.", "Every campaign must have conversion target."],
      sections: ["Campaign objective", "Channel mix", "Target city", "Budget cap", "Conversion goal"],
    },
    schedule: {
      title: "Schedule Interviews",
      subtitle: "Batch schedule interviews, assign interviewers, prepare scorecards and notify prospects.",
      icon: Calendar,
      action: "Schedule Interviews",
      ai: ["Interview high-score prospects first.", "Use one scorecard for all interviewers.", "No offer without interview decision."],
      sections: ["Interview slots", "Interviewer owner", "Scorecard", "Prospect notification", "Decision deadline"],
    },
    offers: {
      title: "Send Offers",
      subtitle: "Generate and send ambassador offer packages with acceptance tracking and onboarding handoff.",
      icon: Send,
      action: "Send Offers",
      ai: ["Offers must include training and proof rules.", "Acceptance should auto-create onboarding journey.", "Track rejection reasons."],
      sections: ["Offer template", "Acceptance deadline", "Onboarding link", "WhatsApp delivery", "Status tracking"],
    },
    report: {
      title: "Recruitment Report",
      subtitle: "Generate an enterprise recruitment report with funnel, channels, territories, performers, risks and action plan.",
      icon: FileText,
      action: "Generate Report",
      ai: ["Report must answer where to source next.", "Include source ROI and city gaps.", "End with action owners."],
      sections: ["Funnel summary", "Channel ROI", "Territory gaps", "Performer ranking", "Action plan"],
    },
    map: {
      title: "Domination Map",
      subtitle: "Open the recruitment domination map to plan coverage, territory pressure and source intensity.",
      icon: MapPinned,
      action: "Open Map Strategy",
      ai: ["Recruitment pressure should follow coverage gaps.", "Casablanca has volume, Agadir needs urgency.", "Source strategy must vary by territory."],
      sections: ["City pressure", "Source intensity", "Recruiter owner", "Coverage gap", "Weekly target"],
    },
    prospect: {
      title: "Prospect 360 Profile",
      subtitle: "Review, score, message, schedule and move a prospect through the pipeline.",
      icon: Users,
      action: "Save Prospect",
      ai: ["Move the prospect only with next action owner.", "Missing phone blocks WhatsApp.", "Interview-ready prospects should not stay in Interested."],
      sections: ["Profile", "Score", "History", "Messages", "Next action"],
    },
    columns: {
      title: "Pipeline Columns",
      subtitle: "Customize visible pipeline columns, saved views and manager reporting structure.",
      icon: Grid2X2,
      action: "Save Columns",
      ai: ["Keep only columns useful for action.", "Owner and next action should remain visible.", "Saved views should match manager responsibilities."],
      sections: ["Visible fields", "Pinned columns", "Saved view", "Export fields", "Manager view"],
    },
    export: {
      title: "Export Recruitment Workspace",
      subtitle: "Export filtered prospects, pipeline stage, owner, score, next action and source channel.",
      icon: Download,
      action: "Generate Export",
      ai: ["Export only current scope.", "Do not include private notes unless approved.", "Archive every export."],
      sections: ["Scope", "Fields", "Format", "Permission", "Archive"],
    },
    strategy: {
      title: "Angelcare Domination Strategy",
      subtitle: "Create the recruitment domination strategy to expand presence, attract talent and dominate every territory.",
      icon: Trophy,
      action: "Create Strategy",
      ai: ["Domination requires city-specific source strategy.", "Recruitment should serve growth and coverage, not vanity volume.", "Weekly targets must connect to onboarded ambassadors."],
      sections: ["Territory targets", "Source strategy", "Recruiter owners", "Campaign calendar", "Growth score"],
    },
  }

  const c = config[active] || config.add
  return (
    <ModalShell
      title={c.title}
      subtitle={c.subtitle}
      icon={c.icon}
      action={c.action}
      onClose={onClose}
      onPrimaryAction={active === "add" ? saveProspectLive : active === "campaign" ? saveOutreachLive : undefined}
      right={<><RadioAiPanel title={`${c.title} AI`} subtitle="Recruitment execution guidance" items={c.ai} /><div className="rounded-[28px] border border-slate-200 bg-white p-5"><h3 className="text-lg font-black">Production Controls</h3><div className="mt-4 space-y-3">{c.sections.map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}</div></div></>}>
      {active === "add" ? (
        <>
          <ModalTabs tabs={["Command", "Identity", "Qualification", "Risk", "Interview", "Offer", "Onboarding", "Automation"]} />
          <TabExecutionPanel type="prospect" />
          <section className="rounded-[34px] border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-600">AC-MOS-REC-PROSPECT-LIVE</div>
                <h3 className="mt-2 text-2xl font-black">Prospect 360 Command Profile</h3>
                <p className="mt-2 max-w-4xl text-sm font-semibold text-slate-600">This creates the operational recruitment object used by pipeline, WhatsApp, interview scheduling, domination map, owner tasks and onboarding handoff.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <ControlPill label="Fit score" value={prospectScore || "72"} />
                <ControlPill label="SLA" value="24h" />
                <ControlPill label="Sync" value="Live" />
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black">Prospect Identity & Contact</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">This record is saved live into the page state and appears immediately in the pipeline.</p>
              </div>
              <span className="rounded-full bg-violet-100 px-4 py-2 text-xs font-black text-violet-700">AC-MOS-REC-PROSPECT-LIVE</span>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-4">
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Full name</span><input value={prospectName} onChange={(e) => setProspectName(e.target.value)} placeholder="Candidate full name" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400" /></label>
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Phone / WhatsApp</span><input value={prospectPhone} onChange={(e) => setProspectPhone(e.target.value)} placeholder="+212 6 ..." className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400" /></label>
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">City</span><select value={prospectCity} onChange={(e) => setProspectCity(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400">{["Casablanca","Rabat","Marrakech","Tangier","Fes","Agadir","Oujda"].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Source</span><select value={prospectSource} onChange={(e) => setProspectSource(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400">{["MessageCircle","Referral","WhatsApp","Facebook","Walk-in","Partner Network","Field Event"].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Stage</span><select value={prospectStage} onChange={(e) => setProspectStage(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400">{["New","Contacted","Interested","In Process","Shortlisted","Confirmed"].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Owner</span><select value={prospectOwner} onChange={(e) => setProspectOwner(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400">{["Recruitment Lead","Youssef El Fassi","Fatima Zahra Ait","Regional Manager","HR Ops"].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Score</span><input value={prospectScore} onChange={(e) => setProspectScore(e.target.value)} placeholder="0-100" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400" /></label>
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Next Action</span><select value={prospectNextAction} onChange={(e) => setProspectNextAction(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400">{["First Contact","Follow Up","Schedule Interview","Send Offer","Assign Recruiter","Request Documents"].map((x) => <option key={x}>{x}</option>)}</select></label>
            </div>
          </section>

          <section className="grid grid-cols-4 gap-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black">Domination Fit Matrix</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[["City demand","High"],["B2B access","Strong"],["Influence","Medium"],["Speed","48h"],["Language","FR/AR"],["Mobility","Verified"]].map(([a,b]) => <ControlPill key={a} label={a} value={b} />)}
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black">Qualification Cases</h3>
              <div className="mt-4 space-y-3">{["B2B preschool network", "Parent community influence", "Field availability confirmed", "Can handle WhatsApp follow-up", "Has city coverage value", "Ready for interview"].map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black">Risk & Compliance</h3>
              <div className="mt-4 space-y-3">{["Phone verified", "Consent to contact", "Duplicate checked", "Documents pending", "No blacklist signal", "Manager review needed"].map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black">Interview / Offer Route</h3>
              <div className="mt-4 space-y-3">{["Phone screening", "Video interview", "Fast-track interview", "Standard offer", "Training-first route", "Manager approval route"].map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
            </div>
            <div className="rounded-[28px] border border-violet-200 bg-violet-50 p-5">
              <h3 className="text-lg font-black text-violet-900">Live Save Control</h3>
              <textarea className="h-32 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none" placeholder="Recruiter notes, objections, availability, decision reason..." />
              <button onClick={saveProspectLive} className="mt-4 w-full rounded-2xl bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-100">Save Prospect Live + Create Next Action</button>
            </div>
          </section>
        </>
      ) : active === "campaign" ? (
        <>
          <ModalTabs tabs={["Command", "Audience", "Message", "Sequence", "Territory", "Compliance", "Analytics", "Automation"]} />
          <TabExecutionPanel type="campaign" />
          <section className="rounded-[34px] border border-violet-200 bg-gradient-to-br from-slate-950 via-violet-900 to-blue-700 p-6 text-white shadow-xl">
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-200">AC-MOS-REC-OUTREACH-LIVE</div>
                <h3 className="mt-2 text-2xl font-black">Outreach Domination Control Plane</h3>
                <p className="mt-2 max-w-4xl text-sm font-semibold text-white/75">Control audience, city pressure, WhatsApp script, follow-up sequence, owner tasks, compliance, source ROI and conversion targets.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[["Audience", campaignAudience], ["Channel", campaignChannel], ["Objective", campaignObjective]].map(([a,b]) => <div key={a} className="rounded-2xl bg-white/10 px-4 py-3"><div className="text-sm font-black">{b}</div><div className="text-[10px] font-black uppercase text-white/50">{a}</div></div>)}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black">Outreach Campaign Builder</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Saved campaigns sync live to the recruitment workspace state and trigger execution status.</p>
              </div>
              <span className="rounded-full bg-violet-100 px-4 py-2 text-xs font-black text-violet-700">AC-MOS-REC-OUTREACH-LIVE</span>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-4">
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Campaign Name</span><input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="May WhatsApp conversion sprint" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400" /></label>
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Channel</span><select value={campaignChannel} onChange={(e) => setCampaignChannel(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400">{["WhatsApp","MessageCircle DM","Phone Calls","Referral Push","Field Event","Partner Network"].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Audience</span><select value={campaignAudience} onChange={(e) => setCampaignAudience(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400">{["New prospects","Contacted not replied","Interested prospects","Interview-ready prospects","Agadir urgent gap","Referral candidates"].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Territory</span><select value={campaignCity} onChange={(e) => setCampaignCity(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400">{["All Morocco","Casablanca","Rabat","Marrakech","Tangier","Fes","Agadir","Oujda"].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Objective</span><select value={campaignObjective} onChange={(e) => setCampaignObjective(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400">{["Book interviews","Generate interested replies","Recover inactive prospects","Send offers","Fill city coverage gap"].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Owner</span><select value={campaignOwner} onChange={(e) => setCampaignOwner(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400">{["Recruitment Lead","Youssef El Fassi","Fatima Zahra Ait","Regional Manager","HR Ops"].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Schedule</span><input value={campaignSchedule} onChange={(e) => setCampaignSchedule(e.target.value)} placeholder="Today 18:00" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400" /></label>
              <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Expected Replies</span><input placeholder="ex: 140" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-400" /></label>
            </div>
          </section>

          <section className="grid grid-cols-[1.1fr_0.9fr] gap-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black">Message Script</h3>
              <textarea value={campaignMessage} onChange={(e) => setCampaignMessage(e.target.value)} className="mt-4 h-44 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-violet-400" />
              <div className="mt-4 grid grid-cols-3 gap-3">
                {["Variant A", "Variant B", "Follow-up 24h"].map((x) => <button key={x} className="rounded-2xl border border-slate-200 p-3 text-xs font-black hover:bg-violet-50">{x}</button>)}
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black">Execution Layers</h3>
              <div className="mt-4 space-y-3">{["Deduplicate audience", "Exclude confirmed candidates", "Track replies", "Create interview tasks", "Notify owner", "Generate campaign report", "Sync source ROI", "Create reminder queue"].map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
            </div>
          </section>

          <section className="grid grid-cols-4 gap-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black">Territory Pressure</h3>
              <div className="mt-4 space-y-3">{["Agadir urgent gap", "Oujda growth", "Casablanca volume", "Rabat conversion", "Tangier premium"].map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black">Audience Segments</h3>
              <div className="mt-4 space-y-3">{["New uncontacted", "Interested no interview", "No reply 48h", "Offer ready", "Referral quality"].map((x) => <ToggleRow key={x}>{x}</ToggleRow>)}</div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black">Campaign Analytics</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <ControlPill label="Target" value="480" />
                <ControlPill label="Reply" value="38%" />
                <ControlPill label="Interview" value="90" />
                <ControlPill label="Offer" value="24" />
              </div>
            </div>
            <div className="rounded-[28px] border border-violet-200 bg-violet-50 p-5">
              <h3 className="text-lg font-black text-violet-900">Launch Control</h3>
              <p className="mt-2 text-sm font-bold text-violet-700">Save campaign, sync status, prepare owner tasks and make the campaign visible in workspace live state.</p>
              <button onClick={saveOutreachLive} className="mt-6 w-full rounded-2xl bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-100">Save Outreach Live + Sync Campaign</button>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-xl font-black">{c.title} Setup</h3>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <Field label="Reference" placeholder="AC-MOS-REC-NEW" />
              <SelectField label="City / Territory" options={["All Morocco", "Casablanca", "Rabat", "Marrakech", "Tangier", "Fes", "Agadir", "Oujda"]} />
              <SelectField label="Owner" options={["Recruitment Lead", "Regional Manager", "Operations", "HR Ops", "Direction Rabat"]} />
              <SelectField label="Priority" options={["Critical", "High", "Medium", "Low"]} />
              <SelectField label="Stage" options={["Prospect", "Contacted", "Interested", "In Process", "Shortlisted", "Confirmed"]} />
              <Field label="Deadline" placeholder="Today / This week / Custom" />
            </div>
          </section>
          <section className="grid grid-cols-2 gap-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black">Workflow Checklist</h3>
              <div className="mt-4 space-y-3">{c.sections.map((x) => <ToggleRow key={`wf-${x}`}>{x}</ToggleRow>)}</div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black">Decision & Notes</h3>
              <textarea className="mt-4 h-48 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-violet-400" placeholder="Add decision, justification, owner, deadline and next control point..." />
              <button className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Save Decision</button>
            </div>
          </section>
        </>
      )}
    </ModalShell>
  )
}

function MoroccoRecruitmentMap() {
  return (
    <div className="relative h-[310px] overflow-hidden rounded-[26px] bg-violet-50">
      <div className="absolute left-[65px] top-[22px] h-[250px] w-[360px] rotate-[-18deg] rounded-[38%_62%_45%_55%] bg-gradient-to-br from-violet-500/75 via-violet-300/70 to-violet-100" />
      {[["64","Tangier","left-[300px] top-[25px]"],["439","Rabat","left-[220px] top-[65px]"],["512","Casablanca","left-[120px] top-[120px]"],["352","Fes","left-[325px] top-[93px]"],["328","Marrakech","left-[260px] top-[165px]"],["338","Agadir","left-[150px] top-[220px]"],["190","South","left-[90px] top-[255px]"]].map(([v,c,p]) => <button key={c} className={`absolute ${p} flex items-center gap-2`}><span className="grid h-12 w-12 place-items-center rounded-full bg-white text-sm font-black text-violet-700 shadow-xl">{v}</span><span className="text-xs font-black text-slate-600">{c}</span></button>)}
      <div className="absolute bottom-5 right-5 space-y-2 text-xs font-black"><div className="flex items-center gap-2"><span className="h-3 w-6 rounded-full bg-violet-700"/>High</div><div className="flex items-center gap-2"><span className="h-3 w-6 rounded-full bg-violet-400"/>Medium</div><div className="flex items-center gap-2"><span className="h-3 w-6 rounded-full bg-violet-200"/>Low</div></div>
    </div>
  )
}

export default function AmbassadorRecruitmentWorkspace() {
  const [activeModal, setActiveModal] = useState<ModalKey>(null)
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Pipeline Overview")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [status, setStatus] = useState("")
  const [savedProspects, setSavedProspects] = useState<any[]>([])
  const [savedOutreach, setSavedOutreach] = useState<any[]>([])

  const liveProspects = [...savedProspects, ...prospects]

  const filtered = liveProspects.filter((p) => {
    const q = `${p.name} ${p.phone} ${p.city} ${p.source} ${p.status} ${p.owner}`.toLowerCase().includes(query.toLowerCase())
    const s = statusFilter === "All" || p.status === statusFilter
    return q && s
  })

  function exportCsv() {
    const rows = [["Name", "Phone", "City", "Source", "Status", "Score", "Next Action", "Owner", "Last Contact"], ...filtered.map((p) => [p.name, p.phone, p.city, p.source, p.status, p.score, p.next, p.owner, p.last])]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "angelcare-recruitment-pipeline.csv"
    a.click()
    URL.revokeObjectURL(url)
    setStatus("Recruitment pipeline CSV exported from current filters.")
  }

  const quickActions: [string, typeof Users, ModalKey][] = [
    ["Add Prospect", UserPlus, "add"],
    ["Import Prospects", Import, "import"],
    ["Bulk WhatsApp", MessageCircle, "bulk-whatsapp"],
    ["Create Campaign", Zap, "campaign"],
    ["Schedule Interviews", Calendar, "schedule"],
    ["Send Offers", Send, "offers"],
    ["Recruitment Report", FileText, "report"],
    ["Domination Map", MapPinned, "map"],
  ]

  return (
    <div className="flex min-h-screen bg-white text-slate-950">
      <AmbassadorMarketSidebar />
      <main className="flex-1 bg-white px-7 py-6">
        <header className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-[30px] font-black tracking-tight">Recruitment Command Center</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Dominate ambassador acquisition, outreach, interviews, offers and territory talent coverage.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveModal("add")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black shadow-sm"><UserPlus size={16}/> Add Prospect</button>
            <button onClick={() => setActiveModal("campaign")} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-violet-100"><Plus size={16}/> New Outreach</button>
          </div>
        </header>

        {status && <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">{status}</div>}

        <section className="grid grid-cols-7 gap-3">
          {[
            ["Total Prospects", "5,842", UserPlus, "bg-violet-100 text-violet-700", "↑ 24% vs Apr 1 – Apr 30"],
            ["Contacted", "3,682", MessageCircle, "bg-emerald-100 text-emerald-700", "↑ 18% vs Apr 1 – Apr 30"],
            ["Interested", "1,248", Users, "bg-pink-100 text-pink-700", "↑ 21% vs Apr 1 – Apr 30"],
            ["In Process", "842", UserPlus, "bg-blue-100 text-blue-700", "↑ 16% vs Apr 1 – Apr 30"],
            ["Shortlisted", "362", ShieldCheck, "bg-violet-100 text-violet-700", "↑ 9% vs Apr 1 – Apr 30"],
            ["Confirmed", "156", Trophy, "bg-orange-100 text-orange-700", "↑ 28% vs Apr 1 – Apr 30"],
            ["Conversion Rate", "4,24%", BarChart3, "bg-violet-100 text-violet-700", "↑ 0.8pp vs Apr 1 – Apr 30"],
          ].map(([label, value, Icon, tint, meta]) => {
            const I = Icon as typeof Users
            return (
              <button key={label as string} onClick={() => setStatus(`${label} gateway opened and synced to recruitment pipeline.`)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:bg-violet-50">
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

        <nav className="mt-5 flex gap-8 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setStatus(`${tab} recruitment gateway opened.`) }} className={`border-b-2 px-1 py-4 text-sm font-black transition ${activeTab === tab ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-violet-700"}`}>
              {tab}
            </button>
          ))}
        </nav>

        <section className="mt-3 grid grid-cols-[1.25fr_1.25fr_1.25fr_.75fr] gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Recruitment Funnel</h2><button className="rounded-xl border px-3 py-2 text-xs font-black">This Month</button></div>
            <div className="mt-6 grid grid-cols-[0.9fr_1fr] gap-4">
              <div className="space-y-1">
                {["Prospects", "Contacted", "Interested", "In Process", "Shortlisted", "Confirmed"].map((x, i) => (
                  <button key={x} onClick={() => { setStatusFilter(x === "Prospects" ? "All" : x); setStatus(`Funnel filtered to ${x}.`) }} className="mx-auto block h-12 bg-gradient-to-r from-violet-700 to-violet-500 text-xs font-black text-white shadow-sm" style={{ width: `${170 - i * 22}px`, clipPath: "polygon(0 0, 100% 0, 86% 100%, 14% 100%)" }}>{i === 0 ? "x" : "x"}</button>
                ))}
              </div>
              <div className="space-y-5 pt-2 text-sm font-black text-slate-600">
                {["Prospects 5,842", "Contacted 3,682 (63%)", "Interested 1,248 (34%)", "In Process 842 (22%)", "Shortlisted 362 (8.8%)", "Confirmed 156 (4.24%)"].map((x) => <div key={x} className="flex items-center gap-4"><span className="h-px flex-1 bg-slate-200"/>{x}</div>)}
              </div>
            </div>
          </div>

          <button onClick={() => setActiveModal("report")} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-violet-300">
            <div className="flex items-center justify-between"><h2 className="font-black">Pipeline Trend</h2><span className="rounded-xl border px-3 py-2 text-xs font-black">Daily</span></div>
            <div className="mt-5 h-[250px] rounded-2xl bg-gradient-to-t from-violet-50 to-white">
              <svg viewBox="0 0 420 230" className="h-full w-full">
                <defs><linearGradient id="pipeFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/></linearGradient></defs>
                <path d="M0,170 L45,135 L88,148 L132,105 L176,70 L220,115 L260,95 L302,112 L344,60 L382,68 L420,42 L420,230 L0,230 Z" fill="url(#pipeFill)" />
                <polyline fill="none" stroke="#6d28d9" strokeWidth="4" points="0,170 45,135 88,148 132,105 176,70 220,115 260,95 302,112 344,60 382,68 420,42" />
              </svg>
            </div>
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-black">Prospects by Territory</h2><button onClick={() => setActiveModal("map")} className="rounded-xl border px-3 py-2 text-xs font-black">Heatmap</button></div>
            <MoroccoRecruitmentMap />
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-black">Domination Status</h2>
              <div className="mt-4 flex items-center gap-4">
                <div className="grid h-24 w-24 place-items-center rounded-full bg-[conic-gradient(#10b981_0_72%,#e5e7eb_72%_100%)]"><div className="grid h-16 w-16 place-items-center rounded-full bg-white text-2xl font-black">72%</div></div>
                <div className="space-y-2 text-xs font-black text-slate-600">
                  {["Strong Position", "Presence 78%", "Attractiveness 71%", "Conversion 68%", "Retention 70%"].map((x) => <div key={x} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500"/>{x}</div>)}
                </div>
              </div>
              <button onClick={() => setActiveModal("strategy")} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-violet-600">View Domination Strategy <ArrowRight size={14}/></button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h2 className="font-black">Live Feed</h2><button className="rounded-xl border px-3 py-2 text-xs font-black">All Activities</button></div>
              <div className="mt-4 space-y-4 text-xs">
                {["New prospect added · Youssef L., Casablanca · 2m ago", "WhatsApp message sent · Zahra A., Rabat · 5m ago", "Interview scheduled · Omar K., Marrakech · 12m ago", "Offer sent · Fatima E., Fes · 25m ago"].map((x) => <button key={x} onClick={() => setActiveModal("prospect")} className="block w-full rounded-xl p-2 text-left font-bold hover:bg-violet-50">{x}</button>)}
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-4 grid grid-cols-[1fr_1fr_1fr_.75fr] gap-4">
          <button onClick={() => setActiveModal("report")} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
            <h2 className="font-black">Outreach Channels</h2>
            <div className="mt-5 flex items-center gap-7">
              <div className="grid h-40 w-40 place-items-center rounded-full bg-[conic-gradient(#10b981_0_54%,#3b82f6_54%_66%,#f97316_66%_75%,#ec4899_75%_80%,#7c3aed_80%_100%)]"><div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center"><div><div className="text-3xl font-black">3,682</div><div className="text-xs font-bold">Contacted</div></div></div></div>
              <div className="space-y-3 text-xs font-black">{["WhatsApp 54% (1,988)", "MessageCircle 18% (662)", "Phone Calls 12% (442)", "Referrals 9% (331)", "Facebook 5% (184)", "Other 2% (75)"].map((x) => <div key={x} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500"/>{x}</div>)}</div>
            </div>
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">Top Outreach Performers</h2>
            <table className="mt-4 w-full text-left text-xs">
              <thead><tr className="text-slate-500"><th>User</th><th>Contacts</th><th>Interested</th><th>Conversion</th></tr></thead>
              <tbody>{["Youssef El Fassi", "Fatima Zahra Ait", "Omar Kabbaj", "Imane Lahlou", "Ahmed Benali"].map((x, i) => <tr key={x} onClick={() => setActiveModal("prospect")} className="cursor-pointer border-b border-slate-100 hover:bg-violet-50"><td className="py-3 font-black">{x}</td><td>{512 - i * 28}</td><td>{210 - i * 18}</td><td>{(41 - i * 1.7).toFixed(1)}%</td></tr>)}</tbody>
            </table>
            <button onClick={() => setActiveModal("report")} className="mt-4 text-sm font-black text-violet-600">View All Performers →</button>
          </div>

          <button onClick={() => setActiveModal("report")} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
            <h2 className="font-black">Source of Prospects</h2>
            <div className="mt-5 flex items-center gap-7">
              <div className="grid h-40 w-40 place-items-center rounded-full bg-[conic-gradient(#7c3aed_0_38%,#10b981_38%_63%,#3b82f6_63%_78%,#f97316_78%_90%,#ef4444_90%_97%,#9333ea_97%_100%)]"><div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center"><div><div className="text-3xl font-black">5,842</div><div className="text-xs font-bold">Total</div></div></div></div>
              <div className="space-y-3 text-xs font-black">{["Referrals 38%", "Social Media 25%", "Field Events 15%", "Partner Networks 12%", "Walk-ins 7%", "Other 3%"].map((x) => <div key={x}>{x}</div>)}</div>
            </div>
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {quickActions.map(([label, Icon, key]) => {
                const I = Icon as typeof Users
                return <button key={label} onClick={() => setActiveModal(key)} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left text-xs font-black hover:border-violet-300 hover:bg-violet-50"><I className="text-violet-600" size={18}/>{label}</button>
              })}
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-[1fr_.32fr] gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-black">Prospects Pipeline</h2>
              <div className="flex gap-2"><button onClick={() => setActiveModal("columns")} className="rounded-xl border px-3 py-2 text-xs font-black">Columns</button><button onClick={exportCsv} className="rounded-xl border px-3 py-2 text-xs font-black">Export</button></div>
            </div>
            <div className="mb-4 flex gap-2">{["All", "New", "Contacted", "Interested", "In Process", "Shortlisted", "Confirmed"].map((x) => <button key={x} onClick={() => setStatusFilter(x)} className={`rounded-xl px-4 py-2 text-xs font-black ${statusFilter === x ? "bg-violet-100 text-violet-700" : "border border-slate-200"}`}>{x}</button>)}</div>
            <table className="w-full text-left text-xs">
              <thead><tr className="border-b border-slate-200 text-slate-500"><th className="pb-3">Name</th><th>Phone</th><th>City</th><th>Source</th><th>Status</th><th>Score</th><th>Next Action</th><th>Owner</th><th>Last Contact</th><th>Actions</th></tr></thead>
              <tbody>{filtered.map((p) => <tr key={p.phone} className="border-b border-slate-100 hover:bg-violet-50"><td onClick={() => setActiveModal("prospect")} className="cursor-pointer py-3 font-black underline-offset-4 hover:underline">{p.name}</td><td>{p.phone}</td><td>{p.city}</td><td>{p.source}</td><td><span className="rounded-md bg-emerald-100 px-2 py-1 font-black text-emerald-700">{p.status}</span></td><td>{p.score} {"★".repeat(Math.min(5, Math.round(p.score/20)))}</td><td><button onClick={() => setActiveModal(p.next.includes("Interview") ? "schedule" : p.next.includes("Offer") ? "offers" : "bulk-whatsapp")} className="rounded-lg border px-3 py-1 font-black">{p.next}</button></td><td>{p.owner}</td><td>{p.last}</td><td><div className="flex gap-2"><button onClick={() => setActiveModal("bulk-whatsapp")} className="text-emerald-600"><MessageCircle size={16}/></button><button onClick={() => setActiveModal("prospect")}><MoreHorizontal size={16}/></button></div></td></tr>)}</tbody>
            </table>
          </div>

          <button onClick={() => setActiveModal("strategy")} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 to-violet-950 p-6 text-left text-white shadow-xl">
            <Trophy className="absolute -bottom-10 -right-6 opacity-25" size={190} />
            <h2 className="text-xl font-black">Angelcare Domination Strategy</h2>
            <p className="mt-3 text-sm font-semibold text-white/75">Expand presence, attract top talent and dominate every territory.</p>
            <span className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-violet-700">View Strategy <ArrowRight size={14}/></span>
          </button>
        </section>

        <RecruitmentActionModal
          active={activeModal}
          onClose={() => setActiveModal(null)}
          onSave={(payload) => {
            if (payload.type === "prospect") {
              setSavedProspects((prev) => [payload.data, ...prev])
              setStatus(`Prospect saved live: ${payload.data.name} · ${payload.data.city} · ${payload.data.status}`)
            }
            if (payload.type === "outreach") {
              setSavedOutreach((prev) => [payload.data, ...prev])
              setStatus(`Outreach campaign saved live: ${payload.data.name} · ${payload.data.channel} · ${payload.data.audience}`)
            }
            setActiveModal(null)
          }}
        />
      </main>
    </div>
  )
}
