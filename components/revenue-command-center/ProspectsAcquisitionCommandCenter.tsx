// @ts-nocheck
"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useLiveAppointments, useLiveProspects, useLiveTasks } from "@/lib/revenue-command-center/live-sync"
import {
  Activity,  BarChart3,  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,  DatabaseZap,  FileText,
  Flame,
  Gauge,
  Globe2,
  Handshake,
  Import,
  Layers3,
  Mail,
  MapPinned,  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Radar,
  RefreshCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react"

type ProspectStage =
  | "new_lead"
  | "discovery"
  | "qualification"
  | "decision_map"
  | "appointment_ready"
  | "proposal"
  | "negotiation"
  | "contracting"
  | "closed_won"
  | "closed_lost"
  | "recovery"

type ProspectPriority = "critical" | "high" | "medium" | "low"
type ProspectHealth = "on_track" | "risk" | "recovery" | "stalled"
type ProspectType = "family" | "clinic" | "corporate" | "academy" | "partner" | "institution" | "website" | "campaign"

type ProspectRecord = {
  id: string
  name: string
  company: string
  contactName: string
  phone: string
  email: string
  city: string
  source: string
  type: ProspectType
  owner: string
  closer: string
  stage: ProspectStage
  priority: ProspectPriority
  health: ProspectHealth
  valueMad: number
  score: number
  probability: number
  urgency: number
  fitScore: number
  decisionMaker: string
  decisionMakerConfirmed: boolean
  stakeholders: string[]
  needSummary: string
  painPoints: string
  budgetContext: string
  competitorRisk: string
  objection: string
  nextAction: string
  nextContactDate: string
  qualificationNotes: string
  proposedOffer: string
  negotiationTerms: string
  recoveryPlan: string
  documents: string[]
  createdAt: string
  updatedAt: string
}

type ProspectLog = {
  id: string
  prospectId: string
  at: string
  action: string
  note: string
}

type ProspectStore = {
  prospects: ProspectRecord[]
  logs?: ProspectLog[]
  automations?: Array<{ id: string; name: string; trigger: string; action: string; enabled: boolean }>
  source?: string
  syncedAt?: string
  updatedAt?: string
}

type ProspectCommandAction =
  | "add_prospect"
  | "import_companies"
  | "create_proposal"
  | "send_email"
  | "whatsapp_blast"
  | "schedule_meeting"
  | "create_task"
  | "generate_report"


const STORE_KEY = "revenue_prospects_v12_mega_store"
const SNAPSHOT_KEYS = [STORE_KEY, "revenue_command_browser_snapshots", "angelcare_global_persistence_snapshots"]

const stageLabels: Record<ProspectStage, string> = {
  new_lead: "New Lead",
  discovery: "Discovery",
  qualification: "Qualification",
  decision_map: "Decision Map",
  appointment_ready: "Appointment Ready",
  proposal: "Proposal",
  negotiation: "Negotiation",
  contracting: "Contracting",
  closed_won: "Won",
  closed_lost: "Lost",
  recovery: "Recovery",
}

const stageOrder: ProspectStage[] = [
  "new_lead",
  "discovery",
  "qualification",
  "decision_map",
  "appointment_ready",
  "proposal",
  "negotiation",
  "contracting",
  "closed_won",
]

const stageShort: Partial<Record<ProspectStage, string>> = {
  new_lead: "Prospecting",
  discovery: "Discovery",
  qualification: "Qualification",
  decision_map: "Decision Map",
  appointment_ready: "Appointment Ready",
  proposal: "Proposal",
  negotiation: "Negotiation",
  contracting: "Closing",
  closed_won: "Won",
  recovery: "Recovery",
}


function safeParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function normalizeProspect(raw: Partial<ProspectRecord> & { id?: string; value?: number; valueMad?: number }): ProspectRecord {
  const now = new Date().toISOString()
  const stage = (raw.stage || "new_lead") as ProspectStage
  const priority = (raw.priority || "high") as ProspectPriority
  const health = (raw.health || "on_track") as ProspectHealth
  const type = (raw.type || "institution") as ProspectType
  return {
    id: String(raw.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    name: String(raw.name || raw.company || "Unnamed prospect"),
    company: String(raw.company || raw.name || ""),
    contactName: String(raw.contactName || "N/A"),
    phone: String(raw.phone || ""),
    email: String(raw.email || ""),
    city: String(raw.city || "Unassigned"),
    source: String(raw.source || "Manual"),
    type,
    owner: String(raw.owner || "BD Officer"),
    closer: String(raw.closer || "Revenue Manager"),
    stage,
    priority,
    health,
    valueMad: Number(raw.valueMad || raw.value || 0),
    score: Number(raw.score || 65),
    probability: Number(raw.probability || 55),
    urgency: Number(raw.urgency || 50),
    fitScore: Number(raw.fitScore || 60),
    decisionMaker: String(raw.decisionMaker || ""),
    decisionMakerConfirmed: Boolean(raw.decisionMakerConfirmed),
    stakeholders: Array.isArray(raw.stakeholders) ? raw.stakeholders.map(String) : [],
    needSummary: String(raw.needSummary || ""),
    painPoints: String(raw.painPoints || ""),
    budgetContext: String(raw.budgetContext || ""),
    competitorRisk: String(raw.competitorRisk || ""),
    objection: String(raw.objection || ""),
    nextAction: String(raw.nextAction || "Qualify prospect and define next commercial step."),
    nextContactDate: String(raw.nextContactDate || now.slice(0, 10)),
    qualificationNotes: String(raw.qualificationNotes || ""),
    proposedOffer: String(raw.proposedOffer || ""),
    negotiationTerms: String(raw.negotiationTerms || ""),
    recoveryPlan: String(raw.recoveryPlan || ""),
    documents: Array.isArray(raw.documents) ? raw.documents.map(String) : ["Qualification summary", "Proposal"],
    createdAt: String(raw.createdAt || now),
    updatedAt: String(raw.updatedAt || now),
  }
}

function loadProspectStore(): ProspectStore {
  if (typeof window === "undefined") return { prospects: [] }

  const direct = safeParse<ProspectStore>(localStorage.getItem(STORE_KEY))
  if (direct?.prospects?.length) {
    return { ...direct, prospects: direct.prospects.map(normalizeProspect) }
  }

  for (const key of SNAPSHOT_KEYS) {
    const payload = safeParse<Record<string, unknown>>(localStorage.getItem(key))
    if (!payload) continue
    const snapshotCandidate = payload[STORE_KEY]
    if (typeof snapshotCandidate === "string") {
      const recovered = safeParse<ProspectStore>(snapshotCandidate)
      if (recovered?.prospects?.length) {
        localStorage.setItem(STORE_KEY, JSON.stringify(recovered))
        return { ...recovered, prospects: recovered.prospects.map(normalizeProspect) }
      }
    }
    if (snapshotCandidate && typeof snapshotCandidate === "object") {
      const recovered = snapshotCandidate as ProspectStore
      if (recovered.prospects?.length) {
        localStorage.setItem(STORE_KEY, JSON.stringify(recovered))
        return { ...recovered, prospects: recovered.prospects.map(normalizeProspect) }
      }
    }
  }

  return { prospects: [] }
}

function saveProspectStore(store: ProspectStore) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORE_KEY, JSON.stringify({ ...store, updatedAt: new Date().toISOString() }))
}

function downloadTextFile(filename: string, content: string) {
  if (typeof window === "undefined") return
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function mad(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 1 : 2)}M MAD`
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1000)}K MAD`
  return `${Math.round(value || 0)} MAD`
}

function pct(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value || 0)))}%`
}

function isSameWeek(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return date >= start && date < end
}

function daysAgo(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "recently"
  const diff = Math.max(0, Date.now() - date.getTime())
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "AC"
}

function getCityKey(city: string) {
  return city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ")
}



function normalizeLiveProspectForTemplate(p: any): ProspectRecord & {
  taskCount: number
  appointmentCount: number
  tasks: number
  appointments: number
  contact: string
  lastContact: string
  raw?: any
} {
  const taskCount = Number(p.taskCount || 0)
  const appointmentCount = Number(p.appointmentCount || 0)
  const record = normalizeProspect({
    ...(p.raw || {}),
    id: p.id,
    name: p.name,
    company: p.company || p.name,
    city: p.city,
    stage: p.stage,
    priority: p.priority,
    score: p.score,
    valueMad: p.valueMad,
    owner: p.owner,
    contactName: p.contactName,
    email: p.email,
    phone: p.phone,
    nextAction: p.nextAction || "Review account",
    source: p.raw?.data?.source || p.raw?.source || "live",
  })

  return {
    ...record,
    contact: record.contactName,
    tasks: taskCount,
    taskCount,
    appointments: appointmentCount,
    appointmentCount,
    lastContact: p.raw?.last_contact || p.raw?.lastContact || "",
    raw: p.raw,
  }
}

function filterLiveProspectsForTemplate(prospects: any[], tab: string, query: string) {
  const q = String(query || "").trim().toLowerCase()
  return prospects
    .filter((p) => {
      if (!tab || tab === "all") return true
      if (tab === "hot") return ["high", "critical"].includes(String(p.priority))
      if (tab === "appointments") return Number(p.appointmentCount || 0) > 0
      if (tab === "tasks") return Number(p.taskCount || 0) > 0
      return String(p.stage) === tab || String(p.priority) === tab
    })
    .filter((p) => {
      if (!q) return true
      return [p.name, p.city, p.stage, p.priority, p.owner, p.contactName, p.email, p.phone]
        .join(" ")
        .toLowerCase()
        .includes(q)
    })
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
}


function normalizeLiveProspectToProspectRecord(p: any): ProspectRecord {
  const raw = p?.raw || {}
  const data = raw?.data || {}
  const typeCandidate = String(raw.type || data.type || data.sector || "institution")
  const allowedTypes: ProspectType[] = ["family", "clinic", "corporate", "academy", "partner", "institution", "website", "campaign"]

  return normalizeProspect({
    ...raw,
    ...data,
    id: p.id || raw.id,
    name: p.name || raw.name || data.name || "Unnamed prospect",
    company: p.name || raw.company || data.company || raw.name || data.name || "Unnamed prospect",
    city: p.city || raw.city || data.city || "Unassigned",
    stage: p.stage || raw.stage || data.stage || "new_lead",
    priority: p.priority || raw.priority || data.priority || "medium",
    score: Number(p.score ?? raw.score ?? data.score ?? 0),
    valueMad: Number(p.valueMad ?? raw.value_mad ?? raw.valueMad ?? data.valueMad ?? data.value ?? 0),
    owner: p.owner || raw.owner || data.owner || "BD Officer",
    contactName: p.contactName || raw.contact_name || raw.contactName || data.contactName || data.decisionMaker || "N/A",
    decisionMaker: p.contactName || raw.decision_maker || raw.decisionMaker || data.decisionMaker || data.contactName || "N/A",
    email: p.email || raw.email || data.email || "",
    phone: p.phone || raw.phone || data.phone || "",
    type: (allowedTypes.includes(typeCandidate as ProspectType) ? typeCandidate : "institution") as ProspectType,
    source: raw.source || data.source || "live",
    probability: Number(raw.probability ?? data.probability ?? 50),
    fitScore: Number(raw.fit_score ?? raw.fitScore ?? data.fitScore ?? 70),
    urgency: Number(raw.urgency ?? data.urgency ?? 50),
    updatedAt: p.updatedAt || raw.updated_at || raw.updatedAt || new Date().toISOString(),
    createdAt: raw.created_at || raw.createdAt || data.createdAt || new Date().toISOString(),
    stakeholders: Array.isArray(raw.stakeholders) ? raw.stakeholders : Array.isArray(data.stakeholders) ? data.stakeholders : [],
    nextContactDate: raw.next_contact_date || raw.nextContactDate || data.nextContactDate || new Date().toISOString().slice(0, 10),
  })
}

function buildLiveProspectStore(liveProspects: any[], previousStore: ProspectStore): ProspectStore {
  const canonicalProspects = liveProspects.map(normalizeLiveProspectToProspectRecord)

  return {
    ...(previousStore || {}),
    prospects: canonicalProspects,
    source: "supabase-live",
    syncedAt: new Date().toISOString(),
  }
}

function computeLiveProspectStats(liveProspects: any[], liveTasks: any[], liveAppointments: any[]) {
  const totalProspects = liveProspects.length
  const highPriorityProspects = liveProspects.filter((p) => ["high", "critical"].includes(String(p.priority))).length
  const activeProspects = liveProspects.filter((p) => !["lost", "archived", "inactive"].includes(String(p.stage))).length
  const pipelineValue = liveProspects.reduce((sum, p) => sum + Number(p.valueMad || 0), 0)
  const meetingsThisWeek = liveAppointments.filter((a) => {
    if (!a.appointmentAt) return false
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    const d = new Date(a.appointmentAt)
    return d >= start && d < end
  }).length
  const pendingContracts = liveTasks.filter((t) => {
    const type = String(t.taskType || "").toLowerCase()
    const title = String(t.title || "").toLowerCase()
    const status = String(t.status || "").toLowerCase()
    return (type.includes("contract") || title.includes("contract")) && !["done", "completed", "cancelled"].includes(status)
  }).length
  const closingStages = liveProspects.filter((p) => ["proposal", "negotiation", "contract", "closing"].includes(String(p.stage))).length
  const closingProbability = totalProspects ? Math.round((closingStages / totalProspects) * 100) : 0

  return {
    totalProspects,
    activeProspects,
    highPriorityProspects,
    pipelineValue,
    meetingsThisWeek,
    pendingContracts,
    closingProbability,
    liveTaskCount: liveTasks.length,
    liveAppointmentCount: liveAppointments.length,
    revenueForecast: Math.round(pipelineValue * Math.max(0.1, closingProbability / 100)),
  }
}

function formatLiveMad(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M MAD`
  if (value >= 1000) return `${Math.round(value / 1000)}K MAD`
  return `${Math.round(value).toLocaleString()} MAD`
}

export default function ProspectsAcquisitionCommandCenter() {
  const [store, setStore] = useState<ProspectStore>({ prospects: [] })
  const [query, setQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<"all" | ProspectStage | "hot">("all")
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [activeAction, setActiveAction] = useState<ProspectCommandAction | null>(null)

  const {
    prospects: liveProspects,
    loading: liveProspectsLoading,
    error: liveProspectsError,
    refresh: refreshLiveProspects,
  } = useLiveProspects()

  const {
    tasks: liveTasks,
    byEntityId: liveTasksByProspect,
    loading: liveTasksLoading,
    refresh: refreshLiveTasks,
  } = useLiveTasks()

  const {
    appointments: liveAppointments,
    byEntityId: liveAppointmentsByProspect,
    loading: liveAppointmentsLoading,
    refresh: refreshLiveAppointments,
  } = useLiveAppointments()

  const liveSyncLoading = liveProspectsLoading || liveTasksLoading || liveAppointmentsLoading
  const liveProspectCount = liveProspects.length
  const liveTaskCount = liveTasks.length
  const liveAppointmentCount = liveAppointments.length
  const livePipelineValue = (liveProspects as any[]).reduce((sum: number, p: any) => sum + Number(p.valueMad || 0), 0)

  const liveStats = computeLiveProspectStats(liveProspects, liveTasks, liveAppointments) // RCC visible numbers force fix

  const liveProspectsForTemplate = (liveProspects as any[]).map((p: any) => normalizeLiveProspectForTemplate({
    ...p,
    taskCount: liveTasksByProspect.get(p.id)?.length || 0,
    appointmentCount: liveAppointmentsByProspect.get(p.id)?.length || 0,
    nextAction: liveTasksByProspect.get(p.id)?.[0]?.title || liveAppointmentsByProspect.get(p.id)?.[0]?.title || "Review account",
  }))

  const liveFilterKey = stageFilter || "all"
  const liveSearchKey = query || ""

  const displayProspects = filterLiveProspectsForTemplate(
    liveProspectsForTemplate,
    liveFilterKey,
    liveSearchKey,
  )

  const topDisplayProspects = displayProspects.slice(0, 12)

  const visibleProspectStats = {
    total: liveProspectsForTemplate.length,
    displayed: displayProspects.length,
    hot: liveProspectsForTemplate.filter((p: ProspectRecord) => ["high", "critical"].includes(String(p.priority))).length,
    qualification: liveProspectsForTemplate.filter((p: ProspectRecord) => String(p.stage) === "qualification").length,
    proposal: liveProspectsForTemplate.filter((p: ProspectRecord) => String(p.stage) === "proposal").length,
    negotiation: liveProspectsForTemplate.filter((p: ProspectRecord) => String(p.stage) === "negotiation").length,
  }

  const liveActiveTab = stageFilter || "all"

  const liveSearchText = query || ""
  
  useEffect(() => {
    const listener = () => {
      void refreshAllLiveRevenueData()
    }

    window.addEventListener("rcc-prospects-canonical-refresh", listener)

    return () => {
      window.removeEventListener("rcc-prospects-canonical-refresh", listener)
    }
  }, [])

async function refreshAllLiveRevenueData() {
    await Promise.all([refreshLiveProspects(), refreshLiveTasks(), refreshLiveAppointments()])
  }


  function commitStore(nextStore: ProspectStore) {
    saveProspectStore(nextStore)
    setStore(nextStore)
    window.dispatchEvent(new CustomEvent("rcc-prospects-canonical-refresh"))
    setLastSync(new Date())
  }

  function refresh() {
    setStore(loadProspectStore())
    setLastSync(new Date())
  }

  useEffect(() => {
    refresh()
    const interval = window.setInterval(refresh, 6000)
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key.includes("revenue") || event.key.includes("prospects")) refresh()
    }
    window.addEventListener("storage", onStorage)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const canonicalStore: ProspectStore = buildLiveProspectStore(liveProspects as any[], store)
  const prospects: ProspectRecord[] = canonicalStore.prospects

  const metrics = useMemo(() => {
    const totalValue = prospects.reduce((sum, p) => sum + (Number(p.valueMad) || 0), 0)
    const active = prospects.filter((p) => !["closed_won", "closed_lost"].includes(p.stage)).length
    const thisWeek = prospects.filter((p) => isSameWeek(p.nextContactDate)).length
    const avgProbability = prospects.length ? prospects.reduce((sum, p) => sum + Number(p.probability || 0), 0) / prospects.length : 0
    const pendingContracts = prospects.filter((p) => ["proposal", "negotiation", "contracting"].includes(p.stage)).length
    const forecast = prospects.reduce((sum, p) => sum + (Number(p.valueMad) || 0) * (Number(p.probability || 0) / 100), 0)
    const hot = prospects.filter((p) => p.priority === "critical" || p.priority === "high" || p.score >= 78).length
    return { totalValue, active, thisWeek, avgProbability, pendingContracts, forecast, hot }
  }, [prospects])

  const filteredProspects = useMemo(() => {
    const q = query.trim().toLowerCase()
    return prospects
      .filter((p) => {
        if (stageFilter === "hot") return p.priority === "critical" || p.priority === "high" || p.score >= 78
        if (stageFilter !== "all") return p.stage === stageFilter
        return true
      })
      .filter((p) => {
        if (!q) return true
        return [p.name, p.company, p.contactName, p.city, p.email, p.phone, p.owner, p.stage, p.source].join(" ").toLowerCase().includes(q)
      })
      .sort((a, b) => b.score + b.valueMad / 100000 - (a.score + a.valueMad / 100000))
  }, [prospects, query, stageFilter])

  const topProspects = filteredProspects.slice(0, 7)

  const stageStats = useMemo(() => {
    return stageOrder.map((stage) => {
      const items = prospects.filter((p) => p.stage === stage)
      const value = items.reduce((sum, p) => sum + p.valueMad, 0)
      return { stage, count: items.length, value }
    })
  }, [prospects])

  const cityStats = useMemo(() => {
    const byCity = new Map<string, { city: string; count: number; value: number }>()
    prospects.forEach((p) => {
      const key = getCityKey(p.city || "Unassigned")
      const existing = byCity.get(key) || { city: p.city || "Unassigned", count: 0, value: 0 }
      existing.count += 1
      existing.value += p.valueMad || 0
      byCity.set(key, existing)
    })
    return Array.from(byCity.values()).sort((a, b) => b.count - a.count)
  }, [prospects])

  const ownerStats = useMemo(() => {
    const byOwner = new Map<string, { owner: string; count: number; value: number; score: number }>()
    prospects.forEach((p) => {
      const owner = p.owner || "Unassigned"
      const existing = byOwner.get(owner) || { owner, count: 0, value: 0, score: 0 }
      existing.count += 1
      existing.value += p.valueMad || 0
      existing.score += p.score || 0
      byOwner.set(owner, existing)
    })
    return Array.from(byOwner.values())
      .map((x) => ({ ...x, avgScore: x.count ? x.score / x.count : 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
  }, [prospects])

  const activities = useMemo(() => {
    const logs = (store.logs || []).map((log) => ({
      id: log.id,
      title: log.action,
      detail: log.note,
      at: log.at,
      kind: "log" as const,
    }))
    const changes = prospects
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.stage === "new_lead" ? `New prospect added — ${p.name}` : `Prospect updated — ${p.name}`,
        detail: `${p.city || "Unassigned"} · ${stageLabels[p.stage]} · ${mad(p.valueMad)}`,
        at: p.updatedAt,
        kind: "prospect" as const,
      }))
    return [...changes, ...logs]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 5)
  }, [prospects, store.logs])

  const upcoming = useMemo(() => {
    return prospects
      .filter((p) => p.nextContactDate)
      .sort((a, b) => new Date(a.nextContactDate).getTime() - new Date(b.nextContactDate).getTime())
      .slice(0, 5)
  }, [prospects])

  const mapTotalCities = cityStats.length
  const activeCities = cityStats.filter((x) => x.count > 0).length
  const newThisMonth = prospects.filter((p) => {
    const created = new Date(p.createdAt)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length
  const marketCoverage = mapTotalCities ? Math.min(100, Math.round((activeCities / Math.max(8, mapTotalCities)) * 100)) : 0

  const activeStageTotal = stageStats.reduce((sum: number, s) => sum + s.count, 0) || 1

  return (
    <div data-prospect-command-center="true" className="min-h-screen overflow-x-hidden bg-[#050b16] text-white">
      <ProspectActionModal
        action={activeAction}
        prospects={prospects}
        store={store}
        onClose={() => setActiveAction(null)}
        onCommit={commitStore}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            [data-prospect-command-center] {
              color: #f8fafc !important;
            }
            [data-prospect-command-center] * {
              text-shadow: none;
            }
            [data-prospect-command-center] h1,
            [data-prospect-command-center] h2,
            [data-prospect-command-center] h3,
            [data-prospect-command-center] strong,
            [data-prospect-command-center] a,
            [data-prospect-command-center] button,
            [data-prospect-command-center] .force-visible {
              color: #ffffff !important;
            }
            [data-prospect-command-center] [class*="text-white"],
            [data-prospect-command-center] [class*="text-[#dbeafe]"],
            [data-prospect-command-center] [class*="text-[#dbeafe]"],
            [data-prospect-command-center] [class*="text-cyan-100"],
            [data-prospect-command-center] [class*="text-cyan-200"] {
              color: #dbeafe !important;
            }
            [data-prospect-command-center] input,
            [data-prospect-command-center] input::placeholder {
              color: #f8fafc !important;
            }
            [data-prospect-command-center] section,
            [data-prospect-command-center] aside,
            [data-prospect-command-center] header,
            [data-prospect-command-center] footer {
              opacity: 1 !important;
            }
            [data-prospect-command-center] .prospect-card,
            [data-prospect-command-center] .prospect-card * {
              color: #f8fafc !important;
              opacity: 1 !important;
            }
            [data-prospect-command-center] .prospect-secondary {
              color: #cbd5e1 !important;
            }
            [data-prospect-command-center] .prospect-shell {
              transform: translateY(0) !important;
            }
            
          `,
        }}
      />

      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_35%_0%,rgba(59,130,246,.18),transparent_32%),radial-gradient(circle_at_78%_12%,rgba(124,58,237,.18),transparent_28%),linear-gradient(180deg,#06101e_0%,#030814_62%,#020611_100%)]" />
      <div className="prospect-shell relative flex w-full max-w-none min-w-0 gap-4 px-4 py-3">
        <aside className="sticky top-0 hidden h-[calc(100vh-24px)] w-[270px] shrink-0 border-r border-[#244365] bg-[#07111f]/90 px-5 py-6 shadow-[16px_0_60px_rgba(0,0,0,.35)] backdrop-blur-xl xl:block">
          <Link href="/revenue-command-center" className="mb-7 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-500 to-orange-600 text-black shadow-lg shadow-yellow-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-black tracking-[.18em] text-white">ANGELCARE</div>
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-white">PROSPECT CENTER</div>
            </div>
          </Link>

          <NavGroup title="Command HQ">
            <NavItem href="/revenue-command-center/prospects" icon={<Radar />} label="Command Center" active />
          </NavGroup>
          <NavGroup title="Prospect Management">
            <NavItem href="/revenue-command-center/prospects" icon={<Users />} label="All Prospects" badge={String(metrics.active)} />
            <NavItem href="/revenue-command-center/prospects/directory" icon={<MapPinned />} label="Prospects Directory" active={false} />
            <NavItem href="/revenue-command-center/prospects/high-value" icon={<Flame />} label="Hot Prospects" badge={String(metrics.hot)} />
            <NavItem href="/revenue-command-center/prospects/pipeline" icon={<GitPipelineIcon />} label="Pipeline" />
            <NavItem href="/revenue-command-center/prospects/decision-map" icon={<Handshake />} label="Partner Program" />
          </NavGroup>
          <NavGroup title="Execution">
            <NavItem href="/revenue-command-center/daily-tasks" icon={<CheckCircle2 />} label="Tasks & Actions" badge={String(metrics.thisWeek)} />
            <NavItem href="/revenue-command-center/appointments" icon={<CalendarDays />} label="Calendar" />
            <NavItem href="/revenue-command-center/automation" icon={<Zap />} label="Automations" />
            <NavItem href="/revenue-command-center/campaigns" icon={<Mail />} label="Email Campaigns" />
            <NavItem href="/revenue-command-center/follow-ups" icon={<MessageCircle />} label="WhatsApp Center" />
          </NavGroup>
          <NavGroup title="Intelligence">
            <NavItem href="/revenue-command-center/market-mapping" icon={<Globe2 />} label="Market Map" />
            <NavItem href="/revenue-command-center/revenue-analytics" icon={<BarChart3 />} label="Analytics & Reports" />
            <NavItem href="/revenue-command-center/predictive" icon={<Gauge />} label="Competitors" />
            <NavItem href="/revenue-command-center/executive-briefing" icon={<ShieldCheck />} label="Market Insights" />
          </NavGroup>
          <NavGroup title="Settings">
            <NavItem href="/revenue-command-center/management" icon={<Users />} label="Team" />
            <NavItem href="/production-persistence-center" icon={<DatabaseZap />} label="Integrations" />
            <NavItem href="/revenue-command-center/settings" icon={<Settings />} label="Settings" />
          </NavGroup>

          <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-[#244365] bg-[#172942] p-4 text-xs text-[#dbeafe]">
            <div>AngelCare © 2026</div>
            <div>All rights reserved</div>
          </div>
        </aside>

        <main className="rcc-shell-main w-full max-w-none min-w-0 flex-1 min-w-0 flex-1 px-0 py-0 lg:px-0 2xl:px-0">
          <header className="mb-3 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(360px,640px)_minmax(760px,1fr)] xl:items-center">
            <div className="relative w-full max-w-[820px]">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#dbeafe]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search prospects, companies, contacts..."
                className="h-12 w-full rounded-2xl border border-[#244365] bg-[#0c1728] px-12 text-sm text-white outline-none ring-0 transition placeholder:text-white focus:border-blue-400/50 focus:bg-[#0f1d32]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-[1fr_1fr_1.2fr_auto]">
              <LivePill label="Voice Ready" value="online" tone="emerald" />
              <LivePill label="OPS Live" value="synced" tone="blue" />
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-950/30 px-4 py-2 shadow-[0_0_30px_rgba(16,185,129,.12)]">
                <div className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-300">Angelcare Ops Terminal</div>
                <div className="mt-1 truncate text-xs font-black text-emerald-100">SYSTEM READY · VOICE READY · CONNECT READY</div>
              </div>
              <LiveFrequencyGraph prospects={prospects.length} lastSync={lastSync} />
            </div>
          </header>

          <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <KpiCard icon={<Target />} label="Total Pipeline Value" value={mad(metrics.totalValue)} trend="live from prospects" tone="purple" />
            <KpiCard icon={<Users />} label="Active Prospects" value={String(metrics.active)} trend={`${metrics.hot} hot / high potential`} tone="blue" />
            <KpiCard icon={<CalendarDays />} label="Actions This Week" value={String(metrics.thisWeek)} trend="next contact schedule" tone="green" />
            <KpiCard icon={<Gauge />} label="Closing Probability" value={pct(metrics.avgProbability)} trend="weighted average" tone="amber" />
            <KpiCard icon={<BriefcaseBusiness />} label="Pending Contracts" value={String(metrics.pendingContracts)} trend="proposal + negotiation" tone="cyan" />
            <KpiCard icon={<Radar />} label="Revenue Forecast" value={mad(metrics.forecast)} trend="probability weighted" tone="rose" />
          </section>

          <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.55fr)_minmax(470px,.9fr)]">
            <Panel className="min-h-[580px]" title="Top Prospects" action={<Link href="/revenue-command-center/prospects/analytics">View all</Link>}>
              <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-[#244365] pb-2 text-sm">
                <FilterTab active={stageFilter === "all"} onClick={() => setStageFilter("all")}>All ({prospects.length})</FilterTab>
                <FilterTab active={stageFilter === "hot"} onClick={() => setStageFilter("hot")}>Hot ({metrics.hot})</FilterTab>
                <FilterTab active={stageFilter === "negotiation"} onClick={() => setStageFilter("negotiation")}>Negotiation ({prospects.filter((p) => p.stage === "negotiation").length})</FilterTab>
                <FilterTab active={stageFilter === "proposal"} onClick={() => setStageFilter("proposal")}>Proposal ({prospects.filter((p) => p.stage === "proposal").length})</FilterTab>
                <FilterTab active={stageFilter === "qualification"} onClick={() => setStageFilter("qualification")}>Qualification ({prospects.filter((p) => p.stage === "qualification").length})</FilterTab>
              </div>

              <div className="grid grid-cols-[minmax(250px,1.25fr)_minmax(170px,.7fr)_minmax(130px,.55fr)_minmax(150px,.7fr)_90px_minmax(150px,.7fr)_140px] gap-4 px-4 pb-3 text-[11px] font-bold uppercase tracking-[.12em] text-white max-xl:hidden">
                <span>Company / Sector</span><span>Decision Maker</span><span>Value</span><span>Stage</span><span>Score</span><span>Last Activity</span><span>Actions</span>
              </div>

              <div className="space-y-2">
                {topDisplayProspects.map((p, index) => (
                  <ProspectRow key={p.id} prospect={p} index={index} />
                ))}
                {!topProspects.length && (
                  <div className="rounded-3xl border border-dashed border-white/15 bg-[#172942] p-10 text-center text-white">
                    No prospects match this filter. Use Add Prospect to create the next B2B opportunity.
                  </div>
                )}
              </div>

              <Link href="/revenue-command-center/prospects/analytics" className="mt-4 block text-center text-sm font-bold text-blue-300 hover:text-blue-200">
                View all prospects
              </Link>
            </Panel>

            <MarketTerritoryMap
              cityStats={cityStats}
              mapTotalCities={mapTotalCities}
              activeCities={activeCities}
              newThisMonth={newThisMonth}
              marketCoverage={marketCoverage}
            />
          </section>

          <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(280px,.75fr)_minmax(320px,.8fr)_minmax(360px,.95fr)_minmax(320px,.85fr)_minmax(300px,.78fr)]">
            <Panel title="Pipeline Overview" action={<Link href="/revenue-command-center/prospects/pipeline">This Month</Link>}>
              <div className="space-y-3">
                {stageStats.filter((s) => s.count > 0).slice(0, 5).map((s, index) => (
                  <div key={s.stage} className="relative overflow-hidden rounded-xl bg-[#1b314e] px-4 py-3">
                    <div className="absolute inset-y-0 left-0 rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-400 opacity-80" style={{ width: `${Math.max(22, (s.count / activeStageTotal) * 100)}%`, filter: `hue-rotate(${index * 35}deg)` }} />
                    <div className="relative flex items-center justify-between text-sm font-bold">
                      <span>{stageShort[s.stage] || stageLabels[s.stage]}</span>
                      <span>{s.count}</span>
                      <span className="text-xs text-[#dbeafe]">{Math.round((s.count / activeStageTotal) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Activity Feed" action={<Link href="/revenue-command-center/prospects/analytics">View all</Link>}>
              <div className="space-y-3">
                {activities.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-2xl bg-[#172942] p-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-500/20 text-blue-300"><Activity className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{item.title}</div>
                      <div className="truncate text-xs text-[#dbeafe]">{item.detail}</div>
                    </div>
                    <div className="text-xs text-white">{daysAgo(item.at)}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Team Performance" action={<Link href="/revenue-command-center/prospects/performance">This Month</Link>}>
              <div className="space-y-4">
                {ownerStats.map((owner, index) => (
                  <div key={owner.owner} className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-sky-400 text-xs font-black text-slate-950">{initials(owner.owner)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-white">{owner.owner}</div>
                      <div className="text-xs text-[#dbeafe]">{owner.count} deals</div>
                    </div>
                    <div className="w-32">
                      <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, 42 + owner.avgScore / 1.6)}%` }} /></div>
                    </div>
                    <div className="w-16 text-right text-sm font-bold text-white">{mad(owner.value)}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Upcoming Actions" action={<Link href="/revenue-command-center/daily-tasks">View all</Link>}>
              <div className="space-y-2">
                {upcoming.map((p, index) => (
                  <Link href={`/revenue-command-center/prospects/${p.id}`} key={p.id} className="prospect-card grid grid-cols-[62px_1fr] rounded-2xl bg-[#1b314e] p-3 transition hover:bg-[#203a5a]">
                    <div className="text-sm font-semibold text-white">{index === 0 ? "Now" : `${10 + index}:30`}</div>
                    <div>
                      <div className="truncate text-sm font-bold text-white">{p.nextAction}</div>
                      <div className="truncate text-xs text-[#dbeafe]">{p.name}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>

            <Panel title="Quick Actions">
              <div className="grid grid-cols-2 gap-3">
                <QuickAction onClick={() => setActiveAction("add_prospect")} icon={<Plus />} label="Add Prospect" />
                <QuickAction onClick={() => setActiveAction("import_companies")} icon={<Import />} label="Import Companies" />
                <QuickAction onClick={() => setActiveAction("create_proposal")} icon={<FileText />} label="Create Proposal" />
                <QuickAction onClick={() => setActiveAction("send_email")} icon={<Send />} label="Send Email" />
                <QuickAction onClick={() => setActiveAction("whatsapp_blast")} icon={<MessageCircle />} label="WhatsApp Blast" />
                <QuickAction onClick={() => setActiveAction("schedule_meeting")} icon={<CalendarDays />} label="Schedule Meeting" />
                <QuickAction onClick={() => setActiveAction("create_task")} icon={<CheckCircle2 />} label="Create Task" />
                <QuickAction onClick={() => setActiveAction("generate_report")} icon={<BarChart3 />} label="Generate Report" />
              </div>
            </Panel>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
            <Panel title="Live Prospect Intelligence" action={<button onClick={refresh} className="flex items-center gap-2"><RefreshCcw className="h-4 w-4" />Refresh</button>}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <InsightCard label="Decision Makers Confirmed" value={String(prospects.filter((p) => p.decisionMakerConfirmed).length)} detail="records with validated authority" />
                <InsightCard label="Recovery Required" value={String(prospects.filter((p) => p.health === "recovery" || p.stage === "recovery").length)} detail="needs SDR rescue motion" />
                <InsightCard label="High Fit Score" value={String(prospects.filter((p) => p.fitScore >= 75).length)} detail="strong B2B service match" />
              </div>
            </Panel>
            <Panel title="Data Security & Sync">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <InsightCard label="Store" value="Live" detail={STORE_KEY} />
                <InsightCard label="Last Sync" value={lastSync ? lastSync.toLocaleTimeString() : "Now"} detail="browser + restored persistence" />
                <InsightCard label="Mode" value="Protected" detail="legacy forms preserved" />
              </div>
            </Panel>
          </section>

          <footer className="sticky bottom-0 mt-4 grid grid-cols-1 gap-3 border-t border-[#244365] bg-[#07111f]/90 p-4 backdrop-blur-xl md:grid-cols-5">
            <FooterStatus icon={<CheckCircle2 />} title="System Status" value="All Systems Operational" />
            <FooterStatus icon={<RefreshCcw />} title="Live Sync" value={lastSync ? `Last sync: ${lastSync.toLocaleTimeString()}` : "Sync active"} />
            <FooterStatus icon={<Users />} title="Active Users" value="Production workspace" />
            <FooterStatus icon={<ShieldCheck />} title="Data Security" value="Encrypted & Protected" />
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center text-xs font-black text-emerald-200">MICRO UIX ACTIVE · GAP/MAP/CONTRAST v4</div>
          </footer>
        </main>
      </div>
    </div>
  )
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mb-5"><div className="mb-2 text-[11px] font-bold uppercase tracking-[.16em] text-white">{title}</div><div className="rcc-shell-content w-full max-w-none min-w-0 space-y-1">
      
      <style jsx global>{`
        /* RCC_PARENT_SHELL_FULLWIDTH_FIX_V5 */
        .rcc-shell-main,
        .rcc-shell-content,
        .rcc-shell-content > *,
        main.rcc-shell-main > * {
          width: 100% !important;
          max-width: none !important;
          min-width: 0 !important;
        }
        [class*="revenue-command-center"] {
          max-width: none !important;
        }
      `}</style>

      {children}</div></div>
}

function NavItem({ href, icon, label, badge, active }: { href: string; icon: React.ReactNode; label: string; badge?: string; active?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition", active ? "bg-blue-600/25 text-white ring-1 ring-blue-400/20" : "text-white hover:bg-[#1a2b42] hover:text-white")}>
      <span className="grid h-5 w-5 place-items-center [&_svg]:h-5 [&_svg]:w-5">{icon}</span><span className="flex-1">{label}</span>{badge && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white">{badge}</span>}
    </Link>
  )
}

function GitPipelineIcon() { return <Layers3 className="h-5 w-5" /> }

function LivePill({ label, value, tone }: { label: string; value: string; tone: "emerald" | "blue" }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[.08em]", tone === "emerald" ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100" : "border-blue-400/25 bg-blue-500/10 text-blue-100")}>
      <span className={cn("h-2.5 w-2.5 rounded-full", tone === "emerald" ? "bg-emerald-300" : "bg-blue-300")} />
      <span>{label}</span>
      <span className="hidden text-white/70 2xl:inline">· {value}</span>
    </div>
  )
}

function LiveFrequencyGraph({ prospects, lastSync }: { prospects: number; lastSync: Date | null }) {
  const bars = Array.from({ length: 32 }, (_, index) => 18 + ((index * 13 + prospects * 7) % 34))
  const hz = (96 + (prospects % 17) * 0.7).toFixed(1)
  return (
    <div className="min-w-[240px] rounded-2xl border border-emerald-400/25 bg-[#071827] px-4 py-2 shadow-[0_0_34px_rgba(16,185,129,.12)]">
      <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-[.14em] text-emerald-200">
        <span>Live System Frequency</span><span>{hz} Hz</span>
      </div>
      <div className="flex h-8 items-end gap-1">
        {bars.map((h, i) => <span key={i} className="w-1 flex-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.7)]" style={{ height: `${h}%` }} />)}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-bold text-emerald-100"><span>{prospects} live prospects</span><span>{lastSync ? lastSync.toLocaleTimeString() : "syncing"}</span></div>
    </div>
  )
}

function HeaderIcon({ icon, badge }: { icon: React.ReactNode; badge?: string }) {
  return <button className="relative grid h-10 w-10 place-items-center rounded-xl bg-[#1b314e] text-[#dbeafe] hover:bg-white/[.08] [&_svg]:h-5 [&_svg]:w-5">{icon}{badge && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{badge}</span>}</button>
}

function KpiCard({ icon, label, value, trend, tone }: { icon: React.ReactNode; label: string; value: string; trend: string; tone: "purple" | "blue" | "green" | "amber" | "cyan" | "rose" }) {
  const tones = { purple: "from-violet-600 to-purple-500", blue: "from-sky-600 to-blue-500", green: "from-emerald-600 to-green-500", amber: "from-amber-500 to-orange-500", cyan: "from-cyan-600 to-blue-500", rose: "from-rose-600 to-red-500" }
  return <div className="rounded-2xl border border-[#244365] bg-[#10223a] p-5 shadow-[0_24px_60px_rgba(0,0,0,.25)]"><div className="flex items-center gap-4"><div className={cn("grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg [&_svg]:h-6 [&_svg]:w-6", tones[tone])}>{icon}</div><div><div className="text-[11px] font-bold uppercase tracking-[.08em] text-[#dbeafe]">{label}</div><div className="text-2xl font-black text-white">{value}</div><div className="mt-1 text-xs font-semibold text-emerald-300">↑ {trend}</div></div></div></div>
}

function Panel({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-3xl border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]", className)}><div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-lg font-black text-white">{title}</h2><div className="text-sm font-bold text-blue-300 hover:text-blue-200">{action}</div></div>{children}</section>
}

function FilterTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={cn("border-b-2 px-2 pb-2 transition", active ? "border-blue-400 text-blue-300" : "border-transparent text-[#dbeafe] hover:text-white")}>{children}</button>
}

function ProspectRow({ prospect: p, index }: { prospect: ProspectRecord; index: number }) {
  const stageTone = p.stage === "negotiation" ? "bg-violet-600" : p.stage === "proposal" ? "bg-blue-600" : p.stage === "qualification" ? "bg-amber-600" : p.stage === "closed_won" ? "bg-emerald-600" : "bg-slate-700"
  return (
    <Link href={`/revenue-command-center/prospects/${p.id}`} className="prospect-card grid gap-4 rounded-2xl border border-[#315474] bg-[#1b314e] p-4 transition hover:border-blue-400/50 hover:bg-[#203a5a] xl:grid-cols-[minmax(250px,1.25fr)_minmax(170px,.7fr)_minmax(130px,.55fr)_minmax(150px,.7fr)_90px_minmax(150px,.7fr)_140px]">
      <div className="flex items-center gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-slate-900 text-xs font-black shadow-inner">{initials(p.name)}</div><div className="min-w-0"><div className="truncate text-base font-black text-white">{p.name}</div><div className="truncate text-xs text-[#dbeafe]">{p.city || "Unassigned"}</div><span className="mt-1 inline-flex rounded-full bg-violet-500/25 px-2 py-0.5 text-[11px] font-bold text-violet-200">{p.type}</span></div></div>
      <div><div className="text-sm font-bold text-white">{p.contactName || p.decisionMaker || "N/A"}</div><div className="text-xs text-[#dbeafe]">{p.owner}</div><div className="mt-1 flex gap-2 text-[#dbeafe]"><span className="grid h-5 w-5 place-items-center rounded bg-white/10"><Users className="h-3 w-3" /></span><span className="grid h-5 w-5 place-items-center rounded bg-white/10"><Mail className="h-3 w-3" /></span></div></div>
      <div><div className="text-lg font-black text-white">{mad(p.valueMad)}</div><div className={cn("text-xs font-bold", p.valueMad >= 100000 ? "text-emerald-300" : "text-amber-300")}>{p.valueMad >= 100000 ? "High Potential" : "Medium Potential"}</div></div>
      <div><span className={cn("inline-flex rounded-lg px-3 py-1 text-xs font-black text-white", stageTone)}>{stageLabels[p.stage]}</span><div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-400" style={{ width: pct(p.probability) }} /></div><div className="mt-1 text-xs text-white">{pct(p.probability)}</div></div>
      <div><div className="text-xl font-black text-white">{Number(p.score || 0).toFixed(1)}</div><div className={cn("text-xs font-bold", p.score >= 75 ? "text-emerald-300" : p.score >= 60 ? "text-amber-300" : "text-red-300")}>{p.score >= 75 ? "High" : p.score >= 60 ? "Medium" : "Risk"}</div></div>
      <div><div className="text-xs text-[#dbeafe]">{daysAgo(p.updatedAt)}</div><div className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-300"><MessageCircle className="h-3 w-3" /> {p.nextAction ? "Action" : "Updated"}</div></div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (p.phone && typeof window !== "undefined") window.location.href = `tel:${p.phone}`
          }}
          className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300"
          aria-label="Call prospect"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (p.phone && typeof window !== "undefined") window.open(`https://wa.me/${p.phone.replace(/\D/g, "")}`, "_blank")
          }}
          className="grid h-9 w-9 place-items-center rounded-xl bg-green-500/15 text-green-300"
          aria-label="Open WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (p.email && p.email !== "N/A" && typeof window !== "undefined") window.location.href = `mailto:${p.email}`
          }}
          className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/15 text-blue-300"
          aria-label="Email prospect"
        >
          <Mail className="h-4 w-4" />
        </button>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-slate-100"><MoreHorizontal className="h-4 w-4" /></span>
      </div>
    </Link>
  )
}



function ProspectActionModal({
  action,
  prospects,
  store,
  onClose,
  onCommit,
}: {
  action: ProspectCommandAction | null
  prospects: ProspectRecord[]
  store: ProspectStore
  onClose: () => void
  onCommit: (store: ProspectStore) => void
}) {
  const [form, setForm] = useState({
    name: "",
    city: "Casablanca",
    contactName: "",
    phone: "",
    email: "",
    valueMad: "50000",
    type: "institution" as ProspectType,
    stage: "new_lead" as ProspectStage,
    selectedId: "",
    message: "",
    importText: "",
    meetingDate: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    if (action) {
      setForm((current) => ({
        ...current,
        selectedId: prospects[0]?.id || "",
        message: action === "send_email" ? "Bonjour, je vous contacte concernant une opportunité de collaboration AngelCare." : "Bonjour, AngelCare vous propose un échange rapide pour avancer sur votre besoin.",
      }))
    }
  }, [action, prospects])

  if (!action) return null

  const selected = prospects.find((prospect) => prospect.id === form.selectedId) || prospects[0]
  const title: Record<ProspectCommandAction, string> = {
    add_prospect: "Add live prospect",
    import_companies: "Import companies",
    create_proposal: "Create proposal",
    send_email: "Send email",
    whatsapp_blast: "WhatsApp blast",
    schedule_meeting: "Schedule meeting",
    create_task: "Create task",
    generate_report: "Generate report",
  }

  function close() {
    onClose()
  }

  function addLog(nextStore: ProspectStore, actionLabel: string, prospectId = selected?.id || "workspace", note = "") {
    return {
      ...nextStore,
      logs: [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          prospectId,
          at: new Date().toISOString(),
          action: actionLabel,
          note,
        },
        ...(nextStore.logs || []),
      ],
    }
  }

  function submit() {
    if (action === "add_prospect") {
      const prospect = normalizeProspect({
        name: form.name || "New AngelCare prospect",
        company: form.name || "New AngelCare prospect",
        city: form.city,
        contactName: form.contactName || "N/A",
        phone: form.phone,
        email: form.email,
        valueMad: Number(form.valueMad || 0),
        type: form.type,
        stage: form.stage,
        source: "Prospect Center Quick Add",
        updatedAt: new Date().toISOString(),
      })
      const next = addLog({ ...store, prospects: [prospect, ...store.prospects] }, "Prospect created", prospect.id, `${prospect.name} · ${mad(prospect.valueMad)}`)
      onCommit(next)
      close()
      return
    }

    if (action === "import_companies") {
      const rows = form.importText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
      const imported = rows.map((line) => {
        const [name = "Imported company", city = "Casablanca", value = "50000"] = line.split(",").map((part) => part.trim())
        return normalizeProspect({
          name,
          company: name,
          city,
          valueMad: Number(value || 50000),
          type: "institution",
          stage: "new_lead",
          source: "Bulk Import",
        })
      })
      const next = addLog({ ...store, prospects: [...imported, ...store.prospects] }, "Companies imported", imported[0]?.id || "workspace", `${imported.length} prospects`)
      onCommit(next)
      close()
      return
    }

    if (action === "create_proposal" && selected) {
      const content = `ANGELCARE PROPOSAL\n\nProspect: ${selected.name}\nCity: ${selected.city}\nValue: ${mad(selected.valueMad)}\nStage: ${stageLabels[selected.stage]}\nNext action: ${selected.nextAction}\n\nOffer:\n${selected.proposedOffer || "Strategic AngelCare B2B collaboration offer."}\n`
      downloadTextFile(`angelcare-proposal-${selected.name.replace(/\W+/g, "-").toLowerCase()}.txt`, content)
      onCommit(addLog(store, "Proposal generated", selected.id, selected.name))
      close()
      return
    }

    if (action === "generate_report") {
      const content = `ANGELCARE PROSPECT REPORT\n\nTotal prospects: ${prospects.length}\nPipeline: ${mad(prospects.reduce((sum, p) => sum + p.valueMad, 0))}\nHot prospects: ${prospects.filter((p) => p.priority === "critical" || p.priority === "high" || p.score >= 78).length}\nGenerated: ${new Date().toLocaleString()}\n`
      downloadTextFile("angelcare-prospect-report.txt", content)
      onCommit(addLog(store, "Report generated", "workspace", `${prospects.length} prospects`))
      close()
      return
    }

    if ((action === "schedule_meeting" || action === "create_task") && selected) {
      const nextProspects = prospects.map((prospect) =>
        prospect.id === selected.id
          ? { ...prospect, nextContactDate: form.meetingDate, nextAction: form.message || prospect.nextAction, updatedAt: new Date().toISOString() }
          : prospect,
      )
      onCommit(addLog({ ...store, prospects: nextProspects }, action === "schedule_meeting" ? "Meeting scheduled" : "Task created", selected.id, selected.name))
      close()
      return
    }

    if (action === "send_email" && selected?.email && typeof window !== "undefined") {
      window.location.href = `mailto:${selected.email}?subject=${encodeURIComponent("AngelCare partnership follow-up")}&body=${encodeURIComponent(form.message)}`
      onCommit(addLog(store, "Email launched", selected.id, selected.name))
      close()
      return
    }

    if (action === "whatsapp_blast" && selected?.phone && typeof window !== "undefined") {
      window.open(`https://wa.me/${selected.phone.replace(/\D/g, "")}?text=${encodeURIComponent(form.message)}`, "_blank")
      onCommit(addLog(store, "WhatsApp launched", selected.id, selected.name))
      close()
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-3xl border border-[#315474] bg-[#081525] p-6 shadow-[0_30px_90px_rgba(0,0,0,.55)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">Prospect command action</div>
            <h2 className="mt-1 text-2xl font-black text-white">{title[action]}</h2>
          </div>
          <button type="button" onClick={close} className="rounded-xl border border-[#315474] bg-[#10223a] px-4 py-2 text-sm font-black text-white">
            Close
          </button>
        </div>

        {action === "add_prospect" && (
          <div className="grid gap-3 md:grid-cols-2">
            <CommandInput label="Company / prospect" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <CommandInput label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
            <CommandInput label="Decision maker" value={form.contactName} onChange={(value) => setForm({ ...form, contactName: value })} />
            <CommandInput label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <CommandInput label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <CommandInput label="Value MAD" value={form.valueMad} onChange={(value) => setForm({ ...form, valueMad: value })} />
          </div>
        )}

        {action === "import_companies" && (
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">One company per line: name, city, valueMad</span>
            <textarea
              value={form.importText}
              onChange={(event) => setForm({ ...form, importText: event.target.value })}
              placeholder={"Crèche Exemple, Casablanca, 120000\nClinique Exemple, Rabat, 90000"}
              className="min-h-[220px] rounded-2xl border border-[#315474] bg-[#10223a] p-4 text-sm font-bold text-white outline-none placeholder:text-slate-400"
            />
          </label>
        )}

        {action !== "add_prospect" && action !== "import_companies" && action !== "generate_report" && (
          <div className="grid gap-3">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">Target prospect</span>
              <select
                value={form.selectedId}
                onChange={(event) => setForm({ ...form, selectedId: event.target.value })}
                className="rounded-2xl border border-[#315474] bg-[#10223a] p-3 text-sm font-bold text-white outline-none"
              >
                {prospects.map((prospect) => (
                  <option key={prospect.id} value={prospect.id}>
                    {prospect.name} · {prospect.city} · {mad(prospect.valueMad)}
                  </option>
                ))}
              </select>
            </label>
            {(action === "schedule_meeting" || action === "create_task") && (
              <CommandInput label="Date" value={form.meetingDate} onChange={(value) => setForm({ ...form, meetingDate: value })} />
            )}
            {(action === "send_email" || action === "whatsapp_blast" || action === "schedule_meeting" || action === "create_task") && (
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">Message / task</span>
                <textarea
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  className="min-h-[130px] rounded-2xl border border-[#315474] bg-[#10223a] p-4 text-sm font-bold text-white outline-none"
                />
              </label>
            )}
          </div>
        )}

        {action === "generate_report" && (
          <div className="rounded-2xl border border-[#315474] bg-[#10223a] p-5 text-sm font-bold text-slate-200">
            Generate a live report from the current synced prospect store.
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          className="mt-5 w-full rounded-2xl bg-emerald-500 px-5 py-4 text-base font-black text-slate-950 shadow-[0_18px_40px_rgba(16,185,129,.22)]"
        >
          Execute Action
        </button>
      </div>
    </div>
  )
}

function CommandInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[#315474] bg-[#10223a] p-3 text-sm font-bold text-white outline-none placeholder:text-slate-400"
      />
    </label>
  )
}

function MarketTerritoryMap({
  cityStats,
  mapTotalCities,
  activeCities,
  newThisMonth,
  marketCoverage,
}: {
  cityStats: Array<{ city: string; count: number; value: number }>
  mapTotalCities: number
  activeCities: number
  newThisMonth: number
  marketCoverage: number
}) {
  const [mapMode, setMapMode] = useState<"heat" | "coverage">("heat")
  const [zoom, setZoom] = useState(1)
  const [focusedCity, setFocusedCity] = useState<string | null>(null)

  const premiumCityCoordinates: Record<
    string,
    { x: number; y: number; label: string; anchor: "left" | "right" | "top" | "bottom"; priority: number }
  > = {
    casablanca: { x: 39.2, y: 46.2, label: "Casablanca", anchor: "right", priority: 1 },
    rabat: { x: 46.7, y: 34.2, label: "Rabat", anchor: "right", priority: 2 },
    temara: { x: 45.3, y: 37.3, label: "Temara", anchor: "right", priority: 3 },
    kenitra: { x: 50.5, y: 28.2, label: "Kenitra", anchor: "left", priority: 4 },
    marrakech: { x: 30.4, y: 64.2, label: "Marrakech", anchor: "right", priority: 5 },
    agadir: { x: 24.2, y: 81.7, label: "Agadir", anchor: "right", priority: 6 },
    tangier: { x: 56.7, y: 15.4, label: "Tangier", anchor: "top", priority: 7 },
    tanger: { x: 56.7, y: 15.4, label: "Tangier", anchor: "top", priority: 7 },
    fez: { x: 66.2, y: 36.4, label: "Fes", anchor: "left", priority: 8 },
    fes: { x: 66.2, y: 36.4, label: "Fes", anchor: "left", priority: 8 },
    meknes: { x: 61.4, y: 35.4, label: "Meknes", anchor: "left", priority: 9 },
    oujda: { x: 82.5, y: 34.8, label: "Oujda", anchor: "left", priority: 10 },
    tetouan: { x: 58.8, y: 19.2, label: "Tetouan", anchor: "left", priority: 11 },
  }

  const maxCount = Math.max(1, ...cityStats.map((city) => city.count))
  const visibleCities = cityStats
    .map((city) => {
      const key = getCityKey(city.city)
      const coords = premiumCityCoordinates[key]
      return coords ? { ...city, key, coords } : null
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (!a || !b) return 0
      return a.coords.priority - b.coords.priority
    })
    .slice(0, 9) as Array<{
      city: string
      count: number
      value: number
      key: string
      coords: { x: number; y: number; label: string; anchor: "left" | "right" | "top" | "bottom"; priority: number }
    }>

  function markerTone(count: number) {
    const intensity = count / maxCount
    if (intensity >= 0.58) {
      return {
        dot: "bg-rose-500 text-rose-400",
        ring: "rgba(244,63,94,.34)",
        aura: "rgba(244,63,94,.18)",
        size: 96,
      }
    }
    if (intensity >= 0.28) {
      return {
        dot: "bg-amber-400 text-amber-300",
        ring: "rgba(251,191,36,.28)",
        aura: "rgba(251,191,36,.14)",
        size: 76,
      }
    }
    return {
      dot: "bg-blue-500 text-blue-300",
      ring: "rgba(59,130,246,.24)",
      aura: "rgba(59,130,246,.12)",
      size: 58,
    }
  }

  function labelClass(anchor: "left" | "right" | "top" | "bottom") {
    if (anchor === "right") return "right-7 top-[-18px] text-right"
    if (anchor === "top") return "left-1/2 bottom-7 -translate-x-1/2 text-center"
    if (anchor === "bottom") return "left-1/2 top-7 -translate-x-1/2 text-center"
    return "left-7 top-[-18px] text-left"
  }

  return (
    <Panel
      title="Market Territory Map"
      action={
        <button
          type="button"
          onClick={() => setMapMode((current) => (current === "heat" ? "coverage" : "heat"))}
          className="rounded-xl border border-[#315474] bg-[#203a5a] px-4 py-2 text-xs font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
        >
          {mapMode === "heat" ? "Heat Map" : "Coverage"}
        </button>
      }
    >
      <div className="relative h-[520px] overflow-hidden rounded-3xl border border-[#315474] bg-[radial-gradient(circle_at_40%_46%,rgba(244,63,94,.15),transparent_14%),radial-gradient(circle_at_31%_65%,rgba(251,191,36,.13),transparent_15%),radial-gradient(circle_at_66%_35%,rgba(59,130,246,.13),transparent_18%),linear-gradient(145deg,#071426,#091426)] p-5">
        <div className="absolute left-5 top-5 z-30 grid gap-2">
          <button type="button" onClick={() => setZoom((value) => Math.min(1.18, Number((value + 0.06).toFixed(2))))} className="grid h-9 w-9 place-items-center rounded-xl border border-[#315474] bg-black/35 text-lg font-black text-white">+</button>
          <button type="button" onClick={() => setZoom((value) => Math.max(0.92, Number((value - 0.06).toFixed(2))))} className="grid h-9 w-9 place-items-center rounded-xl border border-[#315474] bg-black/35 text-lg font-black text-white">−</button>
          <button type="button" onClick={() => setFocusedCity((current) => (current ? null : visibleCities[0]?.city || null))} className="grid h-9 w-9 place-items-center rounded-xl border border-[#315474] bg-black/35 text-white">
            <Target className="h-4 w-4" />
          </button>
        </div>

        <svg viewBox="0 0 760 520" className="absolute inset-x-3 top-4 h-[430px] w-[calc(100%-1.5rem)] opacity-95 transition-transform duration-300" style={{ transform: `scale(${zoom})`, transformOrigin: "50% 50%" }}>
          <defs>
            <linearGradient id="maFillPremium" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#0b2848" />
              <stop offset="54%" stopColor="#081d35" />
              <stop offset="100%" stopColor="#061323" />
            </linearGradient>
            <filter id="maGlowPremium">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="maCoastGlow" cx="44%" cy="45%" r="58%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity=".16" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </radialGradient>
          </defs>

          <path
            d="
              M584 34
              C612 42 635 54 652 74
              L687 111
              C711 135 733 149 744 170
              L713 224
              C694 238 675 248 657 266
              L623 307
              L600 362
              L558 412
              L512 454
              L448 479
              L386 503
              L316 512
              L254 507
              L199 484
              L154 448
              L139 397
              L158 350
              L195 309
              L223 263
              L238 212
              L282 174
              L324 136
              L365 86
              L428 56
              L505 45
              Z
            "
            fill="url(#maFillPremium)"
            stroke="rgba(59,130,246,.88)"
            strokeWidth="3"
            filter="url(#maGlowPremium)"
          />

          <path d="M199 484 L158 523 L92 523 L139 397" fill="none" stroke="rgba(59,130,246,.72)" strokeWidth="3" />
          <path d="M238 212 C315 255 400 267 506 252 C589 241 659 255 713 224" stroke="rgba(96,165,250,.20)" fill="none" strokeWidth="1.35" />
          <path d="M195 309 C294 277 388 296 480 331 C537 352 575 346 623 307" stroke="rgba(96,165,250,.20)" fill="none" strokeWidth="1.35" />
          <path d="M158 350 C253 328 342 349 426 388 C490 418 535 411 558 412" stroke="rgba(96,165,250,.15)" fill="none" strokeWidth="1.15" />
          <path d="M324 136 C362 231 378 361 386 503" stroke="rgba(96,165,250,.17)" fill="none" strokeWidth="1.2" />
          <path d="M428 56 C466 176 475 319 448 479" stroke="rgba(96,165,250,.15)" fill="none" strokeWidth="1.2" />
          <path d="M505 45 C538 159 546 297 512 454" stroke="rgba(96,165,250,.13)" fill="none" strokeWidth="1.15" />
          <path d="M282 174 C357 207 435 213 523 201 C591 191 646 205 687 111" stroke="rgba(96,165,250,.13)" fill="none" strokeWidth="1.05" />
          <rect x="0" y="0" width="760" height="520" fill="url(#maCoastGlow)" opacity=".85" />
        </svg>

        {visibleCities.map((city) => {
          const tone = markerTone(city.count)
          return (
            <div
              key={city.city}
              className="absolute z-20"
              style={{ left: `${city.coords.x}%`, top: `${city.coords.y}%` }}
            >
              <span
                className="absolute left-1/2 top-1/2 rounded-full blur-xl"
                style={{
                  width: tone.size,
                  height: tone.size,
                  transform: "translate(-50%, -50%)",
                  background: tone.aura,
                }}
              />
              <span
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: tone.size * 0.72,
                  height: tone.size * 0.72,
                  transform: "translate(-50%, -50%)",
                  background: tone.ring,
                  filter: "blur(14px)",
                }}
              />
              <button
                type="button"
                onClick={() => setFocusedCity((current) => (current === city.city ? null : city.city))}
                className={cn(
                  "relative block h-5 w-5 rounded-full border-2 border-[#071426] shadow-[0_0_22px_currentColor] transition-transform",
                  focusedCity === city.city && "scale-125 ring-2 ring-white/60",
                  mapMode === "coverage" ? "bg-emerald-400 text-emerald-300" : tone.dot
                )}
                aria-label={`Focus ${city.coords.label}`}
              />
              <div className={cn("absolute whitespace-nowrap text-[12px] font-black leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.95)]", labelClass(city.coords.anchor))}>
                {city.coords.label}
                <br />
                <span className="text-cyan-100">{city.count} prospects</span>
              </div>
            </div>
          )
        })}

        <div className="absolute bottom-5 right-5 z-30 rounded-2xl border border-[#315474] bg-black/42 p-4 text-xs font-bold text-white backdrop-blur-md shadow-[0_16px_42px_rgba(0,0,0,.35)]">
          <LegendDot color="bg-rose-500" label="High Density" />
          <LegendDot color="bg-amber-400" label="Medium Density" />
          <LegendDot color="bg-blue-500" label="Low Density" />
          <LegendDot color="bg-slate-500" label="No Activity" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 divide-x divide-white/10 text-center">
        <MiniStat value={String(mapTotalCities)} label="Total Cities" />
        <MiniStat value={String(activeCities)} label="Active Cities" />
        <MiniStat value={String(newThisMonth)} label="New This Month" />
        <MiniStat value={`${marketCoverage}%`} label="Market Coverage" />
      </div>
    </Panel>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) { return <div className="mb-2 flex items-center gap-2"><span className={cn("h-3 w-3 rounded-full", color)} /> <span>{label}</span></div> }
function MiniStat({ value, label }: { value: string; label: string }) { return <div><div className="text-2xl font-black text-white">{value}</div><div className="text-xs text-[#dbeafe]">{label}</div></div> }
function QuickAction({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid min-h-[96px] place-items-center rounded-2xl border border-[#244365] bg-[#1b314e] p-3 text-center text-xs font-bold text-white transition hover:border-blue-400/40 hover:bg-blue-500/10 [&_svg]:mb-2 [&_svg]:h-8 [&_svg]:w-8 [&_svg]:text-blue-300"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
function InsightCard({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="rounded-2xl border border-[#244365] bg-[#172942] p-4"><div className="text-xs font-bold uppercase tracking-[.12em] text-white">{label}</div><div className="mt-2 text-3xl font-black text-white">{value}</div><div className="mt-1 truncate text-xs text-[#dbeafe]">{detail}</div></div> }
function FooterStatus({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) { return <div className="flex items-center justify-center gap-3 md:justify-start"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#1a2b42] text-emerald-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</div><div><div className="text-xs font-bold uppercase tracking-[.12em] text-white">{title}</div><div className="text-sm font-bold text-emerald-300">{value}</div></div></div> }