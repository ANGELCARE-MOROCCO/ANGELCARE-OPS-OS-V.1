import "server-only";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireOnboardingActor, type OnboardingActor } from "./permissions";
import {
  booleanValue,
  dateOrNull,
  isoOrNull,
  nullableText,
  phaseValue,
  requiredText,
  safeInteger,
  validateJourneyCreate,
  versionValue,
} from "./validation";
import type {
  JsonObject,
  JsonValue,
  OnboardingActivity,
  OnboardingChecklist,
  OnboardingChecklistItem,
  OnboardingDocument,
  OnboardingJourney,
  OnboardingMutationResponse,
  OnboardingPeopleOption,
  OnboardingTask,
  OnboardingWorkspace,
} from "./types";

const SCHEMA_VERSION = "20260804-onboarding-production-completion-v1";
const STORAGE_BUCKET = "hr-onboarding-documents";
const ONBOARDING_PATHS = [
  "/hr/onboarding",
  "/hr/onboarding/checklists",
  "/hr",
  "/hr/employees",
  "/hr/staff",
  "/hr/recruitment",
  "/hr/recruitment/candidates",
  "/hr/documents",
  "/hr/training",
] as const;

type Row = Record<string, unknown>;

export class OnboardingConcurrencyError extends Error {
  constructor(message = "Cet enregistrement a été modifié par un autre utilisateur. Rechargez les données avant de réessayer.") {
    super(message);
    this.name = "OnboardingConcurrencyError";
  }
}

export class OnboardingOperationError extends Error {
  code: string;
  status: number;
  details: JsonObject;

  constructor(message: string, code = "ONBOARDING_OPERATION_FAILED", status = 400, details: JsonObject = {}) {
    super(message);
    this.name = "OnboardingOperationError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function text(value: unknown, fallback = ""): string {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function nullable(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function numberValue(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function objectValue(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: JsonObject = {};
  for (const [key, item] of Object.entries(value)) {
    if (
      item === null
      || typeof item === "string"
      || typeof item === "number"
      || typeof item === "boolean"
      || Array.isArray(item)
      || (typeof item === "object" && item !== null)
    ) {
      output[key] = item as JsonValue;
    }
  }
  return output;
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeJourney(row: Row): OnboardingJourney {
  const rawStatus = text(row.status, "active").toLowerCase();
  const status = (["draft", "active", "paused", "completed", "cancelled", "archived"] as const).includes(rawStatus as OnboardingJourney["status"])
    ? rawStatus as OnboardingJourney["status"]
    : rawStatus.includes("complete") ? "completed"
      : rawStatus.includes("archive") ? "archived"
        : rawStatus.includes("pause") ? "paused"
          : "active";

  const phase = phaseValue(row.phase ?? row.stage ?? row.current_phase, "offer_accepted");
  const priorityRaw = text(row.priority, "normal").toLowerCase();
  const riskRaw = text(row.risk_level, "normal").toLowerCase();

  return {
    journeyKey: text(row.journey_key ?? row.id),
    sourceId: text(row.id ?? row.journey_key),
    tenantKey: nullable(row.tenant_key),
    organizationKey: nullable(row.organization_key),
    candidateKey: nullable(row.candidate_key ?? row.candidate_id),
    staffKey: nullable(row.staff_key ?? row.staff_id ?? row.employee_id),
    title: text(row.title ?? row.candidate_name ?? row.employee_name ?? row.full_name, "Parcours sans nom"),
    position: nullable(row.position ?? row.job_title ?? row.role),
    department: nullable(row.department ?? row.department_name),
    status,
    phase,
    startDate: nullable(row.start_date ?? row.startDate),
    manager: nullable(row.manager ?? row.manager_name),
    managerKey: nullable(row.manager_key),
    location: nullable(row.location ?? row.city),
    employmentType: nullable(row.employment_type ?? row.employmentType ?? row.contract_type),
    email: nullable(row.email),
    phone: nullable(row.phone),
    owner: nullable(row.owner ?? row.owner_name),
    ownerKey: nullable(row.owner_key),
    priority: (["low", "normal", "high", "critical"] as const).includes(priorityRaw as OnboardingJourney["priority"])
      ? priorityRaw as OnboardingJourney["priority"]
      : "normal",
    riskLevel: (["low", "normal", "high", "critical"] as const).includes(riskRaw as OnboardingJourney["riskLevel"])
      ? riskRaw as OnboardingJourney["riskLevel"]
      : "normal",
    riskNotes: nullable(row.risk_notes),
    progress: Math.max(0, Math.min(100, Math.round(numberValue(row.progress ?? row.completion_rate ?? row.completion_percent, 0)))),
    checklistAssignmentKey: nullable(row.checklist_assignment_key),
    version: Math.max(1, Math.round(numberValue(row.version, 1))),
    archivedAt: nullable(row.archived_at),
    archiveReason: nullable(row.archive_reason),
    pausedAt: nullable(row.paused_at),
    completedAt: nullable(row.completed_at),
    metadata: objectValue(row.metadata ?? row.stage_pack),
    createdAt: text(row.created_at, new Date(0).toISOString()),
    updatedAt: text(row.updated_at ?? row.created_at, new Date(0).toISOString()),
  };
}

function normalizeTask(row: Row): OnboardingTask {
  const statusRaw = text(row.status, "pending").toLowerCase().replaceAll(" ", "_");
  const status = (["pending", "in_progress", "completed", "blocked", "waived", "archived"] as const).includes(statusRaw as OnboardingTask["status"])
    ? statusRaw as OnboardingTask["status"]
    : statusRaw.includes("complete") ? "completed" : "pending";
  const priorityRaw = text(row.priority, "normal").toLowerCase();
  return {
    taskKey: text(row.task_key ?? row.id),
    sourceId: text(row.id ?? row.task_key),
    journeyKey: text(row.journey_key ?? row.journey_id ?? row.onboarding_id),
    title: text(row.title, "Tâche onboarding"),
    groupName: text(row.group_name ?? row.group ?? row.category, "Général"),
    phase: phaseValue(row.phase ?? row.stage, "preboarding"),
    status,
    owner: nullable(row.owner),
    ownerKey: nullable(row.owner_key),
    priority: (["low", "normal", "high", "critical"] as const).includes(priorityRaw as OnboardingTask["priority"])
      ? priorityRaw as OnboardingTask["priority"]
      : "normal",
    dueAt: nullable(row.due_at_ts ?? row.due_at ?? row.due_date),
    completedAt: nullable(row.completed_at),
    blockedAt: nullable(row.blocked_at),
    blockerReason: nullable(row.blocker_reason),
    evidenceUrl: nullable(row.evidence_url),
    notes: nullable(row.notes ?? row.comment),
    required: row.required === undefined ? true : Boolean(row.required),
    sortOrder: Math.max(0, Math.round(numberValue(row.sort_order, 0))),
    version: Math.max(1, Math.round(numberValue(row.version, 1))),
    archivedAt: nullable(row.archived_at),
    metadata: objectValue(row.metadata),
    createdAt: text(row.created_at, new Date(0).toISOString()),
    updatedAt: text(row.updated_at ?? row.created_at, new Date(0).toISOString()),
  };
}

function normalizeDocument(row: Row): OnboardingDocument {
  const statusRaw = text(row.status, "required").toLowerCase();
  const status = (["required", "requested", "uploaded", "validated", "rejected", "waived", "expired", "archived"] as const).includes(statusRaw as OnboardingDocument["status"])
    ? statusRaw as OnboardingDocument["status"]
    : "required";
  return {
    documentKey: text(row.document_key ?? row.id),
    sourceId: text(row.id ?? row.document_key),
    journeyKey: text(row.journey_key ?? row.journey_id ?? row.onboarding_id),
    title: text(row.title, "Document onboarding"),
    category: text(row.category ?? row.document_type, "Général"),
    documentType: nullable(row.document_type),
    status,
    owner: nullable(row.owner),
    ownerKey: nullable(row.owner_key),
    required: row.required === undefined ? true : Boolean(row.required),
    dueDate: nullable(row.due_date ?? row.due_at),
    fileUrl: nullable(row.file_url),
    storageBucket: nullable(row.storage_bucket),
    storagePath: nullable(row.storage_path),
    mimeType: nullable(row.mime_type),
    fileSize: row.file_size === null || row.file_size === undefined ? null : numberValue(row.file_size, 0),
    verifiedBy: nullable(row.verified_by),
    verifiedAt: nullable(row.verified_at),
    rejectedReason: nullable(row.rejected_reason),
    expiresAt: nullable(row.expires_at ?? row.expiry_date),
    waivedAt: nullable(row.waived_at),
    notes: nullable(row.notes ?? row.comment),
    version: Math.max(1, Math.round(numberValue(row.version, 1))),
    archivedAt: nullable(row.archived_at),
    metadata: objectValue(row.metadata),
    createdAt: text(row.created_at, new Date(0).toISOString()),
    updatedAt: text(row.updated_at ?? row.created_at, new Date(0).toISOString()),
  };
}

function normalizeActivity(row: Row): OnboardingActivity {
  return {
    activityKey: text(row.activity_key ?? row.id),
    sourceId: text(row.id ?? row.activity_key),
    journeyKey: text(row.journey_key ?? row.journey_id ?? row.onboarding_id),
    type: text(row.type, "note"),
    status: text(row.status, "recorded"),
    title: text(row.title, "Événement onboarding"),
    body: nullable(row.body ?? row.notes),
    actorKey: nullable(row.actor_key ?? row.created_by),
    actorName: nullable(row.actor_name),
    metadata: objectValue(row.metadata),
    createdAt: text(row.created_at, new Date(0).toISOString()),
  };
}

function normalizeChecklistItem(value: unknown, index: number): OnboardingChecklistItem {
  const row = objectValue(value);
  const priorityRaw = text(row.priority, "normal").toLowerCase();
  return {
    key: text(row.key, `item-${index + 1}`),
    title: text(row.title, `Étape ${index + 1}`),
    groupName: text(row.groupName ?? row.group_name ?? row.group, "Général"),
    phase: phaseValue(row.phase, "preboarding"),
    ownerRole: nullable(row.ownerRole ?? row.owner_role),
    priority: (["low", "normal", "high", "critical"] as const).includes(priorityRaw as OnboardingChecklistItem["priority"])
      ? priorityRaw as OnboardingChecklistItem["priority"]
      : "normal",
    required: row.required === undefined ? true : Boolean(row.required),
    dueOffsetDays: Math.max(0, Math.round(numberValue(row.dueOffsetDays ?? row.due_offset_days, index + 1))),
    documentRequirement: Boolean(row.documentRequirement ?? row.document_requirement),
    documentType: nullable(row.documentType ?? row.document_type),
  };
}

function normalizeChecklist(row: Row): OnboardingChecklist {
  const statusRaw = text(row.lifecycle_status ?? row.status, "draft").toLowerCase();
  const status = (["draft", "published", "inactive", "archived"] as const).includes(statusRaw as OnboardingChecklist["status"])
    ? statusRaw as OnboardingChecklist["status"]
    : row.is_published ? "published" : "draft";
  const rawItems = arrayValue(row.items ?? row.checklist);
  return {
    checklistKey: text(row.checklist_key ?? row.id),
    sourceId: text(row.id ?? row.checklist_key),
    name: text(row.name ?? row.title, "Checklist onboarding"),
    roleKey: nullable(row.role_key),
    departmentKey: nullable(row.department_key ?? row.department_id),
    status,
    version: Math.max(1, Math.round(numberValue(row.version, 1))),
    isPublished: Boolean(row.is_published ?? status === "published"),
    publishedAt: nullable(row.published_at),
    items: rawItems.map(normalizeChecklistItem),
    notes: nullable(row.notes),
    metadata: objectValue(row.metadata),
    createdAt: text(row.created_at, new Date(0).toISOString()),
    updatedAt: text(row.updated_at ?? row.created_at, new Date(0).toISOString()),
  };
}

function normalizePerson(row: Row, kind: OnboardingPeopleOption["kind"]): OnboardingPeopleOption {
  return {
    key: text(row.id ?? row.user_id ?? row.profile_id ?? row.email),
    fullName: text(row.full_name ?? row.name ?? row.display_name ?? row.email, "Identité HR"),
    email: nullable(row.email),
    phone: nullable(row.phone),
    department: nullable(row.department ?? row.department_name),
    position: nullable(row.position ?? row.job_title ?? row.role),
    kind,
  };
}

function scopeAllows(row: Row, actor: OnboardingActor): boolean {
  const tenant = nullable(row.tenant_key);
  const organization = nullable(row.organization_key);
  if (actor.sovereign) {
    if (actor.tenantKey && tenant && actor.tenantKey !== tenant) return false;
    if (actor.organizationKey && organization && actor.organizationKey !== organization) return false;
    return true;
  }
  if (actor.tenantKey && tenant !== actor.tenantKey) return false;
  if (actor.organizationKey && organization !== actor.organizationKey) return false;
  return true;
}

async function selectRows(table: string, limit = 1000): Promise<Row[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.from(table).select("*").limit(limit);
  if (error) throw new OnboardingOperationError(`Lecture impossible de ${table}: ${error.message}`, "ONBOARDING_READ_FAILED", 500);
  return Array.isArray(data) ? data as Row[] : [];
}

async function selectOptionalRows(table: string, limit = 500): Promise<{ rows: Row[]; warning: string | null }> {
  try {
    return { rows: await selectRows(table, limit), warning: null };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erreur inconnue";
    return { rows: [], warning: `${table}: ${detail}` };
  }
}

export async function getOnboardingWorkspace(selectedJourneyKey?: string | null): Promise<OnboardingWorkspace> {
  const actor = await requireOnboardingActor("read");
  const [journeyRows, taskRows, documentRows, activityRows, checklistRows, candidateSource, staffSource, userSource] = await Promise.all([
    selectRows("hr_onboarding_journeys", 500),
    selectRows("hr_onboarding_tasks", 3000),
    selectRows("hr_onboarding_documents", 2000),
    selectRows("hr_onboarding_activity", 4000),
    selectRows("hr_onboarding_checklists", 300),
    selectOptionalRows("hr_candidates", 1000),
    selectOptionalRows("hr_staff_profiles", 1000),
    selectOptionalRows("app_users", 1000),
  ]);
  const candidateRows = candidateSource.rows;
  const staffRows = staffSource.rows;
  const userRows = userSource.rows;
  const sourceWarnings = [actor.scopeWarning, candidateSource.warning, staffSource.warning, userSource.warning]
    .filter((warning): warning is string => Boolean(warning));

  const journeys = journeyRows.filter((row) => scopeAllows(row, actor)).map(normalizeJourney).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const activeJourneyKeys = new Set(journeys.map((item) => item.journeyKey));
  const tasks = taskRows.map(normalizeTask).filter((item) => activeJourneyKeys.has(item.journeyKey) && !item.archivedAt);
  const documents = documentRows.map(normalizeDocument).filter((item) => activeJourneyKeys.has(item.journeyKey) && !item.archivedAt);
  const activity = activityRows.map(normalizeActivity).filter((item) => activeJourneyKeys.has(item.journeyKey)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const checklists = checklistRows.filter((row) => scopeAllows(row, actor)).map(normalizeChecklist).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const selected = selectedJourneyKey && activeJourneyKeys.has(selectedJourneyKey)
    ? selectedJourneyKey
    : journeys.find((journey) => journey.status !== "archived")?.journeyKey ?? journeys[0]?.journeyKey ?? null;

  return {
    journeys,
    tasks,
    documents,
    activity,
    checklists,
    candidates: candidateRows.map((row) => normalizePerson(row, "candidate")).filter((item) => item.key),
    staff: staffRows.map((row) => normalizePerson(row, "staff")).filter((item) => item.key),
    owners: userRows
      .filter((row) => text(row.status, "active") === "active")
      .map((row) => normalizePerson(row, "user"))
      .filter((item) => item.key),
    selectedJourneyKey: selected,
    loadedAt: new Date().toISOString(),
    capabilities: {
      canRead: actor.canRead,
      canManage: actor.canManage,
      canArchive: actor.canArchive,
      canOverride: actor.canOverride,
      canManageChecklists: actor.canManageChecklists,
      canManageDocuments: actor.canManageDocuments,
    },
    diagnostics: {
      scopeResolved: Boolean(actor.tenantKey || actor.organizationKey),
      tenantKey: actor.tenantKey,
      organizationKey: actor.organizationKey,
      schemaVersion: SCHEMA_VERSION,
      warnings: sourceWarnings,
    },
  };
}

function actorPayload(actor: OnboardingActor): JsonObject {
  return {
    userId: actor.userId,
    fullName: actor.fullName,
    role: actor.role,
    sovereign: actor.sovereign,
    tenantKey: actor.tenantKey,
    organizationKey: actor.organizationKey,
  };
}

function revalidateOnboarding(): void {
  for (const path of ONBOARDING_PATHS) revalidatePath(path);
}

async function executeOperation(operation: string, payload: JsonObject, mode: Parameters<typeof requireOnboardingActor>[0] = "manage"): Promise<OnboardingMutationResponse> {
  const actor = await requireOnboardingActor(mode);
  const supabase = await createServiceClient();
  const { data, error } = await supabase.rpc("hr_onboarding_execute", {
    p_operation: operation,
    p_payload: payload,
    p_actor: actorPayload(actor),
  });

  if (error) {
    const message = error.message || "L’opération onboarding a échoué.";
    if (message.includes("ONBOARDING_VERSION_CONFLICT")) throw new OnboardingConcurrencyError();
    throw new OnboardingOperationError(message, "ONBOARDING_RPC_FAILED", 400, { operation });
  }

  const result = objectValue(data);
  if (result.ok === false) {
    throw new OnboardingOperationError(text(result.error, "L’opération onboarding a échoué."), text(result.code, "ONBOARDING_OPERATION_FAILED"), 400, result);
  }

  revalidateOnboarding();
  return {
    ok: true,
    operation,
    message: text(result.message, "Opération onboarding enregistrée."),
    result,
  };
}

export async function createJourney(input: Record<string, unknown>): Promise<OnboardingMutationResponse> {
  const validated = validateJourneyCreate(input);
  return executeOperation("journey.create", {
    candidateKey: validated.candidateKey ?? null,
    staffKey: validated.staffKey ?? null,
    title: validated.title,
    position: validated.position ?? null,
    department: validated.department ?? null,
    startDate: validated.startDate ?? null,
    manager: validated.manager ?? null,
    managerKey: validated.managerKey ?? null,
    location: validated.location ?? null,
    employmentType: validated.employmentType ?? null,
    email: validated.email ?? null,
    phone: validated.phone ?? null,
    owner: validated.owner ?? null,
    ownerKey: validated.ownerKey ?? null,
    priority: validated.priority ?? "normal",
    riskLevel: validated.riskLevel ?? "normal",
    riskNotes: validated.riskNotes ?? null,
    checklistKey: validated.checklistKey ?? null,
    idempotencyKey: validated.idempotencyKey,
    notes: validated.notes ?? null,
  });
}

export async function updateJourney(journeyKey: string, input: Record<string, unknown>): Promise<OnboardingMutationResponse> {
  return executeOperation("journey.update", {
    journeyKey: requiredText(journeyKey, "Parcours", 200),
    version: versionValue(input.version),
    title: nullableText(input.title, 240),
    position: nullableText(input.position, 240),
    department: nullableText(input.department, 240),
    startDate: dateOrNull(input.startDate ?? input.start_date),
    manager: nullableText(input.manager, 240),
    managerKey: nullableText(input.managerKey ?? input.manager_key, 200),
    location: nullableText(input.location, 240),
    employmentType: nullableText(input.employmentType ?? input.employment_type, 120),
    email: nullableText(input.email, 320),
    phone: nullableText(input.phone, 80),
    owner: nullableText(input.owner, 240),
    ownerKey: nullableText(input.ownerKey ?? input.owner_key, 200),
    priority: nullableText(input.priority, 40),
    riskLevel: nullableText(input.riskLevel ?? input.risk_level, 40),
    riskNotes: nullableText(input.riskNotes ?? input.risk_notes, 4000),
    notes: nullableText(input.notes, 8000),
  });
}

export async function archiveJourney(journeyKey: string, input: Record<string, unknown>): Promise<OnboardingMutationResponse> {
  return executeOperation("journey.archive", {
    journeyKey: requiredText(journeyKey, "Parcours", 200),
    version: versionValue(input.version),
    reason: requiredText(input.reason, "La raison d’archivage", 2000),
  }, "archive");
}

export async function performJourneyAction(journeyKey: string, input: Record<string, unknown>): Promise<OnboardingMutationResponse> {
  const action = requiredText(input.action, "Action", 80);
  const mode = action === "override_progress" ? "override" : action === "archive" ? "archive" : "manage";
  return executeOperation(`journey.${action}`, {
    journeyKey: requiredText(journeyKey, "Parcours", 200),
    version: versionValue(input.version),
    reason: nullableText(input.reason, 4000),
    owner: nullableText(input.owner, 240),
    ownerKey: nullableText(input.ownerKey ?? input.owner_key, 200),
    manager: nullableText(input.manager, 240),
    managerKey: nullableText(input.managerKey ?? input.manager_key, 200),
    targetPhase: nullableText(input.targetPhase ?? input.target_phase, 80),
    progress: safeInteger(input.progress, 0, 0, 100),
    force: booleanValue(input.force, false),
  }, mode);
}

export async function createTask(journeyKey: string, input: Record<string, unknown>): Promise<OnboardingMutationResponse> {
  return executeOperation("task.create", {
    journeyKey: requiredText(journeyKey, "Parcours", 200),
    title: requiredText(input.title, "Le titre de la tâche", 500),
    groupName: nullableText(input.groupName ?? input.group_name ?? input.category, 240) ?? "Général",
    phase: phaseValue(input.phase ?? input.stage, "preboarding"),
    status: nullableText(input.status, 40) ?? "pending",
    owner: nullableText(input.owner, 240),
    ownerKey: nullableText(input.ownerKey ?? input.owner_key, 200),
    priority: nullableText(input.priority, 40) ?? "normal",
    dueAt: isoOrNull(input.dueAt ?? input.due_at ?? input.due_date),
    notes: nullableText(input.notes, 8000),
    required: booleanValue(input.required, true),
    sortOrder: safeInteger(input.sortOrder ?? input.sort_order, 0, 0, 10000),
    idempotencyKey: nullableText(input.idempotencyKey ?? input.idempotency_key, 240),
  });
}

export async function updateTask(taskKey: string, input: Record<string, unknown>): Promise<OnboardingMutationResponse> {
  return executeOperation("task.update", {
    taskKey: requiredText(taskKey, "Tâche", 200),
    version: versionValue(input.version),
    title: nullableText(input.title, 500),
    groupName: nullableText(input.groupName ?? input.group_name ?? input.category, 240),
    phase: nullableText(input.phase ?? input.stage, 80),
    status: nullableText(input.status, 40),
    owner: nullableText(input.owner, 240),
    ownerKey: nullableText(input.ownerKey ?? input.owner_key, 200),
    priority: nullableText(input.priority, 40),
    dueAt: isoOrNull(input.dueAt ?? input.due_at ?? input.due_date),
    notes: nullableText(input.notes, 8000),
    required: input.required === undefined ? null : booleanValue(input.required, true),
    blockerReason: nullableText(input.blockerReason ?? input.blocker_reason, 4000),
    evidenceUrl: nullableText(input.evidenceUrl ?? input.evidence_url, 2000),
  });
}

export async function archiveTask(taskKey: string, input: Record<string, unknown>): Promise<OnboardingMutationResponse> {
  return executeOperation("task.archive", {
    taskKey: requiredText(taskKey, "Tâche", 200),
    version: versionValue(input.version),
    reason: requiredText(input.reason, "La raison d’archivage", 2000),
  });
}

export async function createDocument(journeyKey: string, input: Record<string, unknown>): Promise<OnboardingMutationResponse> {
  return executeOperation("document.create", {
    journeyKey: requiredText(journeyKey, "Parcours", 200),
    title: requiredText(input.title, "Le titre du document", 500),
    category: nullableText(input.category, 240) ?? "Général",
    documentType: nullableText(input.documentType ?? input.document_type, 240),
    status: nullableText(input.status, 40) ?? "requested",
    owner: nullableText(input.owner, 240),
    ownerKey: nullableText(input.ownerKey ?? input.owner_key, 200),
    required: booleanValue(input.required, true),
    dueDate: dateOrNull(input.dueDate ?? input.due_date),
    expiresAt: isoOrNull(input.expiresAt ?? input.expires_at),
    notes: nullableText(input.notes, 8000),
    idempotencyKey: nullableText(input.idempotencyKey ?? input.idempotency_key, 240),
  }, "documents");
}

export async function updateDocument(documentKey: string, input: Record<string, unknown>): Promise<OnboardingMutationResponse> {
  return executeOperation("document.update", {
    documentKey: requiredText(documentKey, "Document", 200),
    version: versionValue(input.version),
    title: nullableText(input.title, 500),
    category: nullableText(input.category, 240),
    documentType: nullableText(input.documentType ?? input.document_type, 240),
    status: nullableText(input.status, 40),
    owner: nullableText(input.owner, 240),
    ownerKey: nullableText(input.ownerKey ?? input.owner_key, 200),
    required: input.required === undefined ? null : booleanValue(input.required, true),
    dueDate: dateOrNull(input.dueDate ?? input.due_date),
    expiresAt: isoOrNull(input.expiresAt ?? input.expires_at),
    rejectedReason: nullableText(input.rejectedReason ?? input.rejected_reason, 4000),
    notes: nullableText(input.notes, 8000),
  }, "documents");
}

export async function archiveDocument(documentKey: string, input: Record<string, unknown>): Promise<OnboardingMutationResponse> {
  return executeOperation("document.archive", {
    documentKey: requiredText(documentKey, "Document", 200),
    version: versionValue(input.version),
    reason: requiredText(input.reason, "La raison d’archivage", 2000),
  }, "documents");
}

export async function addActivity(journeyKey: string, input: Record<string, unknown>): Promise<OnboardingMutationResponse> {
  return executeOperation("activity.create", {
    journeyKey: requiredText(journeyKey, "Parcours", 200),
    type: nullableText(input.type, 80) ?? "note",
    status: nullableText(input.status, 80) ?? "recorded",
    title: requiredText(input.title, "Le titre", 500),
    body: nullableText(input.body ?? input.notes, 12000),
    metadata: objectValue(input.metadata),
  });
}

export async function saveChecklist(input: Record<string, unknown>): Promise<OnboardingMutationResponse> {
  const rawItems = arrayValue(input.items ?? input.checklist);
  const items = rawItems.map((item, index) => {
    const row = objectValue(item);
    return {
      key: nullableText(row.key, 200) ?? `item-${index + 1}`,
      title: requiredText(row.title, `Étape ${index + 1}`, 500),
      groupName: nullableText(row.groupName ?? row.group_name ?? row.group, 240) ?? "Général",
      phase: phaseValue(row.phase, "preboarding"),
      ownerRole: nullableText(row.ownerRole ?? row.owner_role, 120),
      priority: nullableText(row.priority, 40) ?? "normal",
      required: booleanValue(row.required, true),
      dueOffsetDays: safeInteger(row.dueOffsetDays ?? row.due_offset_days, index + 1, 0, 365),
      documentRequirement: booleanValue(row.documentRequirement ?? row.document_requirement, false),
      documentType: nullableText(row.documentType ?? row.document_type, 240),
    };
  });
  if (!items.length) throw new OnboardingOperationError("La checklist doit contenir au moins une étape.", "EMPTY_CHECKLIST", 400);

  return executeOperation(input.checklistKey ? "checklist.update" : "checklist.create", {
    checklistKey: nullableText(input.checklistKey ?? input.checklist_key, 200),
    version: input.version === undefined ? null : versionValue(input.version),
    name: requiredText(input.name, "Le nom de la checklist", 300),
    roleKey: nullableText(input.roleKey ?? input.role_key, 160),
    departmentKey: nullableText(input.departmentKey ?? input.department_key ?? input.department_id, 200),
    notes: nullableText(input.notes, 8000),
    items,
  }, "checklists");
}

export async function performChecklistAction(checklistKey: string, input: Record<string, unknown>): Promise<OnboardingMutationResponse> {
  return executeOperation(`checklist.${requiredText(input.action, "Action", 80)}`, {
    checklistKey: requiredText(checklistKey, "Checklist", 200),
    version: versionValue(input.version),
    reason: nullableText(input.reason, 4000),
  }, "checklists");
}

export async function uploadDocumentFile(documentKey: string, file: File, version: number): Promise<OnboardingMutationResponse> {
  const actor = await requireOnboardingActor("documents");
  if (!file.size) throw new OnboardingOperationError("Le fichier est vide.", "EMPTY_FILE", 400);
  if (file.size > 20 * 1024 * 1024) throw new OnboardingOperationError("Le fichier dépasse la limite de 20 Mo.", "FILE_TOO_LARGE", 400);
  const allowedTypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);
  if (!allowedTypes.has(file.type)) throw new OnboardingOperationError("Type de fichier non autorisé.", "FILE_TYPE_DENIED", 400);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
  const storagePath = `${actor.tenantKey || "legacy"}/${documentKey}/${Date.now()}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const supabase = await createServiceClient();
  const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new OnboardingOperationError(`Téléversement impossible: ${uploadError.message}`, "DOCUMENT_UPLOAD_FAILED", 500);

  try {
    const response = await executeOperation("document.upload", {
      documentKey,
      version,
      storageBucket: STORAGE_BUCKET,
      storagePath,
      mimeType: file.type,
      fileSize: file.size,
      originalName: file.name,
    }, "documents");
    return response;
  } catch (error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw error;
  }
}

export async function createDocumentDownload(documentKey: string): Promise<{ url: string; fileName: string }> {
  await requireOnboardingActor("read");
  const supabase = await createServiceClient();
  const { data: rawRecord, error } = await supabase
    .from("hr_onboarding_documents")
    .select("title,storage_bucket,storage_path")
    .eq("document_key", documentKey)
    .maybeSingle();
  const record = (rawRecord ?? null) as Row | null;
  if (error || !record?.storage_bucket || !record?.storage_path) {
    throw new OnboardingOperationError("Aucun fichier téléchargeable n’est associé à ce document.", "DOCUMENT_FILE_MISSING", 404);
  }
  const { data, error: signedError } = await supabase.storage.from(String(record.storage_bucket)).createSignedUrl(String(record.storage_path), 120);
  if (signedError || !data?.signedUrl) throw new OnboardingOperationError("Impossible de générer le lien sécurisé.", "SIGNED_URL_FAILED", 500);
  return { url: data.signedUrl, fileName: text(record.title, "document") };
}
