"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  Archive,
  BadgeCheck,
  Banknote,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Download,
  Ellipsis,
  FileCheck2,
  FileText,
  GraduationCap,
  History,
  KeyRound,
  Languages,
  LayoutDashboard,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  NotebookPen,
  PackageCheck,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
  WalletCards,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react"
import type { Ambassador, AmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/types"

type Row = Record<string, any>

type AmbassadorDirectoryRouteProps = {
  snapshot: AmbassadorWorkspaceSnapshot
  kpis: Record<string, number>
  loading: boolean
  refreshing: boolean
  error?: string | null
  success?: string | null
  diagnostics?: Row[]
  query: string
  statusFilter: string
  regionFilter: string
  territoryFilter: string
  sortKey: string
  regions: string[]
  territories: Ambassador[]
  filteredAmbassadors: Ambassador[]
  onQueryChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onRegionFilterChange: (value: string) => void
  onTerritoryFilterChange: (value: string) => void
  onSortKeyChange: (value: string) => void
  onRefresh: () => void
  onAddAmbassador: () => void
  onAssignTerritory: (ambassador: Ambassador | null) => void
  onCreateMission: (ambassador: Ambassador | null) => void
  onExport: () => void
  onOpenProfile: (ambassador: Ambassador) => void
  onEditAmbassador: (ambassador: Ambassador) => void
  onArchiveAmbassador: (ambassador: Ambassador) => void
}

type DossierTab =
  | "overview"
  | "missions"
  | "leads"
  | "incentives"
  | "training"
  | "compliance"
  | "documents"
  | "history"

type DrawerMode = "details" | "activities"

type ModalKind =
  | null
  | "mission"
  | "lead"
  | "note"
  | "archive"
  | "training"
  | "document"
  | "score"
  | "more"

type PeriodFilter = "mtd" | "30d" | "90d" | "all"

interface DocumentControl {
  id: string
  key: string
  label: string
  required: boolean
  status:
    | "missing"
    | "requested"
    | "uploaded"
    | "review"
    | "validated"
    | "rejected"
    | "expired"
  reference: string
  reviewer: string
  note: string
  expiresAt: string
  updatedAt: string
}

interface InternalNote {
  id: string
  category: string
  priority: "low" | "normal" | "high" | "critical"
  visibility: "management" | "operations" | "finance" | "all"
  text: string
  owner: string
  followUpDate: string
  linkedType: string
  linkedId: string
  createdAt: string
  createdBy: string
}

interface DossierConfiguration {
  version: number

  preferredName: string
  whatsapp: string
  region: string
  zone: string
  address: string
  languages: string[]
  preferredChannel: string

  manager: string
  status:
    | "active"
    | "onboarding"
    | "inactive"
    | "suspended"
    | "archived"
  activationDate: string

  contractType: string
  contractStartDate: string
  contractEndDate: string
  autoRenew: boolean

  qualityScore: number
  leadGoal: number
  qualifiedLeadGoal: number
  conversionGoal: number
  fieldVisitGoal: number
  partnerMeetingGoal: number
  revenueGoal: number

  territoryId: string
  territoryName: string
  coverageMode: string
  radiusKm: number

  availability: string
  transportMode: string
  services: string[]
  channels: string[]

  commissionRate: 10
  commissionLocked: true
  commissionAccepted: boolean

  payoutCycle: string
  paymentMethod: string
  paymentReference: string
  paymentVerified: boolean

  portalAccessStatus: string
  crmAccessStatus: string
  starterKitStatus: string

  documents: DocumentControl[]
  notes: InternalNote[]

  archive: {
    archived: boolean
    reason: string
    effectiveDate: string
    managerApproval: string
    territoryReleaseRequested: boolean
    accessSuspensionRequested: boolean
    leadReassignmentTarget: string
    archivedAt: string
  }

  lastSavedAt: string
}

interface AmbassadorDossier {
  id: string
  candidateId: string
  onboardingId: string

  name: string
  phone: string
  email: string
  city: string
  photoUrl: string

  reference: string
  joinedAt: string
  createdAt: string
  updatedAt: string

  row: Row
  candidate: Row
  onboarding: Row
  metadata: Row
  configuration: DossierConfiguration
}

interface TimelineEvent {
  id: string
  type:
    | "mission"
    | "lead"
    | "conversion"
    | "payment"
    | "training"
    | "document"
    | "note"
    | "audit"
  title: string
  detail: string
  actor: string
  createdAt: string
}

interface ScoreBreakdown {
  global: number
  quality: number
  performance: number
  compliance: number
  training: number
  activity: number
  territory: number
  blockers: string[]
}

const SERVICES = [
  "Home Service",
  "Kindergarten & Preschool",
  "Academy",
  "Hospitality Kids Friendly",
  "Corporates Liner",
]

const CHANNELS = [
  "WhatsApp",
  "Appel",
  "Terrain",
  "Partenaires",
  "Événementiel",
  "B2B direct",
]

const DOCUMENT_BLUEPRINT: Array<
  Pick<DocumentControl, "key" | "label" | "required">
> = [
  {
    key: "identity",
    label: "CIN / passeport",
    required: true,
  },
  {
    key: "agreement",
    label: "Contrat ambassadeur",
    required: true,
  },
  {
    key: "commission",
    label: "Acceptation commission fixe 10%",
    required: true,
  },
  {
    key: "confidentiality",
    label: "Confidentialité & protection des données",
    required: true,
  },
  {
    key: "payment",
    label: "RIB / preuve bénéficiaire",
    required: true,
  },
  {
    key: "address",
    label: "Justificatif d’adresse",
    required: false,
  },
  {
    key: "profile_photo",
    label: "Photo officielle",
    required: false,
  },
]

const TABS: Array<{
  key: DossierTab
  label: string
  icon: LucideIcon
}> = [
  {
    key: "overview",
    label: "Vue 360°",
    icon: LayoutDashboard,
  },
  {
    key: "missions",
    label: "Missions",
    icon: BriefcaseBusiness,
  },
  {
    key: "leads",
    label: "Leads & conversions",
    icon: Target,
  },
  {
    key: "incentives",
    label: "Incentives & paiements",
    icon: WalletCards,
  },
  {
    key: "training",
    label: "Formations",
    icon: GraduationCap,
  },
  {
    key: "compliance",
    label: "Conformité",
    icon: ShieldCheck,
  },
  {
    key: "documents",
    label: "Documents",
    icon: FileText,
  },
  {
    key: "history",
    label: "Historique",
    icon: History,
  },
]

function asRecord(value: unknown): Row {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Row)
    : {}
}

function asRows(value: unknown): Row[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Row =>
          Boolean(item) &&
          typeof item === "object" &&
          !Array.isArray(item),
      )
    : []
}

function text(value: unknown): string {
  return String(value ?? "").trim()
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function boolValue(value: unknown): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === 1

  return [
    "true",
    "1",
    "yes",
    "oui",
    "validated",
    "approved",
    "completed",
  ].includes(text(value).toLowerCase())
}

function idOf(row?: Row): string {
  return text(row?.id || row?.uuid || row?.record_id)
}

function metadataOf(row?: Row): Row {
  return {
    ...asRecord(row?.payload),
    ...asRecord(row?.metadata),
  }
}

function extractRows(payload: unknown, keys: string[]): Row[] {
  if (Array.isArray(payload)) {
    return asRows(payload)
  }

  const root = asRecord(payload)
  const data = asRecord(root.data)

  for (const key of keys) {
    const direct = asRows(root[key])
    if (direct.length) return direct

    const nested = asRows(data[key])
    if (nested.length) return nested
  }

  for (const candidate of [
    root.records,
    root.items,
    data.records,
    data.items,
  ]) {
    const collection = asRows(candidate)
    if (collection.length) return collection
  }

  return []
}

function extractCreatedRow(payload: unknown): Row {
  const root = asRecord(payload)
  const data = asRecord(root.data)

  for (const candidate of [
    data.record,
    data.item,
    data.ambassador,
    data.mission,
    data.lead,
    data.note,
    data.document,
    root.record,
    root.item,
    root.ambassador,
    root.mission,
    root.lead,
    root.note,
    root.document,
    root.data,
    root,
  ]) {
    const row = asRecord(candidate)
    if (idOf(row)) return row
  }

  return root
}

function displayName(row?: Row): string {
  return (
    text(
      row?.full_name ||
        row?.display_name ||
        row?.candidate_name ||
        row?.name ||
        row?.title,
    ) || "Ambassadeur sans nom"
  )
}

function contactKey(row?: Row): string {
  const email = text(row?.email).toLowerCase()
  if (email) return `email:${email}`

  const phone = text(
    row?.phone || row?.telephone || row?.whatsapp,
  ).replace(/\D/g, "")

  if (phone) return `phone:${phone}`

  return `${displayName(row).toLowerCase()}|${text(
    row?.city || row?.main_city,
  ).toLowerCase()}`
}

function dateValue(value: unknown): string {
  const raw = text(value)
  if (!raw) return ""

  const parsed = new Date(raw)

  return Number.isNaN(parsed.getTime())
    ? raw.slice(0, 10)
    : parsed.toISOString().slice(0, 10)
}

function nowIso(): string {
  return new Date().toISOString()
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function normalizeStatus(
  value: unknown,
): DossierConfiguration["status"] {
  const status = text(value).toLowerCase()

  if (status.includes("archive")) return "archived"
  if (status.includes("suspend")) return "suspended"
  if (
    status.includes("inactive") ||
    status.includes("inactif")
  ) {
    return "inactive"
  }

  if (
    status.includes("onboarding") ||
    status.includes("integration")
  ) {
    return "onboarding"
  }

  return "active"
}

function statusLabel(
  status: DossierConfiguration["status"],
): string {
  return {
    active: "Actif",
    onboarding: "En onboarding",
    inactive: "Inactif",
    suspended: "Suspendu",
    archived: "Archivé",
  }[status]
}

function statusTone(
  status: DossierConfiguration["status"],
): string {
  return {
    active:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
    onboarding:
      "border-violet-200 bg-violet-50 text-violet-800",
    inactive:
      "border-rose-200 bg-rose-50 text-rose-800",
    suspended:
      "border-amber-200 bg-amber-50 text-amber-800",
    archived:
      "border-slate-300 bg-slate-100 text-slate-700",
  }[status]
}

function withinPeriod(row: Row, period: PeriodFilter): boolean {
  if (period === "all") return true

  const raw = text(
    row.created_at ||
      row.converted_at ||
      row.completed_at ||
      row.paid_at ||
      row.updated_at ||
      row.date,
  )

  if (!raw) return true

  const value = new Date(raw)
  if (Number.isNaN(value.getTime())) return true

  const now = new Date()

  if (period === "mtd") {
    return (
      value.getFullYear() === now.getFullYear() &&
      value.getMonth() === now.getMonth()
    )
  }

  const days = period === "30d" ? 30 : 90
  const minimum = new Date(
    now.getTime() - days * 24 * 60 * 60 * 1000,
  )

  return value >= minimum
}

function isCompletedStatus(value: unknown): boolean {
  const status = text(value).toLowerCase()

  return [
    "completed",
    "complete",
    "done",
    "closed",
    "terminated",
    "terminée",
    "termine",
    "validated",
    "paid",
    "payé",
  ].some((candidate) => status.includes(candidate))
}

function isOpenStatus(value: unknown): boolean {
  const status = text(value).toLowerCase()

  return ![
    "completed",
    "done",
    "closed",
    "cancelled",
    "canceled",
    "archived",
    "paid",
    "rejected",
  ].some((candidate) => status.includes(candidate))
}

function defaultDocuments(): DocumentControl[] {
  return DOCUMENT_BLUEPRINT.map((document) => ({
    id: uid("document"),
    ...document,
    status: "missing",
    reference: "",
    reviewer: "",
    note: "",
    expiresAt: "",
    updatedAt: "",
  }))
}

function mergeDocuments(
  stored: DocumentControl[],
): DocumentControl[] {
  const base = defaultDocuments()
  const map = new Map(stored.map((item) => [item.key, item]))

  return base.map((item) => ({
    ...item,
    ...(map.get(item.key) || {}),
  }))
}

function defaultConfiguration(): DossierConfiguration {
  return {
    version: 2,

    preferredName: "",
    whatsapp: "",
    region: "",
    zone: "",
    address: "",
    languages: [],
    preferredChannel: "WhatsApp",

    manager: "",
    status: "active",
    activationDate: "",

    contractType: "Ambassadeur terrain",
    contractStartDate: "",
    contractEndDate: "",
    autoRenew: false,

    qualityScore: 0,
    leadGoal: 20,
    qualifiedLeadGoal: 10,
    conversionGoal: 5,
    fieldVisitGoal: 4,
    partnerMeetingGoal: 2,
    revenueGoal: 0,

    territoryId: "",
    territoryName: "",
    coverageMode: "Partagé",
    radiusKm: 5,

    availability: "Disponible",
    transportMode: "",
    services: [],
    channels: [],

    commissionRate: 10,
    commissionLocked: true,
    commissionAccepted: false,

    payoutCycle: "Mensuel",
    paymentMethod: "Virement bancaire",
    paymentReference: "",
    paymentVerified: false,

    portalAccessStatus: "Non préparé",
    crmAccessStatus: "Non préparé",
    starterKitStatus: "Non préparé",

    documents: defaultDocuments(),
    notes: [],

    archive: {
      archived: false,
      reason: "",
      effectiveDate: "",
      managerApproval: "",
      territoryReleaseRequested: false,
      accessSuspensionRequested: false,
      leadReassignmentTarget: "",
      archivedAt: "",
    },

    lastSavedAt: "",
  }
}

function parseConfiguration(
  metadata: Row,
  ambassador: Row,
): DossierConfiguration {
  const base = defaultConfiguration()

  const stored = asRecord(
    metadata.dossier_os ||
      metadata.ambassador_dossier ||
      metadata.directory_dossier,
  )

  const activation = asRecord(
    metadata.activation_os || metadata.activation,
  )

  const storedDocuments = asRows(
    stored.documents || activation.documents,
  ) as DocumentControl[]

  const storedNotes = asRows(
    stored.notes || metadata.notes,
  ) as InternalNote[]

  return {
    ...base,
    ...stored,

    version: 2,

    preferredName:
      text(stored.preferredName) ||
      text(ambassador.preferred_name),

    whatsapp:
      text(stored.whatsapp) ||
      text(ambassador.whatsapp),

    region:
      text(stored.region) ||
      text(ambassador.region),

    zone:
      text(stored.zone) ||
      text(ambassador.zone || ambassador.district),

    address:
      text(stored.address) ||
      text(ambassador.address),

    languages: Array.isArray(stored.languages)
      ? stored.languages.map(text).filter(Boolean)
      : Array.isArray(ambassador.languages)
        ? ambassador.languages.map(text).filter(Boolean)
        : text(ambassador.languages)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),

    manager:
      text(stored.manager) ||
      text(ambassador.manager_name) ||
      text(activation.manager_name),

    status: normalizeStatus(
      stored.status || ambassador.status,
    ),

    activationDate:
      dateValue(stored.activationDate) ||
      dateValue(
        ambassador.joined_at ||
          ambassador.activation_date ||
          activation.desired_activation_date,
      ),

    contractStartDate:
      dateValue(stored.contractStartDate),

    contractEndDate:
      dateValue(stored.contractEndDate),

    qualityScore: Math.max(
      0,
      Math.min(
        100,
        numberValue(
          stored.qualityScore ||
            ambassador.quality_score ||
            ambassador.score,
        ),
      ),
    ),

    territoryId:
      text(stored.territoryId) ||
      text(ambassador.territory_id) ||
      text(activation.territory_id),

    territoryName:
      text(stored.territoryName) ||
      text(ambassador.territory_name) ||
      text(ambassador.territory) ||
      text(activation.territory_name),

    commissionRate: 10,
    commissionLocked: true,

    commissionAccepted:
      boolValue(stored.commissionAccepted) ||
      boolValue(activation.commission_accepted),

    paymentVerified:
      boolValue(stored.paymentVerified) ||
      boolValue(activation.payment_verified),

    paymentReference:
      text(stored.paymentReference) ||
      text(activation.payment_reference),

    services: Array.isArray(stored.services)
      ? stored.services.map(text).filter(Boolean)
      : [],

    channels: Array.isArray(stored.channels)
      ? stored.channels.map(text).filter(Boolean)
      : [],

    documents: mergeDocuments(storedDocuments),
    notes: storedNotes,

    archive: {
      ...base.archive,
      ...asRecord(stored.archive),
    },
  }
}

function cloneConfiguration(
  configuration: DossierConfiguration,
): DossierConfiguration {
  return JSON.parse(
    JSON.stringify(configuration),
  ) as DossierConfiguration
}

function rowBelongsToAmbassador(
  row: Row,
  ambassadorId: string,
  candidateId: string,
): boolean {
  const metadata = metadataOf(row)

  const ids = [
    row.ambassador_id,
    row.assigned_ambassador_id,
    row.primary_ambassador_id,
    row.owner_ambassador_id,
    row.source_ambassador_id,
    row.candidate_id,
    metadata.ambassador_id,
    metadata.assigned_ambassador_id,
    metadata.primary_ambassador_id,
    metadata.candidate_id,
  ]
    .map(text)
    .filter(Boolean)

  const arrays = [
    row.assigned_ambassador_ids,
    row.ambassador_ids,
    metadata.assigned_ambassador_ids,
    metadata.ambassador_ids,
  ]
    .flatMap((value) =>
      Array.isArray(value) ? value.map(text) : [],
    )
    .filter(Boolean)

  return (
    ids.includes(ambassadorId) ||
    arrays.includes(ambassadorId) ||
    Boolean(candidateId && ids.includes(candidateId))
  )
}

function amountOf(row: Row): number {
  return numberValue(
    row.amount ||
      row.amount_due ||
      row.validated_amount ||
      row.total ||
      row.value ||
      row.revenue ||
      row.incentive_amount ||
      row.commission_amount,
  )
}

function buildTimeline(
  missions: Row[],
  leads: Row[],
  conversions: Row[],
  incentives: Row[],
  training: Row[],
  documents: Row[],
  audit: Row[],
  notes: InternalNote[],
): TimelineEvent[] {
  const events: TimelineEvent[] = []

  missions.forEach((row) => {
    events.push({
      id: `mission-${idOf(row) || uid("mission-view")}`,
      type: "mission",
      title:
        text(row.title || row.name) ||
        "Mission mise à jour",
      detail: [
        text(row.status),
        text(row.city),
        text(row.territory_name),
      ]
        .filter(Boolean)
        .join(" · "),
      actor:
        text(row.updated_by || row.created_by) ||
        "AngelCare OPS",
      createdAt:
        text(row.updated_at || row.created_at) || nowIso(),
    })
  })

  leads.forEach((row) => {
    events.push({
      id: `lead-${idOf(row) || uid("lead-view")}`,
      type: "lead",
      title:
        text(row.lead_name || row.contact_name || row.name) ||
        "Lead créé",
      detail: [
        text(row.status),
        text(row.source),
        text(row.city),
      ]
        .filter(Boolean)
        .join(" · "),
      actor:
        text(row.updated_by || row.created_by) ||
        "Ambassador OS",
      createdAt:
        text(row.updated_at || row.created_at) || nowIso(),
    })
  })

  conversions.forEach((row) => {
    events.push({
      id: `conversion-${idOf(row) || uid("conversion-view")}`,
      type: "conversion",
      title:
        text(row.title || row.decision) ||
        "Conversion enregistrée",
      detail: [
        text(row.status),
        amountOf(row) ? `${amountOf(row)} Dh` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      actor:
        text(row.validated_by || row.updated_by) ||
        "AngelCare OPS",
      createdAt:
        text(
          row.converted_at ||
            row.validated_at ||
            row.updated_at ||
            row.created_at,
        ) || nowIso(),
    })
  })

  incentives.forEach((row) => {
    events.push({
      id: `payment-${idOf(row) || uid("payment-view")}`,
      type: "payment",
      title:
        text(row.title || row.type) ||
        "Incentive enregistré",
      detail: [
        text(row.status),
        amountOf(row) ? `${amountOf(row)} Dh` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      actor:
        text(row.approved_by || row.updated_by) ||
        "Finance OPS",
      createdAt:
        text(
          row.paid_at ||
            row.approved_at ||
            row.updated_at ||
            row.created_at,
        ) || nowIso(),
    })
  })

  training.forEach((row) => {
    events.push({
      id: `training-${idOf(row) || uid("training-view")}`,
      type: "training",
      title:
        text(row.title || row.module_name) ||
        "Formation mise à jour",
      detail: [
        text(row.status),
        numberValue(row.score)
          ? `Score ${numberValue(row.score)}%`
          : "",
      ]
        .filter(Boolean)
        .join(" · "),
      actor:
        text(row.trainer || row.updated_by) ||
        "Academy",
      createdAt:
        text(
          row.completed_at ||
            row.updated_at ||
            row.created_at,
        ) || nowIso(),
    })
  })

  documents.forEach((row) => {
    events.push({
      id: `document-${idOf(row) || uid("document-view")}`,
      type: "document",
      title:
        text(row.title || row.document_type || row.name) ||
        "Document mis à jour",
      detail: [
        text(row.status),
        text(row.reviewer),
      ]
        .filter(Boolean)
        .join(" · "),
      actor:
        text(row.reviewer || row.updated_by) ||
        "Conformité",
      createdAt:
        text(row.updated_at || row.created_at) || nowIso(),
    })
  })

  audit.forEach((row) => {
    events.push({
      id: `audit-${idOf(row) || uid("audit-view")}`,
      type: "audit",
      title:
        text(row.action || row.event_type) ||
        "Événement audit",
      detail:
        text(
          row.description ||
            row.detail ||
            asRecord(row.details).message,
        ) || "Mise à jour du dossier",
      actor:
        text(row.actor || row.user_name) ||
        "AngelCare OPS",
      createdAt:
        text(row.created_at || row.updated_at) || nowIso(),
    })
  })

  notes.forEach((note) => {
    events.push({
      id: `note-${note.id}`,
      type: "note",
      title: note.category || "Note interne",
      detail: note.text,
      actor: note.createdBy || note.owner || "AngelCare OPS",
      createdAt: note.createdAt || nowIso(),
    })
  })

  return events.sort(
    (first, second) =>
      new Date(second.createdAt || 0).getTime() -
      new Date(first.createdAt || 0).getTime(),
  )
}

async function apiRequest(
  url: string,
  init?: RequestInit,
): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok || asRecord(payload).ok === false) {
    throw new Error(
      text(
        asRecord(payload).error ||
          asRecord(payload).message,
      ) || `HTTP ${response.status}`,
    )
  }

  return payload
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_34px_rgba(15,23,42,0.055)] ${className}`}
    >
      {children}
    </section>
  )
}

function Field({
  label,
  required = false,
  helper,
  children,
}: {
  label: string
  required?: boolean
  helper?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-slate-700">
        {label}
        {required ? " *" : ""}
      </span>

      {children}

      {helper ? (
        <span className="mt-1 block text-[10px] font-semibold leading-5 text-slate-500">
          {helper}
        </span>
      ) : null}
    </label>
  )
}

function Progress({
  value,
  tone = "blue",
}: {
  value: number
  tone?: "blue" | "green" | "amber" | "red" | "violet"
}) {
  const safe = Math.max(0, Math.min(100, value))

  const toneClass = {
    blue: "bg-blue-600",
    green: "bg-emerald-600",
    amber: "bg-amber-500",
    red: "bg-rose-600",
    violet: "bg-violet-600",
  }[tone]

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all ${toneClass}`}
        style={{ width: `${safe}%` }}
      />
    </div>
  )
}

function ModalShell({
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  onClose,
  width = "max-w-6xl",
}: {
  title: string
  subtitle: string
  icon: LucideIcon
  children: ReactNode
  footer: ReactNode
  onClose: () => void
  width?: string
}) {
  return (
    <div className="fixed inset-0 z-[170] flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 pb-10 pt-[92px] backdrop-blur-[3px]">
      <div
        className={`flex max-h-[calc(100vh-112px)] w-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-[#f5f7fb] shadow-[0_35px_110px_rgba(15,23,42,0.38)] ${width}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex min-w-0 items-start gap-4">
            <span className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-blue-700">
              <Icon className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <h2 className="text-xl font-black text-slate-950">
                {title}
              </h2>

              <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
          {children}
        </div>

        <footer className="border-t border-slate-200 bg-white px-6 py-4">
          {footer}
        </footer>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string
  value: string | number
  helper: string
  icon: LucideIcon
  tone: "blue" | "green" | "amber" | "violet" | "cyan"
  onClick: () => void
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
    cyan: "bg-cyan-50 text-cyan-700",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[18px] border border-slate-200 bg-white p-3 text-left shadow-[0_8px_24px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-blue-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-[10px] font-bold text-slate-500">
            {helper}
          </p>
        </div>

        <span className={`rounded-2xl p-2.5 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </button>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="p-10 text-center">
      <Icon className="mx-auto h-10 w-10 text-blue-500" />

      <h3 className="mt-3 text-lg font-black text-slate-950">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
        {description}
      </p>

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export default function AmbassadorDirectoryRoute(_props?: Partial<AmbassadorDirectoryRouteProps>) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [ambassadors, setAmbassadors] = useState<Row[]>([])
  const [candidates, setCandidates] = useState<Row[]>([])
  const [onboardingRows, setOnboardingRows] = useState<Row[]>([])
  const [missions, setMissions] = useState<Row[]>([])
  const [leads, setLeads] = useState<Row[]>([])
  const [conversions, setConversions] = useState<Row[]>([])
  const [incentives, setIncentives] = useState<Row[]>([])
  const [payouts, setPayouts] = useState<Row[]>([])
  const [territories, setTerritories] = useState<Row[]>([])
  const [training, setTraining] = useState<Row[]>([])
  const [documents, setDocuments] = useState<Row[]>([])
  const [notesRows, setNotesRows] = useState<Row[]>([])
  const [auditRows, setAuditRows] = useState<Row[]>([])

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  const [query, setQuery] = useState("")
  const [territoryFilter, setTerritoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [period, setPeriod] = useState<PeriodFilter>("mtd")

  const [selectedId, setSelectedId] = useState(
    searchParams.get("ambassador") || "",
  )

  const [activeTab, setActiveTab] =
    useState<DossierTab>("overview")

  const [drawerMode, setDrawerMode] =
    useState<DrawerMode>("details")

  const [modal, setModal] = useState<ModalKind>(null)

  const [draft, setDraft] =
    useState<DossierConfiguration>(defaultConfiguration())

  const [originalDraft, setOriginalDraft] =
    useState<DossierConfiguration>(defaultConfiguration())

  const [missionForm, setMissionForm] = useState({
    mode: "create",
    existingMissionId: "",
    title: "",
    missionType: "field_activation",
    priority: "normal",
    status: "assigned",
    city: "",
    territoryId: "",
    territoryName: "",
    dueDate: "",
    startDate: "",
    instructions: "",
    requiredProof: "",
    validator: "",
    leadTarget: 0,
    conversionTarget: 0,
    supportAmbassadorIds: [] as string[],
  })

  const [leadForm, setLeadForm] = useState({
    leadName: "",
    phone: "",
    email: "",
    city: "",
    zone: "",
    source: "Referral ambassadeur",
    leadType: "B2C",
    serviceNeed: "",
    score: 50,
    status: "new",
    nextAction: "",
    nextFollowUp: "",
    referralCode: "",
    promoCode: "",
    consentConfirmed: false,
    sourceProof: "",
    allowDuplicate: false,
  })

  const [noteForm, setNoteForm] = useState({
    category: "Suivi opérationnel",
    priority: "normal",
    visibility: "management",
    text: "",
    owner: "",
    followUpDate: "",
    linkedType: "",
    linkedId: "",
  })

  const [archiveForm, setArchiveForm] = useState({
    reason: "",
    effectiveDate: "",
    managerApproval: "",
    territoryReleaseRequested: true,
    accessSuspensionRequested: true,
    leadReassignmentTarget: "",
    acknowledgeOpenItems: false,
  })

  const [trainingForm, setTrainingForm] = useState({
    title: "",
    moduleCode: "",
    trainer: "",
    status: "scheduled",
    dueDate: "",
    mode: "Présentiel",
    location: "",
    score: 0,
    notes: "",
  })

  const [documentForm, setDocumentForm] = useState({
    key: "identity",
    label: "CIN / passeport",
    status: "uploaded",
    reference: "",
    reviewer: "",
    note: "",
    expiresAt: "",
  })

  const inputClass =
    "h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

  const textareaClass =
    "min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

  const loadData = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const results = await Promise.allSettled([
        apiRequest("/api/market-os/ambassadors"),
        apiRequest("/api/market-os/ambassadors/ambassadors"),
        apiRequest("/api/market-os/ambassadors/recruitment"),
        apiRequest("/api/market-os/ambassadors/onboarding"),
        apiRequest("/api/market-os/ambassadors/missions"),
        apiRequest("/api/market-os/ambassadors/leads"),
        apiRequest("/api/market-os/ambassadors/conversions"),
        apiRequest("/api/market-os/ambassadors/incentives"),
        apiRequest("/api/market-os/ambassadors/payouts"),
        apiRequest("/api/market-os/ambassadors/territories"),
        apiRequest("/api/market-os/ambassadors/training"),
        apiRequest("/api/market-os/ambassadors/documents"),
        apiRequest("/api/market-os/ambassadors/notes"),
        apiRequest("/api/market-os/ambassadors/audit"),
      ])

      const payloads = results.map((result) =>
        result.status === "fulfilled" ? result.value : {},
      )

      const snapshot = payloads[0]

      const realAmbassadors = extractRows(payloads[1], [
        "ambassadors",
      ])

      const realCandidates = extractRows(payloads[2], [
        "recruitment",
        "candidates",
      ])

      const realOnboarding = extractRows(payloads[3], [
        "onboarding",
        "records",
      ])

      const realMissions = extractRows(payloads[4], [
        "missions",
      ])

      const realLeads = extractRows(payloads[5], ["leads"])
      const realConversions = extractRows(payloads[6], [
        "conversions",
      ])

      const realIncentives = extractRows(payloads[7], [
        "incentives",
      ])

      const realPayouts = extractRows(payloads[8], [
        "payouts",
        "payments",
      ])

      const realTerritories = extractRows(payloads[9], [
        "territories",
      ])

      const realTraining = extractRows(payloads[10], [
        "training",
        "certifications",
      ])

      const realDocuments = extractRows(payloads[11], [
        "documents",
      ])

      const realNotes = extractRows(payloads[12], ["notes"])
      const realAudit = extractRows(payloads[13], [
        "audit",
        "events",
        "records",
      ])

      setAmbassadors(
        realAmbassadors.length
          ? realAmbassadors
          : extractRows(snapshot, ["ambassadors"]),
      )

      setCandidates(
        realCandidates.length
          ? realCandidates
          : extractRows(snapshot, ["recruitment", "candidates"]),
      )

      setOnboardingRows(
        realOnboarding.length
          ? realOnboarding
          : extractRows(snapshot, ["onboarding"]),
      )

      setMissions(
        realMissions.length
          ? realMissions
          : extractRows(snapshot, ["missions"]),
      )

      setLeads(
        realLeads.length
          ? realLeads
          : extractRows(snapshot, ["leads"]),
      )

      setConversions(
        realConversions.length
          ? realConversions
          : extractRows(snapshot, ["conversions"]),
      )

      setIncentives(
        realIncentives.length
          ? realIncentives
          : extractRows(snapshot, ["incentives"]),
      )

      setPayouts(
        realPayouts.length
          ? realPayouts
          : extractRows(snapshot, ["payouts", "payments"]),
      )

      setTerritories(
        realTerritories.length
          ? realTerritories
          : extractRows(snapshot, ["territories"]),
      )

      setTraining(
        realTraining.length
          ? realTraining
          : extractRows(snapshot, ["training", "certifications"]),
      )

      setDocuments(
        realDocuments.length
          ? realDocuments
          : extractRows(snapshot, ["documents"]),
      )

      setNotesRows(realNotes)
      setAuditRows(realAudit)

      const failures = results.filter(
        (result) => result.status === "rejected",
      ).length

      setNotice(
        failures
          ? `Synchronisation partielle : ${failures} source(s) secondaire(s) indisponible(s).`
          : "",
      )
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de charger les dossiers ambassadeurs.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const dossiers = useMemo<AmbassadorDossier[]>(() => {
    const candidateById = new Map(
      candidates.map((row) => [idOf(row), row]),
    )

    const candidateByContact = new Map(
      candidates.map((row) => [contactKey(row), row]),
    )

    const onboardingByAmbassador = new Map<string, Row>()
    const onboardingByCandidate = new Map<string, Row>()

    onboardingRows.forEach((row) => {
      const metadata = metadataOf(row)

      const ambassadorId = text(
        row.ambassador_id || metadata.ambassador_id,
      )

      const candidateId = text(
        row.candidate_id || metadata.candidate_id,
      )

      if (ambassadorId) {
        onboardingByAmbassador.set(ambassadorId, row)
      }

      if (candidateId) {
        onboardingByCandidate.set(candidateId, row)
      }
    })

    return ambassadors
      .map((row) => {
        const id = idOf(row)
        const metadata = metadataOf(row)

        const candidateId = text(
          row.candidate_id || metadata.candidate_id,
        )

        const candidate =
          candidateById.get(candidateId) ||
          candidateByContact.get(contactKey(row)) ||
          {}

        const onboarding =
          onboardingByAmbassador.get(id) ||
          onboardingByCandidate.get(candidateId) ||
          {}

        const onboardingMetadata = metadataOf(onboarding)

        const combinedMetadata = {
          ...metadataOf(candidate),
          ...metadata,
          ...onboardingMetadata,
        }

        return {
          id,
          candidateId,
          onboardingId: idOf(onboarding),

          name: displayName(row),
          phone: text(row.phone || row.telephone),
          email: text(row.email),
          city: text(row.city || row.main_city),
          photoUrl: text(
            row.photo_url ||
              row.avatar_url ||
              combinedMetadata.photo_url,
          ),

          reference:
            text(
              row.reference ||
                row.ambassador_code ||
                row.code ||
                combinedMetadata.reference,
            ) || id,

          joinedAt: text(
            row.joined_at ||
              row.activation_date ||
              onboarding.completed_at,
          ),

          createdAt: text(row.created_at),
          updatedAt: text(row.updated_at),

          row,
          candidate,
          onboarding,
          metadata: combinedMetadata,
          configuration: parseConfiguration(
            combinedMetadata,
            row,
          ),
        }
      })
      .filter((dossier) => Boolean(dossier.id))
      .sort((first, second) => {
        const firstDate = new Date(
          first.updatedAt || first.createdAt || 0,
        ).getTime()

        const secondDate = new Date(
          second.updatedAt || second.createdAt || 0,
        ).getTime()

        return secondDate - firstDate
      })
  }, [ambassadors, candidates, onboardingRows])

  useEffect(() => {
    if (!dossiers.length) {
      setSelectedId("")
      return
    }

    if (
      !selectedId ||
      !dossiers.some((dossier) => dossier.id === selectedId)
    ) {
      const initialId =
        searchParams.get("ambassador") || dossiers[0].id

      setSelectedId(initialId)
    }
  }, [dossiers, searchParams, selectedId])

  const selectedDossier = useMemo(
    () =>
      dossiers.find((dossier) => dossier.id === selectedId) ||
      null,
    [dossiers, selectedId],
  )

  useEffect(() => {
    if (!selectedDossier) {
      const empty = defaultConfiguration()
      setDraft(empty)
      setOriginalDraft(empty)
      return
    }

    const next = cloneConfiguration(
      selectedDossier.configuration,
    )

    setDraft(next)
    setOriginalDraft(cloneConfiguration(next))

    setMissionForm((current) => ({
      ...current,
      city: selectedDossier.city,
      territoryId: next.territoryId,
      territoryName: next.territoryName,
      validator: next.manager,
    }))

    setLeadForm((current) => ({
      ...current,
      city: selectedDossier.city,
      zone: next.zone,
      referralCode: text(
        selectedDossier.metadata.referral_code ||
          selectedDossier.metadata.activation_os?.referralCode,
      ),
      promoCode: text(
        selectedDossier.metadata.promo_code ||
          selectedDossier.metadata.activation_os?.promoCode,
      ),
    }))

    setNoteForm((current) => ({
      ...current,
      owner: next.manager,
    }))
  }, [selectedDossier])

  const dirty = useMemo(
    () =>
      JSON.stringify(draft) !== JSON.stringify(originalDraft),
    [draft, originalDraft],
  )

  const relatedMissions = useMemo(() => {
    if (!selectedDossier) return []

    return missions.filter((row) =>
      rowBelongsToAmbassador(
        row,
        selectedDossier.id,
        selectedDossier.candidateId,
      ),
    )
  }, [missions, selectedDossier])

  const relatedLeads = useMemo(() => {
    if (!selectedDossier) return []

    return leads.filter((row) =>
      rowBelongsToAmbassador(
        row,
        selectedDossier.id,
        selectedDossier.candidateId,
      ),
    )
  }, [leads, selectedDossier])

  const relatedLeadIds = useMemo(
    () => new Set(relatedLeads.map(idOf).filter(Boolean)),
    [relatedLeads],
  )

  const relatedConversions = useMemo(() => {
    if (!selectedDossier) return []

    return conversions.filter((row) => {
      if (
        rowBelongsToAmbassador(
          row,
          selectedDossier.id,
          selectedDossier.candidateId,
        )
      ) {
        return true
      }

      return relatedLeadIds.has(
        text(row.lead_id || metadataOf(row).lead_id),
      )
    })
  }, [conversions, selectedDossier, relatedLeadIds])

  const relatedIncentives = useMemo(() => {
    if (!selectedDossier) return []

    return [...incentives, ...payouts].filter((row) =>
      rowBelongsToAmbassador(
        row,
        selectedDossier.id,
        selectedDossier.candidateId,
      ),
    )
  }, [incentives, payouts, selectedDossier])

  const relatedTraining = useMemo(() => {
    if (!selectedDossier) return []

    return training.filter((row) =>
      rowBelongsToAmbassador(
        row,
        selectedDossier.id,
        selectedDossier.candidateId,
      ),
    )
  }, [training, selectedDossier])

  const relatedDocuments = useMemo(() => {
    if (!selectedDossier) return []

    return documents.filter((row) =>
      rowBelongsToAmbassador(
        row,
        selectedDossier.id,
        selectedDossier.candidateId,
      ),
    )
  }, [documents, selectedDossier])

  const relatedNotesRows = useMemo(() => {
    if (!selectedDossier) return []

    return notesRows.filter((row) =>
      rowBelongsToAmbassador(
        row,
        selectedDossier.id,
        selectedDossier.candidateId,
      ),
    )
  }, [notesRows, selectedDossier])

  const relatedAudit = useMemo(() => {
    if (!selectedDossier) return []

    const acceptedIds = new Set(
      [
        selectedDossier.id,
        selectedDossier.candidateId,
        selectedDossier.onboardingId,
      ].filter(Boolean),
    )

    return auditRows.filter((row) => {
      const metadata = metadataOf(row)

      return [
        row.entity_id,
        row.ambassador_id,
        row.candidate_id,
        row.onboarding_id,
        metadata.ambassador_id,
        metadata.candidate_id,
        metadata.onboarding_id,
      ]
        .map(text)
        .some((id) => acceptedIds.has(id))
    })
  }, [auditRows, selectedDossier])

  const periodMissions = useMemo(
    () =>
      relatedMissions.filter((row) => withinPeriod(row, period)),
    [relatedMissions, period],
  )

  const periodLeads = useMemo(
    () => relatedLeads.filter((row) => withinPeriod(row, period)),
    [relatedLeads, period],
  )

  const periodConversions = useMemo(
    () =>
      relatedConversions.filter((row) =>
        withinPeriod(row, period),
      ),
    [relatedConversions, period],
  )

  const periodIncentives = useMemo(
    () =>
      relatedIncentives.filter((row) =>
        withinPeriod(row, period),
      ),
    [relatedIncentives, period],
  )

  const completedMissionCount = useMemo(
    () =>
      periodMissions.filter((row) =>
        isCompletedStatus(row.status),
      ).length,
    [periodMissions],
  )

  const qualifiedLeadCount = useMemo(
    () =>
      periodLeads.filter((row) => {
        const status = text(row.status).toLowerCase()

        return (
          status.includes("qualified") ||
          status.includes("qualifié") ||
          numberValue(row.score) >= 70
        )
      }).length,
    [periodLeads],
  )

  const conversionRate = periodLeads.length
    ? Math.round(
        (periodConversions.length / periodLeads.length) * 100,
      )
    : 0

  const validatedAmount = useMemo(
    () =>
      periodConversions.reduce(
        (total, row) => total + amountOf(row),
        0,
      ),
    [periodConversions],
  )

  const incentiveAvailable = useMemo(
    () =>
      periodIncentives
        .filter((row) => {
          const status = text(row.status).toLowerCase()

          return (
            status.includes("approved") ||
            status.includes("payable") ||
            status.includes("available") ||
            status.includes("à payer")
          )
        })
        .reduce((total, row) => total + amountOf(row), 0),
    [periodIncentives],
  )

  const paidAmount = useMemo(
    () =>
      periodIncentives
        .filter((row) =>
          ["paid", "payé", "paye"].some((status) =>
            text(row.status).toLowerCase().includes(status),
          ),
        )
        .reduce((total, row) => total + amountOf(row), 0),
    [periodIncentives],
  )

  const pendingAmount = useMemo(
    () =>
      periodIncentives
        .filter((row) => {
          const status = text(row.status).toLowerCase()

          return [
            "pending",
            "approval",
            "attente",
            "blocked",
            "bloqué",
          ].some((candidate) => status.includes(candidate))
        })
        .reduce((total, row) => total + amountOf(row), 0),
    [periodIncentives],
  )

  const trainingCompletion = useMemo(() => {
    if (!relatedTraining.length) return 0

    return Math.round(
      (relatedTraining.filter((row) =>
        isCompletedStatus(row.status),
      ).length /
        relatedTraining.length) *
        100,
    )
  }, [relatedTraining])

  const complianceCompletion = useMemo(() => {
    const required = draft.documents.filter(
      (document) => document.required,
    )

    if (!required.length) return 0

    return Math.round(
      (required.filter(
        (document) => document.status === "validated",
      ).length /
        required.length) *
        100,
    )
  }, [draft.documents])

  const scoreBreakdown = useMemo<ScoreBreakdown>(() => {
    const missionPerformance = draft.fieldVisitGoal
      ? Math.min(
          100,
          Math.round(
            (completedMissionCount / draft.fieldVisitGoal) * 100,
          ),
        )
      : 0

    const leadPerformance = draft.leadGoal
      ? Math.min(
          100,
          Math.round((periodLeads.length / draft.leadGoal) * 100),
        )
      : 0

    const conversionPerformance = draft.conversionGoal
      ? Math.min(
          100,
          Math.round(
            (periodConversions.length / draft.conversionGoal) *
              100,
          ),
        )
      : 0

    const performance = Math.round(
      (missionPerformance +
        leadPerformance +
        conversionPerformance) /
        3,
    )

    const territory =
      draft.territoryId &&
      draft.services.length &&
      draft.channels.length
        ? 100
        : draft.territoryId
          ? 55
          : 0

    const activity = relatedMissions.length || relatedLeads.length
      ? Math.min(
          100,
          30 +
            relatedMissions.length * 4 +
            relatedLeads.length * 2,
        )
      : 0

    const quality = draft.qualityScore
    const compliance = complianceCompletion
    const trainingScore = trainingCompletion

    const global = Math.round(
      quality * 0.25 +
        performance * 0.25 +
        compliance * 0.2 +
        trainingScore * 0.15 +
        activity * 0.1 +
        territory * 0.05,
    )

    const blockers: string[] = []

    if (compliance < 100) {
      blockers.push("Conformité documentaire incomplète")
    }

    if (trainingScore < 70) {
      blockers.push("Formation sous le seuil de 70%")
    }

    if (!draft.territoryId) {
      blockers.push("Territoire non affecté")
    }

    if (!draft.manager) {
      blockers.push("Manager non affecté")
    }

    if (!draft.commissionAccepted) {
      blockers.push("Commission fixe 10% non acceptée")
    }

    if (!draft.paymentVerified) {
      blockers.push("Paiement non vérifié")
    }

    return {
      global,
      quality,
      performance,
      compliance,
      training: trainingScore,
      activity,
      territory,
      blockers,
    }
  }, [
    draft,
    completedMissionCount,
    periodLeads.length,
    periodConversions.length,
    complianceCompletion,
    trainingCompletion,
    relatedMissions.length,
    relatedLeads.length,
  ])

  const timeline = useMemo(
    () =>
      buildTimeline(
        relatedMissions,
        relatedLeads,
        relatedConversions,
        relatedIncentives,
        relatedTraining,
        relatedDocuments,
        relatedAudit,
        draft.notes,
      ),
    [
      relatedMissions,
      relatedLeads,
      relatedConversions,
      relatedIncentives,
      relatedTraining,
      relatedDocuments,
      relatedAudit,
      draft.notes,
    ],
  )

  const territoriesNames = useMemo(
    () =>
      Array.from(
        new Set(
          dossiers
            .map(
              (dossier) =>
                dossier.configuration.territoryName,
            )
            .filter(Boolean),
        ),
      ).sort(),
    [dossiers],
  )

  const filteredDossiers = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return dossiers.filter((dossier) => {
      if (
        territoryFilter !== "all" &&
        dossier.configuration.territoryName !== territoryFilter
      ) {
        return false
      }

      if (
        statusFilter !== "all" &&
        dossier.configuration.status !== statusFilter
      ) {
        return false
      }

      if (!needle) return true

      return [
        dossier.name,
        dossier.phone,
        dossier.email,
        dossier.city,
        dossier.reference,
        dossier.configuration.manager,
        dossier.configuration.territoryName,
        dossier.configuration.zone,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [dossiers, query, territoryFilter, statusFilter])

  const openMissions = useMemo(
    () =>
      relatedMissions.filter((row) => isOpenStatus(row.status)),
    [relatedMissions],
  )

  const pendingPayouts = useMemo(
    () =>
      relatedIncentives.filter((row) => {
        const status = text(row.status).toLowerCase()

        return [
          "pending",
          "approval",
          "payable",
          "attente",
          "blocked",
        ].some((candidate) => status.includes(candidate))
      }),
    [relatedIncentives],
  )

  const selectAmbassador = (id: string) => {
    if (dirty) {
      setError(
        "Enregistrez ou annulez les modifications du dossier avant de changer d’ambassadeur.",
      )
      return
    }

    setSelectedId(id)
    setActiveTab("overview")
    setDrawerMode("details")
    setError("")

    const params = new URLSearchParams(searchParams.toString())
    params.set("ambassador", id)

    router.replace(
      `/market-os/ambassadors/directory?${params.toString()}`,
      {
        scroll: false,
      },
    )
  }

  const updateDraft = <
    K extends keyof DossierConfiguration,
  >(
    key: K,
    value: DossierConfiguration[K],
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const toggleDraftArray = (
    key: "services" | "channels",
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }))
  }

  const writeAudit = async (
    action: string,
    details: Row,
  ) => {
    if (!selectedDossier) return

    try {
      await apiRequest("/api/market-os/ambassadors/audit", {
        method: "POST",
        body: JSON.stringify({
          action,
          entity_type: "ambassador",
          entity_id: selectedDossier.id,
          actor: "AngelCare OPS",
          details,
          metadata: {
            ambassador_id: selectedDossier.id,
            candidate_id: selectedDossier.candidateId || null,
            onboarding_id:
              selectedDossier.onboardingId || null,
            ...details,
          },
        }),
      })
    } catch {
      // L'opération principale ne devient pas un faux échec
      // lorsque l'audit secondaire est temporairement indisponible.
    }
  }

  const persistConfiguration = async (
    configuration: DossierConfiguration,
    action: string,
  ) => {
    if (!selectedDossier) {
      throw new Error("Aucun ambassadeur réel sélectionné.")
    }

    const nextConfiguration: DossierConfiguration = {
      ...configuration,
      commissionRate: 10,
      commissionLocked: true,
      lastSavedAt: nowIso(),
    }

    const previousTerritoryId =
      selectedDossier.configuration.territoryId

    const previousTerritoryName =
      selectedDossier.configuration.territoryName

    const partialFailures: string[] = []

    await apiRequest(
      `/api/market-os/ambassadors/ambassadors/${selectedDossier.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          full_name: selectedDossier.name,
          display_name:
            nextConfiguration.preferredName ||
            selectedDossier.name,

          phone: selectedDossier.phone || null,
          email: selectedDossier.email || null,
          city: selectedDossier.city || null,

          whatsapp: nextConfiguration.whatsapp || null,
          region: nextConfiguration.region || null,
          district: nextConfiguration.zone || null,
          address: nextConfiguration.address || null,
          languages: nextConfiguration.languages,

          manager_name: nextConfiguration.manager || null,
          status: nextConfiguration.status,
          lifecycle_stage: nextConfiguration.status,

          joined_at:
            nextConfiguration.activationDate || null,

          territory_id:
            nextConfiguration.territoryId || null,

          territory_name:
            nextConfiguration.territoryName || null,

          quality_score:
            nextConfiguration.qualityScore,

          metadata: {
            ...metadataOf(selectedDossier.row),

            dossier_os: nextConfiguration,

            commission_rate: 10,
            commission_locked: true,

            candidate_id:
              selectedDossier.candidateId || null,

            onboarding_id:
              selectedDossier.onboardingId || null,
          },

          payload: {
            dossier_os: nextConfiguration,
            commission_rate: 10,
            commission_locked: true,
          },
        }),
      },
    )

    if (
      nextConfiguration.territoryId &&
      (nextConfiguration.territoryId !==
        previousTerritoryId ||
        nextConfiguration.territoryName !==
          previousTerritoryName)
    ) {
      try {
        await apiRequest(
          "/api/market-os/ambassadors/territories/assign",
          {
            method: "POST",
            body: JSON.stringify({
              ambassador_id: selectedDossier.id,
              territory_id: nextConfiguration.territoryId,
              assignment_type: "primary",
              coverage_mode: nextConfiguration.coverageMode,
              radius_km: nextConfiguration.radiusKm,
              assigned_by:
                nextConfiguration.manager ||
                "AngelCare OPS",
              source: "ambassador_master_dossier",
            }),
          },
        )
      } catch (caught) {
        partialFailures.push(
          `Territoire : ${
            caught instanceof Error
              ? caught.message
              : "synchronisation échouée"
          }`,
        )
      }
    }

    await writeAudit(action, {
      previous_status:
        selectedDossier.configuration.status,
      next_status: nextConfiguration.status,
      previous_territory_id:
        previousTerritoryId || null,
      next_territory_id:
        nextConfiguration.territoryId || null,
      quality_score:
        nextConfiguration.qualityScore,
    })

    return {
      nextConfiguration,
      partialFailures,
    }
  }

  const saveDossier = async () => {
    if (!selectedDossier) return

    setBusy(true)
    setError("")
    setNotice("")

    try {
      const result = await persistConfiguration(
        draft,
        "Ambassador dossier updated",
      )

      setOriginalDraft(
        cloneConfiguration(result.nextConfiguration),
      )

      await loadData()

      if (result.partialFailures.length) {
        setError(
          `Dossier principal enregistré, mais synchronisation partielle : ${result.partialFailures.join(
            " · ",
          )}`,
        )
      } else {
        setNotice(
          "Dossier ambassadeur enregistré et synchronisé.",
        )
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Enregistrement du dossier échoué.",
      )
    } finally {
      setBusy(false)
    }
  }

  const assignMission = async () => {
    if (!selectedDossier) return

    setBusy(true)
    setError("")

    try {
      if (missionForm.mode === "existing") {
        if (!missionForm.existingMissionId) {
          throw new Error(
            "Sélectionnez une mission réelle à affecter.",
          )
        }

        const selectedMission = missions.find(
          (mission) =>
            idOf(mission) === missionForm.existingMissionId,
        )

        const metadata = metadataOf(selectedMission)

        const existingIds = Array.isArray(
          selectedMission?.assigned_ambassador_ids ||
            metadata.assigned_ambassador_ids,
        )
          ? (
              selectedMission?.assigned_ambassador_ids ||
              metadata.assigned_ambassador_ids
            ).map(text)
          : []

        const assignedIds = Array.from(
          new Set([
            selectedDossier.id,
            ...missionForm.supportAmbassadorIds,
            ...existingIds,
          ]),
        )

        await apiRequest(
          `/api/market-os/ambassadors/missions/${missionForm.existingMissionId}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              ambassador_id: selectedDossier.id,
              assigned_ambassador_id: selectedDossier.id,
              primary_ambassador_id: selectedDossier.id,
              assigned_ambassador_ids: assignedIds,
              status:
                missionForm.status ||
                selectedMission?.status ||
                "assigned",

              metadata: {
                ...metadata,
                assigned_ambassador_ids: assignedIds,
                primary_ambassador_id: selectedDossier.id,
                assignment_source:
                  "ambassador_master_dossier",
              },
            }),
          },
        )
      } else {
        if (!missionForm.title.trim()) {
          throw new Error(
            "Le titre de mission est obligatoire.",
          )
        }

        const assignedIds = Array.from(
          new Set([
            selectedDossier.id,
            ...missionForm.supportAmbassadorIds,
          ]),
        )

        await apiRequest(
          "/api/market-os/ambassadors/missions",
          {
            method: "POST",
            body: JSON.stringify({
              title: missionForm.title.trim(),
              mission_type: missionForm.missionType,
              priority: missionForm.priority,
              status: missionForm.status,

              ambassador_id: selectedDossier.id,
              assigned_ambassador_id: selectedDossier.id,
              primary_ambassador_id: selectedDossier.id,
              assigned_ambassador_ids: assignedIds,

              city:
                missionForm.city ||
                selectedDossier.city ||
                null,

              territory_id:
                missionForm.territoryId || null,

              territory_name:
                missionForm.territoryName || null,

              start_date:
                missionForm.startDate || null,

              due_date:
                missionForm.dueDate || null,

              instructions:
                missionForm.instructions || null,

              required_proof:
                missionForm.requiredProof || null,

              validator:
                missionForm.validator || null,

              lead_target:
                missionForm.leadTarget,

              conversion_target:
                missionForm.conversionTarget,

              metadata: {
                source:
                  "ambassador_master_dossier",
                assigned_ambassador_ids: assignedIds,
                primary_ambassador_id: selectedDossier.id,
                required_proof:
                  missionForm.requiredProof || null,
                validator:
                  missionForm.validator || null,
              },
            }),
          },
        )
      }

      await writeAudit("Mission assigned from dossier", {
        mission_id:
          missionForm.mode === "existing"
            ? missionForm.existingMissionId
            : null,
        assignment_mode: missionForm.mode,
      })

      setModal(null)
      await loadData()

      setNotice(
        missionForm.mode === "existing"
          ? "Mission réelle affectée et synchronisée."
          : "Mission créée, affectée et synchronisée.",
      )
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Affectation mission échouée.",
      )
    } finally {
      setBusy(false)
    }
  }

  const createLead = async () => {
    if (!selectedDossier) return

    if (!leadForm.leadName.trim()) {
      setError("Le nom du lead est obligatoire.")
      return
    }

    if (!leadForm.phone.trim() && !leadForm.email.trim()) {
      setError(
        "Un téléphone ou un email est obligatoire.",
      )
      return
    }

    const normalizedPhone = leadForm.phone.replace(/\D/g, "")
    const normalizedEmail = leadForm.email.trim().toLowerCase()

    const duplicate = leads.find((row) => {
      const phone = text(
        row.phone || row.telephone,
      ).replace(/\D/g, "")

      const email = text(row.email).toLowerCase()

      return (
        (normalizedPhone && normalizedPhone === phone) ||
        (normalizedEmail && normalizedEmail === email)
      )
    })

    if (duplicate && !leadForm.allowDuplicate) {
      setError(
        "Un lead avec ce téléphone ou cet email existe déjà. Activez l’exception de doublon uniquement après contrôle.",
      )
      return
    }

    setBusy(true)
    setError("")

    try {
      await apiRequest("/api/market-os/ambassadors/leads", {
        method: "POST",
        body: JSON.stringify({
          lead_name: leadForm.leadName.trim(),
          contact_name: leadForm.leadName.trim(),

          phone: leadForm.phone || null,
          email: leadForm.email || null,

          city:
            leadForm.city || selectedDossier.city || null,

          zone:
            leadForm.zone || draft.zone || null,

          source: leadForm.source,
          lead_type: leadForm.leadType,
          service_need:
            leadForm.serviceNeed || null,

          score: leadForm.score,
          status: leadForm.status,

          next_action:
            leadForm.nextAction || null,

          next_follow_up:
            leadForm.nextFollowUp || null,

          ambassador_id: selectedDossier.id,
          assigned_ambassador_id: selectedDossier.id,
          source_ambassador_id: selectedDossier.id,

          referral_code:
            leadForm.referralCode || null,

          promo_code:
            leadForm.promoCode || null,

          consent_confirmed:
            leadForm.consentConfirmed,

          source_proof:
            leadForm.sourceProof || null,

          metadata: {
            source:
              "ambassador_master_dossier",
            ambassador_id: selectedDossier.id,
            candidate_id:
              selectedDossier.candidateId || null,
            duplicate_override:
              Boolean(duplicate && leadForm.allowDuplicate),
            duplicate_reference:
              duplicate ? idOf(duplicate) : null,
            consent_confirmed:
              leadForm.consentConfirmed,
            source_proof:
              leadForm.sourceProof || null,
          },
        }),
      })

      await writeAudit("Lead created from dossier", {
        lead_name: leadForm.leadName,
        duplicate_override:
          Boolean(duplicate && leadForm.allowDuplicate),
      })

      setModal(null)
      await loadData()

      setNotice(
        "Lead réel créé, attribué et synchronisé.",
      )
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Création du lead échouée.",
      )
    } finally {
      setBusy(false)
    }
  }

  const saveNote = async () => {
    if (!selectedDossier) return

    if (!noteForm.text.trim()) {
      setError("Le contenu de la note est obligatoire.")
      return
    }

    const note: InternalNote = {
      id: uid("note"),
      category: noteForm.category,
      priority:
        noteForm.priority as InternalNote["priority"],
      visibility:
        noteForm.visibility as InternalNote["visibility"],
      text: noteForm.text.trim(),
      owner: noteForm.owner,
      followUpDate: noteForm.followUpDate,
      linkedType: noteForm.linkedType,
      linkedId: noteForm.linkedId,
      createdAt: nowIso(),
      createdBy: "AngelCare OPS",
    }

    setBusy(true)
    setError("")

    const failures: string[] = []

    try {
      try {
        await apiRequest("/api/market-os/ambassadors/notes", {
          method: "POST",
          body: JSON.stringify({
            ambassador_id: selectedDossier.id,
            candidate_id:
              selectedDossier.candidateId || null,

            category: note.category,
            priority: note.priority,
            visibility: note.visibility,
            note: note.text,
            content: note.text,

            owner: note.owner || null,

            follow_up_date:
              note.followUpDate || null,

            linked_entity_type:
              note.linkedType || null,

            linked_entity_id:
              note.linkedId || null,

            metadata: {
              source:
                "ambassador_master_dossier",
              ambassador_id: selectedDossier.id,
            },
          }),
        })
      } catch (caught) {
        failures.push(
          `Registre Notes : ${
            caught instanceof Error
              ? caught.message
              : "indisponible"
          }`,
        )
      }

      const next = cloneConfiguration(draft)
      next.notes = [note, ...next.notes]

      const result = await persistConfiguration(
        next,
        "Internal note added",
      )

      failures.push(...result.partialFailures)

      setDraft(result.nextConfiguration)
      setOriginalDraft(
        cloneConfiguration(result.nextConfiguration),
      )

      setModal(null)
      await loadData()

      if (failures.length) {
        setError(
          `Note conservée dans le dossier principal, mais synchronisation partielle : ${failures.join(
            " · ",
          )}`,
        )
      } else {
        setNotice(
          "Note enregistrée et journalisée dans le dossier.",
        )
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Enregistrement de la note échoué.",
      )
    } finally {
      setBusy(false)
    }
  }

  const scheduleTraining = async () => {
    if (!selectedDossier) return

    if (!trainingForm.title.trim()) {
      setError(
        "Le titre de la formation est obligatoire.",
      )
      return
    }

    setBusy(true)
    setError("")

    try {
      await apiRequest(
        "/api/market-os/ambassadors/training",
        {
          method: "POST",
          body: JSON.stringify({
            ambassador_id: selectedDossier.id,
            candidate_id:
              selectedDossier.candidateId || null,

            title: trainingForm.title.trim(),
            module_code:
              trainingForm.moduleCode || null,

            trainer: trainingForm.trainer || null,
            status: trainingForm.status,

            due_date:
              trainingForm.dueDate || null,

            mode: trainingForm.mode,

            location:
              trainingForm.location || null,

            score: trainingForm.score,

            notes:
              trainingForm.notes || null,

            metadata: {
              source:
                "ambassador_master_dossier",
              ambassador_id: selectedDossier.id,
              candidate_id:
                selectedDossier.candidateId || null,
            },
          }),
        },
      )

      await writeAudit("Training assigned from dossier", {
        title: trainingForm.title,
        due_date: trainingForm.dueDate || null,
      })

      setModal(null)
      await loadData()

      setNotice(
        "Formation réelle affectée et synchronisée.",
      )
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Affectation de formation échouée.",
      )
    } finally {
      setBusy(false)
    }
  }

  const saveDocument = async () => {
    if (!selectedDossier) return

    const current =
      draft.documents.find(
        (document) => document.key === documentForm.key,
      ) ||
      defaultDocuments().find(
        (document) => document.key === documentForm.key,
      )

    if (!current) {
      setError("Document inconnu.")
      return
    }

    const nextDocument: DocumentControl = {
      ...current,
      label:
        documentForm.label || current.label,
      status:
        documentForm.status as DocumentControl["status"],
      reference: documentForm.reference,
      reviewer: documentForm.reviewer,
      note: documentForm.note,
      expiresAt: documentForm.expiresAt,
      updatedAt: nowIso(),
    }

    const next = cloneConfiguration(draft)

    next.documents = next.documents.map((document) =>
      document.key === nextDocument.key
        ? nextDocument
        : document,
    )

    if (
      nextDocument.key === "commission" &&
      nextDocument.status === "validated"
    ) {
      next.commissionAccepted = true
    }

    if (
      nextDocument.key === "payment" &&
      nextDocument.status === "validated"
    ) {
      next.paymentVerified = true
    }

    setBusy(true)
    setError("")

    const failures: string[] = []

    try {
      try {
        await apiRequest(
          "/api/market-os/ambassadors/documents",
          {
            method: "POST",
            body: JSON.stringify({
              ambassador_id: selectedDossier.id,
              candidate_id:
                selectedDossier.candidateId || null,

              document_type: nextDocument.key,
              title: nextDocument.label,
              status: nextDocument.status,
              reference:
                nextDocument.reference || null,
              reviewer:
                nextDocument.reviewer || null,
              note: nextDocument.note || null,
              expires_at:
                nextDocument.expiresAt || null,

              metadata: {
                source:
                  "ambassador_master_dossier",
                ambassador_id: selectedDossier.id,
              },
            }),
          },
        )
      } catch (caught) {
        failures.push(
          `Registre Documents : ${
            caught instanceof Error
              ? caught.message
              : "indisponible"
          }`,
        )
      }

      const result = await persistConfiguration(
        next,
        "Document control updated",
      )

      failures.push(...result.partialFailures)

      setDraft(result.nextConfiguration)
      setOriginalDraft(
        cloneConfiguration(result.nextConfiguration),
      )

      setModal(null)
      await loadData()

      if (failures.length) {
        setError(
          `Contrôle conservé dans le dossier principal, mais synchronisation partielle : ${failures.join(
            " · ",
          )}`,
        )
      } else {
        setNotice(
          "Contrôle documentaire enregistré et synchronisé.",
        )
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Mise à jour documentaire échouée.",
      )
    } finally {
      setBusy(false)
    }
  }

  const archiveAmbassador = async () => {
    if (!selectedDossier) return

    if (!archiveForm.reason.trim()) {
      setError("Le motif d’archivage est obligatoire.")
      return
    }

    if (!archiveForm.managerApproval.trim()) {
      setError(
        "L’autorité d’approbation est obligatoire.",
      )
      return
    }

    if (
      (openMissions.length || pendingPayouts.length) &&
      !archiveForm.acknowledgeOpenItems
    ) {
      setError(
        "Des missions ou paiements restent ouverts. Confirmez explicitement leur prise en charge avant archivage.",
      )
      return
    }

    setBusy(true)
    setError("")

    const partialFailures: string[] = []

    try {
      const next = cloneConfiguration(draft)

      next.status = "archived"
      next.archive = {
        archived: true,
        reason: archiveForm.reason.trim(),
        effectiveDate:
          archiveForm.effectiveDate ||
          new Date().toISOString().slice(0, 10),
        managerApproval:
          archiveForm.managerApproval.trim(),
        territoryReleaseRequested:
          archiveForm.territoryReleaseRequested,
        accessSuspensionRequested:
          archiveForm.accessSuspensionRequested,
        leadReassignmentTarget:
          archiveForm.leadReassignmentTarget,
        archivedAt: nowIso(),
      }

      if (archiveForm.accessSuspensionRequested) {
        next.portalAccessStatus = "Suspendu"
        next.crmAccessStatus = "Suspendu"
      }

      const result = await persistConfiguration(
        next,
        "Ambassador archived",
      )

      partialFailures.push(...result.partialFailures)

      try {
        await apiRequest(
          "/api/market-os/ambassadors/operations",
          {
            method: "POST",
            body: JSON.stringify({
              action: "archive_ambassador",
              ambassador_id: selectedDossier.id,

              reason: archiveForm.reason.trim(),

              effective_date:
                archiveForm.effectiveDate || null,

              manager_approval:
                archiveForm.managerApproval.trim(),

              release_territory:
                archiveForm.territoryReleaseRequested,

              suspend_access:
                archiveForm.accessSuspensionRequested,

              lead_reassignment_target:
                archiveForm.leadReassignmentTarget || null,

              open_mission_count:
                openMissions.length,

              pending_payout_count:
                pendingPayouts.length,

              metadata: {
                source:
                  "ambassador_master_dossier",
                acknowledged_open_items:
                  archiveForm.acknowledgeOpenItems,
              },
            }),
          },
        )
      } catch (caught) {
        partialFailures.push(
          `Orchestration archivage : ${
            caught instanceof Error
              ? caught.message
              : "indisponible"
          }`,
        )
      }

      setDraft(result.nextConfiguration)
      setOriginalDraft(
        cloneConfiguration(result.nextConfiguration),
      )

      setModal(null)
      await loadData()

      if (partialFailures.length) {
        setError(
          `Profil archivé, mais certaines opérations restent à traiter : ${partialFailures.join(
            " · ",
          )}`,
        )
      } else {
        setNotice(
          "Ambassadeur archivé avec traçabilité complète.",
        )
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Archivage échoué.",
      )
    } finally {
      setBusy(false)
    }
  }

  const exportDossier = () => {
    if (!selectedDossier) return

    const payload = {
      exported_at: nowIso(),
      ambassador: {
        id: selectedDossier.id,
        reference: selectedDossier.reference,
        name: selectedDossier.name,
        phone: selectedDossier.phone,
        email: selectedDossier.email,
        city: selectedDossier.city,
      },
      configuration: draft,
      score: scoreBreakdown,
      metrics: {
        missions: relatedMissions.length,
        completed_missions: completedMissionCount,
        leads: relatedLeads.length,
        conversions: relatedConversions.length,
        conversion_rate: conversionRate,
        validated_amount: validatedAmount,
        incentive_available: incentiveAvailable,
        paid_amount: paidAmount,
        pending_amount: pendingAmount,
        training_completion: trainingCompletion,
        compliance_completion: complianceCompletion,
      },
      timeline,
    }

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      {
        type: "application/json;charset=utf-8",
      },
    )

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")

    anchor.href = url
    anchor.download = `angelcare-ambassador-dossier-${selectedDossier.reference}.json`

    anchor.click()
    URL.revokeObjectURL(url)
  }

  const openDocumentModal = (document: DocumentControl) => {
    setDocumentForm({
      key: document.key,
      label: document.label,
      status: document.status,
      reference: document.reference,
      reviewer: document.reviewer,
      note: document.note,
      expiresAt: document.expiresAt,
    })

    setModal("document")
  }

  const openTrainingModal = () => {
    setTrainingForm((current) => ({
      ...current,
      trainer: draft.manager,
    }))

    setModal("training")
  }

  const performanceRows = [
    {
      label: "Missions réalisées",
      value: completedMissionCount,
      goal: draft.fieldVisitGoal,
    },
    {
      label: "Leads générés",
      value: periodLeads.length,
      goal: draft.leadGoal,
    },
    {
      label: "Leads qualifiés",
      value: qualifiedLeadCount,
      goal: draft.qualifiedLeadGoal,
    },
    {
      label: "Conversions",
      value: periodConversions.length,
      goal: draft.conversionGoal,
    },
    {
      label: "RDV partenaires",
      value: relatedMissions.filter((row) =>
        text(
          row.mission_type || row.type || row.title,
        )
          .toLowerCase()
          .includes("partner"),
      ).length,
      goal: draft.partnerMeetingGoal,
    },
  ]

  return (
    <div
      data-ambassador-directory-route="enterprise-master-dossier"
      className="min-w-0 flex-1 bg-[#f5f7fb] p-4 text-slate-950 lg:p-5"
    >
      <header className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.065)]">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
              <Sparkles className="h-4 w-4" />
              Ambassador Master Dossier
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Dossiers ambassadeurs
            </h1>

            <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
              Consultez, pilotez et synchronisez l’identité, l’exécution terrain,
              les leads, la performance, la conformité, la formation et la
              rémunération de chaque ambassadeur.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Données réelles uniquement",
                "Dossier canonique",
                "Commission fixe 10%",
                "Audit multi-modules",
                "Actions contrôlées",
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-700"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex max-w-4xl flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setModal("mission")}
              disabled={!selectedDossier}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
            >
              <Plus className="h-4 w-4" />
              Affecter une mission
            </button>

            <button
              type="button"
              onClick={() => setModal("lead")}
              disabled={!selectedDossier}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 hover:bg-slate-50 disabled:text-slate-400"
            >
              <Target className="h-4 w-4" />
              Créer un lead
            </button>

            <button
              type="button"
              onClick={() => setModal("note")}
              disabled={!selectedDossier}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 hover:bg-slate-50 disabled:text-slate-400"
            >
              <NotebookPen className="h-4 w-4" />
              Ouvrir une note
            </button>

            <button
              type="button"
              onClick={() => setModal("archive")}
              disabled={!selectedDossier}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 hover:bg-slate-50 disabled:text-slate-400"
            >
              <Archive className="h-4 w-4" />
              Archiver
            </button>

            <button
              type="button"
              onClick={() => setModal("more")}
              disabled={!selectedDossier}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 hover:bg-slate-50 disabled:text-slate-400"
            >
              <Ellipsis className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {notice ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
            {error}
          </div>
        ) : null}
      </header>

      <div className="mt-4 grid min-w-0 gap-4 2xl:grid-cols-[275px_minmax(0,1fr)_395px]">
        <aside className="min-w-0">
          <Card className="sticky top-24 overflow-hidden">
            <div className="border-b border-slate-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-950">
                    Portefeuille
                  </h2>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {filteredDossiers.length} ambassadeur(s)
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-800">
                  {dossiers.length}
                </span>
              </div>

              <label className="mt-4 flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3">
                <Search className="h-4 w-4 text-slate-400" />

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nom, ville, téléphone…"
                  className="min-w-0 flex-1 bg-transparent text-xs font-bold text-slate-950 outline-none placeholder:text-slate-400"
                />
              </label>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <select
                  value={territoryFilter}
                  onChange={(event) =>
                    setTerritoryFilter(event.target.value)
                  }
                  className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-black text-slate-950"
                >
                  <option value="all">
                    Tous territoires
                  </option>

                  {territoriesNames.map((territory) => (
                    <option key={territory} value={territory}>
                      {territory}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-black text-slate-950"
                >
                  <option value="all">Tous statuts</option>
                  <option value="active">Actifs</option>
                  <option value="onboarding">
                    Onboarding
                  </option>
                  <option value="inactive">Inactifs</option>
                  <option value="suspended">
                    Suspendus
                  </option>
                  <option value="archived">Archivés</option>
                </select>
              </div>
            </div>

            <div className="max-h-[calc(100vh-310px)] overflow-y-auto p-2">
              {filteredDossiers.map((dossier) => {
                const configuration = dossier.configuration

                return (
                  <button
                    key={dossier.id}
                    type="button"
                    onClick={() => selectAmbassador(dossier.id)}
                    className={`mb-2 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      selectedId === dossier.id
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    {dossier.photoUrl ? (
                      <img
                        src={dossier.photoUrl}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-700">
                        {initials(dossier.name)}
                      </span>
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-black text-slate-950">
                          {dossier.name}
                        </span>

                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            configuration.status === "active"
                              ? "bg-emerald-500"
                              : configuration.status === "onboarding"
                                ? "bg-violet-500"
                                : configuration.status === "suspended"
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                          }`}
                        />
                      </span>

                      <span className="mt-1 block truncate text-[10px] font-bold text-slate-500">
                        {dossier.city || "Ville non renseignée"} ·{" "}
                        {configuration.territoryName || "Sans territoire"}
                      </span>

                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
                          {statusLabel(configuration.status)}
                        </span>

                        <span className="text-[10px] font-black text-blue-700">
                          Score {configuration.qualityScore}%
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}

              {!loading && !filteredDossiers.length ? (
                <EmptyState
                  icon={Users}
                  title="Aucun ambassadeur"
                  description="Aucun profil réel ne correspond aux filtres actuels."
                />
              ) : null}
            </div>
          </Card>
        </aside>

        <main className="min-w-0 space-y-4">
          {selectedDossier ? (
            <>
              <Card className="overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      {selectedDossier.photoUrl ? (
                        <img
                          src={selectedDossier.photoUrl}
                          alt=""
                          className="h-20 w-20 shrink-0 rounded-[24px] object-cover"
                        />
                      ) : (
                        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-blue-50 text-xl font-black text-blue-800">
                          {initials(selectedDossier.name)}
                        </span>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-black text-slate-950">
                            {selectedDossier.name}
                          </h2>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${statusTone(
                              draft.status,
                            )}`}
                          >
                            {statusLabel(draft.status)}
                          </span>

                          {scoreBreakdown.global >= 85 ? (
                            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-800">
                              Top performer
                            </span>
                          ) : null}

                          {scoreBreakdown.blockers.length ? (
                            <button
                              type="button"
                              onClick={() => setModal("score")}
                              className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-800"
                            >
                              {scoreBreakdown.blockers.length} risque(s)
                            </button>
                          ) : null}
                        </div>

                        <p className="mt-1 text-xs font-bold text-slate-500">
                          ID : {selectedDossier.reference} · Ambassadeur depuis{" "}
                          {draft.activationDate || "date à compléter"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4 text-blue-600" />
                            {selectedDossier.phone || "Téléphone à compléter"}
                          </span>

                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-600" />
                            {selectedDossier.email || "Email à compléter"}
                          </span>

                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            {[
                              selectedDossier.city,
                              draft.zone,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Zone à compléter"}
                          </span>

                          <span className="inline-flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-blue-600" />
                            {draft.manager || "Manager à affecter"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid min-w-[280px] grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setModal("score")}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-blue-300"
                      >
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                          Score global
                        </p>

                        <p className="mt-1 text-2xl font-black text-slate-950">
                          {scoreBreakdown.global}%
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("compliance")}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-blue-300"
                      >
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                          Conformité
                        </p>

                        <p className="mt-1 text-2xl font-black text-slate-950">
                          {complianceCompletion}%
                        </p>
                      </button>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                          Territoire
                        </p>

                        <p className="mt-1 truncate text-xs font-black text-slate-950">
                          {draft.territoryName || "Non affecté"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                          Manager
                        </p>

                        <p className="mt-1 truncate text-xs font-black text-slate-950">
                          {draft.manager || "Non affecté"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 bg-white px-3 py-2">
                  {TABS.map((tab) => {
                    const Icon = tab.icon

                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-[11px] font-black transition ${
                          activeTab === tab.key
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </Card>

              {activeTab === "overview" ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                    <KpiCard
                      label="Leads générés"
                      value={periodLeads.length}
                      helper={`Objectif ${draft.leadGoal}`}
                      icon={Users}
                      tone="blue"
                      onClick={() => setActiveTab("leads")}
                    />

                    <KpiCard
                      label="Conversions"
                      value={periodConversions.length}
                      helper={`${conversionRate}% de conversion`}
                      icon={Target}
                      tone="violet"
                      onClick={() => setActiveTab("leads")}
                    />

                    <KpiCard
                      label="Montant validé"
                      value={`${validatedAmount.toLocaleString("fr-FR")} Dh`}
                      helper="Attribution commerciale"
                      icon={TrendingUp}
                      tone="green"
                      onClick={() => setActiveTab("leads")}
                    />

                    <KpiCard
                      label="Incentive disponible"
                      value={`${incentiveAvailable.toLocaleString(
                        "fr-FR",
                      )} Dh`}
                      helper="Prêt pour payout"
                      icon={CircleDollarSign}
                      tone="amber"
                      onClick={() => setActiveTab("incentives")}
                    />

                    <KpiCard
                      label="Missions complétées"
                      value={completedMissionCount}
                      helper={`${periodMissions.length} assignée(s)`}
                      icon={BriefcaseBusiness}
                      tone="cyan"
                      onClick={() => setActiveTab("missions")}
                    />

                    <KpiCard
                      label="Score global"
                      value={`${scoreBreakdown.global}%`}
                      helper={`${scoreBreakdown.blockers.length} blocage(s)`}
                      icon={BadgeCheck}
                      tone="green"
                      onClick={() => setModal("score")}
                    />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-3">
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-black text-slate-950">
                            Activité récente
                          </h3>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Événements consolidés du dossier.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab("history")}
                          className="text-[10px] font-black text-blue-700"
                        >
                          Tout voir
                        </button>
                      </div>

                      <div className="mt-4 space-y-4">
                        {timeline.slice(0, 7).map((event) => (
                          <div key={event.id} className="flex gap-3">
                            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-black text-blue-700">
                              {event.type === "mission"
                                ? "M"
                                : event.type === "lead"
                                  ? "L"
                                  : event.type === "payment"
                                    ? "P"
                                    : event.type === "training"
                                      ? "F"
                                      : "•"}
                            </span>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-black text-slate-950">
                                {event.title}
                              </p>

                              <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold leading-5 text-slate-500">
                                {event.detail || "Mise à jour du dossier"}
                              </p>

                              <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
                                {new Date(
                                  event.createdAt,
                                ).toLocaleString("fr-FR")}
                              </p>
                            </div>
                          </div>
                        ))}

                        {!timeline.length ? (
                          <p className="py-8 text-center text-xs font-semibold text-slate-500">
                            Aucune activité réelle disponible.
                          </p>
                        ) : null}
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-black text-slate-950">
                            Aperçu performance
                          </h3>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Résultats contre objectifs.
                          </p>
                        </div>

                        <select
                          value={period}
                          onChange={(event) =>
                            setPeriod(
                              event.target.value as PeriodFilter,
                            )
                          }
                          className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-black text-slate-950"
                        >
                          <option value="mtd">MTD</option>
                          <option value="30d">30 jours</option>
                          <option value="90d">90 jours</option>
                          <option value="all">Tout</option>
                        </select>
                      </div>

                      <div className="mt-5 space-y-4">
                        {performanceRows.map((row) => {
                          const score = row.goal
                            ? Math.min(
                                100,
                                Math.round(
                                  (row.value / row.goal) * 100,
                                ),
                              )
                            : 0

                          return (
                            <button
                              key={row.label}
                              type="button"
                              onClick={() =>
                                row.label.includes("Lead") ||
                                row.label.includes("Conversion")
                                  ? setActiveTab("leads")
                                  : setActiveTab("missions")
                              }
                              className="block w-full text-left"
                            >
                              <div className="mb-1.5 flex items-center justify-between text-xs font-black text-slate-700">
                                <span>{row.label}</span>
                                <span>
                                  {row.value}/{row.goal}
                                </span>
                              </div>

                              <Progress
                                value={score}
                                tone={
                                  score >= 100
                                    ? "green"
                                    : score < 50
                                      ? "amber"
                                      : "blue"
                                }
                              />
                            </button>
                          )
                        })}

                        <button
                          type="button"
                          onClick={() => setModal("score")}
                          className="mt-2 h-10 w-full rounded-2xl border border-slate-200 bg-white text-xs font-black text-blue-700 hover:bg-blue-50"
                        >
                          Voir l’explication des scores
                        </button>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h3 className="text-base font-black text-slate-950">
                        Statut & informations clés
                      </h3>

                      <div className="mt-4 space-y-3">
                        {[
                          ["Statut", statusLabel(draft.status)],
                          [
                            "Date d’activation",
                            draft.activationDate || "À compléter",
                          ],
                          [
                            "Ancienneté",
                            selectedDossier.joinedAt
                              ? `${Math.max(
                                  0,
                                  Math.floor(
                                    (Date.now() -
                                      new Date(
                                        selectedDossier.joinedAt,
                                      ).getTime()) /
                                      (30 * 24 * 60 * 60 * 1000),
                                  ),
                                )} mois`
                              : "Non calculée",
                          ],
                          ["Disponibilité", draft.availability],
                          [
                            "Zone principale",
                            draft.zone ||
                              draft.territoryName ||
                              "Non affectée",
                          ],
                          [
                            "Transport",
                            draft.transportMode || "Non renseigné",
                          ],
                          [
                            "Langues",
                            draft.languages.join(", ") ||
                              "Non renseignées",
                          ],
                          [
                            "Dernière activité",
                            timeline[0]?.createdAt
                              ? new Date(
                                  timeline[0].createdAt,
                                ).toLocaleString("fr-FR")
                              : "Aucune activité",
                          ],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2"
                          >
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                              {label}
                            </span>

                            <span className="text-right text-xs font-black text-slate-950">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab("incentives")}
                      className="text-left"
                    >
                      <Card className="h-full p-4 transition hover:border-amber-300">
                        <WalletCards className="h-5 w-5 text-amber-600" />

                        <p className="mt-3 text-sm font-black text-slate-950">
                          Solde & incentives
                        </p>

                        <div className="mt-3 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-500">
                              Disponible
                            </span>
                            <span className="font-black">
                              {incentiveAvailable.toLocaleString(
                                "fr-FR",
                              )}{" "}
                              Dh
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="font-bold text-slate-500">
                              En attente
                            </span>
                            <span className="font-black">
                              {pendingAmount.toLocaleString("fr-FR")} Dh
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="font-bold text-slate-500">
                              Payé
                            </span>
                            <span className="font-black">
                              {paidAmount.toLocaleString("fr-FR")} Dh
                            </span>
                          </div>
                        </div>
                      </Card>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("training")}
                      className="text-left"
                    >
                      <Card className="h-full p-4 transition hover:border-violet-300">
                        <GraduationCap className="h-5 w-5 text-violet-600" />

                        <p className="mt-3 text-sm font-black text-slate-950">
                          Formation & développement
                        </p>

                        <p className="mt-2 text-3xl font-black text-slate-950">
                          {trainingCompletion}%
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {
                            relatedTraining.filter((row) =>
                              isCompletedStatus(row.status),
                            ).length
                          }{" "}
                          / {relatedTraining.length} terminée(s)
                        </p>
                      </Card>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("documents")}
                      className="text-left"
                    >
                      <Card className="h-full p-4 transition hover:border-emerald-300">
                        <FileCheck2 className="h-5 w-5 text-emerald-600" />

                        <p className="mt-3 text-sm font-black text-slate-950">
                          Conformité & documents
                        </p>

                        <p className="mt-2 text-3xl font-black text-slate-950">
                          {complianceCompletion}%
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {
                            draft.documents.filter(
                              (document) =>
                                document.status === "validated",
                            ).length
                          }{" "}
                          contrôle(s) validé(s)
                        </p>
                      </Card>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModal("note")}
                      className="text-left"
                    >
                      <Card className="h-full p-4 transition hover:border-blue-300">
                        <NotebookPen className="h-5 w-5 text-blue-600" />

                        <p className="mt-3 text-sm font-black text-slate-950">
                          Notes récentes
                        </p>

                        <p className="mt-2 text-3xl font-black text-slate-950">
                          {draft.notes.length}
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">
                          {draft.notes[0]?.text ||
                            "Aucune note interne enregistrée."}
                        </p>
                      </Card>
                    </button>
                  </div>
                </>
              ) : null}

              {activeTab === "missions" ? (
                <Card className="overflow-hidden">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        Missions de l’ambassadeur
                      </h3>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Missions planifiées, actives, en retard, en validation
                        et terminées.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setModal("mission")}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl bg-blue-600 px-3 text-xs font-black text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Affecter mission
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-50">
                          {[
                            "Mission",
                            "Type",
                            "Territoire",
                            "Statut",
                            "Priorité",
                            "Échéance",
                            "Preuve",
                            "Actions",
                          ].map((header) => (
                            <th
                              key={header}
                              className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-600"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {relatedMissions.map((row) => (
                          <tr
                            key={idOf(row)}
                            className="border-t border-slate-100"
                          >
                            <td className="px-4 py-3">
                              <p className="text-xs font-black text-slate-950">
                                {text(row.title || row.name) ||
                                  "Mission sans titre"}
                              </p>

                              <p className="mt-1 text-[10px] font-bold text-slate-500">
                                {idOf(row)}
                              </p>
                            </td>

                            <td className="px-4 py-3 text-xs font-bold">
                              {text(row.mission_type || row.type) || "—"}
                            </td>

                            <td className="px-4 py-3 text-xs font-bold">
                              {text(
                                row.territory_name || row.city,
                              ) || "—"}
                            </td>

                            <td className="px-4 py-3">
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black text-blue-800">
                                {text(row.status) || "Non défini"}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-xs font-black">
                              {text(row.priority) || "Normale"}
                            </td>

                            <td className="px-4 py-3 text-xs font-black">
                              {dateValue(row.due_date) || "—"}
                            </td>

                            <td className="px-4 py-3 text-xs font-bold">
                              {text(
                                row.required_proof ||
                                  metadataOf(row).required_proof,
                              ) || "À définir"}
                            </td>

                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setMissionForm((current) => ({
                                    ...current,
                                    mode: "existing",
                                    existingMissionId: idOf(row),
                                  }))
                                  setModal("mission")
                                }}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-blue-700"
                              >
                                Gérer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!relatedMissions.length ? (
                    <EmptyState
                      icon={BriefcaseBusiness}
                      title="Aucune mission affectée"
                      description="Affectez une mission réelle pour démarrer l’exécution opérationnelle."
                      action={
                        <button
                          type="button"
                          onClick={() => setModal("mission")}
                          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white"
                        >
                          <Plus className="h-4 w-4" />
                          Affecter une mission
                        </button>
                      }
                    />
                  ) : null}
                </Card>
              ) : null}

              {activeTab === "leads" ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                      label="Leads"
                      value={relatedLeads.length}
                      helper="Attribution totale"
                      icon={Users}
                      tone="blue"
                      onClick={() => undefined}
                    />

                    <KpiCard
                      label="Qualifiés"
                      value={qualifiedLeadCount}
                      helper="Score ou statut qualifié"
                      icon={BadgeCheck}
                      tone="green"
                      onClick={() => undefined}
                    />

                    <KpiCard
                      label="Conversions"
                      value={relatedConversions.length}
                      helper={`${conversionRate}% de conversion`}
                      icon={Target}
                      tone="violet"
                      onClick={() => undefined}
                    />

                    <KpiCard
                      label="Valeur attribuée"
                      value={`${validatedAmount.toLocaleString(
                        "fr-FR",
                      )} Dh`}
                      helper="Montant validé"
                      icon={TrendingUp}
                      tone="green"
                      onClick={() => undefined}
                    />
                  </div>

                  <Card className="overflow-hidden">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-950">
                          Leads & conversions
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Attribution, qualité, prochaine action et conversion.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setModal("lead")}
                        className="inline-flex h-10 items-center gap-2 rounded-2xl bg-blue-600 px-3 text-xs font-black text-white"
                      >
                        <Plus className="h-4 w-4" />
                        Créer lead
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[950px]">
                        <thead>
                          <tr className="bg-slate-50">
                            {[
                              "Lead",
                              "Contact",
                              "Ville",
                              "Source",
                              "Score",
                              "Statut",
                              "Prochain suivi",
                              "Conversion",
                            ].map((header) => (
                              <th
                                key={header}
                                className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-600"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {relatedLeads.map((row) => {
                            const leadId = idOf(row)

                            const conversion = relatedConversions.find(
                              (item) =>
                                text(
                                  item.lead_id ||
                                    metadataOf(item).lead_id,
                                ) === leadId,
                            )

                            return (
                              <tr
                                key={leadId}
                                className="border-t border-slate-100"
                              >
                                <td className="px-4 py-3 text-xs font-black">
                                  {text(
                                    row.lead_name ||
                                      row.contact_name ||
                                      row.name,
                                  ) || "Lead sans nom"}
                                </td>

                                <td className="px-4 py-3 text-xs font-bold">
                                  {text(row.phone || row.email) || "—"}
                                </td>

                                <td className="px-4 py-3 text-xs font-bold">
                                  {text(row.city) || "—"}
                                </td>

                                <td className="px-4 py-3 text-xs font-bold">
                                  {text(row.source) || "—"}
                                </td>

                                <td className="px-4 py-3 text-xs font-black">
                                  {numberValue(row.score)}%
                                </td>

                                <td className="px-4 py-3">
                                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black text-blue-800">
                                    {text(row.status) || "Nouveau"}
                                  </span>
                                </td>

                                <td className="px-4 py-3 text-xs font-bold">
                                  {dateValue(
                                    row.next_follow_up ||
                                      row.next_action_date,
                                  ) || text(row.next_action) || "—"}
                                </td>

                                <td className="px-4 py-3">
                                  {conversion ? (
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-800">
                                      {amountOf(conversion).toLocaleString(
                                        "fr-FR",
                                      )}{" "}
                                      Dh
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black text-slate-400">
                                      Non converti
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {!relatedLeads.length ? (
                      <EmptyState
                        icon={Target}
                        title="Aucun lead attribué"
                        description="Créez un lead réel et attribuez-le automatiquement à cet ambassadeur."
                        action={
                          <button
                            type="button"
                            onClick={() => setModal("lead")}
                            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white"
                          >
                            <Plus className="h-4 w-4" />
                            Créer un lead
                          </button>
                        }
                      />
                    ) : null}
                  </Card>
                </div>
              ) : null}

              {activeTab === "incentives" ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                      label="Disponible"
                      value={`${incentiveAvailable.toLocaleString(
                        "fr-FR",
                      )} Dh`}
                      helper="Prêt à payer"
                      icon={CircleDollarSign}
                      tone="green"
                      onClick={() => undefined}
                    />

                    <KpiCard
                      label="En attente"
                      value={`${pendingAmount.toLocaleString(
                        "fr-FR",
                      )} Dh`}
                      helper="Validation ou litige"
                      icon={Clock3}
                      tone="amber"
                      onClick={() => undefined}
                    />

                    <KpiCard
                      label="Payé"
                      value={`${paidAmount.toLocaleString(
                        "fr-FR",
                      )} Dh`}
                      helper="Historique confirmé"
                      icon={Banknote}
                      tone="blue"
                      onClick={() => undefined}
                    />

                    <KpiCard
                      label="Commission"
                      value="10%"
                      helper="Fixe et verrouillée"
                      icon={WalletCards}
                      tone="violet"
                      onClick={() => setDrawerMode("details")}
                    />
                  </div>

                  <Card className="overflow-hidden">
                    <div className="border-b border-slate-100 p-4">
                      <h3 className="text-lg font-black text-slate-950">
                        Ledger incentives & paiements
                      </h3>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Base de calcul, période, décision, statut et paiement.
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px]">
                        <thead>
                          <tr className="bg-slate-50">
                            {[
                              "Référence",
                              "Type",
                              "Période",
                              "Base",
                              "Montant",
                              "Statut",
                              "Paiement",
                            ].map((header) => (
                              <th
                                key={header}
                                className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-600"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {relatedIncentives.map((row) => (
                            <tr
                              key={`${idOf(row)}-${text(row.type)}`}
                              className="border-t border-slate-100"
                            >
                              <td className="px-4 py-3 text-xs font-black">
                                {text(row.reference || row.code) ||
                                  idOf(row)}
                              </td>

                              <td className="px-4 py-3 text-xs font-bold">
                                {text(row.type || row.title) || "Incentive"}
                              </td>

                              <td className="px-4 py-3 text-xs font-bold">
                                {text(row.period) ||
                                  dateValue(row.created_at) ||
                                  "—"}
                              </td>

                              <td className="px-4 py-3 text-xs font-bold">
                                {text(
                                  row.calculation_basis || row.basis,
                                ) || "—"}
                              </td>

                              <td className="px-4 py-3 text-xs font-black">
                                {amountOf(row).toLocaleString("fr-FR")} Dh
                              </td>

                              <td className="px-4 py-3">
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black text-blue-800">
                                  {text(row.status) || "En attente"}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-xs font-bold">
                                {text(
                                  row.payment_method ||
                                    row.payout_method,
                                ) ||
                                  draft.paymentMethod ||
                                  "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {!relatedIncentives.length ? (
                      <EmptyState
                        icon={WalletCards}
                        title="Aucun mouvement financier"
                        description="Aucun incentive ou payout réel n’est encore rattaché à ce dossier."
                      />
                    ) : null}
                  </Card>
                </div>
              ) : null}

              {activeTab === "training" ? (
                <Card className="overflow-hidden">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        Formation & certification
                      </h3>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Modules, formateurs, scores, tentatives, échéances et
                        certifications.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openTrainingModal}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl bg-violet-600 px-3 text-xs font-black text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Affecter formation
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-50">
                          {[
                            "Formation",
                            "Formateur",
                            "Statut",
                            "Score",
                            "Échéance",
                            "Certification",
                            "Preuve",
                          ].map((header) => (
                            <th
                              key={header}
                              className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-600"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {relatedTraining.map((row) => (
                          <tr
                            key={idOf(row)}
                            className="border-t border-slate-100"
                          >
                            <td className="px-4 py-3 text-xs font-black">
                              {text(row.title || row.module_name) ||
                                "Formation sans titre"}
                            </td>

                            <td className="px-4 py-3 text-xs font-bold">
                              {text(row.trainer) || "À affecter"}
                            </td>

                            <td className="px-4 py-3">
                              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-black text-violet-800">
                                {text(row.status) || "Non commencé"}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-xs font-black">
                              {numberValue(row.score)}%
                            </td>

                            <td className="px-4 py-3 text-xs font-bold">
                              {dateValue(row.due_date) || "—"}
                            </td>

                            <td className="px-4 py-3 text-xs font-bold">
                              {text(
                                row.certification_status ||
                                  row.certificate_status,
                              ) || "Non émise"}
                            </td>

                            <td className="px-4 py-3 text-xs font-bold">
                              {text(row.evidence || row.evidence_url) ||
                                "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!relatedTraining.length ? (
                    <EmptyState
                      icon={GraduationCap}
                      title="Aucune formation affectée"
                      description="Créez une affectation Academy réelle et suivez son exécution."
                      action={
                        <button
                          type="button"
                          onClick={openTrainingModal}
                          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-black text-white"
                        >
                          <Plus className="h-4 w-4" />
                          Affecter une formation
                        </button>
                      }
                    />
                  ) : null}
                </Card>
              ) : null}

              {activeTab === "compliance" ? (
                <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                  <Card className="p-4">
                    <h3 className="text-lg font-black text-slate-950">
                      Readiness conformité
                    </h3>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-600">
                          Score conformité
                        </span>

                        <span className="text-3xl font-black text-slate-950">
                          {complianceCompletion}%
                        </span>
                      </div>

                      <div className="mt-3">
                        <Progress
                          value={complianceCompletion}
                          tone={
                            complianceCompletion === 100
                              ? "green"
                              : "amber"
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {[
                        [
                          "Commission fixe 10% acceptée",
                          draft.commissionAccepted,
                        ],
                        [
                          "Paiement vérifié",
                          draft.paymentVerified,
                        ],
                        [
                          "Territoire affecté",
                          Boolean(draft.territoryId),
                        ],
                        [
                          "Manager affecté",
                          Boolean(draft.manager),
                        ],
                        [
                          "Formation ≥ 70%",
                          trainingCompletion >= 70,
                        ],
                      ].map(([label, complete]) => (
                        <div
                          key={String(label)}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                        >
                          <span className="text-xs font-black text-slate-800">
                            {label}
                          </span>

                          {complete ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="overflow-hidden">
                    <div className="border-b border-slate-100 p-4">
                      <h3 className="text-lg font-black text-slate-950">
                        Contrôles obligatoires
                      </h3>
                    </div>

                    <div className="space-y-2 p-4">
                      {draft.documents.map((document) => (
                        <button
                          key={document.key}
                          type="button"
                          onClick={() =>
                            openDocumentModal(document)
                          }
                          className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-3 text-left hover:border-blue-300"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={`rounded-xl p-2 ${
                                document.status === "validated"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : document.status === "rejected" ||
                                      document.status === "expired"
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              <FileCheck2 className="h-4 w-4" />
                            </span>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-black text-slate-950">
                                {document.label}
                                {document.required ? " *" : ""}
                              </p>

                              <p className="mt-1 truncate text-[10px] font-bold text-slate-500">
                                {document.reviewer ||
                                  "Reviewer non affecté"}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
                              document.status === "validated"
                                ? "bg-emerald-50 text-emerald-800"
                                : document.status === "rejected" ||
                                    document.status === "expired"
                                  ? "bg-rose-50 text-rose-800"
                                  : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            {document.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </Card>
                </div>
              ) : null}

              {activeTab === "documents" ? (
                <Card className="overflow-hidden">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        Registre documentaire
                      </h3>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Statut, référence, reviewer, expiration et correction.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const firstMissing =
                          draft.documents.find(
                            (document) =>
                              document.status !== "validated",
                          ) || draft.documents[0]

                        if (firstMissing) {
                          openDocumentModal(firstMissing)
                        }
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl bg-blue-600 px-3 text-xs font-black text-white"
                    >
                      <Upload className="h-4 w-4" />
                      Ajouter / contrôler
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px]">
                      <thead>
                        <tr className="bg-slate-50">
                          {[
                            "Document",
                            "Obligatoire",
                            "Statut",
                            "Référence",
                            "Reviewer",
                            "Expiration",
                            "Dernière mise à jour",
                            "Action",
                          ].map((header) => (
                            <th
                              key={header}
                              className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-600"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {draft.documents.map((document) => (
                          <tr
                            key={document.key}
                            className="border-t border-slate-100"
                          >
                            <td className="px-4 py-3 text-xs font-black">
                              {document.label}
                            </td>

                            <td className="px-4 py-3 text-xs font-bold">
                              {document.required ? "Oui" : "Non"}
                            </td>

                            <td className="px-4 py-3">
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black text-blue-800">
                                {document.status}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-xs font-bold">
                              {document.reference || "—"}
                            </td>

                            <td className="px-4 py-3 text-xs font-bold">
                              {document.reviewer || "—"}
                            </td>

                            <td className="px-4 py-3 text-xs font-bold">
                              {document.expiresAt || "—"}
                            </td>

                            <td className="px-4 py-3 text-xs font-bold">
                              {document.updatedAt
                                ? new Date(
                                    document.updatedAt,
                                  ).toLocaleString("fr-FR")
                                : "—"}
                            </td>

                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  openDocumentModal(document)
                                }
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-blue-700"
                              >
                                Gérer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : null}

              {activeTab === "history" ? (
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        Historique complet
                      </h3>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Chronologie consolidée de toutes les activités du dossier.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={exportDossier}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-950"
                    >
                      <Download className="h-4 w-4" />
                      Exporter dossier
                    </button>
                  </div>

                  <div className="mt-5 space-y-5">
                    {timeline.map((event) => (
                      <div
                        key={event.id}
                        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[150px_1fr_180px]"
                      >
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                            {event.type}
                          </p>

                          <p className="mt-1 text-xs font-black text-slate-950">
                            {new Date(
                              event.createdAt,
                            ).toLocaleString("fr-FR")}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-black text-slate-950">
                            {event.title}
                          </p>

                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                            {event.detail || "Aucun détail supplémentaire"}
                          </p>
                        </div>

                        <div className="text-xs font-black text-slate-700">
                          {event.actor}
                        </div>
                      </div>
                    ))}

                    {!timeline.length ? (
                      <EmptyState
                        icon={History}
                        title="Aucun historique"
                        description="Les futures actions du dossier apparaîtront ici avec leur date et leur auteur."
                      />
                    ) : null}
                  </div>
                </Card>
              ) : null}
            </>
          ) : (
            <Card>
              <EmptyState
                icon={Users}
                title="Aucun ambassadeur sélectionné"
                description="Sélectionnez un ambassadeur réel dans le portefeuille pour charger son dossier complet."
              />
            </Card>
          )}
        </main>

        <aside className="min-w-0">
          <Card className="sticky top-24 overflow-hidden">
            <div className="border-b border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                    Command Drawer
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Mettre à jour le dossier
                  </h2>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {selectedDossier?.name ||
                      "Aucun dossier sélectionné"}
                  </p>
                </div>

                {dirty ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-black text-amber-800">
                    Non enregistré
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-800">
                    Synchronisé
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setDrawerMode("details")}
                  className={`h-9 rounded-xl text-xs font-black ${
                    drawerMode === "details"
                      ? "bg-white text-blue-700 shadow"
                      : "text-slate-600"
                  }`}
                >
                  Détails
                </button>

                <button
                  type="button"
                  onClick={() => setDrawerMode("activities")}
                  className={`h-9 rounded-xl text-xs font-black ${
                    drawerMode === "activities"
                      ? "bg-white text-blue-700 shadow"
                      : "text-slate-600"
                  }`}
                >
                  Activités
                </button>
              </div>
            </div>

            {selectedDossier ? (
              <>
                <div className="max-h-[calc(100vh-290px)] overflow-y-auto p-4">
                  {drawerMode === "details" ? (
                    <div className="space-y-3">
                      <details
                        open
                        className="rounded-2xl border border-slate-200 bg-white"
                      >
                        <summary className="cursor-pointer list-none p-4 text-sm font-black text-slate-950">
                          1. Identité & coordonnées
                        </summary>

                        <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
                          <Field label="Nom officiel">
                            <input
                              value={selectedDossier.name}
                              disabled
                              className={`${inputClass} bg-slate-100`}
                            />
                          </Field>

                          <Field label="Nom d’usage">
                            <input
                              value={draft.preferredName}
                              onChange={(event) =>
                                updateDraft(
                                  "preferredName",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </Field>

                          <Field label="Téléphone">
                            <input
                              value={selectedDossier.phone}
                              disabled
                              className={`${inputClass} bg-slate-100`}
                            />
                          </Field>

                          <Field label="WhatsApp">
                            <input
                              value={draft.whatsapp}
                              onChange={(event) =>
                                updateDraft(
                                  "whatsapp",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </Field>

                          <Field label="Région">
                            <input
                              value={draft.region}
                              onChange={(event) =>
                                updateDraft(
                                  "region",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </Field>

                          <Field label="Zone / quartier">
                            <input
                              value={draft.zone}
                              onChange={(event) =>
                                updateDraft(
                                  "zone",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </Field>

                          <div className="sm:col-span-2">
                            <Field label="Adresse">
                              <input
                                value={draft.address}
                                onChange={(event) =>
                                  updateDraft(
                                    "address",
                                    event.target.value,
                                  )
                                }
                                className={inputClass}
                              />
                            </Field>
                          </div>

                          <div className="sm:col-span-2">
                            <Field
                              label="Langues"
                              helper="Séparer les langues par une virgule."
                            >
                              <input
                                value={draft.languages.join(", ")}
                                onChange={(event) =>
                                  updateDraft(
                                    "languages",
                                    event.target.value
                                      .split(",")
                                      .map((item) => item.trim())
                                      .filter(Boolean),
                                  )
                                }
                                className={inputClass}
                              />
                            </Field>
                          </div>
                        </div>
                      </details>

                      <details
                        open
                        className="rounded-2xl border border-slate-200 bg-white"
                      >
                        <summary className="cursor-pointer list-none p-4 text-sm font-black text-slate-950">
                          2. Contrat & statut
                        </summary>

                        <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
                          <Field label="Statut">
                            <select
                              value={draft.status}
                              onChange={(event) =>
                                updateDraft(
                                  "status",
                                  event.target
                                    .value as DossierConfiguration["status"],
                                )
                              }
                              className={inputClass}
                            >
                              <option value="active">Actif</option>
                              <option value="onboarding">
                                En onboarding
                              </option>
                              <option value="inactive">
                                Inactif
                              </option>
                              <option value="suspended">
                                Suspendu
                              </option>
                              <option value="archived">
                                Archivé
                              </option>
                            </select>
                          </Field>

                          <Field label="Date d’activation">
                            <input
                              type="date"
                              value={draft.activationDate}
                              onChange={(event) =>
                                updateDraft(
                                  "activationDate",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </Field>

                          <Field label="Type de contrat">
                            <input
                              value={draft.contractType}
                              onChange={(event) =>
                                updateDraft(
                                  "contractType",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </Field>

                          <Field label="Manager">
                            <input
                              value={draft.manager}
                              onChange={(event) =>
                                updateDraft(
                                  "manager",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </Field>

                          <Field label="Début contrat">
                            <input
                              type="date"
                              value={draft.contractStartDate}
                              onChange={(event) =>
                                updateDraft(
                                  "contractStartDate",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </Field>

                          <Field label="Fin contrat">
                            <input
                              type="date"
                              value={draft.contractEndDate}
                              onChange={(event) =>
                                updateDraft(
                                  "contractEndDate",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </Field>

                          <button
                            type="button"
                            onClick={() =>
                              updateDraft(
                                "autoRenew",
                                !draft.autoRenew,
                              )
                            }
                            className={`sm:col-span-2 flex items-center justify-between rounded-2xl border p-3 text-left ${
                              draft.autoRenew
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <span className="text-xs font-black text-slate-950">
                              Renouvellement automatique
                            </span>

                            <CheckCircle2
                              className={`h-4 w-4 ${
                                draft.autoRenew
                                  ? "text-emerald-600"
                                  : "text-slate-300"
                              }`}
                            />
                          </button>
                        </div>
                      </details>

                      <details
                        open
                        className="rounded-2xl border border-slate-200 bg-white"
                      >
                        <summary className="cursor-pointer list-none p-4 text-sm font-black text-slate-950">
                          3. Performance & objectifs
                        </summary>

                        <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
                          {[
                            ["qualityScore", "Score qualité"],
                            ["leadGoal", "Objectif leads"],
                            [
                              "qualifiedLeadGoal",
                              "Objectif leads qualifiés",
                            ],
                            [
                              "conversionGoal",
                              "Objectif conversions",
                            ],
                            [
                              "fieldVisitGoal",
                              "Objectif visites terrain",
                            ],
                            [
                              "partnerMeetingGoal",
                              "Objectif RDV partenaires",
                            ],
                            [
                              "revenueGoal",
                              "Objectif revenu Dh",
                            ],
                          ].map(([key, label]) => (
                            <Field key={key} label={label}>
                              <input
                                type="number"
                                min="0"
                                max={
                                  key === "qualityScore"
                                    ? 100
                                    : undefined
                                }
                                value={
                                  draft[
                                    key as keyof DossierConfiguration
                                  ] as number
                                }
                                onChange={(event) =>
                                  updateDraft(
                                    key as keyof DossierConfiguration,
                                    numberValue(
                                      event.target.value,
                                    ) as never,
                                  )
                                }
                                className={inputClass}
                              />
                            </Field>
                          ))}
                        </div>
                      </details>

                      <details className="rounded-2xl border border-slate-200 bg-white">
                        <summary className="cursor-pointer list-none p-4 text-sm font-black text-slate-950">
                          4. Incitatifs & paiements
                        </summary>

                        <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
                          <div className="sm:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                              Commission verrouillée
                            </p>

                            <p className="mt-1 text-3xl font-black text-emerald-950">
                              10%
                            </p>
                          </div>

                          <Field label="Cycle payout">
                            <select
                              value={draft.payoutCycle}
                              onChange={(event) =>
                                updateDraft(
                                  "payoutCycle",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            >
                              <option>Hebdomadaire</option>
                              <option>Bimensuel</option>
                              <option>Mensuel</option>
                            </select>
                          </Field>

                          <Field label="Méthode paiement">
                            <select
                              value={draft.paymentMethod}
                              onChange={(event) =>
                                updateDraft(
                                  "paymentMethod",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            >
                              <option>Virement bancaire</option>
                              <option>Mobile Money</option>
                              <option>Espèces contrôlées</option>
                            </select>
                          </Field>

                          <div className="sm:col-span-2">
                            <Field label="RIB / référence bénéficiaire">
                              <input
                                value={draft.paymentReference}
                                onChange={(event) =>
                                  updateDraft(
                                    "paymentReference",
                                    event.target.value,
                                  )
                                }
                                className={inputClass}
                              />
                            </Field>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              updateDraft(
                                "commissionAccepted",
                                !draft.commissionAccepted,
                              )
                            }
                            className={`rounded-2xl border p-3 text-xs font-black ${
                              draft.commissionAccepted
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-amber-200 bg-amber-50 text-amber-800"
                            }`}
                          >
                            Commission{" "}
                            {draft.commissionAccepted
                              ? "acceptée"
                              : "à accepter"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateDraft(
                                "paymentVerified",
                                !draft.paymentVerified,
                              )
                            }
                            className={`rounded-2xl border p-3 text-xs font-black ${
                              draft.paymentVerified
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-amber-200 bg-amber-50 text-amber-800"
                            }`}
                          >
                            Paiement{" "}
                            {draft.paymentVerified
                              ? "vérifié"
                              : "à vérifier"}
                          </button>
                        </div>
                      </details>

                      <details className="rounded-2xl border border-slate-200 bg-white">
                        <summary className="cursor-pointer list-none p-4 text-sm font-black text-slate-950">
                          5. Conformité & documents
                        </summary>

                        <div className="space-y-2 border-t border-slate-100 p-4">
                          {draft.documents.map((document) => (
                            <button
                              key={document.key}
                              type="button"
                              onClick={() =>
                                openDocumentModal(document)
                              }
                              className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left"
                            >
                              <span className="text-xs font-black text-slate-950">
                                {document.label}
                              </span>

                              <span className="text-[9px] font-black text-blue-700">
                                {document.status}
                              </span>
                            </button>
                          ))}
                        </div>
                      </details>

                      <details className="rounded-2xl border border-slate-200 bg-white">
                        <summary className="cursor-pointer list-none p-4 text-sm font-black text-slate-950">
                          6. Opérations terrain
                        </summary>

                        <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <Field label="Territoire réel">
                              <select
                                value={draft.territoryId}
                                onChange={(event) => {
                                  const territoryId =
                                    event.target.value

                                  const territory =
                                    territories.find(
                                      (row) =>
                                        idOf(row) === territoryId,
                                    )

                                  setDraft((current) => ({
                                    ...current,
                                    territoryId,
                                    territoryName: text(
                                      territory?.name ||
                                        territory?.title ||
                                        territory?.territory_name,
                                    ),
                                  }))
                                }}
                                className={inputClass}
                              >
                                <option value="">
                                  Choisir un territoire
                                </option>

                                {territories.map((territory) => (
                                  <option
                                    key={idOf(territory)}
                                    value={idOf(territory)}
                                  >
                                    {text(
                                      territory.name ||
                                        territory.title ||
                                        territory.territory_name,
                                    ) || idOf(territory)}
                                  </option>
                                ))}
                              </select>
                            </Field>
                          </div>

                          <Field label="Mode de couverture">
                            <select
                              value={draft.coverageMode}
                              onChange={(event) =>
                                updateDraft(
                                  "coverageMode",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            >
                              <option>Partagé</option>
                              <option>Exclusif</option>
                              <option>Secondaire</option>
                              <option>Backup</option>
                            </select>
                          </Field>

                          <Field label="Rayon km">
                            <input
                              type="number"
                              min="1"
                              value={draft.radiusKm}
                              onChange={(event) =>
                                updateDraft(
                                  "radiusKm",
                                  numberValue(
                                    event.target.value,
                                    5,
                                  ),
                                )
                              }
                              className={inputClass}
                            />
                          </Field>

                          <Field label="Disponibilité">
                            <input
                              value={draft.availability}
                              onChange={(event) =>
                                updateDraft(
                                  "availability",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </Field>

                          <Field label="Moyen de transport">
                            <input
                              value={draft.transportMode}
                              onChange={(event) =>
                                updateDraft(
                                  "transportMode",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </Field>

                          <div className="sm:col-span-2">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700">
                              Services autorisés
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {SERVICES.map((service) => (
                                <button
                                  key={service}
                                  type="button"
                                  onClick={() =>
                                    toggleDraftArray(
                                      "services",
                                      service,
                                    )
                                  }
                                  className={`rounded-full border px-3 py-2 text-[10px] font-black ${
                                    draft.services.includes(service)
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-slate-200 bg-white text-slate-800"
                                  }`}
                                >
                                  {service}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700">
                              Canaux autorisés
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {CHANNELS.map((channel) => (
                                <button
                                  key={channel}
                                  type="button"
                                  onClick={() =>
                                    toggleDraftArray(
                                      "channels",
                                      channel,
                                    )
                                  }
                                  className={`rounded-full border px-3 py-2 text-[10px] font-black ${
                                    draft.channels.includes(channel)
                                      ? "border-emerald-600 bg-emerald-600 text-white"
                                      : "border-slate-200 bg-white text-slate-800"
                                  }`}
                                >
                                  {channel}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </details>

                      <details className="rounded-2xl border border-slate-200 bg-white">
                        <summary className="cursor-pointer list-none p-4 text-sm font-black text-slate-950">
                          7. Accès & ressources
                        </summary>

                        <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-3">
                          <Field label="Portail">
                            <select
                              value={draft.portalAccessStatus}
                              onChange={(event) =>
                                updateDraft(
                                  "portalAccessStatus",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            >
                              <option>Non préparé</option>
                              <option>Préparé</option>
                              <option>Actif</option>
                              <option>Suspendu</option>
                            </select>
                          </Field>

                          <Field label="CRM">
                            <select
                              value={draft.crmAccessStatus}
                              onChange={(event) =>
                                updateDraft(
                                  "crmAccessStatus",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            >
                              <option>Non préparé</option>
                              <option>Préparé</option>
                              <option>Actif</option>
                              <option>Suspendu</option>
                            </select>
                          </Field>

                          <Field label="Starter kit">
                            <select
                              value={draft.starterKitStatus}
                              onChange={(event) =>
                                updateDraft(
                                  "starterKitStatus",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            >
                              <option>Non préparé</option>
                              <option>En préparation</option>
                              <option>Prêt</option>
                              <option>Remis</option>
                            </select>
                          </Field>
                        </div>
                      </details>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-slate-950">
                          Activités du dossier
                        </h3>

                        <button
                          type="button"
                          onClick={() => setModal("note")}
                          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-800"
                        >
                          Ajouter note
                        </button>
                      </div>

                      {timeline.slice(0, 30).map((event) => (
                        <div
                          key={event.id}
                          className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                        >
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />

                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-950">
                              {event.title}
                            </p>

                            <p className="mt-1 text-[10px] font-semibold leading-5 text-slate-500">
                              {event.detail || "Mise à jour du dossier"}
                            </p>

                            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
                              {event.actor} ·{" "}
                              {new Date(
                                event.createdAt,
                              ).toLocaleString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      ))}

                      {!timeline.length ? (
                        <p className="py-10 text-center text-xs font-semibold text-slate-500">
                          Aucune activité réelle disponible.
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>

                <footer className="border-t border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const reset =
                          cloneConfiguration(
                            selectedDossier.configuration,
                          )

                        setDraft(reset)
                        setOriginalDraft(
                          cloneConfiguration(reset),
                        )
                        setError("")
                      }}
                      disabled={!dirty || busy}
                      className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-950 disabled:opacity-40"
                    >
                      Annuler
                    </button>

                    <button
                      type="button"
                      onClick={() => void saveDossier()}
                      disabled={!dirty || busy}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-xs font-black text-white disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Enregistrer
                    </button>
                  </div>
                </footer>
              </>
            ) : (
              <EmptyState
                icon={UserCheck}
                title="Aucun dossier chargé"
                description="Sélectionnez un ambassadeur réel pour ouvrir le panneau de gestion."
              />
            )}
          </Card>
        </aside>
      </div>

      {modal === "mission" ? (
        <ModalShell
          title="Affecter une mission"
          subtitle="Créez une mission opérationnelle ou affectez une mission existante, avec équipe, territoire, objectifs, preuve, SLA et gouvernance."
          icon={BriefcaseBusiness}
          onClose={() => setModal(null)}
          width="max-w-7xl"
          footer={
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black text-slate-600">
                Responsable principal :{" "}
                {selectedDossier?.name || "Non sélectionné"}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={() => void assignMission()}
                  disabled={
                    busy ||
                    (missionForm.mode === "create"
                      ? !missionForm.title.trim()
                      : !missionForm.existingMissionId)
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BriefcaseBusiness className="h-4 w-4" />
                  )}
                  {missionForm.mode === "create"
                    ? "Créer et affecter"
                    : "Affecter la mission"}
                </button>
              </div>
            </div>
          }
        >
          <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr_0.8fr]">
            <Card className="p-5">
              <h3 className="text-base font-black text-slate-950">
                Mode d’affectation
              </h3>

              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMissionForm((current) => ({
                      ...current,
                      mode: "create",
                    }))
                  }
                  className={`rounded-2xl border p-4 text-left ${
                    missionForm.mode === "create"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-sm font-black">
                    Créer une nouvelle mission
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Création réelle puis affectation immédiate.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMissionForm((current) => ({
                      ...current,
                      mode: "existing",
                    }))
                  }
                  className={`rounded-2xl border p-4 text-left ${
                    missionForm.mode === "existing"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-sm font-black">
                    Affecter une mission existante
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Utilise une mission déjà enregistrée.
                  </p>
                </button>
              </div>

              {missionForm.mode === "existing" ? (
                <div className="mt-4">
                  <Field label="Mission réelle" required>
                    <select
                      value={missionForm.existingMissionId}
                      onChange={(event) =>
                        setMissionForm((current) => ({
                          ...current,
                          existingMissionId:
                            event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">
                        Choisir une mission
                      </option>

                      {missions.map((mission) => (
                        <option
                          key={idOf(mission)}
                          value={idOf(mission)}
                        >
                          {text(mission.title || mission.name) ||
                            idOf(mission)}{" "}
                          · {text(mission.status) || "Sans statut"}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              ) : null}
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-black text-slate-950">
                Mission, objectifs & exécution
              </h3>

              {missionForm.mode === "create" ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Titre de mission" required>
                      <input
                        value={missionForm.title}
                        onChange={(event) =>
                          setMissionForm((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field label="Type">
                    <select
                      value={missionForm.missionType}
                      onChange={(event) =>
                        setMissionForm((current) => ({
                          ...current,
                          missionType: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="field_activation">
                        Activation terrain
                      </option>
                      <option value="prospecting">
                        Prospection
                      </option>
                      <option value="partner_visit">
                        Visite partenaire
                      </option>
                      <option value="lead_reactivation">
                        Relance leads
                      </option>
                      <option value="event">
                        Événement
                      </option>
                      <option value="quality_control">
                        Contrôle qualité
                      </option>
                    </select>
                  </Field>

                  <Field label="Priorité">
                    <select
                      value={missionForm.priority}
                      onChange={(event) =>
                        setMissionForm((current) => ({
                          ...current,
                          priority: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="normal">Normale</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgente</option>
                      <option value="critical">Critique</option>
                    </select>
                  </Field>

                  <Field label="Date de début">
                    <input
                      type="date"
                      value={missionForm.startDate}
                      onChange={(event) =>
                        setMissionForm((current) => ({
                          ...current,
                          startDate: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Échéance">
                    <input
                      type="date"
                      value={missionForm.dueDate}
                      onChange={(event) =>
                        setMissionForm((current) => ({
                          ...current,
                          dueDate: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Objectif leads">
                    <input
                      type="number"
                      min="0"
                      value={missionForm.leadTarget}
                      onChange={(event) =>
                        setMissionForm((current) => ({
                          ...current,
                          leadTarget: numberValue(
                            event.target.value,
                          ),
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Objectif conversions">
                    <input
                      type="number"
                      min="0"
                      value={missionForm.conversionTarget}
                      onChange={(event) =>
                        setMissionForm((current) => ({
                          ...current,
                          conversionTarget: numberValue(
                            event.target.value,
                          ),
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Instructions">
                      <textarea
                        value={missionForm.instructions}
                        onChange={(event) =>
                          setMissionForm((current) => ({
                            ...current,
                            instructions: event.target.value,
                          }))
                        }
                        className={textareaClass}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Preuve attendue">
                      <input
                        value={missionForm.requiredProof}
                        onChange={(event) =>
                          setMissionForm((current) => ({
                            ...current,
                            requiredProof:
                              event.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <p className="text-sm font-black text-blue-950">
                    Affectation contrôlée
                  </p>

                  <p className="mt-2 text-xs font-semibold leading-6 text-blue-800">
                    La mission existante conservera son dossier, son historique
                    et ses données. Cet ambassadeur deviendra le responsable
                    principal et les renforts seront ajoutés sans écraser les
                    affectations existantes.
                  </p>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-black text-slate-950">
                Équipe & gouvernance
              </h3>

              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-800">
                  Responsable principal
                </p>

                <p className="mt-2 text-sm font-black text-blue-950">
                  {selectedDossier?.name}
                </p>
              </div>

              <div className="mt-4">
                <Field label="Validateur">
                  <input
                    value={missionForm.validator}
                    onChange={(event) =>
                      setMissionForm((current) => ({
                        ...current,
                        validator: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700">
                  Ambassadeurs support
                </p>

                <div className="max-h-[290px] space-y-2 overflow-y-auto">
                  {dossiers
                    .filter(
                      (dossier) =>
                        dossier.id !== selectedDossier?.id &&
                        dossier.configuration.status ===
                          "active",
                    )
                    .map((dossier) => {
                      const selected =
                        missionForm.supportAmbassadorIds.includes(
                          dossier.id,
                        )

                      return (
                        <button
                          key={dossier.id}
                          type="button"
                          onClick={() =>
                            setMissionForm((current) => ({
                              ...current,
                              supportAmbassadorIds: selected
                                ? current.supportAmbassadorIds.filter(
                                    (id) => id !== dossier.id,
                                  )
                                : [
                                    ...current.supportAmbassadorIds,
                                    dossier.id,
                                  ],
                            }))
                          }
                          className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${
                            selected
                              ? "border-emerald-300 bg-emerald-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <span>
                            <span className="block text-xs font-black">
                              {dossier.name}
                            </span>

                            <span className="mt-1 block text-[10px] font-bold text-slate-500">
                              {dossier.city} ·{" "}
                              {dossier.configuration.territoryName ||
                                "Sans territoire"}
                            </span>
                          </span>

                          <CheckCircle2
                            className={`h-4 w-4 ${
                              selected
                                ? "text-emerald-600"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      )
                    })}
                </div>
              </div>
            </Card>
          </div>
        </ModalShell>
      ) : null}

      {modal === "lead" ? (
        <ModalShell
          title="Créer et attribuer un lead"
          subtitle="Créez un contact commercial réel, contrôlez les doublons, la source, le consentement, la qualification et le prochain suivi."
          icon={Target}
          onClose={() => setModal(null)}
          width="max-w-6xl"
          footer={
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black text-slate-600">
                Attribution : {selectedDossier?.name}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={() => void createLead()}
                  disabled={
                    busy ||
                    !leadForm.leadName.trim() ||
                    (!leadForm.phone.trim() &&
                      !leadForm.email.trim())
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Target className="h-4 w-4" />
                  )}
                  Créer et synchroniser
                </button>
              </div>
            </div>
          }
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-base font-black text-slate-950">
                Identité & besoin
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Parent / contact / entreprise" required>
                    <input
                      value={leadForm.leadName}
                      onChange={(event) =>
                        setLeadForm((current) => ({
                          ...current,
                          leadName: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Téléphone">
                  <input
                    value={leadForm.phone}
                    onChange={(event) =>
                      setLeadForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Email">
                  <input
                    value={leadForm.email}
                    onChange={(event) =>
                      setLeadForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Ville">
                  <input
                    value={leadForm.city}
                    onChange={(event) =>
                      setLeadForm((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Zone">
                  <input
                    value={leadForm.zone}
                    onChange={(event) =>
                      setLeadForm((current) => ({
                        ...current,
                        zone: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Type de lead">
                  <select
                    value={leadForm.leadType}
                    onChange={(event) =>
                      setLeadForm((current) => ({
                        ...current,
                        leadType: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option>B2C</option>
                    <option>B2B</option>
                    <option>Referral</option>
                    <option>Partenaire</option>
                  </select>
                </Field>

                <Field label="Besoin / service">
                  <input
                    value={leadForm.serviceNeed}
                    onChange={(event) =>
                      setLeadForm((current) => ({
                        ...current,
                        serviceNeed: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-black text-slate-950">
                Source, qualification & suivi
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Source">
                  <input
                    value={leadForm.source}
                    onChange={(event) =>
                      setLeadForm((current) => ({
                        ...current,
                        source: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Score qualification">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={leadForm.score}
                    onChange={(event) =>
                      setLeadForm((current) => ({
                        ...current,
                        score: numberValue(
                          event.target.value,
                        ),
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Code referral">
                  <input
                    value={leadForm.referralCode}
                    onChange={(event) =>
                      setLeadForm((current) => ({
                        ...current,
                        referralCode: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Code promo">
                  <input
                    value={leadForm.promoCode}
                    onChange={(event) =>
                      setLeadForm((current) => ({
                        ...current,
                        promoCode: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Prochaine action">
                  <input
                    value={leadForm.nextAction}
                    onChange={(event) =>
                      setLeadForm((current) => ({
                        ...current,
                        nextAction: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Date de relance">
                  <input
                    type="datetime-local"
                    value={leadForm.nextFollowUp}
                    onChange={(event) =>
                      setLeadForm((current) => ({
                        ...current,
                        nextFollowUp: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Preuve de source">
                    <input
                      value={leadForm.sourceProof}
                      onChange={(event) =>
                        setLeadForm((current) => ({
                          ...current,
                          sourceProof: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    setLeadForm((current) => ({
                      ...current,
                      consentConfirmed:
                        !current.consentConfirmed,
                    }))
                  }
                  className={`rounded-2xl border p-3 text-left ${
                    leadForm.consentConfirmed
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <p className="text-xs font-black">
                    Consentement contact
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-slate-500">
                    {leadForm.consentConfirmed
                      ? "Confirmé"
                      : "À confirmer"}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setLeadForm((current) => ({
                      ...current,
                      allowDuplicate: !current.allowDuplicate,
                    }))
                  }
                  className={`rounded-2xl border p-3 text-left ${
                    leadForm.allowDuplicate
                      ? "border-rose-200 bg-rose-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="text-xs font-black">
                    Exception doublon
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-slate-500">
                    Requiert un contrôle manuel.
                  </p>
                </button>
              </div>
            </Card>
          </div>
        </ModalShell>
      ) : null}

      {modal === "note" ? (
        <ModalShell
          title="Ouvrir une note opérationnelle"
          subtitle="Documentez une observation, une décision, une alerte ou un suivi avec visibilité, responsable et échéance."
          icon={NotebookPen}
          onClose={() => setModal(null)}
          width="max-w-4xl"
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => void saveNote()}
                disabled={busy || !noteForm.text.trim()}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white disabled:bg-slate-200"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <NotebookPen className="h-4 w-4" />
                )}
                Enregistrer la note
              </button>
            </div>
          }
        >
          <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
            <Card className="p-5">
              <div className="grid gap-3">
                <Field label="Catégorie">
                  <select
                    value={noteForm.category}
                    onChange={(event) =>
                      setNoteForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option>Suivi opérationnel</option>
                    <option>Performance</option>
                    <option>Qualité</option>
                    <option>Conformité</option>
                    <option>Finance</option>
                    <option>Coaching</option>
                    <option>Incident</option>
                    <option>Décision management</option>
                  </select>
                </Field>

                <Field label="Priorité">
                  <select
                    value={noteForm.priority}
                    onChange={(event) =>
                      setNoteForm((current) => ({
                        ...current,
                        priority: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="low">Faible</option>
                    <option value="normal">Normale</option>
                    <option value="high">Haute</option>
                    <option value="critical">Critique</option>
                  </select>
                </Field>

                <Field label="Visibilité">
                  <select
                    value={noteForm.visibility}
                    onChange={(event) =>
                      setNoteForm((current) => ({
                        ...current,
                        visibility: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="management">Management</option>
                    <option value="operations">Opérations</option>
                    <option value="finance">Finance</option>
                    <option value="all">Tous autorisés</option>
                  </select>
                </Field>

                <Field label="Responsable suivi">
                  <input
                    value={noteForm.owner}
                    onChange={(event) =>
                      setNoteForm((current) => ({
                        ...current,
                        owner: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Échéance suivi">
                  <input
                    type="date"
                    value={noteForm.followUpDate}
                    onChange={(event) =>
                      setNoteForm((current) => ({
                        ...current,
                        followUpDate: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
            </Card>

            <Card className="p-5">
              <Field label="Note interne" required>
                <textarea
                  value={noteForm.text}
                  onChange={(event) =>
                    setNoteForm((current) => ({
                      ...current,
                      text: event.target.value,
                    }))
                  }
                  placeholder="Contexte, observation, décision, preuve, action attendue…"
                  className={`${textareaClass} min-h-[310px]`}
                />
              </Field>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Entité liée">
                  <select
                    value={noteForm.linkedType}
                    onChange={(event) =>
                      setNoteForm((current) => ({
                        ...current,
                        linkedType: event.target.value,
                        linkedId: "",
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Aucune</option>
                    <option value="mission">Mission</option>
                    <option value="lead">Lead</option>
                    <option value="conversion">Conversion</option>
                    <option value="payment">Paiement</option>
                  </select>
                </Field>

                <Field label="Référence liée">
                  <input
                    value={noteForm.linkedId}
                    onChange={(event) =>
                      setNoteForm((current) => ({
                        ...current,
                        linkedId: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
            </Card>
          </div>
        </ModalShell>
      ) : null}

      {modal === "archive" ? (
        <ModalShell
          title="Archiver l’ambassadeur"
          subtitle="L’archivage conserve l’historique et les données financières. Il contrôle les missions ouvertes, les paiements, le territoire, les accès et les leads."
          icon={Archive}
          onClose={() => setModal(null)}
          width="max-w-5xl"
          footer={
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black text-rose-700">
                Aucun enregistrement n’est supprimé.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={() => void archiveAmbassador()}
                  disabled={
                    busy ||
                    !archiveForm.reason.trim() ||
                    !archiveForm.managerApproval.trim()
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-rose-600 px-5 text-sm font-black text-white disabled:bg-slate-200"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                  Archiver avec traçabilité
                </button>
              </div>
            </div>
          }
        >
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="p-5">
              <h3 className="text-base font-black text-slate-950">
                Décision d’archivage
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Motif obligatoire" required>
                    <textarea
                      value={archiveForm.reason}
                      onChange={(event) =>
                        setArchiveForm((current) => ({
                          ...current,
                          reason: event.target.value,
                        }))
                      }
                      className={textareaClass}
                    />
                  </Field>
                </div>

                <Field label="Date effective">
                  <input
                    type="date"
                    value={archiveForm.effectiveDate}
                    onChange={(event) =>
                      setArchiveForm((current) => ({
                        ...current,
                        effectiveDate: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Autorité approbatrice" required>
                  <input
                    value={archiveForm.managerApproval}
                    onChange={(event) =>
                      setArchiveForm((current) => ({
                        ...current,
                        managerApproval: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Réaffectation des leads">
                    <input
                      value={archiveForm.leadReassignmentTarget}
                      onChange={(event) =>
                        setArchiveForm((current) => ({
                          ...current,
                          leadReassignmentTarget:
                            event.target.value,
                        }))
                      }
                      placeholder="Manager ou ambassadeur cible"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-black text-slate-950">
                Contrôles avant archivage
              </h3>

              <div className="mt-4 grid gap-2">
                <div
                  className={`rounded-2xl border p-4 ${
                    openMissions.length
                      ? "border-amber-200 bg-amber-50"
                      : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <p className="text-sm font-black">
                    Missions ouvertes : {openMissions.length}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-4 ${
                    pendingPayouts.length
                      ? "border-amber-200 bg-amber-50"
                      : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <p className="text-sm font-black">
                    Paiements en attente : {pendingPayouts.length}
                  </p>
                </div>

                {[
                  [
                    "territoryReleaseRequested",
                    "Demander la libération du territoire",
                  ],
                  [
                    "accessSuspensionRequested",
                    "Demander la suspension des accès",
                  ],
                  [
                    "acknowledgeOpenItems",
                    "Confirmer la prise en charge des éléments ouverts",
                  ],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setArchiveForm((current) => ({
                        ...current,
                        [key]:
                          !current[
                            key as keyof typeof current
                          ],
                      }))
                    }
                    className={`flex items-center justify-between rounded-2xl border p-4 text-left ${
                      archiveForm[
                        key as keyof typeof archiveForm
                      ]
                        ? "border-blue-200 bg-blue-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <span className="text-xs font-black">
                      {label}
                    </span>

                    <CheckCircle2
                      className={`h-4 w-4 ${
                        archiveForm[
                          key as keyof typeof archiveForm
                        ]
                          ? "text-blue-700"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </ModalShell>
      ) : null}

      {modal === "training" ? (
        <ModalShell
          title="Affecter une formation"
          subtitle="Créez une affectation Training réelle avec module, formateur, échéance, mode, lieu et objectifs d’évaluation."
          icon={GraduationCap}
          onClose={() => setModal(null)}
          width="max-w-4xl"
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => void scheduleTraining()}
                disabled={busy || !trainingForm.title.trim()}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white disabled:bg-slate-200"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarDays className="h-4 w-4" />
                )}
                Affecter la formation
              </button>
            </div>
          }
        >
          <Card className="p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Titre / module" required>
                  <input
                    value={trainingForm.title}
                    onChange={(event) =>
                      setTrainingForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Code module">
                <input
                  value={trainingForm.moduleCode}
                  onChange={(event) =>
                    setTrainingForm((current) => ({
                      ...current,
                      moduleCode: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Formateur">
                <input
                  value={trainingForm.trainer}
                  onChange={(event) =>
                    setTrainingForm((current) => ({
                      ...current,
                      trainer: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Échéance">
                <input
                  type="date"
                  value={trainingForm.dueDate}
                  onChange={(event) =>
                    setTrainingForm((current) => ({
                      ...current,
                      dueDate: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Mode">
                <select
                  value={trainingForm.mode}
                  onChange={(event) =>
                    setTrainingForm((current) => ({
                      ...current,
                      mode: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option>Présentiel</option>
                  <option>Distanciel</option>
                  <option>Hybride</option>
                  <option>Terrain accompagné</option>
                </select>
              </Field>

              <Field label="Lieu / lien">
                <input
                  value={trainingForm.location}
                  onChange={(event) =>
                    setTrainingForm((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Score initial">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={trainingForm.score}
                  onChange={(event) =>
                    setTrainingForm((current) => ({
                      ...current,
                      score: numberValue(event.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Instructions">
                  <textarea
                    value={trainingForm.notes}
                    onChange={(event) =>
                      setTrainingForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    className={textareaClass}
                  />
                </Field>
              </div>
            </div>
          </Card>
        </ModalShell>
      ) : null}

      {modal === "document" ? (
        <ModalShell
          title="Contrôle documentaire"
          subtitle="Mettez à jour la pièce, la référence, le reviewer, la décision, l’expiration et la justification."
          icon={FileCheck2}
          onClose={() => setModal(null)}
          width="max-w-3xl"
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => void saveDocument()}
                disabled={busy}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileCheck2 className="h-4 w-4" />
                )}
                Enregistrer le contrôle
              </button>
            </div>
          }
        >
          <Card className="p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Document">
                <select
                  value={documentForm.key}
                  onChange={(event) => {
                    const document =
                      draft.documents.find(
                        (item) =>
                          item.key === event.target.value,
                      )

                    if (!document) return

                    setDocumentForm({
                      key: document.key,
                      label: document.label,
                      status: document.status,
                      reference: document.reference,
                      reviewer: document.reviewer,
                      note: document.note,
                      expiresAt: document.expiresAt,
                    })
                  }}
                  className={inputClass}
                >
                  {draft.documents.map((document) => (
                    <option
                      key={document.key}
                      value={document.key}
                    >
                      {document.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Statut">
                <select
                  value={documentForm.status}
                  onChange={(event) =>
                    setDocumentForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="missing">Manquant</option>
                  <option value="requested">Demandé</option>
                  <option value="uploaded">Téléversé</option>
                  <option value="review">En revue</option>
                  <option value="validated">Validé</option>
                  <option value="rejected">Rejeté</option>
                  <option value="expired">Expiré</option>
                </select>
              </Field>

              <Field label="Reviewer">
                <input
                  value={documentForm.reviewer}
                  onChange={(event) =>
                    setDocumentForm((current) => ({
                      ...current,
                      reviewer: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Expiration">
                <input
                  type="date"
                  value={documentForm.expiresAt}
                  onChange={(event) =>
                    setDocumentForm((current) => ({
                      ...current,
                      expiresAt: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Référence / preuve">
                  <input
                    value={documentForm.reference}
                    onChange={(event) =>
                      setDocumentForm((current) => ({
                        ...current,
                        reference: event.target.value,
                      }))
                    }
                    placeholder="Référence interne, URL sécurisée ou identifiant documentaire"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Note de décision">
                  <textarea
                    value={documentForm.note}
                    onChange={(event) =>
                      setDocumentForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    className={textareaClass}
                  />
                </Field>
              </div>
            </div>
          </Card>
        </ModalShell>
      ) : null}

      {modal === "score" ? (
        <ModalShell
          title="Explication du score ambassadeur"
          subtitle="Chaque score est explicable et dérivé de la qualité, de la performance, de la conformité, de la formation, de l’activité et du territoire."
          icon={BadgeCheck}
          onClose={() => setModal(null)}
          width="max-w-4xl"
          footer={
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black"
              >
                Fermer
              </button>
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Score global", scoreBreakdown.global, "blue"],
              ["Qualité", scoreBreakdown.quality, "green"],
              [
                "Performance",
                scoreBreakdown.performance,
                "blue",
              ],
              [
                "Conformité",
                scoreBreakdown.compliance,
                "amber",
              ],
              [
                "Formation",
                scoreBreakdown.training,
                "violet",
              ],
              [
                "Activité",
                scoreBreakdown.activity,
                "blue",
              ],
              [
                "Fit territoire",
                scoreBreakdown.territory,
                "green",
              ],
            ].map(([label, value, tone]) => (
              <Card key={String(label)} className="p-4">
                <p className="text-xs font-black text-slate-500">
                  {label}
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {value}%
                </p>

                <div className="mt-3">
                  <Progress
                    value={Number(value)}
                    tone={tone as any}
                  />
                </div>
              </Card>
            ))}
          </div>

          <Card className="mt-4 p-5">
            <h3 className="text-base font-black text-slate-950">
              Conditions à corriger
            </h3>

            <div className="mt-4 grid gap-2">
              {scoreBreakdown.blockers.map((blocker) => (
                <button
                  key={blocker}
                  type="button"
                  onClick={() => {
                    setModal(null)

                    if (
                      blocker.includes("Conformité") ||
                      blocker.includes("Commission") ||
                      blocker.includes("Paiement")
                    ) {
                      setActiveTab("compliance")
                    } else if (blocker.includes("Formation")) {
                      setActiveTab("training")
                    } else {
                      setDrawerMode("details")
                    }
                  }}
                  className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left"
                >
                  <span className="text-xs font-black text-amber-950">
                    {blocker}
                  </span>

                  <ChevronDown className="h-4 w-4 -rotate-90 text-amber-700" />
                </button>
              ))}

              {!scoreBreakdown.blockers.length ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" />

                  <p className="mt-2 text-sm font-black text-emerald-950">
                    Aucun blocage critique détecté
                  </p>
                </div>
              ) : null}
            </div>
          </Card>
        </ModalShell>
      ) : null}

      {modal === "more" ? (
        <ModalShell
          title="Actions complémentaires"
          subtitle="Actions non destructives et outils de gestion du dossier."
          icon={Ellipsis}
          onClose={() => setModal(null)}
          width="max-w-2xl"
          footer={
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black"
              >
                Fermer
              </button>
            </div>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                exportDossier()
                setModal(null)
              }}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-blue-300"
            >
              <Download className="h-5 w-5 text-blue-600" />

              <p className="mt-3 text-sm font-black">
                Exporter le dossier
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                Export JSON structuré des données actuellement chargées.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setModal("training")
              }}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-violet-300"
            >
              <GraduationCap className="h-5 w-5 text-violet-600" />

              <p className="mt-3 text-sm font-black">
                Affecter une formation
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                Créer une affectation Academy réelle.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setModal(null)
                setDrawerMode("activities")
              }}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-emerald-300"
            >
              <Activity className="h-5 w-5 text-emerald-600" />

              <p className="mt-3 text-sm font-black">
                Ouvrir les activités
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                Afficher la chronologie dans le command drawer.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setModal("archive")
              }}
              className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-left hover:border-rose-400"
            >
              <Archive className="h-5 w-5 text-rose-600" />

              <p className="mt-3 text-sm font-black">
                Préparer archivage
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                Aucun dossier n’est supprimé.
              </p>
            </button>
          </div>
        </ModalShell>
      ) : null}

      <style jsx global>{`
        [data-ambassador-directory-route="enterprise-master-dossier"] h1,
        [data-ambassador-directory-route="enterprise-master-dossier"] h2,
        [data-ambassador-directory-route="enterprise-master-dossier"] h3,
        [data-ambassador-directory-route="enterprise-master-dossier"] h4,
        [data-ambassador-directory-route="enterprise-master-dossier"] label,
        [data-ambassador-directory-route="enterprise-master-dossier"] th,
        [data-ambassador-directory-route="enterprise-master-dossier"] summary {
          color: #020617 !important;
          -webkit-text-fill-color: #020617 !important;
          font-weight: 900 !important;
        }

        [data-ambassador-directory-route="enterprise-master-dossier"] input,
        [data-ambassador-directory-route="enterprise-master-dossier"] select,
        [data-ambassador-directory-route="enterprise-master-dossier"] textarea,
        [data-ambassador-directory-route="enterprise-master-dossier"] option {
          color: #020617 !important;
          -webkit-text-fill-color: #020617 !important;
          font-weight: 700 !important;
        }

        [data-ambassador-directory-route="enterprise-master-dossier"]
          input::placeholder,
        [data-ambassador-directory-route="enterprise-master-dossier"]
          textarea::placeholder {
          color: #64748b !important;
          -webkit-text-fill-color: #64748b !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}
