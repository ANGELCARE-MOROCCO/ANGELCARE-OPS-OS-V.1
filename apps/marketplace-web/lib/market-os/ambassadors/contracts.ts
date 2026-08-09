export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
export type JsonObject = { [key: string]: JsonValue }

export const AMBASSADOR_ENTITIES = [
  "ambassadors",
  "territories",
  "missions",
  "recruitment",
  "leads",
  "conversions",
  "onboarding",
  "training",
  "goals",
  "incentives",
  "proofs",
  "payouts",
  "reports",
  "audit",
] as const

export type AmbassadorEntityKey = (typeof AMBASSADOR_ENTITIES)[number]

export const AMBASSADOR_PERMISSIONS = [
  "ambassadors.read",
  "ambassadors.write",
  "ambassadors.archive",
  "territories.read",
  "territories.write",
  "territories.assign",
  "territories.approve",
  "missions.read",
  "missions.write",
  "missions.assign",
  "missions.transition",
  "recruitment.read",
  "recruitment.write",
  "recruitment.transition",
  "recruitment.convert",
  "leads.read",
  "leads.write",
  "leads.transition",
  "conversions.read",
  "conversions.write",
  "conversions.review",
  "onboarding.read",
  "onboarding.write",
  "training.read",
  "training.write",
  "goals.read",
  "goals.write",
  "proofs.read",
  "proofs.submit",
  "proofs.review",
  "rewards.read",
  "rewards.write",
  "rewards.approve",
  "payouts.read",
  "payouts.approve",
  "payouts.execute",
  "reports.read",
  "reports.generate",
  "settings.read",
  "settings.write",
  "settings.draft",
  "settings.validate",
  "settings.submit",
  "settings.approve",
  "settings.publish",
  "settings.rollback",
  "settings.runtime",
  "audit.read",
] as const

export type AmbassadorPermission = (typeof AMBASSADOR_PERMISSIONS)[number] | "*"

export type AmbassadorAuthenticationSource = "supabase_auth" | "ops_session"

export type AmbassadorActor = {
  actorId: string
  authUserId: string | null
  appUserId: string | null
  authenticationSource: AmbassadorAuthenticationSource
  displayName: string
  email: string | null
  roleKey: string
  tenantId: string
  organizationId: string
  permissions: ReadonlySet<string>
  requestId: string
  ipAddress: string | null
  userAgent: string | null
}

export type AmbassadorServiceErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_INVALID"
  | "SCOPE_REQUIRED"
  | "FORBIDDEN"
  | "CONFIGURATION_ERROR"
  | "PERSISTENCE_ERROR"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "NOT_FOUND"
  | "GATE_BLOCKED"

export type AmbassadorServiceResult<T = unknown> = {
  ok: boolean
  source: "ambassador-supabase" | "ambassador-validation" | "ambassador-auth" | "ambassador-api" | "ambassador-report-engine"
  data?: T
  record?: AmbassadorRecord | null
  records?: AmbassadorRecord[]
  items?: AmbassadorRecord[]
  snapshot?: AmbassadorWorkspaceSnapshot
  error?: string | null
  code?: AmbassadorServiceErrorCode
  diagnostics?: AmbassadorDiagnostic[]
  idempotent?: boolean
  [key: string]: unknown
}

export type AmbassadorDiagnostic = {
  area: string
  reason: string
  severity?: "error" | "warning" | "info"
}

export type AmbassadorRecord = {
  id?: string
  tenant_id?: string | null
  organization_id?: string | null
  created_at?: string | null
  updated_at?: string | null
  archived_at?: string | null
  [key: string]: unknown
}

export type AmbassadorProfile = AmbassadorRecord & {
  full_name?: string
  email?: string | null
  phone?: string | null
  status?: string
  lifecycle_stage?: string
  territory_id?: string | null
}

export type AmbassadorMissionAssignment = AmbassadorRecord & {
  id: string
  mission_id: string
  ambassador_id: string
  assignment_role: "primary" | "support" | "observer" | string
  status: "assigned" | "accepted" | "declined" | "completed" | "revoked" | string
  assigned_by_actor_id: string
}

export type AmbassadorTerritoryAssignment = AmbassadorRecord & {
  id: string
  ambassador_id: string
  territory_id: string
  assignment_type: "primary" | "backup" | "temporary" | string
  status: "pending" | "approved" | "rejected" | "revoked" | string
  external_assignment_key?: string | null
  valid_from?: string | null
  valid_to?: string | null
}

export type AmbassadorProof = AmbassadorRecord & {
  mission_id?: string | null
  ambassador_id?: string
  title?: string
  proof_url?: string
  status?: "submitted" | "under_review" | "approved" | "rejected" | "revision_requested" | string
  reviewed_by_actor_id?: string | null
  reviewed_at?: string | null
}

export type AmbassadorPayout = AmbassadorRecord & {
  ambassador_id?: string
  incentive_id?: string | null
  amount_mad?: number
  status?: "draft" | "pending_approval" | "approved" | "processing" | "paid" | "rejected" | "cancelled" | string
}

export type AmbassadorWorkspaceSnapshot = {
  records: AmbassadorRecord[]
  ambassadors: AmbassadorProfile[]
  archivedRecords: AmbassadorRecord[]
  goals: AmbassadorRecord[]
  missions: AmbassadorRecord[]
  missionAssignments: AmbassadorMissionAssignment[]
  incentives: AmbassadorRecord[]
  proofs: AmbassadorProof[]
  payouts: AmbassadorPayout[]
  onboarding: AmbassadorRecord[]
  recruitment: AmbassadorRecord[]
  leads: AmbassadorRecord[]
  conversions: AmbassadorRecord[]
  territories: AmbassadorRecord[]
  territoryAssignments: AmbassadorTerritoryAssignment[]
  training: AmbassadorRecord[]
  audit: AmbassadorRecord[]
  reports: AmbassadorRecord[]
  settings: AmbassadorRecord
  stats: AmbassadorRecord
  kpis: AmbassadorRecord
  activity: AmbassadorRecord[]
  diagnostics: AmbassadorDiagnostic[]
  updatedAt: string
  [key: string]: unknown
}

export type EntityLifecycle = {
  field: "status" | "stage" | "lifecycle_stage"
  transitions: Readonly<Record<string, readonly string[]>>
}

export const ENTITY_LIFECYCLES: Partial<Record<AmbassadorEntityKey, EntityLifecycle>> = {
  ambassadors: {
    field: "lifecycle_stage",
    transitions: {
      candidate: ["onboarding", "rejected", "archived"],
      onboarding: ["active", "suspended", "archived"],
      active: ["suspended", "inactive", "archived"],
      suspended: ["active", "inactive", "archived"],
      inactive: ["active", "archived"],
      rejected: ["archived"],
      archived: [],
    },
  },
  recruitment: {
    field: "stage",
    transitions: {
      sourced: ["screened", "rejected", "archived"],
      screened: ["interview", "rejected", "archived"],
      interview: ["approved", "rejected", "archived"],
      approved: ["converted", "rejected", "archived"],
      converted: ["archived"],
      rejected: ["screened", "archived"],
      archived: [],
    },
  },
  missions: {
    field: "status",
    transitions: {
      draft: ["assigned", "archived"],
      assigned: ["accepted", "in_progress", "cancelled", "archived"],
      accepted: ["in_progress", "cancelled", "archived"],
      in_progress: ["submitted", "blocked", "cancelled", "archived"],
      blocked: ["in_progress", "cancelled", "archived"],
      submitted: ["approved", "rejected", "archived"],
      rejected: ["in_progress", "submitted", "archived"],
      approved: ["completed", "archived"],
      completed: ["archived"],
      cancelled: ["archived"],
      archived: [],
    },
  },
  leads: {
    field: "status",
    transitions: {
      new: ["contacted", "qualified", "lost", "archived"],
      contacted: ["follow_up", "qualified", "lost", "archived"],
      follow_up: ["contacted", "qualified", "lost", "archived"],
      qualified: ["converted", "lost", "archived"],
      converted: ["archived"],
      lost: ["follow_up", "archived"],
      archived: [],
    },
  },
  conversions: {
    field: "status",
    transitions: {
      pending: ["under_review", "proof_requested", "escalated", "validated", "rejected", "archived"],
      under_review: ["proof_requested", "escalated", "validated", "rejected", "archived"],
      proof_requested: ["under_review", "validated", "rejected", "archived"],
      escalated: ["under_review", "validated", "rejected", "archived"],
      validated: ["paid", "archived"],
      rejected: ["under_review", "archived"],
      paid: ["archived"],
      archived: [],
    },
  },
  incentives: {
    field: "status",
    transitions: {
      pending: ["approved", "rejected", "archived"],
      approved: ["paid", "rejected", "archived"],
      rejected: ["pending", "archived"],
      paid: ["archived"],
      archived: [],
    },
  },
  proofs: {
    field: "status",
    transitions: {
      submitted: ["under_review", "approved", "rejected", "revision_requested", "archived"],
      under_review: ["approved", "rejected", "revision_requested", "archived"],
      revision_requested: ["submitted", "archived"],
      approved: ["archived"],
      rejected: ["submitted", "archived"],
      archived: [],
    },
  },
  payouts: {
    field: "status",
    transitions: {
      draft: ["pending_approval", "cancelled", "archived"],
      pending_approval: ["approved", "rejected", "cancelled", "archived"],
      approved: ["processing", "paid", "cancelled", "archived"],
      processing: ["paid", "rejected", "cancelled", "archived"],
      rejected: ["draft", "archived"],
      paid: ["archived"],
      cancelled: ["archived"],
      archived: [],
    },
  },
}

export function normalizeLifecycleValue(value: unknown): string {
  const raw = String(value ?? "").trim().toLowerCase()
  const aliases: Record<string, string> = {
    entretien: "interview",
    interview_scheduled: "interview",
    selected: "approved",
    accepted: "approved",
    active: "active",
    "en cours": "in_progress",
    done: "completed",
    complete: "completed",
    validated: "validated",
    validée: "validated",
    rejected: "rejected",
    rejetée: "rejected",
  }
  return aliases[raw] || raw.replace(/[\s-]+/g, "_")
}

export function assertLifecycleTransition(entity: AmbassadorEntityKey, fromValue: unknown, toValue: unknown): void {
  const lifecycle = ENTITY_LIFECYCLES[entity]
  if (!lifecycle) return
  const from = normalizeLifecycleValue(fromValue)
  const to = normalizeLifecycleValue(toValue)
  if (!to || from === to) return
  const allowed = lifecycle.transitions[from]
  if (!allowed || !allowed.includes(to)) {
    throw new Error(`Invalid ${entity} lifecycle transition: ${from || "unset"} -> ${to}`)
  }
}
