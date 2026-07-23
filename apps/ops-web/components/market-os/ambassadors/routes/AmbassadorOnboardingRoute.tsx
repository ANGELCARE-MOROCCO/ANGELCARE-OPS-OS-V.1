"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  GraduationCap,
  KeyRound,
  Layers3,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Upload,
  UserCheck,
  Users,
  WalletCards,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react"

type Row = Record<string, any>

type OnboardingStage =
  | "prequalification"
  | "onboarding"
  | "compliance"
  | "training"
  | "assignment"
  | "validation"
  | "ready"
  | "activated"
  | "abandoned"

type StudioTab =
  | "dossier"
  | "compliance"
  | "training"
  | "territory"
  | "access"
  | "approvals"
  | "activation"

type ModalKind =
  | null
  | "start"
  | "import"
  | "bulk"
  | "training"
  | "risks"
  | "task"
  | "document"
  | "communication"
  | "approval"

type RiskFilter =
  | "all"
  | "blocked"
  | "overdue"
  | "documents"
  | "training"
  | "territory"
  | "approval"

type ApprovalRole =
  | "recruitment"
  | "manager"
  | "compliance"
  | "training"
  | "operations"
  | "finance"

interface DocumentControl {
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
  reviewer: string
  note: string
  expiresAt: string
  updatedAt: string
}

interface TrainingControl {
  key: string
  label: string
  mandatory: boolean
  status:
    | "not_started"
    | "scheduled"
    | "in_progress"
    | "completed"
    | "failed"
    | "exempted"
  trainer: string
  dueDate: string
  score: number
  attempts: number
  evidence: string
  completedAt: string
}

interface ApprovalControl {
  role: ApprovalRole
  label: string
  status:
    | "pending"
    | "approved"
    | "correction"
    | "rejected"
    | "hold"
  approver: string
  note: string
  evidence: string
  decidedAt: string
}

interface TaskControl {
  id: string
  title: string
  owner: string
  priority: "low" | "normal" | "high" | "critical"
  status: "open" | "in_progress" | "blocked" | "completed"
  dueDate: string
  proof: string
  createdAt: string
  completedAt: string
}

interface CommunicationControl {
  id: string
  channel: "WhatsApp" | "Email" | "Téléphone" | "Interne"
  purpose: string
  recipient: string
  message: string
  status: "prepared" | "logged" | "cancelled"
  createdAt: string
}

interface TimelineControl {
  id: string
  action: string
  actor: string
  detail: string
  createdAt: string
}

interface ActivationState {
  version: number

  owner: string
  manager: string
  priority: "normal" | "high" | "critical"
  targetActivationDate: string
  dueDate: string
  reviewDate: string
  notes: string

  commissionRate: 10
  commissionLocked: true
  commissionAccepted: boolean
  confidentialityAccepted: boolean

  documents: DocumentControl[]
  training: TrainingControl[]

  territoryId: string
  territoryName: string
  coverageMode:
    | "exclusive"
    | "shared"
    | "secondary"
    | "backup"
    | "prospecting_only"
  radiusKm: number

  services: string[]
  channels: string[]

  leadTarget: number
  qualifiedLeadTarget: number
  conversionTarget: number
  fieldVisitTarget: number
  partnerMeetingTarget: number
  revenueTarget: number

  promoCode: string
  referralCode: string

  payoutCycle: "weekly" | "twice_monthly" | "monthly"
  paymentMethod:
    | "bank_transfer"
    | "mobile_money"
    | "controlled_cash"
  paymentReference: string
  paymentVerified: boolean

  portalAccessStatus:
    | "not_prepared"
    | "prepared"
    | "active"
    | "suspended"
  crmAccessStatus:
    | "not_prepared"
    | "prepared"
    | "active"
    | "suspended"
  starterKitStatus:
    | "not_prepared"
    | "preparing"
    | "ready"
    | "delivered"

  approvals: ApprovalControl[]
  tasks: TaskControl[]
  communications: CommunicationControl[]
  timeline: TimelineControl[]

  firstMissionEnabled: boolean
  firstMissionTitle: string
  firstMissionDueDate: string

  lastSavedAt: string
}

interface Dossier {
  key: string
  candidateId: string
  ambassadorId: string
  onboardingId: string

  name: string
  phone: string
  email: string
  city: string
  region: string
  zone: string
  source: string
  reference: string

  stage: OnboardingStage
  createdAt: string
  updatedAt: string

  candidate: Row
  ambassador: Row
  onboarding: Row
  metadata: Row
  activation: ActivationState
}

interface ReadinessResult {
  score: number
  complete: number
  total: number
  blockers: string[]
  sections: {
    identity: number
    training: number
    territory: number
    access: number
    approvals: number
  }
}

interface RiskItem {
  id: string
  dossierKey: string
  candidateName: string
  category:
    | "blocked"
    | "overdue"
    | "documents"
    | "training"
    | "territory"
    | "approval"
  severity: "medium" | "high" | "critical"
  title: string
  detail: string
}

interface OperationResult {
  success: boolean
  message: string
  partialFailures: string[]
  ambassadorId?: string
  onboardingId?: string
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
    key: "address",
    label: "Justificatif d’adresse",
    required: false,
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
    label: "Accord confidentialité et données",
    required: true,
  },
  {
    key: "payment",
    label: "RIB / référence de paiement",
    required: true,
  },
  {
    key: "profile_photo",
    label: "Photo de profil officielle",
    required: false,
  },
]

const TRAINING_BLUEPRINT: Array<
  Pick<TrainingControl, "key" | "label" | "mandatory">
> = [
  {
    key: "brand",
    label: "Marque, posture et standards AngelCare",
    mandatory: true,
  },
  {
    key: "b2c",
    label: "Catalogue et argumentaire B2C",
    mandatory: true,
  },
  {
    key: "b2b",
    label: "Catalogue et argumentaire B2B",
    mandatory: true,
  },
  {
    key: "lead_qualification",
    label: "Qualification et suivi des leads",
    mandatory: true,
  },
  {
    key: "whatsapp_crm",
    label: "WhatsApp, CRM et discipline de traçabilité",
    mandatory: true,
  },
  {
    key: "codes",
    label: "Codes promo, referral et attribution",
    mandatory: true,
  },
  {
    key: "privacy",
    label: "Protection des données et confidentialité",
    mandatory: true,
  },
  {
    key: "field_safety",
    label: "Sécurité terrain et posture professionnelle",
    mandatory: true,
  },
  {
    key: "incidents",
    label: "Incidents, risques et escalade",
    mandatory: true,
  },
  {
    key: "payout",
    label: "Commission, incentives et payout",
    mandatory: true,
  },
]

const APPROVAL_BLUEPRINT: Array<
  Pick<ApprovalControl, "role" | "label">
> = [
  {
    role: "recruitment",
    label: "Validation Recruitment",
  },
  {
    role: "manager",
    label: "Validation manager",
  },
  {
    role: "compliance",
    label: "Validation conformité",
  },
  {
    role: "training",
    label: "Validation formation",
  },
  {
    role: "operations",
    label: "Validation opérations",
  },
  {
    role: "finance",
    label: "Validation finance & paiement",
  },
]

const STUDIO_TABS: Array<{
  key: StudioTab
  label: string
  icon: LucideIcon
}> = [
  {
    key: "dossier",
    label: "Dossier",
    icon: UserCheck,
  },
  {
    key: "compliance",
    label: "Conformité",
    icon: ShieldCheck,
  },
  {
    key: "training",
    label: "Formation",
    icon: GraduationCap,
  },
  {
    key: "territory",
    label: "Territoire",
    icon: MapPin,
  },
  {
    key: "access",
    label: "Accès",
    icon: KeyRound,
  },
  {
    key: "approvals",
    label: "Validations",
    icon: BadgeCheck,
  },
  {
    key: "activation",
    label: "Activation",
    icon: Zap,
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

function numberValue(
  value: unknown,
  fallback = 0,
): number {
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
    "completed",
    "approved",
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

function displayName(row?: Row): string {
  return (
    text(
      row?.candidate_name ||
        row?.full_name ||
        row?.display_name ||
        row?.name ||
        row?.title,
    ) || "Dossier sans nom"
  )
}

function extractRows(
  payload: unknown,
  keys: string[],
): Row[] {
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

  const candidates = [
    data.record,
    data.item,
    data.candidate,
    data.ambassador,
    data.onboarding,
    root.record,
    root.item,
    root.candidate,
    root.ambassador,
    root.onboarding,
    root.data,
    root,
  ]

  for (const candidate of candidates) {
    const row = asRecord(candidate)
    if (idOf(row)) return row
  }

  return root
}

function contactKey(row?: Row): string {
  const email = text(row?.email).toLowerCase()
  if (email) return `email:${email}`

  const phone = text(
    row?.phone || row?.telephone,
  ).replace(/\D/g, "")

  if (phone) return `phone:${phone}`

  return [
    displayName(row).toLowerCase(),
    text(row?.city || row?.main_city).toLowerCase(),
  ].join("|")
}

function nowIso(): string {
  return new Date().toISOString()
}

function dateInput(value: unknown): string {
  const raw = text(value)
  if (!raw) return ""

  const parsed = new Date(raw)

  return Number.isNaN(parsed.getTime())
    ? raw.slice(0, 10)
    : parsed.toISOString().slice(0, 10)
}

function isPast(value: string): boolean {
  if (!value) return false

  const parsed = new Date(value)

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getTime() < Date.now()
  )
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

function cloneActivation(
  value: ActivationState,
): ActivationState {
  return JSON.parse(
    JSON.stringify(value),
  ) as ActivationState
}

function generateCode(
  prefix: string,
  name: string,
  city: string,
): string {
  const normalized = `${name}-${city}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 18)

  return `${prefix}-${
    normalized ||
    Date.now().toString(36).toUpperCase()
  }`
}

function normalizeStage(
  value: unknown,
  hasOnboarding: boolean,
): OnboardingStage {
  const stage = text(value).toLowerCase()

  if (
    stage.includes("abandon") ||
    stage.includes("reject") ||
    stage.includes("inactive") ||
    stage.includes("suspend")
  ) {
    return "abandoned"
  }

  if (
    stage === "active" ||
    stage.includes("activated") ||
    stage.includes("completed")
  ) {
    return "activated"
  }

  if (
    stage.includes("ready") ||
    stage.includes("prêt") ||
    stage.includes("pret")
  ) {
    return "ready"
  }

  if (
    stage.includes("validation") ||
    stage.includes("approval")
  ) {
    return "validation"
  }

  if (stage.includes("assign")) {
    return "assignment"
  }

  if (stage.includes("training")) {
    return "training"
  }

  if (
    stage.includes("compliance") ||
    stage.includes("document")
  ) {
    return "compliance"
  }

  if (
    stage.includes("onboarding") ||
    stage.includes("integration")
  ) {
    return "onboarding"
  }

  return hasOnboarding
    ? "onboarding"
    : "prequalification"
}

function stageLabel(stage: OnboardingStage): string {
  const labels: Record<OnboardingStage, string> = {
    prequalification: "À intégrer",
    onboarding: "Dossier ouvert",
    compliance: "Conformité",
    training: "Formation",
    assignment: "Affectation",
    validation: "Validation finale",
    ready: "Prêt à activer",
    activated: "Activé",
    abandoned: "Suspendu / abandonné",
  }

  return labels[stage]
}

function stageTone(stage: OnboardingStage): string {
  const tones: Record<OnboardingStage, string> = {
    prequalification:
      "border-violet-200 bg-violet-50 text-violet-800",
    onboarding:
      "border-blue-200 bg-blue-50 text-blue-800",
    compliance:
      "border-amber-200 bg-amber-50 text-amber-800",
    training:
      "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
    assignment:
      "border-cyan-200 bg-cyan-50 text-cyan-800",
    validation:
      "border-indigo-200 bg-indigo-50 text-indigo-800",
    ready:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
    activated:
      "border-green-200 bg-green-50 text-green-800",
    abandoned:
      "border-rose-200 bg-rose-50 text-rose-800",
  }

  return tones[stage]
}

function createDefaultActivation(): ActivationState {
  return {
    version: 2,

    owner: "",
    manager: "",
    priority: "normal",
    targetActivationDate: "",
    dueDate: "",
    reviewDate: "",
    notes: "",

    commissionRate: 10,
    commissionLocked: true,
    commissionAccepted: false,
    confidentialityAccepted: false,

    documents: DOCUMENT_BLUEPRINT.map(
      (document) => ({
        ...document,
        status: "missing",
        reviewer: "",
        note: "",
        expiresAt: "",
        updatedAt: "",
      }),
    ),

    training: TRAINING_BLUEPRINT.map(
      (module) => ({
        ...module,
        status: "not_started",
        trainer: "",
        dueDate: "",
        score: 0,
        attempts: 0,
        evidence: "",
        completedAt: "",
      }),
    ),

    territoryId: "",
    territoryName: "",
    coverageMode: "shared",
    radiusKm: 5,

    services: [],
    channels: [],

    leadTarget: 20,
    qualifiedLeadTarget: 10,
    conversionTarget: 5,
    fieldVisitTarget: 4,
    partnerMeetingTarget: 2,
    revenueTarget: 0,

    promoCode: "",
    referralCode: "",

    payoutCycle: "monthly",
    paymentMethod: "bank_transfer",
    paymentReference: "",
    paymentVerified: false,

    portalAccessStatus: "not_prepared",
    crmAccessStatus: "not_prepared",
    starterKitStatus: "not_prepared",

    approvals: APPROVAL_BLUEPRINT.map(
      (approval) => ({
        ...approval,
        status: "pending",
        approver: "",
        note: "",
        evidence: "",
        decidedAt: "",
      }),
    ),

    tasks: [],
    communications: [],
    timeline: [],

    firstMissionEnabled: false,
    firstMissionTitle:
      "Première mission d’activation",
    firstMissionDueDate: "",

    lastSavedAt: "",
  }
}

function mergeByKey<T extends { key: string }>(
  defaults: T[],
  stored: T[],
): T[] {
  const map = new Map(
    stored.map((item) => [item.key, item]),
  )

  const merged = defaults.map((item) => ({
    ...item,
    ...(map.get(item.key) || {}),
  }))

  const known = new Set(
    defaults.map((item) => item.key),
  )

  return [
    ...merged,
    ...stored.filter(
      (item) => !known.has(item.key),
    ),
  ]
}

function mergeApprovals(
  defaults: ApprovalControl[],
  stored: ApprovalControl[],
): ApprovalControl[] {
  const map = new Map(
    stored.map((item) => [item.role, item]),
  )

  return defaults.map((item) => ({
    ...item,
    ...(map.get(item.role) || {}),
  }))
}

function parseActivation(
  metadata: Row,
): ActivationState {
  const base = createDefaultActivation()

  const stored = asRecord(
    metadata.activation_os ||
      metadata.activation ||
      metadata.onboarding_activation,
  )

  const storedDocuments =
    asRows(stored.documents) as DocumentControl[]

  const storedTraining =
    asRows(stored.training) as TrainingControl[]

  const storedApprovals =
    asRows(stored.approvals) as ApprovalControl[]

  return {
    ...base,
    ...stored,

    version: 2,
    commissionRate: 10,
    commissionLocked: true,

    documents: mergeByKey(
      base.documents,
      storedDocuments,
    ),

    training: mergeByKey(
      base.training,
      storedTraining,
    ),

    approvals: mergeApprovals(
      base.approvals,
      storedApprovals,
    ),

    services: Array.isArray(stored.services)
      ? stored.services.map(text).filter(Boolean)
      : base.services,

    channels: Array.isArray(stored.channels)
      ? stored.channels.map(text).filter(Boolean)
      : base.channels,

    tasks: asRows(stored.tasks) as TaskControl[],

    communications: asRows(
      stored.communications,
    ) as CommunicationControl[],

    timeline: asRows(
      stored.timeline,
    ) as TimelineControl[],
  }
}

function computeReadiness(
  activation: ActivationState,
): ReadinessResult {
  const requiredDocuments =
    activation.documents.filter(
      (document) => document.required,
    )

  const validDocuments =
    requiredDocuments.filter(
      (document) =>
        document.status === "validated",
    ).length

  const mandatoryTraining =
    activation.training.filter(
      (module) => module.mandatory,
    )

  const completedTraining =
    mandatoryTraining.filter(
      (module) =>
        module.status === "completed" &&
        module.score >= 70,
    ).length

  const approved = activation.approvals.filter(
    (approval) =>
      approval.status === "approved" &&
      Boolean(approval.approver),
  ).length

  const gates: Array<{
    label: string
    complete: boolean
    section:
      | "identity"
      | "training"
      | "territory"
      | "access"
      | "approvals"
  }> = [
    {
      label: "Manager opérationnel assigné",
      complete: Boolean(
        activation.manager ||
          activation.owner,
      ),
      section: "identity",
    },
    {
      label: "Documents obligatoires validés",
      complete:
        validDocuments ===
        requiredDocuments.length,
      section: "identity",
    },
    {
      label:
        "Commission fixe 10% officiellement acceptée",
      complete: activation.commissionAccepted,
      section: "identity",
    },
    {
      label:
        "Confidentialité et protection des données acceptées",
      complete:
        activation.confidentialityAccepted,
      section: "identity",
    },
    {
      label: "Formation obligatoire complétée",
      complete:
        completedTraining ===
        mandatoryTraining.length,
      section: "training",
    },
    {
      label: "Territoire affecté",
      complete: Boolean(
        activation.territoryId,
      ),
      section: "territory",
    },
    {
      label: "Services autorisés définis",
      complete:
        activation.services.length > 0,
      section: "territory",
    },
    {
      label: "Canaux autorisés définis",
      complete:
        activation.channels.length > 0,
      section: "territory",
    },
    {
      label: "Date de revue territoriale définie",
      complete: Boolean(
        activation.reviewDate,
      ),
      section: "territory",
    },
    {
      label:
        "Code promo et code referral générés",
      complete: Boolean(
        activation.promoCode &&
          activation.referralCode,
      ),
      section: "access",
    },
    {
      label:
        "Référence bénéficiaire renseignée",
      complete: Boolean(
        activation.paymentReference,
      ),
      section: "access",
    },
    {
      label: "Moyen de paiement vérifié",
      complete: activation.paymentVerified,
      section: "access",
    },
    {
      label: "Toutes les validations obtenues",
      complete:
        approved === activation.approvals.length,
      section: "approvals",
    },
  ]

  const sectionScore = (
    section: keyof ReadinessResult["sections"],
  ) => {
    const scoped = gates.filter(
      (gate) => gate.section === section,
    )

    return scoped.length
      ? Math.round(
          (scoped.filter(
            (gate) => gate.complete,
          ).length /
            scoped.length) *
            100,
        )
      : 0
  }

  const complete = gates.filter(
    (gate) => gate.complete,
  ).length

  return {
    score: gates.length
      ? Math.round(
          (complete / gates.length) * 100,
        )
      : 0,

    complete,
    total: gates.length,

    blockers: gates
      .filter((gate) => !gate.complete)
      .map((gate) => gate.label),

    sections: {
      identity: sectionScore("identity"),
      training: sectionScore("training"),
      territory: sectionScore("territory"),
      access: sectionScore("access"),
      approvals: sectionScore("approvals"),
    },
  }
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ""
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]

    if (character === '"') {
      if (
        quoted &&
        line[index + 1] === '"'
      ) {
        current += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (
      character === "," &&
      !quoted
    ) {
      cells.push(current.trim())
      current = ""
    } else {
      current += character
    }
  }

  cells.push(current.trim())

  return cells
}

function parseCsv(textContent: string): Row[] {
  const lines = textContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map(
    (header) =>
      header
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_"),
  )

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)

    return Object.fromEntries(
      headers.map((header, index) => [
        header,
        values[index] || "",
      ]),
    )
  })
}

function csvCell(value: unknown): string {
  return `"${text(value).replace(
    /"/g,
    '""',
  )}"`
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

  const payload = await response
    .json()
    .catch(() => ({}))

  if (
    !response.ok ||
    asRecord(payload).ok === false
  ) {
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
      className={`rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_38px_rgba(15,23,42,0.06)] ${className}`}
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
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-700">
        {label}
        {required ? " *" : ""}
      </span>

      {children}

      {helper ? (
        <span className="mt-1 block text-[11px] font-semibold leading-5 text-slate-500">
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
  tone?:
    | "blue"
    | "green"
    | "amber"
    | "red"
    | "violet"
}) {
  const safe = Math.max(
    0,
    Math.min(100, value),
  )

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
        style={{
          width: `${safe}%`,
        }}
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
    <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 pb-10 pt-[92px] backdrop-blur-[3px]">
      <div
        className={`flex max-h-[calc(100vh-112px)] w-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-[#f5f7fb] shadow-[0_32px_100px_rgba(15,23,42,0.35)] ${width}`}
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
  active,
  onClick,
}: {
  label: string
  value: string | number
  helper: string
  icon: LucideIcon
  tone:
    | "blue"
    | "green"
    | "amber"
    | "red"
    | "violet"
    | "cyan"
  active?: boolean
  onClick: () => void
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green:
      "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    violet:
      "bg-violet-50 text-violet-700",
    cyan: "bg-cyan-50 text-cyan-700",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[22px] border bg-white p-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-blue-300 ${
        active
          ? "border-blue-500 ring-4 ring-blue-100"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-[11px] font-bold text-slate-500">
            {helper}
          </p>
        </div>

        <span
          className={`rounded-2xl p-3 ${tones[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </button>
  )
}

export default function AmbassadorOnboardingRoute() {
  const [candidates, setCandidates] =
    useState<Row[]>([])

  const [ambassadors, setAmbassadors] =
    useState<Row[]>([])

  const [onboardingRows, setOnboardingRows] =
    useState<Row[]>([])

  const [territories, setTerritories] =
    useState<Row[]>([])

  const [trainingRows, setTrainingRows] =
    useState<Row[]>([])

  const [auditRows, setAuditRows] =
    useState<Row[]>([])

  const [loading, setLoading] =
    useState(true)

  const [busy, setBusy] =
    useState(false)

  const [notice, setNotice] =
    useState("")

  const [error, setError] =
    useState("")

  const [query, setQuery] =
    useState("")

  const [stageFilter, setStageFilter] =
    useState<OnboardingStage | "all">(
      "all",
    )

  const [riskFilter, setRiskFilter] =
    useState<RiskFilter>("all")

  const [cityFilter, setCityFilter] =
    useState("all")

  const [managerFilter, setManagerFilter] =
    useState("all")

  const [selectedKey, setSelectedKey] =
    useState("")

  const [selectedKeys, setSelectedKeys] =
    useState<Set<string>>(new Set())

  const [studioTab, setStudioTab] =
    useState<StudioTab>("dossier")

  const [modal, setModal] =
    useState<ModalKind>(null)

  const [draft, setDraft] =
    useState<ActivationState>(
      createDefaultActivation(),
    )

  const [startForm, setStartForm] =
    useState({
      candidateId: "",
      manager: "Sara Bakoki",
      owner: "Sara Bakoki",
      dueDate: "",
      targetActivationDate: "",
      priority: "normal",
      template: "standard",
    })

  const [importText, setImportText] =
    useState("")

  const [bulkForm, setBulkForm] =
    useState({
      action: "assign_manager",
      value: "Sara Bakoki",
      date: "",
      reason: "",
    })

  const [trainingForm, setTrainingForm] =
    useState({
      moduleKey: "brand",
      trainer: "",
      dueDate: "",
      mode: "Présentiel",
      location: "",
      notes: "",
    })

  const [taskForm, setTaskForm] =
    useState({
      title: "",
      owner: "Sara Bakoki",
      priority: "normal",
      dueDate: "",
      status: "open",
      proof: "",
    })

  const [documentForm, setDocumentForm] =
    useState({
      key: "identity",
      status: "requested",
      reviewer: "",
      note: "",
      expiresAt: "",
    })

  const [communicationForm, setCommunicationForm] =
    useState({
      channel: "WhatsApp",
      purpose: "Document manquant",
      recipient: "",
      message: "",
    })

  const [approvalForm, setApprovalForm] =
    useState({
      role: "manager",
      status: "approved",
      approver: "",
      note: "",
      evidence: "",
    })

  const inputClass =
    "h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

  const textareaClass =
    "min-h-[104px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

  const loadData = useCallback(
    async () => {
      setLoading(true)
      setError("")

      try {
        const results =
          await Promise.allSettled([
            apiRequest(
              "/api/market-os/ambassadors",
            ),
            apiRequest(
              "/api/market-os/ambassadors/recruitment",
            ),
            apiRequest(
              "/api/market-os/ambassadors/ambassadors",
            ),
            apiRequest(
              "/api/market-os/ambassadors/onboarding",
            ),
            apiRequest(
              "/api/market-os/ambassadors/territories",
            ),
            apiRequest(
              "/api/market-os/ambassadors/training",
            ),
            apiRequest(
              "/api/market-os/ambassadors/audit",
            ),
          ])

        const payloads = results.map(
          (result) =>
            result.status === "fulfilled"
              ? result.value
              : {},
        )

        const snapshot = payloads[0]

        const recruitmentRows =
          extractRows(payloads[1], [
            "recruitment",
            "candidates",
          ])

        const realAmbassadors =
          extractRows(payloads[2], [
            "ambassadors",
          ])

        const realOnboarding =
          extractRows(payloads[3], [
            "onboarding",
            "records",
          ])

        const realTerritories =
          extractRows(payloads[4], [
            "territories",
          ])

        const realTraining =
          extractRows(payloads[5], [
            "training",
            "certifications",
          ])

        const realAudit = extractRows(
          payloads[6],
          ["audit", "events", "records"],
        )

        setCandidates(
          recruitmentRows.length
            ? recruitmentRows
            : extractRows(snapshot, [
                "recruitment",
                "candidates",
              ]),
        )

        setAmbassadors(
          realAmbassadors.length
            ? realAmbassadors
            : extractRows(snapshot, [
                "ambassadors",
              ]),
        )

        setOnboardingRows(
          realOnboarding.length
            ? realOnboarding
            : extractRows(snapshot, [
                "onboarding",
              ]),
        )

        setTerritories(
          realTerritories.length
            ? realTerritories
            : extractRows(snapshot, [
                "territories",
              ]),
        )

        setTrainingRows(
          realTraining.length
            ? realTraining
            : extractRows(snapshot, [
                "training",
                "certifications",
              ]),
        )

        setAuditRows(realAudit)

        const failures = results.filter(
          (result) =>
            result.status === "rejected",
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
            : "Impossible de charger le centre d’activation.",
        )
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void loadData()
  }, [loadData])

  const dossiers =
    useMemo<Dossier[]>(() => {
      const candidateById = new Map(
        candidates.map((row) => [
          idOf(row),
          row,
        ]),
      )

      const candidateByContact =
        new Map(
          candidates.map((row) => [
            contactKey(row),
            row,
          ]),
        )

      const ambassadorById = new Map(
        ambassadors.map((row) => [
          idOf(row),
          row,
        ]),
      )

      const onboardingByCandidate =
        new Map<string, Row>()

      const onboardingByAmbassador =
        new Map<string, Row>()

      onboardingRows.forEach((row) => {
        const rowMetadata = metadataOf(row)

        const candidateId = text(
          row.candidate_id ||
            rowMetadata.candidate_id,
        )

        const ambassadorId = text(
          row.ambassador_id ||
            rowMetadata.ambassador_id,
        )

        if (candidateId) {
          onboardingByCandidate.set(
            candidateId,
            row,
          )
        }

        if (ambassadorId) {
          onboardingByAmbassador.set(
            ambassadorId,
            row,
          )
        }
      })

      const ambassadorByCandidate =
        new Map<string, Row>()

      const ambassadorByContact =
        new Map<string, Row>()

      ambassadors.forEach((row) => {
        const rowMetadata = metadataOf(row)

        const candidateId = text(
          row.candidate_id ||
            rowMetadata.candidate_id,
        )

        if (candidateId) {
          ambassadorByCandidate.set(
            candidateId,
            row,
          )
        }

        ambassadorByContact.set(
          contactKey(row),
          row,
        )
      })

      const output = new Map<
        string,
        Dossier
      >()

      const buildDossier = (
        candidate: Row,
        ambassador: Row,
        onboarding: Row,
      ): Dossier => {
        const candidateId = idOf(candidate)
        const ambassadorId = idOf(ambassador)
        const onboardingId = idOf(onboarding)

        const combinedMetadata = {
          ...metadataOf(candidate),
          ...metadataOf(ambassador),
          ...metadataOf(onboarding),
        }

        const activation =
          parseActivation(
            combinedMetadata,
          )

        if (!activation.manager) {
          activation.manager = text(
            onboarding.assigned_owner ||
              ambassador.manager_name ||
              combinedMetadata.manager_name,
          )
        }

        if (!activation.owner) {
          activation.owner = text(
            onboarding.assigned_owner ||
              combinedMetadata.owner,
          )
        }

        if (!activation.dueDate) {
          activation.dueDate =
            dateInput(
              onboarding.due_date ||
                combinedMetadata.due_date,
            )
        }

        if (!activation.territoryId) {
          activation.territoryId = text(
            ambassador.territory_id ||
              onboarding.territory_id ||
              combinedMetadata.territory_id,
          )
        }

        if (!activation.territoryName) {
          activation.territoryName =
            text(
              ambassador.territory_name ||
                onboarding.territory_name ||
                combinedMetadata.territory_name,
            )
        }

        const rawStage =
          onboarding.stage ||
          onboarding.status ||
          ambassador.onboarding_stage ||
          ambassador.lifecycle_stage ||
          ambassador.status ||
          candidate.stage ||
          candidate.status

        const key = onboardingId
          ? `onboarding-${onboardingId}`
          : ambassadorId
            ? `ambassador-${ambassadorId}`
            : `candidate-${candidateId}`

        return {
          key,
          candidateId,
          ambassadorId,
          onboardingId,

          name: displayName(
            ambassadorId
              ? ambassador
              : candidate,
          ),

          phone: text(
            ambassador.phone ||
              ambassador.telephone ||
              candidate.phone ||
              candidate.telephone,
          ),

          email: text(
            ambassador.email ||
              candidate.email,
          ),

          city: text(
            ambassador.city ||
              ambassador.main_city ||
              candidate.city ||
              candidate.main_city,
          ),

          region: text(
            ambassador.region ||
              candidate.region,
          ),

          zone: text(
            ambassador.district ||
              ambassador.zone ||
              candidate.district ||
              candidate.zone,
          ),

          source: text(
            candidate.source ||
              combinedMetadata.source,
          ),

          reference:
            text(
              candidate.candidate_reference ||
                candidate.reference ||
                candidate.code,
            ) || candidateId,

          stage: normalizeStage(
            rawStage,
            Boolean(onboardingId),
          ),

          createdAt: text(
            onboarding.created_at ||
              ambassador.created_at ||
              candidate.created_at,
          ),

          updatedAt: text(
            onboarding.updated_at ||
              ambassador.updated_at ||
              candidate.updated_at,
          ),

          candidate,
          ambassador,
          onboarding,
          metadata: combinedMetadata,
          activation,
        }
      }

      candidates.forEach((candidate) => {
        const candidateId = idOf(candidate)

        const ambassador =
          ambassadorByCandidate.get(
            candidateId,
          ) ||
          ambassadorByContact.get(
            contactKey(candidate),
          ) ||
          {}

        const ambassadorId =
          idOf(ambassador)

        const onboarding =
          onboardingByCandidate.get(
            candidateId,
          ) ||
          onboardingByAmbassador.get(
            ambassadorId,
          ) ||
          {}

        const dossier = buildDossier(
          candidate,
          ambassador,
          onboarding,
        )

        output.set(dossier.key, dossier)
      })

      onboardingRows.forEach(
        (onboarding) => {
          const onboardingMetadata =
            metadataOf(onboarding)

          const ambassadorId = text(
            onboarding.ambassador_id ||
              onboardingMetadata.ambassador_id,
          )

          const ambassador =
            ambassadorById.get(
              ambassadorId,
            ) || {}

          const ambassadorMetadata =
            metadataOf(ambassador)

          const candidateId = text(
            onboarding.candidate_id ||
              onboardingMetadata.candidate_id ||
              ambassadorMetadata.candidate_id,
          )

          const candidate =
            candidateById.get(candidateId) ||
            candidateByContact.get(
              contactKey(ambassador),
            ) ||
            {}

          const dossier = buildDossier(
            candidate,
            ambassador,
            onboarding,
          )

          output.set(dossier.key, dossier)
        },
      )

      ambassadors.forEach((ambassador) => {
        const ambassadorId = idOf(
          ambassador,
        )

        const onboarding =
          onboardingByAmbassador.get(
            ambassadorId,
          ) || {}

        const ambassadorMetadata =
          metadataOf(ambassador)

        const candidateId = text(
          ambassador.candidate_id ||
            ambassadorMetadata.candidate_id,
        )

        const candidate =
          candidateById.get(candidateId) ||
          candidateByContact.get(
            contactKey(ambassador),
          ) ||
          {}

        const dossier = buildDossier(
          candidate,
          ambassador,
          onboarding,
        )

        if (!output.has(dossier.key)) {
          output.set(
            dossier.key,
            dossier,
          )
        }
      })

      return Array.from(output.values()).sort(
        (first, second) => {
          const firstDate = new Date(
            first.updatedAt ||
              first.createdAt ||
              0,
          ).getTime()

          const secondDate = new Date(
            second.updatedAt ||
              second.createdAt ||
              0,
          ).getTime()

          return secondDate - firstDate
        },
      )
    }, [
      candidates,
      ambassadors,
      onboardingRows,
    ])

  useEffect(() => {
    if (!dossiers.length) {
      setSelectedKey("")
      return
    }

    if (
      !selectedKey ||
      !dossiers.some(
        (dossier) =>
          dossier.key === selectedKey,
      )
    ) {
      setSelectedKey(dossiers[0].key)
    }
  }, [dossiers, selectedKey])

  const selectedDossier =
    useMemo(
      () =>
        dossiers.find(
          (dossier) =>
            dossier.key === selectedKey,
        ) || null,
      [dossiers, selectedKey],
    )

  useEffect(() => {
    if (!selectedDossier) {
      setDraft(
        createDefaultActivation(),
      )
      return
    }

    setDraft(
      cloneActivation(
        selectedDossier.activation,
      ),
    )

    setCommunicationForm(
      (current) => ({
        ...current,
        recipient:
          selectedDossier.phone ||
          selectedDossier.email,
      }),
    )
  }, [selectedDossier])

  const readinessByKey = useMemo(
    () =>
      new Map(
        dossiers.map((dossier) => [
          dossier.key,
          computeReadiness(
            dossier.activation,
          ),
        ]),
      ),
    [dossiers],
  )

  const selectedReadiness =
    useMemo(
      () => computeReadiness(draft),
      [draft],
    )

  const riskItems = useMemo<
    RiskItem[]
  >(() => {
    const risks: RiskItem[] = []

    dossiers.forEach((dossier) => {
      const readiness =
        readinessByKey.get(
          dossier.key,
        ) ||
        computeReadiness(
          dossier.activation,
        )

      if (
        dossier.stage !== "activated" &&
        readiness.blockers.length
      ) {
        risks.push({
          id: uid("risk-blocked"),
          dossierKey: dossier.key,
          candidateName: dossier.name,
          category: "blocked",
          severity:
            readiness.score < 40
              ? "critical"
              : readiness.score < 70
                ? "high"
                : "medium",
          title: `${readiness.blockers.length} condition(s) bloquante(s)`,
          detail:
            readiness.blockers
              .slice(0, 3)
              .join(" · "),
        })
      }

      if (
        dossier.activation.dueDate &&
        isPast(
          dossier.activation.dueDate,
        ) &&
        dossier.stage !== "activated"
      ) {
        risks.push({
          id: uid("risk-overdue"),
          dossierKey: dossier.key,
          candidateName: dossier.name,
          category: "overdue",
          severity: "high",
          title:
            "Échéance d’activation dépassée",
          detail: `Échéance : ${dossier.activation.dueDate}`,
        })
      }

      const missingDocs =
        dossier.activation.documents.filter(
          (document) =>
            document.required &&
            document.status !==
              "validated",
        )

      if (missingDocs.length) {
        risks.push({
          id: uid("risk-docs"),
          dossierKey: dossier.key,
          candidateName: dossier.name,
          category: "documents",
          severity:
            missingDocs.some(
              (document) =>
                document.status ===
                  "rejected" ||
                document.status ===
                  "expired",
            )
              ? "critical"
              : "high",
          title: `${missingDocs.length} document(s) non validé(s)`,
          detail: missingDocs
            .map(
              (document) =>
                document.label,
            )
            .slice(0, 3)
            .join(" · "),
        })
      }

      const incompleteTraining =
        dossier.activation.training.filter(
          (module) =>
            module.mandatory &&
            !(
              module.status ===
                "completed" &&
              module.score >= 70
            ),
        )

      if (incompleteTraining.length) {
        risks.push({
          id: uid("risk-training"),
          dossierKey: dossier.key,
          candidateName: dossier.name,
          category: "training",
          severity:
            incompleteTraining.some(
              (module) =>
                module.status === "failed",
            )
              ? "high"
              : "medium",
          title: `${incompleteTraining.length} module(s) de formation incomplet(s)`,
          detail: incompleteTraining
            .map((module) => module.label)
            .slice(0, 3)
            .join(" · "),
        })
      }

      if (
        !dossier.activation.territoryId
      ) {
        risks.push({
          id: uid("risk-territory"),
          dossierKey: dossier.key,
          candidateName: dossier.name,
          category: "territory",
          severity: "high",
          title:
            "Aucun territoire opérationnel",
          detail:
            "Affectation géographique requise avant activation.",
        })
      }

      const pendingApprovals =
        dossier.activation.approvals.filter(
          (approval) =>
            approval.status !==
              "approved",
        )

      if (pendingApprovals.length) {
        risks.push({
          id: uid("risk-approval"),
          dossierKey: dossier.key,
          candidateName: dossier.name,
          category: "approval",
          severity: "medium",
          title: `${pendingApprovals.length} validation(s) en attente`,
          detail: pendingApprovals
            .map(
              (approval) =>
                approval.label,
            )
            .slice(0, 3)
            .join(" · "),
        })
      }
    })

    return risks
  }, [dossiers, readinessByKey])

  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          dossiers
            .map(
              (dossier) =>
                dossier.city,
            )
            .filter(Boolean),
        ),
      ).sort(),
    [dossiers],
  )

  const managers = useMemo(
    () =>
      Array.from(
        new Set(
          dossiers
            .map(
              (dossier) =>
                dossier.activation.manager ||
                dossier.activation.owner,
            )
            .filter(Boolean),
        ),
      ).sort(),
    [dossiers],
  )

  const stageCounts =
    useMemo(() => {
      const counts: Record<
        OnboardingStage,
        number
      > = {
        prequalification: 0,
        onboarding: 0,
        compliance: 0,
        training: 0,
        assignment: 0,
        validation: 0,
        ready: 0,
        activated: 0,
        abandoned: 0,
      }

      dossiers.forEach((dossier) => {
        counts[dossier.stage] += 1
      })

      return counts
    }, [dossiers])

  const filteredDossiers =
    useMemo(() => {
      const needle = query
        .trim()
        .toLowerCase()

      return dossiers.filter(
        (dossier) => {
          if (
            stageFilter !== "all" &&
            dossier.stage !==
              stageFilter
          ) {
            return false
          }

          if (
            cityFilter !== "all" &&
            dossier.city !== cityFilter
          ) {
            return false
          }

          const manager =
            dossier.activation.manager ||
            dossier.activation.owner

          if (
            managerFilter !== "all" &&
            manager !== managerFilter
          ) {
            return false
          }

          const readiness =
            readinessByKey.get(
              dossier.key,
            ) ||
            computeReadiness(
              dossier.activation,
            )

          if (
            riskFilter === "blocked" &&
            !readiness.blockers.length
          ) {
            return false
          }

          if (
            riskFilter === "overdue" &&
            !(
              dossier.activation.dueDate &&
              isPast(
                dossier.activation.dueDate,
              )
            )
          ) {
            return false
          }

          if (
            riskFilter === "documents" &&
            readiness.sections.identity ===
              100
          ) {
            return false
          }

          if (
            riskFilter === "training" &&
            readiness.sections.training ===
              100
          ) {
            return false
          }

          if (
            riskFilter === "territory" &&
            readiness.sections.territory ===
              100
          ) {
            return false
          }

          if (
            riskFilter === "approval" &&
            readiness.sections.approvals ===
              100
          ) {
            return false
          }

          if (!needle) return true

          return [
            dossier.name,
            dossier.phone,
            dossier.email,
            dossier.city,
            dossier.region,
            dossier.zone,
            dossier.source,
            dossier.reference,
            manager,
            dossier.activation.territoryName,
            stageLabel(dossier.stage),
          ]
            .join(" ")
            .toLowerCase()
            .includes(needle)
        },
      )
    }, [
      dossiers,
      query,
      stageFilter,
      cityFilter,
      managerFilter,
      riskFilter,
      readinessByKey,
    ])

  const availableCandidates =
    useMemo(
      () =>
        dossiers.filter(
          (dossier) =>
            !dossier.onboardingId &&
            dossier.stage !==
              "activated" &&
            dossier.stage !==
              "abandoned",
        ),
      [dossiers],
    )

  const visibleSelected =
    useMemo(
      () =>
        filteredDossiers.filter(
          (dossier) =>
            selectedKeys.has(
              dossier.key,
            ),
        ),
      [
        filteredDossiers,
        selectedKeys,
      ],
    )

  const allVisibleSelected =
    filteredDossiers.length > 0 &&
    filteredDossiers.every(
      (dossier) =>
        selectedKeys.has(
          dossier.key,
        ),
    )

  const globalReadiness =
    useMemo(() => {
      if (!dossiers.length) return 0

      return Math.round(
        dossiers.reduce(
          (total, dossier) =>
            total +
            (readinessByKey.get(
              dossier.key,
            )?.score || 0),
          0,
        ) / dossiers.length,
      )
    }, [dossiers, readinessByKey])

  const topBottleneck =
    useMemo(() => {
      const totals = {
        identity: 0,
        training: 0,
        territory: 0,
        access: 0,
        approvals: 0,
      }

      dossiers.forEach((dossier) => {
        const sections =
          readinessByKey.get(
            dossier.key,
          )?.sections

        if (!sections) return

        for (const key of Object.keys(
          totals,
        ) as Array<
          keyof typeof totals
        >) {
          if (sections[key] < 100) {
            totals[key] += 1
          }
        }
      })

      return Object.entries(totals).sort(
        (first, second) =>
          second[1] - first[1],
      )[0] || ["identity", 0]
    }, [dossiers, readinessByKey])

  const addTimeline = (
    activation: ActivationState,
    action: string,
    detail: string,
    actor = "AngelCare OPS",
  ): ActivationState => ({
    ...activation,
    timeline: [
      {
        id: uid("timeline"),
        action,
        actor,
        detail,
        createdAt: nowIso(),
      },
      ...activation.timeline,
    ].slice(0, 150),
    lastSavedAt: nowIso(),
  })

  const writeAudit = async (
    action: string,
    entityId: string,
    detail: Row,
  ) => {
    try {
      await apiRequest(
        "/api/market-os/ambassadors/audit",
        {
          method: "POST",
          body: JSON.stringify({
            action,
            entity_type:
              "ambassador_onboarding",
            entity_id:
              entityId || null,
            actor:
              "AngelCare OPS",
            details: detail,
            payload: detail,
            metadata: detail,
          }),
        },
      )
    } catch {
      // Une panne d’audit secondaire ne transforme pas
      // une opération principale réussie en faux échec.
    }
  }

  const persistDossier = async (
    dossier: Dossier,
    nextActivation: ActivationState,
    nextStage: OnboardingStage,
    actionLabel: string,
  ): Promise<OperationResult> => {
    const partialFailures: string[] =
      []

    let ambassadorId =
      dossier.ambassadorId

    let onboardingId =
      dossier.onboardingId

    const synchronizedActivation =
      addTimeline(
        {
          ...nextActivation,
          commissionRate: 10,
          commissionLocked: true,
        },
        actionLabel,
        `Étape cible : ${stageLabel(
          nextStage,
        )}`,
      )

    const ambassadorPayload = {
      full_name: dossier.name,
      display_name: dossier.name,
      name: dossier.name,

      phone: dossier.phone || null,
      email: dossier.email || null,

      city: dossier.city || null,
      region: dossier.region || null,
      district: dossier.zone || null,

      status:
        nextStage === "activated"
          ? "active"
          : nextStage === "abandoned"
            ? "inactive"
            : "onboarding",

      lifecycle_stage:
        nextStage === "activated"
          ? "active"
          : nextStage,

      onboarding_stage:
        nextStage,

      manager_name:
        synchronizedActivation.manager ||
        synchronizedActivation.owner ||
        null,

      territory_id:
        synchronizedActivation.territoryId ||
        null,

      territory_name:
        synchronizedActivation.territoryName ||
        null,

      joined_at:
        nextStage === "activated"
          ? nowIso()
          : undefined,

      metadata: {
        ...metadataOf(
          dossier.ambassador,
        ),

        candidate_id:
          dossier.candidateId || null,

        commission_rate: 10,
        commission_locked: true,

        activation_os:
          synchronizedActivation,
      },

      payload: {
        candidate_id:
          dossier.candidateId || null,

        commission_rate: 10,
        commission_locked: true,

        activation_os:
          synchronizedActivation,
      },
    }

    if (!ambassadorId) {
      const created =
        await apiRequest(
          "/api/market-os/ambassadors/ambassadors",
          {
            method: "POST",
            body: JSON.stringify(
              ambassadorPayload,
            ),
          },
        )

      ambassadorId = idOf(
        extractCreatedRow(created),
      )

      if (!ambassadorId) {
        throw new Error(
          "Le profil ambassadeur créé n’a retourné aucun identifiant réel.",
        )
      }
    } else {
      await apiRequest(
        `/api/market-os/ambassadors/ambassadors/${ambassadorId}`,
        {
          method: "PATCH",
          body: JSON.stringify(
            ambassadorPayload,
          ),
        },
      )
    }

    const readiness =
      computeReadiness(
        synchronizedActivation,
      )

    const onboardingPayload = {
      ambassador_id: ambassadorId,
      candidate_id:
        dossier.candidateId || null,

      stage: nextStage,
      status: nextStage,

      completion_rate:
        readiness.score,

      checklist: readiness.blockers.map(
        (blocker) => ({
          key: blocker
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              "_",
            ),
          label: blocker,
          completed: false,
          required: true,
        }),
      ),

      assigned_owner:
        synchronizedActivation.owner ||
        synchronizedActivation.manager ||
        null,

      due_date:
        synchronizedActivation.dueDate ||
        null,

      completed_at:
        nextStage === "activated"
          ? nowIso()
          : null,

      notes:
        synchronizedActivation.notes ||
        null,

      metadata: {
        ...metadataOf(
          dossier.onboarding,
        ),

        candidate_id:
          dossier.candidateId || null,

        ambassador_id:
          ambassadorId,

        activation_os:
          synchronizedActivation,
      },

      payload: {
        candidate_id:
          dossier.candidateId || null,

        ambassador_id:
          ambassadorId,

        activation_os:
          synchronizedActivation,
      },
    }

    if (!onboardingId) {
      const created =
        await apiRequest(
          "/api/market-os/ambassadors/onboarding",
          {
            method: "POST",
            body: JSON.stringify(
              onboardingPayload,
            ),
          },
        )

      onboardingId = idOf(
        extractCreatedRow(created),
      )

      if (!onboardingId) {
        throw new Error(
          "Le dossier onboarding créé n’a retourné aucun identifiant réel.",
        )
      }
    } else {
      await apiRequest(
        `/api/market-os/ambassadors/onboarding/${onboardingId}`,
        {
          method: "PATCH",
          body: JSON.stringify(
            onboardingPayload,
          ),
        },
      )
    }

    if (dossier.candidateId) {
      try {
        await apiRequest(
          `/api/market-os/ambassadors/recruitment/${dossier.candidateId}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              stage: nextStage,
              status:
                nextStage ===
                "activated"
                  ? "activated"
                  : nextStage,

              next_step:
                nextStage ===
                "activated"
                  ? "Suivi ambassadeur actif"
                  : nextStage ===
                      "validation"
                    ? "Décision finale d’activation"
                    : "Continuer le parcours d’activation",

              metadata: {
                ...metadataOf(
                  dossier.candidate,
                ),

                ambassador_id:
                  ambassadorId,

                onboarding_id:
                  onboardingId,

                onboarding_completion:
                  readiness.score,

                activation_os:
                  synchronizedActivation,
              },
            }),
          },
        )
      } catch (caught) {
        partialFailures.push(
          `Recruitment : ${
            caught instanceof Error
              ? caught.message
              : "échec inconnu"
          }`,
        )
      }
    }

    await writeAudit(
      actionLabel,
      onboardingId || ambassadorId,
      {
        candidate_id:
          dossier.candidateId || null,
        ambassador_id: ambassadorId,
        onboarding_id: onboardingId,
        stage: nextStage,
        readiness:
          readiness.score,
      },
    )

    return {
      success: true,
      message:
        "Dossier synchronisé.",
      partialFailures,
      ambassadorId,
      onboardingId,
    }
  }

  const executeCurrentSave =
    async (
      stage: OnboardingStage,
      actionLabel: string,
    ) => {
      if (!selectedDossier) return

      setBusy(true)
      setError("")
      setNotice("")

      try {
        const result =
          await persistDossier(
            selectedDossier,
            draft,
            stage,
            actionLabel,
          )

        await loadData()

        if (
          result.partialFailures.length
        ) {
          setError(
            `Opération principale réussie, mais synchronisation partielle : ${result.partialFailures.join(
              " · ",
            )}`,
          )
        } else {
          setNotice(result.message)
        }
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Opération échouée.",
        )
      } finally {
        setBusy(false)
      }
    }

  const startOnboarding = async () => {
    const dossier = dossiers.find(
      (item) =>
        item.candidateId ===
        startForm.candidateId,
    )

    if (!dossier) {
      setError(
        "Sélectionnez une candidature réelle.",
      )
      return
    }

    const next =
      cloneActivation(
        dossier.activation,
      )

    next.owner = startForm.owner
    next.manager =
      startForm.manager

    next.priority =
      startForm.priority as ActivationState["priority"]

    next.dueDate =
      startForm.dueDate

    next.targetActivationDate =
      startForm.targetActivationDate

    next.tasks = [
      {
        id: uid("task"),
        title:
          "Contrôler l’identité et les documents obligatoires",
        owner:
          startForm.manager ||
          startForm.owner,
        priority:
          startForm.priority as TaskControl["priority"],
        status: "open",
        dueDate:
          startForm.dueDate,
        proof: "",
        createdAt: nowIso(),
        completedAt: "",
      },
      {
        id: uid("task"),
        title:
          "Planifier le parcours de formation obligatoire",
        owner:
          startForm.manager ||
          startForm.owner,
        priority: "normal",
        status: "open",
        dueDate:
          startForm.dueDate,
        proof: "",
        createdAt: nowIso(),
        completedAt: "",
      },
      ...next.tasks,
    ]

    setBusy(true)
    setError("")

    try {
      const result =
        await persistDossier(
          dossier,
          next,
          "onboarding",
          "Démarrage onboarding",
        )

      setModal(null)
      await loadData()

      setNotice(
        result.partialFailures.length
          ? `Onboarding créé avec réserves : ${result.partialFailures.join(
              " · ",
            )}`
          : "Onboarding officiellement démarré.",
      )
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Création onboarding échouée.",
      )
    } finally {
      setBusy(false)
    }
  }

  const importCsvRows = async () => {
    const rows = parseCsv(importText)

    if (!rows.length) {
      setError(
        "Le fichier CSV ne contient aucune ligne exploitable.",
      )
      return
    }

    setBusy(true)
    setError("")

    const failures: string[] = []
    let imported = 0
    let skipped = 0

    try {
      for (const row of rows.slice(0, 500)) {
        const name = text(
          row.candidate_name ||
            row.full_name ||
            row.name,
        )

        const phone = text(
          row.phone ||
            row.telephone,
        )

        const email = text(row.email)

        if (!name || (!phone && !email)) {
          skipped += 1
          continue
        }

        const duplicate =
          candidates.find(
            (candidate) =>
              (email &&
                text(candidate.email)
                  .toLowerCase() ===
                  email.toLowerCase()) ||
              (phone &&
                text(
                  candidate.phone ||
                    candidate.telephone,
                ).replace(/\D/g, "") ===
                  phone.replace(/\D/g, "")),
          )

        if (duplicate) {
          skipped += 1
          continue
        }

        try {
          const createdCandidatePayload =
            await apiRequest(
              "/api/market-os/ambassadors/recruitment",
              {
                method: "POST",
                body: JSON.stringify({
                  candidate_name: name,
                  full_name: name,
                  phone: phone || null,
                  email: email || null,
                  city:
                    text(row.city) || null,
                  region:
                    text(row.region) || null,
                  zone:
                    text(
                      row.zone ||
                        row.district,
                    ) || null,
                  source:
                    text(row.source) ||
                    "Import onboarding",
                  stage: "validated",
                  status: "validated",
                  notes:
                    text(row.notes) ||
                    null,
                  metadata: {
                    import_source:
                      "page7_onboarding_csv",
                    imported_at:
                      nowIso(),
                  },
                }),
              },
            )

          const createdCandidate =
            extractCreatedRow(
              createdCandidatePayload,
            )

          const synthetic: Dossier = {
            key: `candidate-${idOf(
              createdCandidate,
            )}`,
            candidateId: idOf(
              createdCandidate,
            ),
            ambassadorId: "",
            onboardingId: "",
            name,
            phone,
            email,
            city: text(row.city),
            region:
              text(row.region),
            zone: text(
              row.zone ||
                row.district,
            ),
            source:
              text(row.source) ||
              "Import onboarding",
            reference:
              idOf(createdCandidate),
            stage:
              "prequalification",
            createdAt: nowIso(),
            updatedAt: nowIso(),
            candidate:
              createdCandidate,
            ambassador: {},
            onboarding: {},
            metadata:
              metadataOf(
                createdCandidate,
              ),
            activation:
              createDefaultActivation(),
          }

          const activation =
            createDefaultActivation()

          activation.owner =
            text(row.owner) ||
            "Sara Bakoki"

          activation.manager =
            text(row.manager) ||
            "Sara Bakoki"

          activation.dueDate =
            dateInput(row.due_date)

          activation.targetActivationDate =
            dateInput(
              row.target_activation_date,
            )

          activation.priority =
            ["normal", "high", "critical"].includes(
              text(row.priority),
            )
              ? (text(
                  row.priority,
                ) as ActivationState["priority"])
              : "normal"

          await persistDossier(
            synthetic,
            activation,
            "onboarding",
            "Import onboarding CSV",
          )

          imported += 1
        } catch (caught) {
          failures.push(
            `${name} : ${
              caught instanceof Error
                ? caught.message
                : "échec"
            }`,
          )
        }
      }

      setModal(null)
      setImportText("")
      await loadData()

      const report = [
        `${imported} dossier(s) importé(s)`,
        `${skipped} ligne(s) ignorée(s)`,
      ]

      if (failures.length) {
        report.push(
          `${failures.length} échec(s)`,
        )
      }

      setNotice(report.join(" · "))

      if (failures.length) {
        setError(
          failures.slice(0, 10).join(
            " · ",
          ),
        )
      }
    } finally {
      setBusy(false)
    }
  }

  const targetDossiers = () => {
    if (visibleSelected.length) {
      return visibleSelected
    }

    return selectedDossier
      ? [selectedDossier]
      : []
  }

  const executeBulkAction =
    async () => {
      const targets =
        targetDossiers()

      if (!targets.length) {
        setError(
          "Sélectionnez au moins un dossier.",
        )
        return
      }

      setBusy(true)
      setError("")

      const failures: string[] = []
      let completed = 0

      try {
        for (const dossier of targets) {
          try {
            const next =
              cloneActivation(
                dossier.activation,
              )

            let nextStage =
              dossier.stage

            if (
              bulkForm.action ===
              "assign_manager"
            ) {
              next.manager =
                bulkForm.value
              next.owner =
                next.owner ||
                bulkForm.value
            }

            if (
              bulkForm.action ===
              "set_due_date"
            ) {
              next.dueDate =
                bulkForm.date
            }

            if (
              bulkForm.action ===
              "set_priority"
            ) {
              next.priority =
                bulkForm.value as ActivationState["priority"]
            }

            if (
              bulkForm.action ===
              "move_validation"
            ) {
              nextStage =
                "validation"
            }

            if (
              bulkForm.action ===
              "request_documents"
            ) {
              next.documents =
                next.documents.map(
                  (document) =>
                    document.required &&
                    document.status !==
                      "validated"
                      ? {
                          ...document,
                          status:
                            "requested",
                          note:
                            bulkForm.reason ||
                            document.note,
                          updatedAt:
                            nowIso(),
                        }
                      : document,
                )

              next.communications = [
                {
                  id: uid("communication"),
                  channel:
                    "WhatsApp",
                  purpose:
                    "Demande de documents",
                  recipient:
                    dossier.phone ||
                    dossier.email,
                  message:
                    bulkForm.reason ||
                    "Merci de transmettre les documents obligatoires manquants pour finaliser votre activation AngelCare.",
                  status:
                    "prepared",
                  createdAt:
                    nowIso(),
                },
                ...next.communications,
              ]
            }

            if (
              bulkForm.action ===
              "abandon"
            ) {
              if (!bulkForm.reason) {
                throw new Error(
                  "Motif obligatoire.",
                )
              }

              nextStage =
                "abandoned"

              next.notes = [
                next.notes,
                `Abandon : ${bulkForm.reason}`,
              ]
                .filter(Boolean)
                .join("\n")
            }

            await persistDossier(
              dossier,
              next,
              nextStage,
              `Action groupée : ${bulkForm.action}`,
            )

            completed += 1
          } catch (caught) {
            failures.push(
              `${dossier.name} : ${
                caught instanceof Error
                  ? caught.message
                  : "échec"
              }`,
            )
          }
        }

        setModal(null)
        setSelectedKeys(new Set())
        await loadData()

        setNotice(
          `${completed} dossier(s) mis à jour.`,
        )

        if (failures.length) {
          setError(
            failures.join(" · "),
          )
        }
      } finally {
        setBusy(false)
      }
    }

  const scheduleTraining =
    async () => {
      const targets =
        targetDossiers()

      if (!targets.length) {
        setError(
          "Sélectionnez au moins un dossier.",
        )
        return
      }

      const blueprint =
        TRAINING_BLUEPRINT.find(
          (module) =>
            module.key ===
            trainingForm.moduleKey,
        )

      if (!blueprint) return

      setBusy(true)
      setError("")

      const failures: string[] = []
      let completed = 0

      try {
        for (const dossier of targets) {
          try {
            const next =
              cloneActivation(
                dossier.activation,
              )

            next.training =
              next.training.map(
                (module) =>
                  module.key ===
                  blueprint.key
                    ? {
                        ...module,
                        status:
                          "scheduled",
                        trainer:
                          trainingForm.trainer,
                        dueDate:
                          trainingForm.dueDate,
                        evidence: [
                          trainingForm.mode,
                          trainingForm.location,
                          trainingForm.notes,
                        ]
                          .filter(Boolean)
                          .join(" · "),
                      }
                    : module,
              )

            const result =
              await persistDossier(
                dossier,
                next,
                "training",
                `Formation planifiée : ${blueprint.label}`,
              )

            await apiRequest(
              "/api/market-os/ambassadors/training",
              {
                method: "POST",
                body: JSON.stringify({
                  ambassador_id:
                    result.ambassadorId ||
                    dossier.ambassadorId ||
                    null,

                  candidate_id:
                    dossier.candidateId ||
                    null,

                  module_code:
                    blueprint.key,

                  title:
                    blueprint.label,

                  status:
                    "scheduled",

                  trainer:
                    trainingForm.trainer ||
                    null,

                  due_date:
                    trainingForm.dueDate ||
                    null,

                  mode:
                    trainingForm.mode,

                  location:
                    trainingForm.location ||
                    null,

                  notes:
                    trainingForm.notes ||
                    null,

                  metadata: {
                    source:
                      "page7_onboarding",
                    onboarding_id:
                      result.onboardingId ||
                      dossier.onboardingId ||
                      null,
                  },
                }),
              },
            )

            completed += 1
          } catch (caught) {
            failures.push(
              `${dossier.name} : ${
                caught instanceof Error
                  ? caught.message
                  : "échec"
              }`,
            )
          }
        }

        setModal(null)
        await loadData()

        setNotice(
          `${completed} affectation(s) de formation créée(s).`,
        )

        if (failures.length) {
          setError(
            failures.join(" · "),
          )
        }
      } finally {
        setBusy(false)
      }
    }

  const saveTask = async () => {
    if (!selectedDossier) return

    if (!taskForm.title.trim()) {
      setError(
        "Le titre de la tâche est obligatoire.",
      )
      return
    }

    const next = cloneActivation(draft)

    next.tasks = [
      {
        id: uid("task"),
        title:
          taskForm.title.trim(),
        owner:
          taskForm.owner.trim(),
        priority:
          taskForm.priority as TaskControl["priority"],
        status:
          taskForm.status as TaskControl["status"],
        dueDate:
          taskForm.dueDate,
        proof:
          taskForm.proof,
        createdAt: nowIso(),
        completedAt: "",
      },
      ...next.tasks,
    ]

    setDraft(next)
    setModal(null)

    await executeSaveWithState(
      next,
      selectedDossier.stage,
      "Tâche onboarding créée",
    )
  }

  const saveDocumentControl =
    async () => {
      if (!selectedDossier) return

      const next = cloneActivation(draft)

      next.documents =
        next.documents.map(
          (document) =>
            document.key ===
            documentForm.key
              ? {
                  ...document,
                  status:
                    documentForm.status as DocumentControl["status"],
                  reviewer:
                    documentForm.reviewer,
                  note:
                    documentForm.note,
                  expiresAt:
                    documentForm.expiresAt,
                  updatedAt: nowIso(),
                }
              : document,
        )

      if (
        documentForm.key ===
        "commission" &&
        documentForm.status ===
          "validated"
      ) {
        next.commissionAccepted = true
      }

      if (
        documentForm.key ===
        "confidentiality" &&
        documentForm.status ===
          "validated"
      ) {
        next.confidentialityAccepted =
          true
      }

      if (
        documentForm.key ===
        "payment" &&
        documentForm.status ===
          "validated"
      ) {
        next.paymentVerified = true
      }

      setDraft(next)
      setModal(null)

      await executeSaveWithState(
        next,
        "compliance",
        "Contrôle documentaire mis à jour",
      )
    }

  const saveCommunication =
    async () => {
      if (!selectedDossier) return

      if (
        !communicationForm.message.trim()
      ) {
        setError(
          "Le contenu préparé est obligatoire.",
        )
        return
      }

      const next = cloneActivation(draft)

      next.communications = [
        {
          id: uid("communication"),
          channel:
            communicationForm.channel as CommunicationControl["channel"],
          purpose:
            communicationForm.purpose,
          recipient:
            communicationForm.recipient,
          message:
            communicationForm.message,
          status: "prepared",
          createdAt: nowIso(),
        },
        ...next.communications,
      ]

      setDraft(next)
      setModal(null)

      await executeSaveWithState(
        next,
        selectedDossier.stage,
        "Communication préparée",
      )

      setNotice(
        "Communication enregistrée comme préparée. Aucun faux envoi n’a été déclaré.",
      )
    }

  const saveApproval = async () => {
    if (!selectedDossier) return

    if (
      !approvalForm.approver.trim()
    ) {
      setError(
        "L’approbateur est obligatoire.",
      )
      return
    }

    if (
      ["rejected", "correction"].includes(
        approvalForm.status,
      ) &&
      !approvalForm.note.trim()
    ) {
      setError(
        "Une note est obligatoire pour un rejet ou retour en correction.",
      )
      return
    }

    const next = cloneActivation(draft)

    next.approvals =
      next.approvals.map(
        (approval) =>
          approval.role ===
          approvalForm.role
            ? {
                ...approval,
                status:
                  approvalForm.status as ApprovalControl["status"],
                approver:
                  approvalForm.approver,
                note:
                  approvalForm.note,
                evidence:
                  approvalForm.evidence,
                decidedAt: nowIso(),
              }
            : approval,
      )

    setDraft(next)
    setModal(null)

    await executeSaveWithState(
      next,
      "validation",
      "Décision d’approbation enregistrée",
    )
  }

  const executeSaveWithState =
    async (
      next: ActivationState,
      stage: OnboardingStage,
      label: string,
    ) => {
      if (!selectedDossier) return

      setBusy(true)
      setError("")

      try {
        const result =
          await persistDossier(
            selectedDossier,
            next,
            stage,
            label,
          )

        await loadData()

        setNotice(
          result.partialFailures.length
            ? `Enregistré avec réserves : ${result.partialFailures.join(
                " · ",
              )}`
            : "Modification enregistrée et synchronisée.",
        )
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Enregistrement échoué.",
        )
      } finally {
        setBusy(false)
      }
    }

  const assignTerritory =
    async () => {
      if (!selectedDossier) return

      if (!draft.territoryId) {
        setError(
          "Sélectionnez un territoire réel.",
        )
        return
      }

      setBusy(true)
      setError("")

      try {
        const result =
          await persistDossier(
            selectedDossier,
            draft,
            "assignment",
            "Configuration territoriale enregistrée",
          )

        await apiRequest(
          "/api/market-os/ambassadors/territories/assign",
          {
            method: "POST",
            body: JSON.stringify({
              ambassador_id:
                result.ambassadorId ||
                selectedDossier.ambassadorId,

              territory_id:
                draft.territoryId,

              assignment_type:
                "primary",

              coverage_mode:
                draft.coverageMode,

              assigned_by:
                draft.manager ||
                draft.owner ||
                "AngelCare OPS",

              source:
                "page7_onboarding",
            }),
          },
        )

        await loadData()

        setNotice(
          "Territoire affecté et dossier synchronisé.",
        )
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Affectation territoriale échouée.",
        )
      } finally {
        setBusy(false)
      }
    }

  const activateAmbassador =
    async () => {
      if (!selectedDossier) return

      if (
        selectedReadiness.blockers.length
      ) {
        setError(
          `Activation bloquée : ${selectedReadiness.blockers.join(
            " · ",
          )}`,
        )
        return
      }

      setBusy(true)
      setError("")

      try {
        const result =
          await persistDossier(
            selectedDossier,
            draft,
            "activated",
            "Ambassadeur activé",
          )

        const partial = [
          ...result.partialFailures,
        ]

        if (
          draft.firstMissionEnabled
        ) {
          try {
            await apiRequest(
              "/api/market-os/ambassadors/missions",
              {
                method: "POST",
                body: JSON.stringify({
                  title:
                    draft.firstMissionTitle,

                  mission_type:
                    "activation",

                  ambassador_id:
                    result.ambassadorId,

                  assigned_ambassador_id:
                    result.ambassadorId,

                  primary_ambassador_id:
                    result.ambassadorId,

                  assigned_ambassador_ids:
                    [
                      result.ambassadorId,
                    ],

                  city:
                    selectedDossier.city ||
                    null,

                  territory_id:
                    draft.territoryId ||
                    null,

                  territory_name:
                    draft.territoryName ||
                    null,

                  status: "assigned",
                  priority: "normal",

                  due_date:
                    draft.firstMissionDueDate ||
                    null,

                  instructions:
                    "Première mission encadrée issue du parcours d’activation.",

                  metadata: {
                    source:
                      "page7_onboarding",

                    onboarding_id:
                      result.onboardingId ||
                      null,
                  },
                }),
              },
            )
          } catch (caught) {
            partial.push(
              `Première mission : ${
                caught instanceof Error
                  ? caught.message
                  : "échec"
              }`,
            )
          }
        }

        await loadData()

        if (partial.length) {
          setError(
            `Profil activé, mais certaines étapes restent à reprendre : ${partial.join(
              " · ",
            )}`,
          )
        } else {
          setNotice(
            "Ambassadeur activé avec succès. Les accès non confirmés restent explicitement en préparation.",
          )
        }
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Activation échouée.",
        )
      } finally {
        setBusy(false)
      }
    }

  const exportCurrentView = () => {
    const headers = [
      "Candidat",
      "Référence",
      "Téléphone",
      "Email",
      "Ville",
      "Étape",
      "Readiness",
      "Manager",
      "Territoire",
      "Échéance",
      "Bloquants",
    ]

    const lines =
      filteredDossiers.map(
        (dossier) => {
          const readiness =
            readinessByKey.get(
              dossier.key,
            ) ||
            computeReadiness(
              dossier.activation,
            )

          return [
            dossier.name,
            dossier.reference,
            dossier.phone,
            dossier.email,
            dossier.city,
            stageLabel(dossier.stage),
            `${readiness.score}%`,
            dossier.activation
              .manager ||
              dossier.activation.owner,
            dossier.activation
              .territoryName,
            dossier.activation
              .dueDate,
            readiness.blockers.join(
              " | ",
            ),
          ]
        },
      )

    const csv = [
      headers.map(csvCell).join(","),
      ...lines.map((line) =>
        line.map(csvCell).join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    })

    const url =
      URL.createObjectURL(blob)

    const anchor =
      document.createElement("a")

    anchor.href = url
    anchor.download = `angelcare-activation-onboarding-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`

    anchor.click()

    URL.revokeObjectURL(url)
  }

  const toggleSelection = (
    key: string,
  ) => {
    setSelectedKeys((current) => {
      const next = new Set(current)

      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }

      return next
    })
  }

  const toggleAllVisible = () => {
    setSelectedKeys((current) => {
      const next = new Set(current)

      if (allVisibleSelected) {
        filteredDossiers.forEach(
          (dossier) =>
            next.delete(dossier.key),
        )
      } else {
        filteredDossiers.forEach(
          (dossier) =>
            next.add(dossier.key),
        )
      }

      return next
    })
  }

  const updateDraft = <
    K extends keyof ActivationState,
  >(
    key: K,
    value: ActivationState[K],
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
        ? current[key].filter(
            (item) => item !== value,
          )
        : [...current[key], value],
    }))
  }

  const resetFilters = () => {
    setQuery("")
    setStageFilter("all")
    setRiskFilter("all")
    setCityFilter("all")
    setManagerFilter("all")
  }

  const openRiskDossier = (
    dossierKey: string,
  ) => {
    setSelectedKey(dossierKey)
    setModal(null)
    setStudioTab("activation")
  }

  const selectedTrainingRows =
    useMemo(
      () =>
        trainingRows.filter(
          (row) =>
            text(row.ambassador_id) ===
              selectedDossier?.ambassadorId ||
            text(row.candidate_id) ===
              selectedDossier?.candidateId,
        ),
      [
        trainingRows,
        selectedDossier,
      ],
    )

  const selectedAuditRows =
    useMemo(
      () =>
        auditRows.filter((row) => {
          const entityId = text(
            row.entity_id ||
              row.onboarding_id ||
              row.ambassador_id,
          )

          return [
            selectedDossier?.onboardingId,
            selectedDossier?.ambassadorId,
            selectedDossier?.candidateId,
          ]
            .filter(Boolean)
            .includes(entityId)
        }),
      [
        auditRows,
        selectedDossier,
      ],
    )

  return (
    <div
      data-page7-enterprise="readiness-journey-command-v4"
      className="min-w-0 flex-1 bg-[#f4f7fb] p-4 text-slate-950 lg:p-6"
    >
      <header className="overflow-hidden border border-slate-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
        <div className="grid 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="border-l-4 border-[#cf2437] px-6 py-6 lg:px-7">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#164d7d]">
              <Sparkles className="h-4 w-4" />
              ANGELCARE READINESS JOURNEY · ACTIVATION CONTROL
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Parcours de préparation & activation
            </h1>

            <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
              Suivez chaque dossier depuis la préqualification jusqu’à l’activation, avec une lecture immédiate des preuves acquises, des contrôles manquants et des blocages réels.
            </p>

            <div className="mt-5 flex max-w-5xl flex-wrap items-center gap-2">
              <button type="button" onClick={() => setModal("start")} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0b4d85] px-4 text-sm font-black !text-white shadow-lg shadow-blue-200 hover:bg-[#083c69]">
                <Plus className="h-4 w-4 !text-white" /> Démarrer onboarding
              </button>
              <button type="button" onClick={() => setModal("import")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 hover:bg-slate-50">
                <Upload className="h-4 w-4" /> Importer dossiers
              </button>
              <button type="button" onClick={() => setModal("training")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 hover:bg-slate-50">
                <CalendarDays className="h-4 w-4" /> Session collective
              </button>
              <button type="button" onClick={() => setModal("bulk")} disabled={!selectedKeys.size && !selectedDossier} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
                <Layers3 className="h-4 w-4" /> Actions groupées
              </button>
              <button type="button" onClick={() => setModal("risks")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-black text-amber-900 hover:bg-amber-100">
                <AlertTriangle className="h-4 w-4" /> Centre de contrôles
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px]">{riskItems.length}</span>
              </button>
              <button type="button" onClick={exportCurrentView} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 hover:bg-slate-50">
                <Download className="h-4 w-4" /> Exporter
              </button>
              <button type="button" onClick={() => void loadData()} disabled={loading} aria-label="Actualiser" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-950 hover:bg-slate-50 disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <aside className="bg-[#082b4d] px-6 py-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] !text-[#9ec4e7]">Posture de préparation</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-black tabular-nums !text-white">{globalReadiness}%</p>
                <p className="mt-1 text-xs font-bold !text-[#d6e4f2]">moyenne réelle du portefeuille</p>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/10 !text-white">
                <Activity className="h-5 w-5 !text-white" />
              </span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-[#66b6ff]" style={{ width: `${globalReadiness}%` }} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] !text-[#9ec4e7]">Prêts à activer</p>
                <p className="mt-1 text-2xl font-black tabular-nums !text-white">{stageCounts.ready}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] !text-[#9ec4e7]">Blocages actifs</p>
                <p className="mt-1 text-2xl font-black tabular-nums !text-white">{riskItems.length}</p>
              </div>
            </div>
            <p className="mt-5 text-[11px] font-semibold leading-5 !text-[#d6e4f2]">
              Point de friction dominant : {String(topBottleneck[0]).replaceAll("_", " ")} · {topBottleneck[1]} dossier(s).
            </p>
          </aside>
        </div>

        {notice ? <div className="border-t border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-bold text-emerald-900">{notice}</div> : null}
        {error ? <div className="border-t border-rose-200 bg-rose-50 px-6 py-3 text-sm font-bold text-rose-900">{error}</div> : null}
      </header>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5 2xl:grid-cols-10">
        <KpiCard
          label="À intégrer"
          value={stageCounts.prequalification}
          helper="Candidats sans dossier"
          icon={Users}
          tone="violet"
          active={stageFilter === "prequalification"}
          onClick={() => {
            setStageFilter("prequalification")
            setRiskFilter("all")
          }}
        />

        <KpiCard
          label="En onboarding"
          value={
            stageCounts.onboarding +
            stageCounts.compliance +
            stageCounts.training +
            stageCounts.assignment
          }
          helper="Parcours actifs"
          icon={UserCheck}
          tone="blue"
          active={
            ["onboarding", "compliance", "training", "assignment"].includes(
              stageFilter,
            )
          }
          onClick={() => {
            setStageFilter("onboarding")
            setRiskFilter("all")
          }}
        />

        <KpiCard
          label="Conformité"
          value={
            dossiers.filter(
              (dossier) =>
                (readinessByKey.get(dossier.key)?.sections.identity || 0) <
                100,
            ).length
          }
          helper="Contrôles incomplets"
          icon={ShieldCheck}
          tone="amber"
          active={riskFilter === "documents"}
          onClick={() => {
            setStageFilter("all")
            setRiskFilter("documents")
          }}
        />

        <KpiCard
          label="Formation"
          value={
            dossiers.filter(
              (dossier) =>
                (readinessByKey.get(dossier.key)?.sections.training || 0) <
                100,
            ).length
          }
          helper="Parcours incomplets"
          icon={GraduationCap}
          tone="violet"
          active={riskFilter === "training"}
          onClick={() => {
            setStageFilter("all")
            setRiskFilter("training")
          }}
        />

        <KpiCard
          label="Validation"
          value={stageCounts.validation}
          helper="Décisions finales"
          icon={BadgeCheck}
          tone="cyan"
          active={stageFilter === "validation"}
          onClick={() => {
            setStageFilter("validation")
            setRiskFilter("all")
          }}
        />

        <KpiCard
          label="Prêts"
          value={
            dossiers.filter(
              (dossier) =>
                dossier.stage !== "activated" &&
                (readinessByKey.get(dossier.key)?.score || 0) === 100,
            ).length
          }
          helper="Activation autorisée"
          icon={Zap}
          tone="green"
          active={stageFilter === "ready"}
          onClick={() => {
            setStageFilter("ready")
            setRiskFilter("all")
          }}
        />

        <KpiCard
          label="Activés"
          value={stageCounts.activated}
          helper="Profils opérationnels"
          icon={CheckCircle2}
          tone="green"
          active={stageFilter === "activated"}
          onClick={() => {
            setStageFilter("activated")
            setRiskFilter("all")
          }}
        />

        <KpiCard
          label="Bloqués"
          value={
            dossiers.filter(
              (dossier) =>
                dossier.stage !== "activated" &&
                (readinessByKey.get(dossier.key)?.blockers.length || 0) > 0,
            ).length
          }
          helper="Action corrective requise"
          icon={AlertTriangle}
          tone="red"
          active={riskFilter === "blocked"}
          onClick={() => {
            setStageFilter("all")
            setRiskFilter("blocked")
          }}
        />

        <KpiCard
          label="En retard"
          value={
            dossiers.filter(
              (dossier) =>
                dossier.activation.dueDate &&
                isPast(dossier.activation.dueDate) &&
                dossier.stage !== "activated",
            ).length
          }
          helper="SLA dépassé"
          icon={Clock3}
          tone="red"
          active={riskFilter === "overdue"}
          onClick={() => {
            setStageFilter("all")
            setRiskFilter("overdue")
          }}
        />

        <KpiCard
          label="Readiness"
          value={`${globalReadiness}%`}
          helper="Moyenne du pipeline"
          icon={Activity}
          tone="blue"
          onClick={() => {
            resetFilters()
          }}
        />
      </section>

      <Card className="mt-4 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Pipeline d’activation contrôlé
            </h2>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Chaque étape filtre le registre et expose les dossiers nécessitant une décision.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-950 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Réinitialiser
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6 2xl:grid-cols-9">
          {(
            [
              "prequalification",
              "onboarding",
              "compliance",
              "training",
              "assignment",
              "validation",
              "ready",
              "activated",
              "abandoned",
            ] as OnboardingStage[]
          ).map((stage) => {
            const count = stageCounts[stage]

            const share = dossiers.length
              ? Math.round((count / dossiers.length) * 100)
              : 0

            return (
              <button
                key={stage}
                type="button"
                onClick={() => {
                  setStageFilter(
                    stageFilter === stage ? "all" : stage,
                  )
                  setRiskFilter("all")
                }}
                className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${stageTone(
                  stage,
                )} ${
                  stageFilter === stage
                    ? "ring-2 ring-blue-500 ring-offset-2"
                    : ""
                }`}
              >
                <p className="text-[11px] font-black">
                  {stageLabel(stage)}
                </p>

                <p className="mt-2 text-2xl font-black">
                  {count}
                </p>

                <p className="mt-1 text-[10px] font-black">
                  {share}% du pipeline
                </p>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="mt-4 grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_500px]">
        <main className="min-w-0 space-y-4">
          <Card>
            <div className="border-b border-slate-100 p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">
                      File opérationnelle d’activation
                    </h2>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Sélection, actions groupées, filtres, dossier individuel et décisions traçables.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedKeys.size ? (
                      <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-800">
                        {selectedKeys.size} sélectionné(s)
                      </span>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setModal("bulk")}
                      disabled={!selectedKeys.size}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      <Layers3 className="h-4 w-4" />
                      Action groupée
                    </button>

                    <button
                      type="button"
                      onClick={() => setModal("training")}
                      disabled={!selectedKeys.size}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      <GraduationCap className="h-4 w-4" />
                      Planifier formation
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                  <label className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 xl:col-span-2">
                    <Search className="h-4 w-4 text-slate-400" />

                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Candidat, téléphone, ville, manager, référence…"
                      className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                    />
                  </label>

                  <select
                    value={cityFilter}
                    onChange={(event) => setCityFilter(event.target.value)}
                    className={inputClass}
                  >
                    <option value="all">
                      Toutes les villes
                    </option>

                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>

                  <select
                    value={managerFilter}
                    onChange={(event) => setManagerFilter(event.target.value)}
                    className={inputClass}
                  >
                    <option value="all">
                      Tous les responsables
                    </option>

                    {managers.map((manager) => (
                      <option key={manager} value={manager}>
                        {manager}
                      </option>
                    ))}
                  </select>

                  <select
                    value={riskFilter}
                    onChange={(event) =>
                      setRiskFilter(event.target.value as RiskFilter)
                    }
                    className={inputClass}
                  >
                    <option value="all">
                      Tous les risques
                    </option>
                    <option value="blocked">
                      Dossiers bloqués
                    </option>
                    <option value="overdue">
                      Échéances dépassées
                    </option>
                    <option value="documents">
                      Documents incomplets
                    </option>
                    <option value="training">
                      Formation incomplète
                    </option>
                    <option value="territory">
                      Territoire incomplet
                    </option>
                    <option value="approval">
                      Validations manquantes
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="w-10 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </th>

                    {[
                      "Candidat",
                      "Ville",
                      "Étape",
                      "Readiness",
                      "Conformité",
                      "Formation",
                      "Territoire",
                      "Manager",
                      "Échéance",
                      "Prochaine action",
                      "Actions",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.14em] text-slate-600"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredDossiers.map((dossier) => {
                    const readiness =
                      readinessByKey.get(dossier.key) ||
                      computeReadiness(dossier.activation)

                    const openTasks = dossier.activation.tasks.filter(
                      (task) => task.status !== "completed",
                    )

                    const nextTask = openTasks
                      .slice()
                      .sort((first, second) =>
                        first.dueDate.localeCompare(second.dueDate),
                      )[0]

                    return (
                      <tr
                        key={dossier.key}
                        onClick={() => {
                          setSelectedKey(dossier.key)
                        }}
                        className={`cursor-pointer border-b border-slate-100 transition hover:bg-blue-50/60 ${
                          selectedKey === dossier.key
                            ? "bg-blue-50"
                            : "bg-white"
                        }`}
                      >
                        <td
                          className="px-4 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedKeys.has(dossier.key)}
                            onChange={() => toggleSelection(dossier.key)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-black text-slate-950">
                            {dossier.name}
                          </p>

                          <p className="mt-0.5 text-xs font-semibold text-slate-500">
                            {dossier.phone ||
                              dossier.email ||
                              "Contact à compléter"}
                          </p>

                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">
                            {dossier.reference || "Sans référence"}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-sm font-bold text-slate-700">
                          {dossier.city || "—"}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${stageTone(
                              dossier.stage,
                            )}`}
                          >
                            {stageLabel(dossier.stage)}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="w-28">
                            <div className="mb-1 flex items-center justify-between text-xs font-black text-slate-700">
                              <span>{readiness.score}%</span>
                              <span>
                                {readiness.complete}/{readiness.total}
                              </span>
                            </div>

                            <Progress
                              value={readiness.score}
                              tone={
                                readiness.score === 100
                                  ? "green"
                                  : readiness.score < 50
                                    ? "red"
                                    : "blue"
                              }
                            />
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-black ${
                              readiness.sections.identity === 100
                                ? "text-emerald-700"
                                : "text-amber-700"
                            }`}
                          >
                            {readiness.sections.identity}%
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-black ${
                              readiness.sections.training === 100
                                ? "text-emerald-700"
                                : "text-violet-700"
                            }`}
                          >
                            {readiness.sections.training}%
                          </span>
                        </td>

                        <td className="px-4 py-3 text-sm font-bold text-slate-700">
                          {dossier.activation.territoryName || "Non affecté"}
                        </td>

                        <td className="px-4 py-3 text-sm font-bold text-slate-700">
                          {dossier.activation.manager ||
                            dossier.activation.owner ||
                            "À affecter"}
                        </td>

                        <td className="px-4 py-3">
                          <p
                            className={`text-sm font-black ${
                              dossier.activation.dueDate &&
                              isPast(dossier.activation.dueDate)
                                ? "text-rose-700"
                                : "text-slate-700"
                            }`}
                          >
                            {dossier.activation.dueDate || "—"}
                          </p>
                        </td>

                        <td className="max-w-[220px] px-4 py-3">
                          <p className="truncate text-sm font-bold text-slate-700">
                            {nextTask?.title ||
                              (readiness.blockers[0] ??
                                (dossier.stage === "activated"
                                  ? "Suivi post-activation"
                                  : "Aucune action définie"))}
                          </p>

                          {readiness.blockers.length ? (
                            <p className="mt-1 text-[10px] font-black text-rose-700">
                              {readiness.blockers.length} blocage(s)
                            </p>
                          ) : null}
                        </td>

                        <td
                          className="px-4 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedKey(dossier.key)
                                setStudioTab("dossier")
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-950 hover:bg-slate-50"
                            >
                              Ouvrir
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedKey(dossier.key)
                                setModal("task")
                              }}
                              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
                              title="Créer une tâche"
                            >
                              <ClipboardCheck className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedKey(dossier.key)
                                setModal("communication")
                              }}
                              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
                              title="Préparer une communication"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 p-12 text-sm font-black text-slate-700">
                <Loader2 className="h-5 w-5 animate-spin" />
                Synchronisation des dossiers réels…
              </div>
            ) : null}

            {!loading && !filteredDossiers.length ? (
              <div className="p-12 text-center">
                <UserCheck className="mx-auto h-10 w-10 text-blue-500" />

                <h3 className="mt-3 text-lg font-black text-slate-950">
                  Aucun dossier dans ce périmètre
                </h3>

                <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
                  Modifiez les filtres ou démarrez un onboarding à partir d’une
                  candidature réelle. Aucun dossier fictif n’est injecté.
                </p>

                <button
                  type="button"
                  onClick={() => setModal("start")}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white"
                >
                  <Plus className="h-4 w-4" />
                  Démarrer un onboarding
                </button>
              </div>
            ) : null}
          </Card>

          <section className="grid gap-4 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => {
                setRiskFilter("overdue")
                setStageFilter("all")
              }}
              className="text-left"
            >
              <Card className="h-full p-4 transition hover:border-rose-300">
                <Clock3 className="h-5 w-5 text-rose-600" />

                <p className="mt-3 text-sm font-black text-slate-950">
                  Retards opérationnels
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {
                    dossiers.filter(
                      (dossier) =>
                        dossier.activation.dueDate &&
                        isPast(dossier.activation.dueDate) &&
                        dossier.stage !== "activated",
                    ).length
                  }
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Cliquer pour ouvrir la file en retard.
                </p>
              </Card>
            </button>

            <button
              type="button"
              onClick={() => {
                const mapping: Record<string, RiskFilter> = {
                  identity: "documents",
                  training: "training",
                  territory: "territory",
                  access: "blocked",
                  approvals: "approval",
                }

                setRiskFilter(mapping[topBottleneck[0]] || "blocked")
              }}
              className="text-left"
            >
              <Card className="h-full p-4 transition hover:border-amber-300">
                <SlidersHorizontal className="h-5 w-5 text-amber-600" />

                <p className="mt-3 text-sm font-black text-slate-950">
                  Goulot principal
                </p>

                <p className="mt-2 text-xl font-black capitalize text-slate-950">
                  {topBottleneck[0]}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {topBottleneck[1]} dossier(s) affecté(s).
                </p>
              </Card>
            </button>

            <button
              type="button"
              onClick={() => setModal("training")}
              className="text-left"
            >
              <Card className="h-full p-4 transition hover:border-violet-300">
                <BookOpenCheck className="h-5 w-5 text-violet-600" />

                <p className="mt-3 text-sm font-black text-slate-950">
                  Formation à planifier
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {
                    dossiers.filter(
                      (dossier) =>
                        (readinessByKey.get(dossier.key)?.sections.training ||
                          0) < 100,
                    ).length
                  }
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Créer une session individuelle ou collective.
                </p>
              </Card>
            </button>

            <button
              type="button"
              onClick={() => setModal("risks")}
              className="text-left"
            >
              <Card className="h-full p-4 transition hover:border-blue-300">
                <Activity className="h-5 w-5 text-blue-600" />

                <p className="mt-3 text-sm font-black text-slate-950">
                  Prévision d’activation
                </p>

                <p className="mt-2 text-3xl font-black text-slate-950">
                  {
                    dossiers.filter((dossier) => {
                      const score =
                        readinessByKey.get(dossier.key)?.score || 0

                      return (
                        dossier.stage !== "activated" &&
                        score >= 80
                      )
                    }).length
                  }
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Dossiers à plus de 80% de readiness.
                </p>
              </Card>
            </button>
          </section>
        </main>

        <aside className="min-w-0">
          <Card className="sticky top-24 overflow-hidden">
            <div className="border-b border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                    Activation Studio
                  </p>

                  <h2 className="mt-1 truncate text-xl font-black text-slate-950">
                    {selectedDossier
                      ? selectedDossier.name
                      : "Sélectionnez un dossier"}
                  </h2>

                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {selectedDossier
                      ? [
                          selectedDossier.city,
                          stageLabel(selectedDossier.stage),
                          draft.manager || draft.owner || "Manager à affecter",
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : "Le studio ne charge aucun profil fictif."}
                  </p>
                </div>

                {selectedDossier ? (
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${stageTone(
                      selectedDossier.stage,
                    )}`}
                  >
                    {stageLabel(selectedDossier.stage)}
                  </span>
                ) : null}
              </div>

              {selectedDossier ? (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-700">
                    <span>Readiness globale</span>
                    <span>{selectedReadiness.score}%</span>
                  </div>

                  <Progress
                    value={selectedReadiness.score}
                    tone={
                      selectedReadiness.score === 100
                        ? "green"
                        : selectedReadiness.score < 50
                          ? "red"
                          : "blue"
                    }
                  />

                  <div className="mt-3 grid grid-cols-5 gap-1.5">
                    {[
                      ["KYC", selectedReadiness.sections.identity],
                      ["Form.", selectedReadiness.sections.training],
                      ["Zone", selectedReadiness.sections.territory],
                      ["Accès", selectedReadiness.sections.access],
                      ["Valid.", selectedReadiness.sections.approvals],
                    ].map(([label, score]) => (
                      <div
                        key={String(label)}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-center"
                      >
                        <p className="text-[8px] font-black uppercase text-slate-500">
                          {label}
                        </p>

                        <p className="mt-1 text-xs font-black text-slate-950">
                          {score}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {selectedDossier ? (
              <>
                <div className="border-b border-slate-100 bg-white px-3 py-3">
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {STUDIO_TABS.map((tab) => {
                      const Icon = tab.icon

                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setStudioTab(tab.key)}
                          title={tab.label}
                          className={`flex min-w-[54px] flex-1 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[9px] font-black transition ${
                            studioTab === tab.key
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{tab.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="max-h-[calc(100vh-350px)] overflow-y-auto p-4">
                  {studioTab === "dossier" ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-black text-slate-950">
                          Gouvernance du dossier
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Responsabilités, échéances, priorité et contexte opérationnel.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Propriétaire du parcours" required>
                          <input
                            value={draft.owner}
                            onChange={(event) =>
                              updateDraft("owner", event.target.value)
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Manager opérationnel" required>
                          <input
                            value={draft.manager}
                            onChange={(event) =>
                              updateDraft("manager", event.target.value)
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Priorité">
                          <select
                            value={draft.priority}
                            onChange={(event) =>
                              updateDraft(
                                "priority",
                                event.target.value as ActivationState["priority"],
                              )
                            }
                            className={inputClass}
                          >
                            <option value="normal">Normale</option>
                            <option value="high">Haute</option>
                            <option value="critical">Critique</option>
                          </select>
                        </Field>

                        <Field label="Activation cible">
                          <input
                            type="date"
                            value={draft.targetActivationDate}
                            onChange={(event) =>
                              updateDraft(
                                "targetActivationDate",
                                event.target.value,
                              )
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Échéance du dossier">
                          <input
                            type="date"
                            value={draft.dueDate}
                            onChange={(event) =>
                              updateDraft("dueDate", event.target.value)
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Date de revue">
                          <input
                            type="date"
                            value={draft.reviewDate}
                            onChange={(event) =>
                              updateDraft("reviewDate", event.target.value)
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <Field label="Notes internes">
                        <textarea
                          value={draft.notes}
                          onChange={(event) =>
                            updateDraft("notes", event.target.value)
                          }
                          placeholder="Contexte, réserves, décision recommandée, disponibilité…"
                          className={textareaClass}
                        />
                      </Field>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setModal("task")}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-950 hover:bg-slate-50"
                        >
                          <ClipboardCheck className="h-4 w-4" />
                          Nouvelle tâche
                        </button>

                        <button
                          type="button"
                          onClick={() => setModal("communication")}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-950 hover:bg-slate-50"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Communication
                        </button>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black text-slate-950">
                            Tâches actives
                          </p>

                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-700">
                            {
                              draft.tasks.filter(
                                (task) => task.status !== "completed",
                              ).length
                            }
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          {draft.tasks.slice(0, 5).map((task) => (
                            <div
                              key={task.id}
                              className="rounded-xl border border-slate-200 bg-white p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-black text-slate-950">
                                    {task.title}
                                  </p>

                                  <p className="mt-1 text-[10px] font-bold text-slate-500">
                                    {task.owner || "Sans responsable"} ·{" "}
                                    {task.dueDate || "Sans échéance"}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setDraft((current) => ({
                                      ...current,
                                      tasks: current.tasks.map((item) =>
                                        item.id === task.id
                                          ? {
                                              ...item,
                                              status:
                                                item.status === "completed"
                                                  ? "open"
                                                  : "completed",
                                              completedAt:
                                                item.status === "completed"
                                                  ? ""
                                                  : nowIso(),
                                            }
                                          : item,
                                      ),
                                    }))
                                  }}
                                  className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
                                    task.status === "completed"
                                      ? "bg-emerald-50 text-emerald-800"
                                      : "bg-amber-50 text-amber-800"
                                  }`}
                                >
                                  {task.status === "completed"
                                    ? "Terminée"
                                    : "À faire"}
                                </button>
                              </div>
                            </div>
                          ))}

                          {!draft.tasks.length ? (
                            <p className="py-4 text-center text-xs font-semibold text-slate-500">
                              Aucune tâche enregistrée.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {studioTab === "compliance" ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-black text-slate-950">
                          Identité, documents & conformité
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Chaque pièce possède un statut, un reviewer, une échéance et une note.
                        </p>
                      </div>

                      <div className="space-y-2">
                        {draft.documents.map((document) => {
                          const statusLabel: Record<DocumentControl["status"], string> = {
                            missing: "Manquant",
                            requested: "Demandé",
                            uploaded: "Téléversé",
                            review: "En revue",
                            validated: "Validé",
                            rejected: "Rejeté",
                            expired: "Expiré",
                          }

                          return (
                            <button
                              key={document.key}
                              type="button"
                              onClick={() => {
                                setDocumentForm({
                                  key: document.key,
                                  status: document.status,
                                  reviewer: document.reviewer,
                                  note: document.note,
                                  expiresAt: document.expiresAt,
                                })
                                setModal("document")
                              }}
                              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left hover:border-blue-300"
                            >
                              <div className="flex min-w-0 items-start gap-3">
                                <span
                                  className={`mt-0.5 rounded-xl p-2 ${
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
                                  <p className="text-sm font-black text-slate-950">
                                    {document.label}
                                    {document.required ? " *" : ""}
                                  </p>

                                  <p className="mt-1 truncate text-[10px] font-bold text-slate-500">
                                    {document.reviewer || "Aucun reviewer"} ·{" "}
                                    {document.updatedAt
                                      ? new Date(document.updatedAt).toLocaleDateString("fr-FR")
                                      : "Aucune mise à jour"}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black ${
                                  document.status === "validated"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : document.status === "rejected" ||
                                        document.status === "expired"
                                      ? "bg-rose-50 text-rose-800"
                                      : "bg-amber-50 text-amber-800"
                                }`}
                              >
                                {statusLabel[document.status]}
                              </span>
                            </button>
                          )
                        })}
                      </div>

                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
                          Commission contractuelle
                        </p>

                        <div className="mt-2 flex items-end justify-between">
                          <div>
                            <p className="text-3xl font-black text-emerald-950">
                              10% fixe
                            </p>

                            <p className="mt-1 text-xs font-bold text-emerald-800">
                              Verrouillée et non modifiable depuis le parcours opérationnel.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              updateDraft(
                                "commissionAccepted",
                                !draft.commissionAccepted,
                              )
                            }
                            className={`rounded-full px-3 py-2 text-[10px] font-black ${
                              draft.commissionAccepted
                                ? "bg-emerald-700 text-white"
                                : "bg-white text-emerald-800"
                            }`}
                          >
                            {draft.commissionAccepted
                              ? "Acceptée"
                              : "À accepter"}
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          updateDraft(
                            "confidentialityAccepted",
                            !draft.confidentialityAccepted,
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${
                          draft.confidentialityAccepted
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-amber-200 bg-amber-50"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-black text-slate-950">
                            Confidentialité et données clients
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-600">
                            Acceptation obligatoire avant accès aux leads.
                          </p>
                        </div>

                        <CheckCircle2
                          className={`h-5 w-5 ${
                            draft.confidentialityAccepted
                              ? "text-emerald-700"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    </div>
                  ) : null}

                  {studioTab === "training" ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-black text-slate-950">
                            Formation & certification
                          </h3>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Modules obligatoires, score, formateur, échéance et preuve.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setModal("training")}
                          className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[10px] font-black text-violet-800"
                        >
                          Planifier
                        </button>
                      </div>

                      <div className="space-y-3">
                        {draft.training.map((module) => (
                          <div
                            key={module.key}
                            className="rounded-2xl border border-slate-200 bg-white p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-black text-slate-950">
                                  {module.label}
                                  {module.mandatory ? " *" : ""}
                                </p>

                                <p className="mt-1 text-[10px] font-bold text-slate-500">
                                  {module.trainer || "Formateur non affecté"} ·{" "}
                                  {module.dueDate || "Sans échéance"}
                                </p>
                              </div>

                              <select
                                value={module.status}
                                onChange={(event) => {
                                  const status = event.target
                                    .value as TrainingControl["status"]

                                  setDraft((current) => ({
                                    ...current,
                                    training: current.training.map((item) =>
                                      item.key === module.key
                                        ? {
                                            ...item,
                                            status,
                                            completedAt:
                                              status === "completed"
                                                ? nowIso()
                                                : "",
                                            attempts:
                                              status === "completed" ||
                                              status === "failed"
                                                ? Math.max(1, item.attempts)
                                                : item.attempts,
                                          }
                                        : item,
                                    ),
                                  }))
                                }}
                                className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-black text-slate-950"
                              >
                                <option value="not_started">
                                  Non commencé
                                </option>
                                <option value="scheduled">
                                  Planifié
                                </option>
                                <option value="in_progress">
                                  En cours
                                </option>
                                <option value="completed">
                                  Terminé
                                </option>
                                <option value="failed">
                                  Échec
                                </option>
                                <option value="exempted">
                                  Exemption validée
                                </option>
                              </select>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <Field label="Score">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={module.score}
                                  onChange={(event) => {
                                    const score = numberValue(event.target.value)

                                    setDraft((current) => ({
                                      ...current,
                                      training: current.training.map((item) =>
                                        item.key === module.key
                                          ? {
                                              ...item,
                                              score,
                                            }
                                          : item,
                                      ),
                                    }))
                                  }}
                                  className={inputClass}
                                />
                              </Field>

                              <Field label="Formateur">
                                <input
                                  value={module.trainer}
                                  onChange={(event) => {
                                    const trainer = event.target.value

                                    setDraft((current) => ({
                                      ...current,
                                      training: current.training.map((item) =>
                                        item.key === module.key
                                          ? {
                                              ...item,
                                              trainer,
                                            }
                                          : item,
                                      ),
                                    }))
                                  }}
                                  className={inputClass}
                                />
                              </Field>

                              <Field label="Échéance">
                                <input
                                  type="date"
                                  value={module.dueDate}
                                  onChange={(event) => {
                                    const dueDate = event.target.value

                                    setDraft((current) => ({
                                      ...current,
                                      training: current.training.map((item) =>
                                        item.key === module.key
                                          ? {
                                              ...item,
                                              dueDate,
                                            }
                                          : item,
                                      ),
                                    }))
                                  }}
                                  className={inputClass}
                                />
                              </Field>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                        <p className="text-sm font-black text-violet-950">
                          Enregistrements Training synchronisés
                        </p>

                        <p className="mt-1 text-xs font-bold text-violet-800">
                          {selectedTrainingRows.length} enregistrement(s) réel(s) rattaché(s) à ce dossier.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {studioTab === "territory" ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-black text-slate-950">
                          Territoire & périmètre opérationnel
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Affectation réelle, canaux, services, capacité et objectifs.
                        </p>
                      </div>

                      <Field label="Territoire existant" required>
                        <select
                          value={draft.territoryId}
                          onChange={(event) => {
                            const territoryId = event.target.value

                            const territory = territories.find(
                              (row) => idOf(row) === territoryId,
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
                            Choisir un territoire réel
                          </option>

                          {territories.map((territory) => {
                            const id = idOf(territory)

                            const name = text(
                              territory.name ||
                                territory.title ||
                                territory.territory_name,
                            )

                            const city = text(territory.city)

                            return (
                              <option key={id} value={id}>
                                {name || id}
                                {city ? ` · ${city}` : ""}
                              </option>
                            )
                          })}
                        </select>
                      </Field>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Mode de couverture">
                          <select
                            value={draft.coverageMode}
                            onChange={(event) =>
                              updateDraft(
                                "coverageMode",
                                event.target.value as ActivationState["coverageMode"],
                              )
                            }
                            className={inputClass}
                          >
                            <option value="exclusive">Exclusif</option>
                            <option value="shared">Partagé</option>
                            <option value="secondary">Secondaire</option>
                            <option value="backup">Backup</option>
                            <option value="prospecting_only">
                              Prospection uniquement
                            </option>
                          </select>
                        </Field>

                        <Field label="Rayon d’action">
                          <input
                            type="number"
                            min="1"
                            value={draft.radiusKm}
                            onChange={(event) =>
                              updateDraft(
                                "radiusKm",
                                numberValue(event.target.value, 5),
                              )
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <div>
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700">
                          Services autorisés
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {SERVICES.map((service) => (
                            <button
                              key={service}
                              type="button"
                              onClick={() => toggleDraftArray("services", service)}
                              className={`rounded-full border px-3 py-2 text-xs font-black ${
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

                      <div>
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700">
                          Canaux autorisés
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {CHANNELS.map((channel) => (
                            <button
                              key={channel}
                              type="button"
                              onClick={() => toggleDraftArray("channels", channel)}
                              className={`rounded-full border px-3 py-2 text-xs font-black ${
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

                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          ["leadTarget", "Leads / mois"],
                          ["qualifiedLeadTarget", "Leads qualifiés"],
                          ["conversionTarget", "Conversions"],
                          ["fieldVisitTarget", "Visites terrain"],
                          ["partnerMeetingTarget", "RDV partenaires"],
                          ["revenueTarget", "Objectif revenu Dh"],
                        ].map(([key, label]) => (
                          <Field key={key} label={label}>
                            <input
                              type="number"
                              min="0"
                              value={draft[key as keyof ActivationState] as number}
                              onChange={(event) =>
                                updateDraft(
                                  key as keyof ActivationState,
                                  numberValue(event.target.value) as never,
                                )
                              }
                              className={inputClass}
                            />
                          </Field>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => void assignTerritory()}
                        disabled={busy || !draft.territoryId}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                        Affecter et synchroniser le territoire
                      </button>
                    </div>
                  ) : null}

                  {studioTab === "access" ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-black text-slate-950">
                          Accès, codes & paiement
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Tracking commercial, payout, RIB et préparation des accès.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
                          Commission verrouillée
                        </p>

                        <p className="mt-2 text-3xl font-black text-emerald-950">
                          10%
                        </p>

                        <p className="mt-1 text-xs font-bold text-emerald-800">
                          Aucune modification manuelle autorisée.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Code promo" required>
                          <div className="flex gap-2">
                            <input
                              value={draft.promoCode}
                              onChange={(event) =>
                                updateDraft("promoCode", event.target.value)
                              }
                              className={inputClass}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                updateDraft(
                                  "promoCode",
                                  generateCode(
                                    "AC",
                                    selectedDossier.name,
                                    selectedDossier.city,
                                  ),
                                )
                              }
                              className="rounded-2xl border border-blue-200 bg-blue-50 px-3 text-[10px] font-black text-blue-800"
                            >
                              Générer
                            </button>
                          </div>
                        </Field>

                        <Field label="Code referral" required>
                          <div className="flex gap-2">
                            <input
                              value={draft.referralCode}
                              onChange={(event) =>
                                updateDraft("referralCode", event.target.value)
                              }
                              className={inputClass}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                updateDraft(
                                  "referralCode",
                                  generateCode(
                                    "AMB",
                                    selectedDossier.name,
                                    selectedDossier.city,
                                  ),
                                )
                              }
                              className="rounded-2xl border border-blue-200 bg-blue-50 px-3 text-[10px] font-black text-blue-800"
                            >
                              Générer
                            </button>
                          </div>
                        </Field>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Cycle payout">
                          <select
                            value={draft.payoutCycle}
                            onChange={(event) =>
                              updateDraft(
                                "payoutCycle",
                                event.target.value as ActivationState["payoutCycle"],
                              )
                            }
                            className={inputClass}
                          >
                            <option value="weekly">Hebdomadaire</option>
                            <option value="twice_monthly">Bimensuel</option>
                            <option value="monthly">Mensuel</option>
                          </select>
                        </Field>

                        <Field label="Méthode de paiement">
                          <select
                            value={draft.paymentMethod}
                            onChange={(event) =>
                              updateDraft(
                                "paymentMethod",
                                event.target.value as ActivationState["paymentMethod"],
                              )
                            }
                            className={inputClass}
                          >
                            <option value="bank_transfer">
                              Virement bancaire
                            </option>
                            <option value="mobile_money">
                              Mobile Money
                            </option>
                            <option value="controlled_cash">
                              Espèces contrôlées
                            </option>
                          </select>
                        </Field>
                      </div>

                      <Field
                        label="RIB / référence bénéficiaire"
                        required
                      >
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

                      <button
                        type="button"
                        onClick={() =>
                          updateDraft(
                            "paymentVerified",
                            !draft.paymentVerified,
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${
                          draft.paymentVerified
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-amber-200 bg-amber-50"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-black text-slate-950">
                            Vérification finance
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-600">
                            Identité du bénéficiaire et moyen de paiement.
                          </p>
                        </div>

                        <CheckCircle2
                          className={`h-5 w-5 ${
                            draft.paymentVerified
                              ? "text-emerald-700"
                              : "text-slate-300"
                          }`}
                        />
                      </button>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Portail">
                          <select
                            value={draft.portalAccessStatus}
                            onChange={(event) =>
                              updateDraft(
                                "portalAccessStatus",
                                event.target
                                  .value as ActivationState["portalAccessStatus"],
                              )
                            }
                            className={inputClass}
                          >
                            <option value="not_prepared">Non préparé</option>
                            <option value="prepared">Préparé</option>
                            <option value="active">Actif</option>
                            <option value="suspended">Suspendu</option>
                          </select>
                        </Field>

                        <Field label="CRM">
                          <select
                            value={draft.crmAccessStatus}
                            onChange={(event) =>
                              updateDraft(
                                "crmAccessStatus",
                                event.target
                                  .value as ActivationState["crmAccessStatus"],
                              )
                            }
                            className={inputClass}
                          >
                            <option value="not_prepared">Non préparé</option>
                            <option value="prepared">Préparé</option>
                            <option value="active">Actif</option>
                            <option value="suspended">Suspendu</option>
                          </select>
                        </Field>

                        <Field label="Starter kit">
                          <select
                            value={draft.starterKitStatus}
                            onChange={(event) =>
                              updateDraft(
                                "starterKitStatus",
                                event.target
                                  .value as ActivationState["starterKitStatus"],
                              )
                            }
                            className={inputClass}
                          >
                            <option value="not_prepared">Non préparé</option>
                            <option value="preparing">En préparation</option>
                            <option value="ready">Prêt</option>
                            <option value="delivered">Remis</option>
                          </select>
                        </Field>
                      </div>

                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-black text-amber-950">
                          Règle de vérité opérationnelle
                        </p>

                        <p className="mt-1 text-xs font-bold leading-5 text-amber-800">
                          Un statut « préparé » ne signifie jamais qu’un email,
                          WhatsApp ou accès externe a réellement été envoyé.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {studioTab === "approvals" ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-black text-slate-950">
                          Matrice d’approbation
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Approbation, rejet, correction, mise en attente et preuve.
                        </p>
                      </div>

                      <div className="space-y-2">
                        {draft.approvals.map((approval) => (
                          <button
                            key={approval.role}
                            type="button"
                            onClick={() => {
                              setApprovalForm({
                                role: approval.role,
                                status: approval.status,
                                approver: approval.approver,
                                note: approval.note,
                                evidence: approval.evidence,
                              })
                              setModal("approval")
                            }}
                            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left hover:border-blue-300"
                          >
                            <div>
                              <p className="text-sm font-black text-slate-950">
                                {approval.label}
                              </p>

                              <p className="mt-1 text-[10px] font-bold text-slate-500">
                                {approval.approver || "Aucun approbateur"}
                                {approval.decidedAt
                                  ? ` · ${new Date(
                                      approval.decidedAt,
                                    ).toLocaleString("fr-FR")}`
                                  : ""}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
                                approval.status === "approved"
                                  ? "bg-emerald-50 text-emerald-800"
                                  : approval.status === "rejected"
                                    ? "bg-rose-50 text-rose-800"
                                    : approval.status === "correction"
                                      ? "bg-amber-50 text-amber-800"
                                      : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {approval.status}
                            </span>
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void executeCurrentSave(
                            "validation",
                            "Soumission validation finale",
                          )
                        }
                        disabled={busy}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 text-sm font-black text-blue-800 disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <BadgeCheck className="h-4 w-4" />
                        )}
                        Soumettre le dossier à validation
                      </button>
                    </div>
                  ) : null}

                  {studioTab === "activation" ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-black text-slate-950">
                          Décision finale d’activation
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Verdict exécutif, blocages, première mission et chronologie.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                            Readiness
                          </p>

                          <p className="mt-2 text-3xl font-black text-slate-950">
                            {selectedReadiness.score}%
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                            Blocages
                          </p>

                          <p className="mt-2 text-3xl font-black text-slate-950">
                            {selectedReadiness.blockers.length}
                          </p>
                        </div>
                      </div>

                      {selectedReadiness.blockers.length ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                            <div>
                              <p className="text-sm font-black text-amber-950">
                                Activation bloquée
                              </p>

                              <div className="mt-2 space-y-1">
                                {selectedReadiness.blockers.map((blocker) => (
                                  <p
                                    key={blocker}
                                    className="text-xs font-bold text-amber-800"
                                  >
                                    • {blocker}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

                            <div>
                              <p className="text-sm font-black text-emerald-950">
                                Prêt à activer
                              </p>

                              <p className="mt-1 text-xs font-bold text-emerald-800">
                                Tous les contrôles obligatoires sont complets.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          updateDraft(
                            "firstMissionEnabled",
                            !draft.firstMissionEnabled,
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${
                          draft.firstMissionEnabled
                            ? "border-blue-200 bg-blue-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-black text-slate-950">
                            Créer la première mission
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Mission réelle créée uniquement après activation réussie.
                          </p>
                        </div>

                        <CheckCircle2
                          className={`h-5 w-5 ${
                            draft.firstMissionEnabled
                              ? "text-blue-700"
                              : "text-slate-300"
                          }`}
                        />
                      </button>

                      {draft.firstMissionEnabled ? (
                        <div className="grid gap-3">
                          <Field label="Titre de la mission">
                            <input
                              value={draft.firstMissionTitle}
                              onChange={(event) =>
                                updateDraft(
                                  "firstMissionTitle",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </Field>

                          <Field label="Échéance mission">
                            <input
                              type="date"
                              value={draft.firstMissionDueDate}
                              onChange={(event) =>
                                updateDraft(
                                  "firstMissionDueDate",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </Field>
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => void activateAmbassador()}
                        disabled={busy || selectedReadiness.blockers.length > 0}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                        Activer l’ambassadeur
                      </button>

                      <div className="border-t border-slate-200 pt-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black text-slate-950">
                            Chronologie
                          </p>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-700">
                            {draft.timeline.length + selectedAuditRows.length}
                          </span>
                        </div>

                        <div className="mt-3 space-y-3">
                          {[
                            ...draft.timeline.map((event) => ({
                              id: event.id,
                              action: event.action,
                              detail: event.detail,
                              createdAt: event.createdAt,
                              actor: event.actor,
                            })),

                            ...selectedAuditRows.map((row) => ({
                              id: idOf(row) || uid("audit-view"),
                              action: text(row.action) || "Événement audit",
                              detail: text(
                                row.description ||
                                  row.detail ||
                                  asRecord(row.details).message,
                              ),
                              createdAt: text(row.created_at),
                              actor: text(row.actor) || "AngelCare OPS",
                            })),
                          ]
                            .sort(
                              (first, second) =>
                                new Date(second.createdAt || 0).getTime() -
                                new Date(first.createdAt || 0).getTime(),
                            )
                            .slice(0, 12)
                            .map((event) => (
                              <div
                                key={event.id}
                                className="flex gap-3"
                              >
                                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />

                                <div>
                                  <p className="text-xs font-black text-slate-950">
                                    {event.action}
                                  </p>

                                  <p className="mt-0.5 text-[10px] font-semibold leading-5 text-slate-500">
                                    {event.detail || "Aucun détail"} ·{" "}
                                    {event.actor}
                                  </p>

                                  <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                                    {event.createdAt
                                      ? new Date(
                                          event.createdAt,
                                        ).toLocaleString("fr-FR")
                                      : "Date indisponible"}
                                  </p>
                                </div>
                              </div>
                            ))}

                          {!draft.timeline.length && !selectedAuditRows.length ? (
                            <p className="py-4 text-center text-xs font-semibold text-slate-500">
                              Aucun événement enregistré.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <footer className="border-t border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const index = STUDIO_TABS.findIndex(
                          (tab) => tab.key === studioTab,
                        )

                        const previous = STUDIO_TABS[Math.max(0, index - 1)]

                        if (previous) {
                          setStudioTab(previous.key)
                        }
                      }}
                      disabled={studioTab === "dossier"}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-950 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Retour
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void executeCurrentSave(
                          selectedDossier.stage === "prequalification"
                            ? "onboarding"
                            : selectedDossier.stage,
                          "Brouillon onboarding enregistré",
                        )
                      }
                      disabled={busy}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-950 disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ClipboardCheck className="h-4 w-4" />
                      )}
                      Enregistrer
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const index = STUDIO_TABS.findIndex(
                          (tab) => tab.key === studioTab,
                        )

                        const next =
                          STUDIO_TABS[
                            Math.min(STUDIO_TABS.length - 1, index + 1)
                          ]

                        if (next) {
                          setStudioTab(next.key)
                        }
                      }}
                      disabled={studioTab === "activation"}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-3 text-xs font-black text-white disabled:opacity-30"
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </footer>
              </>
            ) : (
              <div className="p-10 text-center">
                <UserCheck className="mx-auto h-10 w-10 text-blue-500" />

                <p className="mt-3 text-base font-black text-slate-950">
                  Aucun dossier sélectionné
                </p>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  Sélectionnez une ligne réelle pour ouvrir l’Activation Studio.
                </p>
              </div>
            )}
          </Card>
        </aside>
      </div>

      {modal === "start" ? (
        <ModalShell
          title="Démarrer un onboarding"
          subtitle="Sélectionnez une candidature réelle, affectez la gouvernance du dossier et lancez officiellement le parcours d’activation."
          icon={UserCheck}
          onClose={() => setModal(null)}
          width="max-w-5xl"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => void startOnboarding()}
                disabled={busy || !startForm.candidateId}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white disabled:bg-slate-200 disabled:text-slate-500"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Lancer le parcours
              </button>
            </div>
          }
        >
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="p-5">
              <h3 className="text-base font-black text-slate-950">
                Candidature source
              </h3>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                Les données Recruitment seront chargées et conservées.
              </p>

              <div className="mt-4">
                <Field label="Candidat validé" required>
                  <select
                    value={startForm.candidateId}
                    onChange={(event) =>
                      setStartForm((current) => ({
                        ...current,
                        candidateId: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">
                      Sélectionner un candidat réel
                    </option>

                    {availableCandidates.map((dossier) => (
                      <option
                        key={dossier.candidateId}
                        value={dossier.candidateId}
                      >
                        {dossier.name} · {dossier.city || "Ville non renseignée"} ·{" "}
                        {dossier.phone || dossier.email}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {!availableCandidates.length ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                  Aucun candidat disponible sans onboarding actif.
                </div>
              ) : null}
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-black text-slate-950">
                Gouvernance initiale
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Propriétaire" required>
                  <input
                    value={startForm.owner}
                    onChange={(event) =>
                      setStartForm((current) => ({
                        ...current,
                        owner: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Manager" required>
                  <input
                    value={startForm.manager}
                    onChange={(event) =>
                      setStartForm((current) => ({
                        ...current,
                        manager: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Priorité">
                  <select
                    value={startForm.priority}
                    onChange={(event) =>
                      setStartForm((current) => ({
                        ...current,
                        priority: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="normal">Normale</option>
                    <option value="high">Haute</option>
                    <option value="critical">Critique</option>
                  </select>
                </Field>

                <Field label="Échéance">
                  <input
                    type="date"
                    value={startForm.dueDate}
                    onChange={(event) =>
                      setStartForm((current) => ({
                        ...current,
                        dueDate: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Activation cible">
                  <input
                    type="date"
                    value={startForm.targetActivationDate}
                    onChange={(event) =>
                      setStartForm((current) => ({
                        ...current,
                        targetActivationDate: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Modèle de parcours">
                  <select
                    value={startForm.template}
                    onChange={(event) =>
                      setStartForm((current) => ({
                        ...current,
                        template: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="standard">
                      Standard complet
                    </option>
                    <option value="field">
                      Ambassadeur terrain
                    </option>
                    <option value="digital">
                      WhatsApp & digital
                    </option>
                    <option value="b2b">
                      B2B & partenariats
                    </option>
                  </select>
                </Field>
              </div>
            </Card>
          </div>
        </ModalShell>
      ) : null}

      {modal === "import" ? (
        <ModalShell
          title="Importer des dossiers onboarding"
          subtitle="Import contrôlé, détection des doublons, création Recruitment puis ouverture réelle du parcours onboarding."
          icon={Upload}
          onClose={() => setModal(null)}
          width="max-w-6xl"
          footer={
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black text-slate-600">
                Colonnes recommandées : candidate_name, phone, email, city,
                region, zone, source, manager, owner, due_date,
                target_activation_date, priority, notes
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
                  onClick={() => void importCsvRows()}
                  disabled={busy || !parseCsv(importText).length}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Importer {parseCsv(importText).length || 0} ligne(s)
                </button>
              </div>
            </div>
          }
        >
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <Card className="p-5">
              <h3 className="text-base font-black text-slate-950">
                Source CSV
              </h3>

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={async (event) => {
                  const file = event.target.files?.[0]

                  if (!file) return

                  setImportText(await file.text())
                }}
                className="mt-4 block w-full rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-6 text-sm font-black text-blue-900"
              />

              <textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                placeholder="Collez également le contenu CSV ici…"
                className={`${textareaClass} mt-4 min-h-[300px] font-mono text-xs`}
              />
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 p-5">
                <h3 className="text-base font-black text-slate-950">
                  Prévisualisation
                </h3>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Les dix premières lignes sont affichées avant création.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50">
                      {["Nom", "Téléphone", "Email", "Ville", "Manager"].map(
                        (header) => (
                          <th
                            key={header}
                            className="px-4 py-3 text-left text-[10px] font-black uppercase text-slate-600"
                          >
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {parseCsv(importText)
                      .slice(0, 10)
                      .map((row, index) => (
                        <tr
                          key={String(index)}
                          className="border-t border-slate-100"
                        >
                          <td className="px-4 py-3 text-xs font-black">
                            {text(row.candidate_name || row.full_name || row.name)}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold">
                            {text(row.phone || row.telephone)}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold">
                            {text(row.email)}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold">
                            {text(row.city)}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold">
                            {text(row.manager)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </ModalShell>
      ) : null}

      {modal === "bulk" ? (
        <ModalShell
          title="Actions groupées"
          subtitle="Appliquez une action contrôlée aux dossiers sélectionnés avec rapport de résultat ligne par ligne."
          icon={Layers3}
          onClose={() => setModal(null)}
          width="max-w-4xl"
          footer={
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-slate-600">
                {targetDossiers().length} dossier(s) concerné(s)
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
                  onClick={() => void executeBulkAction()}
                  disabled={busy || !targetDossiers().length}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white disabled:bg-slate-200"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Prévisualiser et appliquer
                </button>
              </div>
            </div>
          }
        >
          <Card className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Action">
                <select
                  value={bulkForm.action}
                  onChange={(event) =>
                    setBulkForm((current) => ({
                      ...current,
                      action: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="assign_manager">
                    Affecter un manager
                  </option>
                  <option value="set_due_date">
                    Définir une échéance
                  </option>
                  <option value="set_priority">
                    Modifier la priorité
                  </option>
                  <option value="request_documents">
                    Préparer demande de documents
                  </option>
                  <option value="move_validation">
                    Soumettre à validation
                  </option>
                  <option value="abandon">
                    Abandonner avec motif
                  </option>
                </select>
              </Field>

              {bulkForm.action === "assign_manager" ? (
                <Field label="Manager">
                  <input
                    value={bulkForm.value}
                    onChange={(event) =>
                      setBulkForm((current) => ({
                        ...current,
                        value: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              ) : null}

              {bulkForm.action === "set_priority" ? (
                <Field label="Priorité">
                  <select
                    value={bulkForm.value}
                    onChange={(event) =>
                      setBulkForm((current) => ({
                        ...current,
                        value: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="normal">Normale</option>
                    <option value="high">Haute</option>
                    <option value="critical">Critique</option>
                  </select>
                </Field>
              ) : null}

              {bulkForm.action === "set_due_date" ? (
                <Field label="Nouvelle échéance">
                  <input
                    type="date"
                    value={bulkForm.date}
                    onChange={(event) =>
                      setBulkForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              ) : null}
            </div>

            {["request_documents", "abandon"].includes(bulkForm.action) ? (
              <div className="mt-4">
                <Field
                  label={
                    bulkForm.action === "abandon"
                      ? "Motif obligatoire"
                      : "Message / instruction"
                  }
                >
                  <textarea
                    value={bulkForm.reason}
                    onChange={(event) =>
                      setBulkForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                    className={textareaClass}
                  />
                </Field>
              </div>
            ) : null}
          </Card>
        </ModalShell>
      ) : null}

      {modal === "training" ? (
        <ModalShell
          title="Planifier une formation"
          subtitle="Créez une affectation Training réelle et synchronisez simultanément le dossier onboarding."
          icon={GraduationCap}
          onClose={() => setModal(null)}
          width="max-w-5xl"
          footer={
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-slate-600">
                {targetDossiers().length} participant(s)
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
                  onClick={() => void scheduleTraining()}
                  disabled={
                    busy ||
                    !targetDossiers().length ||
                    !trainingForm.dueDate
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white disabled:bg-slate-200"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarDays className="h-4 w-4" />
                  )}
                  Planifier la session
                </button>
              </div>
            </div>
          }
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-base font-black text-slate-950">
                Module et organisation
              </h3>

              <div className="mt-4 grid gap-3">
                <Field label="Module obligatoire">
                  <select
                    value={trainingForm.moduleKey}
                    onChange={(event) =>
                      setTrainingForm((current) => ({
                        ...current,
                        moduleKey: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    {TRAINING_BLUEPRINT.map((module) => (
                      <option key={module.key} value={module.key}>
                        {module.label}
                      </option>
                    ))}
                  </select>
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

                <Field label="Date / échéance" required>
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
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-black text-slate-950">
                Logistique
              </h3>

              <div className="mt-4 grid gap-3">
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
            </Card>
          </div>
        </ModalShell>
      ) : null}

      {modal === "risks" ? (
        <ModalShell
          title="Centre de contrôles & exceptions"
          subtitle="Détectez les blocages, retards, documents, formations, territoires et validations nécessitant une action."
          icon={AlertTriangle}
          onClose={() => setModal(null)}
          width="max-w-7xl"
          footer={
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-slate-600">
                {riskItems.length} anomalie(s) détectée(s)
              </p>

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
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {riskItems.map((risk) => (
              <button
                key={risk.id}
                type="button"
                onClick={() => openRiskDossier(risk.dossierKey)}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-400 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`rounded-xl p-2 ${
                      risk.severity === "critical"
                        ? "bg-rose-50 text-rose-700"
                        : risk.severity === "high"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </span>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase text-slate-700">
                    {risk.category}
                  </span>
                </div>

                <p className="mt-3 text-sm font-black text-slate-950">
                  {risk.candidateName}
                </p>

                <p className="mt-1 text-xs font-black text-slate-800">
                  {risk.title}
                </p>

                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                  {risk.detail}
                </p>

                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">
                  Ouvrir le dossier →
                </p>
              </button>
            ))}

            {!riskItems.length ? (
              <div className="col-span-full rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" />

                <p className="mt-3 text-lg font-black text-emerald-950">
                  Aucune anomalie détectée
                </p>
              </div>
            ) : null}
          </div>
        </ModalShell>
      ) : null}

      {modal === "task" ? (
        <ModalShell
          title="Créer une tâche onboarding"
          subtitle="Définissez une responsabilité, une priorité, une échéance et une preuve attendue."
          icon={ClipboardCheck}
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
                onClick={() => void saveTask()}
                disabled={busy || !taskForm.title.trim()}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white disabled:bg-slate-200"
              >
                <ClipboardCheck className="h-4 w-4" />
                Créer la tâche
              </button>
            </div>
          }
        >
          <Card className="p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Titre" required>
                  <input
                    value={taskForm.title}
                    onChange={(event) =>
                      setTaskForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Responsable">
                <input
                  value={taskForm.owner}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      owner: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Échéance">
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      dueDate: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Priorité">
                <select
                  value={taskForm.priority}
                  onChange={(event) =>
                    setTaskForm((current) => ({
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

              <Field label="Preuve attendue">
                <input
                  value={taskForm.proof}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      proof: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </Card>
        </ModalShell>
      ) : null}

      {modal === "document" ? (
        <ModalShell
          title="Contrôle documentaire"
          subtitle="Mettez à jour le statut, reviewer, expiration et justification d’une pièce du dossier."
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
                onClick={() => void saveDocumentControl()}
                disabled={busy}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white"
              >
                <FileCheck2 className="h-4 w-4" />
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
                    const selectedDocument = draft.documents.find(
                      (document) => document.key === event.target.value,
                    )

                    setDocumentForm({
                      key: event.target.value,
                      status: selectedDocument?.status || "missing",
                      reviewer: selectedDocument?.reviewer || "",
                      note: selectedDocument?.note || "",
                      expiresAt: selectedDocument?.expiresAt || "",
                    })
                  }}
                  className={inputClass}
                >
                  {draft.documents.map((document) => (
                    <option key={document.key} value={document.key}>
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

              <Field label="Date d’expiration">
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
                <Field label="Note / justification">
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

      {modal === "communication" ? (
        <ModalShell
          title="Préparer une communication"
          subtitle="Créez une communication contextualisée et journalisée. Elle reste « préparée » sans confirmation d’un canal d’envoi réel."
          icon={MessageCircle}
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
                onClick={() => void saveCommunication()}
                disabled={busy || !communicationForm.message.trim()}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white disabled:bg-slate-200"
              >
                <Send className="h-4 w-4" />
                Enregistrer comme préparée
              </button>
            </div>
          }
        >
          <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
            <Card className="p-5">
              <div className="grid gap-3">
                <Field label="Canal">
                  <select
                    value={communicationForm.channel}
                    onChange={(event) =>
                      setCommunicationForm((current) => ({
                        ...current,
                        channel: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option>WhatsApp</option>
                    <option>Email</option>
                    <option>Téléphone</option>
                    <option>Interne</option>
                  </select>
                </Field>

                <Field label="Objet">
                  <select
                    value={communicationForm.purpose}
                    onChange={(event) =>
                      setCommunicationForm((current) => ({
                        ...current,
                        purpose: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option>Document manquant</option>
                    <option>Rappel formation</option>
                    <option>Correction requise</option>
                    <option>Validation obtenue</option>
                    <option>Territoire confirmé</option>
                    <option>Activation approuvée</option>
                    <option>Première mission</option>
                  </select>
                </Field>

                <Field label="Destinataire">
                  <input
                    value={communicationForm.recipient}
                    onChange={(event) =>
                      setCommunicationForm((current) => ({
                        ...current,
                        recipient: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
            </Card>

            <Card className="p-5">
              <Field label="Message préparé" required>
                <textarea
                  value={communicationForm.message}
                  onChange={(event) =>
                    setCommunicationForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  placeholder="Rédigez le message contextualisé…"
                  className={`${textareaClass} min-h-[260px]`}
                />
              </Field>
            </Card>
          </div>
        </ModalShell>
      ) : null}

      {modal === "approval" ? (
        <ModalShell
          title="Décision d’approbation"
          subtitle="Enregistrez une décision imputable, datée et justifiée avec preuve ou référence."
          icon={BadgeCheck}
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
                onClick={() => void saveApproval()}
                disabled={busy || !approvalForm.approver.trim()}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white disabled:bg-slate-200"
              >
                <BadgeCheck className="h-4 w-4" />
                Enregistrer la décision
              </button>
            </div>
          }
        >
          <Card className="p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Périmètre">
                <select
                  value={approvalForm.role}
                  onChange={(event) =>
                    setApprovalForm((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  {APPROVAL_BLUEPRINT.map((approval) => (
                    <option key={approval.role} value={approval.role}>
                      {approval.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Décision">
                <select
                  value={approvalForm.status}
                  onChange={(event) =>
                    setApprovalForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="approved">Approuver</option>
                  <option value="correction">Retour en correction</option>
                  <option value="hold">Mettre en attente</option>
                  <option value="rejected">Rejeter</option>
                  <option value="pending">Réinitialiser en attente</option>
                </select>
              </Field>

              <Field label="Approbateur" required>
                <input
                  value={approvalForm.approver}
                  onChange={(event) =>
                    setApprovalForm((current) => ({
                      ...current,
                      approver: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Preuve / référence">
                <input
                  value={approvalForm.evidence}
                  onChange={(event) =>
                    setApprovalForm((current) => ({
                      ...current,
                      evidence: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Note de décision">
                  <textarea
                    value={approvalForm.note}
                    onChange={(event) =>
                      setApprovalForm((current) => ({
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

      <style jsx global>{`
        [data-page7-enterprise="operational-command-center"] h1,
        [data-page7-enterprise="operational-command-center"] h2,
        [data-page7-enterprise="operational-command-center"] h3,
        [data-page7-enterprise="operational-command-center"] h4,
        [data-page7-enterprise="operational-command-center"] label,
        [data-page7-enterprise="operational-command-center"] th {
          color: #020617 !important;
          -webkit-text-fill-color: #020617 !important;
          font-weight: 900 !important;
        }

        [data-page7-enterprise="operational-command-center"] input,
        [data-page7-enterprise="operational-command-center"] select,
        [data-page7-enterprise="operational-command-center"] textarea,
        [data-page7-enterprise="operational-command-center"] option {
          color: #020617 !important;
          -webkit-text-fill-color: #020617 !important;
          font-weight: 700 !important;
        }

        [data-page7-enterprise="operational-command-center"] input::placeholder,
        [data-page7-enterprise="operational-command-center"] textarea::placeholder {
          color: #64748b !important;
          -webkit-text-fill-color: #64748b !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}
