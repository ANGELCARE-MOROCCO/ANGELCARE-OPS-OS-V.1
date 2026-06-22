"use client"

import Link from "next/link"
import React, { useEffect, useMemo, useRef, useState } from "react"

type Stage = "planning" | "production" | "approval" | "launch-ready" | "live" | "optimization"
type Risk = "low" | "medium" | "high" | "critical"
type TaskStatus = "todo" | "doing" | "done" | "blocked"
type ApprovalStatus = "pending" | "approved" | "rejected"

type ActionToastTone = "blue" | "emerald" | "rose" | "amber" | "violet" | "slate"

type ActionToast = {
  id: string
  title: string
  detail: string
  tone: ActionToastTone
  icon: string
  progress: number
}

type Panel = "overview" | "execution" | "management" | "create" | "launch" | "budget" | "risk" | "tasks" | "performance" | "approvals" | "calendar"
type SidebarKey = "command" | "execution" | "management" | "create" | "launch" | "budget" | "risk" | "performance" | "approvals" | "calendar"

type Campaign = {
  id: string
  lifecycleStatus?: "active" | "paused" | "archived"
  name: string
  objective: string
  campaignType: string
  targetAudience: string
  marketSegment: string
  businessAxis: string
  channelMix: string
  geography: string
  offer: string
  landingOrLocation: string
  owner: string
  team: string
  channel: string
  stage: Stage
  risk: Risk
  startDate: string
  launchDate: string
  endDate: string
  budgetMad: number
  spentMad: number
  revenueMad: number
  leads: number
  readiness: number
  primaryKpi: string
  secondaryKpi: string
  trackingPlan: string
  approvalNeed: string
  assetNeed: string
  complianceNotes: string
  notes: string
  commandNotes: string
  nextDecision: string
  createdAt: string
  updatedAt: string
}

type Task = {
  id: string
  campaignId: string
  title: string
  description?: string
  owner: string
  status: TaskStatus
  priority: "low" | "medium" | "high"
  dueDate: string
  startDateTime?: string
  endDateTime?: string
  workstream?: string
  createdAt: string
}

type Approval = {
  id: string
  campaignId: string
  title: string
  owner: string
  status: ApprovalStatus
  createdAt: string
}

type RiskRecord = {
  id: string
  campaignId: string
  title: string
  level: Risk
  owner: string
  createdAt: string
}

type Log = {
  id: string
  campaignId?: string
  message: string
  meta: string
  createdAt: string
}

type WorkspaceState = {
  campaigns: Campaign[]
  tasks: Task[]
  approvals: Approval[]
  risks: RiskRecord[]
  logs: Log[]
  selectedId: string | null
}

type ModalMode = "create" | "edit"

const STORAGE_KEY = "angelcare.market_os.campaign_command_center.operational_modal.v1"

const stages: Stage[] = ["planning", "production", "approval", "launch-ready", "live", "optimization"]
const risks: Risk[] = ["low", "medium", "high", "critical"]

const stageLabel: Record<Stage, string> = {
  planning: "Planning",
  production: "Production",
  approval: "Approval",
  "launch-ready": "Launch Ready",
  live: "Live",
  optimization: "Optimization",
}

const riskLabel: Record<Risk, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
}

const campaignTypeOptions = [
  "Digital acquisition",
  "Offline activation",
  "B2B partnership",
  "B2C family campaign",
  "Institutional campaign",
  "Referral campaign",
  "Seasonal campaign",
  "Launch campaign",
  "Retention campaign",
  "Brand awareness",
]

const targetAudienceOptions = [
  "Parents",
  "Families",
  "Mothers",
  "New parents",
  "Hotels",
  "Clinics",
  "Schools",
  "Nurseries",
  "Companies",
  "Partners",
  "Academy candidates",
  "Mixed B2B + B2C",
]

const marketSegmentOptions = [
  "Premium families",
  "Mass market",
  "Corporate accounts",
  "Healthcare partners",
  "Education partners",
  "Hospitality partners",
  "Recruitment pipeline",
  "Academy pipeline",
  "Existing customers",
  "New customers",
]

const businessAxisOptions = [
  "CareLink operations",
  "Home childcare",
  "Postpartum care",
  "Academy training",
  "B2B partnerships",
  "Marketplace/add-ons",
  "Sales CRM",
  "Recruitment",
  "Brand trust",
  "Revenue recovery",
]

const channelMixOptions = [
  "Meta Ads",
  "Google Ads",
  "WhatsApp outreach",
  "Email campaign",
  "Phone outreach",
  "Field activation",
  "Partner referral",
  "Events",
  "Flyers / offline",
  "Landing page",
  "SEO / blog",
  "Mixed channel",
]

const kpiOptions = [
  "Leads",
  "Appointments",
  "Qualified opportunities",
  "Contracts",
  "Revenue MAD",
  "ROAS",
  "Conversion rate",
  "Partnerships signed",
  "Applications",
  "Brand reach",
  "Retention",
  "Client reactivation",
]


const channelNodes = [
  {
    name: "Meta Ads",
    icon: "∞",
    group: "Paid Media",
    tone: "blue",
    keywords: ["meta", "facebook", "instagram", "paid social"],
  },
  {
    name: "Google Ads",
    icon: "G",
    group: "Paid Media",
    tone: "emerald",
    keywords: ["google", "search ads", "youtube", "performance max"],
  },
  {
    name: "WhatsApp",
    icon: "☘",
    group: "Owned Channels",
    tone: "emerald",
    keywords: ["whatsapp", "wa"],
  },
  {
    name: "Email",
    icon: "✉",
    group: "Owned Channels",
    tone: "violet",
    keywords: ["email", "newsletter", "mail"],
  },
  {
    name: "B2B Partnerships",
    icon: "🤝",
    group: "Partnerships",
    tone: "amber",
    keywords: ["b2b", "partnership", "partner", "partners", "clinics", "schools", "hotels", "creche", "crèche"],
  },
  {
    name: "Field Activation",
    icon: "⌖",
    group: "Offline",
    tone: "teal",
    keywords: ["field", "offline", "flyers", "street", "activation", "event"],
  },
  {
    name: "Website",
    icon: "◎",
    group: "Owned Channels",
    tone: "sky",
    keywords: ["website", "landing", "seo", "blog", "web"],
  },
  {
    name: "Referral",
    icon: "⧉",
    group: "CRM & Data",
    tone: "violet",
    keywords: ["referral", "parrainage", "recommendation"],
  },
  {
    name: "CRM",
    icon: "◌",
    group: "CRM & Data",
    tone: "blue",
    keywords: ["crm", "retention", "reactivation", "customer"],
  },
  {
    name: "Influencers",
    icon: "★",
    group: "Earned Channels",
    tone: "rose",
    keywords: ["influencer", "creator", "ugc", "earned"],
  },
  {
    name: "Events",
    icon: "▦",
    group: "Offline",
    tone: "amber",
    keywords: ["event", "salon", "expo", "open day", "activation"],
  },
] as const

const channelMindmapPositions = [
  { top: "13%", left: "5%", x: "25%", y: "21%" },
  { top: "30%", left: "3%", x: "23%", y: "38%" },
  { top: "47%", left: "5%", x: "25%", y: "55%" },
  { top: "64%", left: "7%", x: "27%", y: "72%" },
  { top: "79%", left: "24%", x: "40%", y: "84%" },
  { top: "13%", right: "5%", x: "75%", y: "21%" },
  { top: "30%", right: "3%", x: "77%", y: "38%" },
  { top: "47%", right: "5%", x: "75%", y: "55%" },
  { top: "64%", right: "7%", x: "73%", y: "72%" },
  { top: "79%", right: "24%", x: "60%", y: "84%" },
] as const

type ChannelNodeName = typeof channelNodes[number]["name"]

function matchesChannel(campaign: Campaign, node: typeof channelNodes[number]) {
  const source = `${campaign.name} ${campaign.channel} ${campaign.channelMix} ${campaign.campaignType} ${campaign.targetAudience} ${campaign.marketSegment} ${campaign.businessAxis}`.toLowerCase()
  return node.keywords.some((keyword) => source.includes(keyword.toLowerCase()))
}

function channelToneClasses(tone: string, selected: boolean) {
  const map: Record<string, string> = {
    blue: selected ? "border-blue-300 bg-blue-50 text-blue-800 ring-4 ring-blue-100" : "border-blue-200 bg-white text-blue-800",
    emerald: selected ? "border-emerald-300 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100" : "border-emerald-200 bg-white text-emerald-800",
    violet: selected ? "border-violet-300 bg-violet-50 text-violet-800 ring-4 ring-violet-100" : "border-violet-200 bg-white text-violet-800",
    amber: selected ? "border-amber-300 bg-amber-50 text-amber-800 ring-4 ring-amber-100" : "border-amber-200 bg-white text-amber-800",
    rose: selected ? "border-rose-300 bg-rose-50 text-rose-800 ring-4 ring-rose-100" : "border-rose-200 bg-white text-rose-800",
    sky: selected ? "border-sky-300 bg-sky-50 text-sky-800 ring-4 ring-sky-100" : "border-sky-200 bg-white text-sky-800",
    teal: selected ? "border-teal-300 bg-teal-50 text-teal-800 ring-4 ring-teal-100" : "border-teal-200 bg-white text-teal-800",
  }

  return map[tone] || map.blue
}


function channelPalette(tone: string) {
  const map: Record<string, { color: string; soft: string; glow: string }> = {
    blue: { color: "#2563eb", soft: "rgba(37,99,235,0.10)", glow: "rgba(37,99,235,0.26)" },
    emerald: { color: "#059669", soft: "rgba(5,150,105,0.10)", glow: "rgba(5,150,105,0.24)" },
    violet: { color: "#7c3aed", soft: "rgba(124,58,237,0.10)", glow: "rgba(124,58,237,0.24)" },
    amber: { color: "#d97706", soft: "rgba(217,119,6,0.12)", glow: "rgba(217,119,6,0.24)" },
    rose: { color: "#e11d48", soft: "rgba(225,29,72,0.10)", glow: "rgba(225,29,72,0.24)" },
    sky: { color: "#0284c7", soft: "rgba(2,132,199,0.10)", glow: "rgba(2,132,199,0.24)" },
    teal: { color: "#0d9488", soft: "rgba(13,148,136,0.10)", glow: "rgba(13,148,136,0.24)" },
  }

  return map[tone] || map.blue
}

function channelNodeStyle(tone: string, selected: boolean): React.CSSProperties {
  const palette = channelPalette(tone)

  return {
    borderColor: selected ? palette.color : palette.soft,
    background: selected
      ? `linear-gradient(135deg, ${palette.soft}, #ffffff 68%)`
      : "linear-gradient(135deg, #ffffff, #f8fafc)",
    boxShadow: selected
      ? `0 24px 60px ${palette.glow}, inset 0 0 0 1px rgba(255,255,255,0.85)`
      : "0 14px 32px rgba(15,23,42,0.06)",
  }
}

const emptyState: WorkspaceState = {
  campaigns: [],
  tasks: [],
  approvals: [],
  risks: [],
  logs: [],
  selectedId: null,
}

function emptyCampaignDraft(): Campaign {
  const today = isoToday()
  return {
    id: "",
    lifecycleStatus: "active",
    name: "",
    objective: "",
    campaignType: campaignTypeOptions[0],
    targetAudience: targetAudienceOptions[0],
    marketSegment: marketSegmentOptions[0],
    businessAxis: businessAxisOptions[0],
    channelMix: channelMixOptions[0],
    geography: "Morocco",
    offer: "",
    landingOrLocation: "",
    owner: "",
    team: "Market-OS",
    channel: "Mixed channel",
    stage: "planning",
    risk: "low",
    startDate: today,
    launchDate: today,
    endDate: today,
    budgetMad: 0,
    spentMad: 0,
    revenueMad: 0,
    leads: 0,
    readiness: 0,
    primaryKpi: kpiOptions[0],
    secondaryKpi: kpiOptions[1],
    trackingPlan: "",
    approvalNeed: "",
    assetNeed: "",
    complianceNotes: "",
    notes: "",
    commandNotes: "",
    nextDecision: "",
    createdAt: "",
    updatedAt: "",
  }
}

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function parseState(raw: string | null): WorkspaceState {
  if (!raw) return emptyState
  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>
    return {
      campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      approvals: Array.isArray(parsed.approvals) ? parsed.approvals : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      selectedId: typeof parsed.selectedId === "string" ? parsed.selectedId : null,
    }
  } catch {
    return emptyState
  }
}

function mad(value: number) {
  return `MAD ${new Intl.NumberFormat("en-US").format(Math.round(Number(value || 0)))}`
}

function roas(campaign: Campaign) {
  if (!campaign.spentMad) return 0
  return Math.round((campaign.revenueMad / campaign.spentMad) * 10) / 10
}

function pct(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value || 0)))}%`
}

function riskTone(risk: Risk): "blue" | "emerald" | "rose" | "amber" | "violet" | "slate" {
  if (risk === "high" || risk === "critical") return "rose"
  if (risk === "medium") return "amber"
  return "emerald"
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate" }) {
  const tones = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    rose: "border-rose-100 bg-rose-50 text-rose-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${tones[tone]}`}>
      {children}
    </span>
  )
}

function Icon({ icon, tone = "blue" }: { icon: string; tone?: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-slate-50 text-slate-700",
  }

  return <span className={`grid h-10 w-10 place-items-center rounded-2xl text-sm font-black ${tones[tone]}`}>{icon}</span>
}

function Card({ children, className = "", ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLElement>) {
  return <section {...props} className={`rounded-[28px] border border-slate-200/90 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)] ${className}`}>{children}</section>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
      {children}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 ${props.className || ""}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 ${props.className || ""}`} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[112px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 ${props.className || ""}`} />
}

export default function CampaignLifecycleExecutionWorkspace() {
  const [hydrated, setHydrated] = useState(false)
  const [state, setState] = useState<WorkspaceState>(emptyState)
  const [query, setQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<"all" | Stage>("all")
  const [riskFilter, setRiskFilter] = useState<"all" | Risk>("all")
  const [activePanel, setActivePanel] = useState<Panel>("overview")
  const [actionToast, setActionToast] = useState<ActionToast | null>(null)
  const actionToastTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<ChannelNodeName>("Meta Ads")
  const [mindmapZoom, setMindmapZoom] = useState(1)
  const [taskOpsQuery, setTaskOpsQuery] = useState("")
  const [taskOpsStatus, setTaskOpsStatus] = useState<"all" | TaskStatus>("all")
  const [taskOpsPriority, setTaskOpsPriority] = useState<"all" | Task["priority"]>("all")
  const [taskOpsMonth, setTaskOpsMonth] = useState(() => isoToday().slice(0, 7))
  const [taskOpsDate, setTaskOpsDate] = useState(() => isoToday())
  const [selectedTaskOpsId, setSelectedTaskOpsId] = useState<string | null>(null)
  const [selectedDatesCampaignId, setSelectedDatesCampaignId] = useState<string | null>(null)
  const [managementQuery, setManagementQuery] = useState("")
  const [managementStage, setManagementStage] = useState<"all" | Campaign["stage"]>("all")
  const [managementRisk, setManagementRisk] = useState<"all" | Risk>("all")
  const [managementStatus, setManagementStatus] = useState<"all" | "active" | "paused" | "archived" | "draft">("all")
  const [managementChannel, setManagementChannel] = useState<"all" | ChannelNodeName>("all")
  const [managementAudience, setManagementAudience] = useState<"all" | "B2B" | "B2C">("all")
  const [managementTab, setManagementTab] = useState<"overview" | "schedule" | "budget" | "channels" | "tasks" | "approvals" | "activity">("overview")
  const [managementPage, setManagementPage] = useState(1)
  const [directoryView, setDirectoryView] = useState<"columns" | "grid">("columns")
  const [sidebarActive, setSidebarActive] = useState<SidebarKey>("command")
  const [modalMode, setModalMode] = useState<ModalMode>("create")
  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState<Campaign>(emptyCampaignDraft())

  useEffect(() => {
    setState(parseState(window.localStorage.getItem(STORAGE_KEY)))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  function commit(next: WorkspaceState, message: string, meta = "Campaign lifecycle", campaignId?: string) {
    const log: Log = {
      id: id("log"),
      campaignId,
      message,
      meta,
      createdAt: new Date().toISOString(),
    }
    setState({ ...next, logs: [log, ...next.logs].slice(0, 160) })
  }

  const selected = useMemo(() => {
    return state.campaigns.find((campaign) => campaign.id === state.selectedId) || state.campaigns[0] || null
  }, [state.campaigns, state.selectedId])

  const selectedTasks = useMemo(() => selected ? state.tasks.filter((task) => task.campaignId === selected.id) : [], [selected, state.tasks])
  const selectedRisks = useMemo(() => selected ? state.risks.filter((risk) => risk.campaignId === selected.id) : [], [selected, state.risks])
  const selectedApprovals = useMemo(() => selected ? state.approvals.filter((approval) => approval.campaignId === selected.id) : [], [selected, state.approvals])
  const selectedLogs = useMemo(() => selected ? state.logs.filter((log) => log.campaignId === selected.id).slice(0, 12) : [], [selected, state.logs])

  const filteredCampaigns = useMemo(() => {
    return state.campaigns.filter((campaign) => {
      const haystack = `${campaign.name} ${campaign.objective} ${campaign.owner} ${campaign.team} ${campaign.channel} ${campaign.campaignType} ${campaign.targetAudience} ${campaign.marketSegment} ${campaign.businessAxis}`.toLowerCase()
      return (
        (!query.trim() || haystack.includes(query.toLowerCase())) &&
        (stageFilter === "all" || campaign.stage === stageFilter) &&
        (riskFilter === "all" || campaign.risk === riskFilter)
      )
    })
  }, [state.campaigns, query, stageFilter, riskFilter])

  const metrics = useMemo(() => {
    const totalBudget = state.campaigns.reduce((sum, c) => sum + c.budgetMad, 0)
    const totalSpend = state.campaigns.reduce((sum, c) => sum + c.spentMad, 0)
    const totalRevenue = state.campaigns.reduce((sum, c) => sum + c.revenueMad, 0)
    const leads = state.campaigns.reduce((sum, c) => sum + c.leads, 0)
    const budgetControlled = state.campaigns.length
      ? Math.round((state.campaigns.filter((c) => !c.budgetMad || c.spentMad <= c.budgetMad).length / state.campaigns.length) * 100)
      : 0

    return {
      active: state.campaigns.length,
      launchReady: state.campaigns.filter((c) => c.stage === "launch-ready" || c.stage === "live").length,
      budgetControlled,
      highRisk: state.campaigns.filter((c) => c.risk === "high" || c.risk === "critical").length,
      roas: totalSpend ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0,
      leads,
      tasksDue: state.tasks.filter((t) => t.status !== "done").length,
      approvalsDue: state.approvals.filter((a) => a.status === "pending").length,
      totalBudget,
      totalSpend,
      totalRevenue,
    }
  }, [state])

  const channelStats = useMemo(() => {
    return channelNodes.map((node) => {
      const campaigns = state.campaigns.filter((campaign) => matchesChannel(campaign, node))
      const activeCampaigns = campaigns.filter((campaign) => campaign.stage !== "optimization")
      const draftCampaigns = campaigns.filter((campaign) => campaign.stage === "planning" || campaign.stage === "production")
      const launchReadyCampaigns = campaigns.filter((campaign) => campaign.stage === "launch-ready" || campaign.stage === "live")
      const budgetMad = campaigns.reduce((sum, campaign) => sum + Number(campaign.budgetMad || 0), 0)
      const spendMad = campaigns.reduce((sum, campaign) => sum + Number(campaign.spentMad || 0), 0)
      const revenueMad = campaigns.reduce((sum, campaign) => sum + Number(campaign.revenueMad || 0), 0)
      const leads = campaigns.reduce((sum, campaign) => sum + Number(campaign.leads || 0), 0)
      const owner = campaigns.find((campaign) => campaign.owner)?.owner || "Unassigned"
      const roasValue = spendMad ? Math.round((revenueMad / spendMad) * 100) / 100 : 0

      return {
        ...node,
        campaigns,
        activeCampaigns,
        draftCampaigns,
        launchReadyCampaigns,
        budgetMad,
        spendMad,
        revenueMad,
        leads,
        owner,
        roasValue,
      }
    })
  }, [state.campaigns])

  const selectedChannelStats = useMemo(() => {
    return channelStats.find((channel) => channel.name === selectedChannel) || channelStats[0]
  }, [channelStats, selectedChannel])

  const balancedChannelColumns = useMemo(() => {
    const left = channelStats.filter((_, index) => index % 2 === 0)
    const right = channelStats.filter((_, index) => index % 2 === 1)

    return {
      left,
      right,
      maxRows: Math.max(left.length, right.length, 1),
      compact: channelStats.length > 10,
    }
  }, [channelStats])


  const topChannel = useMemo(() => {
    return [...channelStats].sort((a, b) => b.activeCampaigns.length - a.activeCampaigns.length)[0]
  }, [channelStats])

  const averageReadiness = useMemo(() => {
    if (!state.campaigns.length) return 0
    return Math.round(state.campaigns.reduce((sum, campaign) => sum + Number(campaign.readiness || 0), 0) / state.campaigns.length)
  }, [state.campaigns])

  function openCreateModal() {
    setModalMode("create")
    setDraft(emptyCampaignDraft())
    setModalOpen(true)
    setActivePanel("create")
    setSidebarActive("create")
  }

  function openEditModal(campaign = selected) {
    if (!campaign) return
    setModalMode("edit")
    setDraft(campaign)
    setState({ ...state, selectedId: campaign.id })
    setModalOpen(true)
  }

  function saveCampaign(event?: React.FormEvent) {
    event?.preventDefault()
    if (!draft.name.trim()) return

    const now = new Date().toISOString()

    if (modalMode === "create") {
      const campaign: Campaign = {
        ...draft,
        id: id("cmp"),
        name: draft.name.trim(),
        owner: draft.owner.trim() || "Unassigned",
        team: draft.team.trim() || "Market-OS",
        budgetMad: Number(draft.budgetMad || 0),
        spentMad: Number(draft.spentMad || 0),
        revenueMad: Number(draft.revenueMad || 0),
        leads: Number(draft.leads || 0),
        readiness: Number(draft.readiness || 0),
        createdAt: now,
        updatedAt: now,
      }

      commit(
        { ...state, campaigns: [campaign, ...state.campaigns], selectedId: campaign.id },
        "Campaign created",
        campaign.name,
        campaign.id,
      )

      setModalOpen(false)
      setActivePanel("overview")
      return
    }

    const existing = state.campaigns.find((campaign) => campaign.id === draft.id)
    if (!existing) return

    const updated: Campaign = {
      ...draft,
      name: draft.name.trim(),
      owner: draft.owner.trim() || "Unassigned",
      team: draft.team.trim() || "Market-OS",
      budgetMad: Number(draft.budgetMad || 0),
      spentMad: Number(draft.spentMad || 0),
      revenueMad: Number(draft.revenueMad || 0),
      leads: Number(draft.leads || 0),
      readiness: Number(draft.readiness || 0),
      updatedAt: now,
    }

    commit(
      {
        ...state,
        selectedId: updated.id,
        campaigns: state.campaigns.map((campaign) => campaign.id === updated.id ? updated : campaign),
      },
      "Campaign saved",
      updated.name,
      updated.id,
    )

    setModalOpen(false)
  }

  function deleteCampaignPermanently(campaignId = draft.id) {
    if (!campaignId) return
    const campaign = state.campaigns.find((item) => item.id === campaignId)
    const nextCampaigns = state.campaigns.filter((item) => item.id !== campaignId)
    commit(
      {
        campaigns: nextCampaigns,
        tasks: state.tasks.filter((item) => item.campaignId !== campaignId),
        approvals: state.approvals.filter((item) => item.campaignId !== campaignId),
        risks: state.risks.filter((item) => item.campaignId !== campaignId),
        logs: state.logs.filter((item) => item.campaignId !== campaignId),
        selectedId: nextCampaigns[0]?.id || null,
      },
      "Campaign permanently deleted",
      campaign?.name || "Deleted campaign",
      campaignId,
    )
    setModalOpen(false)
    setActivePanel("overview")
  }

  function updateCampaign(idValue: string, patch: Partial<Campaign>, message = "Campaign updated") {
    const campaign = state.campaigns.find((c) => c.id === idValue)
    if (!campaign) return
    commit(
      {
        ...state,
        selectedId: idValue,
        campaigns: state.campaigns.map((c) => c.id === idValue ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c),
      },
      message,
      campaign.name,
      idValue,
    )
  }

  function addTask(campaignId = selected?.id) {
    if (!campaignId) return
    const task: Task = {
      id: id("task"),
      campaignId,
      title: "New execution task",
      owner: "Market-OS",
      status: "todo",
      priority: "medium",
      dueDate: taskOpsDate || isoToday(),
      startDateTime: `${taskOpsDate || isoToday()}T09:00`,
      endDateTime: `${taskOpsDate || isoToday()}T17:00`,
      workstream: "Execution",
      createdAt: new Date().toISOString(),
    }
    commit({ ...state, selectedId: campaignId, tasks: [task, ...state.tasks] }, "Task created", task.title, campaignId)
  }

  function addRisk(campaignId = selected?.id) {
    if (!campaignId) return
    const risk: RiskRecord = {
      id: id("risk"),
      campaignId,
      title: "Operational risk detected",
      level: "medium",
      owner: "Market-OS",
      createdAt: new Date().toISOString(),
    }
    commit({ ...state, selectedId: campaignId, risks: [risk, ...state.risks] }, "Risk logged", risk.title, campaignId)
  }

  function addApproval(campaignId = selected?.id) {
    if (!campaignId) return
    const approval: Approval = {
      id: id("approval"),
      campaignId,
      title: "Campaign approval request",
      owner: "Marketing Director",
      status: "pending",
      createdAt: new Date().toISOString(),
    }
    commit({ ...state, selectedId: campaignId, approvals: [approval, ...state.approvals] }, "Approval requested", approval.title, campaignId)
  }

  function updateTask(taskId: string, patch: Partial<Task>) {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === taskId ? { ...task, ...patch } : task),
    }))
  }

  function deleteTask(taskId: string) {
    const task = state.tasks.find((item) => item.id === taskId)
    commit(
      {
        ...state,
        tasks: state.tasks.filter((item) => item.id !== taskId),
      },
      "Task deleted",
      task?.title || "Deleted task",
      task?.campaignId,
    )
  }

  function updateApproval(approvalId: string, patch: Partial<Approval>) {
    setState((current) => ({
      ...current,
      approvals: current.approvals.map((approval) => approval.id === approvalId ? { ...approval, ...patch } : approval),
    }))
  }

  function deleteApproval(approvalId: string) {
    const approval = state.approvals.find((item) => item.id === approvalId)
    commit(
      {
        ...state,
        approvals: state.approvals.filter((item) => item.id !== approvalId),
      },
      "Approval deleted",
      approval?.title || "Deleted approval",
      approval?.campaignId,
    )
  }

  function updateRiskRecord(riskId: string, patch: Partial<RiskRecord>) {
    setState((current) => ({
      ...current,
      risks: current.risks.map((risk) => risk.id === riskId ? { ...risk, ...patch } : risk),
    }))
  }

  function deleteRiskRecord(riskId: string) {
    const risk = state.risks.find((item) => item.id === riskId)
    commit(
      {
        ...state,
        risks: state.risks.filter((item) => item.id !== riskId),
      },
      "Risk deleted",
      risk?.title || "Deleted risk",
      risk?.campaignId,
    )
  }

  function runLaunchReadiness() {
    if (!selected) return
    const doneTasks = selectedTasks.filter((t) => t.status === "done").length
    const taskScore = selectedTasks.length ? Math.round((doneTasks / selectedTasks.length) * 35) : 0
    const approvalScore = selectedApprovals.length && selectedApprovals.every((a) => a.status === "approved") ? 25 : 0
    const budgetScore = !selected.budgetMad || selected.spentMad <= selected.budgetMad ? 20 : 8
    const riskPenalty = selectedRisks.filter((r) => r.level === "high" || r.level === "critical").length * 15
    const readiness = Math.max(0, Math.min(100, 20 + taskScore + approvalScore + budgetScore - riskPenalty))
    updateCampaign(selected.id, { readiness, stage: readiness >= 85 ? "launch-ready" : readiness >= 55 ? "approval" : selected.stage }, "Launch readiness checked")
  }

  function advanceStage() {
    if (!selected) return
    const index = stages.indexOf(selected.stage)
    updateCampaign(selected.id, { stage: stages[Math.min(stages.length - 1, index + 1)] }, "Campaign advanced")
  }

  function handleSidebarAction(key: SidebarKey, panel: Panel) {
    setSidebarActive(key)
    setActivePanel(panel)

    if (key === "command") {
      setActivePanel("overview")
      return
    }

    if (key === "execution") {
      setActivePanel("execution")
      const board = document.getElementById("execution-workspace-panel")
      board?.scrollIntoView({ behavior: "smooth", block: "start" })
      return
    }

    if (key === "management") {
      setActivePanel("management")
      const panel = document.getElementById("campaign-management-workspace")
      panel?.scrollIntoView({ behavior: "smooth", block: "start" })
      return
    }

    if (key === "create") {
      openCreateModal()
      return
    }

    if (key === "launch") {
      if (selected) runLaunchReadiness()
      const launch = document.getElementById("launch-readiness-card")
      launch?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    if (key === "budget") {
      const budget = document.getElementById("budget-roi-cockpit-card")
      budget?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    if (key === "risk") {
      const risk = document.getElementById("risk-escalation-card")
      risk?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    if (key === "performance") {
      const portfolio = document.getElementById("campaign-portfolio-card")
      portfolio?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    if (key === "approvals") {
      if (selected) addApproval(selected.id)
      const quick = document.getElementById("quick-actions-card")
      quick?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    if (key === "calendar") {
      const board = document.getElementById("campaign-execution-board")
      board?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  function taskStartDateTime(task: Task) {
    return task.startDateTime || `${task.dueDate || isoToday()}T09:00`
  }

  function taskEndDateTime(task: Task) {
    return task.endDateTime || `${task.dueDate || isoToday()}T17:00`
  }

  function formatDateTime(value?: string) {
    if (!value) return "—"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleString([], {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function daysBetween(start: string, end: string) {
    const startDate = new Date(`${start}T00:00:00`)
    const endDate = new Date(`${end}T23:59:59`)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0
    return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000))
  }

  function remainingCampaignDays(campaign: Campaign) {
    const today = new Date()
    const endDate = new Date(`${campaign.endDate || isoToday()}T23:59:59`)
    if (Number.isNaN(endDate.getTime())) return 0
    return Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / 86400000))
  }

  function campaignElapsedPct(campaign: Campaign) {
    const total = daysBetween(campaign.startDate || isoToday(), campaign.endDate || isoToday())
    const remaining = remainingCampaignDays(campaign)
    return Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)))
  }

  function campaignExpiryTone(campaign: Campaign) {
    const total = daysBetween(campaign.startDate || isoToday(), campaign.endDate || isoToday())
    const remaining = remainingCampaignDays(campaign)
    const remainingPct = total ? (remaining / total) * 100 : 100

    if (remainingPct <= 20) {
      return {
        label: "Expiring soon",
        className: "border-rose-200 bg-rose-50 text-rose-700",
        bar: "bg-rose-500",
      }
    }

    if (remainingPct <= 50) {
      return {
        label: "Mid-cycle warning",
        className: "border-orange-200 bg-orange-50 text-orange-700",
        bar: "bg-orange-500",
      }
    }

    return {
      label: "Healthy timing",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-500",
    }
  }

  const filteredTaskOps = state.tasks.filter((task) => {
    const campaign = state.campaigns.find((item) => item.id === task.campaignId)
    const haystack = `${task.title} ${task.description || ""} ${task.owner} ${task.status} ${task.priority} ${task.workstream || ""} ${campaign?.name || ""}`.toLowerCase()
    const monthValue = taskStartDateTime(task).slice(0, 7)

    return (
      (!taskOpsQuery.trim() || haystack.includes(taskOpsQuery.toLowerCase())) &&
      (taskOpsStatus === "all" || task.status === taskOpsStatus) &&
      (taskOpsPriority === "all" || task.priority === taskOpsPriority) &&
      (!taskOpsMonth || monthValue === taskOpsMonth) &&
      (!taskOpsDate || taskOperationalDate(task) === taskOpsDate)
    )
  })

  const selectedTaskOps = filteredTaskOps.find((task) => task.id === selectedTaskOpsId) || filteredTaskOps[0] || null
  const selectedDatesCampaign =
    state.campaigns.find((campaign) => campaign.id === selectedDatesCampaignId) ||
    selected ||
    state.campaigns[0] ||
    null

  function actionToneClasses(tone: ActionToastTone) {
    const map: Record<ActionToastTone, { shell: string; badge: string; bar: string; glow: string }> = {
      blue: {
        shell: "border-blue-200 bg-blue-50",
        badge: "bg-blue-600 text-white",
        bar: "bg-blue-600",
        glow: "shadow-[0_22px_70px_rgba(37,99,235,0.22)]",
      },
      emerald: {
        shell: "border-emerald-200 bg-emerald-50",
        badge: "bg-emerald-600 text-white",
        bar: "bg-emerald-500",
        glow: "shadow-[0_22px_70px_rgba(16,185,129,0.20)]",
      },
      rose: {
        shell: "border-rose-200 bg-rose-50",
        badge: "bg-rose-600 text-white",
        bar: "bg-rose-600",
        glow: "shadow-[0_22px_70px_rgba(225,29,72,0.22)]",
      },
      amber: {
        shell: "border-amber-200 bg-amber-50",
        badge: "bg-amber-500 text-white",
        bar: "bg-amber-500",
        glow: "shadow-[0_22px_70px_rgba(245,158,11,0.20)]",
      },
      violet: {
        shell: "border-violet-200 bg-violet-50",
        badge: "bg-violet-600 text-white",
        bar: "bg-violet-600",
        glow: "shadow-[0_22px_70px_rgba(124,58,237,0.20)]",
      },
      slate: {
        shell: "border-slate-200 bg-white",
        badge: "bg-slate-950 text-white",
        bar: "bg-slate-950",
        glow: "shadow-[0_22px_70px_rgba(15,23,42,0.16)]",
      },
    }

    return map[tone]
  }

  function inferActionToast(rawLabel: string): Omit<ActionToast, "id" | "progress"> {
    const label = rawLabel.replace(/\s+/g, " ").trim()
    const lower = label.toLowerCase()

    if (lower.includes("delete")) {
      return {
        title: "Deletion command running",
        detail: "Validating permissions, removing records and syncing campaign state.",
        tone: "rose",
        icon: "⌫",
      }
    }

    if (lower.includes("save") || lower.includes("create")) {
      return {
        title: lower.includes("create") ? "Creation command running" : "Save command running",
        detail: "Writing changes, syncing workspace state and updating campaign records.",
        tone: "blue",
        icon: lower.includes("create") ? "+" : "✓",
      }
    }

    if (lower.includes("edit")) {
      return {
        title: "Edit command opened",
        detail: "Preparing editable dossier fields and loading campaign context.",
        tone: "violet",
        icon: "✎",
      }
    }

    if (lower.includes("pause")) {
      return {
        title: "Pause command running",
        detail: "Freezing campaign execution and preserving current operational state.",
        tone: "amber",
        icon: "Ⅱ",
      }
    }

    if (lower.includes("resume")) {
      return {
        title: "Resume command running",
        detail: "Reactivating campaign execution and restoring active workflow controls.",
        tone: "emerald",
        icon: "▶",
      }
    }

    if (lower.includes("archive") || lower.includes("validate")) {
      return {
        title: "Archive validation running",
        detail: "Checking campaign status, validating closure and preparing archive state.",
        tone: "slate",
        icon: "◈",
      }
    }

    if (lower.includes("approval")) {
      return {
        title: "Approval command running",
        detail: "Preparing approval workflow and syncing decision queue.",
        tone: "amber",
        icon: "⬡",
      }
    }

    if (lower.includes("risk")) {
      return {
        title: "Risk command running",
        detail: "Opening risk control, logging exposure and updating escalation status.",
        tone: "rose",
        icon: "△",
      }
    }

    if (lower.includes("launch") || lower.includes("run check")) {
      return {
        title: "Launch readiness running",
        detail: "Checking launch gates, tasks, approvals, budget and risk readiness.",
        tone: "emerald",
        icon: "◇",
      }
    }

    if (lower.includes("export")) {
      return {
        title: "Export command running",
        detail: "Collecting workspace data and preparing export payload.",
        tone: "violet",
        icon: "⇩",
      }
    }

    if (lower.includes("select") || lower.includes("open")) {
      return {
        title: "Workspace command opened",
        detail: "Loading selected context and refreshing visible command sections.",
        tone: "slate",
        icon: "↗",
      }
    }

    return {
      title: "Action command running",
      detail: label ? `Processing: ${label}` : "Processing workspace action and syncing state.",
      tone: "blue",
      icon: "●",
    }
  }

  function triggerActionToast(rawLabel: string) {
    const toast = inferActionToast(rawLabel)

    if (actionToastTimerRef.current) {
      clearInterval(actionToastTimerRef.current)
      actionToastTimerRef.current = null
    }

    const id = `action_${Date.now()}`
    let progress = 0

    setActionToast({
      ...toast,
      id,
      progress,
    })

    const steps = [7, 13, 19, 27, 38, 49, 61, 73, 84, 93, 100]
    let stepIndex = 0

    actionToastTimerRef.current = setInterval(() => {
      progress = steps[stepIndex] ?? 100
      stepIndex += 1

      setActionToast((current) => {
        if (!current || current.id !== id) return current

        return {
          ...current,
          progress,
          title: progress >= 100 ? current.title.replace("running", "completed") : current.title,
        }
      })

      if (progress >= 100) {
        if (actionToastTimerRef.current) {
          clearInterval(actionToastTimerRef.current)
          actionToastTimerRef.current = null
        }

        setTimeout(() => {
          setActionToast((current) => current?.id === id ? null : current)
        }, 1400)
      }
    }, 145)
  }

  function handleCampaignLifecycleActionCapture(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement | null
    const actionElement = target?.closest("button, a") as HTMLButtonElement | HTMLAnchorElement | null

    if (!actionElement) return
    if (actionElement.closest("[data-action-toast-panel='true']")) return
    if ("disabled" in actionElement && actionElement.disabled) return
    if (actionElement.getAttribute("aria-disabled") === "true") return

    const label =
      actionElement.getAttribute("aria-label") ||
      actionElement.getAttribute("title") ||
      actionElement.textContent ||
      ""

    const cleanLabel = label.replace(/\s+/g, " ").trim()

    if (!cleanLabel) return
    if (cleanLabel.length <= 1 && !["+", "−"].includes(cleanLabel)) return

    triggerActionToast(cleanLabel)
  }

  function campaignLifecycleStatus(campaign: Campaign) {
    if (campaign.lifecycleStatus) return campaign.lifecycleStatus
    if (campaign.stage === "planning" || campaign.stage === "production") return "draft"
    if (campaign.stage === "optimization") return "archived"
    return "active"
  }

  function managementChannelName(campaign: Campaign): ChannelNodeName {
    const matched = channelNodes.find((node) => matchesChannel(campaign, node))
    return (matched?.name || "Meta Ads") as ChannelNodeName
  }

  function managementChannelIcon(campaign: Campaign) {
    return channelNodes.find((node) => node.name === managementChannelName(campaign))?.icon || "◎"
  }

  function managementAudienceType(campaign: Campaign) {
    const source = `${campaign.targetAudience} ${campaign.marketSegment} ${campaign.campaignType} ${campaign.businessAxis}`.toLowerCase()
    return source.includes("b2b") || source.includes("partner") || source.includes("clinic") || source.includes("school") || source.includes("creche") || source.includes("crèche") ? "B2B" : "B2C"
  }

  const managementCampaigns = state.campaigns.filter((campaign) => {
    const query = managementQuery.trim().toLowerCase()
    const haystack = `${campaign.name} ${campaign.objective} ${campaign.owner} ${campaign.targetAudience} ${campaign.channelMix} ${campaign.campaignType} ${campaign.businessAxis} ${campaign.marketSegment}`.toLowerCase()
    const status = campaignLifecycleStatus(campaign)
    const audienceType = managementAudienceType(campaign)
    const channelName = managementChannelName(campaign)

    return (
      (!query || haystack.includes(query)) &&
      (managementStage === "all" || campaign.stage === managementStage) &&
      (managementRisk === "all" || campaign.risk === managementRisk) &&
      (managementStatus === "all" || status === managementStatus) &&
      (managementChannel === "all" || channelName === managementChannel) &&
      (managementAudience === "all" || audienceType === managementAudience)
    )
  })

  const managementPageSize = 8
  const managementTotalPages = Math.max(1, Math.ceil(managementCampaigns.length / managementPageSize))
  const managementVisibleCampaigns = managementCampaigns.slice((managementPage - 1) * managementPageSize, managementPage * managementPageSize)

  const selectedManagementCampaign =
    state.campaigns.find((campaign) => campaign.id === state.selectedId) ||
    managementCampaigns[0] ||
    state.campaigns[0] ||
    null

  const selectedManagementTasks = selectedManagementCampaign
    ? state.tasks.filter((task) => task.campaignId === selectedManagementCampaign.id)
    : []

  const selectedManagementApprovals = selectedManagementCampaign
    ? state.approvals.filter((approval) => approval.campaignId === selectedManagementCampaign.id)
    : []

  const selectedManagementLogs = selectedManagementCampaign
    ? state.logs.filter((log) => log.campaignId === selectedManagementCampaign.id).slice(0, 6)
    : []

  const managementMetrics = {
    total: state.campaigns.length,
    active: state.campaigns.filter((campaign) => campaignLifecycleStatus(campaign) === "active").length,
    launchReady: state.campaigns.filter((campaign) => campaign.stage === "launch-ready" || campaign.stage === "live").length,
    atRisk: state.campaigns.filter((campaign) => campaign.risk === "high").length,
    dueThisWeek: state.tasks.filter((task) => {
      const due = new Date(`${task.dueDate || isoToday()}T23:59:59`)
      const now = new Date()
      const future = new Date()
      future.setDate(now.getDate() + 7)
      return due >= now && due <= future && task.status !== "done"
    }).length,
    budgetControlled: state.campaigns.length
      ? Math.round((state.campaigns.filter((campaign) => Number(campaign.spentMad || 0) <= Number(campaign.budgetMad || 0)).length / state.campaigns.length) * 100)
      : 0,
  }

  function directoryDaysRemaining(endDate?: string | null) {
    if (!endDate) return null
    const end = new Date(`${endDate}T23:59:59`)
    if (Number.isNaN(end.getTime())) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Math.ceil((end.getTime() - today.getTime()) / 86400000)
  }

  function directoryExpiryState(endDate?: string | null) {
    const days = directoryDaysRemaining(endDate)

    if (days === null) {
      return {
        label: "No end date",
        badge: "border-slate-200 bg-slate-50 text-slate-600",
        row: "",
        glow: "",
        bar: "bg-slate-300",
      }
    }

    if (days <= 0) {
      return {
        label: "Expired",
        badge: "border-rose-200 bg-rose-50 text-rose-700",
        row: "bg-rose-50/70",
        glow: "ring-1 ring-rose-200 shadow-[0_0_0_1px_rgba(244,63,94,0.16),0_12px_30px_rgba(244,63,94,0.10)]",
        bar: "bg-rose-500",
      }
    }

    if (days <= 20) {
      return {
        label: `${days} days left · expiring soon`,
        badge: "border-rose-200 bg-rose-50 text-rose-700 animate-pulse",
        row: "bg-rose-50/60 animate-pulse",
        glow: "ring-1 ring-rose-200 shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_14px_34px_rgba(244,63,94,0.12)]",
        bar: "bg-rose-500",
      }
    }

    if (days <= 50) {
      return {
        label: `${days} days left`,
        badge: "border-orange-200 bg-orange-50 text-orange-700",
        row: "bg-orange-50/45",
        glow: "ring-1 ring-orange-200",
        bar: "bg-orange-500",
      }
    }

    return {
      label: `${days} days left`,
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      row: "",
      glow: "",
      bar: "bg-emerald-500",
    }
  }

  function directoryChannelLabel(campaign: Campaign) {
    return managementChannelName(campaign)
  }

  function directoryChannelIcon(campaign: Campaign) {
    const channel = directoryChannelLabel(campaign)
    const node = channelNodes.find((item) => item.name === channel)
    return node?.icon || "•"
  }

  function directoryTypeLabel(campaign: Campaign) {
    return campaign.campaignType || campaign.businessAxis || "General"
  }

  function directoryChipClass(value?: string) {
    const lower = String(value || "").toLowerCase()

    if (lower.includes("live") || lower.includes("active") || lower.includes("low")) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    }

    if (lower.includes("approval") || lower.includes("review") || lower.includes("medium")) {
      return "border-amber-200 bg-amber-50 text-amber-700"
    }

    if (lower.includes("high") || lower.includes("critical") || lower.includes("blocked") || lower.includes("risk")) {
      return "border-rose-200 bg-rose-50 text-rose-700"
    }

    if (lower.includes("planning") || lower.includes("draft") || lower.includes("production")) {
      return "border-sky-200 bg-sky-50 text-sky-700"
    }

    if (lower.includes("launch")) {
      return "border-violet-200 bg-violet-50 text-violet-700"
    }

    return "border-slate-200 bg-slate-50 text-slate-600"
  }

  function premiumChannelVisual(name: string) {
    const lower = name.toLowerCase()

    if (lower.includes("meta")) {
      return { icon: "∞", accent: "#2563eb", soft: "rgba(37,99,235,0.10)", label: "Paid Media", status: "Active", action: "↗" }
    }

    if (lower.includes("google")) {
      return { icon: "G", accent: "#16a34a", soft: "rgba(22,163,74,0.10)", label: "Paid Search", status: "No campaigns", action: "—" }
    }

    if (lower.includes("whatsapp")) {
      return { icon: "✆", accent: "#16a34a", soft: "rgba(22,163,74,0.10)", label: "Owned Channel", status: "No campaigns", action: "—" }
    }

    if (lower.includes("email")) {
      return { icon: "✉", accent: "#7c3aed", soft: "rgba(124,58,237,0.10)", label: "Owned Channel", status: "No campaigns", action: "—" }
    }

    if (lower.includes("b2b")) {
      return { icon: "🤝", accent: "#f59e0b", soft: "rgba(245,158,11,0.12)", label: "Partnerships", status: "Exploring", action: "↗" }
    }

    if (lower.includes("field")) {
      return { icon: "⌖", accent: "#0891b2", soft: "rgba(8,145,178,0.10)", label: "Offline", status: "Planned", action: "◷" }
    }

    if (lower.includes("website")) {
      return { icon: "◎", accent: "#2563eb", soft: "rgba(37,99,235,0.10)", label: "Owned Web", status: "No campaigns", action: "—" }
    }

    if (lower.includes("referral")) {
      return { icon: "◇", accent: "#e11d48", soft: "rgba(225,29,72,0.10)", label: "Referral", status: "No campaigns", action: "—" }
    }

    if (lower.includes("crm")) {
      return { icon: "♣", accent: "#0d9488", soft: "rgba(13,148,136,0.10)", label: "CRM & Data", status: "Planned", action: "◷" }
    }

    if (lower.includes("influencer")) {
      return { icon: "★", accent: "#8b5cf6", soft: "rgba(139,92,246,0.10)", label: "Earned Channel", status: "Researching", action: "⌕" }
    }

    if (lower.includes("event")) {
      return { icon: "▦", accent: "#ef4444", soft: "rgba(239,68,68,0.10)", label: "Offline Events", status: "Upcoming", action: "▦" }
    }

    return { icon: "•", accent: "#64748b", soft: "rgba(100,116,139,0.10)", label: "Channel", status: "No campaigns", action: "—" }
  }

  function taskOperationalDate(task: Task) {
    return (task.startDateTime || task.dueDate || task.createdAt || isoToday()).slice(0, 10)
  }

  function taskEndOperationalDateTime(task: Task) {
    return task.endDateTime || `${task.dueDate || taskOperationalDate(task)}T17:00`
  }

  function taskDurationMinutes(task: Task) {
    const start = new Date(task.startDateTime || `${taskOperationalDate(task)}T09:00`)
    const end = new Date(taskEndOperationalDateTime(task))

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
      return 0
    }

    return Math.round((end.getTime() - start.getTime()) / 60000)
  }

  function taskIsDelayed(task: Task) {
    if (task.status === "done") return false

    const end = new Date(taskEndOperationalDateTime(task))
    if (Number.isNaN(end.getTime())) return false

    return end.getTime() < Date.now()
  }

  function prettyTaskDate(value: string) {
    const parsed = new Date(`${value}T12:00:00`)
    if (Number.isNaN(parsed.getTime())) return value

    return parsed.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "2-digit",
      year: "numeric",
    })
  }

  function shiftTaskOpsDate(days: number) {
    const current = new Date(`${taskOpsDate || isoToday()}T12:00:00`)
    if (Number.isNaN(current.getTime())) {
      setTaskOpsDate(isoToday())
      setTaskOpsMonth(isoToday().slice(0, 7))
      return
    }

    current.setDate(current.getDate() + days)
    const next = current.toISOString().slice(0, 10)
    setTaskOpsDate(next)
    setTaskOpsMonth(next.slice(0, 7))
  }

  const taskOpsDateRows = state.tasks.filter((task) => taskOperationalDate(task) === taskOpsDate)
  const taskOpsTodayRows = state.tasks.filter((task) => taskOperationalDate(task) === isoToday())
  const taskOpsInProgressRows = taskOpsDateRows.filter((task) => task.status === "doing")
  const taskOpsDelayedRows = taskOpsDateRows.filter((task) => taskIsDelayed(task))
  const taskOpsCompletedRows = taskOpsDateRows.filter((task) => task.status === "done")
  const taskOpsDurations = taskOpsDateRows.map(taskDurationMinutes).filter((duration) => duration > 0)
  const taskOpsAvgDurationMinutes = taskOpsDurations.length
    ? Math.round(taskOpsDurations.reduce((sum, duration) => sum + duration, 0) / taskOpsDurations.length)
    : 0

  const taskOpsAvgDurationLabel = taskOpsAvgDurationMinutes
    ? `${Math.floor(taskOpsAvgDurationMinutes / 60)}h ${taskOpsAvgDurationMinutes % 60}m`
    : "—"

  function timelineRowTone(daysLeft: number, progress: number) {
    if (daysLeft <= 0) return {
      shell: "border-rose-200 bg-gradient-to-r from-rose-50 via-white to-rose-50",
      icon: "bg-rose-50 text-rose-700 border-rose-200",
      badge: "border-rose-200 bg-rose-50 text-rose-700",
      bar: "bg-rose-500",
      dot: "bg-rose-500",
      label: "Expired"
    }

    if (progress >= 80 || daysLeft <= 7) return {
      shell: "border-rose-200 bg-gradient-to-r from-rose-50 via-white to-orange-50",
      icon: "bg-rose-50 text-rose-700 border-rose-200",
      badge: "border-rose-200 bg-rose-50 text-rose-700",
      bar: "bg-rose-500",
      dot: "bg-rose-500",
      label: "Expiring soon"
    }

    if (progress >= 50 || daysLeft <= 20) return {
      shell: "border-orange-200 bg-gradient-to-r from-orange-50 via-white to-amber-50",
      icon: "bg-orange-50 text-orange-700 border-orange-200",
      badge: "border-orange-200 bg-orange-50 text-orange-700",
      bar: "bg-orange-500",
      dot: "bg-orange-500",
      label: "Watch timing"
    }

    return {
      shell: "border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50",
      icon: "bg-emerald-50 text-emerald-700 border-emerald-200",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-500",
      dot: "bg-emerald-500",
      label: "Healthy timing"
    }
  }

  function exportWorkspace() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `angelcare-campaign-command-center-${isoToday()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    commit(state, "Workspace exported", "JSON export")
  }

  const kpis = [
    ["Active Campaigns", metrics.active, "Live records", "▣", "blue"],
    ["Launch Readiness", metrics.launchReady, "Ready/live", "◇", "emerald"],
    ["Budget Controlled", `${metrics.budgetControlled}%`, "Within MAD budget", "◔", "emerald"],
    ["High Risk", metrics.highRisk, "Needs action", "△", "rose"],
    ["ROAS", `${metrics.roas}x`, "MAD revenue/spend", "◈", "violet"],
    ["Leads", metrics.leads, "Total captured", "◌", "blue"],
    ["Tasks Due", metrics.tasksDue, "Open tasks", "□", "amber"],
    ["Approvals Due", metrics.approvalsDue, "Pending approvals", "⬡", "violet"],
  ] as const

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-white p-6 text-slate-950">
        <Card className="p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">ANGELCARE Market-OS</p>
          <h1 className="mt-2 text-3xl font-black">Loading campaign command center…</h1>
        </Card>
      </main>
    )
  }

  return (
    <main data-campaign-lifecycle-root="true" data-active-panel={activePanel} onClickCapture={handleCampaignLifecycleActionCapture} className="min-h-screen bg-white text-slate-950">

      <style>{`
        [data-campaign-lifecycle-root="true"] button,
        [data-campaign-lifecycle-root="true"] a[href] {
          min-height: 42px !important;
          border-radius: 16px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          padding: 10px 16px !important;
          font-size: 12px !important;
          font-weight: 900 !important;
          line-height: 1 !important;
          letter-spacing: -0.01em !important;
          color: #0f172a !important;
          border: 1px solid rgba(226, 232, 240, 0.95) !important;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.95) inset,
            0 10px 24px rgba(15, 23, 42, 0.07) !important;
          text-decoration: none !important;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            border-color 160ms ease,
            background 160ms ease,
            color 160ms ease !important;
          cursor: pointer !important;
          white-space: nowrap !important;
        }

        [data-campaign-lifecycle-root="true"] button:hover,
        [data-campaign-lifecycle-root="true"] a[href]:hover {
          transform: translateY(-1px) !important;
          border-color: rgba(147, 197, 253, 0.9) !important;
          background: linear-gradient(180deg, #ffffff 0%, #eff6ff 100%) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.95) inset,
            0 16px 34px rgba(37, 99, 235, 0.12) !important;
        }

        [data-campaign-lifecycle-root="true"] button:active,
        [data-campaign-lifecycle-root="true"] a[href]:active {
          transform: translateY(0) scale(0.99) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.75) inset,
            0 8px 18px rgba(15, 23, 42, 0.08) !important;
        }

        [data-campaign-lifecycle-root="true"] button:disabled,
        [data-campaign-lifecycle-root="true"] button[disabled] {
          opacity: 0.46 !important;
          cursor: not-allowed !important;
          transform: none !important;
          color: #64748b !important;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%) !important;
          box-shadow: none !important;
        }

        [data-campaign-lifecycle-root="true"] button[class*="bg-blue-600"],
        [data-campaign-lifecycle-root="true"] a[class*="bg-blue-600"] {
          color: #ffffff !important;
          border-color: rgba(37, 99, 235, 0.95) !important;
          background:
            radial-gradient(circle at 20% 0%, rgba(147, 197, 253, 0.55), transparent 34%),
            linear-gradient(135deg, #2563eb 0%, #1d4ed8 58%, #1e40af 100%) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.28) inset,
            0 16px 36px rgba(37, 99, 235, 0.26) !important;
        }

        [data-campaign-lifecycle-root="true"] button[class*="bg-blue-600"]:hover,
        [data-campaign-lifecycle-root="true"] a[class*="bg-blue-600"]:hover {
          color: #ffffff !important;
          background:
            radial-gradient(circle at 20% 0%, rgba(191, 219, 254, 0.65), transparent 34%),
            linear-gradient(135deg, #1d4ed8 0%, #1e40af 58%, #172554 100%) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.28) inset,
            0 20px 44px rgba(37, 99, 235, 0.34) !important;
        }

        [data-campaign-lifecycle-root="true"] button[class*="bg-slate-950"],
        [data-campaign-lifecycle-root="true"] a[class*="bg-slate-950"] {
          color: #ffffff !important;
          border-color: rgba(15, 23, 42, 0.95) !important;
          background:
            radial-gradient(circle at 20% 0%, rgba(148, 163, 184, 0.34), transparent 34%),
            linear-gradient(135deg, #0f172a 0%, #111827 100%) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.18) inset,
            0 16px 36px rgba(15, 23, 42, 0.20) !important;
        }

        [data-campaign-lifecycle-root="true"] button[class*="bg-rose-600"],
        [data-campaign-lifecycle-root="true"] a[class*="bg-rose-600"] {
          color: #ffffff !important;
          border-color: rgba(225, 29, 72, 0.95) !important;
          background:
            radial-gradient(circle at 20% 0%, rgba(251, 113, 133, 0.50), transparent 34%),
            linear-gradient(135deg, #e11d48 0%, #be123c 58%, #9f1239 100%) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.22) inset,
            0 16px 36px rgba(225, 29, 72, 0.24) !important;
        }

        [data-campaign-lifecycle-root="true"] button[class*="bg-rose-600"]:hover,
        [data-campaign-lifecycle-root="true"] a[class*="bg-rose-600"]:hover {
          color: #ffffff !important;
          background:
            radial-gradient(circle at 20% 0%, rgba(251, 113, 133, 0.60), transparent 34%),
            linear-gradient(135deg, #be123c 0%, #9f1239 58%, #881337 100%) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.22) inset,
            0 20px 44px rgba(225, 29, 72, 0.30) !important;
        }

        [data-campaign-lifecycle-root="true"] button[class*="bg-orange-50"],
        [data-campaign-lifecycle-root="true"] button[class*="border-orange-200"] {
          color: #9a3412 !important;
          border-color: rgba(251, 146, 60, 0.45) !important;
          background: linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.9) inset,
            0 12px 28px rgba(249, 115, 22, 0.10) !important;
        }

        [data-campaign-lifecycle-root="true"] button[class*="bg-emerald-50"],
        [data-campaign-lifecycle-root="true"] button[class*="border-emerald-200"] {
          color: #047857 !important;
          border-color: rgba(52, 211, 153, 0.50) !important;
          background: linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.9) inset,
            0 12px 28px rgba(16, 185, 129, 0.10) !important;
        }

        [data-campaign-lifecycle-root="true"] button[class*="bg-amber-50"],
        [data-campaign-lifecycle-root="true"] button[class*="border-amber-200"] {
          color: #92400e !important;
          border-color: rgba(251, 191, 36, 0.58) !important;
          background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.9) inset,
            0 12px 28px rgba(245, 158, 11, 0.10) !important;
        }

        [data-campaign-lifecycle-root="true"] button[class*="bg-violet-50"],
        [data-campaign-lifecycle-root="true"] button[class*="border-violet-100"] {
          color: #6d28d9 !important;
          border-color: rgba(196, 181, 253, 0.70) !important;
          background: linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.9) inset,
            0 12px 28px rgba(124, 58, 237, 0.10) !important;
        }

        [data-campaign-lifecycle-root="true"] button[class*="bg-sky-50"],
        [data-campaign-lifecycle-root="true"] button[class*="border-sky-100"] {
          color: #0369a1 !important;
          border-color: rgba(125, 211, 252, 0.70) !important;
          background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.9) inset,
            0 12px 28px rgba(14, 165, 233, 0.10) !important;
        }

        [data-campaign-lifecycle-root="true"] aside button {
          min-height: 40px !important;
          justify-content: flex-start !important;
          box-shadow: none !important;
          background: transparent !important;
          border-color: transparent !important;
          padding: 10px 12px !important;
        }

        [data-campaign-lifecycle-root="true"] aside button:hover {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
          border-color: rgba(226, 232, 240, 0.95) !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06) !important;
        }

        [data-campaign-lifecycle-root="true"] aside button[class*="bg-blue-50"] {
          background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%) !important;
          border-color: rgba(191, 219, 254, 0.95) !important;
          color: #1d4ed8 !important;
          box-shadow: 0 12px 28px rgba(37, 99, 235, 0.10) !important;
        }

        [data-campaign-lifecycle-root="true"] button[class*="grid h-"],
        [data-campaign-lifecycle-root="true"] span[class*="grid h-"] {
          padding: 0 !important;
        }

        [data-campaign-lifecycle-root="true"] button:focus-visible,
        [data-campaign-lifecycle-root="true"] a[href]:focus-visible {
          outline: none !important;
          box-shadow:
            0 0 0 4px rgba(147, 197, 253, 0.45),
            0 16px 34px rgba(37, 99, 235, 0.14) !important;
        }
      `}
</style>

      {actionToast ? (
        <div
          data-action-toast-panel="true"
          className={`fixed right-5 top-32 z-[2147483646] w-[390px] overflow-hidden rounded-[28px] border bg-white/95 backdrop-blur-2xl ${actionToneClasses(actionToast.tone).shell} ${actionToneClasses(actionToast.tone).glow}`}
        >
          <div className="border-b border-white/70 bg-white/70 p-5">
            <div className="flex items-start gap-4">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-base font-black ${actionToneClasses(actionToast.tone).badge}`}>
                {actionToast.progress >= 100 ? "✓" : actionToast.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                      ANGELCARE ACTION CONFIRMATION
                    </p>
                    <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">
                      {actionToast.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActionToast(null)}
                    className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-500 shadow-sm"
                    aria-label="Close action confirmation"
                  >
                    ×
                  </button>
                </div>

                <p className="mt-2 text-sm font-bold leading-5 text-slate-500">
                  {actionToast.detail}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Progress
              </span>
              <span className="text-sm font-black text-slate-950">
                {actionToast.progress}%
              </span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-150 ${actionToneClasses(actionToast.tone).bar}`}
                style={{ width: `${actionToast.progress}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/75 px-3 py-2 text-center shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Validate</p>
                <p className="mt-1 text-xs font-black text-slate-700">{actionToast.progress >= 25 ? "Done" : "..."}</p>
              </div>
              <div className="rounded-2xl bg-white/75 px-3 py-2 text-center shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Sync</p>
                <p className="mt-1 text-xs font-black text-slate-700">{actionToast.progress >= 65 ? "Done" : "..."}</p>
              </div>
              <div className="rounded-2xl bg-white/75 px-3 py-2 text-center shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Close</p>
                <p className="mt-1 text-xs font-black text-slate-700">{actionToast.progress >= 100 ? "Ready" : "..."}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}


      <div className="grid min-h-screen xl:grid-cols-[292px_minmax(0,1fr)]">
        <aside className="border-r border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white">AC</div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">ANGELCARE</p>
              <h2 className="text-lg font-black">Market-OS</h2>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black text-slate-500">Campaign OS</p>
            <p className="mt-1 text-sm font-black text-slate-950">Enterprise Workspace</p>
          </div>

          <nav className="mt-6 grid gap-1 text-sm font-black text-slate-700">
            {[
              { labelText: "Command Board", icon: "⌘", panel: "overview", keyName: "command" },
              { labelText: "Execution Workspace", icon: "✣", panel: "execution", keyName: "execution" },
              { labelText: "Campaign Management", icon: "▣", panel: "management", keyName: "management" },
              { labelText: "Launch Control", icon: "◇", panel: "launch", keyName: "launch" },
              { labelText: "Budget Cockpit", icon: "MAD", panel: "budget", keyName: "budget" },
              { labelText: "Risk Center", icon: "△", panel: "risk", keyName: "risk" },
              { labelText: "Performance Pulse", icon: "↗", panel: "performance", keyName: "performance" },
              { labelText: "Approvals", icon: "⬡", panel: "approvals", keyName: "approvals" },
              { labelText: "Calendar", icon: "◷", panel: "calendar", keyName: "calendar" },
            ].map((item) => (
              <button
                key={item.keyName}
                type="button"
                onClick={() => handleSidebarAction(item.keyName as SidebarKey, item.panel as Panel)}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  sidebarActive === item.keyName
                    ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <span className={`grid h-8 w-8 place-items-center rounded-xl border text-[11px] font-black transition ${
                  sidebarActive === item.keyName
                    ? "border-blue-100 bg-white text-blue-700"
                    : "border-slate-200 bg-white text-slate-500 group-hover:text-slate-900"
                }`}>
                  {item.icon}
                </span>

                <span className="flex-1">{item.labelText}</span>

                {item.labelText === "Approvals" && metrics.approvalsDue ? (
                  <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] text-rose-700">
                    {metrics.approvalsDue}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <Link href="/market-os" className="mt-8 flex rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600">← Back to Market OS</Link>
        </aside>

        <section className="min-w-0 bg-slate-50/70">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur-xl">
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">System Status</p>
                  <p className="text-xs font-black text-emerald-900">All systems operational</p>
                </div>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search campaigns, tasks, owners, or keywords..." className="h-12 min-w-[280px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
              </div>

                            {/* Top header action buttons removed permanently. Actions remain available in sidebar, dashboard cards, portfolio, and modal. */}
            </div>
          </header>

          <div className="space-y-5 p-5">
            <section className="flex flex-wrap items-end justify-between gap-4">
              <div data-command-dashboard-shell="true">
                <h1 className="text-4xl font-black tracking-[-0.06em] text-slate-950">ANGELCARE Campaign Command Center</h1>
                <p className="mt-2 text-sm font-bold text-slate-500">Execute with precision. Control risk. Maximize performance.</p>
              </div>
              <button onClick={exportWorkspace} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">Export Workspace</button>
            </section>

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
              {kpis.map(([labelText, value, note, icon, tone]) => (
                <Card key={labelText} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{labelText}</p>
                      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
                    </div>
                    <Icon icon={icon} tone={(tone) as "blue" | "emerald" | "rose" | "amber" | "violet" | "slate"} />
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-500">{note}</p>
                </Card>
              ))}
            </section>
            


            
            {activePanel === "management" ? (
              <section id="campaign-management-workspace" className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-4xl font-black tracking-[-0.06em] text-slate-950">
                        Campaign Management
                      </h1>
                      <span className="grid h-9 w-9 place-items-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-500 shadow-sm">
                        ☆
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-500">
                      Central directory and management workspace for all ANGELCARE campaigns.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm">
                      Customize View
                    </button>
                    <button type="button" onClick={openCreateModal} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.22)]">
                      + New Campaign
                    </button>
                  </div>
                </div>

                <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  {[
                    ["Total Campaigns", managementMetrics.total, "All channels & types", "⌘", "blue"],
                    ["Active", managementMetrics.active, `${managementMetrics.total ? Math.round((managementMetrics.active / managementMetrics.total) * 100) : 0}% of total`, "↗", "emerald"],
                    ["Launch Ready", managementMetrics.launchReady, "Ready/live", "◇", "violet"],
                    ["At Risk", managementMetrics.atRisk, "Needs action", "△", "rose"],
                    ["Due This Week", managementMetrics.dueThisWeek, "Open task deadlines", "▦", "amber"],
                    ["Budget Controlled", `${managementMetrics.budgetControlled}%`, "On track", "✓", "emerald"],
                  ].map(([labelText, value, note, icon, tone]) => (
                    <Card key={labelText} className="p-4">
                      <div className="flex items-center gap-3">
                        <Icon icon={String(icon)} tone={(String(tone)) as "blue" | "emerald" | "rose" | "amber" | "violet" | "slate"} />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{labelText}</p>
                          <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
                          <p className="mt-1 truncate text-xs font-bold text-slate-500">{note}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </section>

                <Card className="p-4">
                  <div className="grid gap-3 xl:grid-cols-[minmax(360px,1fr)_140px_160px_130px_130px_130px_auto_auto]">
                    <input
                      value={managementQuery}
                      onChange={(event) => {
                        setManagementQuery(event.target.value)
                        setManagementPage(1)
                      }}
                      placeholder="Search campaigns by name, audience, owner..."
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />

                    <Select value={managementChannel} onChange={(event) => { setManagementChannel(event.target.value as "all" | ChannelNodeName); setManagementPage(1) }}>
                      <option value="all">Channel</option>
                      {channelNodes.map((channel) => <option key={channel.name} value={channel.name}>{channel.name}</option>)}
                    </Select>

                    <Select value={managementAudience} onChange={(event) => { setManagementAudience(event.target.value as "all" | "B2B" | "B2C"); setManagementPage(1) }}>
                      <option value="all">Campaign Type</option>
                      <option value="B2B">B2B</option>
                      <option value="B2C">B2C</option>
                    </Select>

                    <Select value={managementStage} onChange={(event) => { setManagementStage(event.target.value as "all" | Campaign["stage"]); setManagementPage(1) }}>
                      <option value="all">Stage</option>
                      {stages.map((stage) => <option key={stage} value={stage}>{stageLabel[stage]}</option>)}
                    </Select>

                    <Select value={managementStatus} onChange={(event) => { setManagementStatus(event.target.value as "all" | "active" | "paused" | "archived" | "draft"); setManagementPage(1) }}>
                      <option value="all">Status</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="archived">Archived</option>
                      <option value="draft">Draft</option>
                    </Select>

                    <Select value={managementRisk} onChange={(event) => { setManagementRisk(event.target.value as "all" | Risk); setManagementPage(1) }}>
                      <option value="all">Risk</option>
                      {risks.map((risk) => <option key={risk} value={risk}>{riskLabel[risk]}</option>)}
                    </Select>

                    <button
                      type="button"
                      onClick={() => {
                        setManagementQuery("")
                        setManagementStage("all")
                        setManagementRisk("all")
                        setManagementStatus("all")
                        setManagementChannel("all")
                        setManagementAudience("all")
                        setManagementPage(1)
                      }}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-blue-700 shadow-sm"
                    >
                      Clear All
                    </button>

                    <div className="flex gap-2">
                      <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm">Import</button>
                      <button type="button" onClick={exportWorkspace} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm">Export</button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      ["Active", "active"],
                      ["Draft", "draft"],
                      ["Archived", "archived"],
                    ].map(([labelText, value]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setManagementStatus(value as "active" | "draft" | "archived"); setManagementPage(1) }}
                        className={`rounded-full border px-4 py-2 text-xs font-black ${
                          managementStatus === value ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        {labelText}
                      </button>
                    ))}

                    <span className="mx-1 h-8 w-px bg-slate-200" />

                    {["B2B", "B2C"].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setManagementAudience(value as "B2B" | "B2C"); setManagementPage(1) }}
                        className={`rounded-full border px-4 py-2 text-xs font-black ${
                          managementAudience === value ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        {value}
                      </button>
                    ))}

                    <span className="mx-1 h-8 w-px bg-slate-200" />

                    {["Digital", "Offline", "Partnerships"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const target =
                            tag === "Partnerships"
                              ? "B2B Partnerships"
                              : tag === "Offline"
                                ? "Events"
                                : "Meta Ads"
                          setManagementChannel(target as ChannelNodeName)
                          setManagementPage(1)
                        }}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </Card>

                <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_520px]">
                  <Card className="overflow-hidden p-0">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 px-6 py-5">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">Directory</p>
                        <h3 className="mt-1 text-3xl font-black tracking-[-0.05em] text-slate-950">
                          Campaign Directory ({managementCampaigns.length})
                        </h3>
                        <p className="mt-2 text-sm font-bold text-slate-500">
                          Premium campaign directory with live tags, channel identity, expiry alerts and scroll-first management.
                        </p>
                      </div>

                      <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
                        <button
                          type="button"
                          onClick={() => setDirectoryView("columns")}
                          className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                            directoryView === "columns"
                              ? "bg-white text-slate-950 shadow-sm"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Columns
                        </button>
                        <button
                          type="button"
                          onClick={() => setDirectoryView("grid")}
                          className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                            directoryView === "grid"
                              ? "bg-white text-slate-950 shadow-sm"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Grid
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[780px] overflow-auto px-6 py-5">
                      {directoryView === "columns" ? (
                        <div className="min-w-[1360px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                          <table className="w-full table-fixed border-collapse">
                            <colgroup>
                              <col className="w-[52px]" />
                              <col className="w-[260px]" />
                              <col className="w-[145px]" />
                              <col className="w-[145px]" />
                              <col className="w-[110px]" />
                              <col className="w-[145px]" />
                              <col className="w-[120px]" />
                              <col className="w-[120px]" />
                              <col className="w-[175px]" />
                              <col className="w-[115px]" />
                              <col className="w-[105px]" />
                              <col className="w-[80px]" />
                              <col className="w-[130px]" />
                            </colgroup>

                            <thead className="sticky top-0 z-10 bg-slate-50">
                              <tr className="border-b border-slate-200 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                <th className="px-4 py-4"></th>
                                <th className="px-4 py-4">Campaign</th>
                                <th className="px-4 py-4">Channel</th>
                                <th className="px-4 py-4">Type</th>
                                <th className="px-4 py-4">Audience</th>
                                <th className="px-4 py-4">Owner</th>
                                <th className="px-4 py-4">Stage</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Risk + Expiry</th>
                                <th className="px-4 py-4">End Date</th>
                                <th className="px-4 py-4">Budget</th>
                                <th className="px-4 py-4">Leads</th>
                                <th className="px-4 py-4">Ready</th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                              {managementCampaigns.length ? managementCampaigns.map((campaign) => {
                                const expiry = directoryExpiryState(campaign.endDate)
                                const selectedRow = selectedManagementCampaign?.id === campaign.id
                                const status = campaignLifecycleStatus(campaign)
                                const readiness = Number(campaign.readiness || 0)
                                const channel = channelNodes.find((node) => node.name === managementChannelName(campaign))

                                return (
                                  <tr
                                    key={campaign.id}
                                    onClick={() => setState({ ...state, selectedId: campaign.id })}
                                    className={`cursor-pointer transition hover:bg-blue-50/50 ${selectedRow ? "bg-blue-50/70" : "bg-white"} ${expiry.row}`}
                                  >
                                    <td className="px-4 py-4 align-middle">
                                      <span className={`block h-4 w-4 rounded-md border shadow-sm ${selectedRow ? "border-blue-500 bg-blue-500" : "border-slate-300 bg-white"}`} />
                                    </td>

                                    <td className="px-4 py-4 align-middle">
                                      <div className={`rounded-2xl px-3 py-2 ${expiry.glow}`}>
                                        <p className="truncate text-sm font-black tracking-[-0.02em] text-slate-950">{campaign.name}</p>
                                        <p className="mt-1 truncate text-xs font-bold text-slate-500">{campaign.objective || "No objective written yet."}</p>
                                      </div>
                                    </td>

                                    <td className="px-4 py-4 align-middle">
                                      <div className="flex items-center gap-2">
                                        <span className="grid h-9 w-9 place-items-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-blue-700 shadow-sm">
                                          {channel?.icon || "•"}
                                        </span>
                                        <span className="truncate text-xs font-black text-slate-700">{managementChannelName(campaign)}</span>
                                      </div>
                                    </td>

                                    <td className="px-4 py-4 align-middle text-xs font-black text-slate-700">{campaign.campaignType || campaign.businessAxis || "General"}</td>
                                    <td className="px-4 py-4 align-middle text-xs font-black text-slate-700">{managementAudienceType(campaign)}</td>
                                    <td className="px-4 py-4 align-middle text-xs font-black text-slate-700">{campaign.owner || "Unassigned"}</td>

                                    <td className="px-4 py-4 align-middle">
                                      <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${directoryChipClass(stageLabel[campaign.stage])}`}>
                                        {stageLabel[campaign.stage]}
                                      </span>
                                    </td>

                                    <td className="px-4 py-4 align-middle">
                                      <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${directoryChipClass(status)}`}>
                                        {status}
                                      </span>
                                    </td>

                                    <td className="px-4 py-4 align-middle">
                                      <div className="flex flex-col gap-1.5">
                                        <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${directoryChipClass(riskLabel[campaign.risk])}`}>
                                          {riskLabel[campaign.risk]}
                                        </span>
                                        <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[10px] font-black ${expiry.badge}`}>
                                          {expiry.label}
                                        </span>
                                      </div>
                                    </td>

                                    <td className="px-4 py-4 align-middle text-xs font-black text-slate-700">{campaign.endDate || "—"}</td>
                                    <td className="px-4 py-4 align-middle text-xs font-black text-slate-950">{mad(campaign.budgetMad)}</td>
                                    <td className="px-4 py-4 align-middle text-xs font-black text-slate-950">{campaign.leads || 0}</td>

                                    <td className="px-4 py-4 align-middle">
                                      <div className="flex items-center gap-2">
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                          <div
                                            className={`h-full rounded-full ${
                                              readiness >= 80 ? "bg-emerald-500" : readiness >= 50 ? "bg-orange-400" : "bg-rose-500"
                                            }`}
                                            style={{ width: `${readiness}%` }}
                                          />
                                        </div>
                                        <span className="shrink-0 text-xs font-black text-slate-700">{readiness}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              }) : (
                                <tr>
                                  <td colSpan={13} className="px-4 py-12 text-center">
                                    <p className="text-2xl font-black text-slate-950">No campaign records found</p>
                                    <p className="mt-2 text-sm font-bold text-slate-500">Create a campaign or reset filters to populate the directory.</p>
                                    <button type="button" onClick={openCreateModal} className="mt-5 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
                                      + New Campaign
                                    </button>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                          {managementCampaigns.length ? managementCampaigns.map((campaign) => {
                            const expiry = directoryExpiryState(campaign.endDate)
                            const selectedCard = selectedManagementCampaign?.id === campaign.id
                            const status = campaignLifecycleStatus(campaign)
                            const readiness = Number(campaign.readiness || 0)
                            const channel = channelNodes.find((node) => node.name === managementChannelName(campaign))

                            return (
                              <div
                                key={campaign.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setState({ ...state, selectedId: campaign.id })}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    setState({ ...state, selectedId: campaign.id })
                                  }
                                }}
                                className={`cursor-pointer rounded-[30px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-[2px] hover:shadow-[0_22px_48px_rgba(15,23,42,0.10)] ${
                                  selectedCard ? "border-blue-200 ring-4 ring-blue-50" : ""
                                } ${expiry.row} ${expiry.glow}`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-xl font-black text-blue-700 shadow-sm">
                                      {channel?.icon || "•"}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="truncate text-xl font-black tracking-[-0.04em] text-slate-950">{campaign.name}</p>
                                      <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-500">{campaign.objective || "No objective written yet."}</p>
                                    </div>
                                  </div>

                                  <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${expiry.badge}`}>
                                    {expiry.label}
                                  </span>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${directoryChipClass(stageLabel[campaign.stage])}`}>{stageLabel[campaign.stage]}</span>
                                  <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${directoryChipClass(status)}`}>{status}</span>
                                  <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${directoryChipClass(riskLabel[campaign.risk])}`}>{riskLabel[campaign.risk]}</span>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Budget</p>
                                    <p className="mt-2 text-lg font-black text-slate-950">{mad(campaign.budgetMad)}</p>
                                  </div>
                                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Leads</p>
                                    <p className="mt-2 text-lg font-black text-slate-950">{campaign.leads || 0}</p>
                                  </div>
                                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Channel</p>
                                    <p className="mt-2 text-sm font-black text-slate-700">{managementChannelName(campaign)}</p>
                                  </div>
                                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Owner</p>
                                    <p className="mt-2 text-sm font-black text-slate-700">{campaign.owner || "Unassigned"}</p>
                                  </div>
                                </div>

                                <div className="mt-5">
                                  <div className="mb-2 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Readiness</span>
                                    <span className="text-sm font-black text-slate-700">{readiness}%</span>
                                  </div>
                                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className={`h-full rounded-full ${
                                        readiness >= 80 ? "bg-emerald-500" : readiness >= 50 ? "bg-orange-400" : "bg-rose-500"
                                      }`}
                                      style={{ width: `${readiness}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                  <div className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">
                                    Open dossier
                                  </div>
                                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-700">
                                    End {campaign.endDate || "—"}
                                  </div>
                                </div>
                              </div>
                            )
                          }) : (
                            <div className="rounded-[28px] border border-dashed border-blue-200 bg-blue-50/40 p-10 text-center sm:col-span-2 2xl:col-span-3">
                              <p className="text-2xl font-black text-slate-950">No campaign records found</p>
                              <p className="mt-2 text-sm font-bold text-slate-500">Create a campaign or reset filters to populate the directory.</p>
                              <button type="button" onClick={openCreateModal} className="mt-5 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
                                + New Campaign
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="overflow-hidden p-0">
                    {selectedManagementCampaign ? (
                      <>
                        <div className="border-b border-slate-100 bg-gradient-to-br from-white via-blue-50/50 to-slate-50 p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-3xl font-black tracking-[-0.05em] text-slate-950">
                                  {selectedManagementCampaign.name}
                                </h3>
                                <Pill tone={(campaignLifecycleStatus(selectedManagementCampaign) === "active" ? "emerald" : campaignLifecycleStatus(selectedManagementCampaign) === "paused" ? "amber" : "slate") as "blue" | "emerald" | "rose" | "amber" | "violet" | "slate"}>
                                  {campaignLifecycleStatus(selectedManagementCampaign)}
                                </Pill>
                              </div>

                              <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-slate-500">
                                {selectedManagementCampaign.objective || "No objective written yet."}
                              </p>

                              <div className="mt-4 flex flex-wrap gap-2">
                                <Pill tone="blue">{managementChannelName(selectedManagementCampaign)}</Pill>
                                <Pill tone="violet">{selectedManagementCampaign.campaignType || "Campaign"}</Pill>
                                <Pill tone="slate">{managementAudienceType(selectedManagementCampaign)}</Pill>
                                <Pill tone={riskTone(selectedManagementCampaign.risk) as any}>{riskLabel[selectedManagementCampaign.risk]}</Pill>
                              </div>
                            </div>

                            <div className="flex shrink-0 gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(selectedManagementCampaign)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteCampaignPermanently(selectedManagementCampaign.id)}
                                className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(225,29,72,0.22)]"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="mt-6 grid grid-cols-2 gap-2 xl:grid-cols-4">
                            {[
                              ["overview", "Overview", "◉"],
                              ["schedule", "Schedule", "▦"],
                              ["budget", "Budget", "MAD"],
                              ["channels", "Channel Mix", "◎"],
                              ["tasks", "Tasks", "✓"],
                              ["approvals", "Approvals", "◇"],
                              ["activity", "Activity", "↯"],
                            ].map(([key, labelText, icon]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setManagementTab(key as typeof managementTab)}
                                className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                                  managementTab === key
                                    ? "border-blue-200 bg-blue-50 text-blue-700 shadow-[0_12px_28px_rgba(37,99,235,0.10)]"
                                    : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50/40"
                                }`}
                              >
                                <span className="mr-2 text-xs">{icon}</span>
                                {labelText}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="max-h-[780px] overflow-y-auto bg-white p-6">
                          {managementTab === "overview" ? (
                            <div className="grid gap-5">
                              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Budget</p>
                                  <p className="mt-2 text-2xl font-black text-slate-950">{mad(selectedManagementCampaign.budgetMad)}</p>
                                </div>
                                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Spend</p>
                                  <p className="mt-2 text-2xl font-black text-slate-950">{mad(selectedManagementCampaign.spentMad)}</p>
                                </div>
                                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Leads</p>
                                  <p className="mt-2 text-2xl font-black text-slate-950">{selectedManagementCampaign.leads}</p>
                                </div>
                                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Readiness</p>
                                  <p className="mt-2 text-2xl font-black text-slate-950">{selectedManagementCampaign.readiness}%</p>
                                </div>
                              </div>

                              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                                <div className="mb-4 flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">Overview Editor</p>
                                    <h4 className="mt-1 text-xl font-black text-slate-950">Campaign core information</h4>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => updateCampaign(selectedManagementCampaign.id, { updatedAt: new Date().toISOString() }, "Campaign overview saved")}
                                    className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
                                  >
                                    Save Overview
                                  </button>
                                </div>

                                <div className="grid gap-4">
                                  <Field label="Campaign name">
                                    <Input
                                      value={selectedManagementCampaign.name}
                                      onChange={(event) => updateCampaign(selectedManagementCampaign.id, { name: event.target.value }, "Campaign name updated")}
                                    />
                                  </Field>

                                  <Field label="Objective">
                                    <textarea
                                      value={selectedManagementCampaign.objective || ""}
                                      onChange={(event) => updateCampaign(selectedManagementCampaign.id, { objective: event.target.value }, "Campaign objective updated")}
                                      className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                                      placeholder="Write the operational campaign objective..."
                                    />
                                  </Field>

                                  <div className="grid gap-4 md:grid-cols-2">
                                    <Field label="Owner">
                                      <Input
                                        value={selectedManagementCampaign.owner || ""}
                                        onChange={(event) => updateCampaign(selectedManagementCampaign.id, { owner: event.target.value }, "Campaign owner updated")}
                                      />
                                    </Field>

                                    <Field label="Campaign type">
                                      <Input
                                        value={selectedManagementCampaign.campaignType || ""}
                                        onChange={(event) => updateCampaign(selectedManagementCampaign.id, { campaignType: event.target.value }, "Campaign type updated")}
                                      />
                                    </Field>

                                    <Field label="Audience / Market segment">
                                      <Input
                                        value={selectedManagementCampaign.targetAudience || selectedManagementCampaign.marketSegment || ""}
                                        onChange={(event) => updateCampaign(selectedManagementCampaign.id, { targetAudience: event.target.value, marketSegment: event.target.value }, "Audience updated")}
                                      />
                                    </Field>

                                    <Field label="Readiness %">
                                      <Input
                                        type="number"
                                        value={selectedManagementCampaign.readiness}
                                        onChange={(event) => updateCampaign(selectedManagementCampaign.id, { readiness: Math.max(0, Math.min(100, Number(event.target.value))) }, "Readiness updated")}
                                      />
                                    </Field>

                                    <Field label="Stage">
                                      <Select
                                        value={selectedManagementCampaign.stage}
                                        onChange={(event) => updateCampaign(selectedManagementCampaign.id, { stage: event.target.value as Stage }, "Campaign stage updated")}
                                      >
                                        {stages.map((stage) => <option key={stage} value={stage}>{stageLabel[stage]}</option>)}
                                      </Select>
                                    </Field>

                                    <Field label="Risk level">
                                      <Select
                                        value={selectedManagementCampaign.risk}
                                        onChange={(event) => updateCampaign(selectedManagementCampaign.id, { risk: event.target.value as Risk }, "Risk updated")}
                                      >
                                        {risks.map((risk) => <option key={risk} value={risk}>{riskLabel[risk]}</option>)}
                                      </Select>
                                    </Field>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {managementTab === "schedule" ? (
                            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-emerald-50/40 p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">Schedule Workspace</p>
                                  <h4 className="mt-1 text-xl font-black text-slate-950">Dates, lifecycle control and campaign timing</h4>
                                  <p className="mt-1 text-sm font-bold text-slate-500">Manage campaign start, end, pause, resume and archive state.</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => updateCampaign(selectedManagementCampaign.id, { updatedAt: new Date().toISOString() }, "Campaign schedule saved")}
                                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
                                >
                                  Save Schedule
                                </button>
                              </div>

                              <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <Field label="Start date">
                                  <Input
                                    type="date"
                                    value={selectedManagementCampaign.startDate || ""}
                                    onChange={(event) => updateCampaign(selectedManagementCampaign.id, { startDate: event.target.value }, "Start date updated")}
                                  />
                                </Field>

                                <Field label="End date">
                                  <Input
                                    type="date"
                                    value={selectedManagementCampaign.endDate || ""}
                                    onChange={(event) => updateCampaign(selectedManagementCampaign.id, { endDate: event.target.value }, "End date updated")}
                                  />
                                </Field>
                              </div>

                              <div className="mt-5 grid gap-3 md:grid-cols-2">
                                <button type="button" onClick={() => updateCampaign(selectedManagementCampaign.id, { lifecycleStatus: "paused" }, "Campaign paused")} className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-black text-orange-700">Pause Campaign</button>
                                <button type="button" onClick={() => updateCampaign(selectedManagementCampaign.id, { lifecycleStatus: "active" }, "Campaign resumed")} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">Resume Campaign</button>
                                <button type="button" onClick={() => updateCampaign(selectedManagementCampaign.id, { lifecycleStatus: "archived", stage: "optimization" }, "Campaign validated and archived")} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Validate & Archive</button>
                                <button type="button" onClick={() => deleteCampaignPermanently(selectedManagementCampaign.id)} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white">Delete Permanently</button>
                              </div>
                            </div>
                          ) : null}

                          {managementTab === "budget" ? (
                            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-blue-50/30 p-5">
                              <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">Budget Workspace</p>
                                  <h4 className="mt-1 text-xl font-black text-slate-950">Budget, spend and return control</h4>
                                  <p className="mt-1 text-sm font-bold text-slate-500">All values are controlled in MAD.</p>
                                </div>
                                <button type="button" onClick={() => updateCampaign(selectedManagementCampaign.id, { updatedAt: new Date().toISOString() }, "Budget saved")} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">Save Budget</button>
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Budget MAD"><Input type="number" value={selectedManagementCampaign.budgetMad} onChange={(event) => updateCampaign(selectedManagementCampaign.id, { budgetMad: Number(event.target.value) }, "Budget updated")} /></Field>
                                <Field label="Spend MAD"><Input type="number" value={selectedManagementCampaign.spentMad} onChange={(event) => updateCampaign(selectedManagementCampaign.id, { spentMad: Number(event.target.value) }, "Spend updated")} /></Field>
                                <Field label="Revenue MAD"><Input type="number" value={selectedManagementCampaign.revenueMad} onChange={(event) => updateCampaign(selectedManagementCampaign.id, { revenueMad: Number(event.target.value) }, "Revenue updated")} /></Field>

                                <div className="rounded-[22px] border border-blue-100 bg-blue-50 p-4">
                                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">ROAS</p>
                                  <p className="mt-2 text-4xl font-black text-slate-950">{roas(selectedManagementCampaign)}x</p>
                                  <p className="mt-1 text-xs font-bold text-slate-500">Revenue divided by campaign spend.</p>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {managementTab === "channels" ? (
                            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-violet-50/30 p-5">
                              <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-700">Channel Workspace</p>
                                  <h4 className="mt-1 text-xl font-black text-slate-950">Channel mix and activation coverage</h4>
                                </div>
                                <button type="button" onClick={() => updateCampaign(selectedManagementCampaign.id, { updatedAt: new Date().toISOString() }, "Channel mix saved")} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">Save Channels</button>
                              </div>

                              <Field label="Channel mix">
                                <textarea
                                  value={selectedManagementCampaign.channelMix || ""}
                                  onChange={(event) => updateCampaign(selectedManagementCampaign.id, { channelMix: event.target.value }, "Channel mix updated")}
                                  className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                                  placeholder="Meta Ads, WhatsApp, Email, B2B partnerships, Events..."
                                />
                              </Field>

                              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                {channelStats.map((channel) => (
                                  <button
                                    key={channel.name}
                                    type="button"
                                    onClick={() => updateCampaign(selectedManagementCampaign.id, { channelMix: channel.name }, "Primary channel updated")}
                                    className={`rounded-2xl border p-4 text-left shadow-sm ${
                                      managementChannelName(selectedManagementCampaign) === channel.name ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-white"
                                    }`}
                                  >
                                    <p className="text-sm font-black text-slate-950">{channel.icon} {channel.name}</p>
                                    <p className="mt-1 text-xs font-bold text-slate-500">{channel.campaigns.length} campaigns in this channel</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {managementTab === "tasks" ? (
                            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-sky-50/30 p-5">
                              <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-700">Task Workspace</p>
                                  <h4 className="mt-1 text-xl font-black text-slate-950">Execution task management</h4>
                                </div>
                                <button type="button" onClick={() => addTask(selectedManagementCampaign.id)} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">+ Add Task</button>
                              </div>

                              <div className="grid gap-5">
                                {selectedManagementTasks.length ? selectedManagementTasks.map((task) => (
                                  <div key={task.id} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="grid gap-3 md:grid-cols-[1fr_150px_130px]">
                                      <Field label="Task title"><Input value={task.title} onChange={(event) => updateTask(task.id, { title: event.target.value })} /></Field>
                                      <Field label="Status"><Select value={task.status} onChange={(event) => updateTask(task.id, { status: event.target.value as TaskStatus })}><option value="todo">Todo</option><option value="doing">Doing</option><option value="done">Done</option><option value="blocked">Blocked</option></Select></Field>
                                      <Field label="Priority"><Select value={task.priority} onChange={(event) => updateTask(task.id, { priority: event.target.value as Task["priority"] })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select></Field>
                                    </div>

                                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                                      <Field label="Owner"><Input value={task.owner} onChange={(event) => updateTask(task.id, { owner: event.target.value })} /></Field>
                                      <Field label="Due date"><Input type="date" value={task.dueDate} onChange={(event) => updateTask(task.id, { dueDate: event.target.value })} /></Field>
                                      <button type="button" onClick={() => deleteTask(task.id)} className="self-end rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white">Delete Task</button>
                                    </div>
                                  </div>
                                )) : (
                                  <div className="rounded-[24px] border border-dashed border-sky-200 bg-sky-50/50 p-8 text-center">
                                    <p className="text-xl font-black text-slate-950">No tasks yet</p>
                                    <p className="mt-2 text-sm font-bold text-slate-500">Add execution tasks for this campaign.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}

                          {managementTab === "approvals" ? (
                            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-amber-50/30 p-5">
                              <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">Approval Workspace</p>
                                  <h4 className="mt-1 text-xl font-black text-slate-950">Approvals and governance</h4>
                                </div>
                                <button type="button" onClick={() => addApproval(selectedManagementCampaign.id)} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">+ Approval</button>
                              </div>

                              <div className="grid gap-3">
                                {selectedManagementApprovals.length ? selectedManagementApprovals.map((approval) => (
                                  <div key={approval.id} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="text-base font-black text-slate-950">{approval.title}</p>
                                    <p className="mt-1 text-sm font-bold text-slate-500">{approval.owner} • {approval.status}</p>
                                  </div>
                                )) : (
                                  <div className="rounded-[24px] border border-dashed border-amber-200 bg-amber-50/50 p-8 text-center">
                                    <p className="text-xl font-black text-slate-950">No approvals yet</p>
                                    <p className="mt-2 text-sm font-bold text-slate-500">Create approval checkpoints for this campaign.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}

                          {managementTab === "activity" ? (
                            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5">
                              <div className="mb-5">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Activity Workspace</p>
                                <h4 className="mt-1 text-xl font-black text-slate-950">Recent campaign activity</h4>
                              </div>

                              <div className="grid gap-3">
                                {selectedManagementLogs.length ? selectedManagementLogs.map((log) => (
                                  <div key={log.id} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="text-sm font-black text-slate-950">{log.message}</p>
                                    <p className="mt-1 text-xs font-bold text-slate-500">{log.meta}</p>
                                  </div>
                                )) : (
                                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                                    <p className="text-xl font-black text-slate-950">No activity yet</p>
                                    <p className="mt-2 text-sm font-bold text-slate-500">Actions will appear here after updates.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <div className="p-8">
                        <p className="text-lg font-black text-slate-950">No campaign selected.</p>
                      </div>
                    )}
                  </Card>
                </section>

                <Card className="overflow-hidden p-0">
                  <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-white via-blue-50/30 to-slate-50 px-7 py-6">
                    <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-100/50 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-emerald-100/50 blur-3xl" />

                    <div className="relative flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.30em] text-blue-700">
                          Channel Coverage
                        </p>
                        <h3 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">
                          Campaign distribution by channel
                        </h3>
                        <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
                          Premium overview of active campaign allocation, channel pressure, coverage percentage and activation status across all marketing channels.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
                          <p className="flex items-center gap-2 text-sm font-black text-emerald-700">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" />
                            Global persistence live
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                          <p className="text-sm font-black text-slate-700">
                            🏬 {state.campaigns.length} campaign records
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-7">
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                      {channelStats.map((channel) => {
                        const pctValue = state.campaigns.length ? Math.round((channel.campaigns.length / state.campaigns.length) * 100) : 0
                        const visual = premiumChannelVisual(channel.name)
                        const isSelectedChannel = managementChannel === channel.name
                        const hasCampaigns = channel.campaigns.length > 0

                        return (
                          <div
                            key={channel.name}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setManagementChannel(channel.name as ChannelNodeName)
                              setManagementPage(1)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                setManagementChannel(channel.name as ChannelNodeName)
                                setManagementPage(1)
                              }
                            }}
                            className={`group relative cursor-pointer overflow-hidden rounded-[30px] border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)] ${
                              isSelectedChannel ? "border-blue-300 ring-4 ring-blue-50" : "border-slate-200"
                            }`}
                            style={{
                              borderLeftColor: visual.accent,
                              borderLeftWidth: "4px",
                            }}
                          >
                            <div
                              className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl transition group-hover:scale-125"
                              style={{ background: visual.soft }}
                            />

                            <div className="relative flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="grid h-16 w-16 place-items-center rounded-[22px] text-2xl font-black shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                                  style={{
                                    background: visual.soft,
                                    color: visual.accent,
                                  }}
                                >
                                  {visual.icon}
                                </div>

                                <div className="min-w-0">
                                  <h4 className="truncate text-lg font-black tracking-[-0.04em] text-slate-950">
                                    {channel.name}
                                  </h4>
                                  <p className="mt-1 truncate text-xs font-bold text-slate-500">
                                    {visual.label}
                                  </p>
                                </div>
                              </div>

                              <div
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-sm font-black shadow-sm ring-1 ring-slate-100"
                                style={{ color: visual.accent }}
                              >
                                {visual.action}
                              </div>
                            </div>

                            <div className="relative mt-6 flex items-end justify-between gap-4">
                              <div>
                                <p className="text-5xl font-black tracking-[-0.08em] text-slate-950">
                                  {channel.campaigns.length}
                                </p>
                                <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                                  Campaigns
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-2xl font-black" style={{ color: visual.accent }}>
                                  {pctValue}%
                                </p>
                                <p className="text-xs font-bold text-slate-500">
                                  coverage
                                </p>
                              </div>
                            </div>

                            <div className="relative mt-5">
                              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${pctValue}%`,
                                    background: visual.accent,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="relative mt-5 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${
                                    hasCampaigns ? "animate-pulse" : ""
                                  }`}
                                  style={{ background: hasCampaigns ? visual.accent : "#cbd5e1" }}
                                />
                                <span className="text-sm font-bold text-slate-600">
                                  {hasCampaigns ? "Active" : visual.status}
                                </span>
                              </div>

                              <span
                                className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
                                style={{
                                  background: visual.soft,
                                  color: visual.accent,
                                }}
                              >
                                {hasCampaigns ? "Live" : "Standby"}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              </section>
            ) : null}



            {activePanel === "execution" ? (
              <section id="execution-workspace-panel" className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">ANGELCARE Execution Workspace</p>
                    <h2 className="mt-2 text-4xl font-black tracking-[-0.06em] text-slate-950">Channel activation command center</h2>
                    <p className="mt-2 text-sm font-bold text-slate-500">
                      Orchestrate channels, inspect active campaigns, control execution flow and open campaign dossiers from one synced workspace.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={openCreateModal} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.22)]">
                      + Create Campaign
                    </button>
                    <button onClick={exportWorkspace} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm">
                      Export Channel Report
                    </button>
                  </div>
                </div>

                <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon icon="🚀" tone="blue" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Active Campaigns</p>
                        <p className="mt-1 text-2xl font-black text-slate-950">{metrics.active}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon icon="◇" tone="emerald" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Avg Readiness</p>
                        <p className="mt-1 text-2xl font-black text-slate-950">{averageReadiness}%</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon icon="MAD" tone="violet" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Budget Controlled</p>
                        <p className="mt-1 text-2xl font-black text-slate-950">{mad(metrics.totalBudget)}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon icon="◌" tone="amber" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Leads</p>
                        <p className="mt-1 text-2xl font-black text-slate-950">{metrics.leads}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon icon="□" tone="rose" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Tasks Due</p>
                        <p className="mt-1 text-2xl font-black text-slate-950">{metrics.tasksDue}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon icon="⬡" tone="blue" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Approvals Due</p>
                        <p className="mt-1 text-2xl font-black text-slate-950">{metrics.approvalsDue}</p>
                      </div>
                    </div>
                  </Card>
                </section>

                <section className="grid gap-5 2xl:grid-cols-[1.15fr_0.85fr]">
                  <Card className="overflow-hidden p-0" data-channel-mindmap="true">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-white via-blue-50/40 to-white p-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Channel Activation Mindmap</h3>
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-50 text-xs font-black text-blue-700">i</span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-slate-500">Click a channel node to inspect live campaigns, execution data and channel pressure.</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">View</span>
                        <select value={selectedChannel} onChange={(event) => setSelectedChannel(event.target.value as ChannelNodeName)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50">
                          {channelNodes.map((channel) => <option key={channel.name} value={channel.name}>{channel.name}</option>)}
                        </select>

                        <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => setMindmapZoom((value) => Math.max(0.75, Math.round((value - 0.1) * 100) / 100))}
                            className="grid h-9 w-9 place-items-center rounded-xl text-sm font-black text-slate-600 transition hover:bg-slate-50"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            onClick={() => setMindmapZoom(1)}
                            className="h-9 rounded-xl px-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                          >
                            {Math.round(mindmapZoom * 100)}%
                          </button>
                          <button
                            type="button"
                            onClick={() => setMindmapZoom((value) => Math.min(1.35, Math.round((value + 0.1) * 100) / 100))}
                            className="grid h-9 w-9 place-items-center rounded-xl text-sm font-black text-slate-600 transition hover:bg-slate-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="relative overflow-auto bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),transparent_32%),linear-gradient(135deg,#ffffff,#f8fbff)] p-4 sm:p-6">
                      <div
                        className="relative mx-auto min-h-[760px] min-w-[1180px] transition-transform duration-300"
                        style={{
                          transform: `scale(${mindmapZoom})`,
                          transformOrigin: "center center",
                        }}
                      >
                        <div className="pointer-events-none absolute inset-0 opacity-80">
                          <div className="absolute left-[50%] top-[50%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-100" />
                          <div className="absolute left-[50%] top-[50%] h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-100/80" />
                          <div className="absolute left-[50%] top-[50%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/80 bg-white/70 shadow-[0_30px_90px_rgba(16,185,129,0.12)]" />
                        </div>

                        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          {balancedChannelColumns.left.map((channel, index) => {
                            const y = ((index + 1) / (balancedChannelColumns.left.length + 1)) * 100
                            const selectedNode = selectedChannel === channel.name

                            return (
                              <g key={`${channel.name}-green-line-left`}>
                                <path
                                  d={`M 50 50 C 42 50, 34 ${y}, 24 ${y}`}
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth={selectedNode ? 0.72 : 0.42}
                                  strokeOpacity={selectedNode ? 0.88 : 0.48}
                                  strokeLinecap="round"
                                />
                                <circle cx="24" cy={y} r={selectedNode ? 0.9 : 0.55} fill="#10b981" opacity={selectedNode ? 1 : 0.65} />
                              </g>
                            )
                          })}

                          {balancedChannelColumns.right.map((channel, index) => {
                            const y = ((index + 1) / (balancedChannelColumns.right.length + 1)) * 100
                            const selectedNode = selectedChannel === channel.name

                            return (
                              <g key={`${channel.name}-green-line-right`}>
                                <path
                                  d={`M 50 50 C 58 50, 66 ${y}, 76 ${y}`}
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth={selectedNode ? 0.72 : 0.42}
                                  strokeOpacity={selectedNode ? 0.88 : 0.48}
                                  strokeLinecap="round"
                                />
                                <circle cx="76" cy={y} r={selectedNode ? 0.9 : 0.55} fill="#10b981" opacity={selectedNode ? 1 : 0.65} />
                              </g>
                            )
                          })}
                        </svg>

                        <div className="absolute left-1/2 top-1/2 z-10 grid h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-emerald-100 bg-white/95 text-center shadow-[0_35px_100px_rgba(16,185,129,0.18)] ring-8 ring-emerald-50/80">
                          <div>
                            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[24px] bg-gradient-to-br from-emerald-500 via-blue-500 to-cyan-500 text-white shadow-[0_18px_45px_rgba(16,185,129,0.28)]">
                              <span className="text-2xl font-black">✦</span>
                            </div>
                            <p className="text-3xl font-black tracking-[-0.06em] text-slate-950">ANGELCARE</p>
                            <p className="mt-1 text-sm font-black text-slate-600">Campaign Network</p>
                            <div className="mx-auto mt-4 grid w-fit grid-cols-2 gap-2">
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700">{metrics.active} active</span>
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">{averageReadiness}% ready</span>
                            </div>
                          </div>
                        </div>

                        <div
                          className="absolute left-6 top-6 z-20 grid w-[360px] gap-4"
                          style={{
                            gridTemplateRows: `repeat(${balancedChannelColumns.left.length}, minmax(${balancedChannelColumns.compact ? "92px" : "108px"}, 1fr))`,
                            height: "calc(100% - 48px)",
                          }}
                        >
                          {balancedChannelColumns.left.map((channel) => {
                            const selectedNode = selectedChannel === channel.name
                            const palette = channelPalette(channel.tone)

                            return (
                              <button
                                key={channel.name}
                                type="button"
                                onClick={() => setSelectedChannel(channel.name as ChannelNodeName)}
                                className="rounded-[26px] border p-4 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(15,23,42,0.12)]"
                                style={channelNodeStyle(channel.tone, selectedNode)}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-lg font-black shadow-[0_10px_25px_rgba(15,23,42,0.08)]" style={{ color: palette.color }}>
                                    {channel.icon}
                                  </span>

                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-lg font-black tracking-[-0.03em] text-slate-950">{channel.name}</span>
                                    <span className="mt-1 block text-xs font-bold text-slate-500">{channel.group}</span>
                                  </span>

                                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-sm font-black shadow-sm" style={{ color: palette.color }}>
                                    {channel.activeCampaigns.length}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>

                        <div
                          className="absolute right-6 top-6 z-20 grid w-[360px] gap-4"
                          style={{
                            gridTemplateRows: `repeat(${balancedChannelColumns.right.length}, minmax(${balancedChannelColumns.compact ? "92px" : "108px"}, 1fr))`,
                            height: "calc(100% - 48px)",
                          }}
                        >
                          {balancedChannelColumns.right.map((channel) => {
                            const selectedNode = selectedChannel === channel.name
                            const palette = channelPalette(channel.tone)

                            return (
                              <button
                                key={channel.name}
                                type="button"
                                onClick={() => setSelectedChannel(channel.name as ChannelNodeName)}
                                className="rounded-[26px] border p-4 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(15,23,42,0.12)]"
                                style={channelNodeStyle(channel.tone, selectedNode)}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-lg font-black shadow-[0_10px_25px_rgba(15,23,42,0.08)]" style={{ color: palette.color }}>
                                    {channel.icon}
                                  </span>

                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-lg font-black tracking-[-0.03em] text-slate-950">{channel.name}</span>
                                    <span className="mt-1 block text-xs font-bold text-slate-500">{channel.group}</span>
                                  </span>

                                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-sm font-black shadow-sm" style={{ color: palette.color }}>
                                    {channel.activeCampaigns.length}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="relative z-20 mt-6 flex flex-wrap gap-2 rounded-[24px] border border-slate-200 bg-white/90 p-3 shadow-sm">
                        {[
                          ["Paid Media", "blue"],
                          ["Owned Channels", "emerald"],
                          ["Earned Channels", "rose"],
                          ["Partnerships", "amber"],
                          ["Offline", "teal"],
                          ["CRM & Data", "violet"],
                        ].map(([item, tone]) => {
                          const palette = channelPalette(tone)
                          return (
                            <span key={item} className="rounded-full px-3 py-1.5 text-xs font-black" style={{ background: palette.soft, color: palette.color }}>
                              {item}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </Card>

                  <Card className="overflow-hidden p-0">
                    <div className="border-b border-slate-100 bg-gradient-to-br from-white via-blue-50/50 to-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl font-black text-blue-700 shadow-sm">{selectedChannelStats.icon}</span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">{selectedChannelStats.name}</h3>
                              <Pill tone="blue">Selected</Pill>
                            </div>
                            <p className="mt-1 text-sm font-bold text-slate-500">Manage, monitor and optimize this channel’s campaigns.</p>
                          </div>
                        </div>

                        <button onClick={openCreateModal} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-black text-blue-700 shadow-sm">
                          New campaign
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 p-5">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Active Campaigns</p>
                          <p className="mt-2 text-3xl font-black text-slate-950">{selectedChannelStats.activeCampaigns.length}</p>
                        </div>
                        <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Draft Campaigns</p>
                          <p className="mt-2 text-3xl font-black text-slate-950">{selectedChannelStats.draftCampaigns.length}</p>
                        </div>
                        <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Leads</p>
                          <p className="mt-2 text-3xl font-black text-slate-950">{selectedChannelStats.leads}</p>
                        </div>
                        <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ROAS</p>
                          <p className="mt-2 text-3xl font-black text-slate-950">{selectedChannelStats.roasValue}x</p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Budget MAD</p>
                          <p className="mt-2 text-2xl font-black text-slate-950">{mad(selectedChannelStats.budgetMad)}</p>
                        </div>
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Spend MAD</p>
                          <p className="mt-2 text-2xl font-black text-slate-950">{mad(selectedChannelStats.spendMad)}</p>
                        </div>
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Owner</p>
                          <p className="mt-2 text-lg font-black text-slate-950">{selectedChannelStats.owner}</p>
                        </div>
                        <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Channel Status</p>
                          <p className="mt-2 text-lg font-black text-emerald-900">{selectedChannelStats.activeCampaigns.length ? "Active" : "Ready"}</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Recent Campaigns</h4>
                          <button onClick={() => setStageFilter("all")} className="text-xs font-black text-blue-600">View all campaigns →</button>
                        </div>

                        <div className="mt-3 space-y-3">
                          {selectedChannelStats.campaigns.length ? (
                            selectedChannelStats.campaigns.slice(0, 6).map((campaign) => (
                              <div key={campaign.id} className="grid gap-3 rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[1fr_95px_95px_95px_auto]">
                                <div>
                                  <p className="text-sm font-black text-slate-950">{campaign.name}</p>
                                  <p className="text-xs font-bold text-slate-500">{stageLabel[campaign.stage]} • {campaign.owner || "Unassigned"}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase text-slate-400">Leads</p>
                                  <p className="text-sm font-black">{campaign.leads}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase text-slate-400">Spend</p>
                                  <p className="text-sm font-black">{mad(campaign.spentMad)}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase text-slate-400">ROAS</p>
                                  <p className="text-sm font-black">{roas(campaign)}x</p>
                                </div>
                                <button onClick={() => openEditModal(campaign)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black shadow-sm">
                                  Edit
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-[24px] border border-dashed border-blue-200 bg-blue-50/40 p-6 text-center">
                              <p className="text-lg font-black text-slate-950">No campaigns on {selectedChannelStats.name}</p>
                              <p className="mt-1 text-sm font-bold text-slate-500">Create or edit a campaign and assign this channel in Channel Mix.</p>
                              <button onClick={openCreateModal} className="mt-4 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
                                + Create campaign
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </section>

                <section className="grid gap-5 2xl:grid-cols-[1.15fr_0.85fr]">
                  <Card className="overflow-hidden p-0" data-task-ops-center="true">
                    <div className="border-b border-slate-100 bg-gradient-to-br from-white via-blue-50/40 to-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">Execution Control</p>
                          <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">Deep Tasks Management Center</h3>
                          <p className="mt-1 text-sm font-bold text-slate-500">Operational task rows with description, owner, dates, time, priority, status and campaign sync.</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => shiftTaskOpsDate(-1)}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
                          >
                            ← Previous
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setTaskOpsDate(isoToday())
                              setTaskOpsMonth(isoToday().slice(0, 7))
                            }}
                            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 shadow-sm"
                          >
                            Today
                          </button>

                          <button
                            type="button"
                            onClick={() => shiftTaskOpsDate(1)}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
                          >
                            Next →
                          </button>

                          <button
                            onClick={() => addTask(selected?.id || state.campaigns[0]?.id)}
                            disabled={!selected && !state.campaigns[0]}
                            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.22)] disabled:opacity-50"
                          >
                            + New Task
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_150px_150px_180px_180px]">
                        <input
                          value={taskOpsQuery}
                          onChange={(event) => setTaskOpsQuery(event.target.value)}
                          placeholder="Search task, description, owner, campaign, workstream..."
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                        />

                        <Select value={taskOpsStatus} onChange={(event) => setTaskOpsStatus(event.target.value as "all" | TaskStatus)}>
                          <option value="all">All statuses</option>
                          <option value="todo">Todo</option>
                          <option value="doing">Doing</option>
                          <option value="done">Done</option>
                          <option value="blocked">Blocked</option>
                        </Select>

                        <Select value={taskOpsPriority} onChange={(event) => setTaskOpsPriority(event.target.value as "all" | Task["priority"])}>
                          <option value="all">All priorities</option>
                          <option value="low">Low priority</option>
                          <option value="medium">Medium priority</option>
                          <option value="high">High priority</option>
                        </Select>

                        <Input
                          type="date"
                          value={taskOpsDate}
                          onChange={(event) => {
                            setTaskOpsDate(event.target.value)
                            setTaskOpsMonth(event.target.value.slice(0, 7))
                          }}
                        />

                        <Input type="month" value={taskOpsMonth} onChange={(event) => setTaskOpsMonth(event.target.value)} />
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-[24px] border border-blue-100 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Live Date</p>
                              <p className="mt-1 text-sm font-black text-slate-950">{prettyTaskDate(taskOpsDate)}</p>
                            </div>
                            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-lg font-black text-blue-700">▦</span>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Scheduled Today</p>
                              <p className="mt-1 text-3xl font-black text-slate-950">{taskOpsTodayRows.length}</p>
                            </div>
                            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 text-lg font-black text-slate-700">◎</span>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">Under Progress</p>
                              <p className="mt-1 text-3xl font-black text-slate-950">{taskOpsInProgressRows.length}</p>
                            </div>
                            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-lg font-black text-sky-700">↻</span>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-700">Delayed</p>
                              <p className="mt-1 text-3xl font-black text-slate-950">{taskOpsDelayedRows.length}</p>
                            </div>
                            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-lg font-black text-rose-700">!</span>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Avg Duration</p>
                              <p className="mt-1 text-3xl font-black text-slate-950">{taskOpsAvgDurationLabel}</p>
                            </div>
                            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-lg font-black text-emerald-700">⏱</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                      <div className="max-h-[620px] overflow-auto pr-2">
                        <div className="w-full min-w-[1280px] space-y-5">
                          {filteredTaskOps.length ? filteredTaskOps.map((task) => {
                            const campaign = state.campaigns.find((item) => item.id === task.campaignId)
                            const isSelected = selectedTaskOps?.id === task.id
                            const statusTone = task.status === "done" ? "emerald" : task.status === "blocked" ? "rose" : task.status === "doing" ? "blue" : "slate"
                            const priorityClass =
                              task.priority === "high"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : task.priority === "medium"
                                  ? "border-orange-200 bg-orange-50 text-orange-700"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700"

                            return (
                              <div
                                role="button"
                                tabIndex={0}
                                key={task.id}
                                data-task-ops-row="true"
                                data-task-ops-row-force="true"
                                onClick={() => setSelectedTaskOpsId(task.id)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    setSelectedTaskOpsId(task.id)
                                  }
                                }}
                                className={`group relative grid w-full cursor-pointer grid-cols-1 gap-5 overflow-hidden rounded-[34px] border p-6 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.13)] 2xl:grid-cols-[minmax(390px,2.05fr)_minmax(220px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)_minmax(170px,.82fr)_minmax(170px,.82fr)_48px] xl:grid-cols-[minmax(340px,1.7fr)_minmax(190px,1fr)_minmax(190px,1fr)_minmax(190px,1fr)_minmax(150px,.82fr)_minmax(150px,.82fr)_44px] lg:grid-cols-3 md:grid-cols-2 ${
                                  isSelected
                                    ? "border-blue-300 bg-blue-50/60 ring-4 ring-blue-50 shadow-[0_26px_70px_rgba(37,99,235,0.16)]"
                                    : "border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.07)]"
                                }`}
                              >
                                <div className={`pointer-events-none absolute inset-y-0 left-0 w-1.5 ${
                                  task.status === "done" ? "bg-emerald-500" :
                                  task.status === "doing" ? "bg-blue-500" :
                                  task.status === "blocked" ? "bg-rose-500" :
                                  "bg-sky-500"
                                }`} />

                                <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-blue-100/50 blur-3xl transition group-hover:scale-125" />
                                <div className="pointer-events-none absolute -bottom-24 left-1/4 h-44 w-44 rounded-full bg-emerald-100/50 blur-3xl" />

                                <div className="relative grid grid-cols-[72px_minmax(0,1fr)] items-center gap-5">
                                  <div className={`grid h-[72px] w-[72px] place-items-center rounded-[26px] text-3xl shadow-[0_18px_42px_rgba(15,23,42,0.10)] ${
                                    task.status === "done" ? "bg-emerald-50 text-emerald-700" :
                                    task.status === "doing" ? "bg-blue-50 text-blue-700" :
                                    task.status === "blocked" ? "bg-rose-50 text-rose-700" :
                                    "bg-sky-50 text-sky-700"
                                  }`}>
                                    {task.status === "done" ? "✓" : task.status === "doing" ? "↻" : task.status === "blocked" ? "!" : "▣"}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="truncate text-xl font-black tracking-[-0.04em] text-slate-950">
                                        {task.title}
                                      </h4>
                                      {task.status === "blocked" ? (
                                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-rose-700">
                                          Blocked
                                        </span>
                                      ) : null}
                                    </div>

                                    <p className="mt-2 text-sm font-extrabold text-slate-500">
                                      {campaign?.name || "No campaign"} <span className="text-slate-300">•</span> {task.workstream || "Execution"}
                                    </p>

                                    {task.description ? (
                                      <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-slate-400">
                                        {task.description}
                                      </p>
                                    ) : (
                                      <p className="mt-2 text-xs font-bold leading-5 text-slate-400">
                                        No description written yet.
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="relative rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
                                  <p className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400">Owner</p>
                                  <div className="mt-3 flex items-center gap-3">
                                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.22)]">
                                      {(task.owner || "MO").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-slate-950">{task.owner || "Unassigned"}</p>
                                      <p className="text-xs font-bold text-slate-400">Campaign operator</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="relative rounded-[24px] border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
                                  <p className="text-[10px] font-black uppercase tracking-[0.20em] text-blue-500">Start</p>
                                  <div className="mt-3 flex items-center gap-3">
                                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-lg font-black text-blue-700 shadow-sm">▦</span>
                                    <div>
                                      <p className="text-sm font-black text-slate-950">
                                        {new Date(task.startDateTime || `${task.dueDate || isoToday()}T09:00`).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                      </p>
                                      <p className="text-xs font-bold text-slate-400">Start window</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="relative rounded-[24px] border border-violet-100 bg-violet-50/60 p-4 shadow-sm">
                                  <p className="text-[10px] font-black uppercase tracking-[0.20em] text-violet-500">End</p>
                                  <div className="mt-3 flex items-center gap-3">
                                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-lg font-black text-violet-700 shadow-sm">▣</span>
                                    <div>
                                      <p className="text-sm font-black text-slate-950">
                                        {new Date(task.endDateTime || `${task.dueDate || isoToday()}T17:00`).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                      </p>
                                      <p className="text-xs font-bold text-slate-400">Target close</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="relative flex flex-col justify-center rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                                  <p className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400">Status</p>
                                  <span className={`mt-3 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.13em] ${
                                    task.status === "done" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                                    task.status === "doing" ? "border-blue-200 bg-blue-50 text-blue-700" :
                                    task.status === "blocked" ? "border-rose-200 bg-rose-50 text-rose-700" :
                                    "border-slate-200 bg-slate-50 text-slate-700"
                                  }`}>
                                    <span className={`h-2 w-2 rounded-full ${
                                      task.status === "done" ? "bg-emerald-500" :
                                      task.status === "doing" ? "animate-pulse bg-blue-500" :
                                      task.status === "blocked" ? "animate-pulse bg-rose-500" :
                                      "bg-slate-400"
                                    }`} />
                                    {task.status}
                                  </span>
                                </div>

                                <div className="relative flex flex-col justify-center rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                                  <p className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400">Priority</p>
                                  <span className={`mt-3 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.13em] ${
                                    task.priority === "high" ? "border-rose-200 bg-rose-50 text-rose-700" :
                                    task.priority === "medium" ? "border-amber-200 bg-amber-50 text-amber-700" :
                                    "border-blue-200 bg-blue-50 text-blue-700"
                                  }`}>
                                    {task.priority === "high" ? "↑" : task.priority === "medium" ? "◆" : "↓"}
                                    {task.priority}
                                  </span>
                                </div>

                                <div className="relative grid place-items-center rounded-[22px] border border-slate-200 bg-white shadow-sm">
                                  <span className="text-2xl font-black text-slate-400">⋮</span>
                                </div>
                              </div>
                            )
                          }) : (
                            <div className="rounded-[26px] border border-dashed border-blue-200 bg-blue-50/40 p-8 text-center">
                              <p className="text-xl font-black text-slate-950">No tasks found</p>
                              <p className="mt-2 text-sm font-bold text-slate-500">Create a task or adjust filters to display execution rows.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Selected Task</p>
                        {selectedTaskOps ? (
                          <div className="mt-4 grid gap-3">
                            <Field label="Task title">
                              <Input value={selectedTaskOps.title} onChange={(event) => updateTask(selectedTaskOps.id, { title: event.target.value })} />
                            </Field>

                            <Field label="Task description">
                              <textarea
                                value={selectedTaskOps.description || ""}
                                onChange={(event) => updateTask(selectedTaskOps.id, { description: event.target.value })}
                                className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                                placeholder="Describe task objective, expected output, dependencies, instructions and acceptance criteria..."
                              />
                            </Field>

                            <Field label="Owner">
                              <Input value={selectedTaskOps.owner} onChange={(event) => updateTask(selectedTaskOps.id, { owner: event.target.value })} />
                            </Field>

                            <Field label="Workstream">
                              <Input value={selectedTaskOps.workstream || ""} onChange={(event) => updateTask(selectedTaskOps.id, { workstream: event.target.value })} />
                            </Field>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <Field label="Status">
                                <Select value={selectedTaskOps.status} onChange={(event) => updateTask(selectedTaskOps.id, { status: event.target.value as TaskStatus })}>
                                  <option value="todo">Todo</option>
                                  <option value="doing">Doing</option>
                                  <option value="done">Done</option>
                                  <option value="blocked">Blocked</option>
                                </Select>
                              </Field>

                              <Field label="Priority">
                                <Select value={selectedTaskOps.priority} onChange={(event) => updateTask(selectedTaskOps.id, { priority: event.target.value as Task["priority"] })}>
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                </Select>
                              </Field>
                            </div>

                            <Field label="Start date & time">
                              <Input type="datetime-local" value={taskStartDateTime(selectedTaskOps)} onChange={(event) => updateTask(selectedTaskOps.id, { startDateTime: event.target.value })} />
                            </Field>

                            <Field label="End date & time">
                              <Input type="datetime-local" value={taskEndDateTime(selectedTaskOps)} onChange={(event) => updateTask(selectedTaskOps.id, { endDateTime: event.target.value, dueDate: event.target.value.slice(0, 10) })} />
                            </Field>

                            <button
                              type="button"
                              onClick={() => deleteTask(selectedTaskOps.id)}
                              className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(225,29,72,0.22)]"
                            >
                              Delete task
                            </button>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-[22px] border border-dashed border-slate-200 bg-white p-5 text-sm font-bold text-slate-500">
                            Select a task row to edit status, owner, priority, dates and time.
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  <Card className="overflow-hidden p-0" data-campaign-timeline-control="true">
                    <div className="border-b border-slate-100 bg-gradient-to-br from-white via-emerald-50/40 to-white p-5">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">Campaign Timeline Control</p>
                        <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">Dates, remaining days and expiry actions</h3>
                        <p className="mt-1 text-sm font-bold text-slate-500">Automatic timeline pressure, remaining days and campaign date governance.</p>
                      </div>
                    </div>

                    <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                      <div className="max-h-[620px] overflow-auto pr-2">
                        <div className="space-y-3">
                          {state.campaigns.length ? state.campaigns.map((campaign) => {
                            const tone = campaignExpiryTone(campaign)
                            const remaining = remainingCampaignDays(campaign)
                            const progress = campaignElapsedPct(campaign)
                            const selectedRow = selectedDatesCampaign?.id === campaign.id

                            const timelineStartMs = new Date(campaign.startDate || isoToday()).getTime()
                            const timelineEndMs = new Date(campaign.endDate || isoToday()).getTime()
                            const timelineNowMs = Date.now()
                            const timelineTotalDays = Math.max(1, Math.ceil((timelineEndMs - timelineStartMs) / 86400000))
                            const daysLeft = Math.max(0, Math.ceil((timelineEndMs - timelineNowMs) / 86400000))
                            const progress = Math.max(0, Math.min(100, Math.round(((timelineNowMs - timelineStartMs) / Math.max(1, timelineEndMs - timelineStartMs)) * 100)))

                            return (
                              <button
                                key={campaign.id}
                                type="button"
                                onClick={() => {
                                  setSelectedDatesCampaignId(campaign.id)
                                  setState({ ...state, selectedId: campaign.id })
                                }}
                                className={`w-full rounded-[26px] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                                  selectedRow ? "border-emerald-300 bg-emerald-50/50 ring-4 ring-emerald-50" : "border-slate-200 bg-white"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Pill tone={(campaign.lifecycleStatus === "paused" ? "amber" : campaign.lifecycleStatus === "archived" ? "slate" : "emerald") as "blue" | "emerald" | "rose" | "amber" | "violet" | "slate"}>
                                        {campaign.lifecycleStatus || "active"}
                                      </Pill>
                                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${tone.className}`}>
                                        {tone.label}
                                      </span>
                                    </div>
                                    <p className="mt-3 truncate text-lg font-black text-slate-950">{campaign.name}</p>
                                    <p className="mt-1 text-xs font-bold text-slate-500">{campaign.startDate || "—"} → {campaign.endDate || "—"}</p>
                                  </div>

                                  <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedTimelineCampaignId(campaign.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              setSelectedTimelineCampaignId(campaign.id)
                            }
                          }}
                          className={`group relative grid w-full cursor-pointer grid-cols-1 items-center gap-5 overflow-hidden rounded-[30px] border p-5 text-left shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.13)] xl:grid-cols-[88px_minmax(260px,1.35fr)_190px_minmax(260px,1fr)_150px_64px] ${
                            timelineRowTone(daysLeft, progress).shell
                          }`}
                        >
                          <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-emerald-200/40 blur-3xl" />
                          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-44 w-44 rounded-full bg-cyan-200/30 blur-3xl" />

                          <div className={`relative grid h-[72px] w-[72px] place-items-center rounded-[26px] border text-3xl shadow-[0_18px_42px_rgba(15,23,42,0.10)] ${
                            timelineRowTone(daysLeft, progress).icon
                          }`}>
                            ▣
                          </div>

                          <div className="relative min-w-0">
                            <h4 className="truncate text-2xl font-black tracking-[-0.05em] text-slate-950">
                              {campaign.name}
                            </h4>
                            <p className="mt-2 text-sm font-extrabold text-slate-500">
                              {campaign.startDate || "No start date"} → {campaign.endDate || "No end date"}
                            </p>
                          </div>

                          <div className="relative flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 shadow-sm">
                              {(campaign.status || "active").toString()}
                            </span>
                            <span className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] shadow-sm ${
                              timelineRowTone(daysLeft, progress).badge
                            }`}>
                              {timelineRowTone(daysLeft, progress).label}
                            </span>
                          </div>

                          <div className="relative rounded-[24px] border border-white/70 bg-white/65 p-4 shadow-sm backdrop-blur">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400">
                                Campaign window progress
                              </p>
                              <p className="text-xs font-black text-slate-600">{progress}%</p>
                            </div>
                            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className={`h-full rounded-full ${timelineRowTone(daysLeft, progress).bar}`}
                                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                              />
                            </div>
                            <div className="mt-3 flex items-center justify-between text-[11px] font-black text-slate-500">
                              <span>{campaign.startDate || "Start"}</span>
                              <span>{progress}% elapsed</span>
                              <span>{campaign.endDate || "End"}</span>
                            </div>
                          </div>

                          <div className="relative flex items-center justify-center gap-2 rounded-[24px] border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                            <span className={`h-3 w-3 rounded-full ${timelineRowTone(daysLeft, progress).dot} ${daysLeft <= 20 ? "animate-pulse" : ""}`} />
                            <div>
                              <p className="text-5xl font-black tracking-[-0.08em] text-slate-950">
                                {daysLeft}
                              </p>
                              <p className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400">
                                Days left
                              </p>
                            </div>
                          </div>

                          <div className="relative grid h-14 w-14 place-items-center rounded-[22px] border border-white/80 bg-white/80 text-2xl font-black text-slate-500 shadow-sm">
                            ⋯
                          </div>
                        </div>
                                </div>

                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${progress}%` }} />
                                </div>
                              </button>
                            )
                          }) : (
                            <div className="rounded-[26px] border border-dashed border-emerald-200 bg-emerald-50/40 p-8 text-center">
                              <p className="text-xl font-black text-slate-950">No campaigns available</p>
                              <p className="mt-2 text-sm font-bold text-slate-500">Create campaigns to activate date control.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Selected Campaign Preview</p>

                        {selectedDatesCampaign ? (
                          <div className="mt-4 grid gap-3">
                            <div className="rounded-[22px] bg-white p-4 shadow-sm">
                              <p className="text-2xl font-black tracking-[-0.04em] text-slate-950">{selectedDatesCampaign.name}</p>
                              <p className="mt-2 text-sm font-bold text-slate-500">{selectedDatesCampaign.objective || "No objective written yet."}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-[10px] font-black uppercase text-slate-400">Remaining</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{remainingCampaignDays(selectedDatesCampaign)} days</p>
                              </div>
                              <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-[10px] font-black uppercase text-slate-400">Progress</p>
                                <p className="mt-2 text-2xl font-black text-slate-950">{campaignElapsedPct(selectedDatesCampaign)}%</p>
                              </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <Field label="Start date">
                                <Input type="date" value={selectedDatesCampaign.startDate || ""} onChange={(event) => updateCampaign(selectedDatesCampaign.id, { startDate: event.target.value }, "Campaign start date updated")} />
                              </Field>
                              <Field label="End date">
                                <Input type="date" value={selectedDatesCampaign.endDate || ""} onChange={(event) => updateCampaign(selectedDatesCampaign.id, { endDate: event.target.value }, "Campaign end date updated")} />
                              </Field>
                            </div>

                            <div className="grid gap-2">
                              <button
                                type="button"
                                onClick={() => updateCampaign(selectedDatesCampaign.id, { lifecycleStatus: "paused" }, "Campaign paused")}
                                className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-black text-orange-700"
                              >
                                Pause
                              </button>

                              <button
                                type="button"
                                onClick={() => updateCampaign(selectedDatesCampaign.id, { lifecycleStatus: "active" }, "Campaign resumed")}
                                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700"
                              >
                                Resume
                              </button>

                              <button
                                type="button"
                                onClick={() => updateCampaign(selectedDatesCampaign.id, { lifecycleStatus: "archived", stage: "optimization" }, "Campaign validated and archived")}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
                              >
                                Validate and archive
                              </button>

                              <button
                                type="button"
                                onClick={() => updateCampaign(selectedDatesCampaign.id, { updatedAt: new Date().toISOString() }, "Campaign dates saved")}
                                className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.22)]"
                              >
                                Save
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteCampaignPermanently(selectedDatesCampaign.id)}
                                className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(225,29,72,0.22)]"
                              >
                                Delete permanently
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-[22px] border border-dashed border-slate-200 bg-white p-5 text-sm font-bold text-slate-500">
                            Select a campaign to preview dates, remaining days and actions.
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </section>
              </section>
            ) : null}



            <section className={`${activePanel === "execution" || activePanel === "management" ? "hidden" : "grid"} gap-5 xl:grid-cols-[minmax(0,1fr)_430px]`}>
              <div className="space-y-5">
                <Card className="p-5" id="campaign-execution-board">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700">⌘</span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Operations</p>
                        <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">Campaign Execution Board</h2>
                      </div>
                    </div>
                    <button onClick={() => setStageFilter("all")} className="text-xs font-black text-blue-600">View All Campaigns</button>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-3 2xl:grid-cols-6">
                    {stages.map((stage) => {
                      const count = state.campaigns.filter((campaign) => campaign.stage === stage).length
                      return (
                        <button key={stage} onClick={() => setStageFilter(stage)} className={`rounded-[24px] border p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] ${stageFilter === stage ? "border-blue-200 bg-gradient-to-br from-blue-50 to-white ring-2 ring-blue-100" : "border-slate-200 bg-gradient-to-br from-white to-slate-50"}`}>
                          <p className="text-xs font-black text-blue-700">{stageLabel[stage]}</p>
                          <p className="mt-2 text-2xl font-black">{count}</p>
                          <p className="text-xs font-bold text-slate-500">Campaigns</p>
                        </button>
                      )
                    })}
                  </div>
                </Card>

                <section className="grid gap-5 xl:grid-cols-[1.1fr_0.8fr_0.9fr]">
                  <Card className="p-5" id="budget-roi-cockpit-card">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-sm font-black text-violet-700">MAD</span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Finance</p>
                        <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">Budget & ROI Cockpit</h2>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <div className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Total Budget</p><p className="mt-2 text-xl font-black">{mad(metrics.totalBudget)}</p></div>
                      <div className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Total Spend</p><p className="mt-2 text-xl font-black">{mad(metrics.totalSpend)}</p></div>
                      <div className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">ROI Forecast</p><p className="mt-2 text-xl font-black">{metrics.roas}x</p></div>
                    </div>
                    <div className="mt-5 space-y-2">
                      {filteredCampaigns.slice(0, 5).length ? filteredCampaigns.slice(0, 5).map((campaign) => (
                        <button key={campaign.id} onClick={() => setState({ ...state, selectedId: campaign.id })} className="grid w-full gap-3 rounded-[20px] border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md md:grid-cols-[1fr_120px_90px_90px]">
                          <span className="text-sm font-black">{campaign.name}</span>
                          <span className="text-xs font-bold text-slate-500">{mad(campaign.spentMad)}</span>
                          <span className="text-xs font-black text-emerald-700">{roas(campaign)}x</span>
                          <Pill tone={riskTone(campaign.risk) as any}>{riskLabel[campaign.risk]}</Pill>
                        </button>
                      )) : (
                        <div className="rounded-[26px] border border-dashed border-blue-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-8 text-center shadow-inner">
                          <h3 className="text-xl font-black">No campaigns yet</h3>
                          <p className="mt-2 text-sm font-bold text-slate-500">Create campaigns to activate the cockpit.</p>
                          <button onClick={openCreateModal} className="mt-4 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">+ Create campaign</button>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-5" id="launch-readiness-card">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-sm font-black text-emerald-700">◇</span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Launch Gate</p>
                        <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">Launch Readiness</h2>
                      </div>
                    </div>
                    <div className="mt-5 grid place-items-center rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-7 shadow-inner">
                      <p className="text-5xl font-black text-emerald-700">{selected ? pct(selected.readiness) : "—"}</p>
                      <p className="mt-2 text-sm font-black text-emerald-900">{selected ? "Launch Score" : "Select campaign"}</p>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
                      <div className="flex justify-between"><span>Tasks Completed</span><span>{selectedTasks.filter((t) => t.status === "done").length} / {selectedTasks.length}</span></div>
                      <div className="flex justify-between"><span>Approvals</span><span>{selectedApprovals.filter((a) => a.status === "approved").length} / {selectedApprovals.length}</span></div>
                      <div className="flex justify-between"><span>Risk Review</span><span>{selectedRisks.length} open</span></div>
                    </div>
                    <button onClick={runLaunchReadiness} disabled={!selected} className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">Run Check</button>
                  </Card>

                  <Card className="p-5" id="risk-escalation-card">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-sm font-black text-rose-700">△</span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-700">Protection</p>
                        <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">Risk & Escalation</h2>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-2">
                      {selectedRisks.slice(0, 4).length ? selectedRisks.slice(0, 4).map((risk) => (
                        <div key={risk.id} className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
                          <Pill tone={riskTone(risk.level) as any}>{riskLabel[risk.level]}</Pill>
                          <p className="mt-2 text-sm font-black">{risk.title}</p>
                          <p className="text-xs font-bold text-slate-500">Owner: {risk.owner}</p>
                        </div>
                      )) : <div className="rounded-[20px] border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 text-sm font-bold text-slate-500 shadow-inner">No risks logged.</div>}
                    </div>
                    <button onClick={() => addRisk()} disabled={!selected} className="mt-4 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 disabled:opacity-50">Log Risk</button>
                  </Card>
                </section>

                <Card className="p-5" id="campaign-portfolio-card">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-50 text-sm font-black text-sky-700">▣</span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">Portfolio</p>
                        <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">Campaign Portfolio</h2>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as "all" | Stage)}>
                        <option value="all">All stages</option>
                        {stages.map((stage) => <option key={stage} value={stage}>{stageLabel[stage]}</option>)}
                      </Select>
                      <Select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as "all" | Risk)}>
                        <option value="all">All risks</option>
                        {risks.map((risk) => <option key={risk} value={risk}>{riskLabel[risk]}</option>)}
                      </Select>
                    </div>
                  </div>

                  {filteredCampaigns.length ? (
                    <div className="grid gap-3 2xl:grid-cols-2">
                      {filteredCampaigns.map((campaign) => (
                        <div
                          key={campaign.id}
                          className={`group overflow-hidden rounded-[32px] border bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.10)] ${
                            state.selectedId === campaign.id
                              ? "border-blue-200 ring-4 ring-blue-50"
                              : "border-slate-200 hover:border-blue-200"
                          }`}
                        >
                          <div className="border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill tone="blue">{stageLabel[campaign.stage]}</Pill>
                                  <Pill tone={riskTone(campaign.risk) as any}>{riskLabel[campaign.risk]}</Pill>
                                  <Pill tone="slate">{campaign.campaignType}</Pill>
                                </div>

                                <h3 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950">
                                  {campaign.name}
                                </h3>

                                <p className="mt-2 line-clamp-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
                                  {campaign.objective || "No objective written yet."}
                                </p>
                              </div>

                              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white shadow-[0_16px_36px_rgba(37,99,235,0.22)]">
                                AC
                              </div>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-3">
                              <div className="rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Audience</p>
                                <p className="mt-1 truncate text-sm font-black text-slate-700">{campaign.targetAudience}</p>
                              </div>
                              <div className="rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Channel</p>
                                <p className="mt-1 truncate text-sm font-black text-slate-700">{campaign.channelMix}</p>
                              </div>
                              <div className="rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Owner</p>
                                <p className="mt-1 truncate text-sm font-black text-slate-700">{campaign.owner || "Unassigned"}</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-5">
                            <div className="grid gap-3 md:grid-cols-4">
                              <div className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Readiness</p>
                                <div className="mt-3 flex items-end justify-between gap-3">
                                  <p className="text-2xl font-black tracking-[-0.04em] text-slate-950">{pct(campaign.readiness)}</p>
                                  <span className="text-xs font-black text-emerald-700">Launch</span>
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div className="h-full rounded-full bg-emerald-500" style={{ width: pct(campaign.readiness) }} />
                                </div>
                              </div>

                              <div className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-white to-blue-50/40 p-4 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Budget</p>
                                <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">{mad(campaign.budgetMad)}</p>
                                <p className="mt-1 text-xs font-bold text-slate-500">Allocated</p>
                              </div>

                              <div className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-white to-amber-50/40 p-4 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Spend</p>
                                <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">{mad(campaign.spentMad)}</p>
                                <p className="mt-1 text-xs font-bold text-slate-500">Tracked</p>
                              </div>

                              <div className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-white to-violet-50/40 p-4 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ROAS</p>
                                <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">{roas(campaign)}x</p>
                                <p className="mt-1 text-xs font-bold text-slate-500">MAD return</p>
                              </div>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                              <div className="grid gap-2 sm:grid-cols-3">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Business axis</p>
                                  <p className="mt-1 truncate text-xs font-black text-slate-700">{campaign.businessAxis}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Launch date</p>
                                  <p className="mt-1 text-xs font-black text-slate-700">{campaign.launchDate || "—"}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Primary KPI</p>
                                  <p className="mt-1 truncate text-xs font-black text-slate-700">{campaign.primaryKpi}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <button
                                  onClick={() => setState({ ...state, selectedId: campaign.id })}
                                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                  Select
                                </button>
                                <button
                                  onClick={() => openEditModal(campaign)}
                                  className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5"
                                >
                                  Edit dossier
                                </button>
                                <button
                                  onClick={() => addTask(campaign.id)}
                                  className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                  + Task
                                </button>
                                <button
                                  onClick={() => addApproval(campaign.id)}
                                  className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black text-amber-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                  Approval
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[30px] border border-dashed border-blue-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-10 text-center shadow-inner">
                      <h3 className="text-2xl font-black">No campaign records found</h3>
                      <p className="mt-2 text-sm font-bold text-slate-500">Create a campaign to activate the execution board.</p>
                      <button onClick={openCreateModal} className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">+ Create campaign</button>
                    </div>
                  )}
                </Card>
              </div>

              <aside className="space-y-5">
                <Card className="overflow-hidden p-5 ring-1 ring-slate-950/[0.03] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">↗</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Command</p>
                    <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">Selected Campaign Command</h2>
                  </div>
                </div>
                  {selected ? (
                    <div className="mt-4">
                      <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">{selected.name}</h3>
                      <p className="mt-2 text-sm font-bold text-slate-500">{selected.objective || "No objective written yet."}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button onClick={() => openEditModal(selected)} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Edit campaign</button>
                        <button onClick={advanceStage} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">Advance stage</button>
                        <button onClick={() => addTask()} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">Add task</button>
                        <button onClick={() => addApproval()} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">Approval</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">No campaign selected.</div>
                  )}
                </Card>

                <Card className="overflow-hidden p-5 ring-1 ring-slate-950/[0.03] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700">□</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Execution</p>
                    <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">Tasks / Execution Queue</h2>
                  </div>
                </div>
                  <div className="mt-4 grid gap-2">
                    <button onClick={() => addTask()} disabled={!selected} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 disabled:opacity-50">+ Add Task</button>
                    {selectedTasks.slice(0, 5).length ? selectedTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
                        <p className="text-sm font-black">{task.title}</p>
                        <div className="mt-2 flex justify-between"><Pill tone={(task.status === "done" ? "emerald" : task.status === "blocked" ? "rose" : "blue") as "blue" | "emerald" | "rose" | "amber" | "violet" | "slate"}>{task.status}</Pill><span className="text-xs font-bold text-slate-500">{task.dueDate}</span></div>
                      </div>
                    )) : <div className="rounded-[20px] border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 text-sm font-bold text-slate-500 shadow-inner">No tasks yet.</div>}
                  </div>
                </Card>

                <Card className="p-5" id="quick-actions-card">
                  <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-sm font-black text-amber-700">⚡</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Controls</p>
                    <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">Quick Actions</h2>
                  </div>
                </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button onClick={openCreateModal} className="rounded-[20px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-3 py-3 text-xs font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">Create Campaign</button>
                    <button onClick={runLaunchReadiness} disabled={!selected} className="rounded-[20px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-3 py-3 text-xs font-black text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50">Launch Control</button>
                    <button onClick={() => setActivePanel("budget")} className="rounded-[20px] border border-violet-100 bg-gradient-to-br from-violet-50 to-white px-3 py-3 text-xs font-black text-violet-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">Budget Cockpit</button>
                    <button onClick={() => addRisk()} disabled={!selected} className="rounded-[20px] border border-rose-100 bg-gradient-to-br from-rose-50 to-white px-3 py-3 text-xs font-black text-rose-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50">Risk Center</button>
                    <button onClick={() => setActivePanel("performance")} className="rounded-[20px] border border-sky-100 bg-gradient-to-br from-sky-50 to-white px-3 py-3 text-xs font-black text-sky-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">Performance</button>
                    <button onClick={() => addApproval()} disabled={!selected} className="rounded-[20px] border border-amber-100 bg-gradient-to-br from-amber-50 to-white px-3 py-3 text-xs font-black text-amber-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50">Approvals</button>
                  </div>
                </Card>

                <Card className="overflow-hidden p-5 ring-1 ring-slate-950/[0.03] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-sm font-black text-violet-700">◌</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Live Trace</p>
                    <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">Team Activity / Approvals / Messaging</h2>
                  </div>
                </div>
                  <div className="mt-4 space-y-2">
                    {state.logs.slice(0, 5).length ? state.logs.slice(0, 5).map((log) => (
                      <div key={log.id} className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
                        <p className="text-sm font-black">{log.message}</p>
                        <p className="text-xs font-bold text-slate-500">{log.meta}</p>
                      </div>
                    )) : <div className="rounded-[20px] border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 text-sm font-bold text-slate-500 shadow-inner">No activity yet.</div>}
                  </div>
                </Card>
              </aside>
            </section>
          </div>
        </section>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[2147483647] overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-xl sm:p-5">
          <form data-campaign-modal="true" onSubmit={saveCampaign} className="mx-auto my-4 max-w-[1760px] overflow-hidden rounded-[38px] border border-white/70 bg-white shadow-[0_50px_160px_rgba(15,23,42,0.34)] ring-1 ring-slate-950/5">
            
            <style jsx global>{`
              [data-campaign-modal="true"] [data-campaign-modal-title="true"] {
                color: #000000 !important;
                -webkit-text-fill-color: #000000 !important;
                background: transparent !important;
                text-shadow: none !important;
                mix-blend-mode: normal !important;
              }
            
        [data-campaign-lifecycle-root="true"] button[data-campaign-directory-row="true"] {
          display: grid !important;
          justify-content: stretch !important;
          align-items: center !important;
          white-space: normal !important;
          min-height: 78px !important;
          padding: 16px 20px !important;
          line-height: 1.25 !important;
          width: 100% !important;
          text-align: left !important;
        }

        [data-campaign-lifecycle-root="true"] button[data-campaign-directory-row="true"]:hover {
          display: grid !important;
        }

        [data-campaign-lifecycle-root="true"] button[data-campaign-directory-card="true"] {
          display: block !important;
          white-space: normal !important;
          min-height: 0 !important;
          padding: 20px !important;
          line-height: 1.25 !important;
          width: 100% !important;
          text-align: left !important;
        }

        [data-campaign-lifecycle-root="true"] button[data-campaign-directory-card="true"]:hover {
          display: block !important;
        }

        [data-campaign-lifecycle-root="true"] button[data-campaign-directory-row="true"] span,
        [data-campaign-lifecycle-root="true"] button[data-campaign-directory-card="true"] span {
          white-space: normal !important;
        }

      
        [data-campaign-lifecycle-root="true"] [data-channel-mindmap="true"] [class*="place-items-center"][class*="rounded"]:not([class*="rounded-full"]) {
          min-width: 64px !important;
          width: 64px !important;
          min-height: 64px !important;
          height: 64px !important;
          font-size: 28px !important;
          line-height: 1 !important;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.95) inset,
            0 18px 38px rgba(15,23,42,0.12) !important;
        }

        [data-campaign-lifecycle-root="true"] [data-channel-mindmap="true"] [class*="rounded-full"][class*="place-items-center"] {
          min-width: 36px !important;
          width: 36px !important;
          min-height: 36px !important;
          height: 36px !important;
          font-size: 14px !important;
          font-weight: 900 !important;
        }

        [data-campaign-lifecycle-root="true"] [data-channel-mindmap="true"] h4,
        [data-campaign-lifecycle-root="true"] [data-channel-mindmap="true"] p[class*="font-black"] {
          letter-spacing: -0.03em !important;
        }

        [data-campaign-lifecycle-root="true"] [data-channel-mindmap="true"] [role="button"] {
          min-height: 104px !important;
        }

      
        [data-campaign-lifecycle-root="true"] [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] {
          display: grid !important;
          grid-template-columns: minmax(360px, 1.7fr) minmax(180px, .8fr) minmax(180px, .8fr) minmax(180px, .8fr) minmax(150px, .55fr) !important;
          align-items: stretch !important;
          justify-content: stretch !important;
          gap: 18px !important;
          width: 100% !important;
          min-height: 128px !important;
          padding: 22px !important;
          border-radius: 28px !important;
          white-space: normal !important;
          text-align: left !important;
          line-height: 1.25 !important;
          background:
            radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.06), transparent 28%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.95) inset,
            0 18px 42px rgba(15, 23, 42, 0.07) !important;
        }

        [data-campaign-lifecycle-root="true"] [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"]:hover {
          display: grid !important;
          transform: translateY(-2px) !important;
          border-color: rgba(147, 197, 253, 0.95) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.95) inset,
            0 24px 56px rgba(37, 99, 235, 0.13) !important;
        }

        [data-campaign-lifecycle-root="true"] [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] > * {
          min-width: 0 !important;
        }

        [data-campaign-lifecycle-root="true"] [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] > div {
          border-radius: 20px !important;
        }

        [data-campaign-lifecycle-root="true"] [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] > div:not(:first-child) {
          background: rgba(248, 250, 252, 0.88) !important;
          border: 1px solid rgba(226, 232, 240, 0.86) !important;
          padding: 14px !important;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.035) !important;
        }

        [data-campaign-lifecycle-root="true"] [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] p,
        [data-campaign-lifecycle-root="true"] [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] span {
          white-space: normal !important;
        }

        [data-campaign-lifecycle-root="true"] [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] p[class*="truncate"] {
          overflow: visible !important;
          text-overflow: clip !important;
          white-space: normal !important;
        }

        [data-campaign-lifecycle-root="true"] [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] span[class*="rounded-full"] {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-height: 28px !important;
          padding: 7px 12px !important;
          font-size: 11px !important;
          letter-spacing: 0.12em !important;
        }

        @media (max-width: 1280px) {
          [data-campaign-lifecycle-root="true"] [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 768px) {
          [data-campaign-lifecycle-root="true"] [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] {
            grid-template-columns: 1fr !important;
          }
        }


        @media (max-width: 1500px) {
          [data-campaign-lifecycle-root="true"] [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] {
            grid-template-columns:
              minmax(340px, 1.8fr)
              minmax(170px, 1fr)
              minmax(170px, 1fr)
              minmax(170px, 1fr) !important;
          }
        }

        @media (max-width: 1100px) {
          [data-campaign-lifecycle-root="true"] [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 760px) {
          [data-campaign-lifecycle-root="true"] [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] {
            grid-template-columns: 1fr !important;
          }
        }

      
        /* FINAL OVERRIDE: Deep Tasks rows full-width distribution */
        [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] {
          all: unset;
          box-sizing: border-box !important;
          cursor: pointer !important;
          display: grid !important;
          width: 100% !important;
          max-width: none !important;
          min-width: 0 !important;
          grid-template-columns:
            minmax(420px, 2.35fr)
            minmax(210px, 1fr)
            minmax(210px, 1fr)
            minmax(210px, 1fr)
            minmax(170px, .75fr) !important;
          gap: 22px !important;
          align-items: stretch !important;
          justify-content: stretch !important;
          justify-items: stretch !important;
          margin: 0 !important;
          padding: 24px !important;
          min-height: 142px !important;
          border: 1px solid rgba(203, 213, 225, 0.9) !important;
          border-radius: 30px !important;
          background:
            radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.08), transparent 30%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.95) inset,
            0 20px 50px rgba(15,23,42,0.08) !important;
          color: #020617 !important;
          font: inherit !important;
          text-align: left !important;
          white-space: normal !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"]:hover {
          transform: translateY(-2px) !important;
          border-color: rgba(96, 165, 250, 0.95) !important;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.95) inset,
            0 26px 64px rgba(37,99,235,0.15) !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] > * {
          box-sizing: border-box !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
          margin: 0 !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] > div {
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          justify-content: center !important;
          min-height: 94px !important;
          border-radius: 24px !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] > div:first-child {
          display: grid !important;
          grid-template-columns: 64px minmax(0, 1fr) !important;
          column-gap: 20px !important;
          align-items: center !important;
          justify-content: stretch !important;
          background: transparent !important;
          border: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] > div:not(:first-child) {
          background: rgba(248, 250, 252, 0.94) !important;
          border: 1px solid rgba(226, 232, 240, 0.95) !important;
          padding: 18px !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04) !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] p,
        [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] span {
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          max-width: 100% !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] span[class*="rounded-full"] {
          display: inline-flex !important;
          width: fit-content !important;
          min-height: 30px !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 8px 13px !important;
          font-size: 11px !important;
          font-weight: 900 !important;
          letter-spacing: 0.14em !important;
        }

        @media (max-width: 1600px) {
          [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] {
            grid-template-columns:
              minmax(360px, 2fr)
              minmax(180px, 1fr)
              minmax(180px, 1fr)
              minmax(180px, 1fr) !important;
          }
        }

        @media (max-width: 1180px) {
          [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 760px) {
          [data-task-ops-center="true"] button[data-task-ops-row="true" data-task-ops-row-force="true"] {
            grid-template-columns: 1fr !important;
          }
        }

      
        /* TRUE FINAL: task rows anchored from left and distributed across full width */
        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] {
          all: unset !important;
          box-sizing: border-box !important;
          cursor: pointer !important;
          display: grid !important;
          grid-template-columns:
            minmax(420px, 2fr)
            minmax(170px, .8fr)
            minmax(170px, .8fr)
            minmax(170px, .8fr)
            minmax(190px, .9fr) !important;
          column-gap: 22px !important;
          row-gap: 14px !important;
          align-items: stretch !important;
          justify-items: stretch !important;
          justify-content: stretch !important;
          width: 100% !important;
          max-width: none !important;
          min-height: 132px !important;
          margin: 0 !important;
          padding: 24px 28px !important;
          border: 1px solid rgba(203, 213, 225, 0.95) !important;
          border-radius: 30px !important;
          background:
            radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.08), transparent 30%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
          box-shadow:
            0 1px 0 rgba(255,255,255,.95) inset,
            0 18px 44px rgba(15,23,42,.07) !important;
          color: #020617 !important;
          text-align: left !important;
          white-space: normal !important;
          font: inherit !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row-force="true"]:hover {
          transform: translateY(-2px) !important;
          border-color: rgba(96, 165, 250, 0.95) !important;
          box-shadow:
            0 1px 0 rgba(255,255,255,.95) inset,
            0 26px 64px rgba(37,99,235,.14) !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] > * {
          box-sizing: border-box !important;
          width: 100% !important;
          max-width: none !important;
          min-width: 0 !important;
          margin: 0 !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] > div {
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          justify-content: center !important;
          min-height: 84px !important;
          border-radius: 22px !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] > div:first-child {
          display: grid !important;
          grid-template-columns: 58px minmax(0, 1fr) !important;
          column-gap: 18px !important;
          align-items: center !important;
          justify-content: start !important;
          background: transparent !important;
          border: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] > div:not(:first-child) {
          background: rgba(248, 250, 252, .96) !important;
          border: 1px solid rgba(226, 232, 240, .95) !important;
          padding: 16px 18px !important;
          box-shadow: 0 10px 24px rgba(15,23,42,.035) !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] p,
        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] span {
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          max-width: 100% !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] span[class*="rounded-full"] {
          display: inline-flex !important;
          width: fit-content !important;
          align-items: center !important;
          justify-content: center !important;
          min-height: 30px !important;
          padding: 8px 14px !important;
          font-size: 11px !important;
          font-weight: 900 !important;
          letter-spacing: .14em !important;
        }

        @media (max-width: 1500px) {
          [data-task-ops-center="true"] button[data-task-ops-row-force="true"] {
            grid-template-columns:
              minmax(360px, 1.7fr)
              minmax(170px, 1fr)
              minmax(170px, 1fr)
              minmax(170px, 1fr) !important;
          }
        }

        @media (max-width: 1100px) {
          [data-task-ops-center="true"] button[data-task-ops-row-force="true"] {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 760px) {
          [data-task-ops-center="true"] button[data-task-ops-row-force="true"] {
            grid-template-columns: 1fr !important;
          }
        }

      
        /* TASK OPS REAL FINAL DISTRIBUTION: exact row buttons */
        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] {
          display: grid !important;
          grid-template-columns:
            minmax(360px, 2.1fr)
            minmax(170px, 1fr)
            minmax(190px, 1fr)
            minmax(190px, 1fr)
            minmax(140px, .75fr)
            minmax(140px, .75fr) !important;
          width: 100% !important;
          max-width: none !important;
          min-width: 100% !important;
          justify-content: stretch !important;
          justify-items: stretch !important;
          align-items: stretch !important;
          gap: 20px !important;
          padding: 24px !important;
          border-radius: 30px !important;
          white-space: normal !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] > * {
          width: 100% !important;
          max-width: none !important;
          min-width: 0 !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] > div {
          min-height: 92px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          justify-content: center !important;
          border-radius: 22px !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] > div:first-child {
          display: grid !important;
          grid-template-columns: 56px minmax(0, 1fr) !important;
          column-gap: 16px !important;
          align-items: center !important;
          justify-content: stretch !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] > div:not(:first-child),
        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] > span {
          background: rgba(248, 250, 252, .96) !important;
          border: 1px solid rgba(226, 232, 240, .95) !important;
          padding: 16px !important;
          border-radius: 22px !important;
          box-shadow: 0 10px 24px rgba(15,23,42,.035) !important;
        }

        [data-task-ops-center="true"] button[data-task-ops-row-force="true"] > span {
          min-height: 92px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          align-self: stretch !important;
        }

        @media (max-width: 1536px) {
          [data-task-ops-center="true"] button[data-task-ops-row-force="true"] {
            grid-template-columns:
              minmax(320px, 1.6fr)
              minmax(160px, 1fr)
              minmax(170px, 1fr)
              minmax(170px, 1fr)
              minmax(130px, .75fr)
              minmax(130px, .75fr) !important;
          }
        }

        @media (max-width: 1280px) {
          [data-task-ops-center="true"] button[data-task-ops-row-force="true"] {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 900px) {
          [data-task-ops-center="true"] button[data-task-ops-row-force="true"] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 640px) {
          [data-task-ops-center="true"] button[data-task-ops-row-force="true"] {
            grid-template-columns: 1fr !important;
          }
        }

      
        /* FINAL FIX: task rows are div cards, not global buttons */
        [data-task-ops-center="true"] div[data-task-ops-row-force="true"] {
          display: grid !important;
          grid-template-columns:
            minmax(380px, 2fr)
            minmax(190px, 1fr)
            minmax(190px, 1fr)
            minmax(190px, 1fr)
            minmax(150px, .8fr)
            minmax(150px, .8fr) !important;
          align-items: stretch !important;
          justify-items: stretch !important;
          justify-content: stretch !important;
          width: 100% !important;
          max-width: none !important;
          min-height: 132px !important;
          gap: 20px !important;
          padding: 24px !important;
          border-radius: 30px !important;
          cursor: pointer !important;
          background:
            radial-gradient(circle at 0% 0%, rgba(37,99,235,.07), transparent 30%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
          box-shadow:
            0 1px 0 rgba(255,255,255,.95) inset,
            0 18px 44px rgba(15,23,42,.07) !important;
        }

        [data-task-ops-center="true"] div[data-task-ops-row-force="true"] > * {
          width: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
        }

        [data-task-ops-center="true"] div[data-task-ops-row-force="true"] > div {
          min-height: 86px !important;
          border-radius: 22px !important;
        }

        [data-task-ops-center="true"] div[data-task-ops-row-force="true"] > div:first-child {
          display: grid !important;
          grid-template-columns: 56px minmax(0, 1fr) !important;
          column-gap: 16px !important;
          align-items: center !important;
        }

        [data-task-ops-center="true"] div[data-task-ops-row-force="true"] > div:not(:first-child) {
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          justify-content: center !important;
          background: rgba(248,250,252,.96) !important;
          border: 1px solid rgba(226,232,240,.95) !important;
          padding: 16px !important;
          box-shadow: 0 10px 24px rgba(15,23,42,.035) !important;
        }

        [data-task-ops-center="true"] div[data-task-ops-row-force="true"] p,
        [data-task-ops-center="true"] div[data-task-ops-row-force="true"] span {
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
        }

        @media (max-width: 1536px) {
          [data-task-ops-center="true"] div[data-task-ops-row-force="true"] {
            grid-template-columns:
              minmax(340px, 1.7fr)
              minmax(170px, 1fr)
              minmax(170px, 1fr)
              minmax(170px, 1fr)
              minmax(130px, .8fr)
              minmax(130px, .8fr) !important;
          }
        }

        @media (max-width: 1280px) {
          [data-task-ops-center="true"] div[data-task-ops-row-force="true"] {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 900px) {
          [data-task-ops-center="true"] div[data-task-ops-row-force="true"] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 640px) {
          [data-task-ops-center="true"] div[data-task-ops-row-force="true"] {
            grid-template-columns: 1fr !important;
          }
        }

      
        /* Premium execution task rows */
        [data-task-ops-center="true"] [data-task-ops-row-force="true"] {
          isolation: isolate !important;
        }

        [data-task-ops-center="true"] [data-task-ops-row-force="true"] * {
          box-sizing: border-box !important;
        }

        [data-task-ops-center="true"] [data-task-ops-row-force="true"] h4,
        [data-task-ops-center="true"] [data-task-ops-row-force="true"] p {
          margin-top: 0;
          margin-bottom: 0;
        }

        [data-task-ops-center="true"] [data-task-ops-row-force="true"]:focus-visible {
          outline: 4px solid rgba(37, 99, 235, 0.18) !important;
          outline-offset: 3px !important;
        }

        @media (max-width: 1536px) {
          [data-task-ops-center="true"] [data-task-ops-row-force="true"] {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 980px) {
          [data-task-ops-center="true"] [data-task-ops-row-force="true"] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 640px) {
          [data-task-ops-center="true"] [data-task-ops-row-force="true"] {
            grid-template-columns: 1fr !important;
          }
        }

      
        /* Premium campaign timeline rows */
        [data-campaign-timeline-control="true"] [role="button"] {
          box-sizing: border-box !important;
        }

        [data-campaign-timeline-control="true"] [role="button"] * {
          box-sizing: border-box !important;
        }

        [data-campaign-timeline-control="true"] [role="button"]:focus-visible {
          outline: 4px solid rgba(16, 185, 129, 0.20) !important;
          outline-offset: 3px !important;
        }

        @media (max-width: 1280px) {
          [data-campaign-timeline-control="true"] [role="button"] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 760px) {
          [data-campaign-timeline-control="true"] [role="button"] {
            grid-template-columns: 1fr !important;
          }
        }

      `}</style>

<div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-6 py-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-violet-600 text-sm font-black text-white shadow-[0_18px_42px_rgba(37,99,235,0.24)]">
                    AC
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">
                        ANGELCARE Campaign Studio
                      </p>
                    </div>

                    <h2
                    data-campaign-modal-title="true"
                    className="mt-3 text-4xl font-black tracking-[-0.06em]"
                    style={{ color: "#000000", WebkitTextFillColor: "#000000" }}
                  >
                    {modalMode === "create" ? "Create campaign command dossier" : "Edit campaign command dossier"}
                  </h2>

                    <p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-500">
                      Professional campaign planning, execution, budgeting, governance, approvals, tracking and command management for digital, offline, B2B, B2C, partnership and field activation campaigns.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {modalMode === "edit" ? (
                    <button type="button" onClick={() => deleteCampaignPermanently()} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white shadow-[0_14px_32px_rgba(225,29,72,0.22)] transition hover:-translate-y-0.5">
                      Delete permanently
                    </button>
                  ) : null}
                  <button type="button" onClick={() => setModalOpen(false)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    Cancel
                  </button>
                  <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5">
                    {modalMode === "create" ? "Save & create campaign" : "Save changes"}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-100 bg-white px-6 py-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Mode</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{modalMode === "create" ? "New campaign" : "Existing campaign edit"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Type</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{draft.campaignType || "Not selected"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Budget</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{mad(Number(draft.budgetMad || 0))}</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Studio</p>
                  <p className="mt-1 text-sm font-black text-emerald-900">Ready for save</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-5 sm:p-6">
              <section className="grid gap-5 2xl:grid-cols-3">
                <Card className="p-5">
                  <h3 className="text-lg font-black">Campaign identity</h3>
                  <div className="mt-4 grid gap-3">
                    <Field label="Campaign name"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Example: Postpartum premium acquisition campaign" /></Field>
                    <Field label="Objective"><Textarea value={draft.objective} onChange={(e) => setDraft({ ...draft, objective: e.target.value })} placeholder="Define campaign objective, target outcome, conversion logic..." /></Field>
                    <Field label="Offer / message"><Textarea value={draft.offer} onChange={(e) => setDraft({ ...draft, offer: e.target.value })} placeholder="Offer, promise, package, promotion, partnership value..." /></Field>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-lg font-black">Market and target</h3>
                  <div className="mt-4 grid gap-3">
                    <Field label="Campaign type"><Select value={draft.campaignType} onChange={(e) => setDraft({ ...draft, campaignType: e.target.value })}>{campaignTypeOptions.map((item) => <option key={item}>{item}</option>)}</Select></Field>
                    <Field label="Target audience"><Select value={draft.targetAudience} onChange={(e) => setDraft({ ...draft, targetAudience: e.target.value })}>{targetAudienceOptions.map((item) => <option key={item}>{item}</option>)}</Select></Field>
                    <Field label="Market segment"><Select value={draft.marketSegment} onChange={(e) => setDraft({ ...draft, marketSegment: e.target.value })}>{marketSegmentOptions.map((item) => <option key={item}>{item}</option>)}</Select></Field>
                    <Field label="Business axis"><Select value={draft.businessAxis} onChange={(e) => setDraft({ ...draft, businessAxis: e.target.value })}>{businessAxisOptions.map((item) => <option key={item}>{item}</option>)}</Select></Field>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-lg font-black">Execution setup</h3>
                  <div className="mt-4 grid gap-3">
                    <Field label="Channel mix"><Select value={draft.channelMix} onChange={(e) => setDraft({ ...draft, channelMix: e.target.value })}>{channelMixOptions.map((item) => <option key={item}>{item}</option>)}</Select></Field>
                    <Field label="Main channel"><Input value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value })} placeholder="Meta, Google, WhatsApp, Field, B2B..." /></Field>
                    <Field label="Geography"><Input value={draft.geography} onChange={(e) => setDraft({ ...draft, geography: e.target.value })} placeholder="Morocco, Rabat, Casablanca, national..." /></Field>
                    <Field label="Landing page / location"><Input value={draft.landingOrLocation} onChange={(e) => setDraft({ ...draft, landingOrLocation: e.target.value })} placeholder="Landing page, branch, event, partner location..." /></Field>
                  </div>
                </Card>
              </section>

              <section className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-4">
                <Card className="p-5">
                  <h3 className="text-lg font-black">Ownership</h3>
                  <div className="mt-4 grid gap-3">
                    <Field label="Owner"><Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Marketing Director, Sales, Partnership..." /></Field>
                    <Field label="Team"><Input value={draft.team} onChange={(e) => setDraft({ ...draft, team: e.target.value })} placeholder="Market-OS, Sales, B2B, Academy..." /></Field>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-lg font-black">Status</h3>
                  <div className="mt-4 grid gap-3">
                    <Field label="Stage"><Select value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value as Stage })}>{stages.map((stage) => <option key={stage} value={stage}>{stageLabel[stage]}</option>)}</Select></Field>
                    <Field label="Risk"><Select value={draft.risk} onChange={(e) => setDraft({ ...draft, risk: e.target.value as Risk })}>{risks.map((risk) => <option key={risk} value={risk}>{riskLabel[risk]}</option>)}</Select></Field>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-lg font-black">Dates</h3>
                  <div className="mt-4 grid gap-3">
                    <Field label="Start date"><Input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} /></Field>
                    <Field label="Launch date"><Input type="date" value={draft.launchDate} onChange={(e) => setDraft({ ...draft, launchDate: e.target.value })} /></Field>
                    <Field label="End date"><Input type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} /></Field>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-lg font-black">Budget and KPI</h3>
                  <div className="mt-4 grid gap-3">
                    <Field label="Budget MAD"><Input type="number" value={draft.budgetMad} onChange={(e) => setDraft({ ...draft, budgetMad: Number(e.target.value) })} /></Field>
                    <Field label="Spent MAD"><Input type="number" value={draft.spentMad} onChange={(e) => setDraft({ ...draft, spentMad: Number(e.target.value) })} /></Field>
                    <Field label="Revenue MAD"><Input type="number" value={draft.revenueMad} onChange={(e) => setDraft({ ...draft, revenueMad: Number(e.target.value) })} /></Field>
                    <Field label="Leads"><Input type="number" value={draft.leads} onChange={(e) => setDraft({ ...draft, leads: Number(e.target.value) })} /></Field>
                  </div>
                </Card>
              </section>

              <section className="grid gap-5 2xl:grid-cols-3">
                <Card className="p-5">
                  <h3 className="text-lg font-black">Measurement</h3>
                  <div className="mt-4 grid gap-3">
                    <Field label="Primary KPI"><Select value={draft.primaryKpi} onChange={(e) => setDraft({ ...draft, primaryKpi: e.target.value })}>{kpiOptions.map((item) => <option key={item}>{item}</option>)}</Select></Field>
                    <Field label="Secondary KPI"><Select value={draft.secondaryKpi} onChange={(e) => setDraft({ ...draft, secondaryKpi: e.target.value })}>{kpiOptions.map((item) => <option key={item}>{item}</option>)}</Select></Field>
                    <Field label="Tracking plan"><Textarea value={draft.trackingPlan} onChange={(e) => setDraft({ ...draft, trackingPlan: e.target.value })} placeholder="UTM, CRM stage, call tracking, WhatsApp source, partner code..." /></Field>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-lg font-black">Assets and approvals</h3>
                  <div className="mt-4 grid gap-3">
                    <Field label="Required assets"><Textarea value={draft.assetNeed} onChange={(e) => setDraft({ ...draft, assetNeed: e.target.value })} placeholder="Landing page, visuals, copy, offer proof, WhatsApp scripts, sales deck..." /></Field>
                    <Field label="Approval requirements"><Textarea value={draft.approvalNeed} onChange={(e) => setDraft({ ...draft, approvalNeed: e.target.value })} placeholder="Director approval, budget approval, legal/compliance, partner validation..." /></Field>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-lg font-black">Governance</h3>
                  <div className="mt-4 grid gap-3">
                    <Field label="Compliance notes"><Textarea value={draft.complianceNotes} onChange={(e) => setDraft({ ...draft, complianceNotes: e.target.value })} placeholder="Brand claims, client privacy, lead consent, partner constraints..." /></Field>
                    <Field label="General notes"><Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Operational notes for execution team..." /></Field>
                  </div>
                </Card>
              </section>

              {modalMode === "edit" ? (
                <section className="grid gap-5 2xl:grid-cols-[1.2fr_0.8fr]">
                  <Card className="overflow-hidden p-0">
                    <div className="border-b border-slate-100 bg-gradient-to-br from-white via-blue-50/50 to-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">Deep Command Management</p>
                          <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">Operational task, approval and risk control</h3>
                          <p className="mt-2 max-w-4xl text-sm font-bold text-slate-500">
                            Manage execution ownership, due dates, priorities, approval states and risk escalation for this campaign dossier.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => addTask(draft.id)} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            + Task
                          </button>
                          <button type="button" onClick={() => addApproval(draft.id)} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            + Approval
                          </button>
                          <button type="button" onClick={() => addRisk(draft.id)} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            + Risk
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 p-5">
                      <div className="grid gap-4 xl:grid-cols-3">
                        <div className="rounded-[26px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Readiness</p>
                              <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-slate-950">{draft.readiness}%</p>
                            </div>
                            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-sm font-black text-emerald-700">◇</span>
                          </div>
                          <Input type="number" min={0} max={100} value={draft.readiness} onChange={(e) => setDraft({ ...draft, readiness: Number(e.target.value) })} className="mt-4" />
                        </div>

                        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Next decision</p>
                          <Textarea value={draft.nextDecision} onChange={(e) => setDraft({ ...draft, nextDecision: e.target.value })} className="mt-4 min-h-[132px]" placeholder="Next executive decision, owner, deadline, launch gate or blocking point..." />
                        </div>

                        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Command notes</p>
                          <Textarea value={draft.commandNotes} onChange={(e) => setDraft({ ...draft, commandNotes: e.target.value })} className="mt-4 min-h-[132px]" placeholder="Operational notes, leadership instructions, coordination context..." />
                        </div>
                      </div>

                      <div className="grid gap-5 xl:grid-cols-3">
                        <div className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-white p-5 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Tasks</p>
                              <h4 className="mt-1 text-xl font-black text-slate-950">Execution tasks</h4>
                            </div>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                              {state.tasks.filter((item) => item.campaignId === draft.id).length}
                            </span>
                          </div>

                          <div className="mt-4 space-y-3">
                            {state.tasks.filter((item) => item.campaignId === draft.id).length ? (
                              state.tasks.filter((item) => item.campaignId === draft.id).map((task) => (
                                <div key={task.id} className="rounded-[22px] border border-blue-100 bg-white p-4 shadow-sm">
                                  <Field label="Task title">
                                    <Input value={task.title} onChange={(e) => updateTask(task.id, { title: e.target.value })} />
                                  </Field>

                                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <Field label="Owner">
                                      <Input value={task.owner} onChange={(e) => updateTask(task.id, { owner: e.target.value })} />
                                    </Field>
                                    <Field label="Due date">
                                      <Input type="date" value={task.dueDate} onChange={(e) => updateTask(task.id, { dueDate: e.target.value })} />
                                    </Field>
                                    <Field label="Status">
                                      <Select value={task.status} onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}>
                                        <option value="todo">Todo</option>
                                        <option value="doing">Doing</option>
                                        <option value="done">Done</option>
                                        <option value="blocked">Blocked</option>
                                      </Select>
                                    </Field>
                                    <Field label="Priority">
                                      <Select value={task.priority} onChange={(e) => updateTask(task.id, { priority: e.target.value as Task["priority"] })}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                      </Select>
                                    </Field>
                                  </div>

                                  <div className="mt-3 flex items-center justify-between gap-3">
                                    <Pill tone={(task.status === "done" ? "emerald" : task.status === "blocked" ? "rose" : "blue") as "blue" | "emerald" | "rose" | "amber" | "violet" | "slate"}>{task.status}</Pill>
                                    <button type="button" onClick={() => deleteTask(task.id)} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white">
                                      Delete task
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-[22px] border border-dashed border-blue-200 bg-white/70 p-5 text-sm font-bold text-slate-500">
                                No execution tasks yet. Add a task with owner, status, priority and due date.
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-[28px] border border-amber-100 bg-gradient-to-br from-amber-50/80 via-white to-white p-5 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Approvals</p>
                              <h4 className="mt-1 text-xl font-black text-slate-950">Approval controls</h4>
                            </div>
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                              {state.approvals.filter((item) => item.campaignId === draft.id).length}
                            </span>
                          </div>

                          <div className="mt-4 space-y-3">
                            {state.approvals.filter((item) => item.campaignId === draft.id).length ? (
                              state.approvals.filter((item) => item.campaignId === draft.id).map((approval) => (
                                <div key={approval.id} className="rounded-[22px] border border-amber-100 bg-white p-4 shadow-sm">
                                  <Field label="Approval title">
                                    <Input value={approval.title} onChange={(e) => updateApproval(approval.id, { title: e.target.value })} />
                                  </Field>

                                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <Field label="Owner">
                                      <Input value={approval.owner} onChange={(e) => updateApproval(approval.id, { owner: e.target.value })} />
                                    </Field>
                                    <Field label="Status">
                                      <Select value={approval.status} onChange={(e) => updateApproval(approval.id, { status: e.target.value as ApprovalStatus })}>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                      </Select>
                                    </Field>
                                  </div>

                                  <div className="mt-3 flex items-center justify-between gap-3">
                                    <Pill tone={(approval.status === "approved" ? "emerald" : approval.status === "rejected" ? "rose" : "amber") as "blue" | "emerald" | "rose" | "amber" | "violet" | "slate"}>{approval.status}</Pill>
                                    <button type="button" onClick={() => deleteApproval(approval.id)} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white">
                                      Delete approval
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-[22px] border border-dashed border-amber-200 bg-white/70 p-5 text-sm font-bold text-slate-500">
                                No approvals yet. Add approval owner and status before launch.
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50/80 via-white to-white p-5 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-700">Risks</p>
                              <h4 className="mt-1 text-xl font-black text-slate-950">Risk register</h4>
                            </div>
                            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">
                              {state.risks.filter((item) => item.campaignId === draft.id).length}
                            </span>
                          </div>

                          <div className="mt-4 space-y-3">
                            {state.risks.filter((item) => item.campaignId === draft.id).length ? (
                              state.risks.filter((item) => item.campaignId === draft.id).map((risk) => (
                                <div key={risk.id} className="rounded-[22px] border border-rose-100 bg-white p-4 shadow-sm">
                                  <Field label="Risk title">
                                    <Input value={risk.title} onChange={(e) => updateRiskRecord(risk.id, { title: e.target.value })} />
                                  </Field>

                                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <Field label="Owner">
                                      <Input value={risk.owner} onChange={(e) => updateRiskRecord(risk.id, { owner: e.target.value })} />
                                    </Field>
                                    <Field label="Severity">
                                      <Select value={risk.level} onChange={(e) => updateRiskRecord(risk.id, { level: e.target.value as Risk })}>
                                        {risks.map((riskLevel) => <option key={riskLevel} value={riskLevel}>{riskLabel[riskLevel]}</option>)}
                                      </Select>
                                    </Field>
                                  </div>

                                  <div className="mt-3 flex items-center justify-between gap-3">
                                    <Pill tone={riskTone(risk.level) as any}>{riskLabel[risk.level]}</Pill>
                                    <button type="button" onClick={() => deleteRiskRecord(risk.id)} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white">
                                      Delete risk
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-[22px] border border-dashed border-rose-200 bg-white/70 p-5 text-sm font-bold text-slate-500">
                                No risks logged. Add risk owner and severity when a blocker appears.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-700">Recent Activities</p>
                    <h3 className="mt-1 text-2xl font-black">Campaign timeline</h3>
                    <div className="mt-5 space-y-3">
                      {selectedLogs.length ? selectedLogs.map((log) => (
                        <div key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-black text-slate-950">{log.message}</p>
                          <p className="mt-1 text-xs font-bold text-slate-500">{log.meta}</p>
                          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                      )) : (
                        <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                          No campaign-specific activity yet. Save changes, add tasks, add approvals or log risks to populate this timeline.
                        </div>
                      )}
                    </div>
                  </Card>
                </section>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </main>
  )
}
