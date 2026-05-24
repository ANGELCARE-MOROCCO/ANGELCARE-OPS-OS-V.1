"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  RefreshCcw,
  ChevronRight,
  ArrowRight,
  Activity,
  Building2,
  CalendarDays,
  Crown,
  DatabaseZap,
  Download,
  Eye,
  FileText,
  Flame,
  Globe2,
  Grid3X3,
  Handshake,
  Import,
  Layers3,
  Mail,
  MapPinned,
  MessageCircle,
  Phone,
  Plus,
  Radar,
  Search,
  Settings,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react"

import {
  loadProductionProspects,
  saveProductionProspectsBulk,
} from "@/lib/revenue-command-center/production-prospect-store"

import {
  revenueAddComment,
  revenueAddDocument,
  revenueCreateTask,
  revenueScheduleAppointment,
} from "@/lib/revenue-command-center/revenue-action-engine"

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

type ProspectLog = { id: string; prospectId: string; at: string; action: string; note: string }
type ProspectStore = { prospects: ProspectRecord[]; logs?: ProspectLog[] }

const STORE_KEY = "revenue_prospects_v12_mega_store"
const SNAPSHOT_KEYS = [STORE_KEY, "revenue_command_browser_snapshots", "angelcare_global_persistence_snapshots"]

const stageLabels: Record<ProspectStage, string> = {
  new_lead: "New Lead",
  discovery: "Discovery",
  qualification: "Qualified",
  decision_map: "Decision Map",
  appointment_ready: "Appointment Ready",
  proposal: "Proposal Sent",
  negotiation: "Negotiation",
  contracting: "Contracting",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
  recovery: "Recovery",
}

const cityImages: Record<string, string> = {
  casablanca: "linear-gradient(135deg,#f59e0b44,#2563eb44), radial-gradient(circle at 30% 30%,#fff4,transparent 25%)",
  rabat: "linear-gradient(135deg,#38bdf844,#1d4ed844), radial-gradient(circle at 60% 35%,#fff4,transparent 24%)",
  marrakech: "linear-gradient(135deg,#f9731644,#7c2d1244), radial-gradient(circle at 40% 40%,#fff4,transparent 22%)",
  tangier: "linear-gradient(135deg,#06b6d444,#0f766e44), radial-gradient(circle at 45% 30%,#fff4,transparent 22%)",
  tanger: "linear-gradient(135deg,#06b6d444,#0f766e44), radial-gradient(circle at 45% 30%,#fff4,transparent 22%)",
  fez: "linear-gradient(135deg,#a855f744,#1d4ed844), radial-gradient(circle at 50% 30%,#fff4,transparent 22%)",
  fes: "linear-gradient(135deg,#a855f744,#1d4ed844), radial-gradient(circle at 50% 30%,#fff4,transparent 22%)",
  agadir: "linear-gradient(135deg,#14b8a644,#0284c744), radial-gradient(circle at 35% 30%,#fff4,transparent 22%)",
  kenitra: "linear-gradient(135deg,#22c55e44,#2563eb44), radial-gradient(circle at 45% 35%,#fff4,transparent 22%)",
  temara: "linear-gradient(135deg,#22c55e44,#7c3aed44), radial-gradient(circle at 45% 35%,#fff4,transparent 22%)",
}

const mapCoords: Record<string, { x: number; y: number; label: string }> = {
  casablanca: { x: 37, y: 47, label: "Casablanca" },
  rabat: { x: 46, y: 34, label: "Rabat" },
  kenitra: { x: 51, y: 28, label: "Kenitra" },
  temara: { x: 44, y: 37, label: "Temara" },
  marrakech: { x: 30, y: 66, label: "Marrakech" },
  agadir: { x: 23, y: 82, label: "Agadir" },
  tangier: { x: 58, y: 16, label: "Tanger" },
  tanger: { x: 58, y: 16, label: "Tanger" },
  fez: { x: 67, y: 36, label: "Fes" },
  fes: { x: 67, y: 36, label: "Fes" },
}

function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ")
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null
  try { return JSON.parse(value) as T } catch { return null }
}

function normalizeProspect(raw: Partial<ProspectRecord> & { value?: number; valueMad?: number }): ProspectRecord {
  const now = new Date().toISOString()
  return {
    id: String(raw.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    name: String(raw.name || raw.company || "Unnamed prospect"),
    company: String(raw.company || raw.name || ""),
    contactName: String(raw.contactName || raw.decisionMaker || "N/A"),
    phone: String(raw.phone || ""),
    email: String(raw.email || ""),
    city: String(raw.city || "Unassigned"),
    source: String(raw.source || "Manual"),
    type: (raw.type || "institution") as ProspectType,
    owner: String(raw.owner || "BD Officer"),
    closer: String(raw.closer || "Revenue Manager"),
    stage: (raw.stage || "new_lead") as ProspectStage,
    priority: (raw.priority || "high") as ProspectPriority,
    health: (raw.health || "on_track") as ProspectHealth,
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
    documents: Array.isArray(raw.documents) ? raw.documents.map(String) : [],
    createdAt: String(raw.createdAt || now),
    updatedAt: String(raw.updatedAt || now),
  }
}

function loadProspectStore(): ProspectStore {
  if (typeof window === "undefined") return { prospects: [] }

  const direct = safeParse<ProspectStore>(localStorage.getItem(STORE_KEY))
  if (direct?.prospects?.length) return { ...direct, prospects: direct.prospects.map(normalizeProspect) }

  for (const key of SNAPSHOT_KEYS) {
    const payload = safeParse<Record<string, unknown>>(localStorage.getItem(key))
    const candidate = payload?.[STORE_KEY]
    if (typeof candidate === "string") {
      const recovered = safeParse<ProspectStore>(candidate)
      if (recovered?.prospects?.length) {
        localStorage.setItem(STORE_KEY, JSON.stringify(recovered))
        return { ...recovered, prospects: recovered.prospects.map(normalizeProspect) }
      }
    }
    if (candidate && typeof candidate === "object") {
      const recovered = candidate as ProspectStore
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

function mad(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 1 : 2)}M MAD`
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1000)}K MAD`
  return `${Math.round(value || 0)} MAD`
}

function pct(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value || 0)))}%`
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "AC"
}

function getCityKey(city: string) {
  return city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

function daysAgo(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "recently"
  const diff = Math.max(0, Date.now() - date.getTime())
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "now"
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function todayPlus(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function buildRecommendedOffer(type: ProspectType, valueMad: number, fitScore: number) {
  const intensity = valueMad >= 150000 || fitScore >= 82 ? "Premium Domination" : valueMad >= 80000 ? "Growth Acceleration" : "Starter Activation"
  const map: Record<ProspectType, string> = {
    family: `${intensity} · Family acquisition + care follow-up`,
    clinic: `${intensity} · Clinic partnership + referral engine`,
    corporate: `${intensity} · Corporate care partnership`,
    academy: `${intensity} · Training + academy B2B package`,
    partner: `${intensity} · Strategic partnership + co-selling`,
    institution: `${intensity} · Kindergarten/preschool operating solution`,
    website: `${intensity} · Digital inbound conversion package`,
    campaign: `${intensity} · Campaign conversion package`,
  }
  return map[type] || map.institution
}

function buildNextAction(stage: ProspectStage, confirmed: boolean, decisionMaker: string) {
  if (!confirmed) return "Identify decision maker and validate authority within 24h."
  if (stage === "proposal") return `Send customized AngelCare proposal to ${decisionMaker || "decision maker"}.`
  if (stage === "negotiation") return "Prepare objection handling and close negotiation terms."
  if (stage === "appointment_ready") return "Schedule executive discovery appointment."
  return "Run full qualification call and map budget, need, timeline, and authority."
}

function computeIntakeScore(form: {
  valueMad: string
  fitScore: string
  probability: string
  urgency: string
  decisionMakerConfirmed: boolean
}) {
  const value = Number(form.valueMad || 0)
  const fit = Number(form.fitScore || 0)
  const probability = Number(form.probability || 0)
  const urgency = Number(form.urgency || 0)
  return Math.max(0, Math.min(100, Math.round((fit * 0.42) + (probability * 0.32) + (urgency * 0.18) + (form.decisionMakerConfirmed ? 5 : 0) + (value >= 150000 ? 6 : value >= 80000 ? 3 : 1))))
}


export default function ProspectsDirectoryCommandCenter() {
  const [store, setStore] = useState<ProspectStore>({ prospects: [] })
  const [selectedCity, setSelectedCity] = useState("casablanca")
  const [filter, setFilter] = useState<"all" | "high" | "negotiation" | "proposal" | "qualified" | "not_contacted">("all")
  const [sector, setSector] = useState("all")
  const [sort, setSort] = useState("potential")
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"cards" | "list">("cards")
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showStrategy, setShowStrategy] = useState(false)
  const [mapMode, setMapMode] = useState<"domination" | "coverage">("domination")
  const [mapZoom, setMapZoom] = useState(1)

  async function refresh() {
    try {
      const productionProspects = await loadProductionProspects<ProspectRecord>()
      if (productionProspects.length) {
        setStore({ prospects: productionProspects.map(normalizeProspect) })
        setLastSync(new Date())
        return
      }
    } catch (error) {
      console.warn("Production prospect store unavailable, using browser recovery fallback", error)
    }

    setStore(loadProspectStore())
    setLastSync(new Date())
  }

  function commitStore(next: ProspectStore) {
    saveProspectStore(next)
    void saveProductionProspectsBulk(next.prospects)
    setStore(next)
    setLastSync(new Date())
  }

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => void refresh(), 6000)
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key.includes("revenue") || event.key.includes("prospects")) void refresh()
    }
    window.addEventListener("storage", onStorage)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const prospects = store.prospects

  const cityStats = useMemo(() => {
    const byCity = new Map<string, { key: string; city: string; count: number; value: number; high: number; negotiation: number; closed: number }>()
    prospects.forEach((p) => {
      const key = getCityKey(p.city || "Unassigned")
      const existing = byCity.get(key) || { key, city: p.city || "Unassigned", count: 0, value: 0, high: 0, negotiation: 0, closed: 0 }
      existing.count += 1
      existing.value += Number(p.valueMad) || 0
      if (p.priority === "critical" || p.priority === "high" || p.score >= 78) existing.high += 1
      if (p.stage === "negotiation") existing.negotiation += 1
      if (p.stage === "closed_won") existing.closed += 1
      byCity.set(key, existing)
    })
    return Array.from(byCity.values()).sort((a, b) => b.count - a.count)
  }, [prospects])

  useEffect(() => {
    if (cityStats.length && !cityStats.some((c) => c.key === selectedCity)) setSelectedCity(cityStats[0].key)
  }, [cityStats, selectedCity])

  const selectedCityStats = cityStats.find((c) => c.key === selectedCity) || cityStats[0] || { key: "casablanca", city: "Casablanca", count: 0, value: 0, high: 0, negotiation: 0, closed: 0 }
  const cityProspects = prospects.filter((p) => getCityKey(p.city) === selectedCityStats.key)
  const selectedMarketShare = prospects.length ? Math.round((selectedCityStats.count / prospects.length) * 100) : 0

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cityProspects
      .filter((p) => {
        if (filter === "high") return p.priority === "critical" || p.priority === "high" || p.score >= 78
        if (filter === "negotiation") return p.stage === "negotiation"
        if (filter === "proposal") return p.stage === "proposal"
        if (filter === "qualified") return p.stage === "qualification"
        if (filter === "not_contacted") return !p.phone && !p.email
        return true
      })
      .filter((p) => (sector === "all" ? true : p.type === sector))
      .filter((p) => {
        if (!q) return true
        return [p.name, p.company, p.contactName, p.owner, p.city, p.stage, p.type].join(" ").toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (sort === "value") return b.valueMad - a.valueMad
        if (sort === "score") return b.score - a.score
        if (sort === "activity") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        return b.score + b.valueMad / 100000 - (a.score + a.valueMad / 100000)
      })
  }, [cityProspects, filter, sector, sort, query])

  const totals = useMemo(() => {
    const high = prospects.filter((p) => p.priority === "critical" || p.priority === "high" || p.score >= 78).length
    const totalValue = prospects.reduce((sum, p) => sum + p.valueMad, 0)
    const domination = prospects.length ? Math.round((high / prospects.length) * 100) : 0
    return { high, totalValue, domination }
  }, [prospects])

  const dataQuality = useMemo(() => {
    const withPhone = prospects.filter((p) => Boolean(p.phone)).length
    const withEmail = prospects.filter((p) => Boolean(p.email)).length
    const withDecisionMaker = prospects.filter((p) => p.decisionMakerConfirmed || (p.contactName && p.contactName !== "N/A")).length
    const withValue = prospects.filter((p) => Number(p.valueMad) > 0).length
    const completeness = prospects.length
      ? Math.round(((withPhone + withEmail + withDecisionMaker + withValue) / (prospects.length * 4)) * 100)
      : 0
    return { withPhone, withEmail, withDecisionMaker, withValue, completeness }
  }, [prospects])

  const realSyncStatus = prospects.length > 0 ? "Live synced from prospect store" : "No prospect records detected"

  async function addProspect(payload: Partial<ProspectRecord>) {
    const decisionConfirmed = Boolean(payload.decisionMakerConfirmed || payload.contactName)
    const valueMad = Number(payload.valueMad || 50000)
    const urgency = Number(payload.urgency || 55)
    const fitScore = Number(payload.fitScore || 70)
    const probability = Number(payload.probability || (decisionConfirmed ? 62 : 48))
    const score = Number(payload.score || Math.round((fitScore * 0.42) + (probability * 0.32) + (urgency * 0.18) + (valueMad >= 100000 ? 8 : 4)))
    const priority = (payload.priority || (score >= 82 ? "critical" : score >= 72 ? "high" : score >= 58 ? "medium" : "low")) as ProspectPriority
    const stage = (payload.stage || (decisionConfirmed ? "qualification" : "new_lead")) as ProspectStage
    const proposedOffer = payload.proposedOffer || buildRecommendedOffer(payload.type || "institution", valueMad, fitScore)
    const nextAction = payload.nextAction || buildNextAction(stage, decisionConfirmed, payload.contactName || payload.decisionMaker || "")

    const prospect = normalizeProspect({
      ...payload,
      city: payload.city || selectedCityStats.city,
      source: payload.source || "Prospects Directory",
      stage,
      priority,
      type: payload.type || "institution",
      health: payload.health || "on_track",
      valueMad,
      score,
      probability,
      urgency,
      fitScore,
      decisionMakerConfirmed: decisionConfirmed,
      proposedOffer,
      nextAction,
      nextContactDate: payload.nextContactDate || todayPlus(1),
      documents: payload.documents?.length ? payload.documents : ["Qualification brief", "AngelCare B2B offer", "City domination notes"],
    })

    commitStore({
      ...store,
      prospects: [prospect, ...store.prospects],
      logs: [{ id: `${Date.now()}`, prospectId: prospect.id, at: new Date().toISOString(), action: "Enterprise prospect created", note: `${prospect.name} · ${prospect.city} · ${stageLabels[prospect.stage]}` }, ...(store.logs || [])],
    })

    try {
      await revenueAddComment({
        entityId: prospect.id,
        author: prospect.owner || "AngelCare",
        channel: "enterprise-intake",
        note: `Enterprise prospect created from Prospects Directory. Offer: ${prospect.proposedOffer}. Next action: ${prospect.nextAction}`,
      })
      await revenueCreateTask({
        entityId: prospect.id,
        title: prospect.nextAction,
        description: `Initial enterprise follow-up for ${prospect.name}. Pain points: ${prospect.painPoints || "To validate"}. Objection: ${prospect.objection || "None logged"}.`,
        priority: prospect.priority === "critical" ? "critical" : prospect.priority === "high" ? "high" : "medium",
        owner: prospect.owner || "BD Officer",
        dueDate: prospect.nextContactDate,
      })
    } catch (error) {
      console.warn("Enterprise prospect saved locally only", error)
    }
  }


  async function importCompanies(text: string) {
    const rows = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

    const imported = rows.map((line) => {
      const [name = "Imported prospect", city = selectedCityStats.city, value = "50000", contactName = "N/A", phone = "", email = ""] = line.split(",").map((part) => part.trim())
      return normalizeProspect({
        name,
        company: name,
        city,
        contactName,
        phone,
        email,
        valueMad: Number(value || 50000),
        type: "institution",
        stage: "new_lead",
        source: "Directory Bulk Import",
      })
    })

    if (!imported.length) return

    commitStore({
      ...store,
      prospects: [...imported, ...store.prospects],
      logs: [
        {
          id: `${Date.now()}`,
          prospectId: imported[0].id,
          at: new Date().toISOString(),
          action: "Directory companies imported",
          note: `${imported.length} records`,
        },
        ...(store.logs || []),
      ],
    })

    try {
      await Promise.all(
        imported.slice(0, 20).map((prospect) =>
          revenueAddComment({
            entityId: prospect.id,
            author: prospect.owner || "AngelCare",
            channel: "directory-import",
            note: "Prospect imported from city directory bulk import",
          }),
        ),
      )
    } catch (error) {
      console.warn("Imported prospects saved locally only", error)
    }
  }

  async function exportCityReport() {
    const rows = filtered.map((p) => `${p.name},${p.city},${p.contactName},${p.phone},${p.email},${p.stage},${p.score},${p.valueMad}`).join("\n")
    const content = `name,city,decision_maker,phone,email,stage,score,valueMad\n${rows}`
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `angelcare-${selectedCityStats.key}-prospects.csv`
    a.click()
    URL.revokeObjectURL(url)

    try {
      await revenueAddDocument({
        entityId: `city:${selectedCityStats.key}`,
        title: `AngelCare ${selectedCityStats.city} prospects report.csv`,
        documentType: "city-report",
      })
    } catch (error) {
      console.warn("City report metadata saved locally only", error)
    }
  }

  async function exportNationalReport() {
    const byCity = cityStats.map((city) => `${city.city},${city.count},${city.high},${city.negotiation},${city.closed},${city.value}`).join("\n")
    const content = `city,totalProspects,highPotential,inNegotiation,closedDeals,pipelineValue\n${byCity}`
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "angelcare-national-prospects-directory.csv"
    a.click()
    URL.revokeObjectURL(url)

    try {
      await revenueAddDocument({
        entityId: "national-directory",
        title: "AngelCare national prospects directory.csv",
        documentType: "national-report",
      })
    } catch (error) {
      console.warn("National report metadata saved locally only", error)
    }
  }

  async function launchCityCampaign() {
    const selectedIds = cityProspects.map((prospect) => prospect.id)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("angelcare_campaign_city", selectedCityStats.city)
      sessionStorage.setItem("angelcare_campaign_prospect_ids", JSON.stringify(selectedIds))
      try {
        await Promise.all(
          cityProspects.slice(0, 20).map((prospect) =>
            revenueAddComment({
              entityId: prospect.id,
              author: prospect.owner || "AngelCare",
              channel: "campaign",
              note: `City campaign prepared for ${selectedCityStats.city}`,
            }),
          ),
        )
      } catch (error) {
        console.warn("Campaign context saved locally only", error)
      }
      window.location.href = "/revenue-command-center/campaigns"
    }
  }

  async function scheduleCityMeeting() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("angelcare_appointment_city", selectedCityStats.city)
      try {
        const appointmentAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        await Promise.all(
          cityProspects.slice(0, 10).map((prospect) =>
            revenueScheduleAppointment({
              entityId: prospect.id,
              title: `Follow-up meeting for ${prospect.name} · ${selectedCityStats.city}`,
              appointmentAt,
              owner: prospect.owner || "BD Officer",
              notes: "Scheduled from Prospects Directory quick action",
            }),
          ),
        )
      } catch (error) {
        console.warn("City appointments saved locally only", error)
      }
      window.location.href = "/revenue-command-center/appointments"
    }
  }

  function rotateCity(direction: 1 | -1) {
    if (!cityStats.length) return
    const currentIndex = cityStats.findIndex((city) => city.key === selectedCityStats.key)
    const nextIndex = (currentIndex + direction + cityStats.length) % cityStats.length
    setSelectedCity(cityStats[nextIndex].key)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050b16] text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_0%,rgba(59,130,246,.18),transparent_28%),radial-gradient(circle_at_84%_10%,rgba(124,58,237,.16),transparent_32%),linear-gradient(180deg,#07111f_0%,#030814_70%,#020611_100%)]" />

      {showAdd && <AddProspectModal city={selectedCityStats.city} onClose={() => setShowAdd(false)} onSubmit={(payload) => { addProspect(payload); setShowAdd(false) }} />}
      {showImport && <ImportCompaniesModal onClose={() => setShowImport(false)} onSubmit={(text) => { importCompanies(text); setShowImport(false) }} />}
      {showStrategy && <StrategyModal city={selectedCityStats} marketShare={selectedMarketShare} onClose={() => setShowStrategy(false)} onExport={exportCityReport} onCampaign={launchCityCampaign} />}

      <main className="relative flex w-full min-w-0 max-w-none items-start gap-4 px-4 py-4">

        <aside className="sticky top-4 flex h-[calc(100vh-32px)] w-[270px] min-w-[270px] max-w-[270px] shrink-0 flex-col rounded-[24px] border border-[#244365] bg-[#07111f]/95 px-5 py-6 shadow-[16px_0_60px_rgba(0,0,0,.35)] backdrop-blur-xl">
          <Link href="/revenue-command-center" className="mb-7 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-500 to-orange-600 text-black shadow-lg shadow-yellow-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-black tracking-[.18em] text-white">ANGELCARE</div>
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-white">PROSPECT CENTER</div>
            </div>
          </Link>

          <div className="space-y-1">
            <DirectoryNavItem href="/revenue-command-center" icon={<Radar />} label="Command Center" />
            <DirectoryNavItem href="/revenue-command-center/prospects/directory" icon={<MapPinned />} label="Prospects Directory" badge={String(prospects.length)} active />
            <DirectoryNavItem href="/revenue-command-center/partnerships" icon={<Handshake />} label="Partner Program" />
            <DirectoryNavItem href="/revenue-command-center/daily-tasks" icon={<ShieldCheck />} label="Tasks & Actions" badge={String(selectedCityStats.count)} />
            <DirectoryNavItem href="/revenue-command-center/appointments" icon={<CalendarDays />} label="Calendar" />
            <DirectoryNavItem href="/revenue-command-center/campaigns" icon={<Mail />} label="Email Campaigns" />
            <DirectoryNavItem href="/revenue-command-center/follow-ups" icon={<MessageCircle />} label="WhatsApp Center" />
            <DirectoryNavItem href="/revenue-command-center/market-mapping" icon={<Globe2 />} label="Market Map" />
            <DirectoryNavItem href="/revenue-command-center/revenue-analytics" icon={<BarChart3 />} label="Analytics and Reports" />
            <DirectoryNavItem href="/revenue-command-center/executive-briefing" icon={<FileText />} label="Market Insights" />
          </div>
        </aside>

        <div className="min-w-0 flex-1 basis-0">
        <header className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-2xl font-black uppercase tracking-[.08em] text-white">Prospects Directory</div>
            <div className="text-sm font-semibold text-[#cbd5e1]">Explore prospects by cities and execute AngelCare domination strategy</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(124,58,237,.24)]"><Plus className="h-4 w-4" />Add Prospect</button>
            <button onClick={launchCityCampaign} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,.22)]"><Send className="h-4 w-4" />Launch Campaign</button>
            <button onClick={refresh} className="inline-flex items-center gap-2 rounded-xl border border-[#244365] bg-[#10223a] px-4 py-3 text-sm font-black text-white"><RefreshCcw className="h-4 w-4" />Refresh</button>
          </div>
        </header>

        <section className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr]">
          <CommandNavButton href="/revenue-command-center/prospects" icon={<Radar />} label="Command Center" detail="Main revenue view" />
          <CommandNavButton href="/revenue-command-center/prospects/directory" icon={<MapPinned />} label="Directory" detail={`${cityStats.length} active cities`} active />
          <CommandNavButton href="/revenue-command-center/prospects/pipeline" icon={<Layers3 />} label="Pipeline" detail={`${mad(totals.totalValue)} weighted`} />
          <CommandNavButton href="/revenue-command-center/appointments" icon={<CalendarDays />} label="Appointments" detail={`${selectedCityStats.city} schedule`} />
          <CommandNavButton href="/production-persistence-center" icon={<DatabaseZap />} label="Persistence" detail={lastSync ? lastSync.toLocaleTimeString() : "syncing"} />
        </section>

        <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr]">
          <LiveSyncTile icon={<DatabaseZap />} label="Source of Truth" value={STORE_KEY} detail={realSyncStatus} />
          <LiveSyncTile icon={<ShieldCheck />} label="Data Completeness" value={`${dataQuality.completeness}%`} detail={`${dataQuality.withDecisionMaker} decision-makers · ${dataQuality.withPhone} phones`} />
          <LiveSyncTile icon={<Activity />} label="Refresh Cycle" value="6 sec" detail={lastSync ? `Last sync ${lastSync.toLocaleTimeString()}` : "waiting for sync"} />
          <LiveSyncTile icon={<Target />} label="Selected City Scope" value={selectedCityStats.city} detail={`${selectedCityStats.count} records · ${mad(selectedCityStats.value)}`} />
        </section>

        <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_1.75fr]">
          <Metric icon={<Layers3 />} label="Total Cities" value={String(cityStats.length)} detail="from live store" tone="purple" />
          <Metric icon={<Users />} label="Total Prospects" value={String(prospects.length)} detail={realSyncStatus} tone="blue" />
          <Metric icon={<Zap />} label="High Potential" value={String(totals.high)} detail={`${prospects.length ? Math.round((totals.high / prospects.length) * 100) : 0}% of Total`} tone="green" />
          <Metric icon={<Target />} label="Pipeline Value" value={mad(totals.totalValue)} detail="sum of live values" tone="amber" />
          <Metric icon={<Trophy />} label="Domination Score" value={`${totals.domination}%`} detail="calculated live" tone="rose" />
          <Link href="/revenue-command-center/revenue-analytics" className="flex items-center gap-4 rounded-2xl border border-[#244365] bg-[#10223a] p-5 shadow-[0_20px_50px_rgba(0,0,0,.25)]">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-700 to-blue-600 text-white"><BarChart3 className="h-6 w-6" /></div>
            <div><div className="text-sm font-black text-white">View Analytics</div><div className="text-xs font-bold text-[#cbd5e1]">Detailed Insights</div></div>
          </Link>
        </section>

        <section className="mb-4 rounded-2xl border border-[#244365] bg-[#0e1e34] p-4 shadow-[0_20px_60px_rgba(0,0,0,.25)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[.14em] text-white">Select City to Explore</h2>
            <div className="flex gap-2">
              <button onClick={() => rotateCity(-1)} className="rounded-xl border border-[#244365] bg-[#172942] px-3 py-2 text-xs font-black text-white">‹</button>
              <button onClick={() => rotateCity(1)} className="rounded-xl border border-[#244365] bg-[#172942] px-3 py-2 text-xs font-black text-white">›</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
            {cityStats.slice(0, 7).map((city) => (
              <button key={city.key} onClick={() => setSelectedCity(city.key)} className={cn("group overflow-hidden rounded-xl border bg-[#10223a] text-left transition", selectedCityStats.key === city.key ? "border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,.45),0_18px_42px_rgba(59,130,246,.18)]" : "border-[#244365] hover:border-blue-400/50")}>
                <div className="h-16 bg-cover bg-center opacity-90 transition group-hover:opacity-100" style={{ background: cityImages[city.key] || cityImages.casablanca }} />
                <div className="p-3">
                  <div className="font-black text-white">{city.city}</div>
                  <div className="text-xs font-bold text-[#cbd5e1]">{city.count} Prospects</div>
                  <div className="mt-1 flex items-center gap-1 text-xs font-black text-amber-300"><Trophy className="h-3 w-3" />{prospects.length ? Math.round((city.count / prospects.length) * 100) : 0}% Market Share</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.55fr)_minmax(460px,.75fr)]">
          <div className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
            <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(260px,1fr)_repeat(5,minmax(110px,.35fr))_180px] xl:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-white">{selectedCityStats.city}</h1>
                  <span className="rounded-lg bg-violet-600/60 px-3 py-1 text-xs font-black uppercase text-violet-100">{selectedCityStats.count === Math.max(...cityStats.map(c => c.count), 0) ? "Primary Target City" : "Growth City"}</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-[#cbd5e1]">Live city opportunity from restored/synced prospect records</div>
              </div>
              <CityStat value={String(selectedCityStats.count)} label="Total Prospects" />
              <CityStat value={String(selectedCityStats.high)} label="High Potential" />
              <CityStat value={String(selectedCityStats.negotiation)} label="In Negotiation" />
              <CityStat value={String(selectedCityStats.closed)} label="Closed Deals" />
              <CityStat value={`${selectedMarketShare}%`} label="Market Share" />
              <button onClick={() => setShowStrategy(true)} className="rounded-2xl bg-violet-700/70 px-4 py-4 text-sm font-black text-white"><Sparkles className="mr-2 inline h-4 w-4" />City Intelligence</button>
            </div>

            <div className="mb-4 flex flex-col gap-3 border-y border-[#244365] py-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2 text-sm">
                <Tab active={filter === "all"} onClick={() => setFilter("all")}>All Prospects ({cityProspects.length})</Tab>
                <Tab active={filter === "high"} onClick={() => setFilter("high")}>High Potential ({selectedCityStats.high})</Tab>
                <Tab active={filter === "negotiation"} onClick={() => setFilter("negotiation")}>In Negotiation ({selectedCityStats.negotiation})</Tab>
                <Tab active={filter === "proposal"} onClick={() => setFilter("proposal")}>Proposal Sent ({cityProspects.filter(p => p.stage === "proposal").length})</Tab>
                <Tab active={filter === "qualified"} onClick={() => setFilter("qualified")}>Qualified ({cityProspects.filter(p => p.stage === "qualification").length})</Tab>
                <Tab active={filter === "not_contacted"} onClick={() => setFilter("not_contacted")}>Not Contacted ({cityProspects.filter(p => !p.phone && !p.email).length})</Tab>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search city..." className="h-10 rounded-xl border border-[#244365] bg-[#081525] pl-9 pr-3 text-xs font-bold text-white outline-none" />
                </div>
                <select value={sector} onChange={(e) => setSector(e.target.value)} className="h-10 rounded-xl border border-[#244365] bg-[#081525] px-3 text-xs font-bold text-white outline-none">
                  <option value="all">All Sectors</option><option value="clinic">Clinic</option><option value="academy">Academy</option><option value="institution">Institution</option><option value="corporate">Corporate</option><option value="partner">Partner</option>
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 rounded-xl border border-[#244365] bg-[#081525] px-3 text-xs font-bold text-white outline-none">
                  <option value="potential">Sort by: Potential</option><option value="value">Sort by: Value</option><option value="score">Sort by: Score</option><option value="activity">Sort by: Activity</option>
                </select>
                <button onClick={() => setView("cards")} className={cn("grid h-10 w-10 place-items-center rounded-xl border border-[#244365]", view === "cards" ? "bg-violet-600" : "bg-[#081525]")}><Grid3X3 className="h-4 w-4" /></button>
                <button onClick={() => setView("list")} className={cn("grid h-10 w-10 place-items-center rounded-xl border border-[#244365]", view === "list" ? "bg-violet-600" : "bg-[#081525]")}><Layers3 className="h-4 w-4" /></button>
              </div>
            </div>

            <div className={cn(view === "cards" ? "grid grid-cols-1 gap-4 xl:grid-cols-2 3xl:grid-cols-3" : "space-y-3")}>
              {filtered.slice(0, 12).map((prospect) => <ProspectCityCard key={prospect.id} prospect={prospect} compact={view === "list"} />)}
              {!filtered.length && <div className="col-span-full rounded-2xl border border-dashed border-[#315474] bg-[#10223a] p-10 text-center font-bold text-white">No prospects found for this city/filter.</div>}
            </div>

            <div className="mt-5 flex flex-col gap-3 text-sm font-bold text-[#cbd5e1] md:flex-row md:items-center md:justify-between">
              <span>Showing {Math.min(12, filtered.length)} of {filtered.length} real synced prospects in {selectedCityStats.city}</span>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setSort("potential")} className="rounded-lg border border-[#244365] bg-[#081525] px-3 py-2 text-white">Best Potential</button>
                <button onClick={() => setFilter("high")} className="rounded-lg border border-[#244365] bg-[#081525] px-3 py-2 text-white">High Fit</button>
                <button onClick={() => setSort("activity")} className="rounded-lg border border-[#244365] bg-[#081525] px-3 py-2 text-white">Latest Activity</button>
                <button onClick={() => setView(view === "cards" ? "list" : "cards")} className="rounded-lg border border-violet-500/50 bg-violet-700 px-3 py-2 text-white">{view === "cards" ? "Switch to List" : "Switch to Cards"}</button>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <CityDominationMap
              cityStats={cityStats}
              selectedCity={selectedCityStats.key}
              onSelect={setSelectedCity}
              prospectsTotal={prospects.length}
              mapMode={mapMode}
              setMapMode={setMapMode}
              mapZoom={mapZoom}
              setMapZoom={setMapZoom}
            />
            <CityStrategyPanel city={selectedCityStats} marketShare={selectedMarketShare} onOpen={() => setShowStrategy(true)} />
            <QuickActions onAdd={() => setShowAdd(true)} onImport={() => setShowImport(true)} onExport={exportCityReport} onNationalExport={exportNationalReport} onCampaign={launchCityCampaign} onSchedule={scheduleCityMeeting} />
          </aside>
        </section>

        <footer className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-[#244365] bg-[#07111f]/90 p-4 md:grid-cols-4">
          <FooterStatus icon={<ShieldCheck />} title="System Status" value="Directory Operational" />
          <FooterStatus icon={<DatabaseZap />} title="Live Sync" value={lastSync ? lastSync.toLocaleTimeString() : "Syncing"} />
          <FooterStatus icon={<Users />} title="Active Prospects" value={`${prospects.length} synced`} />
          <FooterStatus icon={<Target />} title="Selected City" value={selectedCityStats.city} />
        </footer>
        </div>
      </main>
    </div>
  )
}




function LiveSyncTile({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#244365] bg-[#07111f]/95 p-4 shadow-[0_18px_45px_rgba(0,0,0,.20)]">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#94a3b8]">{label}</div>
        <div className="truncate text-sm font-black text-white">{value}</div>
        <div className="truncate text-xs font-bold text-[#cbd5e1]">{detail}</div>
      </div>
    </div>
  )
}

function CommandNavButton({ href, icon, label, detail, active }: { href: string; icon: React.ReactNode; label: string; detail: string; active?: boolean }) {
  return (
    <Link href={href} className={cn("group flex items-center gap-3 rounded-2xl border p-4 transition", active ? "border-violet-400/50 bg-violet-600/20" : "border-[#244365] bg-[#10223a] hover:border-blue-400/50 hover:bg-[#172942]")}>
      <div className={cn("grid h-11 w-11 place-items-center rounded-2xl text-white [&_svg]:h-5 [&_svg]:w-5", active ? "bg-violet-600" : "bg-blue-600/40 group-hover:bg-blue-600")}>{icon}</div>
      <div className="min-w-0">
        <div className="truncate text-sm font-black text-white">{label}</div>
        <div className="truncate text-xs font-bold text-[#cbd5e1]">{detail}</div>
      </div>
      <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
    </Link>
  )
}

function DirectoryNavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-2 text-[11px] font-black uppercase tracking-[.16em] text-[#cbd5e1]">{title}</div>
      <div className="w-full max-w-none min-w-0 space-y-1">
{children}</div>
    </div>
  )
}

function DirectoryNavItem({ href, icon, label, badge, active }: { href: string; icon: React.ReactNode; label: string; badge?: string; active?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition", active ? "bg-blue-600/30 text-white ring-1 ring-blue-400/30" : "text-[#e5eefb] hover:bg-[#1a2b42] hover:text-white")}>
      <span className="grid h-5 w-5 place-items-center [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white">{badge}</span>}
    </Link>
  )
}

function Metric({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: "purple" | "blue" | "green" | "amber" | "rose" }) {
  const tones = { purple: "from-violet-700 to-purple-500", blue: "from-sky-700 to-blue-500", green: "from-emerald-700 to-green-500", amber: "from-amber-600 to-orange-500", rose: "from-rose-700 to-red-500" }
  return <div className="flex items-center gap-4 rounded-2xl border border-[#244365] bg-[#10223a] p-5 shadow-[0_20px_50px_rgba(0,0,0,.25)]"><div className={cn("grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white [&_svg]:h-6 [&_svg]:w-6", tones[tone])}>{icon}</div><div><div className="text-[11px] font-black uppercase tracking-[.08em] text-[#cbd5e1]">{label}</div><div className="text-2xl font-black text-white">{value}</div><div className="text-xs font-bold text-[#cbd5e1]">{detail}</div></div></div>
}

function CityStat({ value, label }: { value: string; label: string }) {
  return <div className="border-l border-[#244365] px-4 text-center"><div className="text-2xl font-black text-white">{value}</div><div className="text-xs font-bold text-[#cbd5e1]">{label}</div></div>
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={cn("border-b-2 px-2 py-2 font-bold transition", active ? "border-violet-400 text-violet-200" : "border-transparent text-[#cbd5e1] hover:text-white")}>{children}</button>
}

function ProspectCityCard({ prospect, compact }: { prospect: ProspectRecord; compact?: boolean }) {
  const scoreTone = prospect.score >= 78 ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : prospect.score >= 62 ? "border-amber-500/50 bg-amber-500/10 text-amber-300" : "border-red-500/50 bg-red-500/10 text-red-300"
  return (
    <div className={cn("rounded-2xl border border-[#244365] bg-[#10223a] p-4 shadow-[0_18px_45px_rgba(0,0,0,.20)]", compact && "grid grid-cols-[1fr_auto] items-center gap-4")}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-white text-sm font-black text-slate-900">{initials(prospect.name)}</div>
          <div>
            <div className="flex items-center gap-2"><h3 className="text-base font-black text-white">{prospect.name}</h3>{prospect.score >= 85 && <Crown className="h-4 w-4 text-amber-300" />}</div>
            <div className="text-xs font-bold text-[#cbd5e1]"><Building2 className="mr-1 inline h-3 w-3" />{prospect.type} · {prospect.city}</div>
          </div>
        </div>
        <div className={cn("rounded-xl border px-3 py-2 text-center text-lg font-black", scoreTone)}>{Number(prospect.score || 0).toFixed(1)}<div className="text-[9px] uppercase">Score</div></div>
      </div>

      {!compact && (
        <div className="mb-4 grid grid-cols-3 gap-3 border-y border-[#244365] py-4 text-xs">
          <div><div className="text-[10px] font-black uppercase text-slate-400">Decision Maker</div><div className="mt-1 font-black text-white">{prospect.contactName || prospect.decisionMaker || "N/A"}</div><div className="text-[#cbd5e1]">{prospect.owner}</div></div>
          <div><div className="text-[10px] font-black uppercase text-slate-400">Potential Value</div><div className="mt-1 font-black text-white">{mad(prospect.valueMad)}</div><div className={prospect.valueMad >= 100000 ? "text-emerald-300" : "text-amber-300"}>{prospect.valueMad >= 100000 ? "High Potential" : "Medium Potential"}</div></div>
          <div><div className="text-[10px] font-black uppercase text-slate-400">Stage</div><span className="mt-1 inline-flex rounded-lg bg-violet-700 px-3 py-1 text-xs font-black text-white">{stageLabels[prospect.stage]}</span><div className="mt-1 text-[#cbd5e1]">{pct(prospect.probability)} Probability</div></div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <ActionButton href={prospect.phone ? `tel:${prospect.phone}` : "#"} icon={<Phone />} label="Call" />
        <ActionButton href={prospect.phone ? `https://wa.me/${prospect.phone.replace(/\D/g, "")}` : "#"} icon={<MessageCircle />} label="WhatsApp" target="_blank" />
        <ActionButton href={prospect.email ? `mailto:${prospect.email}` : "#"} icon={<Mail />} label="Email" />
        <Link href={`/revenue-command-center/prospects/${prospect.id}`} className="grid place-items-center gap-1 text-xs font-bold text-[#cbd5e1] hover:text-white"><Eye className="h-4 w-4" />View Profile</Link>
        <Link href={`/revenue-command-center/prospects/${prospect.id}`} className="rounded-xl bg-violet-700 px-4 py-3 text-xs font-black text-white">Take Action</Link>
      </div>
    </div>
  )
}

function ActionButton({ href, icon, label, target }: { href: string; icon: React.ReactNode; label: string; target?: string }) {
  return <a href={href} target={target} className="grid place-items-center gap-1 text-xs font-bold text-[#cbd5e1] hover:text-white [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-emerald-300">{icon}<span>{label}</span></a>
}

function CityDominationMap({
  cityStats,
  selectedCity,
  onSelect,
  prospectsTotal,
  mapMode,
  setMapMode,
  mapZoom,
  setMapZoom,
}: {
  cityStats: Array<{ key: string; city: string; count: number; value: number }>
  selectedCity: string
  onSelect: (city: string) => void
  prospectsTotal: number
  mapMode: "domination" | "coverage"
  setMapMode: (mode: "domination" | "coverage") => void
  mapZoom: number
  setMapZoom: React.Dispatch<React.SetStateAction<number>>
}) {
  const max = Math.max(1, ...cityStats.map((c) => c.count))
  return (
    <div className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-4 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-[.1em] text-white">City Domination Map</h2>
        <button onClick={() => setMapMode(mapMode === "domination" ? "coverage" : "domination")} className="rounded-xl bg-violet-700 px-3 py-2 text-xs font-black text-white">{mapMode === "domination" ? "View Coverage" : "View Domination"}</button>
      </div>
      <div className="relative h-[380px] overflow-hidden rounded-2xl border border-[#244365] bg-[#071426]">
        <div className="absolute left-4 top-4 z-20 grid gap-2">
          <button onClick={() => setMapZoom((z) => Math.min(1.18, Number((z + 0.06).toFixed(2))))} className="grid h-8 w-8 place-items-center rounded-lg border border-[#315474] bg-black/35 text-white">+</button>
          <button onClick={() => setMapZoom((z) => Math.max(0.9, Number((z - 0.06).toFixed(2))))} className="grid h-8 w-8 place-items-center rounded-lg border border-[#315474] bg-black/35 text-white">−</button>
          <button onClick={() => setMapZoom(1)} className="grid h-8 w-8 place-items-center rounded-lg border border-[#315474] bg-black/35 text-white">◎</button>
        </div>
        <div className="transition-transform duration-300" style={{ transform: `scale(${mapZoom})`, transformOrigin: "50% 50%" }}><MoroccoSvg /></div>
        {cityStats.filter(c => mapCoords[c.key]).slice(0, 8).map((city) => {
          const coords = mapCoords[city.key]
          const share = prospectsTotal ? Math.round((city.count / prospectsTotal) * 100) : 0
          const intensity = city.count / max
          const color = selectedCity === city.key ? "bg-violet-500 text-violet-300" : intensity > .55 ? "bg-rose-500 text-rose-400" : intensity > .25 ? "bg-amber-400 text-amber-300" : "bg-blue-500 text-blue-300"
          return (
            <button key={city.key} onClick={() => onSelect(city.key)} className="absolute z-20" style={{ left: `${coords.x}%`, top: `${coords.y}%` }}>
              <span className={cn("block h-4 w-4 rounded-full shadow-[0_0_26px_currentColor]", color)} />
              <span className={cn("absolute whitespace-nowrap text-[11px] font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.95)]", coords.x < 45 ? "right-5 top-[-18px] text-right" : "left-5 top-[-18px] text-left")}>{coords.label}<br/><span className="text-cyan-100">{share}%</span></span>
            </button>
          )
        })}
        <div className="absolute bottom-4 right-4 rounded-2xl border border-[#315474] bg-black/42 p-3 text-xs font-bold text-white backdrop-blur">
          <Legend color="bg-violet-500" label="High Domination" /><Legend color="bg-amber-400" label="Medium Domination" /><Legend color="bg-blue-500" label="Low Domination" /><Legend color="bg-slate-500" label="No Presence" />
        </div>
      </div>
    </div>
  )
}

function MoroccoSvg() {
  return (
    <svg viewBox="0 0 760 520" className="absolute inset-x-2 top-2 h-[340px] w-[calc(100%-1rem)]">
      <defs><linearGradient id="dirMap" x1="0" x2="1"><stop offset="0" stopColor="#0b2848"/><stop offset="1" stopColor="#061323"/></linearGradient><filter id="dirGlow"><feGaussianBlur stdDeviation="2"/><feMerge><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <path d="M584 34 C612 42 635 54 652 74 L687 111 C711 135 733 149 744 170 L713 224 C694 238 675 248 657 266 L623 307 L600 362 L558 412 L512 454 L448 479 L386 503 L316 512 L254 507 L199 484 L154 448 L139 397 L158 350 L195 309 L223 263 L238 212 L282 174 L324 136 L365 86 L428 56 L505 45 Z" fill="url(#dirMap)" stroke="rgba(59,130,246,.85)" strokeWidth="3" filter="url(#dirGlow)" />
      <path d="M199 484 L158 523 L92 523 L139 397" fill="none" stroke="rgba(59,130,246,.72)" strokeWidth="3"/>
      <path d="M238 212 C315 255 400 267 506 252 C589 241 659 255 713 224" stroke="rgba(96,165,250,.16)" fill="none" strokeWidth="1.2"/>
      <path d="M195 309 C294 277 388 296 480 331 C537 352 575 346 623 307" stroke="rgba(96,165,250,.16)" fill="none" strokeWidth="1.2"/>
      <path d="M324 136 C362 231 378 361 386 503" stroke="rgba(96,165,250,.13)" fill="none" strokeWidth="1.2"/>
    </svg>
  )
}

function CityStrategyPanel({ city, marketShare, onOpen }: { city: { city: string; count: number; value: number; high: number }; marketShare: number; onOpen: () => void }) {
  const target = Math.max(40, marketShare + 15)
  return (
    <div className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-4 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-[.1em] text-white">City Strategy Overview</h2><button onClick={onOpen} className="rounded-xl bg-violet-700/50 px-3 py-2 text-xs font-black text-white">Strategy Details</button></div>
      <div className="rounded-2xl border border-[#244365] bg-[#10223a] p-4">
        <span className="rounded-lg bg-violet-700 px-3 py-1 text-xs font-black text-white">PRIMARY TARGET</span>
        <h3 className="mt-3 text-base font-black text-white">{city.city} Domination Strategy</h3>
        <div className="mt-4 text-xs font-black uppercase text-slate-400">Objective</div>
        <p className="mt-1 text-sm font-semibold text-[#cbd5e1]">Achieve {target}% market share in {city.city}</p>
        <div className="mt-4 flex items-center justify-between text-sm"><span className="font-black text-slate-400">Current Status</span><span className="text-2xl font-black text-white">{marketShare}%</span></div>
        <div className="mt-2 h-3 rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-500" style={{ width: `${marketShare}%` }} /></div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div><MiniRow label="Market Size" value={mad(city.value)} /><MiniRow label="Current Share" value={`${marketShare}%`} /><MiniRow label="Target Share" value={`${target}%`} /><MiniRow label="Growth Potential" value={mad(city.value * 1.8)} /></div>
          <div><Pillar color="bg-rose-400" label="Direct Outreach" /><Pillar color="bg-amber-400" label="Partnership Development" /><Pillar color="bg-emerald-400" label="Value Proposition" /><Pillar color="bg-blue-400" label="Market Penetration" /></div>
        </div>
      </div>
    </div>
  )
}

function QuickActions({ onAdd, onImport, onExport, onNationalExport, onCampaign, onSchedule }: { onAdd: () => void; onImport: () => void; onExport: () => void; onNationalExport: () => void; onCampaign: () => void; onSchedule: () => void }) {
  return (
    <div className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-4 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
      <h2 className="mb-4 text-sm font-black uppercase tracking-[.1em] text-white">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2">
        <QuickButton onClick={onAdd} icon={<Plus />} label="Add Prospect" />
        <QuickButton onClick={onImport} icon={<Import />} label="Import Companies" />
        <QuickButton onClick={onCampaign} icon={<Send />} label="Launch Campaign" />
        <QuickButton onClick={onSchedule} icon={<CalendarDays />} label="Schedule Meeting" />
        <QuickButton onClick={() => window.location.href = "/revenue-command-center/market-mapping"} icon={<Target />} label="Market Analysis" />
        <QuickButton onClick={() => window.location.href = "/revenue-command-center/predictive"} icon={<Globe2 />} label="Competitor Check" />
        <QuickButton onClick={onNationalExport} icon={<Download />} label="Export Data" />
        <QuickButton onClick={onExport} icon={<FileText />} label="City Report" />
      </div>
    </div>
  )
}

function QuickButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button onClick={onClick} className="grid min-h-[72px] place-items-center rounded-xl border border-[#244365] bg-[#172942] p-2 text-center text-[11px] font-black text-white transition hover:border-violet-400/60 hover:bg-violet-600/15 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-violet-300">{icon}<span>{label}</span></button>
}


function StrategyModal({
  city,
  marketShare,
  onClose,
  onExport,
  onCampaign,
}: {
  city: { city: string; count: number; value: number; high: number; negotiation: number; closed: number }
  marketShare: number
  onClose: () => void
  onExport: () => void
  onCampaign: () => void
}) {
  const target = Math.max(40, marketShare + 15)
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-4xl rounded-3xl border border-[#315474] bg-[#081525] p-6 shadow-[0_30px_90px_rgba(0,0,0,.55)]">
        <div className="mb-5 flex justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">AngelCare city domination</div>
            <h2 className="text-2xl font-black text-white">{city.city} Strategy Command</h2>
            <p className="mt-1 text-sm font-bold text-[#cbd5e1]">Live synced strategy built from the current prospect directory.</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-[#315474] bg-[#10223a] px-4 py-2 text-sm font-black text-white">Close</button>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <StrategyMetric label="Prospects" value={String(city.count)} />
          <StrategyMetric label="High Potential" value={String(city.high)} />
          <StrategyMetric label="Pipeline" value={mad(city.value)} />
          <StrategyMetric label="Target Share" value={`${target}%`} />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#244365] bg-[#10223a] p-5">
            <h3 className="font-black text-white">Execution pillars</h3>
            <div className="mt-4 space-y-3 text-sm font-bold text-[#cbd5e1]">
              <Pillar color="bg-rose-400" label="Direct outreach to high-score prospects" />
              <Pillar color="bg-amber-400" label="Partnership motion for schools and clinics" />
              <Pillar color="bg-emerald-400" label="Appointment acceleration for hot opportunities" />
              <Pillar color="bg-blue-400" label="Weekly city reporting and recovery actions" />
            </div>
          </div>
          <div className="rounded-2xl border border-[#244365] bg-[#10223a] p-5">
            <h3 className="font-black text-white">Current progress</h3>
            <div className="mt-4 flex items-center justify-between text-sm"><span className="text-slate-400">Market share</span><span className="text-2xl font-black text-white">{marketShare}%</span></div>
            <div className="mt-2 h-3 rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, marketShare)}%` }} /></div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={onCampaign} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">Launch Campaign</button>
              <button onClick={onExport} className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950">Export City CSV</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StrategyMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[#244365] bg-[#10223a] p-4"><div className="text-xs font-black uppercase tracking-[.12em] text-cyan-100">{label}</div><div className="mt-2 text-2xl font-black text-white">{value}</div></div>
}


function ImportCompaniesModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (text: string) => void }) {
  const [text, setText] = useState("")
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-3xl border border-[#315474] bg-[#081525] p-6 shadow-[0_30px_90px_rgba(0,0,0,.55)]">
        <div className="mb-5 flex justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">Live directory import</div>
            <h2 className="text-2xl font-black text-white">Import companies into synced prospects store</h2>
            <p className="mt-1 text-sm font-bold text-[#cbd5e1]">Format: company, city, valueMad, decisionMaker, phone, email</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-[#315474] bg-[#10223a] px-4 py-2 text-sm font-black text-white">Close</button>
        </div>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={"Crèche Exemple, Casablanca, 120000, Mme Nadia, 0600000000, contact@example.com\nClinique Exemple, Rabat, 90000, Dr Ali, 0611111111, clinic@example.com"}
          className="min-h-[260px] w-full rounded-2xl border border-[#315474] bg-[#10223a] p-4 text-sm font-bold text-white outline-none placeholder:text-slate-400"
        />
        <button onClick={() => onSubmit(text)} className="mt-5 w-full rounded-2xl bg-emerald-500 px-5 py-4 text-base font-black text-slate-950">Import Into Live Store</button>
      </div>
    </div>
  )
}

function AddProspectModal({ city, onClose, onSubmit }: { city: string; onClose: () => void; onSubmit: (payload: Partial<ProspectRecord>) => void }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [form, setForm] = useState({
    name: "",
    company: "",
    contactName: "",
    decisionMaker: "",
    decisionMakerConfirmed: false,
    phone: "",
    email: "",
    city,
    source: "Prospects Directory",
    type: "institution" as ProspectType,
    owner: "BD Officer",
    closer: "Revenue Manager",
    stage: "qualification" as ProspectStage,
    priority: "high" as ProspectPriority,
    health: "on_track" as ProspectHealth,
    valueMad: "80000",
    probability: "58",
    urgency: "65",
    fitScore: "74",
    needSummary: "",
    painPoints: "",
    budgetContext: "",
    competitorRisk: "Unknown / to verify",
    objection: "",
    nextContactDate: todayPlus(1),
    nextAction: "",
    qualificationNotes: "",
    proposedOffer: "",
    negotiationTerms: "",
    recoveryPlan: "",
    stakeholders: "",
    documents: "Qualification brief, AngelCare B2B offer, City domination notes",
  })

  const calculatedScore = computeIntakeScore(form)
  const autoPriority: ProspectPriority = calculatedScore >= 82 ? "critical" : calculatedScore >= 72 ? "high" : calculatedScore >= 58 ? "medium" : "low"
  const recommendedOffer = form.proposedOffer || buildRecommendedOffer(form.type, Number(form.valueMad || 0), Number(form.fitScore || 0))
  const recommendedAction = form.nextAction || buildNextAction(form.stage, form.decisionMakerConfirmed, form.contactName || form.decisionMaker)

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submit() {
    const name = form.name.trim() || form.company.trim()
    if (!name) return

    onSubmit({
      name,
      company: form.company.trim() || name,
      contactName: form.contactName.trim() || form.decisionMaker.trim() || "N/A",
      decisionMaker: form.decisionMaker.trim() || form.contactName.trim(),
      decisionMakerConfirmed: form.decisionMakerConfirmed,
      phone: form.phone.trim(),
      email: form.email.trim(),
      city: form.city.trim() || city,
      source: form.source,
      type: form.type,
      owner: form.owner,
      closer: form.closer,
      stage: form.stage,
      priority: form.priority || autoPriority,
      health: form.health,
      valueMad: Number(form.valueMad || 0),
      score: calculatedScore,
      probability: Number(form.probability || 0),
      urgency: Number(form.urgency || 0),
      fitScore: Number(form.fitScore || 0),
      needSummary: form.needSummary,
      painPoints: form.painPoints,
      budgetContext: form.budgetContext,
      competitorRisk: form.competitorRisk,
      objection: form.objection,
      nextContactDate: form.nextContactDate,
      nextAction: recommendedAction,
      qualificationNotes: form.qualificationNotes,
      proposedOffer: recommendedOffer,
      negotiationTerms: form.negotiationTerms,
      recoveryPlan: form.recoveryPlan,
      stakeholders: form.stakeholders.split(",").map((x) => x.trim()).filter(Boolean),
      documents: form.documents.split(",").map((x) => x.trim()).filter(Boolean),
    })
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-none min-w-0 max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[32px] border border-[#315474] bg-[#081525] shadow-[0_30px_90px_rgba(0,0,0,.65)]">
        <div className="sticky top-0 z-10 border-b border-[#244365] bg-[#081525]/95 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">AngelCare enterprise intake</div>
              <h2 className="mt-1 text-3xl font-black text-white">Create Prospect Command Profile</h2>
              <p className="mt-1 text-sm font-bold text-[#cbd5e1]">Full B2B qualification profile for market domination, pipeline control and execution tracking.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="rounded-xl border border-[#315474] bg-[#10223a] px-4 py-3 text-sm font-black text-white">Close</button>
              <button onClick={submit} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950">Create Enterprise Prospect</button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <IntakeKpi label="Intake Score" value={`${calculatedScore}%`} detail={autoPriority.toUpperCase()} />
            <IntakeKpi label="Recommended Offer" value={recommendedOffer.split("·")[0]?.trim() || "AngelCare"} detail={form.type} />
            <IntakeKpi label="Next Action" value={form.nextContactDate} detail={recommendedAction} />
            <IntakeKpi label="City Scope" value={form.city || city} detail="directory synced" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
            <StepButton active={step === 1} onClick={() => setStep(1)} label="1. Identity" />
            <StepButton active={step === 2} onClick={() => setStep(2)} label="2. Qualification" />
            <StepButton active={step === 3} onClick={() => setStep(3)} label="3. Strategy" />
            <StepButton active={step === 4} onClick={() => setStep(4)} label="4. Execution" />
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <IntakePanel title="Prospect Identity">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Prospect / School / Company Name" value={form.name} onChange={(v) => update("name", v)} />
                  <Input label="Legal / Commercial Entity" value={form.company} onChange={(v) => update("company", v)} />
                  <Input label="City" value={form.city} onChange={(v) => update("city", v)} />
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">Segment</span>
                    <select value={form.type} onChange={(e) => update("type", e.target.value as ProspectType)} className="rounded-2xl border border-[#315474] bg-[#10223a] p-3 text-sm font-bold text-white outline-none">
                      <option value="institution">Kindergarten / Preschool</option>
                      <option value="clinic">Clinic / Healthcare Partner</option>
                      <option value="academy">Academy / Training Partner</option>
                      <option value="corporate">Corporate Client</option>
                      <option value="partner">Strategic Partner</option>
                      <option value="family">Family Lead</option>
                      <option value="website">Website Lead</option>
                      <option value="campaign">Campaign Lead</option>
                    </select>
                  </label>
                  <Input label="Source" value={form.source} onChange={(v) => update("source", v)} />
                  <Input label="Owner" value={form.owner} onChange={(v) => update("owner", v)} />
                </div>
              </IntakePanel>

              <IntakePanel title="Decision Maker & Contacts">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Main Contact Name" value={form.contactName} onChange={(v) => update("contactName", v)} />
                  <Input label="Decision Maker" value={form.decisionMaker} onChange={(v) => update("decisionMaker", v)} />
                  <Input label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
                  <Input label="Email" value={form.email} onChange={(v) => update("email", v)} />
                  <Input label="Stakeholders comma-separated" value={form.stakeholders} onChange={(v) => update("stakeholders", v)} />
                  <label className="flex items-center gap-3 rounded-2xl border border-[#315474] bg-[#10223a] p-4">
                    <input type="checkbox" checked={form.decisionMakerConfirmed} onChange={(e) => update("decisionMakerConfirmed", e.target.checked)} />
                    <span className="text-sm font-black text-white">Decision maker confirmed</span>
                  </label>
                </div>
              </IntakePanel>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <IntakePanel title="Commercial Qualification">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Potential Value MAD" value={form.valueMad} onChange={(v) => update("valueMad", v)} />
                  <Input label="Probability %" value={form.probability} onChange={(v) => update("probability", v)} />
                  <Input label="Urgency %" value={form.urgency} onChange={(v) => update("urgency", v)} />
                  <Input label="AngelCare Fit Score %" value={form.fitScore} onChange={(v) => update("fitScore", v)} />
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">Stage</span>
                    <select value={form.stage} onChange={(e) => update("stage", e.target.value as ProspectStage)} className="rounded-2xl border border-[#315474] bg-[#10223a] p-3 text-sm font-bold text-white outline-none">
                      <option value="new_lead">New Lead</option>
                      <option value="discovery">Discovery</option>
                      <option value="qualification">Qualification</option>
                      <option value="decision_map">Decision Map</option>
                      <option value="appointment_ready">Appointment Ready</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">Priority</span>
                    <select value={form.priority} onChange={(e) => update("priority", e.target.value as ProspectPriority)} className="rounded-2xl border border-[#315474] bg-[#10223a] p-3 text-sm font-bold text-white outline-none">
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </label>
                </div>
              </IntakePanel>

              <IntakePanel title="Needs, Pain & Budget">
                <div className="grid gap-3">
                  <Textarea label="Need Summary" value={form.needSummary} onChange={(v) => update("needSummary", v)} placeholder="What exact AngelCare problem/opportunity does this prospect represent?" />
                  <Textarea label="Pain Points" value={form.painPoints} onChange={(v) => update("painPoints", v)} placeholder="Current operational pain: staff, pedagogy, parents, growth, compliance, training..." />
                  <Textarea label="Budget Context" value={form.budgetContext} onChange={(v) => update("budgetContext", v)} placeholder="Budget owner, available range, payment expectation, timing..." />
                </div>
              </IntakePanel>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <IntakePanel title="AngelCare Domination Strategy">
                <div className="grid gap-3">
                  <Textarea label="Proposed Offer / Bundle" value={form.proposedOffer || recommendedOffer} onChange={(v) => update("proposedOffer", v)} />
                  <Textarea label="Competitor Risk" value={form.competitorRisk} onChange={(v) => update("competitorRisk", v)} />
                  <Textarea label="Main Objection" value={form.objection} onChange={(v) => update("objection", v)} />
                </div>
              </IntakePanel>

              <IntakePanel title="Execution Configuration">
                <div className="grid gap-3">
                  <Textarea label="Qualification Notes" value={form.qualificationNotes} onChange={(v) => update("qualificationNotes", v)} />
                  <Textarea label="Negotiation Terms" value={form.negotiationTerms} onChange={(v) => update("negotiationTerms", v)} />
                  <Textarea label="Recovery Plan" value={form.recoveryPlan} onChange={(v) => update("recoveryPlan", v)} />
                </div>
              </IntakePanel>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <IntakePanel title="Next Action Setup">
                <div className="grid gap-3">
                  <Textarea label="Next Action" value={form.nextAction || recommendedAction} onChange={(v) => update("nextAction", v)} />
                  <Input label="Next Contact Date" value={form.nextContactDate} onChange={(v) => update("nextContactDate", v)} />
                  <Input label="Closer / Revenue Owner" value={form.closer} onChange={(v) => update("closer", v)} />
                  <Input label="Preinstalled Documents comma-separated" value={form.documents} onChange={(v) => update("documents", v)} />
                </div>
              </IntakePanel>

              <IntakePanel title="Creation Summary">
                <div className="space-y-3 text-sm font-bold text-[#cbd5e1]">
                  <SummaryRow label="Score" value={`${calculatedScore}%`} />
                  <SummaryRow label="Priority" value={autoPriority.toUpperCase()} />
                  <SummaryRow label="Offer" value={recommendedOffer} />
                  <SummaryRow label="First Task" value={recommendedAction} />
                  <SummaryRow label="Sync" value="Creates profile + activity comment + first task" />
                </div>
                <button onClick={submit} className="mt-5 w-full rounded-2xl bg-emerald-500 px-5 py-4 text-base font-black text-slate-950">
                  Create Complete Enterprise Prospect Profile
                </button>
              </IntakePanel>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function IntakePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-5"><h3 className="mb-4 text-sm font-black uppercase tracking-[.12em] text-white">{title}</h3>{children}</section>
}

function IntakeKpi({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-[#244365] bg-[#10223a] p-4"><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#94a3b8]">{label}</div><div className="mt-1 truncate text-lg font-black text-white">{value}</div><div className="mt-1 truncate text-xs font-bold text-[#cbd5e1]">{detail}</div></div>
}

function StepButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return <button onClick={onClick} className={cn("rounded-xl px-4 py-3 text-sm font-black transition", active ? "bg-violet-700 text-white shadow-[0_0_28px_rgba(124,58,237,.25)]" : "border border-[#244365] bg-[#10223a] text-[#cbd5e1] hover:text-white")}>{label}</button>
}

function Textarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-[120px] rounded-2xl border border-[#315474] bg-[#10223a] p-3 text-sm font-bold text-white outline-none placeholder:text-slate-400" /></label>
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-white/10 py-2"><span className="text-slate-400">{label}</span><span className="text-right font-black text-white">{value}</span></div>
}


function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="rounded-2xl border border-[#315474] bg-[#10223a] p-3 text-sm font-bold text-white outline-none" /></label>
}

function Legend({ color, label }: { color: string; label: string }) { return <div className="mb-2 flex items-center gap-2"><span className={cn("h-3 w-3 rounded-full", color)} /><span>{label}</span></div> }
function MiniRow({ label, value }: { label: string; value: string }) { return <div className="mb-2 flex justify-between gap-3"><span className="text-slate-400">{label}</span><span className="font-black text-white">{value}</span></div> }
function Pillar({ color, label }: { color: string; label: string }) { return <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#cbd5e1]"><span className={cn("h-2 w-2 rounded-full", color)} />{label}</div> }
function FooterStatus({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) { return <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#172942] text-emerald-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</div><div><div className="text-xs font-black uppercase tracking-[.12em] text-white">{title}</div><div className="text-sm font-black text-emerald-300">{value}</div></div></div> }
