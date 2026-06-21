"use client"

import Link from "next/link"
import React, { useEffect, useMemo, useState } from "react"

type Stage = "planning" | "production" | "approval" | "launch-ready" | "live" | "optimization"
type Risk = "low" | "medium" | "high" | "critical"
type TaskStatus = "todo" | "doing" | "done" | "blocked"
type ApprovalStatus = "pending" | "approved" | "rejected"
type Panel = "overview" | "execution" | "create" | "launch" | "budget" | "risk" | "tasks" | "performance" | "approvals" | "calendar"
type SidebarKey = "command" | "execution" | "create" | "launch" | "budget" | "risk" | "performance" | "approvals" | "calendar"

type Campaign = {
  id: string
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
  owner: string
  status: TaskStatus
  priority: "low" | "medium" | "high"
  dueDate: string
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

function riskTone(risk: Risk): "emerald" | "amber" | "rose" {
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
  const [selectedChannel, setSelectedChannel] = useState<ChannelNodeName>("Meta Ads")
  const [mindmapZoom, setMindmapZoom] = useState(1)
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
      dueDate: isoToday(),
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
    <main className="min-h-screen bg-white text-slate-950">
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
              { labelText: "Create Campaign", icon: "+", panel: "create", keyName: "create" },
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
              <div>
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
                    <Icon icon={icon} tone={tone} />
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-500">{note}</p>
                </Card>
              ))}
            </section>


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
                      <Icon icon="⬡" tone="sky" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Approvals Due</p>
                        <p className="mt-1 text-2xl font-black text-slate-950">{metrics.approvalsDue}</p>
                      </div>
                    </div>
                  </Card>
                </section>

                <section className="grid gap-5 2xl:grid-cols-[1.15fr_0.85fr]">
                  <Card className="overflow-hidden p-0">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-white via-blue-50/40 to-white p-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Channel Activation Mindmap</h3>
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-50 text-xs font-black text-blue-700">i</span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-slate-500">Click a channel node to inspect live campaigns, execution data and channel pressure.</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">View</span>
                        <select value={selectedChannel} onChange={(event) => setSelectedChannel(event.target.value as ChannelNodeName)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50">
                          {channelNodes.map((channel) => <option key={channel.name} value={channel.name}>{channel.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="relative min-h-[720px] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.12),transparent_34%),linear-gradient(135deg,#ffffff,#f8fbff)] p-6">
                      <div className="pointer-events-none absolute inset-0 opacity-70">
                        <div className="absolute left-[50%] top-[50%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-100" />
                        <div className="absolute left-[50%] top-[50%] h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-100/80" />
                        <div className="absolute left-[50%] top-[50%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200/80 bg-white/70 shadow-[0_30px_90px_rgba(37,99,235,0.12)]" />
                      </div>

                      <svg className="pointer-events-none absolute inset-0 hidden h-full w-full xl:block" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {channelStats.map((channel, index) => {
                          const position = channelMindmapPositions[index] || channelMindmapPositions[0]
                          const selectedNode = selectedChannel === channel.name
                          const palette = channelPalette(channel.tone)

                          return (
                            <g key={`${channel.name}-connector`}>
                              <path
                                d={`M 50 50 C 50 ${position.y}, ${position.x} 50, ${position.x} ${position.y}`}
                                fill="none"
                                stroke={palette.color}
                                strokeWidth={selectedNode ? 0.55 : 0.32}
                                strokeOpacity={selectedNode ? 0.58 : 0.25}
                                strokeLinecap="round"
                              />
                              <circle cx={position.x} cy={position.y} r={selectedNode ? 0.85 : 0.55} fill={palette.color} opacity={selectedNode ? 0.9 : 0.42} />
                            </g>
                          )
                        })}
                      </svg>

                      <div className="absolute left-1/2 top-1/2 z-10 hidden h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-blue-100 bg-white/95 text-center shadow-[0_35px_100px_rgba(37,99,235,0.16)] ring-8 ring-blue-50/80 xl:grid">
                        <div>
                          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[24px] bg-gradient-to-br from-blue-600 via-sky-500 to-emerald-500 text-white shadow-[0_18px_45px_rgba(37,99,235,0.28)]">
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

                      <div className="relative z-20 hidden min-h-[650px] xl:block">
                        {channelStats.map((channel, index) => {
                          const position = channelMindmapPositions[index] || channelMindmapPositions[0]
                          const selectedNode = selectedChannel === channel.name
                          const palette = channelPalette(channel.tone)

                          return (
                            <button
                              key={channel.name}
                              type="button"
                              onClick={() => setSelectedChannel(channel.name as ChannelNodeName)}
                              className="absolute w-[310px] rounded-[28px] border p-4 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(15,23,42,0.12)]"
                              style={{ ...position, ...channelNodeStyle(channel.tone, selectedNode) }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-xl font-black shadow-[0_10px_25px_rgba(15,23,42,0.08)]" style={{ color: palette.color }}>
                                  {channel.icon}
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-lg font-black tracking-[-0.03em] text-slate-950">{channel.name}</span>
                                  <span className="mt-1 block text-xs font-bold text-slate-500">{channel.group}</span>
                                </span>

                                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-sm font-black shadow-sm" style={{ color: palette.color }}>
                                  {channel.activeCampaigns.length}
                                </span>
                              </div>

                              <div className="mt-4 grid grid-cols-3 gap-2">
                                <div className="rounded-2xl bg-white/80 px-3 py-2 shadow-sm">
                                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Active</p>
                                  <p className="mt-1 text-sm font-black text-slate-950">{channel.activeCampaigns.length}</p>
                                </div>
                                <div className="rounded-2xl bg-white/80 px-3 py-2 shadow-sm">
                                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Draft</p>
                                  <p className="mt-1 text-sm font-black text-slate-950">{channel.draftCampaigns.length}</p>
                                </div>
                                <div className="rounded-2xl bg-white/80 px-3 py-2 shadow-sm">
                                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">ROAS</p>
                                  <p className="mt-1 text-sm font-black text-slate-950">{channel.roasValue}x</p>
                                </div>
                              </div>

                              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, Math.max(8, channel.activeCampaigns.length * 16 + channel.launchReadyCampaigns.length * 12))}%`,
                                    background: `linear-gradient(90deg, ${palette.color}, ${palette.glow})`,
                                  }}
                                />
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      <div className="relative z-20 grid gap-3 xl:hidden">
                        {channelStats.map((channel) => {
                          const selectedNode = selectedChannel === channel.name
                          const palette = channelPalette(channel.tone)

                          return (
                            <button
                              key={channel.name}
                              type="button"
                              onClick={() => setSelectedChannel(channel.name as ChannelNodeName)}
                              className="rounded-[26px] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                              style={channelNodeStyle(channel.tone, selectedNode)}
                            >
                              <div className="flex items-center gap-3">
                                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-lg font-black shadow-sm" style={{ color: palette.color }}>
                                  {channel.icon}
                                </span>
                                <span className="flex-1">
                                  <span className="block text-base font-black text-slate-950">{channel.name}</span>
                                  <span className="block text-xs font-bold text-slate-500">{channel.activeCampaigns.length} active campaigns</span>
                                </span>
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-black" style={{ color: palette.color }}>
                                  {channel.activeCampaigns.length}
                                </span>
                              </div>
                            </button>
                          )
                        })}
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

                <section className="grid gap-4 xl:grid-cols-4">
                  <Card className="p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Execution Score</p>
                    <p className="mt-3 text-4xl font-black text-slate-950">{averageReadiness || 0}<span className="text-base text-slate-400">/100</span></p>
                    <p className="mt-2 text-sm font-bold text-slate-500">Momentum based on campaign readiness.</p>
                  </Card>

                  <Card className="p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Top Performing Channel</p>
                    <p className="mt-3 text-2xl font-black text-slate-950">{topChannel?.name || "—"}</p>
                    <p className="mt-2 text-sm font-bold text-slate-500">{topChannel?.activeCampaigns.length || 0} active campaigns</p>
                  </Card>

                  <Card className="p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Alerts & Watchouts</p>
                    <p className="mt-3 text-2xl font-black text-slate-950">{metrics.highRisk + metrics.approvalsDue}</p>
                    <p className="mt-2 text-sm font-bold text-slate-500">{metrics.highRisk} risk alerts • {metrics.approvalsDue} approvals pending</p>
                  </Card>

                  <Card className="p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Automation Status</p>
                    <p className="mt-3 text-2xl font-black text-slate-950">{metrics.tasksDue}</p>
                    <p className="mt-2 text-sm font-bold text-slate-500">Open execution tasks awaiting progress.</p>
                  </Card>
                </section>
              </section>
            ) : null}



            <section className={`${activePanel === "execution" ? "hidden" : "grid"} gap-5 xl:grid-cols-[minmax(0,1fr)_430px]`}>
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
                          <Pill tone={riskTone(campaign.risk)}>{riskLabel[campaign.risk]}</Pill>
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
                    <button onClick={runLaunchReadiness} disabled={!selected} className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">Run Launch Readiness Check</button>
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
                          <Pill tone={riskTone(risk.level)}>{riskLabel[risk.level]}</Pill>
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
                                  <Pill tone={riskTone(campaign.risk)}>{riskLabel[campaign.risk]}</Pill>
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
                        <div className="mt-2 flex justify-between"><Pill tone={task.status === "done" ? "emerald" : task.status === "blocked" ? "rose" : "blue"}>{task.status}</Pill><span className="text-xs font-bold text-slate-500">{task.dueDate}</span></div>
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
                                    <Pill tone={task.status === "done" ? "emerald" : task.status === "blocked" ? "rose" : "blue"}>{task.status}</Pill>
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
                                    <Pill tone={approval.status === "approved" ? "emerald" : approval.status === "rejected" ? "rose" : "amber"}>{approval.status}</Pill>
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
                                    <Pill tone={riskTone(risk.level)}>{riskLabel[risk.level]}</Pill>
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
