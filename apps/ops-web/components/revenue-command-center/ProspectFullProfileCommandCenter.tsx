"use client"
import { shouldStartAutoRefresh, safeRefreshInterval } from '@/lib/runtime/client-live-governor'

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Crown,
  DatabaseZap,
  Edit3,
  Eye,
  ExternalLink,
  FileText,
  Globe2,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Users,
  X,
  Bell,
  RefreshCcw,
  Link2,
  Layers3,
  Zap,
} from "lucide-react"

import {
  deleteProductionProspect,
  ensureProductionProspect,
  loadProductionProspect,
  loadProductionProspects,
  saveProductionProspect,
  saveProductionProspectsBulk,
} from "@/lib/revenue-command-center/production-prospect-store"

import { useRevenueEntityControls } from "@/lib/revenue-command-center/use-revenue-entity-controls"
import { RevenueEntityControlPanel } from "@/components/revenue-command-center/RevenueEntityControlPanel"
import { ProspectProfileAddTaskModal } from "@/components/revenue-command-center/ProspectProfileAddTaskModal"
import { loadProspectProfileTasks, subscribeProspectProfileTasks } from "@/lib/revenue-command-center/profile-task-modal-store"
import { loadProspectProfileAppointments, subscribeProspectProfileAppointments } from "@/lib/revenue-command-center/profile-appointment-store"
import {
  revenueAddComment,
  revenueAddContact,
  revenueAddDocument,
  revenueCompleteTask,
  revenueCreateTask,
  revenueLoadEntityControls,
  revenueMovePipeline,
  revenueScheduleAppointment,
} from "@/lib/revenue-command-center/revenue-action-engine"

async function loadProspectControlData(prospectId: string) {
  return revenueLoadEntityControls("prospect", prospectId)
}

function subscribeProspectControls(prospectId: string, onChange: () => void) {
  if (typeof window === "undefined") return () => undefined
  if (!shouldStartAutoRefresh()) return
  const timer = window.setInterval(onChange, safeRefreshInterval(15000))
  return () => window.clearInterval(timer)
}

async function createProspectTask(input: {
  prospectId: string
  title: string
  description?: string
  priority?: "low" | "medium" | "high" | "critical" | string
  owner?: string
  dueDate?: string
  prospectSnapshot?: Record<string, unknown>
}) {
  return revenueCreateTask({
    entityId: input.prospectId,
    title: input.title,
    description: input.description,
    priority: (input.priority || "medium") as "low" | "medium" | "high" | "critical",
    owner: input.owner,
    dueDate: input.dueDate,
    prospectSnapshot: input.prospectSnapshot,
  })
}

async function completeProspectTask(taskId: string, prospectId: string, done: boolean) {
  return revenueCompleteTask(taskId, "prospect", prospectId, done)
}

async function scheduleProspectAppointment(input: {
  prospectId: string
  title: string
  appointmentAt: string
  owner?: string
  location?: string
  notes?: string
  prospectSnapshot?: Record<string, unknown>
}) {
  return revenueScheduleAppointment({
    entityId: input.prospectId,
    title: input.title,
    appointmentAt: input.appointmentAt,
    owner: input.owner,
    location: input.location,
    notes: input.notes,
    prospectSnapshot: input.prospectSnapshot,
  })
}

async function addProspectComment(input: {
  prospectId: string
  author?: string
  channel?: string
  note: string
}) {
  return revenueAddComment({
    entityId: input.prospectId,
    author: input.author,
    channel: input.channel,
    note: input.note,
  })
}

async function addProspectDocument(input: {
  prospectId: string
  title: string
  fileUrl?: string
  documentType?: string
  createdBy?: string
}) {
  return revenueAddDocument({
    entityId: input.prospectId,
    title: input.title,
    fileUrl: input.fileUrl,
    documentType: input.documentType,
  })
}

async function addProspectContact(input: {
  prospectId: string
  fullName: string
  role?: string
  influenceLevel?: "low" | "medium" | "high" | "critical" | string
  phone?: string
  email?: string
  isPrimary?: boolean
}) {
  return revenueAddContact({
    entityId: input.prospectId,
    fullName: input.fullName,
    role: input.role,
    influenceLevel: input.influenceLevel,
    phone: input.phone,
    email: input.email,
    isPrimary: input.isPrimary,
  })
}

async function addPipelineHistory(prospectId: string, fromStage: string | null, toStage: string) {
  return revenueMovePipeline(prospectId, fromStage, toStage)
}

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
type ProspectType = "family" | "clinic" | "corporate" | "academy" | "partner" | "institution" | "website" | "campaign" | "preschool" | "school_group" | "association"

type ProspectRecord = {
  id: string
  name: string
  company: string
  contactName: string
  phone: string
  email: string
  city: string
  address?: string
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
  serviceInterest?: string
  budgetSignal?: string
  contractReadiness?: string
  notes?: string
  nextActionOwner?: string
  tags?: string[]
  temperature?: string
  createdAt: string
  updatedAt: string
}

type ProspectLog = { id: string; prospectId: string; at: string; action: string; note: string }
type ProspectStore = { prospects: ProspectRecord[]; logs?: ProspectLog[] }

type ProfileTask = { id: string; remoteId?: string; title: string; priority: "High" | "Medium" | "Low"; due: string; done: boolean; statusLabel?: string; owner?: string; type?: string; description?: string; startAt?: string | null; endAt?: string | null; dueDate?: string | null; role?: string; location?: string; outcome?: string; escalation?: string; dependencies?: string; tags?: string[] }
type ProfileAppointment = {
  id: string
  remoteId?: string
  title: string
  at: string
  status: "Scheduled" | "Completed" | "Cancelled" | "Confirmed" | "Pending"
  type?: string
  owner?: string
  location?: string
  meetingLink?: string
  notes?: string
}
type ProfileComment = { id: string; remoteId?: string; author: string; at: string; note: string; channel: string }

const STORE_KEY = "revenue_prospects_v12_mega_store"
const PROFILE_CONTROLS_KEY = "revenue_prospect_profile_controls_v1"
const SNAPSHOT_KEYS = [STORE_KEY, "revenue_command_browser_snapshots", "angelcare_global_persistence_snapshots"]

type ProfileControlsStore = Record<
  string,
  {
    tasks: ProfileTask[]
    appointments: ProfileAppointment[]
    comments: ProfileComment[]
    documents: string[]
    updatedAt: string
  }
>


const stageLabels: Record<ProspectStage, string> = {
  new_lead: "New Lead",
  discovery: "Discovery",
  qualification: "Qualification",
  decision_map: "Decision Map",
  appointment_ready: "Appointment Ready",
  proposal: "Proposal Sent",
  negotiation: "Negotiation",
  contracting: "Contracting",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
  recovery: "Recovery",
}

const pipeline: ProspectStage[] = ["qualification", "decision_map", "proposal", "negotiation", "contracting", "closed_won"]

function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ")
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null
  try { return JSON.parse(value) as T } catch { return null }
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
    documents: Array.isArray(raw.documents) ? raw.documents.map(String) : ["Company Presentation.pdf", "Proposal Document.pdf", "Pricing Sheet.xlsx"],
    address: String((raw as any).address || ""),
    serviceInterest: String((raw as any).serviceInterest || ""),
    budgetSignal: String((raw as any).budgetSignal || ""),
    contractReadiness: String((raw as any).contractReadiness || ""),
    notes: String((raw as any).notes || ""),
    nextActionOwner: String((raw as any).nextActionOwner || ""),
    tags: Array.isArray((raw as any).tags) ? (raw as any).tags.map(String) : String((raw as any).tags || "").split(",").map((x) => x.trim()).filter(Boolean),
    temperature: String((raw as any).temperature || ""),
    createdAt: String(raw.createdAt || now),
    updatedAt: String(raw.updatedAt || now),
  }
}

function loadStore(): ProspectStore {
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

function saveStore(store: ProspectStore) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORE_KEY, JSON.stringify({ ...store, updatedAt: new Date().toISOString() }))
}

function loadProfileControls(prospectId: string) {
  if (typeof window === "undefined") return null
  const all = safeParse<ProfileControlsStore>(localStorage.getItem(PROFILE_CONTROLS_KEY)) || {}
  return all[prospectId] || null
}

function saveProfileControls(
  prospectId: string,
  controls: { tasks: ProfileTask[]; appointments: ProfileAppointment[]; comments: ProfileComment[]; documents: string[] },
) {
  if (typeof window === "undefined") return
  const all = safeParse<ProfileControlsStore>(localStorage.getItem(PROFILE_CONTROLS_KEY)) || {}
  all[prospectId] = { ...controls, updatedAt: new Date().toISOString() }
  localStorage.setItem(PROFILE_CONTROLS_KEY, JSON.stringify(all))
}

function deleteProfileControls(prospectId: string) {
  if (typeof window === "undefined") return
  const all = safeParse<ProfileControlsStore>(localStorage.getItem(PROFILE_CONTROLS_KEY)) || {}
  delete all[prospectId]
  localStorage.setItem(PROFILE_CONTROLS_KEY, JSON.stringify(all))
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function todayPlus(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function mapDbPriority(priority: string | null | undefined): "High" | "Medium" | "Low" {
  if (priority === "critical" || priority === "high") return "High"
  if (priority === "low") return "Low"
  return "Medium"
}

function mapTaskFromDb(row: any): ProfileTask {
  const label =
    row.status_label ||
    (row.status === "done"
      ? "Completed"
      : row.status === "cancelled"
        ? "Cancelled"
        : row.start_at
          ? "Scheduled"
          : "Open")

  return {
    id: String(row.id),
    remoteId: String(row.id),
    title: String(row.title || "Untitled task"),
    priority: mapDbPriority(row.priority),
    due: row.start_at
      ? `${new Date(row.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${(row.due_date || "").toString().slice(0, 10) || "No due date"}`
      : row.due_date
        ? String(row.due_date)
        : "No due date",
    done: row.status === "done",
    statusLabel: label,
    owner: String(row.owner || "BD Officer"),
    type: String(row.task_type || "task"),
    description: String(row.description || ""),
    startAt: row.start_at || null,
    endAt: row.end_at || null,
    dueDate: row.due_date || null,
    role: String(row.assigned_role || ""),
    location: String(row.location || ""),
    outcome: String(row.outcome_expected || ""),
    escalation: String(row.escalation_rule || ""),
    dependencies: String(row.dependencies || ""),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
  }
}

function mapAppointmentFromDb(row: any): ProfileAppointment {
  const rawStatus = String(row.status || row.status_label || "scheduled").toLowerCase()
  const status =
    rawStatus === "completed" || rawStatus === "done"
      ? "Completed"
      : rawStatus === "cancelled" || rawStatus === "canceled"
        ? "Cancelled"
        : rawStatus === "confirmed"
          ? "Confirmed"
          : rawStatus === "pending"
            ? "Pending"
            : "Scheduled"

  return {
    id: String(row.id),
    remoteId: String(row.id),
    title: String(row.title || "Appointment"),
    at: String(row.appointment_at || row.at || "Scheduled"),
    status,
    type: String(row.appointment_type || row.type || "meeting"),
    owner: String(row.owner || "BD Officer"),
    location: String(row.location || row.entity_city || ""),
    meetingLink: String(row.meeting_link || ""),
    notes: String(row.notes || row.agenda || ""),
  }
}

function mapAppointmentFromLive(row: any): ProfileAppointment {
  const status =
    row.status === "completed"
      ? "Completed"
      : row.status === "cancelled"
        ? "Cancelled"
        : row.status === "confirmed"
          ? "Confirmed"
          : row.status === "pending"
            ? "Pending"
            : "Scheduled"

  const start = row.appointment_at ? new Date(row.appointment_at) : null
  const dateText = start
    ? `${start.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} · ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "No date"

  return {
    id: String(row.id),
    remoteId: String(row.id),
    title: String(row.title || "Untitled appointment"),
    at: dateText,
    status,
    type: String(row.appointment_type || "meeting"),
    owner: String(row.owner || "BD Officer"),
    location: String(row.location || row.entity_city || ""),
    meetingLink: String(row.meeting_link || ""),
    notes: String(row.notes || row.agenda || ""),
  }
}


function mapCommentFromDb(row: any): ProfileComment {
  return {
    id: String(row.id),
    remoteId: String(row.id),
    author: String(row.author || "AngelCare"),
    at: row.created_at ? new Date(row.created_at).toLocaleString() : "Now",
    channel: String(row.channel || "internal"),
    note: String(row.note || ""),
  }
}

export default function ProspectFullProfileCommandCenter({ prospectId }: { prospectId: string }) {
  const [store, setStore] = useState<ProspectStore>({ prospects: [] })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ProspectRecord | null>(null)
  const [comment, setComment] = useState("")
  const [tasks, setTasks] = useState<ProfileTask[]>([])
  const [appointments, setAppointments] = useState<ProfileAppointment[]>([])
  const [comments, setComments] = useState<ProfileComment[]>([])
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState("Overview")
  const [engineStatus, setEngineStatus] = useState<"connecting" | "live" | "fallback">("connecting")
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [viewTaskModal, setViewTaskModal] = useState<ProfileTask | null>(null)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [documentModalOpen, setDocumentModalOpen] = useState(false)
  const {
    data: revenueControls,
    status: revenueStatus,
    lastSyncAt: revenueLastSyncAt,
    refresh: refreshRevenueControls,
  } = useRevenueEntityControls("prospect", prospectId)


  async function refresh() {
    try {
      const [currentProductionProspect, productionProspects] = await Promise.all([
        loadProductionProspect<ProspectRecord>(prospectId).catch(() => null),
        loadProductionProspects<ProspectRecord>().catch(() => []),
      ])

      const normalizedProduction = productionProspects.map(normalizeProspect)
      if (currentProductionProspect) {
        const current = normalizeProspect(currentProductionProspect)
        setStore({ prospects: [current, ...normalizedProduction.filter((p) => p.id !== current.id)] })
        setLastSync(new Date())
        return
      }

      const browserStore = loadStore()
      const browserProspect = browserStore.prospects.find((p) => p.id === prospectId)
      if (browserProspect) {
        const ensured = await ensureProductionProspect(browserProspect)
        const ensuredProspect = normalizeProspect({ ...browserProspect, ...(ensured?.data || {}), ...(ensured || {}) })
        setStore({ prospects: [ensuredProspect, ...normalizedProduction.filter((p) => p.id !== ensuredProspect.id)] })
        setLastSync(new Date())
        return
      }

      if (normalizedProduction.length) {
        setStore({ prospects: normalizedProduction })
        setLastSync(new Date())
        return
      }
    } catch (error) {
      console.warn("Production prospect store unavailable, using browser recovery fallback", error)
    }

    const next = loadStore()
    setStore(next)
    setLastSync(new Date())
  }

  async function refreshRealControls(id: string, fallbackProspect?: ProspectRecord) {
    try {
      const [data, liveTaskRows, liveAppointmentRows] = await Promise.all([
        loadProspectControlData(id).catch(() => ({ tasks: [], appointments: [], comments: [], documents: [] })),
        loadProspectProfileTasks(id).catch(() => []),
        loadProspectProfileAppointments(id).catch(() => []),
      ])

      const syncedTasks = liveTaskRows.length ? liveTaskRows.map(mapTaskFromDb) : (data.tasks || []).map(mapTaskFromDb)
      const syncedAppointments = liveAppointmentRows.length
        ? liveAppointmentRows.map(mapAppointmentFromLive)
        : (data.appointments || []).map(mapAppointmentFromDb)

      setTasks(syncedTasks)
      setAppointments(syncedAppointments)
      setComments((data.comments || []).map(mapCommentFromDb))

      const liveDocuments = (data.documents || []).map((doc: any) => String(doc.title || "Document"))
      if (fallbackProspect && liveDocuments.length) {
        const nextProspect = { ...fallbackProspect, documents: liveDocuments }
        setDraft(nextProspect)
      }

      saveProfileControls(id, {
        tasks: syncedTasks,
        appointments: syncedAppointments,
        comments: (data.comments || []).map(mapCommentFromDb),
        documents: fallbackProspect?.documents || [],
      })

      refreshRevenueControls()
      setEngineStatus("live")
      setLastSync(new Date())
    } catch (error) {
      console.warn("Prospect live controls sync unavailable, using browser fallback", error)
      setEngineStatus("fallback")
    }
  }

  useEffect(() => {
    void refresh()
    if (!shouldStartAutoRefresh()) return
    const timer = window.setInterval(() => void refresh(), safeRefreshInterval(6000))
    return () => window.clearInterval(timer)
  }, [])


  const prospect = useMemo(() => store.prospects.find((p) => p.id === prospectId) || null, [store, prospectId])

  useEffect(() => {
    if (!prospect) return
    setDraft(prospect)

    const persisted = loadProfileControls(prospect.id)
    if (persisted) {
      setTasks(persisted.tasks || [])
      setAppointments(persisted.appointments || [])
      setComments(persisted.comments || [])
    } else {
      const baseTasks: ProfileTask[] = []
      const baseAppointments: ProfileAppointment[] = []
      const baseComments: ProfileComment[] = []

      setTasks(baseTasks)
      setAppointments(baseAppointments)
      setComments(baseComments)
      saveProfileControls(prospect.id, { tasks: baseTasks, appointments: baseAppointments, comments: baseComments, documents: prospect.documents })
    }

    refreshRealControls(prospect.id, prospect)

    const unsubscribeControls = subscribeProspectControls(prospect.id, () => refreshRealControls(prospect.id, prospect))
    const unsubscribeTasks = subscribeProspectProfileTasks(prospect.id, () => refreshRealControls(prospect.id, prospect))
    const unsubscribeAppointments = subscribeProspectProfileAppointments(prospect.id, () => refreshRealControls(prospect.id, prospect))

    return () => {
      unsubscribeControls?.()
      unsubscribeTasks?.()
      unsubscribeAppointments?.()
    }
  }, [prospect?.id])


  if (!prospect || !draft) {
    return (
      <div className="min-h-screen bg-[#050b16] p-6 text-white">
        <Link href="/revenue-command-center/prospects/directory" className="inline-flex items-center gap-2 text-blue-300"><ArrowLeft className="h-4 w-4" />Back to directory</Link>
        <div className="mt-8 rounded-3xl border border-[#244365] bg-[#0e1e34] p-10 text-center">
          <h1 className="text-2xl font-black">Prospect not found</h1>
          <p className="mt-2 text-[#cbd5e1]">This profile needs a valid prospect id from the live store.</p>
        </div>
      </div>
    )
  }

  const activeProspect: ProspectRecord = prospect

  const modalProspect = {
    id: activeProspect.id,
    name: activeProspect.name,
    company: activeProspect.company,
    city: activeProspect.city,
    stage: activeProspect.stage,
    priority: activeProspect.priority,
    score: activeProspect.score,
    owner: activeProspect.owner,
    contactName: activeProspect.contactName || activeProspect.decisionMaker,
  }

  function commit(nextProspect: ProspectRecord, action: string, note: string) {
    const updated = { ...nextProspect, updatedAt: new Date().toISOString() }
    const nextStore: ProspectStore = {
      ...store,
      prospects: store.prospects.map((p) => (p.id === nextProspect.id ? updated : p)),
      logs: [{ id: `${Date.now()}`, prospectId: nextProspect.id, at: new Date().toISOString(), action, note }, ...(store.logs || [])],
    }
    saveStore(nextStore)
    void saveProductionProspect(updated)
    setStore(nextStore)
    setLastSync(new Date())
  }

  function persistControls(next: Partial<{ tasks: ProfileTask[]; appointments: ProfileAppointment[]; comments: ProfileComment[]; documents: string[] }>) {
    const nextTasks = next.tasks || tasks
    const nextAppointments = next.appointments || appointments
    const nextComments = next.comments || comments
    const nextDocuments = next.documents || activeProspect.documents
    saveProfileControls(activeProspect.id, { tasks: nextTasks, appointments: nextAppointments, comments: nextComments, documents: nextDocuments })
    setLastSync(new Date())
  }

  function saveDraft() {
    if (!draft) return
    commit(draft, "Profile edited", `${draft.name} profile updated`)
    setEditing(false)
  }

  function deleteProspect() {
    const ok = window.confirm(`Delete ${activeProspect.name}? This removes it from the live activeProspect store.`)
    if (!ok) return
    const nextStore: ProspectStore = {
      ...store,
      prospects: store.prospects.filter((p) => p.id !== activeProspect.id),
      logs: [{ id: `${Date.now()}`, prospectId: activeProspect.id, at: new Date().toISOString(), action: "Prospect deleted", note: activeProspect.name }, ...(store.logs || [])],
    }
    saveStore(nextStore)
    void deleteProductionProspect(activeProspect.id)
    deleteProfileControls(activeProspect.id)
    window.location.href = "/revenue-command-center/prospects/directory"
  }

  async function updateStage(stage: ProspectStage) {
    const previousStage = activeProspect.stage
    const next = { ...activeProspect, stage, updatedAt: new Date().toISOString() }
    commit(next, "Pipeline stage updated", stageLabels[stage])
    try {
      await addPipelineHistory(activeProspect.id, previousStage, stage)
      await refreshRealControls(activeProspect.id, next)
    } catch (error) {
      console.warn("Pipeline history saved locally only", error)
      setEngineStatus("fallback")
    }
  }

  async function postComment() {
    if (!comment.trim()) return
    const note = comment.trim()
    const item = { id: `${Date.now()}`, author: activeProspect.owner || "BD Officer", at: new Date().toLocaleString(), channel: "Internal", note }
    const nextComments = [item, ...comments]
    setComments(nextComments)
    persistControls({ comments: nextComments })
    commit(activeProspect, "Comment posted", note)
    setComment("")
    try {
      await addProspectComment({ prospectId: activeProspect.id, author: activeProspect.owner || "BD Officer", channel: "internal", note })
      await refreshRealControls(activeProspect.id, activeProspect)
    } catch (error) {
      console.warn("Comment saved locally only", error)
      setEngineStatus("fallback")
    }
  }

  function addTask() {
    setTaskModalOpen(true)
  }

  function viewTask(task: ProfileTask) {
    setViewTaskModal(task)
  }

  async function submitTask(payload: { title: string; description: string; priority: "low" | "medium" | "high" | "critical"; owner: string; dueDate: string }) {
    try {
      await ensureProductionProspect(activeProspect)
      const created = await createProspectTask({
        prospectId: activeProspect.id,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        owner: payload.owner || activeProspect.owner || "BD Officer",
        dueDate: payload.dueDate || undefined,
        prospectSnapshot: activeProspect as unknown as Record<string, unknown>,
      })
      commit(activeProspect, "Task created", payload.title)
      await refreshRealControls(activeProspect.id, activeProspect)
      setEngineStatus("live")
      return created
    } catch (error) {
      console.error("Task creation failed against production source of truth", error)
      setEngineStatus("fallback")
      window.alert(error instanceof Error ? error.message : "Unable to create task in production source of truth.")
    }
  }


  function scheduleAppointment() {
    setAppointmentModalOpen(true)
  }

  async function submitAppointment(payload: { title: string; appointmentAt: string; owner: string; location: string; notes: string }) {
    try {
      await ensureProductionProspect(activeProspect)
      const appointment = await scheduleProspectAppointment({
        prospectId: activeProspect.id,
        title: payload.title,
        appointmentAt: payload.appointmentAt || `${todayPlus(2)}T11:00:00`,
        owner: payload.owner || activeProspect.owner || "BD Officer",
        location: payload.location,
        notes: payload.notes,
        prospectSnapshot: activeProspect as unknown as Record<string, unknown>,
      })
      commit({ ...activeProspect, nextContactDate: (payload.appointmentAt || todayPlus(2)).slice(0, 10), nextAction: payload.title }, "Appointment scheduled", payload.title)
      await refreshRealControls(activeProspect.id, activeProspect)
      setEngineStatus("live")
      return appointment
    } catch (error) {
      console.error("Appointment creation failed against production source of truth", error)
      setEngineStatus("fallback")
      window.alert(error instanceof Error ? error.message : "Unable to schedule appointment in production source of truth.")
    }
  }


  function openDocumentModal() {
    setDocumentModalOpen(true)
  }

  async function submitDocument(payload: { title: string; documentType: string; fileUrl: string }) {
    const title = payload.title
    const nextDocuments = [...activeProspect.documents, title]
    persistControls({ documents: nextDocuments })
    const nextProspect = { ...activeProspect, documents: nextDocuments }
    commit(nextProspect, "Document added", title)

    try {
      await addProspectDocument({
        prospectId: activeProspect.id,
        title,
        fileUrl: payload.fileUrl || undefined,
        documentType: payload.documentType || "profile",
        createdBy: activeProspect.owner || "AngelCare",
      })
      await refreshRealControls(activeProspect.id, nextProspect)
      setEngineStatus("live")
    } catch (error) {
      console.warn("Document saved locally only", error)
      setEngineStatus("fallback")
    }
  }

  function downloadProfileReport() {
    const content = `ANGELCARE PROSPECT PROFILE\n\nName: ${activeProspect.name}\nCity: ${activeProspect.city}\nValue: ${mad(activeProspect.valueMad)}\nStage: ${stageLabels[activeProspect.stage]}\nProbability: ${pct(activeProspect.probability)}\nOwner: ${activeProspect.owner}\nNext Action: ${activeProspect.nextAction}\n\nNeed Summary:\n${activeProspect.needSummary}\n\nPain Points:\n${activeProspect.painPoints}\n`
    downloadTextFile(`angelcare-profile-${activeProspect.name.replace(/\W+/g, "-").toLowerCase()}.txt`, content)
  }


  function updateActiveTab(tab: string) {
    setActiveTab(tab)
  }

  const healthScore = Math.round((activeProspect.score + activeProspect.fitScore + activeProspect.probability) / 3)
  const highPotential = activeProspect.score >= 78 || activeProspect.priority === "high" || activeProspect.priority === "critical"

  const profileStageOptions = [
    { label: "New Lead", value: "new_lead" },
    { label: "Qualification", value: "qualification" },
    { label: "Decision Map", value: "decision_map" },
    { label: "Appointment Ready", value: "appointment_ready" },
    { label: "Proposal Sent", value: "proposal" },
    { label: "Negotiation", value: "negotiation" },
    { label: "Contracting", value: "contracting" },
    { label: "Closed Won", value: "closed_won" },
    { label: "Closed Lost", value: "closed_lost" },
    { label: "Recovery", value: "recovery" },
  ]

  const profileOwnerOptions = [
    { label: "BD Officer", value: "BD Officer" },
    { label: "Revenue Manager", value: "Revenue Manager" },
    { label: "Business Developer", value: "Business Developer" },
    { label: "Partnership Manager", value: "Partnership Manager" },
    { label: "Account Executive", value: "Account Executive" },
    { label: "Direction Rabat", value: "Direction Rabat" },
  ]

  const profileCityOptions = [
    { label: "Casablanca", value: "Casablanca" },
    { label: "Rabat", value: "Rabat" },
    { label: "Temara", value: "Temara" },
    { label: "Kenitra", value: "Kenitra" },
    { label: "Marrakech", value: "Marrakech" },
    { label: "Tanger", value: "Tanger" },
    { label: "Fès", value: "Fès" },
    { label: "Agadir", value: "Agadir" },
  ]

  const profileSectorOptions = [
    { label: "Institution", value: "institution" },
    { label: "Corporate", value: "corporate" },
    { label: "Family", value: "family" },
    { label: "Clinic / Maternity", value: "clinic" },
    { label: "Preschool / Kindergarten", value: "academy" },
    { label: "School Group", value: "institution" },
    { label: "Association / Partner", value: "partner" },
  ]

  const profileSourceOptions = [
    { label: "Manual", value: "Manual" },
    { label: "LinkedIn Outreach", value: "LinkedIn outreach" },
    { label: "Referral", value: "Referral" },
    { label: "WhatsApp Campaign", value: "WhatsApp campaign" },
    { label: "Email Campaign", value: "Email campaign" },
    { label: "Field Visit", value: "Field visit" },
    { label: "Inbound", value: "Inbound" },
    { label: "Event / Partnership", value: "Event / Partnership" },
  ]

  const profileYesNoOptions = [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" },
  ]

  const profileServiceInterestOptions = [
    { label: "All-in-One Kindergarten OS", value: "All-in-One Kindergarten OS" },
    { label: "AngelCare B2B Partnership", value: "AngelCare B2B Partnership" },
    { label: "Training & Academy", value: "Training & Academy" },
    { label: "Audit & Pedagogical Control", value: "Audit & Pedagogical Control" },
    { label: "Staff Reinforcement", value: "Staff Reinforcement" },
    { label: "Events / Excursions", value: "Events / Excursions" },
    { label: "Flashcards WINWIN Program", value: "Flashcards WINWIN Program" },
  ]

  const profileSignalOptions = [
    { label: "Unknown", value: "" },
    { label: "Low", value: "low" },
    { label: "Medium", value: "medium" },
    { label: "High", value: "high" },
    { label: "Critical", value: "critical" },
  ]

  const profileContractReadinessOptions = [
    { label: "Not Ready", value: "not_ready" },
    { label: "Discovery Needed", value: "discovery_needed" },
    { label: "Proposal Needed", value: "proposal_needed" },
    { label: "Proposal Sent", value: "proposal_sent" },
    { label: "Negotiation", value: "negotiation" },
    { label: "Ready for Contract", value: "ready_for_contract" },
    { label: "Contract Sent", value: "contract_sent" },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050b16] text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_28%_0%,rgba(59,130,246,.18),transparent_30%),radial-gradient(circle_at_78%_4%,rgba(124,58,237,.18),transparent_30%),linear-gradient(180deg,#07111f_0%,#030814_68%,#020611_100%)]" />

      {taskModalOpen && (
        <ProspectProfileAddTaskModal
          prospect={modalProspect}
          open={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          onCreated={() => {
            void refreshRealControls(activeProspect.id, activeProspect)
            void refreshRevenueControls()
          }}
        />
      )}
      {viewTaskModal && (
        <ProfileTaskViewEditModal
          task={viewTaskModal}
          prospect={activeProspect}
          onClose={() => setViewTaskModal(null)}
          onSaved={() => {
            setViewTaskModal(null)
            void refreshRealControls(activeProspect.id, activeProspect)
            void refreshRevenueControls()
          }}
        />
      )}

      {appointmentModalOpen && (
        <AppointmentCreateModal
          prospect={activeProspect}
          onClose={() => setAppointmentModalOpen(false)}
          onSubmit={(payload) => {
            submitAppointment(payload)
            setAppointmentModalOpen(false)
          }}
        />
      )}
      {documentModalOpen && (
        <DocumentCreateModal
          prospect={activeProspect}
          onClose={() => setDocumentModalOpen(false)}
          onSubmit={(payload) => {
            submitDocument(payload)
            setDocumentModalOpen(false)
          }}
        />
      )}

      <main className="rcc-shell-main w-full max-w-none min-w-0 flex-1 relative mx-auto w-full max-w-[1920px] px-4 py-4">
        <header className="mb-4">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold text-[#cbd5e1]">
            <Link href="/revenue-command-center/prospects/directory" className="text-blue-300 hover:text-blue-200">Prospects Directory</Link>
            <span>›</span>
            <button onClick={() => history.back()} className="text-violet-300">{activeProspect.city}</button>
            <span>›</span>
            <span className="text-white">{activeProspect.name}</span>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(620px,.95fr)]">
            <div className="flex items-center gap-5">
              <div className="grid h-28 w-28 place-items-center rounded-3xl border border-white/10 bg-white text-4xl font-black text-rose-700 shadow-[0_24px_60px_rgba(0,0,0,.28)]">{initials(activeProspect.name)}</div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  {editing ? <Input value={draft.name} onChange={(v) => setDraft({ ...(draft || activeProspect), name: v, company: v })} className="text-2xl" /> : <h1 className="text-4xl font-black text-white">{activeProspect.name}</h1>}
                  {highPotential && <Crown className="h-7 w-7 text-amber-300" />}
                  <ScoreBadge score={activeProspect.score} />
                </div>
                <div className="mt-2 text-sm font-bold text-[#cbd5e1]">{activeProspect.type} · {activeProspect.source}</div>
                <div className="mt-4 flex flex-wrap gap-5 text-xs font-bold text-[#cbd5e1]">
                  <span>📍 {activeProspect.city}, Morocco</span>
                  <span>☎ {activeProspect.phone || "No phone"}</span>
                  <span>✉ {activeProspect.email || "No email"}</span>
                  <span>🌐 AngelCare activeProspect</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[repeat(4,1fr)]">
              <StageSummary label="Stage" value={stageLabels[activeProspect.stage]} tone="violet" />
              <StageSummary label="Potential Value" value={mad(activeProspect.valueMad)} detail={highPotential ? "High Potential" : "Medium Potential"} tone="emerald" />
              <StageSummary label="Probability" value={pct(activeProspect.probability)} detail={activeProspect.probability >= 70 ? "High" : "Medium"} tone="blue" />
              <StageSummary label="Expected Close" value={activeProspect.nextContactDate || todayPlus(30)} detail="controlled date" tone="amber" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <ActionButton onClick={() => activeProspect.phone && (window.location.href = `tel:${activeProspect.phone}`)} icon={<Phone />} label="Call" tone="emerald" />
            <ActionButton onClick={() => activeProspect.phone && window.open(`https://wa.me/${activeProspect.phone.replace(/\D/g, "")}`, "_blank")} icon={<MessageCircle />} label="WhatsApp" tone="green" />
            <ActionButton onClick={() => activeProspect.email && (window.location.href = `mailto:${activeProspect.email}`)} icon={<Mail />} label="Email" tone="blue" />
            {editing ? <ActionButton onClick={saveDraft} icon={<Save />} label="Save" tone="violet" /> : <ActionButton onClick={() => setEditing(true)} icon={<Edit3 />} label="Edit" tone="violet" />}
            <ActionButton onClick={deleteProspect} icon={<Trash2 />} label="Delete" tone="rose" />
            <ActionButton onClick={downloadProfileReport} icon={<MoreHorizontal />} label="Report" tone="slate" />
          </div>
        </header>

        <nav className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-[#244365] bg-[#07111f]/90 p-2 md:grid-cols-4 xl:grid-cols-8">
          {["Overview", "Company Details", "Contacts", "Business Model Fit", "Documents", "Communications", "Financial Profile", "Custom Fields"].map((tab) => (
            <button
              key={tab}
              onClick={() => updateActiveTab(tab)}
              className={cn("rounded-xl px-3 py-3 text-sm font-black transition", activeTab === tab ? "bg-violet-700 text-white shadow-[0_0_28px_rgba(124,58,237,.25)]" : "text-[#cbd5e1] hover:bg-[#10223a] hover:text-white")}
            >
              {tab}
            </button>
          ))}
        </nav>

        <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <LiveTile label="Active Zone" value={activeTab} detail="clickable control layer" />
          <LiveTile label="Action Engine" value={revenueStatus === "live" ? "Supabase Live" : engineStatus === "fallback" ? "Browser Fallback" : "Connecting"} detail={revenueStatus === "live" ? "DB-backed controls" : "local-safe mode"} />
          <LiveTile label="Last Sync" value={lastSync ? lastSync.toLocaleTimeString() : "Syncing"} detail="profile + controls" />
          <LiveTile label="Profile Controls" value={`${tasks.length + appointments.length + comments.length}`} detail="tasks, appointments, comments" />
        </section>

        <div className="mb-4">
          <RevenueEntityControlPanel controls={revenueControls} status={revenueStatus} lastSyncAt={revenueLastSyncAt} />
        </div>

        {activeTab !== "Overview" && (
          <section className="mb-4">
            <ProfileTabWorkspace
  activeTab={activeTab}
  prospect={activeProspect}
              tasks={tasks}
              appointments={appointments}
              comments={comments}
              documents={activeProspect.documents}
              onSave={(nextProspect, action, note) => commit(nextProspect, action, note)}
              onAddTask={addTask}
              onSchedule={scheduleAppointment}
              onPostComment={(note) => {
                const item = { id: `${Date.now()}`, author: activeProspect.owner || "BD Officer", at: new Date().toLocaleString(), channel: activeTab, note }
                const nextComments = [item, ...comments]
                setComments(nextComments)
                persistControls({ comments: nextComments })
                commit(activeProspect, `${activeTab} note posted`, note)
                addProspectComment({ prospectId: activeProspect.id, author: activeProspect.owner || "BD Officer", channel: activeTab, note })
                  .then(() => refreshRealControls(activeProspect.id, activeProspect))
                  .catch((error) => {
                    console.warn("Tab note saved locally only", error)
                    setEngineStatus("fallback")
                  })
              }}
              onUploadDocument={openDocumentModal}
              onDownloadReport={downloadProfileReport}
            />
          </section>
        )}

        <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.55fr)_minmax(420px,.65fr)]">
          <div className="space-y-4">
            <section className="grid gap-4 xl:grid-cols-3">
              <Panel title="Company Overview">
                <p className="mb-5 text-sm font-semibold leading-6 text-[#cbd5e1]">{activeProspect.needSummary || `${activeProspect.name} is a qualified AngelCare opportunity in ${activeProspect.city}, requiring structured business development follow-up.`}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Info icon={<BriefcaseBusiness />} label="Company Type" value={activeProspect.type} />
                  <Info icon={<CalendarDays />} label="Created" value={new Date(activeProspect.createdAt).getFullYear().toString()} />
                  <Info icon={<Users />} label="Owner" value={activeProspect.owner} />
                  <Info icon={<Target />} label="Fit Score" value={pct(activeProspect.fitScore)} />
                  <Info icon={<FileText />} label="Source" value={activeProspect.source} />
                  <Info icon={<Globe2 />} label="City / Zone" value={activeProspect.city} />
                </div>
              </Panel>

              <Panel title="Domination Strategy Fit">
                <div className="flex items-center gap-5">
                  <div className="grid h-32 w-32 place-items-center rounded-full border-[10px] border-blue-500/80 bg-[#081525] text-center shadow-[0_0_30px_rgba(59,130,246,.18)]">
                    <div><div className="text-3xl font-black">{pct(activeProspect.fitScore)}</div><div className="text-xs font-black text-blue-200">Fit Score</div></div>
                  </div>
                  <div className="space-y-3 text-sm font-bold">
                    <CheckLine label="High Market Potential" status={activeProspect.valueMad >= 100000 ? "Excellent" : "Good"} />
                    <CheckLine label="Aligned with AngelCare Model" status={activeProspect.fitScore >= 70 ? "Excellent" : "Good"} />
                    <CheckLine label="Decision Maker Accessible" status={activeProspect.decisionMakerConfirmed ? "Excellent" : "Good"} />
                    <CheckLine label="Budget Compatibility" status={activeProspect.probability >= 60 ? "Good" : "Medium"} />
                    <CheckLine label="Long Term Partnership Value" status={highPotential ? "Excellent" : "Good"} />
                  </div>
                </div>
                <button onClick={() => commit({ ...activeProspect, fitScore: Math.min(100, activeProspect.fitScore + 5) }, "Fit analysis improved", "+5 fit score")} className="mt-5 w-full rounded-xl border border-[#244365] bg-[#10223a] px-4 py-3 text-sm font-black text-white">Improve Analysis</button>
              </Panel>

              <Panel title="Business Model Alignment">
                <MetricRow label="AngelCare Solution" value="All-in-One Kindergarten OS" />
                <MetricRow label="Implementation" value="Full Deployment" />
                <MetricRow label="Revenue Model" value="B2B Subscription" />
                <MetricRow label="Contract Type" value="Annual" />
                <MetricRow label="Payment Terms" value="12 Months" />
                <MetricRow label="Estimated Annual Value" value={mad(activeProspect.valueMad)} />
                <MetricRow label="Onboarding Complexity" value={activeProspect.urgency >= 70 ? "High" : "Medium"} />
                <MetricRow label="Partnership Potential" value={highPotential ? "High" : "Medium"} />
                <button onClick={() => setEditing(true)} className="mt-4 w-full rounded-xl border border-[#244365] bg-[#10223a] px-4 py-3 text-sm font-black text-white">Edit Business Model</button>
              </Panel>
            </section>

            <section className="grid gap-4 xl:grid-cols-4">
              <Panel title="Decision Maker">
                <Person name={activeProspect.contactName || activeProspect.decisionMaker || "N/A"} role={activeProspect.owner} primary />
                <button className="mt-4 w-full rounded-xl border border-[#244365] bg-[#10223a] px-4 py-3 text-sm font-black text-white">View Profile</button>
              </Panel>
              <Panel title={`Influencers (${Math.max(2, activeProspect.stakeholders.length)})`}>
                {(activeProspect.stakeholders.length ? activeProspect.stakeholders : ["Operations Manager", "Finance Contact"]).slice(0, 3).map((s, i) => <Person key={s} name={s} role={i === 0 ? "High" : "Medium"} />)}
                <button onClick={() => commit({ ...activeProspect, stakeholders: [...activeProspect.stakeholders, "New stakeholder"] }, "Stakeholder added", "New stakeholder")} className="mt-4 w-full rounded-xl border border-[#244365] bg-[#10223a] px-4 py-3 text-sm font-black text-white">Manage Contacts</button>
              </Panel>
              <Panel title="Competitor Presence">
                <MetricRow label="Local operator" value="Active" />
                <MetricRow label="Manual processes" value="Active" />
                <MetricRow label="Other provider" value="Monitoring" />
                <button onClick={() => commit({ ...activeProspect, competitorRisk: "Updated competitor monitoring" }, "Competitor check", "Monitoring updated")} className="mt-4 w-full rounded-xl border border-[#244365] bg-[#10223a] px-4 py-3 text-sm font-black text-white">View Analysis</button>
              </Panel>
              <Panel title="Key Metrics">
                <MetricRow label="Market Size" value={mad(Math.max(activeProspect.valueMad * 7, 500000))} />
                <MetricRow label="Current Share" value="25%" />
                <MetricRow label="Growth Potential" value={highPotential ? "High" : "Medium"} />
                <MetricRow label="Target Share" value="40%" />
                <MetricRow label="Revenue Impact" value={mad(activeProspect.valueMad)} />
                <button onClick={downloadProfileReport} className="mt-4 w-full rounded-xl border border-[#244365] bg-[#10223a] px-4 py-3 text-sm font-black text-white">View Full Metrics</button>
              </Panel>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr_.85fr]">
              <Panel title="#1 Comments Track">
                <div className="mb-3 flex gap-2">
                  <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." className="h-11 flex-1 rounded-xl border border-[#244365] bg-[#081525] px-3 text-sm font-bold text-white outline-none" />
                  <button onClick={postComment} className="rounded-xl bg-violet-700 px-4 text-sm font-black text-white">Post</button>
                </div>
                <div className="mb-3 flex gap-4 text-xs font-black text-[#cbd5e1]"><span>All</span><span>Internal</span><span>Calls</span><span>Meetings</span><span>Emails</span></div>
                <div className="space-y-3">
                  {comments.map((c) => <div key={c.id} className="rounded-2xl bg-[#10223a] p-3"><div className="flex justify-between text-xs"><b>{c.author}</b><span>{c.at}</span></div><p className="mt-2 text-sm text-[#cbd5e1]">{c.note}</p><span className="mt-2 inline-flex rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-black text-emerald-300">{c.channel}</span></div>)}
                </div>
              </Panel>

              <div className="xl:col-span-3">
                <Panel
                  title="Tasks"
                  action={
                    <div className="flex items-center gap-3">
                      <Link href="/revenue-command-center/daily-tasks" className="inline-flex items-center gap-2 rounded-xl border border-[#244365] bg-[#10223a] px-3 py-2 text-xs font-black text-white hover:bg-[#172942]">
                        <Eye className="h-4 w-4" /> View All
                      </Link>
                      <button onClick={addTask} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-3 py-2 text-xs font-black text-white hover:bg-violet-600">
                        <Plus className="h-4 w-4" /> Add Task
                      </button>
                    </div>
                  }
                >
                  <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                    <div className="text-xs font-black uppercase tracking-[.16em] text-cyan-200">Live linked tasks</div>
                    <div className="mt-1 text-2xl font-black text-white">{tasks.length} task{tasks.length === 1 ? "" : "s"} linked to this prospect</div>
                    <div className="mt-1 text-sm font-bold text-white/70">Synced from revenue_tasks through revenue_task_command_view.</div>
                  </div>

                  <div className="grid gap-3">
                    {tasks.length === 0 && (
                      <div className="rounded-2xl border border-[#244365] bg-[#10223a] p-8 text-center">
                        <div className="text-lg font-black text-white">No linked tasks yet</div>
                        <div className="mt-2 text-sm font-bold text-[#94a3b8]">Tasks created for this prospect from Daily Tasks or this profile will appear here live.</div>
                        <button onClick={addTask} className="mt-5 rounded-xl bg-violet-700 px-5 py-3 text-sm font-black text-white">Create First Task</button>
                      </div>
                    )}

                    {tasks.map((t) => (
                      <div key={t.id} className="grid gap-4 rounded-2xl border border-[#244365] bg-[#10223a] p-4 shadow-[0_16px_45px_rgba(0,0,0,.18)] xl:grid-cols-[44px_1fr_130px_130px_170px_150px] xl:items-center">
                        <label className="grid h-10 w-10 place-items-center rounded-xl border border-[#315474] bg-[#07111f]">
                          <input
                            type="checkbox"
                            checked={t.done}
                            onChange={() => {
                              const nextDone = !t.done
                              const nextTasks = tasks.map((x) => (x.id === t.id ? { ...x, done: nextDone, statusLabel: nextDone ? "Completed" : "Open" } : x))
                              setTasks(nextTasks)
                              persistControls({ tasks: nextTasks })
                              commit(activeProspect, "Task status updated", t.title)
                              if (t.remoteId) {
                                completeProspectTask(t.remoteId, activeProspect.id, nextDone)
                                  .then(() => refreshRealControls(activeProspect.id, activeProspect))
                                  .catch((error) => {
                                    console.warn("Task status saved locally only", error)
                                    setEngineStatus("fallback")
                                  })
                              }
                            }}
                          />
                        </label>

                        <div className="min-w-0">
                          <div className="truncate text-lg font-black text-white">{t.title}</div>
                          <div className="mt-1 truncate text-sm font-bold text-white/70">{t.owner || activeProspect.owner} · {t.type || "task"} · linked to {activeProspect.name}</div>
                        </div>

                        <span className={cn("w-fit rounded-xl px-3 py-2 text-xs font-black !text-white", t.priority === "High" ? "bg-red-500/30" : t.priority === "Low" ? "bg-emerald-500/30" : "bg-amber-500/30")}>
                          {t.priority}
                        </span>

                        <span className="w-fit rounded-xl bg-blue-500/30 px-3 py-2 text-xs font-black !text-white">
                          {t.statusLabel || (t.done ? "Completed" : "Open")}
                        </span>

                        <div className="text-sm font-black text-white">
                          {t.due}
                        </div>

                        <button
                          type="button"
                          onClick={() => viewTask(t)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-500/20"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Task
                        </button>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              <Panel
                title="Appointments"
                action={
                  <button onClick={scheduleAppointment} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-3 py-2 text-xs font-black text-white hover:bg-violet-600">
                    Schedule
                  </button>
                }
              >
                <div className="mb-4 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
                  <div className="text-xs font-black uppercase tracking-[.16em] text-violet-200">Live linked appointments</div>
                  <div className="mt-1 text-2xl font-black text-white">{appointments.length} appointment{appointments.length === 1 ? "" : "s"} linked to this prospect</div>
                  <div className="mt-1 text-sm font-bold text-white/70">Synced from revenue_appointments through revenue_appointment_command_view.</div>
                </div>

                <div className="grid gap-3">
                  {appointments.length === 0 && (
                    <div className="rounded-2xl border border-[#244365] bg-[#10223a] p-6 text-center">
                      <div className="text-lg font-black text-white">No linked appointments yet</div>
                      <div className="mt-2 text-sm font-bold text-[#94a3b8]">Appointments scheduled from the Appointments page for this prospect will appear here live.</div>
                      <button onClick={scheduleAppointment} className="mt-5 rounded-xl bg-violet-700 px-5 py-3 text-sm font-black text-white">Schedule Appointment</button>
                    </div>
                  )}

                  {appointments.map((a) => (
                    <div key={a.id} className="grid gap-3 rounded-2xl border border-[#244365] bg-[#10223a] p-4 md:grid-cols-[1fr_135px_120px] md:items-center">
                      <div className="min-w-0">
                        <div className="truncate text-base font-black text-white">{a.title}</div>
                        <div className="mt-1 truncate text-xs font-bold text-white/70">{a.owner || activeProspect.owner} · {a.type || "meeting"} · {a.location || activeProspect.city}</div>
                        <div className="mt-2 text-sm font-black text-cyan-100">{a.at}</div>
                      </div>
                      <span className="w-fit rounded-xl border border-violet-300/25 bg-violet-500/20 px-3 py-2 text-xs font-black text-white">{a.status}</span>
                      <a
                        href="/revenue-command-center/appointments"
                        className="inline-flex items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-black text-white hover:bg-cyan-500/20"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Documents" action={<button onClick={downloadProfileReport} className="text-violet-300">View all</button>}>
                <div className="space-y-3">
                  {activeProspect.documents.slice(0, 4).map((d, i) => <div key={d} className="flex items-center gap-3 rounded-xl bg-[#10223a] p-3"><FileText className="h-4 w-4 text-red-300" /><span className="flex-1 text-sm font-bold text-white">{d}</span><span className="text-xs text-[#cbd5e1]">{i + 1}.2 MB</span></div>)}
                  <button
                    onClick={openDocumentModal}
                    className="w-full rounded-xl border border-[#244365] bg-[#10223a] px-4 py-3 text-sm font-black text-white"
                  >
                    <Upload className="mr-2 inline h-4 w-4" />Add Document
                  </button>
                </div>
              </Panel>
            </section>
          </div>

          <aside className="space-y-4">
            <Panel title="Next Action">
              <div className="rounded-2xl bg-violet-700/20 p-4">
                <div className="text-lg font-black text-white">{activeProspect.nextAction}</div>
                <div className="mt-3 flex gap-4 text-sm text-[#cbd5e1]"><span>{activeProspect.nextContactDate}</span><span>{activeProspect.owner}</span></div>
                <button onClick={() => commit({ ...activeProspect, nextContactDate: todayPlus(1), stage: "appointment_ready" }, "Next action started", activeProspect.nextAction)} className="mt-4 w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-black text-white">Start Action</button>
              </div>
            </Panel>

            <Panel title="Prospect Health">
              <div className="text-5xl font-black text-white">{healthScore}%</div>
              <div className="mt-1 text-sm font-black text-emerald-300">{healthScore >= 70 ? "Healthy" : "Needs Recovery"}</div>
              <div className="mt-4 h-24 rounded-2xl bg-[linear-gradient(135deg,rgba(16,185,129,.08),rgba(16,185,129,.24))] p-4"><HealthLine /></div>
            </Panel>

            <Panel title="Activity Timeline" action={<Link href="/revenue-command-center/prospects/directory" className="text-violet-300">View All</Link>}>
              <div className="space-y-3">
                {(store.logs || []).filter((l) => l.prospectId === activeProspect.id).slice(0, 5).concat([
                  { id: "email", prospectId: activeProspect.id, at: new Date().toISOString(), action: "Email opened", note: "Proposal document" },
                  { id: "wa", prospectId: activeProspect.id, at: new Date().toISOString(), action: "WhatsApp message sent", note: "Product demo video" },
                ]).slice(0, 6).map((l) => <div key={l.id} className="flex gap-3 rounded-xl bg-[#10223a] p-3"><ActivityDot /><div><div className="font-bold text-white">{l.action}</div><div className="text-xs text-[#cbd5e1]">{l.note}</div></div></div>)}
              </div>
            </Panel>

            <Panel title="Pipeline Progression">
              <div className="space-y-3">
                {pipeline.map((s) => {
                  const currentIndex = pipeline.indexOf(activeProspect.stage)
                  const stageIndex = pipeline.indexOf(s)
                  const done = stageIndex < currentIndex || activeProspect.stage === "closed_won"
                  const active = s === activeProspect.stage
                  return <button key={s} onClick={() => updateStage(s)} className="flex w-full items-center gap-3 rounded-xl bg-[#10223a] p-3 text-left"><span className={cn("grid h-7 w-7 place-items-center rounded-full", done ? "bg-emerald-500" : active ? "bg-violet-600" : "bg-slate-700")}>{done ? "✓" : stageIndex + 1}</span><span className="flex-1 font-bold text-white">{stageLabels[s]}</span><span className={cn("text-xs font-black", done ? "text-emerald-300" : active ? "text-violet-300" : "text-[#cbd5e1]")}>{done ? "Completed" : active ? "Current Stage" : "Pending"}</span></button>
                })}
              </div>
            </Panel>
          </aside>
        </section>

        {editing && draft && (
          <section className="mt-4 rounded-3xl border border-violet-400/40 bg-gradient-to-br from-[#10223a] via-[#0e1e34] to-[#07111f] p-5 shadow-[0_24px_70px_rgba(0,0,0,.35)]">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[.18em] text-violet-200">Enterprise Profile Editor</div>
                <h2 className="mt-1 text-2xl font-black text-white">Edit Full Prospect Profile</h2>
                <p className="mt-1 text-sm font-bold text-[#cbd5e1]">
                  Updates are saved to the live profile store and reflected across directory, tasks, appointments and analytics.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setDraft(activeProspect); setEditing(false) }}
                  className="rounded-xl border border-[#315474] bg-[#07111f] px-4 py-3 text-sm font-black text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDraft}
                  className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_12px_30px_rgba(16,185,129,.25)]"
                >
                  Save Live Changes
                </button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
              <Panel title="1. Company & Identity">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Prospect / Company Name" value={draft.name} onChange={(v) => setDraft({ ...(draft || activeProspect), name: v, company: v })} />
                  <Input label="Company Legal / Display Name" value={draft.company || draft.name} onChange={(v) => setDraft({ ...(draft || activeProspect), company: v })} />
                  <SelectField label="Type / Sector" value={draft.type || ""} options={profileSectorOptions} onChange={(v) => setDraft({ ...(draft || activeProspect), type: v as ProspectType })} />
                  <SelectField label="Source" value={draft.source || ""} options={profileSourceOptions} onChange={(v) => setDraft({ ...(draft || activeProspect), source: v })} />
                  <SelectField label="City / Zone" value={draft.city || ""} options={profileCityOptions} onChange={(v) => setDraft({ ...(draft || activeProspect), city: v })} />
                  <Input label="Address / Location" value={draft.address || ""} onChange={(v) => setDraft({ ...(draft || activeProspect), address: v })} />
                </div>
              </Panel>

              <Panel title="2. Commercial Classification">
                <div className="grid gap-3 md:grid-cols-2">
                  <SelectField label="Stage" value={draft.stage || ""} options={profileStageOptions} onChange={(v) => setDraft({ ...(draft || activeProspect), stage: v as ProspectStage })} />
                  <SelectField label="Owner" value={draft.owner || ""} options={profileOwnerOptions} onChange={(v) => setDraft({ ...(draft || activeProspect), owner: v })} />
                  <Input label="Potential Value MAD" value={String(draft.valueMad || 0)} onChange={(v) => setDraft({ ...(draft || activeProspect), valueMad: Number(v || 0) })} />
                  <Input label="Probability %" value={String(draft.probability || 0)} onChange={(v) => setDraft({ ...(draft || activeProspect), probability: Number(v || 0) })} />
                  <Input label="Score" value={String(draft.score || 0)} onChange={(v) => setDraft({ ...(draft || activeProspect), score: Number(v || 0) })} />
                  <Input label="Expected Close / Next Contact" value={draft.nextContactDate || ""} onChange={(v) => setDraft({ ...(draft || activeProspect), nextContactDate: v })} />
                </div>
              </Panel>

              <Panel title="3. Decision Maker & Contacts">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Decision Maker" value={draft.decisionMaker || draft.contactName || ""} onChange={(v) => setDraft({ ...(draft || activeProspect), decisionMaker: v, contactName: v })} />
                  <Input label="Primary Contact Name" value={draft.contactName || ""} onChange={(v) => setDraft({ ...(draft || activeProspect), contactName: v })} />
                  <Input label="Phone" value={draft.phone || ""} onChange={(v) => setDraft({ ...(draft || activeProspect), phone: v })} />
                  <Input label="Email" value={draft.email || ""} onChange={(v) => setDraft({ ...(draft || activeProspect), email: v })} />
                  <SelectField label="Decision Maker Confirmed" value={draft.decisionMakerConfirmed ? "yes" : "no"} options={profileYesNoOptions} onChange={(v) => setDraft({ ...(draft || activeProspect), decisionMakerConfirmed: v === "yes" })} />
                  <Input label="Stakeholders CSV" value={(draft.stakeholders || []).join(", ")} onChange={(v) => setDraft({ ...(draft || activeProspect), stakeholders: v.split(",").map((x) => x.trim()).filter(Boolean) })} />
                </div>
              </Panel>

              <Panel title="4. Business Model & Fit">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Fit Score" value={String(draft.fitScore || 0)} onChange={(v) => setDraft({ ...(draft || activeProspect), fitScore: Number(v || 0) })} />
                  <Input label="Urgency" value={String(draft.urgency || 0)} onChange={(v) => setDraft({ ...(draft || activeProspect), urgency: Number(v || 0) })} />
                  <SelectField label="Service Interest" value={draft.serviceInterest || ""} options={profileServiceInterestOptions} onChange={(v) => setDraft({ ...(draft || activeProspect), serviceInterest: v })} />
                  <Input label="Competitor Risk" value={draft.competitorRisk || ""} onChange={(v) => setDraft({ ...(draft || activeProspect), competitorRisk: v })} />
                  <SelectField label="Budget Signal" value={draft.budgetSignal || ""} options={profileSignalOptions} onChange={(v) => setDraft({ ...(draft || activeProspect), budgetSignal: v })} />
                  <SelectField label="Contract Readiness" value={draft.contractReadiness || ""} options={profileContractReadinessOptions} onChange={(v) => setDraft({ ...(draft || activeProspect), contractReadiness: v })} />
                </div>
              </Panel>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <Panel title="5. Strategic Notes">
                <textarea
                  value={draft.notes || ""}
                  onChange={(e) => setDraft({ ...(draft || activeProspect), notes: e.target.value })}
                  placeholder="Internal strategic notes, objections, decision mapping, risk, next commercial action..."
                  className="min-h-[150px] w-full rounded-xl border border-[#315474] bg-[#081525] p-4 text-sm font-bold text-white outline-none placeholder:text-white/40"
                />
              </Panel>

              <Panel title="6. Next Action Control">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Next Action" value={draft.nextAction || ""} onChange={(v) => setDraft({ ...(draft || activeProspect), nextAction: v })} />
                  <Input label="Next Action Owner" value={draft.nextActionOwner || draft.owner || ""} onChange={(v) => setDraft({ ...(draft || activeProspect), nextActionOwner: v })} />
                  <SelectField label="Priority / Temperature" value={draft.temperature || ""} options={profileSignalOptions} onChange={(v) => setDraft({ ...(draft || activeProspect), temperature: v })} />
                  <Input label="Tags CSV" value={(draft.tags || []).join(", ")} onChange={(v) => setDraft({ ...(draft || activeProspect), tags: v.split(",").map((x) => x.trim()).filter(Boolean) })} />
                </div>
              </Panel>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}



function ProfileTaskViewEditModal({
  task,
  prospect,
  onClose,
  onSaved,
}: {
  task: ProfileTask
  prospect: ProspectRecord
  onClose: () => void
  onSaved: () => void
}) {
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    title: task.title || "",
    description: task.description || "",
    priority: task.priority === "High" ? "high" : task.priority === "Low" ? "low" : "medium",
    owner: task.owner || prospect.owner || "BD Officer",
    assignedRole: task.role || "Business Developer",
    department: "Revenue",
    taskType: task.type || "prospect_follow_up",
    startAt: task.startAt ? String(task.startAt).slice(0, 16) : "",
    endAt: task.endAt ? String(task.endAt).slice(0, 16) : "",
    dueDate: task.dueDate || (task.due && task.due.includes("-") ? task.due.slice(-10) : todayPlus(1)),
    location: task.location || `${prospect.city} Command Zone`,
    outcomeExpected: task.outcome || "",
    escalationRule: task.escalation || "Escalate to Revenue Manager if not completed by due date.",
    dependencies: task.dependencies || "",
    tags: (task.tags || ["revenue", "prospect-profile", "execution"]).join(","),
    statusLabel: task.statusLabel || (task.done ? "Completed" : "Open"),
    status: task.done ? "done" : "open",
    visibility: "team",
    reminderMinutes: "15",
  })

  const readonly = mode === "view"

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save() {
    if (!task.remoteId && !task.id) return
    setSaving(true)
    setError("")
    try {
      const response = await fetch("/api/revenue-command-center/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          taskId: task.remoteId || task.id,
          entityId: prospect.id,
          title: form.title,
          description: form.description,
          priority: form.priority,
          owner: form.owner,
          dueDate: form.dueDate,
          startAt: form.startAt || null,
          endAt: form.endAt || null,
          taskType: form.taskType,
          department: form.department,
          assignedRole: form.assignedRole,
          location: form.location,
          outcomeExpected: form.outcomeExpected,
          escalationRule: form.escalationRule,
          dependencies: form.dependencies,
          tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          visibility: form.visibility,
          reminderMinutes: Number(form.reminderMinutes || 15),
          addToCalendar: true,
          sendNotifications: true,
          status: form.status,
          statusLabel: form.statusLabel,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to update task")
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save task")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rcc-shell-content w-full max-w-none min-w-0 fixed inset-x-0 bottom-0 top-[96px] z-[2147483000] overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <style dangerouslySetInnerHTML={{ __html: `
        [data-profile-full-task-modal] *,
        [data-profile-full-task-modal] .force-white {
          color: #ffffff !important;
          opacity: 1 !important;
        }
        [data-profile-full-task-modal] input,
        [data-profile-full-task-modal] textarea,
        [data-profile-full-task-modal] select {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }
        [data-profile-full-task-modal] input:disabled,
        [data-profile-full-task-modal] textarea:disabled,
        [data-profile-full-task-modal] select:disabled {
          opacity: .78 !important;
          cursor: default;
        }
      ` }} />
      <div data-profile-full-task-modal="true" className="mx-auto w-full max-w-[1540px] rounded-[32px] border border-[#315474] bg-[#071426] p-7 shadow-[0_30px_90px_rgba(0,0,0,.72)]">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/20 text-violet-200">
              <BriefcaseBusiness className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">Linked task · live Supabase sync</div>
              <h2 className="mt-1 text-3xl font-black text-white">{mode === "view" ? "View Task Control File" : "Edit Task Control File"}</h2>
              <p className="mt-1 text-sm font-bold text-white/75">Linked to {prospect.name}. This is the full task modal: view, edit, save, and sync with Daily Tasks, profile tasks, analytics and timeline.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setMode(mode === "view" ? "edit" : "view")} className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-5 py-3 text-sm font-black text-white">
              {mode === "view" ? "Edit Mode" : "View Mode"}
            </button>
            <button onClick={onClose} className="rounded-xl border border-[#315474] bg-[#10223a] px-5 py-3 text-sm font-black text-white">Close</button>
            <button disabled={readonly || saving || !form.title.trim()} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-45">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl text-white hover:bg-white/10"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-black text-red-100">{error}</div>}

        <section className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-[#244365] bg-[#10223a] p-4 md:grid-cols-4">
          <FullTaskFeature icon={<Link2 />} title="Prospect" value={prospect.name} detail={prospect.city} />
          <FullTaskFeature icon={<Clock3 />} title="Current Status" value={form.statusLabel} detail={mode === "view" ? "view mode" : "editable"} />
          <FullTaskFeature icon={<Users />} title="Owner" value={form.owner} detail={form.assignedRole} />
          <FullTaskFeature icon={<CalendarDays />} title="Due" value={form.dueDate || "No due date"} detail="task schedule" />
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Core Task Details">
            <Input disabled={readonly} label="Task Title" value={form.title} onChange={(v) => update("title", v)} />
            <CommandTextarea disabled={readonly} label="Description / Execution Brief" value={form.description} onChange={(v) => update("description", v)} placeholder="Execution details..." />
            <CommandTextarea disabled={readonly} label="Expected Outcome" value={form.outcomeExpected} onChange={(v) => update("outcomeExpected", v)} placeholder="Expected result..." />
          </Panel>

          <Panel title="Status & Classification">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">Status</span>
                <select disabled={readonly} value={form.statusLabel} onChange={(e) => {
                  const label = e.target.value
                  update("statusLabel", label)
                  update("status", label === "Completed" ? "done" : label === "Cancelled" ? "cancelled" : "open")
                }} className="h-12 rounded-xl border border-[#315474] bg-[#070b19] px-4 text-sm font-bold text-white outline-none">
                  {["Open", "In Progress", "Scheduled", "Pending", "Completed", "Cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">Priority</span>
                <select disabled={readonly} value={form.priority} onChange={(e) => update("priority", e.target.value)} className="h-12 rounded-xl border border-[#315474] bg-[#070b19] px-4 text-sm font-bold text-white outline-none">
                  {["low", "medium", "high", "critical"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <Input disabled={readonly} label="Task Type" value={form.taskType} onChange={(v) => update("taskType", v)} />
              <Input disabled={readonly} label="Tags" value={form.tags} onChange={(v) => update("tags", v)} />
              <Input disabled={readonly} label="Visibility" value={form.visibility} onChange={(v) => update("visibility", v)} />
              <Input disabled={readonly} label="Reminder Minutes" value={form.reminderMinutes} onChange={(v) => update("reminderMinutes", v)} />
            </div>
          </Panel>

          <Panel title="Schedule & Timing">
            <div className="grid gap-3 md:grid-cols-2">
              <Input disabled={readonly} type="datetime-local" label="Start" value={form.startAt} onChange={(v) => update("startAt", v)} />
              <Input disabled={readonly} type="datetime-local" label="End" value={form.endAt} onChange={(v) => update("endAt", v)} />
              <Input disabled={readonly} type="date" label="Due Date" value={form.dueDate} onChange={(v) => update("dueDate", v)} />
              <Input disabled={readonly} label="Location" value={form.location} onChange={(v) => update("location", v)} />
            </div>
          </Panel>

          <Panel title="Ownership & Controls">
            <div className="grid gap-3 md:grid-cols-2">
              <Input disabled={readonly} label="Owner" value={form.owner} onChange={(v) => update("owner", v)} />
              <Input disabled={readonly} label="Assigned Role" value={form.assignedRole} onChange={(v) => update("assignedRole", v)} />
              <Input disabled={readonly} label="Department" value={form.department} onChange={(v) => update("department", v)} />
              <Input disabled value="Current prospect" label="Linked Entity" onChange={() => undefined} />
            </div>
            <CommandTextarea disabled={readonly} label="Escalation Rule" value={form.escalationRule} onChange={(v) => update("escalationRule", v)} placeholder="Escalation rule..." />
            <CommandTextarea disabled={readonly} label="Dependencies / Blockers" value={form.dependencies} onChange={(v) => update("dependencies", v)} placeholder="Dependencies..." />
          </Panel>
        </div>

        <section className="mt-5 rounded-2xl border border-amber-500/40 bg-[#07111f]/80 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[.14em] text-amber-300">
            <BriefcaseBusiness className="h-4 w-4" /> Task Preview
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            <Preview label="Prospect" value={`${prospect.name} · ${prospect.city}`} />
            <Preview label="Title" value={form.title || "—"} />
            <Preview label="Owner" value={form.owner || "—"} />
            <Preview label="Priority" value={form.priority || "—"} />
            <Preview label="Status" value={form.statusLabel || "—"} />
          </div>
        </section>
      </div>
    </div>
  )
}


function Preview({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-white/10 last:border-r-0">
      <div className="text-xs font-bold text-white/60">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-white">{value}</div>
    </div>
  )
}

function FullTaskFeature({ icon, title, value, detail }: { icon: React.ReactNode; title: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[#244365] bg-[#07111f] p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15 text-blue-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-[.14em] text-white/60">{title}</span>
          <span className="block truncate text-base font-black text-white">{value}</span>
          <span className="block truncate text-xs font-semibold text-white/70">{detail}</span>
        </span>
      </div>
    </div>
  )
}


function ProfileTabWorkspace({
  activeTab,
  prospect,
  tasks,
  appointments,
  comments,
  documents,
  onSave,
  onAddTask,
  onSchedule,
  onPostComment,
  onUploadDocument,
  onDownloadReport,
}: {
  activeTab: string
  prospect: ProspectRecord
  tasks: ProfileTask[]
  appointments: ProfileAppointment[]
  comments: ProfileComment[]
  documents: string[]
  onSave: (prospect: ProspectRecord, action: string, note: string) => void
  onAddTask: () => void
  onSchedule: () => void
  onPostComment: (note: string) => void
  onUploadDocument: () => void
  onDownloadReport: () => void
}) {
  const [note, setNote] = useState("")

  function submitNote() {
    if (!note.trim()) return
    onPostComment(note.trim())
    setNote("")
  }

  if (activeTab === "Company Details") {
    return (
      <section className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
        <TabHeader title="Company Details" subtitle="Operational identity, qualification, ownership and AngelCare expansion context." />
        <div className="grid gap-4 xl:grid-cols-3">
          <DetailCard title="Legal / Operating Identity">
            <MetricRow label="Company Name" value={prospect.name} />
            <MetricRow label="City" value={prospect.city} />
            <MetricRow label="Source" value={prospect.source} />
            <MetricRow label="Segment" value={prospect.type} />
            <MetricRow label="Owner" value={prospect.owner} />
          </DetailCard>
          <DetailCard title="Qualification Context">
            <MetricRow label="Need Summary" value={prospect.needSummary || "Needs structured AngelCare qualification."} />
            <MetricRow label="Pain Points" value={prospect.painPoints || "Not fully documented yet."} />
            <MetricRow label="Budget Context" value={prospect.budgetContext || "To be confirmed."} />
            <MetricRow label="Competitor Risk" value={prospect.competitorRisk || "Monitoring"} />
          </DetailCard>
          <DetailCard title="Action Controls">
            <button onClick={() => onSave({ ...prospect, decisionMakerConfirmed: true }, "Decision maker confirmed", prospect.contactName)} className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-black text-slate-950">Confirm Decision Maker</button>
            <button onClick={() => onSave({ ...prospect, fitScore: Math.min(100, prospect.fitScore + 5) }, "Company fit reviewed", "+5 fit score")} className="mt-3 w-full rounded-xl bg-violet-700 px-4 py-3 font-black text-white">Improve Fit Score</button>
            <button onClick={onDownloadReport} className="mt-3 w-full rounded-xl border border-[#244365] bg-[#10223a] px-4 py-3 font-black text-white">Download Company Brief</button>
          </DetailCard>
        </div>
      </section>
    )
  }

  if (activeTab === "Contacts") {
    return (
      <section className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
        <TabHeader title="Contacts" subtitle="Decision maker, influencers, stakeholders and direct communication controls." />
        <div className="grid gap-4 xl:grid-cols-3">
          <DetailCard title="Primary Decision Maker">
            <Person name={prospect.contactName || prospect.decisionMaker || "N/A"} role={prospect.owner} primary />
            <MetricRow label="Phone" value={prospect.phone || "Missing"} />
            <MetricRow label="Email" value={prospect.email || "Missing"} />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <a href={prospect.phone ? `tel:${prospect.phone}` : "#"} className="rounded-xl bg-emerald-600 px-3 py-2 text-center text-xs font-black text-white">Call</a>
              <a href={prospect.phone ? `https://wa.me/${prospect.phone.replace(/\D/g, "")}` : "#"} target="_blank" className="rounded-xl bg-green-600 px-3 py-2 text-center text-xs font-black text-white">WhatsApp</a>
              <a href={prospect.email ? `mailto:${prospect.email}` : "#"} className="rounded-xl bg-blue-600 px-3 py-2 text-center text-xs font-black text-white">Email</a>
            </div>
          </DetailCard>
          <DetailCard title="Influencers">
            {(prospect.stakeholders.length ? prospect.stakeholders : ["Operations Manager", "Finance Contact", "Pedagogic Lead"]).map((s, i) => (
              <Person key={s} name={s} role={i === 0 ? "High Influence" : "Medium Influence"} />
            ))}
            <button
              onClick={() => {
                const fullName = `Stakeholder ${prospect.stakeholders.length + 1}`
                onSave({ ...prospect, stakeholders: [...prospect.stakeholders, fullName] }, "Stakeholder added", "Contact map expanded")
                addProspectContact({ prospectId: prospect.id, fullName, role: "Influencer", influenceLevel: "medium" }).catch((error) => console.warn("Contact saved locally only", error))
              }}
              className="mt-3 w-full rounded-xl bg-violet-700 px-4 py-3 font-black text-white"
            >
              Add Stakeholder
            </button>
          </DetailCard>
          <DetailCard title="Contact Notes">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add contact note..." className="min-h-[130px] w-full rounded-xl border border-[#244365] bg-[#081525] p-3 text-sm font-bold text-white outline-none" />
            <button onClick={submitNote} className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-3 font-black text-slate-950">Save Contact Note</button>
          </DetailCard>
        </div>
      </section>
    )
  }

  if (activeTab === "Business Model Fit") {
    return (
      <section className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
        <TabHeader title="Business Model Fit" subtitle="AngelCare operating model alignment, offer structure, risk and conversion logic." />
        <div className="grid gap-4 xl:grid-cols-4">
          <DetailCard title="Fit Score">
            <div className="text-6xl font-black text-emerald-300">{pct(prospect.fitScore)}</div>
            <div className="mt-2 text-sm font-bold text-[#cbd5e1]">AngelCare model compatibility</div>
            <button onClick={() => onSave({ ...prospect, fitScore: Math.min(100, prospect.fitScore + 10) }, "Fit score recalculated", "+10")} className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-3 font-black text-slate-950">Recalculate Fit</button>
          </DetailCard>
          <DetailCard title="Revenue Model">
            <MetricRow label="Potential Value" value={mad(prospect.valueMad)} />
            <MetricRow label="Probability" value={pct(prospect.probability)} />
            <MetricRow label="Expected Weighted Value" value={mad(prospect.valueMad * (prospect.probability / 100))} />
            <MetricRow label="Contract Type" value="Annual B2B" />
          </DetailCard>
          <DetailCard title="Risk & Objection">
            <MetricRow label="Objection" value={prospect.objection || "No objection logged"} />
            <MetricRow label="Competitor Risk" value={prospect.competitorRisk || "Monitoring"} />
            <MetricRow label="Health" value={prospect.health} />
            <button onClick={() => onSave({ ...prospect, health: "on_track", recoveryPlan: "Recovery motion reviewed" }, "Risk reviewed", "Health moved on track")} className="mt-3 w-full rounded-xl bg-violet-700 px-4 py-3 font-black text-white">Mark On Track</button>
          </DetailCard>
          <DetailCard title="Proposal Control">
            <MetricRow label="Proposed Offer" value={prospect.proposedOffer || "AngelCare B2B package"} />
            <MetricRow label="Terms" value={prospect.negotiationTerms || "To define"} />
            <button onClick={() => onSave({ ...prospect, stage: "proposal", probability: Math.max(prospect.probability, 60) }, "Proposal advanced", "Moved to proposal")} className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 font-black text-white">Move To Proposal</button>
          </DetailCard>
        </div>
      </section>
    )
  }

  if (activeTab === "Documents") {
    return (
      <section className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
        <TabHeader title="Documents" subtitle="Proposal files, qualification briefs, pricing assets and generated reports." />
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="grid gap-3 md:grid-cols-2">
            {documents.map((doc, i) => (
              <div key={`${doc}-${i}`} className="flex items-center gap-3 rounded-2xl border border-[#244365] bg-[#10223a] p-4">
                <FileText className="h-6 w-6 text-red-300" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-black text-white">{doc}</div>
                  <div className="text-xs font-bold text-[#cbd5e1]">{(i + 1) * 0.8} MB · profile document</div>
                </div>
                <button onClick={onDownloadReport} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">Open</button>
              </div>
            ))}
          </div>
          <DetailCard title="Document Controls">
            <button onClick={onUploadDocument} className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-black text-slate-950">Upload / Add Document</button>
            <button onClick={onDownloadReport} className="mt-3 w-full rounded-xl bg-violet-700 px-4 py-3 font-black text-white">Generate Profile Report</button>
          </DetailCard>
        </div>
      </section>
    )
  }

  if (activeTab === "Communications") {
    return (
      <section className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
        <TabHeader title="Communications" subtitle="Timeline of comments, calls, WhatsApp, email and meeting actions." />
        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="rounded-2xl border border-[#244365] bg-[#10223a] p-4">
                <div className="flex justify-between text-xs font-black text-[#cbd5e1]"><span>{c.author} · {c.channel}</span><span>{c.at}</span></div>
                <p className="mt-2 text-sm font-semibold text-white">{c.note}</p>
              </div>
            ))}
          </div>
          <DetailCard title="New Communication">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Log call, WhatsApp, meeting or email..." className="min-h-[160px] w-full rounded-xl border border-[#244365] bg-[#081525] p-3 text-sm font-bold text-white outline-none" />
            <button onClick={submitNote} className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-3 font-black text-slate-950">Log Communication</button>
          </DetailCard>
        </div>
      </section>
    )
  }

  if (activeTab === "Financial Profile") {
    return (
      <section className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
        <TabHeader title="Financial Profile" subtitle="Revenue value, probability, forecast and conversion economics." />
        <div className="grid gap-4 xl:grid-cols-4">
          <DetailCard title="Pipeline Value"><div className="text-4xl font-black text-white">{mad(prospect.valueMad)}</div><div className="mt-2 text-sm font-bold text-emerald-300">Live prospect value</div></DetailCard>
          <DetailCard title="Weighted Forecast"><div className="text-4xl font-black text-white">{mad(prospect.valueMad * (prospect.probability / 100))}</div><div className="mt-2 text-sm font-bold text-blue-300">{pct(prospect.probability)} probability</div></DetailCard>
          <DetailCard title="Upside Potential"><div className="text-4xl font-black text-white">{mad(prospect.valueMad * 1.8)}</div><div className="mt-2 text-sm font-bold text-violet-300">Expansion model</div></DetailCard>
          <DetailCard title="Financial Controls"><button onClick={() => onSave({ ...prospect, probability: Math.min(100, prospect.probability + 5) }, "Probability improved", "+5 probability")} className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-black text-slate-950">Improve Probability</button></DetailCard>
        </div>
      </section>
    )
  }

  if (activeTab === "Custom Fields") {
    return (
      <section className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
        <TabHeader title="Custom Fields" subtitle="AngelCare internal qualification controls and custom business signals." />
        <div className="grid gap-4 xl:grid-cols-3">
          <DetailCard title="AngelCare Signals">
            <MetricRow label="Urgency" value={pct(prospect.urgency)} />
            <MetricRow label="Fit Score" value={pct(prospect.fitScore)} />
            <MetricRow label="Decision Confirmed" value={prospect.decisionMakerConfirmed ? "Yes" : "No"} />
            <MetricRow label="Priority" value={prospect.priority} />
          </DetailCard>
          <DetailCard title="Tasks Linked">
            {tasks.slice(0, 5).map((task) => <MetricRow key={task.id} label={task.title} value={task.done ? "Done" : task.due} />)}
            <button onClick={onAddTask} className="mt-3 w-full rounded-xl bg-violet-700 px-4 py-3 font-black text-white">Add Linked Task</button>
          </DetailCard>
          <DetailCard title="Appointments Linked">
            {appointments.slice(0, 5).map((appointment) => <MetricRow key={appointment.id} label={appointment.title} value={appointment.at} />)}
            <button onClick={onSchedule} className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 font-black text-white">Schedule Linked Appointment</button>
          </DetailCard>
        </div>
      </section>
    )
  }

  return null
}

function TabHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="text-xs font-black uppercase tracking-[.18em] text-violet-300">Active profile section</div>
        <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
        <p className="mt-1 text-sm font-bold text-[#cbd5e1]">{subtitle}</p>
      </div>
    </div>
  )
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#244365] bg-[#10223a] p-5">
      <h3 className="mb-4 text-sm font-black uppercase tracking-[.1em] text-white">{title}</h3>
      
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

      {children}
    </div>
  )
}


function TaskCreateModal({
  prospect,
  onClose,
  onSubmit,
}: {
  prospect: ProspectRecord
  onClose: () => void
  onSubmit: (payload: { title: string; description: string; priority: "low" | "medium" | "high" | "critical"; owner: string; dueDate: string }) => void
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    owner: prospect.owner || "BD Officer",
    dueDate: todayPlus(1),
  })

  return (
    <CommandModal title="Create Real Task" subtitle={`Linked to ${prospect.name}`} onClose={onClose}>
      <CommandInput label="Task title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="Example: Send ROI proposal before Friday" />
      <CommandTextarea label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} placeholder="Clear execution details, context, expected output..." />
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">Priority</span>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })} className="rounded-2xl border border-[#315474] bg-[#10223a] p-3 text-sm font-bold text-white outline-none">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <CommandInput label="Owner" value={form.owner} onChange={(value) => setForm({ ...form, owner: value })} />
        <CommandInput label="Due date" value={form.dueDate} onChange={(value) => setForm({ ...form, dueDate: value })} type="date" />
      </div>
      <button
        type="button"
        onClick={() => form.title.trim() && onSubmit({ ...form, title: form.title.trim() })}
        className="mt-5 w-full rounded-2xl bg-emerald-500 px-5 py-4 text-base font-black text-slate-950"
      >
        Create Task
      </button>
    </CommandModal>
  )
}

function AppointmentCreateModal({
  prospect,
  onClose,
  onSubmit,
}: {
  prospect: ProspectRecord
  onClose: () => void
  onSubmit: (payload: { title: string; appointmentAt: string; owner: string; location: string; notes: string }) => void
}) {
  const [form, setForm] = useState({
    title: "",
    appointmentAt: `${todayPlus(2)}T11:00`,
    owner: prospect.owner || "BD Officer",
    location: "AngelCare / Client meeting",
    notes: "",
  })

  return (
    <CommandModal title="Schedule Real Appointment" subtitle={`Linked to ${prospect.name}`} onClose={onClose}>
      <CommandInput label="Appointment title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="Example: Final decision meeting with director" />
      <div className="grid gap-3 md:grid-cols-3">
        <CommandInput label="Date & time" value={form.appointmentAt} onChange={(value) => setForm({ ...form, appointmentAt: value })} type="datetime-local" />
        <CommandInput label="Owner" value={form.owner} onChange={(value) => setForm({ ...form, owner: value })} />
        <CommandInput label="Location" value={form.location} onChange={(value) => setForm({ ...form, location: value })} />
      </div>
      <CommandTextarea label="Meeting notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} placeholder="Agenda, objectives, stakeholders, next expected decision..." />
      <button
        type="button"
        onClick={() => form.title.trim() && onSubmit({ ...form, title: form.title.trim() })}
        className="mt-5 w-full rounded-2xl bg-blue-500 px-5 py-4 text-base font-black text-white"
      >
        Schedule Appointment
      </button>
    </CommandModal>
  )
}

function DocumentCreateModal({
  prospect,
  onClose,
  onSubmit,
}: {
  prospect: ProspectRecord
  onClose: () => void
  onSubmit: (payload: { title: string; documentType: string; fileUrl: string }) => void
}) {
  const [form, setForm] = useState({
    title: "",
    documentType: "profile",
    fileUrl: "",
  })

  return (
    <CommandModal title="Add Real Document Metadata" subtitle={`Linked to ${prospect.name}`} onClose={onClose}>
      <CommandInput label="Document title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="Example: Signed partnership proposal.pdf" />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">Document type</span>
          <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} className="rounded-2xl border border-[#315474] bg-[#10223a] p-3 text-sm font-bold text-white outline-none">
            <option value="profile">Profile</option>
            <option value="proposal">Proposal</option>
            <option value="contract">Contract</option>
            <option value="pricing">Pricing</option>
            <option value="report">Report</option>
            <option value="meeting">Meeting</option>
          </select>
        </label>
        <CommandInput label="File URL optional" value={form.fileUrl} onChange={(value) => setForm({ ...form, fileUrl: value })} placeholder="Paste storage URL when available" />
      </div>
      <button
        type="button"
        onClick={() => form.title.trim() && onSubmit({ ...form, title: form.title.trim() })}
        className="mt-5 w-full rounded-2xl bg-violet-600 px-5 py-4 text-base font-black text-white"
      >
        Add Document
      </button>
    </CommandModal>
  )
}

function CommandModal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-3xl border border-[#315474] bg-[#081525] p-6 shadow-[0_30px_90px_rgba(0,0,0,.55)]">
        <div className="mb-5 flex justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">Real action engine</div>
            <h2 className="text-2xl font-black text-white">{title}</h2>
            <p className="mt-1 text-sm font-bold text-[#cbd5e1]">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[#315474] bg-[#10223a] px-4 py-2 text-sm font-black text-white">Close</button>
        </div>
        <div className="rcc-shell-content w-full max-w-none min-w-0 grid gap-3">
      {children}</div>
      </div>
    </div>
  )
}

function CommandInput({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-2xl border border-[#315474] bg-[#10223a] p-3 text-sm font-bold text-white outline-none placeholder:text-slate-400" />
    </label>
  )
}

function CommandTextarea({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span>
      <textarea
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[104px] rounded-xl border border-[#315474] bg-[#10223a] p-4 text-sm font-bold text-white outline-none placeholder:text-white/45 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </label>
  )
}

function LiveTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[#244365] bg-[#07111f]/90 p-4">
      <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#94a3b8]">{label}</div>
      <div className="mt-1 truncate text-lg font-black text-white">{value}</div>
      <div className="truncate text-xs font-bold text-[#cbd5e1]">{detail}</div>
    </div>
  )
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_20px_60px_rgba(0,0,0,.25)]"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-[.08em] text-white">{title}</h2>{action}</div>{children}</section>
}

function ActionButton({ onClick, icon, label, tone }: { onClick: () => void; icon: React.ReactNode; label: string; tone: "emerald" | "green" | "blue" | "violet" | "rose" | "slate" }) {
  const tones = { emerald: "bg-emerald-600", green: "bg-green-600", blue: "bg-blue-600", violet: "bg-violet-700", rose: "bg-red-600", slate: "bg-[#172942]" }
  return <button onClick={onClick} className={cn("inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white", tones[tone])}>{icon}{label}</button>
}

function ScoreBadge({ score }: { score: number }) {
  return <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-center text-2xl font-black text-emerald-300">{Number(score || 0).toFixed(1)}<div className="text-xs">Score</div></div>
}

function StageSummary({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone: "violet" | "emerald" | "blue" | "amber" }) {
  const tones = { violet: "text-violet-200", emerald: "text-emerald-300", blue: "text-blue-300", amber: "text-amber-300" }
  return <div className="rounded-2xl border border-[#244365] bg-[#10223a] p-5"><div className="text-xs font-black uppercase text-slate-400">{label}</div><div className={cn("mt-2 text-2xl font-black", tones[tone])}>{value}</div><div className="mt-1 text-xs font-bold text-[#cbd5e1]">{detail}</div></div>
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex gap-3"><div className="text-slate-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</div><div><div className="text-xs font-black text-slate-400">{label}</div><div className="font-bold text-white">{value}</div></div></div>
}

function CheckLine({ label, status }: { label: string; status: string }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-[#cbd5e1]">✓ {label}</span><span className="text-emerald-300">{status}</span></div>
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-b border-white/5 py-2 text-sm"><span className="text-[#cbd5e1]">{label}</span><span className="font-black text-white">{value}</span></div>
}

function Person({ name, role, primary }: { name: string; role: string; primary?: boolean }) {
  return <div className="mb-3 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-sky-400 text-sm font-black text-slate-950">{initials(name)}</div><div className="flex-1"><div className="font-black text-white">{name}</div><div className="text-xs text-[#cbd5e1]">{role}</div></div>{primary && <span className="rounded-lg bg-violet-700 px-2 py-1 text-xs font-black">Primary</span>}</div>
}

function ActivityDot() { return <span className="mt-1 grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white">●</span> }
function HealthLine() { return <div className="h-full rounded-xl bg-[linear-gradient(135deg,transparent,rgba(16,185,129,.35))]" /> }


function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
}) {
  return (
    <label className="block">
      <div className="mb-2 text-[11px] font-black uppercase tracking-[.18em] text-[#cbd5e1]">{label}</div>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-[#315474] bg-[#081525] px-3 text-sm font-bold text-white outline-none transition focus:border-cyan-400"
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#081525] text-white">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function Input({
  label,
  value,
  onChange,
  className = "",
  type = "text",
  disabled = false,
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  className?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      {label && <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span>}
      <input
        disabled={disabled}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-[#315474] bg-[#10223a] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/45 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </label>
  )
}
