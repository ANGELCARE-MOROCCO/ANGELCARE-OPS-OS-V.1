"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react"
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Flame,
  Gauge,
  History,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Target,
  TrendingUp,
  UserCheck,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react"
import {
  AmbassadorLeadQualificationModal,
  defaultLead,
  type CockpitModalFeedback,
} from "@/components/market-os/ambassadors/modals/AmbassadorCockpitActionModals"
import type { AmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/types"

type AnyRow = Record<string, any>
type IconType = ComponentType<{ className?: string; size?: number }>
type OverlayKind = "import" | "assign" | "source" | "export" | null

type Props = {
  snapshot: AmbassadorWorkspaceSnapshot
  loading: boolean
  refreshing: boolean
  error?: string | null
  success?: string | null
  onRefresh: () => void
}

type LeadMeta = {
  sourceCampaign?: string
  sourceChannel?: string
  referralCode?: string
  promoCode?: string
  sourceValidation?: {
    status?: "pending" | "validated" | "rejected" | "review"
    validator?: string
    validatedAt?: string
    proofReference?: string
    note?: string
  }
  assignment?: {
    manager?: string
    priority?: string
    reason?: string
    assignedAt?: string
    supportAmbassadorIds?: string[]
  }
  qualification?: {
    need?: string
    urgency?: string
    budget?: string
    language?: string
    preferredChannel?: string
    temperature?: string
    probability?: number
    qualityScore?: number
    duplicateRisk?: string
    owner?: string
  }
  acquisitionCost?: number
  lastAction?: string
  history?: Array<{
    at: string
    action: string
    actor?: string
    note?: string
  }>
  import?: {
    batchId?: string
    filename?: string
    importedAt?: string
    row?: number
  }
}

type ImportDraft = {
  rows: AnyRow[]
  filename: string
  cityFallback: string
  sourceFallback: string
  ambassadorFallback: string
  territoryFallback: string
  skipDuplicates: boolean
  autoQualify: boolean
}

type AssignDraft = {
  leadIds: string[]
  ambassadorId: string
  supportAmbassadorIds: string[]
  territoryId: string
  nextFollowupAt: string
  priority: string
  manager: string
  reason: string
  statusAfter: string
}

type SourceDraft = {
  leadIds: string[]
  source: string
  channel: string
  ambassadorId: string
  referralCode: string
  promoCode: string
  campaign: string
  decision: "validated" | "rejected" | "review"
  validator: string
  proofReference: string
  note: string
}

type ExportDraft = {
  format: "csv" | "json"
  status: string
  source: string
  city: string
  columns: string[]
}

const META_START = "<!-- ANGELCARE_LEAD_META_START"
const META_END = "ANGELCARE_LEAD_META_END -->"

const leadStatuses = [
  { value: "all", label: "Tous" },
  { value: "new", label: "Nouveau" },
  { value: "contacted", label: "À contacter" },
  { value: "follow_up", label: "À relancer" },
  { value: "qualified", label: "Qualifié" },
  { value: "hot", label: "Chaud" },
  { value: "negotiating", label: "Négociation" },
  { value: "ready_to_convert", label: "Prêt à convertir" },
  { value: "converted", label: "Converti" },
  { value: "disqualified", label: "Non qualifié" },
]

const statusLabels: Record<string, string> = {
  new: "Nouveau",
  contacted: "À contacter",
  follow_up: "À relancer",
  qualified: "Qualifié",
  hot: "Chaud",
  negotiating: "Négociation",
  ready_to_convert: "Prêt à convertir",
  converted: "Converti",
  disqualified: "Non qualifié",
  archived: "Archivé",
}

const sourceOptions = [
  "Recommandation",
  "Referral ambassadeur",
  "Code promo",
  "Mission terrain",
  "WhatsApp",
  "Appel",
  "Instagram",
  "Facebook Ads",
  "Google Ads",
  "Site Web",
  "Salon / Événement",
  "Partenaire",
  "Import CSV",
  "Manuel",
]

const exportColumns = [
  { key: "reference", label: "Référence" },
  { key: "lead_name", label: "Lead / contact" },
  { key: "phone", label: "Téléphone" },
  { key: "email", label: "Email" },
  { key: "city", label: "Ville" },
  { key: "zone", label: "Zone" },
  { key: "source", label: "Source" },
  { key: "ambassador", label: "Ambassadeur" },
  { key: "score", label: "Score" },
  { key: "status", label: "Statut" },
  { key: "next_followup_at", label: "Prochain suivi" },
  { key: "created_at", label: "Créé le" },
]

function text(...values: unknown[]) {
  for (const value of values) {
    const normalized = String(value ?? "").trim()
    if (normalized) return normalized
  }
  return ""
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function formatNumber(value: unknown) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(numberValue(value)))
}

function formatMoney(value: unknown) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(numberValue(value))} Dh`
}

function formatDate(value: unknown, includeTime = false) {
  const raw = String(value || "").trim()
  if (!raw) return "Non renseigné"
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return new Intl.DateTimeFormat("fr-FR", includeTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" }).format(date)
}

function toDateTimeLocal(value: unknown) {
  const raw = String(value || "").trim()
  if (!raw) return ""
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function normalize(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function normalizePhone(value: unknown) {
  return String(value || "").replace(/\D/g, "")
}

function leadName(lead: AnyRow) {
  return text(lead.lead_name, lead.parent_name, lead.contact_name, "Lead sans nom")
}

function leadReference(lead: AnyRow) {
  const explicit = text(lead.reference, lead.lead_code, lead.code)
  if (explicit) return explicit
  const suffix = String(lead.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()
  return suffix ? `L-${suffix}` : "LEAD"
}

function parseMeta(notes: unknown): LeadMeta {
  const source = String(notes || "")
  const start = source.indexOf(META_START)
  const end = source.indexOf(META_END)
  if (start < 0 || end < 0 || end <= start) return {}
  const jsonStart = source.indexOf("\n", start)
  if (jsonStart < 0) return {}
  try {
    const parsed = JSON.parse(source.slice(jsonStart + 1, end).trim())
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function stripMeta(notes: unknown) {
  const source = String(notes || "")
  const start = source.indexOf(META_START)
  const end = source.indexOf(META_END)
  if (start < 0 || end < 0 || end <= start) return source.trim()
  return `${source.slice(0, start)}${source.slice(end + META_END.length)}`.trim()
}

function withMeta(lead: AnyRow, patch: Partial<LeadMeta>, history?: { action: string; actor?: string; note?: string }) {
  const current = parseMeta(lead.notes)
  const nextHistory = history
    ? [...(current.history || []), { at: new Date().toISOString(), ...history }].slice(-40)
    : current.history
  const merged: LeadMeta = {
    ...current,
    ...patch,
    qualification: patch.qualification ? { ...(current.qualification || {}), ...patch.qualification } : current.qualification,
    assignment: patch.assignment ? { ...(current.assignment || {}), ...patch.assignment } : current.assignment,
    sourceValidation: patch.sourceValidation ? { ...(current.sourceValidation || {}), ...patch.sourceValidation } : current.sourceValidation,
    history: nextHistory,
  }
  const human = stripMeta(lead.notes)
  return `${human}${human ? "\n\n" : ""}${META_START}\n${JSON.stringify(merged)}\n${META_END}`
}

function statusKey(lead: AnyRow) {
  const raw = normalize(text(lead.status, "new")).replaceAll(" ", "_")
  if (["hot", "chaud"].includes(raw) || numberValue(lead.score) >= 85) return "hot"
  if (["qualified", "qualifie", "prequalified", "prequalifie"].includes(raw)) return "qualified"
  if (["follow_up", "followup", "a_relancer", "relance"].includes(raw)) return "follow_up"
  if (["contacted", "a_contacter", "contacte"].includes(raw)) return "contacted"
  if (["negotiating", "negociation", "negotiation"].includes(raw)) return "negotiating"
  if (["ready_to_convert", "ready", "pret_a_convertir"].includes(raw)) return "ready_to_convert"
  if (["converted", "converti"].includes(raw) || lead.converted_at) return "converted"
  if (["disqualified", "rejected", "non_qualifie"].includes(raw)) return "disqualified"
  if (["archived", "archive"].includes(raw)) return "archived"
  return "new"
}

function statusTone(status: string) {
  const tones: Record<string, string> = {
    new: "border-slate-200 bg-slate-50 text-slate-700",
    contacted: "border-blue-200 bg-blue-50 text-blue-700",
    follow_up: "border-amber-200 bg-amber-50 text-amber-700",
    qualified: "border-emerald-200 bg-emerald-50 text-emerald-700",
    hot: "border-rose-200 bg-rose-50 text-rose-700",
    negotiating: "border-violet-200 bg-violet-50 text-violet-700",
    ready_to_convert: "border-cyan-200 bg-cyan-50 text-cyan-700",
    converted: "border-teal-200 bg-teal-50 text-teal-700",
    disqualified: "border-slate-300 bg-slate-100 text-slate-500",
  }
  return tones[status] || tones.new
}

function ageDays(lead: AnyRow) {
  const date = new Date(text(lead.created_at, lead.updated_at))
  if (Number.isNaN(date.getTime())) return 0
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000))
}

function isFollowupDue(lead: AnyRow, todayOnly = false) {
  const raw = text(lead.next_followup_at)
  if (!raw) return false
  const due = new Date(raw)
  if (Number.isNaN(due.getTime())) return false
  const now = new Date()
  if (todayOnly) return due.toDateString() === now.toDateString()
  return due.getTime() <= now.getTime()
}

function isExpiring(lead: AnyRow) {
  const raw = text(lead.next_followup_at)
  if (!raw || ["converted", "disqualified"].includes(statusKey(lead))) return false
  const due = new Date(raw)
  if (Number.isNaN(due.getTime())) return false
  return due.getTime() <= Date.now() + 48 * 3_600_000
}

function phoneValid(value: unknown) {
  const digits = normalizePhone(value)
  return digits.length >= 9 && digits.length <= 15
}

function extractRows(payload: AnyRow | null) {
  if (!payload) return []
  const candidates = [payload.data, payload.records, payload.items, payload.leads, payload.conversions]
  for (const candidate of candidates) if (Array.isArray(candidate)) return candidate as AnyRow[]
  return []
}

async function apiRequest(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  })
  const payload = await response.json().catch(() => ({})) as AnyRow
  if (!response.ok || payload?.ok === false) {
    throw new Error(text(payload?.error, payload?.message, `Erreur HTTP ${response.status}`))
  }
  return payload
}

function csvEscape(value: unknown) {
  const raw = String(value ?? "")
  return /[",\n\r]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw
}

function parseCsv(source: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]
    if (char === '"' && quoted && next === '"') {
      cell += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === "," && !quoted) {
      row.push(cell.trim())
      cell = ""
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1
      row.push(cell.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      cell = ""
    } else {
      cell += char
    }
  }
  row.push(cell.trim())
  if (row.some(Boolean)) rows.push(row)
  if (rows.length < 2) return []
  const headers = rows[0].map((item) => normalize(item).replaceAll(" ", "_"))
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])))
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function initialImportDraft(): ImportDraft {
  return {
    rows: [],
    filename: "",
    cityFallback: "Rabat",
    sourceFallback: "Import CSV",
    ambassadorFallback: "",
    territoryFallback: "",
    skipDuplicates: true,
    autoQualify: false,
  }
}

function initialAssignDraft(selected: string[] = []): AssignDraft {
  return {
    leadIds: selected,
    ambassadorId: "",
    supportAmbassadorIds: [],
    territoryId: "",
    nextFollowupAt: "",
    priority: "Normale",
    manager: "AngelCare OPS",
    reason: "Répartition opérationnelle et suivi commercial",
    statusAfter: "contacted",
  }
}

function initialSourceDraft(selected: string[] = []): SourceDraft {
  return {
    leadIds: selected,
    source: "Recommandation",
    channel: "Referral ambassadeur",
    ambassadorId: "",
    referralCode: "",
    promoCode: "",
    campaign: "",
    decision: "validated",
    validator: "AngelCare OPS",
    proofReference: "",
    note: "",
  }
}

function initialExportDraft(): ExportDraft {
  return {
    format: "csv",
    status: "all",
    source: "all",
    city: "all",
    columns: exportColumns.map((item) => item.key),
  }
}

export default function AmbassadorLeadsRoute({ snapshot, loading, refreshing, error, success, onRefresh }: Props) {
  const [leads, setLeads] = useState<AnyRow[]>(Array.isArray((snapshot as AnyRow).leads) ? (snapshot as AnyRow).leads : [])
  const [conversions, setConversions] = useState<AnyRow[]>(Array.isArray((snapshot as AnyRow).conversions) ? (snapshot as AnyRow).conversions : [])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [ambassadorFilter, setAmbassadorFilter] = useState("all")
  const [scoreFilter, setScoreFilter] = useState("all")
  const [ageFilter, setAgeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [onlyDue, setOnlyDue] = useState(false)
  const [onlyDuplicates, setOnlyDuplicates] = useState(false)
  const [onlyInvalidPhone, setOnlyInvalidPhone] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedLead, setSelectedLead] = useState<AnyRow | null>(null)
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [leadForm, setLeadForm] = useState({ ...defaultLead })
  const [leadFeedback, setLeadFeedback] = useState<CockpitModalFeedback | null>(null)
  const [overlay, setOverlay] = useState<OverlayKind>(null)
  const [saving, setSaving] = useState(false)
  const [importDraft, setImportDraft] = useState<ImportDraft>(initialImportDraft)
  const [assignDraft, setAssignDraft] = useState<AssignDraft>(initialAssignDraft)
  const [sourceDraft, setSourceDraft] = useState<SourceDraft>(initialSourceDraft)
  const [exportDraft, setExportDraft] = useState<ExportDraft>(initialExportDraft)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const ambassadors = useMemo(() => (snapshot.ambassadors || []).filter((item: AnyRow) => !item.archived_at && item.status !== "archived"), [snapshot.ambassadors])
  const territories = useMemo(() => (snapshot.territories || []).filter((item: AnyRow) => !item.archived_at && item.status !== "archived"), [snapshot.territories])

  const ambassadorById = useMemo(() => new Map(ambassadors.map((item: AnyRow) => [String(item.id), item])), [ambassadors])
  const territoryById = useMemo(() => new Map(territories.map((item: AnyRow) => [String(item.id), item])), [territories])

  const ambassadorName = useCallback((id: unknown) => {
    const item = ambassadorById.get(String(id || ""))
    return text(item?.full_name, item?.name, id ? "Ambassadeur" : "Non affecté")
  }, [ambassadorById])

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setDataLoading(true)
    setDataError(null)
    try {
      const [leadPayload, conversionPayload] = await Promise.all([
        apiRequest("/api/market-os/ambassadors/leads"),
        apiRequest("/api/market-os/ambassadors/conversions"),
      ])
      setLeads(extractRows(leadPayload).filter((item) => statusKey(item) !== "archived"))
      setConversions(extractRows(conversionPayload).filter((item) => !item.archived_at && item.status !== "archived"))
    } catch (loadError) {
      setDataError(loadError instanceof Error ? loadError.message : "Synchronisation des leads impossible")
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const duplicateIds = useMemo(() => {
    const phoneMap = new Map<string, string[]>()
    const emailMap = new Map<string, string[]>()
    for (const lead of leads) {
      const id = String(lead.id || "")
      const phone = normalizePhone(lead.phone)
      const email = normalize(lead.email)
      if (phone) phoneMap.set(phone, [...(phoneMap.get(phone) || []), id])
      if (email) emailMap.set(email, [...(emailMap.get(email) || []), id])
    }
    const ids = new Set<string>()
    for (const group of [...phoneMap.values(), ...emailMap.values()]) if (group.length > 1) group.forEach((id) => ids.add(id))
    return ids
  }, [leads])

  const cities = useMemo(() => [...new Set(leads.map((item) => text(item.city)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")), [leads])
  const sources = useMemo(() => [...new Set(leads.map((item) => text(item.source, "Non renseignée")).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")), [leads])

  const filteredLeads = useMemo(() => {
    const search = normalize(query)
    return leads.filter((lead) => {
      const meta = parseMeta(lead.notes)
      const searchable = normalize([
        leadReference(lead),
        leadName(lead),
        lead.phone,
        lead.email,
        lead.city,
        lead.zone,
        lead.source,
        ambassadorName(lead.ambassador_id),
        meta.referralCode,
        meta.promoCode,
        meta.sourceCampaign,
      ].join(" "))
      if (search && !searchable.includes(search)) return false
      if (cityFilter !== "all" && text(lead.city) !== cityFilter) return false
      if (sourceFilter !== "all" && text(lead.source, "Non renseignée") !== sourceFilter) return false
      if (ambassadorFilter !== "all" && String(lead.ambassador_id || "") !== ambassadorFilter) return false
      if (statusFilter !== "all" && statusKey(lead) !== statusFilter) return false
      const score = numberValue(lead.score)
      if (scoreFilter === "high" && score < 80) return false
      if (scoreFilter === "medium" && (score < 50 || score >= 80)) return false
      if (scoreFilter === "low" && score >= 50) return false
      const age = ageDays(lead)
      if (ageFilter === "today" && age > 0) return false
      if (ageFilter === "7" && age > 7) return false
      if (ageFilter === "14" && age <= 14) return false
      if (onlyDue && !isFollowupDue(lead)) return false
      if (onlyDuplicates && !duplicateIds.has(String(lead.id))) return false
      if (onlyInvalidPhone && phoneValid(lead.phone)) return false
      return true
    }).sort((a, b) => {
      const dueA = new Date(text(a.next_followup_at, "2999-12-31")).getTime()
      const dueB = new Date(text(b.next_followup_at, "2999-12-31")).getTime()
      if (dueA !== dueB) return dueA - dueB
      return numberValue(b.score) - numberValue(a.score)
    })
  }, [leads, query, cityFilter, sourceFilter, ambassadorFilter, statusFilter, scoreFilter, ageFilter, onlyDue, onlyDuplicates, onlyInvalidPhone, duplicateIds, ambassadorName])

  useEffect(() => setPage(1), [query, cityFilter, sourceFilter, ambassadorFilter, statusFilter, scoreFilter, ageFilter, onlyDue, onlyDuplicates, onlyInvalidPhone])

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize))
  const paginatedLeads = filteredLeads.slice((page - 1) * pageSize, page * pageSize)

  const metrics = useMemo(() => {
    const received = leads.length
    const qualified = leads.filter((item) => ["qualified", "hot", "negotiating", "ready_to_convert", "converted"].includes(statusKey(item))).length
    const withoutFollowup = leads.filter((item) => !item.next_followup_at && !["converted", "disqualified"].includes(statusKey(item))).length
    const hot = leads.filter((item) => statusKey(item) === "hot" || numberValue(item.score) >= 85).length
    const expiring = leads.filter(isExpiring).length
    const costs = leads.map((item) => numberValue(parseMeta(item.notes).acquisitionCost)).filter((item) => item > 0)
    const costPerLead = costs.length ? costs.reduce((sum, item) => sum + item, 0) / costs.length : 0
    return { received, qualified, withoutFollowup, hot, expiring, costPerLead }
  }, [leads])

  const todayQueue = useMemo(() => leads
    .filter((item) => isFollowupDue(item) && !["converted", "disqualified"].includes(statusKey(item)))
    .sort((a, b) => numberValue(b.score) - numberValue(a.score))
    .slice(0, 8), [leads])

  const risks = useMemo(() => {
    const invalidPhones = leads.filter((item) => !phoneValid(item.phone)).length
    const missingInfo = leads.filter((item) => !text(item.city) || !text(item.source) || !text(item.ambassador_id)).length
    const inactive = leads.filter((item) => ageDays(item) > 14 && !["converted", "disqualified"].includes(statusKey(item))).length
    return [
      { label: "Leads en double détectés", value: duplicateIds.size, icon: Users, tone: "rose", filter: "duplicates" },
      { label: "Numéros invalides", value: invalidPhones, icon: Phone, tone: "rose", filter: "invalidPhone" },
      { label: "Informations manquantes", value: missingInfo, icon: ShieldAlert, tone: "amber", filter: "missing" },
      { label: "Leads inactifs (> 14 jours)", value: inactive, icon: Clock3, tone: "amber", filter: "inactive" },
    ]
  }, [leads, duplicateIds])

  const pendingReferrals = useMemo(() => leads.filter((lead) => {
    const source = normalize(lead.source)
    const validation = parseMeta(lead.notes).sourceValidation?.status
    return (source.includes("referral") || source.includes("recommand") || source.includes("promo")) && validation !== "validated"
  }).slice(0, 8), [leads])

  const sourcePerformance = useMemo(() => {
    const map = new Map<string, AnyRow>()
    for (const lead of leads) {
      const source = text(lead.source, "Non renseignée")
      const row = map.get(source) || { source, leads: 0, qualified: 0, conversions: 0, cost: 0, costRows: 0 }
      row.leads += 1
      if (["qualified", "hot", "negotiating", "ready_to_convert", "converted"].includes(statusKey(lead))) row.qualified += 1
      const linkedConversion = conversions.some((item) => String(item.lead_id || "") === String(lead.id || "") || normalize(item.lead_name) === normalize(leadName(lead)))
      if (linkedConversion) row.conversions += 1
      const cost = numberValue(parseMeta(lead.notes).acquisitionCost)
      if (cost > 0) { row.cost += cost; row.costRows += 1 }
      map.set(source, row)
    }
    return [...map.values()].sort((a, b) => b.leads - a.leads).slice(0, 8)
  }, [leads, conversions])

  const funnel = useMemo(() => ({
    received: leads.length,
    qualified: leads.filter((item) => ["qualified", "hot", "negotiating", "ready_to_convert", "converted"].includes(statusKey(item))).length,
    negotiating: leads.filter((item) => ["negotiating", "ready_to_convert", "converted"].includes(statusKey(item))).length,
    ready: leads.filter((item) => ["ready_to_convert", "converted"].includes(statusKey(item))).length,
  }), [leads])

  function resetFilters() {
    setQuery("")
    setCityFilter("all")
    setSourceFilter("all")
    setAmbassadorFilter("all")
    setScoreFilter("all")
    setAgeFilter("all")
    setStatusFilter("all")
    setOnlyDue(false)
    setOnlyDuplicates(false)
    setOnlyInvalidPhone(false)
  }

  async function refreshAll() {
    setMessage(null)
    onRefresh()
    await loadData(true)
    setMessage("Leads, conversions et attribution synchronisés.")
  }

  function openLeadModal() {
    setLeadForm({ ...defaultLead })
    setLeadFeedback(null)
    setLeadModalOpen(true)
  }

  async function submitLead(mode: "create" | "qualify" | "followup") {
    const form = leadForm as AnyRow
    const name = text(form.lead_name, form.contact_name)
    if (!name || !text(form.phone) || !text(form.city)) {
      setLeadFeedback({ tone: "error", message: "Nom, téléphone et ville sont obligatoires." })
      return
    }
    setSaving(true)
    setLeadFeedback({ tone: "info", message: "Synchronisation du lead en cours…" })
    try {
      const score = Math.max(0, Math.min(100, numberValue(form.score, numberValue(form.qualification_score, 0))))
      const rawStatus = text(form.status, mode === "qualify" ? "qualified" : mode === "followup" ? "follow_up" : "new")
      const status = mode === "qualify" ? "qualified" : mode === "followup" ? "follow_up" : rawStatus
      const humanNotes = [
        text(form.structured_note),
        text(form.internal_note),
        text(form.notes),
      ].filter(Boolean).join("\n")
      const baseLead: AnyRow = { notes: humanNotes }
      const notes = withMeta(baseLead, {
        sourceCampaign: text(form.source_campaign),
        qualification: {
          need: text(form.identified_need, form.need),
          urgency: text(form.urgency),
          budget: text(form.probable_budget, form.budget_estimate),
          language: text(form.preferred_language, form.language),
          preferredChannel: text(form.preferred_channel, form.next_channel),
          temperature: text(form.temperature),
          probability: numberValue(form.conversion_probability),
          qualityScore: numberValue(form.quality_score),
          duplicateRisk: text(form.duplicate_risk),
          owner: text(form.owner),
        },
        lastAction: mode,
      }, { action: `lead_${mode}`, actor: text(form.owner, "AngelCare OPS") })
      await apiRequest("/api/market-os/ambassadors/leads", {
        method: "POST",
        body: JSON.stringify({
          lead_name: name,
          parent_name: text(form.parent_name, name),
          phone: text(form.phone) || null,
          email: text(form.email) || null,
          city: text(form.city),
          region: text(form.region),
          zone: text(form.zone, form.district),
          source: text(form.source, "Manuel"),
          lead_type: text(form.lead_type, "Parent / famille"),
          status,
          score,
          ambassador_id: text(form.ambassador_id, form.ambassador_source) || null,
          territory_id: text(form.territory_id, form.territory) || null,
          next_followup_at: text(form.next_followup_at) || null,
          qualified_at: status === "qualified" || status === "hot" ? new Date().toISOString() : null,
          notes,
        }),
      })
      await loadData(true)
      onRefresh()
      setLeadFeedback({ tone: "success", message: mode === "followup" ? "Lead créé et relance planifiée." : mode === "qualify" ? "Lead créé et qualifié dans la source réelle." : "Lead créé et synchronisé." })
    } catch (submitError) {
      setLeadFeedback({ tone: "error", message: submitError instanceof Error ? submitError.message : "Création impossible" })
    } finally {
      setSaving(false)
    }
  }

  function openOverlay(kind: Exclude<OverlayKind, null>, leadIds = selectedIds) {
    if (kind === "import") setImportDraft(initialImportDraft())
    if (kind === "assign") setAssignDraft(initialAssignDraft(leadIds))
    if (kind === "source") setSourceDraft(initialSourceDraft(leadIds))
    if (kind === "export") setExportDraft(initialExportDraft())
    setOverlay(kind)
    setMessage(null)
    setDataError(null)
  }

  async function patchLead(id: string, patch: AnyRow) {
    return apiRequest(`/api/market-os/ambassadors/leads/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    })
  }

  async function assignLeads() {
    if (!assignDraft.leadIds.length || !assignDraft.ambassadorId) {
      setDataError("Sélectionnez au moins un lead et un ambassadeur responsable.")
      return
    }
    setSaving(true)
    setDataError(null)
    try {
      const selectedAmbassador = ambassadorById.get(assignDraft.ambassadorId)
      await Promise.all(assignDraft.leadIds.map(async (id) => {
        const lead = leads.find((item) => String(item.id) === id)
        if (!lead) return
        const notes = withMeta(lead, {
          assignment: {
            manager: assignDraft.manager,
            priority: assignDraft.priority,
            reason: assignDraft.reason,
            assignedAt: new Date().toISOString(),
            supportAmbassadorIds: assignDraft.supportAmbassadorIds,
          },
          lastAction: "assignment",
        }, { action: "lead_assignment", actor: assignDraft.manager, note: assignDraft.reason })
        await patchLead(id, {
          ambassador_id: assignDraft.ambassadorId,
          territory_id: assignDraft.territoryId || lead.territory_id || selectedAmbassador?.territory_id || null,
          status: assignDraft.statusAfter,
          next_followup_at: assignDraft.nextFollowupAt || lead.next_followup_at || null,
          notes,
        })
      }))
      await loadData(true)
      onRefresh()
      setSelectedIds([])
      setOverlay(null)
      setMessage(`${assignDraft.leadIds.length} lead(s) affecté(s) et synchronisé(s).`)
    } catch (assignError) {
      setDataError(assignError instanceof Error ? assignError.message : "Affectation impossible")
    } finally {
      setSaving(false)
    }
  }

  async function validateSources() {
    if (!sourceDraft.leadIds.length || !sourceDraft.source || !sourceDraft.validator) {
      setDataError("Sélectionnez les leads, la source et le validateur.")
      return
    }
    setSaving(true)
    setDataError(null)
    try {
      await Promise.all(sourceDraft.leadIds.map(async (id) => {
        const lead = leads.find((item) => String(item.id) === id)
        if (!lead) return
        const notes = withMeta(lead, {
          sourceCampaign: sourceDraft.campaign,
          sourceChannel: sourceDraft.channel,
          referralCode: sourceDraft.referralCode,
          promoCode: sourceDraft.promoCode,
          sourceValidation: {
            status: sourceDraft.decision === "validated" ? "validated" : sourceDraft.decision === "rejected" ? "rejected" : "review",
            validator: sourceDraft.validator,
            validatedAt: new Date().toISOString(),
            proofReference: sourceDraft.proofReference,
            note: sourceDraft.note,
          },
          lastAction: "source_validation",
        }, { action: `source_${sourceDraft.decision}`, actor: sourceDraft.validator, note: sourceDraft.note })
        await patchLead(id, {
          source: sourceDraft.source,
          ambassador_id: sourceDraft.ambassadorId || lead.ambassador_id || null,
          notes,
        })
      }))
      await loadData(true)
      onRefresh()
      setSelectedIds([])
      setOverlay(null)
      setMessage(`Source de ${sourceDraft.leadIds.length} lead(s) contrôlée et journalisée.`)
    } catch (sourceError) {
      setDataError(sourceError instanceof Error ? sourceError.message : "Validation de source impossible")
    } finally {
      setSaving(false)
    }
  }

  async function importLeads() {
    if (!importDraft.rows.length) {
      setDataError("Chargez un fichier CSV contenant au moins une ligne exploitable.")
      return
    }
    setSaving(true)
    setDataError(null)
    const existingPhones = new Set(leads.map((item) => normalizePhone(item.phone)).filter(Boolean))
    const existingEmails = new Set(leads.map((item) => normalize(item.email)).filter(Boolean))
    const batchPhones = new Set<string>()
    const batchEmails = new Set<string>()
    const batchId = `lead-import-${Date.now()}`
    let created = 0
    let skipped = 0
    const errors: string[] = []
    for (let index = 0; index < importDraft.rows.length; index += 1) {
      const row = importDraft.rows[index]
      const name = text(row.lead_name, row.contact_name, row.parent_name, row.nom, row.name)
      const phone = text(row.phone, row.telephone, row.mobile)
      const email = text(row.email, row.mail)
      const phoneKey = normalizePhone(phone)
      const emailKey = normalize(email)
      const duplicate = (phoneKey && (existingPhones.has(phoneKey) || batchPhones.has(phoneKey))) || (emailKey && (existingEmails.has(emailKey) || batchEmails.has(emailKey)))
      if (!name || !phone) {
        skipped += 1
        errors.push(`Ligne ${index + 2}: nom ou téléphone manquant`)
        continue
      }
      if (importDraft.skipDuplicates && duplicate) {
        skipped += 1
        continue
      }
      const ambassador = ambassadors.find((item: AnyRow) => normalize(item.full_name) === normalize(text(row.ambassador, row.ambassador_name)))
      const territory = territories.find((item: AnyRow) => normalize(item.name) === normalize(text(row.territory, row.territory_name)))
      const baseLead = { notes: text(row.notes, row.note) }
      const notes = withMeta(baseLead, {
        sourceCampaign: text(row.campaign, row.campagne),
        referralCode: text(row.referral_code, row.code_referral),
        promoCode: text(row.promo_code, row.code_promo),
        acquisitionCost: numberValue(row.cost, numberValue(row.cout)),
        import: { batchId, filename: importDraft.filename, importedAt: new Date().toISOString(), row: index + 2 },
        lastAction: "csv_import",
      }, { action: "lead_import", actor: "AngelCare OPS", note: importDraft.filename })
      try {
        await apiRequest("/api/market-os/ambassadors/leads", {
          method: "POST",
          body: JSON.stringify({
            lead_name: name,
            parent_name: text(row.parent_name, row.parent, name),
            phone,
            email: email || null,
            city: text(row.city, row.ville, importDraft.cityFallback),
            region: text(row.region),
            zone: text(row.zone, row.quartier),
            source: text(row.source, importDraft.sourceFallback),
            lead_type: text(row.lead_type, row.type, "Parent / famille"),
            status: importDraft.autoQualify ? "qualified" : text(row.status, "new"),
            score: numberValue(row.score, importDraft.autoQualify ? 70 : 0),
            ambassador_id: text(row.ambassador_id, ambassador?.id, importDraft.ambassadorFallback) || null,
            territory_id: text(row.territory_id, territory?.id, importDraft.territoryFallback) || null,
            next_followup_at: text(row.next_followup_at, row.followup_at) || null,
            notes,
          }),
        })
        created += 1
        if (phoneKey) batchPhones.add(phoneKey)
        if (emailKey) batchEmails.add(emailKey)
      } catch (importError) {
        errors.push(`Ligne ${index + 2}: ${importError instanceof Error ? importError.message : "erreur"}`)
      }
    }
    await loadData(true)
    onRefresh()
    setSaving(false)
    if (errors.length && !created) {
      setDataError(errors.slice(0, 4).join(" · "))
      return
    }
    setOverlay(null)
    setMessage(`${created} lead(s) importé(s), ${skipped} ignoré(s)${errors.length ? `, ${errors.length} erreur(s)` : ""}.`)
  }

  function exportLeads() {
    const rows = filteredLeads.filter((lead) => {
      if (exportDraft.status !== "all" && statusKey(lead) !== exportDraft.status) return false
      if (exportDraft.source !== "all" && text(lead.source) !== exportDraft.source) return false
      if (exportDraft.city !== "all" && text(lead.city) !== exportDraft.city) return false
      return true
    })
    const valueFor = (lead: AnyRow, key: string) => {
      if (key === "reference") return leadReference(lead)
      if (key === "lead_name") return leadName(lead)
      if (key === "ambassador") return ambassadorName(lead.ambassador_id)
      if (key === "status") return statusLabels[statusKey(lead)] || statusKey(lead)
      return lead[key] ?? ""
    }
    const stamp = new Date().toISOString().slice(0, 10)
    if (exportDraft.format === "json") {
      const payload = rows.map((lead) => Object.fromEntries(exportDraft.columns.map((key) => [key, valueFor(lead, key)])))
      downloadFile(`angelcare-leads-${stamp}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8")
    } else {
      const header = exportDraft.columns.map((key) => exportColumns.find((item) => item.key === key)?.label || key)
      const csv = [header, ...rows.map((lead) => exportDraft.columns.map((key) => valueFor(lead, key)))].map((row) => row.map(csvEscape).join(",")).join("\n")
      downloadFile(`angelcare-leads-${stamp}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8")
    }
    setOverlay(null)
    setMessage(`${rows.length} lead(s) exporté(s) à partir des données réelles.`)
  }

  async function quickUpdateLead(lead: AnyRow, patch: AnyRow, messageText: string, historyAction: string) {
    if (!lead.id) return
    setSaving(true)
    setDataError(null)
    try {
      await patchLead(String(lead.id), {
        ...patch,
        notes: withMeta(lead, { lastAction: historyAction }, { action: historyAction, actor: "AngelCare OPS", note: messageText }),
      })
      await loadData(true)
      onRefresh()
      setSelectedLead((current) => current?.id === lead.id ? { ...current, ...patch } : current)
      setMessage(messageText)
    } catch (quickError) {
      setDataError(quickError instanceof Error ? quickError.message : "Action impossible")
    } finally {
      setSaving(false)
    }
  }

  async function prepareConversion(lead: AnyRow) {
    const existing = conversions.find((item) => String(item.lead_id || "") === String(lead.id || ""))
    if (existing) {
      setMessage("Une conversion existe déjà pour ce lead.")
      return
    }
    setSaving(true)
    setDataError(null)
    try {
      await apiRequest("/api/market-os/ambassadors/conversions", {
        method: "POST",
        body: JSON.stringify({
          lead_id: lead.id,
          lead_name: leadName(lead),
          parent_name: text(lead.parent_name, leadName(lead)),
          ambassador_id: lead.ambassador_id || null,
          ambassador_name: ambassadorName(lead.ambassador_id),
          territory_id: lead.territory_id || null,
          city: lead.city || null,
          region: lead.region || null,
          offer_name: "À qualifier",
          value: 0,
          currency: "MAD",
          status: "pending",
          score: numberValue(lead.score),
        }),
      })
      await patchLead(String(lead.id), {
        status: "ready_to_convert",
        notes: withMeta(lead, { lastAction: "conversion_handoff" }, { action: "conversion_handoff", actor: "AngelCare OPS" }),
      })
      await loadData(true)
      onRefresh()
      setMessage("Dossier de conversion créé et lead transféré au pipeline conversion.")
    } catch (conversionError) {
      setDataError(conversionError instanceof Error ? conversionError.message : "Transfert conversion impossible")
    } finally {
      setSaving(false)
    }
  }

  const globalError = dataError || error || null
  const globalSuccess = message || success || null

  return (
    <div data-ambassador-leads-route="enterprise-real-sync" className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <div className="mx-auto w-full max-w-none px-5 pb-12 pt-5 2xl:px-7">
        <header className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm shadow-slate-200/60">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.17em] text-blue-700">
                <Target size={13} /> Acquisition ambassadeurs · Source réelle
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Leads & referrals</h1>
              <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">Centralisez chaque prospect, contrôlez l’attribution ambassadeur, sécurisez la source, orchestrez les relances et préparez les conversions sans rupture de données.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <SignalPill tone="emerald">API leads synchronisée</SignalPill>
                <SignalPill tone="blue">Attribution mission & ambassadeur</SignalPill>
                <SignalPill tone="violet">Handoff conversion réel</SignalPill>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <HeaderAction icon={Plus} primary onClick={openLeadModal}>Nouveau lead</HeaderAction>
              <HeaderAction icon={FileSpreadsheet} onClick={() => openOverlay("import")}>Importer leads</HeaderAction>
              <HeaderAction icon={UserRoundCheck} onClick={() => openOverlay("assign")}>Affecter</HeaderAction>
              <HeaderAction icon={ShieldCheck} onClick={() => openOverlay("source")}>Valider source</HeaderAction>
              <HeaderAction icon={Download} onClick={() => openOverlay("export")}>Exporter</HeaderAction>
              <button type="button" onClick={() => void refreshAll()} disabled={refreshing || dataLoading} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-50" title="Actualiser les données">
                <RefreshCw size={18} className={refreshing || dataLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </header>

        {globalError ? <Notice tone="error">{globalError}</Notice> : null}
        {globalSuccess ? <Notice tone="success">{globalSuccess}</Notice> : null}

        <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <MetricCard label="Leads reçus" value={formatNumber(metrics.received)} detail="Source réelle" icon={Users} tone="blue" onClick={() => { resetFilters(); setStatusFilter("all") }} />
          <MetricCard label="Leads qualifiés" value={formatNumber(metrics.qualified)} detail={metrics.received ? `${Math.round((metrics.qualified / metrics.received) * 100)}% du volume` : "0% du volume"} icon={BadgeCheck} tone="emerald" onClick={() => setStatusFilter("qualified")} />
          <MetricCard label="Leads sans suivi" value={formatNumber(metrics.withoutFollowup)} detail="Action à planifier" icon={Clock3} tone="amber" onClick={() => { resetFilters(); setAgeFilter("all") }} />
          <MetricCard label="Leads chauds" value={formatNumber(metrics.hot)} detail="Priorité commerciale" icon={Flame} tone="rose" onClick={() => setStatusFilter("hot")} />
          <MetricCard label="Leads expirants" value={formatNumber(metrics.expiring)} detail="Échéance ≤ 48h" icon={AlertTriangle} tone="amber" onClick={() => setOnlyDue(true)} />
          <MetricCard label="Coût moyen / lead" value={formatMoney(metrics.costPerLead)} detail="Coûts renseignés seulement" icon={CircleDollarSign} tone="cyan" />
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.25fr_repeat(5,minmax(130px,0.55fr))_auto]">
            <SearchField value={query} onChange={setQuery} placeholder="Rechercher lead, téléphone, code promo, ambassadeur…" />
            <FilterSelect label="Ville" value={cityFilter} onChange={setCityFilter} options={[{ value: "all", label: "Toutes" }, ...cities.map((item) => ({ value: item, label: item }))]} />
            <FilterSelect label="Source" value={sourceFilter} onChange={setSourceFilter} options={[{ value: "all", label: "Toutes" }, ...sources.map((item) => ({ value: item, label: item }))]} />
            <FilterSelect label="Ambassadeur" value={ambassadorFilter} onChange={setAmbassadorFilter} options={[{ value: "all", label: "Tous" }, ...ambassadors.map((item: AnyRow) => ({ value: String(item.id), label: text(item.full_name, item.name, "Ambassadeur") }))]} />
            <FilterSelect label="Score" value={scoreFilter} onChange={setScoreFilter} options={[{ value: "all", label: "Tous" }, { value: "high", label: "80–100" }, { value: "medium", label: "50–79" }, { value: "low", label: "0–49" }]} />
            <FilterSelect label="Ancienneté" value={ageFilter} onChange={setAgeFilter} options={[{ value: "all", label: "Toutes" }, { value: "today", label: "Aujourd’hui" }, { value: "7", label: "≤ 7 jours" }, { value: "14", label: "> 14 jours" }]} />
            <FilterSelect label="Statut" value={statusFilter} onChange={setStatusFilter} options={leadStatuses} />
            <button type="button" onClick={() => setAdvancedOpen((value) => !value)} className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700 hover:border-blue-200 hover:text-blue-700"><Filter size={15} /> Avancés</button>
          </div>
          {advancedOpen ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <ToggleFilter checked={onlyDue} onChange={setOnlyDue}>Relances dues</ToggleFilter>
              <ToggleFilter checked={onlyDuplicates} onChange={setOnlyDuplicates}>Doublons détectés</ToggleFilter>
              <ToggleFilter checked={onlyInvalidPhone} onChange={setOnlyInvalidPhone}>Téléphone invalide</ToggleFilter>
              <button type="button" onClick={resetFilters} className="ml-auto rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Réinitialiser</button>
            </div>
          ) : null}
        </section>

        <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_350px]">
          <div className="min-w-0 space-y-4">
            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Registre opérationnel des leads <span className="ml-2 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">{formatNumber(filteredLeads.length)}</span></h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Sélection multiple, qualification, attribution, suivi et transfert conversion.</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedIds.length ? <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-black text-white">{selectedIds.length} sélectionné(s)</span> : null}
                  <FilterSelect label="Afficher" value={String(pageSize)} onChange={(value) => setPageSize(Number(value))} options={[{ value: "10", label: "10 / page" }, { value: "25", label: "25 / page" }, { value: "50", label: "50 / page" }]} compact />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                    <tr>
                      <th className="w-12 px-4 py-3"><input type="checkbox" checked={paginatedLeads.length > 0 && paginatedLeads.every((item) => selectedIds.includes(String(item.id)))} onChange={(event) => {
                        const ids = paginatedLeads.map((item) => String(item.id))
                        setSelectedIds(event.target.checked ? [...new Set([...selectedIds, ...ids])] : selectedIds.filter((id) => !ids.includes(id)))
                      }} /></th>
                      <th className="px-3 py-3">Lead</th><th>Contact</th><th>Ville</th><th>Source</th><th>Ambassadeur</th><th>Score</th><th>Statut</th><th>Prochain suivi</th><th>Âge</th><th className="pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeads.map((lead) => {
                      const status = statusKey(lead)
                      const duplicate = duplicateIds.has(String(lead.id))
                      return (
                        <tr key={String(lead.id)} className="border-t border-slate-100 transition hover:bg-blue-50/30">
                          <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(String(lead.id))} onChange={(event) => setSelectedIds(event.target.checked ? [...new Set([...selectedIds, String(lead.id)])] : selectedIds.filter((id) => id !== String(lead.id)))} /></td>
                          <td className="px-3 py-3"><button type="button" onClick={() => setSelectedLead(lead)} className="text-left"><span className="block font-black text-slate-950">{leadReference(lead)}</span><span className="mt-0.5 block text-xs font-semibold text-slate-500">{text(lead.lead_type, "Lead")}</span></button></td>
                          <td><button type="button" onClick={() => setSelectedLead(lead)} className="text-left"><span className="block font-black text-slate-900">{leadName(lead)}</span><span className="block text-xs font-semibold text-slate-500">{text(lead.phone, lead.email, "Contact manquant")}</span></button></td>
                          <td className="font-bold text-slate-700">{text(lead.city, "—")}<span className="block text-xs font-semibold text-slate-400">{text(lead.zone)}</span></td>
                          <td><span className="inline-flex rounded-lg bg-blue-50 px-2 py-1 text-xs font-black text-blue-700">{text(lead.source, "Non renseignée")}</span></td>
                          <td className="font-bold text-slate-700">{ambassadorName(lead.ambassador_id)}</td>
                          <td><span className={`font-black ${numberValue(lead.score) >= 80 ? "text-emerald-600" : numberValue(lead.score) >= 50 ? "text-amber-600" : "text-rose-600"}`}>{formatNumber(lead.score)}</span>{duplicate ? <span className="ml-2 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-600">Doublon</span> : null}</td>
                          <td><StatusBadge status={status} /></td>
                          <td className={isFollowupDue(lead) ? "font-black text-rose-600" : "font-bold text-slate-700"}>{formatDate(lead.next_followup_at, true)}</td>
                          <td className="font-bold text-slate-600">{ageDays(lead)} j</td>
                          <td className="pr-4"><div className="flex justify-end gap-1.5">
                            <IconButton icon={Eye} label="Ouvrir dossier" onClick={() => setSelectedLead(lead)} />
                            <IconButton icon={Phone} label="Appeler" onClick={() => lead.phone && window.open(`tel:${lead.phone}`)} />
                            <IconButton icon={MessageCircle} label="WhatsApp" onClick={() => { const phone = normalizePhone(lead.phone); if (phone) window.open(`https://wa.me/${phone}`, "_blank") }} />
                            <IconButton icon={MoreHorizontal} label="Affecter" onClick={() => openOverlay("assign", [String(lead.id)])} />
                          </div></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {!dataLoading && !paginatedLeads.length ? <EmptyState icon={Inbox} title="Aucun lead réel dans ce périmètre" detail="Créez un lead, ajustez les filtres ou synchronisez la source. Aucun enregistrement de démonstration n’est injecté." action="Nouveau lead" onAction={openLeadModal} /> : null}
              {dataLoading || loading ? <div className="grid min-h-[240px] place-items-center"><Loader2 className="animate-spin text-blue-600" size={28} /></div> : null}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs font-bold text-slate-500">
                <span>{filteredLeads.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredLeads.length)} sur ${filteredLeads.length}` : "0 lead"}</span>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Précédent</button>
                  <span className="px-3">{page} / {totalPages}</span>
                  <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Suivant</button>
                </div>
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-2">
              <SourcePerformancePanel rows={sourcePerformance} total={leads.length} />
              <FunnelPanel funnel={funnel} />
            </div>
          </div>

          <aside className="space-y-4">
            <SidePanel title="File d’attente — à traiter aujourd’hui" count={todayQueue.length} action="Voir tous" onAction={() => { resetFilters(); setOnlyDue(true) }}>
              {todayQueue.length ? todayQueue.map((lead) => (
                <button type="button" key={String(lead.id)} onClick={() => setSelectedLead(lead)} className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-slate-50">
                  <span className="min-w-0"><span className="block truncate text-sm font-black text-slate-900">{leadName(lead)}</span><span className="block text-xs font-semibold text-slate-500">{ambassadorName(lead.ambassador_id)} · {ageDays(lead)} j</span></span>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black ${numberValue(lead.score) >= 80 ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>{numberValue(lead.score) >= 80 ? "Haute" : "Moyenne"}</span>
                  <Phone size={15} className="shrink-0 text-blue-700" />
                </button>
              )) : <MiniEmpty>Pas de relance due aujourd’hui.</MiniEmpty>}
            </SidePanel>

            <SidePanel title="Contrôle qualité & risques" count={risks.reduce((sum, item) => sum + item.value, 0)} action="Contrôler" onAction={() => setAdvancedOpen(true)}>
              {risks.map((item) => <RiskRow key={item.label} {...item} onClick={() => {
                if (item.filter === "duplicates") setOnlyDuplicates(true)
                if (item.filter === "invalidPhone") setOnlyInvalidPhone(true)
                if (item.filter === "inactive") setAgeFilter("14")
                setAdvancedOpen(true)
              }} />)}
            </SidePanel>

            <SidePanel title="Referrals en attente de validation" count={pendingReferrals.length} action="Valider" onAction={() => openOverlay("source", pendingReferrals.map((item) => String(item.id)))}>
              {pendingReferrals.length ? pendingReferrals.map((lead) => (
                <button type="button" key={String(lead.id)} onClick={() => openOverlay("source", [String(lead.id)])} className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-slate-50">
                  <span><span className="block text-sm font-black text-slate-900">{leadReference(lead)}</span><span className="block text-xs font-semibold text-slate-500">{leadName(lead)} · {text(lead.city, "—")}</span></span>
                  <span className="text-[10px] font-black text-blue-700">{formatDate(lead.created_at)}</span>
                </button>
              )) : <MiniEmpty>Aucun referral en attente.</MiniEmpty>}
            </SidePanel>
          </aside>
        </div>
      </div>

      {leadModalOpen ? (
        <AmbassadorLeadQualificationModal
          busy={saving}
          form={leadForm}
          snapshot={snapshot}
          onChange={(key, value) => setLeadForm((current) => ({ ...current, [key]: value }))}
          onSubmit={(mode) => void submitLead(mode)}
          onClose={() => setLeadModalOpen(false)}
          feedback={leadFeedback}
        />
      ) : null}

      {overlay === "import" ? <ImportLeadsModal draft={importDraft} setDraft={setImportDraft} fileInputRef={fileInputRef} ambassadors={ambassadors} territories={territories} saving={saving} error={dataError} onClose={() => setOverlay(null)} onSubmit={() => void importLeads()} /> : null}
      {overlay === "assign" ? <AssignLeadsModal draft={assignDraft} setDraft={setAssignDraft} leads={leads} ambassadors={ambassadors} territories={territories} saving={saving} error={dataError} onClose={() => setOverlay(null)} onSubmit={() => void assignLeads()} /> : null}
      {overlay === "source" ? <SourceValidationModal draft={sourceDraft} setDraft={setSourceDraft} leads={leads} ambassadors={ambassadors} saving={saving} error={dataError} onClose={() => setOverlay(null)} onSubmit={() => void validateSources()} /> : null}
      {overlay === "export" ? <ExportLeadsModal draft={exportDraft} setDraft={setExportDraft} count={filteredLeads.length} cities={cities} sources={sources} onClose={() => setOverlay(null)} onSubmit={exportLeads} /> : null}
      {selectedLead ? <LeadDossierDrawer lead={selectedLead} meta={parseMeta(selectedLead.notes)} ambassador={ambassadorById.get(String(selectedLead.ambassador_id || ""))} territory={territoryById.get(String(selectedLead.territory_id || ""))} audit={(snapshot.audit || []).filter((item: AnyRow) => String(item.entity_id || item.record_id || "") === String(selectedLead.id)).slice(0, 10)} saving={saving} onClose={() => setSelectedLead(null)} onAssign={() => openOverlay("assign", [String(selectedLead.id)])} onValidateSource={() => openOverlay("source", [String(selectedLead.id)])} onStatus={(status) => void quickUpdateLead(selectedLead, { status, qualified_at: status === "qualified" ? new Date().toISOString() : selectedLead.qualified_at }, `Lead passé au statut ${statusLabels[status] || status}.`, `status_${status}`)} onFollowup={(value) => void quickUpdateLead(selectedLead, { next_followup_at: value, status: "follow_up" }, "Relance planifiée et synchronisée.", "followup_scheduled")} onConversion={() => void prepareConversion(selectedLead)} /> : null}
    </div>
  )
}

function HeaderAction({ icon: Icon, primary, children, onClick }: { icon: IconType; primary?: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-black shadow-sm transition ${primary ? "bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700" : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"}`}><Icon size={16} />{children}</button>
}

function SignalPill({ tone, children }: { tone: "emerald" | "blue" | "violet"; children: ReactNode }) {
  const classes = tone === "emerald" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : tone === "violet" ? "border-violet-100 bg-violet-50 text-violet-700" : "border-blue-100 bg-blue-50 text-blue-700"
  return <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${classes}`}>{children}</span>
}

function Notice({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  return <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{children}</div>
}

function MetricCard({ label, value, detail, icon: Icon, tone, onClick }: { label: string; value: string; detail: string; icon: IconType; tone: string; onClick?: () => void }) {
  const tones: Record<string, string> = { blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700", cyan: "bg-cyan-50 text-cyan-700" }
  const content = <><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div><div className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone] || tones.blue}`}><Icon size={19} /></div></div><p className="mt-2 text-xs font-bold text-slate-500">{detail}</p></>
  return onClick ? <button type="button" onClick={onClick} className="rounded-[22px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">{content}</button> : <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">{content}</div>
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 px-3"><Search size={16} className="text-slate-400" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400" /></label>
}

function FilterSelect({ label, value, onChange, options, compact }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; compact?: boolean }) {
  return <label className={compact ? "block min-w-[120px]" : "block"}>{compact ? null : <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">{label}</span>}<div className="relative"><select value={value} onChange={(event) => onChange(event.target.value)} className={`w-full appearance-none rounded-xl border border-slate-200 bg-white pr-8 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 ${compact ? "h-9 px-3" : "h-11 px-3"}`}>{options.map((option) => <option key={`${label}-${option.value}`} value={option.value}>{option.label}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /></div></label>
}

function ToggleFilter({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: ReactNode }) {
  return <button type="button" onClick={() => onChange(!checked)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black ${checked ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"}`}><span className={`grid h-4 w-4 place-items-center rounded border ${checked ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"}`}>{checked ? <Check size={11} /> : null}</span>{children}</button>
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${statusTone(status)}`}>{statusLabels[status] || status}</span>
}

function IconButton({ icon: Icon, label, onClick }: { icon: IconType; label: string; onClick: () => void }) {
  return <button type="button" title={label} onClick={onClick} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-700"><Icon size={14} /></button>
}

function EmptyState({ icon: Icon, title, detail, action, onAction }: { icon: IconType; title: string; detail: string; action: string; onAction: () => void }) {
  return <div className="grid min-h-[290px] place-items-center px-6 py-10 text-center"><div><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Icon size={23} /></div><h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3><p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">{detail}</p><button type="button" onClick={onAction} className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">{action}</button></div></div>
}

function SidePanel({ title, count, action, onAction, children }: { title: string; count: number; action: string; onAction: () => void; children: ReactNode }) {
  return <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black text-slate-950">{title} <span className="ml-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] text-rose-600">{count}</span></h3><button type="button" onClick={onAction} className="text-[10px] font-black text-blue-700">{action}</button></div><div className="mt-3 space-y-1">{children}</div></section>
}

function MiniEmpty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs font-bold text-slate-400">{children}</div>
}

function RiskRow({ label, value, icon: Icon, tone, onClick }: { label: string; value: number; icon: IconType; tone: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-slate-50"><Icon size={16} className={tone === "rose" ? "text-rose-500" : "text-amber-500"} /><span className="min-w-0 flex-1 text-xs font-bold text-slate-700">{label}</span><span className={tone === "rose" ? "text-xs font-black text-rose-600" : "text-xs font-black text-amber-600"}>{value}</span><ArrowRight size={13} className="text-slate-300" /></button>
}

function SourcePerformancePanel({ rows, total }: { rows: AnyRow[]; total: number }) {
  return <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="text-base font-black text-slate-950">Performance des sources</h3><p className="mt-1 text-xs font-semibold text-slate-500">Volume, qualification, conversion et coût réel renseigné.</p></div><TrendingUp size={19} className="text-blue-700" /></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400"><tr><th className="py-2">Source</th><th>Leads</th><th>Qualifiés</th><th>Conversion</th><th>Coût / lead</th></tr></thead><tbody>{rows.map((row) => <tr key={row.source} className="border-t border-slate-100"><td className="py-3 font-black text-slate-800">{row.source}</td><td className="font-bold">{row.leads}</td><td className="font-bold">{row.qualified}</td><td className="font-bold">{row.leads ? Math.round((row.conversions / row.leads) * 100) : 0}%</td><td className="font-bold">{row.costRows ? formatMoney(row.cost / row.costRows) : "0 Dh"}</td></tr>)}</tbody></table></div>{!rows.length ? <MiniEmpty>Aucune source réelle à analyser.</MiniEmpty> : <p className="mt-3 text-[10px] font-bold text-slate-400">{total} lead(s) analysé(s).</p>}</section>
}

function FunnelPanel({ funnel }: { funnel: { received: number; qualified: number; negotiating: number; ready: number } }) {
  const max = Math.max(1, funnel.received)
  const steps = [
    { label: "Leads reçus", value: funnel.received, tone: "bg-blue-600" },
    { label: "Leads qualifiés", value: funnel.qualified, tone: "bg-violet-600" },
    { label: "Leads en négociation", value: funnel.negotiating, tone: "bg-emerald-600" },
    { label: "Prêts à convertir", value: funnel.ready, tone: "bg-amber-500" },
  ]
  return <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="text-base font-black text-slate-950">Qualité & préparation à la conversion</h3><p className="mt-1 text-xs font-semibold text-slate-500">Funnel calculé uniquement sur les statuts réels.</p></div><Gauge size={19} className="text-violet-700" /></div><div className="mt-5 space-y-3">{steps.map((step) => <div key={step.label} className="grid grid-cols-[150px_minmax(0,1fr)_55px] items-center gap-3"><span className="text-xs font-black text-slate-700">{step.label}</span><div className="h-8 overflow-hidden rounded-lg bg-slate-100"><div className={`flex h-full items-center justify-end px-3 text-xs font-black text-white ${step.tone}`} style={{ width: `${Math.max(step.value ? 12 : 0, Math.round((step.value / max) * 100))}%` }}>{step.value || ""}</div></div><span className="text-right text-xs font-black text-slate-600">{max ? Math.round((step.value / max) * 100) : 0}%</span></div>)}</div></section>
}

function EnterpriseModal({ title, subtitle, icon: Icon, onClose, children, footer, width = "max-w-[1580px]" }: { title: string; subtitle: string; icon: IconType; onClose: () => void; children: ReactNode; footer: ReactNode; width?: string }) {
  return (
    <>
      <style>{`
        [data-leads-enterprise-modal="black-typography"],
        [data-leads-enterprise-modal="black-typography"] * {
          color: #020617 !important;
          -webkit-text-fill-color: #020617 !important;
          text-shadow: none !important;
        }

        [data-leads-enterprise-modal="black-typography"] h1,
        [data-leads-enterprise-modal="black-typography"] h2,
        [data-leads-enterprise-modal="black-typography"] h3,
        [data-leads-enterprise-modal="black-typography"] h4,
        [data-leads-enterprise-modal="black-typography"] h5,
        [data-leads-enterprise-modal="black-typography"] h6,
        [data-leads-enterprise-modal="black-typography"] [role="heading"] {
          color: #020617 !important;
          -webkit-text-fill-color: #020617 !important;
          font-weight: 900 !important;
          opacity: 1 !important;
        }

        [data-leads-enterprise-modal="black-typography"] p,
        [data-leads-enterprise-modal="black-typography"] span,
        [data-leads-enterprise-modal="black-typography"] label,
        [data-leads-enterprise-modal="black-typography"] legend,
        [data-leads-enterprise-modal="black-typography"] th,
        [data-leads-enterprise-modal="black-typography"] td,
        [data-leads-enterprise-modal="black-typography"] li,
        [data-leads-enterprise-modal="black-typography"] small,
        [data-leads-enterprise-modal="black-typography"] strong,
        [data-leads-enterprise-modal="black-typography"] button,
        [data-leads-enterprise-modal="black-typography"] a,
        [data-leads-enterprise-modal="black-typography"] input,
        [data-leads-enterprise-modal="black-typography"] select,
        [data-leads-enterprise-modal="black-typography"] textarea,
        [data-leads-enterprise-modal="black-typography"] option {
          color: #020617 !important;
          -webkit-text-fill-color: #020617 !important;
          font-weight: 700 !important;
          opacity: 1 !important;
        }

        [data-leads-enterprise-modal="black-typography"] input::placeholder,
        [data-leads-enterprise-modal="black-typography"] textarea::placeholder {
          color: #334155 !important;
          -webkit-text-fill-color: #334155 !important;
          font-weight: 700 !important;
          opacity: 1 !important;
        }
      `}</style>

      <div
        data-leads-enterprise-modal="black-typography"
        className="fixed inset-x-0 bottom-0 z-[120] flex items-center justify-center bg-slate-950/35 px-3 py-3 backdrop-blur-sm"
        style={{ top: "var(--angelcare-overhead-height, 96px)" }}
      >
        <div className={`flex h-[calc(100dvh-var(--angelcare-overhead-height,96px)-24px)] w-full ${width} flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl`}>
          <header className="flex items-start justify-between gap-5 border-b border-slate-100 bg-white px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700">
                <Icon size={19} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">{title}</h2>
                <p className="mt-1 max-w-4xl text-sm font-bold leading-6 text-slate-950">{subtitle}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-950 hover:bg-slate-50">
              <X size={16} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto bg-[#f6f8fc] px-6 py-5">{children}</div>
          <footer className="border-t border-slate-100 bg-white px-6 py-4">{footer}</footer>
        </div>
      </div>
    </>
  )
}

function ModalError({ error }: { error?: string | null }) {
  return error ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null
}

const fieldClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
const textareaClass = "min-h-[110px] w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-600">{label}</span><div className="mt-2">{children}</div>{hint ? <span className="mt-1 block text-[10px] font-semibold text-slate-400">{hint}</span> : null}</label>
}

function ModalButton({ children, onClick, primary, disabled, icon: Icon }: { children: ReactNode; onClick: () => void; primary?: boolean; disabled?: boolean; icon?: IconType }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 ${primary ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "border border-slate-200 bg-white text-slate-700"}`}>{Icon ? <Icon size={16} /> : null}{children}</button>
}

function ImportLeadsModal({ draft, setDraft, fileInputRef, ambassadors, territories, saving, error, onClose, onSubmit }: { draft: ImportDraft; setDraft: (value: ImportDraft) => void; fileInputRef: { current: HTMLInputElement | null }; ambassadors: AnyRow[]; territories: AnyRow[]; saving: boolean; error?: string | null; onClose: () => void; onSubmit: () => void }) {
  return <EnterpriseModal title="Importer des leads" subtitle="Import CSV contrôlé, prévention des doublons, fallback d’attribution et création réelle ligne par ligne avec traçabilité de lot." icon={FileSpreadsheet} onClose={onClose} footer={<div className="flex flex-wrap items-center justify-between gap-3"><div className="text-xs font-bold text-slate-500">{draft.rows.length} ligne(s) chargée(s) · {draft.skipDuplicates ? "Doublons ignorés" : "Doublons autorisés"}</div><div className="flex gap-2"><ModalButton onClick={onClose}>Annuler</ModalButton><ModalButton primary icon={saving ? Loader2 : FileSpreadsheet} disabled={saving || !draft.rows.length} onClick={onSubmit}>{saving ? "Import en cours…" : "Importer dans la source réelle"}</ModalButton></div></div>}>
    <ModalError error={error} />
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-5">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-slate-950">1. Fichier et règles d’entrée</h3><p className="mt-1 text-xs font-semibold text-slate-500">Colonnes reconnues: lead_name, phone, email, city, source, lead_type, score, ambassador, territory, next_followup_at, notes, promo_code, referral_code.</p><input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; const content = await file.text(); setDraft({ ...draft, filename: file.name, rows: parseCsv(content) }) }} /><button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 flex min-h-[145px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-5 text-center text-blue-700"><FileSpreadsheet size={28} /><span className="mt-2 text-sm font-black">{draft.filename || "Choisir un fichier CSV"}</span><span className="mt-1 text-xs font-semibold">Aucune donnée n’est créée avant validation finale.</span></button><div className="mt-4 grid gap-3 md:grid-cols-2"><ToggleFilter checked={draft.skipDuplicates} onChange={(value) => setDraft({ ...draft, skipDuplicates: value })}>Ignorer les doublons</ToggleFilter><ToggleFilter checked={draft.autoQualify} onChange={(value) => setDraft({ ...draft, autoQualify: value })}>Qualifier automatiquement</ToggleFilter></div></section>
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-slate-950">2. Valeurs par défaut</h3><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Ville fallback"><input className={fieldClass} value={draft.cityFallback} onChange={(event) => setDraft({ ...draft, cityFallback: event.target.value })} /></Field><Field label="Source fallback"><select className={fieldClass} value={draft.sourceFallback} onChange={(event) => setDraft({ ...draft, sourceFallback: event.target.value })}>{sourceOptions.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Ambassadeur fallback"><select className={fieldClass} value={draft.ambassadorFallback} onChange={(event) => setDraft({ ...draft, ambassadorFallback: event.target.value })}><option value="">Non affecté</option>{ambassadors.map((item) => <option key={item.id} value={item.id}>{text(item.full_name, item.name)}</option>)}</select></Field><Field label="Territoire fallback"><select className={fieldClass} value={draft.territoryFallback} onChange={(event) => setDraft({ ...draft, territoryFallback: event.target.value })}><option value="">Aucun</option>{territories.map((item) => <option key={item.id} value={item.id}>{text(item.name)}</option>)}</select></Field></div></section>
      </div>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="text-lg font-black text-slate-950">Prévisualisation contrôlée</h3><p className="mt-1 text-xs font-semibold text-slate-500">Les 12 premières lignes sont affichées avant création.</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{draft.rows.length} ligne(s)</span></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-3 py-3">Nom</th><th>Téléphone</th><th>Email</th><th>Ville</th><th>Source</th><th>Score</th></tr></thead><tbody>{draft.rows.slice(0, 12).map((row, index) => <tr key={index} className="border-t border-slate-100"><td className="px-3 py-3 font-black">{text(row.lead_name, row.contact_name, row.parent_name, row.nom, row.name, "—")}</td><td>{text(row.phone, row.telephone, "—")}</td><td>{text(row.email, "—")}</td><td>{text(row.city, row.ville, draft.cityFallback)}</td><td>{text(row.source, draft.sourceFallback)}</td><td>{text(row.score, "0")}</td></tr>)}</tbody></table></div>{!draft.rows.length ? <EmptyState icon={FileSpreadsheet} title="Aucun fichier chargé" detail="Chargez un CSV pour contrôler les lignes avant synchronisation." action="Choisir un fichier" onAction={() => fileInputRef.current?.click()} /> : null}</section>
    </div>
  </EnterpriseModal>
}

function LeadSelector({ leads, selected, onChange }: { leads: AnyRow[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const [search, setSearch] = useState("")
  const visible = leads.filter((lead) => normalize([leadName(lead), lead.phone, lead.city, lead.source].join(" ")).includes(normalize(search))).slice(0, 120)
  return <div><SearchField value={search} onChange={setSearch} placeholder="Rechercher les leads à traiter…" /><div className="mt-3 max-h-[430px] space-y-2 overflow-y-auto pr-1">{visible.map((lead) => { const id = String(lead.id); const checked = selected.includes(id); return <button type="button" key={id} onClick={() => onChange(checked ? selected.filter((item) => item !== id) : [...selected, id])} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${checked ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}><span className={`grid h-5 w-5 place-items-center rounded border ${checked ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"}`}>{checked ? <Check size={12} /> : null}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-slate-900">{leadName(lead)}</span><span className="block text-xs font-semibold text-slate-500">{leadReference(lead)} · {text(lead.city, "—")} · {statusLabels[statusKey(lead)]}</span></span><span className="text-sm font-black text-blue-700">{formatNumber(lead.score)}</span></button>})}</div></div>
}

function AssignLeadsModal({ draft, setDraft, leads, ambassadors, territories, saving, error, onClose, onSubmit }: { draft: AssignDraft; setDraft: (value: AssignDraft) => void; leads: AnyRow[]; ambassadors: AnyRow[]; territories: AnyRow[]; saving: boolean; error?: string | null; onClose: () => void; onSubmit: () => void }) {
  const ambassador = ambassadors.find((item) => String(item.id) === draft.ambassadorId)
  const activeMissions = ambassador ? numberValue(ambassador.missions_assigned) - numberValue(ambassador.missions_completed) : 0
  const readiness = Math.min(100, (draft.leadIds.length ? 25 : 0) + (draft.ambassadorId ? 30 : 0) + (draft.manager ? 15 : 0) + (draft.nextFollowupAt ? 15 : 0) + (draft.reason ? 15 : 0))
  return <EnterpriseModal title="Affecter des leads" subtitle="Composez une attribution contrôlée: sélection réelle, ambassadeur responsable, renforts, territoire, priorité, relance et trace managériale." icon={UserRoundCheck} onClose={onClose} footer={<div className="flex flex-wrap items-center justify-between gap-3"><div className="text-xs font-bold text-slate-500">Readiness {readiness}% · {draft.leadIds.length} lead(s) · charge ambassadeur {activeMissions} mission(s) active(s)</div><div className="flex gap-2"><ModalButton onClick={onClose}>Fermer</ModalButton><ModalButton primary icon={saving ? Loader2 : UserCheck} disabled={saving || !draft.leadIds.length || !draft.ambassadorId} onClick={onSubmit}>{saving ? "Affectation…" : "Affecter et synchroniser"}</ModalButton></div></div>}>
    <ModalError error={error} />
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr_0.8fr]">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-slate-950">1. Leads à affecter</h3><p className="mt-1 text-xs font-semibold text-slate-500">Sélectionnez un ou plusieurs dossiers réels.</p><div className="mt-4"><LeadSelector leads={leads} selected={draft.leadIds} onChange={(leadIds) => setDraft({ ...draft, leadIds })} /></div></section>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-slate-950">2. Équipe commerciale</h3><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Ambassadeur responsable *"><select className={fieldClass} value={draft.ambassadorId} onChange={(event) => setDraft({ ...draft, ambassadorId: event.target.value })}><option value="">Choisir</option>{ambassadors.map((item) => <option key={item.id} value={item.id}>{text(item.full_name, item.name)} · {text(item.city, "Ville N/D")}</option>)}</select></Field><Field label="Territoire"><select className={fieldClass} value={draft.territoryId} onChange={(event) => setDraft({ ...draft, territoryId: event.target.value })}><option value="">Territoire de l’ambassadeur</option>{territories.map((item) => <option key={item.id} value={item.id}>{text(item.name)} · {text(item.city)}</option>)}</select></Field><Field label="Priorité"><select className={fieldClass} value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}><option>Critique</option><option>Haute</option><option>Normale</option><option>Faible</option></select></Field><Field label="Statut après affectation"><select className={fieldClass} value={draft.statusAfter} onChange={(event) => setDraft({ ...draft, statusAfter: event.target.value })}><option value="contacted">À contacter</option><option value="follow_up">À relancer</option><option value="qualified">Qualifié</option><option value="hot">Chaud</option></select></Field><Field label="Prochain suivi"><input type="datetime-local" className={fieldClass} value={draft.nextFollowupAt} onChange={(event) => setDraft({ ...draft, nextFollowupAt: event.target.value })} /></Field><Field label="Manager / owner"><input className={fieldClass} value={draft.manager} onChange={(event) => setDraft({ ...draft, manager: event.target.value })} /></Field></div><div className="mt-4"><Field label="Ambassadeurs support" hint="Optionnel: trace de support commercial sans remplacer le responsable principal."><div className="grid gap-2 md:grid-cols-2">{ambassadors.filter((item) => String(item.id) !== draft.ambassadorId).slice(0, 12).map((item) => { const id = String(item.id); const checked = draft.supportAmbassadorIds.includes(id); return <button type="button" key={id} onClick={() => setDraft({ ...draft, supportAmbassadorIds: checked ? draft.supportAmbassadorIds.filter((value) => value !== id) : [...draft.supportAmbassadorIds, id] })} className={`rounded-xl border px-3 py-2 text-left text-xs font-bold ${checked ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}>{text(item.full_name, item.name)}</button> })}</div></Field></div><div className="mt-4"><Field label="Motif et instructions"><textarea className={textareaClass} value={draft.reason} onChange={(event) => setDraft({ ...draft, reason: event.target.value })} /></Field></div></section>
      <aside className="space-y-4"><section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">Readiness attribution</p><p className="mt-2 text-4xl font-black text-slate-950">{readiness}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${readiness}%` }} /></div></section><section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-base font-black text-slate-950">Contrôles opérationnels</h3><div className="mt-3 space-y-2"><CheckRow done={draft.leadIds.length > 0} label="Lead(s) sélectionné(s)" /><CheckRow done={Boolean(draft.ambassadorId)} label="Responsable défini" /><CheckRow done={Boolean(draft.nextFollowupAt)} label="Relance datée" /><CheckRow done={Boolean(draft.manager)} label="Owner identifié" /><CheckRow done={activeMissions <= 3} label={`Charge acceptable (${activeMissions} mission(s))`} /></div></section></aside>
    </div>
  </EnterpriseModal>
}

function SourceValidationModal({ draft, setDraft, leads, ambassadors, saving, error, onClose, onSubmit }: { draft: SourceDraft; setDraft: (value: SourceDraft) => void; leads: AnyRow[]; ambassadors: AnyRow[]; saving: boolean; error?: string | null; onClose: () => void; onSubmit: () => void }) {
  const readiness = Math.min(100, (draft.leadIds.length ? 25 : 0) + (draft.source ? 20 : 0) + (draft.validator ? 20 : 0) + (draft.proofReference || draft.note ? 20 : 0) + (draft.ambassadorId || draft.referralCode || draft.promoCode ? 15 : 0))
  return <EnterpriseModal title="Valider la source et l’attribution" subtitle="Contrôle referral, code promo, campagne, ambassadeur source et preuve avant verrouillage de l’attribution commerciale." icon={ShieldCheck} onClose={onClose} footer={<div className="flex flex-wrap items-center justify-between gap-3"><div className="text-xs font-bold text-slate-500">Readiness {readiness}% · décision {draft.decision}</div><div className="flex gap-2"><ModalButton onClick={onClose}>Fermer</ModalButton><ModalButton primary icon={saving ? Loader2 : ShieldCheck} disabled={saving || !draft.leadIds.length || !draft.validator} onClick={onSubmit}>{saving ? "Validation…" : "Valider et journaliser"}</ModalButton></div></div>}>
    <ModalError error={error} />
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr_0.75fr]">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-slate-950">1. Périmètre de contrôle</h3><div className="mt-4"><LeadSelector leads={leads} selected={draft.leadIds} onChange={(leadIds) => setDraft({ ...draft, leadIds })} /></div></section>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-slate-950">2. Source, codes et preuve</h3><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Source canonique"><select className={fieldClass} value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })}>{sourceOptions.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Canal d’origine"><input className={fieldClass} value={draft.channel} onChange={(event) => setDraft({ ...draft, channel: event.target.value })} /></Field><Field label="Ambassadeur source"><select className={fieldClass} value={draft.ambassadorId} onChange={(event) => setDraft({ ...draft, ambassadorId: event.target.value })}><option value="">Non attribué</option>{ambassadors.map((item) => <option key={item.id} value={item.id}>{text(item.full_name, item.name)}</option>)}</select></Field><Field label="Campagne"><input className={fieldClass} value={draft.campaign} onChange={(event) => setDraft({ ...draft, campaign: event.target.value })} /></Field><Field label="Code referral"><input className={fieldClass} value={draft.referralCode} onChange={(event) => setDraft({ ...draft, referralCode: event.target.value })} /></Field><Field label="Code promo"><input className={fieldClass} value={draft.promoCode} onChange={(event) => setDraft({ ...draft, promoCode: event.target.value })} /></Field><Field label="Décision"><select className={fieldClass} value={draft.decision} onChange={(event) => setDraft({ ...draft, decision: event.target.value as SourceDraft["decision"] })}><option value="validated">Valider</option><option value="review">Revue complémentaire</option><option value="rejected">Rejeter la source</option></select></Field><Field label="Validateur"><input className={fieldClass} value={draft.validator} onChange={(event) => setDraft({ ...draft, validator: event.target.value })} /></Field><Field label="Référence de preuve"><input className={fieldClass} value={draft.proofReference} onChange={(event) => setDraft({ ...draft, proofReference: event.target.value })} placeholder="Lien, capture, formulaire, référence campagne…" /></Field></div><div className="mt-4"><Field label="Note de décision"><textarea className={textareaClass} value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} /></Field></div></section>
      <aside className="space-y-4"><section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Score de validation</p><p className="mt-2 text-4xl font-black text-slate-950">{readiness}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${readiness}%` }} /></div></section><section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-base font-black text-slate-950">Garde-fous attribution</h3><div className="mt-3 space-y-2"><CheckRow done={draft.leadIds.length > 0} label="Périmètre défini" /><CheckRow done={Boolean(draft.source)} label="Source normalisée" /><CheckRow done={Boolean(draft.validator)} label="Validateur nommé" /><CheckRow done={Boolean(draft.ambassadorId || draft.referralCode || draft.promoCode)} label="Attribution traçable" /><CheckRow done={Boolean(draft.proofReference || draft.note)} label="Preuve ou justification" /></div></section></aside>
    </div>
  </EnterpriseModal>
}

function ExportLeadsModal({ draft, setDraft, count, cities, sources, onClose, onSubmit }: { draft: ExportDraft; setDraft: (value: ExportDraft) => void; count: number; cities: string[]; sources: string[]; onClose: () => void; onSubmit: () => void }) {
  return <EnterpriseModal title="Exporter le pipeline leads" subtitle="Composez un export CSV opérationnel ou JSON structuré à partir des seuls enregistrements réels du périmètre filtré." icon={Download} onClose={onClose} width="max-w-[1180px]" footer={<div className="flex flex-wrap items-center justify-between gap-3"><div className="text-xs font-bold text-slate-500">Jusqu’à {count} lead(s) · {draft.columns.length} colonne(s)</div><div className="flex gap-2"><ModalButton onClick={onClose}>Annuler</ModalButton><ModalButton primary icon={Download} disabled={!draft.columns.length} onClick={onSubmit}>Générer l’export</ModalButton></div></div>}>
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-slate-950">Périmètre et format</h3><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Format"><select className={fieldClass} value={draft.format} onChange={(event) => setDraft({ ...draft, format: event.target.value as ExportDraft["format"] })}><option value="csv">CSV opérationnel</option><option value="json">JSON structuré</option></select></Field><Field label="Statut"><select className={fieldClass} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>{leadStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field><Field label="Source"><select className={fieldClass} value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })}><option value="all">Toutes</option>{sources.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Ville"><select className={fieldClass} value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })}><option value="all">Toutes</option>{cities.map((item) => <option key={item}>{item}</option>)}</select></Field></div></section><section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-slate-950">Colonnes du rapport</h3><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{exportColumns.map((column) => { const checked = draft.columns.includes(column.key); return <button type="button" key={column.key} onClick={() => setDraft({ ...draft, columns: checked ? draft.columns.filter((item) => item !== column.key) : [...draft.columns, column.key] })} className={`flex items-center gap-3 rounded-2xl border p-3 text-left text-sm font-black ${checked ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}><span className={`grid h-5 w-5 place-items-center rounded border ${checked ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"}`}>{checked ? <Check size={12} /> : null}</span>{column.label}</button> })}</div></section></div>
  </EnterpriseModal>
}

function CheckRow({ done, label }: { done: boolean; label: string }) {
  return <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">{done ? <CheckCircle2 size={15} className="text-emerald-600" /> : <AlertTriangle size={15} className="text-amber-500" />}{label}</div>
}

function LeadDossierDrawer({ lead, meta, ambassador, territory, audit, saving, onClose, onAssign, onValidateSource, onStatus, onFollowup, onConversion }: { lead: AnyRow; meta: LeadMeta; ambassador?: AnyRow; territory?: AnyRow; audit: AnyRow[]; saving: boolean; onClose: () => void; onAssign: () => void; onValidateSource: () => void; onStatus: (status: string) => void; onFollowup: (value: string) => void; onConversion: () => void }) {
  const [followup, setFollowup] = useState(toDateTimeLocal(lead.next_followup_at))
  const history = meta.history || []
  return <div className="fixed inset-x-0 bottom-0 z-[115] bg-slate-950/25 backdrop-blur-sm" style={{ top: "var(--angelcare-overhead-height, 96px)" }}><aside className="ml-auto flex h-full w-full max-w-[720px] flex-col border-l border-slate-200 bg-[#f7f9fc] shadow-2xl"><header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5"><div><div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Dossier lead 360</div><h2 className="mt-1 text-2xl font-black text-slate-950">{leadName(lead)}</h2><p className="mt-1 text-sm font-semibold text-slate-500">{leadReference(lead)} · {text(lead.city, "Ville non renseignée")} · {text(lead.source, "Source N/D")}</p></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 text-slate-500"><X size={16} /></button></header><div className="flex-1 space-y-4 overflow-y-auto p-5"><div className="grid gap-3 sm:grid-cols-3"><MiniMetric label="Score" value={`${formatNumber(lead.score)}/100`} /><MiniMetric label="Statut" value={statusLabels[statusKey(lead)] || statusKey(lead)} /><MiniMetric label="Âge dossier" value={`${ageDays(lead)} j`} /></div><section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-base font-black text-slate-950">Identité & contact</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><InfoRow label="Téléphone" value={text(lead.phone, "Manquant")} /><InfoRow label="Email" value={text(lead.email, "Manquant")} /><InfoRow label="Ville / zone" value={`${text(lead.city, "—")} · ${text(lead.zone, "—")}`} /><InfoRow label="Type" value={text(lead.lead_type, "—")} /><InfoRow label="Ambassadeur" value={text(ambassador?.full_name, ambassador?.name, "Non affecté")} /><InfoRow label="Territoire" value={text(territory?.name, "Non affecté")} /></div><div className="mt-4 flex flex-wrap gap-2"><a href={lead.phone ? `tel:${lead.phone}` : undefined} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700"><Phone size={14} /> Appeler</a><a href={lead.phone ? `https://wa.me/${normalizePhone(lead.phone)}` : undefined} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"><MessageCircle size={14} /> WhatsApp</a><a href={lead.email ? `mailto:${lead.email}` : undefined} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700"><Mail size={14} /> Email</a></div></section><section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-base font-black text-slate-950">Qualification & attribution</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><InfoRow label="Besoin" value={text(meta.qualification?.need, "Non renseigné")} /><InfoRow label="Urgence" value={text(meta.qualification?.urgency, "Non renseignée")} /><InfoRow label="Budget" value={text(meta.qualification?.budget, "Non renseigné")} /><InfoRow label="Canal préféré" value={text(meta.qualification?.preferredChannel, "Non renseigné")} /><InfoRow label="Code referral" value={text(meta.referralCode, "—")} /><InfoRow label="Code promo" value={text(meta.promoCode, "—")} /><InfoRow label="Validation source" value={text(meta.sourceValidation?.status, "En attente")} /><InfoRow label="Manager" value={text(meta.assignment?.manager, "—")} /></div></section><section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-base font-black text-slate-950">Prochaine action</h3><div className="mt-4 flex gap-2"><input type="datetime-local" className={fieldClass} value={followup} onChange={(event) => setFollowup(event.target.value)} /><button type="button" disabled={saving || !followup} onClick={() => onFollowup(followup)} className="rounded-xl bg-blue-600 px-4 text-xs font-black text-white disabled:opacity-50">Planifier</button></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => onStatus("qualified")} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Marquer qualifié</button><button type="button" onClick={() => onStatus("hot")} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">Marquer chaud</button><button type="button" onClick={onAssign} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">Affecter / réaffecter</button><button type="button" onClick={onValidateSource} className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">Valider source</button><button type="button" onClick={onConversion} className="sm:col-span-2 rounded-xl bg-slate-950 px-3 py-3 text-xs font-black text-white">Créer le handoff conversion</button></div></section><section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 text-base font-black text-slate-950"><History size={17} /> Historique et audit</h3><div className="mt-4 space-y-3">{[...history].reverse().slice(0, 10).map((item, index) => <div key={`${item.at}-${index}`} className="border-l-2 border-blue-200 pl-3"><p className="text-xs font-black text-slate-800">{item.action}</p><p className="text-[11px] font-semibold text-slate-500">{formatDate(item.at, true)} · {text(item.actor, "Système")}</p>{item.note ? <p className="mt-1 text-xs text-slate-600">{item.note}</p> : null}</div>)}{audit.map((item, index) => <div key={item.id || index} className="border-l-2 border-slate-200 pl-3"><p className="text-xs font-black text-slate-800">{text(item.action, item.event_type, "Audit")}</p><p className="text-[11px] font-semibold text-slate-500">{formatDate(item.created_at, true)}</p></div>)}{!history.length && !audit.length ? <MiniEmpty>Aucun événement auditable enregistré.</MiniEmpty> : null}</div></section></div></aside></div>
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">{label}</p><p className="mt-2 text-xl font-black text-slate-950">{value}</p></div>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 px-3 py-3"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-slate-800">{value}</p></div>
}
