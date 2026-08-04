"use server";

import {
  addActivity,
  archiveDocument,
  archiveJourney,
  archiveTask,
  createDocument,
  createJourney,
  createTask,
  getOnboardingWorkspace,
  performJourneyAction,
  updateDocument,
  updateJourney,
  updateTask,
} from "@/lib/hr-onboarding/server";
import type {
  OnboardingDocument,
  OnboardingJourney,
  OnboardingMutationResponse,
  OnboardingTask,
} from "@/lib/hr-onboarding/types";

type LegacyResult = OnboardingMutationResponse & { data?: Record<string, unknown> };

const phaseMap: Record<string, string> = {
  "offer & acceptance": "offer_accepted",
  "in progress": "preboarding",
  "pre-boarding": "preboarding",
  preboarding: "preboarding",
  "document collection": "documents",
  documents: "documents",
  orientation: "orientation",
  "training & setup": "training_setup",
  "formation & accès": "training_setup",
  integration: "integration",
  intégration: "integration",
  "probation & review": "probation",
  probation: "probation",
  completed: "completed",
  terminé: "completed",
};

const taskStatusMap: Record<string, string> = {
  pending: "pending",
  "in progress": "in_progress",
  completed: "completed",
  blocked: "blocked",
  waived: "waived",
};

const documentStatusMap: Record<string, string> = {
  required: "required",
  pending: "requested",
  requested: "requested",
  uploaded: "uploaded",
  validated: "validated",
  rejected: "rejected",
  waived: "waived",
  expired: "expired",
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function phaseValue(value: unknown): string {
  const raw = text(value).toLocaleLowerCase("fr");
  return phaseMap[raw] ?? (raw.replace(/[\s&]+/g, "_") || "preboarding");
}

function taskStatus(value: unknown): string {
  const raw = text(value).toLocaleLowerCase("fr");
  return taskStatusMap[raw] ?? (raw.replace(/\s+/g, "_") || "pending");
}

function documentStatus(value: unknown): string {
  const raw = text(value).toLocaleLowerCase("fr");
  return documentStatusMap[raw] ?? (raw.replace(/\s+/g, "_") || "requested");
}

async function workspaceJourney(journeyKey: string): Promise<OnboardingJourney | null> {
  const workspace = await getOnboardingWorkspace(journeyKey);
  return workspace.journeys.find((journey) => journey.journeyKey === journeyKey) ?? null;
}

async function workspaceTask(taskKey: string): Promise<OnboardingTask | null> {
  const workspace = await getOnboardingWorkspace();
  return workspace.tasks.find((task) => task.taskKey === taskKey) ?? null;
}

async function workspaceDocument(documentKey: string): Promise<OnboardingDocument | null> {
  const workspace = await getOnboardingWorkspace();
  return workspace.documents.find((document) => document.documentKey === documentKey) ?? null;
}

function legacyJourney(journey: OnboardingJourney): Record<string, unknown> {
  return {
    id: journey.journeyKey,
    journeyKey: journey.journeyKey,
    title: journey.title,
    position: journey.position ?? "",
    status: journey.phase,
    startDate: journey.startDate ?? "",
    start_date: journey.startDate ?? "",
    department: journey.department ?? "",
    manager: journey.manager ?? "",
    location: journey.location ?? "",
    employmentType: journey.employmentType ?? "",
    employment_type: journey.employmentType ?? "",
    email: journey.email ?? "",
    phone: journey.phone ?? "",
    progress: journey.progress,
    owner: journey.owner ?? "",
    version: journey.version,
  };
}

export async function createOnboardingJourney(payload: Record<string, unknown>): Promise<LegacyResult> {
  const title = text(payload.title ?? payload.candidate_name) || "Nouveau collaborateur";
  const result = await createJourney({
    candidateKey: payload.candidateKey ?? payload.candidate_key ?? null,
    staffKey: payload.staffKey ?? payload.staff_key ?? null,
    title,
    position: payload.position ?? payload.job_title ?? null,
    department: payload.department ?? null,
    startDate: payload.startDate ?? payload.start_date ?? payload.due_at ?? null,
    manager: payload.manager ?? null,
    location: payload.location ?? null,
    employmentType: payload.employmentType ?? payload.employment_type ?? null,
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    owner: payload.owner ?? null,
    priority: text(payload.priority).toLowerCase() || "normal",
    riskLevel: payload.riskLevel ?? payload.risk_level ?? "normal",
    riskNotes: payload.riskNotes ?? payload.risk_notes ?? null,
    checklistKey: payload.checklistKey ?? payload.checklist_key ?? null,
    idempotencyKey: text(payload.idempotencyKey) || crypto.randomUUID(),
    notes: payload.notes ?? payload.launch_note ?? null,
  });

  if (!result.ok) return result;
  const workspace = await getOnboardingWorkspace();
  const journey = [...workspace.journeys]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .find((item) => item.title === title) ?? workspace.journeys[0];
  return { ...result, data: journey ? legacyJourney(journey) : undefined };
}

export async function updateOnboardingJourney(id: string, payload: Record<string, unknown>): Promise<LegacyResult> {
  const journey = await workspaceJourney(id);
  if (!journey) return { ok: false, operation: "journey.update", message: "Parcours introuvable.", error: "Parcours introuvable." };

  const result = await updateJourney(id, {
    version: journey.version,
    title: payload.title,
    position: payload.position ?? payload.job_title,
    department: payload.department,
    startDate: payload.startDate ?? payload.start_date,
    manager: payload.manager,
    location: payload.location,
    employmentType: payload.employmentType ?? payload.employment_type,
    email: payload.email,
    phone: payload.phone,
    owner: payload.owner,
    priority: payload.priority,
    riskLevel: payload.riskLevel ?? payload.risk_level,
    riskNotes: payload.riskNotes ?? payload.risk_notes,
    notes: payload.notes,
  });
  return result;
}

export async function advanceOnboardingJourney(id: string): Promise<LegacyResult> {
  const journey = await workspaceJourney(id);
  if (!journey) return { ok: false, operation: "journey.advance", message: "Parcours introuvable.", error: "Parcours introuvable." };
  return performJourneyAction(id, { action: "advance", version: journey.version });
}

export async function deleteOnboardingJourney(id: string): Promise<LegacyResult> {
  const journey = await workspaceJourney(id);
  if (!journey) return { ok: false, operation: "journey.archive", message: "Parcours introuvable.", error: "Parcours introuvable." };
  return archiveJourney(id, { version: journey.version, reason: "Archivage contrôlé depuis le commandement onboarding" });
}

export async function createOnboardingTask(payload: Record<string, unknown>): Promise<LegacyResult> {
  const journeyKey = text(payload.journeyKey ?? payload.journey_key ?? payload.journey_id);
  return createTask(journeyKey, {
    title: payload.title,
    groupName: payload.groupName ?? payload.group_name ?? payload.group ?? payload.category,
    phase: phaseValue(payload.phase ?? payload.stage),
    status: taskStatus(payload.status),
    owner: payload.owner,
    priority: text(payload.priority).toLowerCase() || "normal",
    dueAt: payload.dueAt ?? payload.due_at ?? payload.due_date,
    notes: payload.notes ?? payload.comment,
    required: payload.required ?? false,
    idempotencyKey: text(payload.idempotencyKey) || crypto.randomUUID(),
  });
}

export async function updateOnboardingTask(id: string, payload: Record<string, unknown>): Promise<LegacyResult> {
  const task = await workspaceTask(id);
  if (!task) return { ok: false, operation: "task.update", message: "Tâche introuvable.", error: "Tâche introuvable." };
  return updateTask(id, { ...payload, version: task.version, status: taskStatus(payload.status ?? task.status) });
}

export async function deleteOnboardingTask(id: string): Promise<LegacyResult> {
  const task = await workspaceTask(id);
  if (!task) return { ok: false, operation: "task.archive", message: "Tâche introuvable.", error: "Tâche introuvable." };
  return archiveTask(id, { version: task.version, reason: "Archivage depuis le tableau onboarding" });
}

export async function createOnboardingDocument(payload: Record<string, unknown>): Promise<LegacyResult> {
  const journeyKey = text(payload.journeyKey ?? payload.journey_key ?? payload.journey_id);
  return createDocument(journeyKey, {
    title: payload.title,
    category: payload.category ?? payload.stage ?? "Général",
    documentType: payload.documentType ?? payload.document_type ?? null,
    status: documentStatus(payload.status),
    owner: payload.owner,
    required: payload.required ?? true,
    dueDate: payload.dueDate ?? payload.due_at ?? payload.due_date ?? null,
    expiresAt: payload.expiresAt ?? payload.expires_at ?? null,
    notes: payload.notes ?? payload.comment ?? null,
    idempotencyKey: text(payload.idempotencyKey) || crypto.randomUUID(),
  });
}

export async function updateOnboardingDocument(id: string, payload: Record<string, unknown>): Promise<LegacyResult> {
  const document = await workspaceDocument(id);
  if (!document) return { ok: false, operation: "document.update", message: "Document introuvable.", error: "Document introuvable." };
  return updateDocument(id, { ...payload, version: document.version, status: documentStatus(payload.status ?? document.status) });
}

export async function deleteOnboardingDocument(id: string): Promise<LegacyResult> {
  const document = await workspaceDocument(id);
  if (!document) return { ok: false, operation: "document.archive", message: "Document introuvable.", error: "Document introuvable." };
  return archiveDocument(id, { version: document.version, reason: "Archivage depuis le commandement onboarding" });
}

export async function addOnboardingNote(payload: Record<string, unknown>): Promise<LegacyResult> {
  const journeyKey = text(payload.journeyKey ?? payload.journey_key ?? payload.journey_id);
  return addActivity(journeyKey, {
    type: payload.type ?? "note",
    title: payload.title ?? "Note onboarding",
    body: payload.body ?? payload.notes ?? payload.comment ?? null,
    status: payload.status ?? "recorded",
  });
}

export async function createOnboardingReminder(payload: Record<string, unknown>): Promise<LegacyResult> {
  return addOnboardingNote({ ...payload, type: "reminder" });
}

export async function reassignOnboardingOwner(id: string, owner: string): Promise<LegacyResult> {
  const journey = await workspaceJourney(id);
  if (!journey) return { ok: false, operation: "journey.reassign", message: "Parcours introuvable.", error: "Parcours introuvable." };
  return performJourneyAction(id, { action: "reassign", owner, version: journey.version, reason: "Réaffectation depuis le commandement onboarding" });
}
