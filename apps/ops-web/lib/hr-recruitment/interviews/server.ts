import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type {
  InterviewActionInput,
  InterviewActivity,
  InterviewCandidate,
  InterviewCommandSnapshot,
  InterviewInput,
  InterviewMutationResult,
  InterviewOpening,
  InterviewRecord,
  InterviewerOption,
  InterviewType,
  InterviewStatus,
  InterviewMode,
  InterviewDecision,
  JsonObject,
} from "./types";

const TIMEZONE = "Africa/Casablanca";
const INTERVIEW_TABLE = "hr_interviews";
const ACTIVITY_TABLE = "hr_interview_activity";
const CANDIDATE_TABLES = ["hr_candidates", "hr_recruitment_candidates"] as const;
const INTERVIEWER_TABLES = ["hr_staff_profiles", "hr_staff", "app_users"] as const;
const OPENING_TABLES = ["hr_opening_jobs", "hr_job_openings", "hr_openings"] as const;
const TASK_TABLES = ["hr_tasks", "hr_execution_tasks"] as const;

const WRITABLE_ROLES = ["ceo", "manager", "ops_admin", "hr", "coordinator"];

export class InterviewConflictError extends Error {
  conflicts: InterviewRecord[];

  constructor(conflicts: InterviewRecord[]) {
    super("Un conflit de planification a été détecté pour cet intervieweur.");
    this.name = "InterviewConflictError";
    this.conflicts = conflicts;
  }
}

export class InterviewConcurrencyError extends Error {
  constructor() {
    super("Cet entretien a été modifié par un autre utilisateur. Rechargez les données avant de réessayer.");
    this.name = "InterviewConcurrencyError";
  }
}

type Row = Record<string, unknown>;

type Actor = {
  id?: string | null;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
};

function stringValue(row: Row | null | undefined, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return fallback;
}

function nullableString(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function numericValue(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function objectValue(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as JsonObject;
  return {};
}

function isoOrNull(value: unknown): string | null {
  const text = nullableString(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function assertUuid(value: string, label: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${label} invalide.`);
  }
}

function assertUrlOrNull(value: string | null): void {
  if (!value) return;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Le lien de réunion n’est pas une URL valide.");
  }
  if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error("Le lien de réunion doit utiliser HTTP ou HTTPS.");
}

function assertInterviewInput(input: InterviewInput): void {
  if (!input.candidateId && !input.newCandidate?.fullName) throw new Error("Sélectionnez un candidat ou créez-en un nouveau.");
  if (input.candidateId) assertUuid(input.candidateId, "Identifiant candidat");
  if (!input.positionTitle?.trim() && !input.newCandidate?.positionTitle?.trim()) throw new Error("Le poste concerné est obligatoire.");
  if (!input.scheduledLocal || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input.scheduledLocal)) throw new Error("La date et l’heure de l’entretien sont obligatoires.");
  if (!input.leadInterviewer.trim()) throw new Error("L’intervieweur principal est obligatoire.");
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes < 15 || input.durationMinutes > 480) {
    throw new Error("La durée doit être comprise entre 15 et 480 minutes.");
  }
  assertUrlOrNull(nullableString(input.meetingUrl));
}

function formatPartsAt(date: Date, timezone: string): Record<string, number> {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const result: Record<string, number> = {};
  for (const part of parts) {
    if (["year", "month", "day", "hour", "minute", "second"].includes(part.type)) result[part.type] = Number(part.value);
  }
  return result;
}

export function zonedLocalToIso(localValue: string, timezone = TIMEZONE): string {
  const match = localValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) throw new Error("Date locale invalide.");
  const desiredUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6] || 0));
  let candidate = new Date(desiredUtc);
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const current = formatPartsAt(candidate, timezone);
    const representedUtc = Date.UTC(current.year, current.month - 1, current.day, current.hour, current.minute, current.second);
    const delta = desiredUtc - representedUtc;
    if (delta === 0) break;
    candidate = new Date(candidate.getTime() + delta);
  }
  return candidate.toISOString();
}

export function isoToLocalInput(isoValue: string, timezone = TIMEZONE): string {
  const parts = formatPartsAt(new Date(isoValue), timezone);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

function normalizeCandidate(row: Row): InterviewCandidate {
  return {
    id: stringValue(row, ["id"]),
    fullName: stringValue(row, ["full_name", "name", "candidate_name"], "Candidat"),
    email: nullableString(row.email),
    phone: nullableString(row.phone),
    city: nullableString(row.city ?? row.location),
    positionTitle: nullableString(row.desired_position ?? row.job_title ?? row.position),
    openingId: nullableString(row.opening_id ?? row.job_id),
    pipelineStage: nullableString(row.pipeline_stage ?? row.stage),
    decision: nullableString(row.decision),
    status: nullableString(row.status),
  };
}

function normalizeInterviewer(row: Row): InterviewerOption {
  const id = stringValue(row, ["id", "user_id", "profile_id"], stringValue(row, ["email", "full_name", "name"]));
  const status = stringValue(row, ["status", "employment_status"], "active").toLowerCase();
  return {
    id,
    fullName: stringValue(row, ["full_name", "name", "display_name", "email"], "Collaborateur RH"),
    email: nullableString(row.email),
    department: nullableString(row.department),
    position: nullableString(row.position ?? row.job_title ?? row.role),
    active: !["inactive", "archived", "disabled", "terminated"].includes(status),
  };
}

function normalizeOpening(row: Row): InterviewOpening {
  return {
    id: stringValue(row, ["id"]),
    title: stringValue(row, ["title", "job_title", "position", "name"], "Ouverture de poste"),
    department: nullableString(row.department),
    status: nullableString(row.status ?? row.stage),
  };
}

function normalizeInterview(row: Row): InterviewRecord {
  const scheduledAt = stringValue(row, ["scheduled_at", "interview_datetime", "interview_date"], new Date().toISOString());
  const timezone = stringValue(row, ["timezone"], TIMEZONE);
  const rawFeedbackStatus = stringValue(row, ["feedback_status"], "pending");
  const feedbackDueAt = isoOrNull(row.feedback_due_at);
  const feedbackStatus = rawFeedbackStatus === "pending" && feedbackDueAt && new Date(feedbackDueAt).getTime() < Date.now() ? "overdue" : rawFeedbackStatus;
  return {
    id: stringValue(row, ["id"]),
    candidateId: stringValue(row, ["candidate_id"]),
    openingId: nullableString(row.opening_id),
    candidateName: stringValue(row, ["candidate_name", "full_name", "name"], "Candidat"),
    candidateEmail: nullableString(row.candidate_email ?? row.email),
    candidatePhone: nullableString(row.candidate_phone ?? row.phone),
    city: nullableString(row.city ?? row.location),
    positionTitle: nullableString(row.position_title ?? row.desired_position ?? row.job_title ?? row.position),
    interviewType: stringValue(row, ["interview_type"], "hr_interview") as InterviewType,
    status: stringValue(row, ["status"], "scheduled") as InterviewStatus,
    scheduledAt: new Date(scheduledAt).toISOString(),
    scheduledLocal: isoToLocalInput(new Date(scheduledAt).toISOString(), timezone),
    durationMinutes: numericValue(row.duration_minutes, 60),
    timezone,
    mode: stringValue(row, ["mode"], "video") as InterviewMode,
    location: nullableString(row.location),
    meetingUrl: nullableString(row.meeting_url ?? row.video_url),
    leadInterviewer: stringValue(row, ["lead_interviewer", "interviewer", "owner"], "Équipe RH"),
    leadInterviewerId: nullableString(row.lead_interviewer_id),
    panelMembers: stringArray(row.panel_members),
    coordinator: nullableString(row.coordinator),
    priority: stringValue(row, ["priority"], "normal") as "normal" | "high" | "urgent",
    pipelineStageAfter: nullableString(row.pipeline_stage_after),
    decision: stringValue(row, ["decision"], "pending") as InterviewDecision,
    score: row.score === null || row.score === undefined ? null : numericValue(row.score),
    scorecard: objectValue(row.scorecard),
    notes: nullableString(row.notes),
    feedbackStatus: feedbackStatus as InterviewRecord["feedbackStatus"],
    feedbackDueAt,
    feedbackCompletedAt: isoOrNull(row.feedback_completed_at),
    cancellationReason: nullableString(row.cancellation_reason),
    candidateNotificationStatus: nullableString(row.candidate_notification_status),
    version: numericValue(row.version, 1),
    createdBy: nullableString(row.created_by),
    updatedBy: nullableString(row.updated_by),
    createdAt: isoOrNull(row.created_at) || new Date().toISOString(),
    updatedAt: isoOrNull(row.updated_at) || new Date().toISOString(),
  };
}

function normalizeActivity(row: Row): InterviewActivity {
  return {
    id: stringValue(row, ["id"]),
    interviewId: stringValue(row, ["interview_id"]),
    candidateId: nullableString(row.candidate_id),
    activityType: stringValue(row, ["activity_type"], "activity"),
    actorId: nullableString(row.actor_id),
    actorLabel: nullableString(row.actor_label),
    title: stringValue(row, ["title"], "Activité entretien"),
    detail: nullableString(row.detail),
    visibility: stringValue(row, ["visibility"], "internal"),
    metadata: objectValue(row.metadata),
    createdAt: isoOrNull(row.created_at) || new Date().toISOString(),
  };
}

async function actor(): Promise<Actor> {
  return requireRole(WRITABLE_ROLES) as Promise<Actor>;
}

async function selectFirstWorkingTable(tableNames: readonly string[], limit: number, orderColumn = "created_at"): Promise<{ rows: Row[]; table: string | null; warnings: string[] }> {
  const supabase = await createClient();
  const warnings: string[] = [];
  let emptyFallback: { rows: Row[]; table: string } | null = null;
  for (const table of tableNames) {
    try {
      const response = await supabase.from(table).select("*").order(orderColumn, { ascending: false }).limit(limit);
      if (!response.error) {
        const rows = Array.isArray(response.data) ? response.data as Row[] : [];
        if (rows.length > 0) return { rows, table, warnings };
        emptyFallback ||= { rows, table };
      } else {
        warnings.push(`${table}: ${response.error.message}`);
      }
    } catch (error) {
      warnings.push(`${table}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return emptyFallback ? { ...emptyFallback, warnings } : { rows: [], table: null, warnings };
}

async function loadInterviews(): Promise<{ rows: InterviewRecord[]; warnings: string[] }> {
  const supabase = await createClient();
  const response = await supabase.from(INTERVIEW_TABLE).select("*").order("scheduled_at", { ascending: true }).limit(1500);
  if (response.error) return { rows: [], warnings: [`${INTERVIEW_TABLE}: ${response.error.message}`] };
  return { rows: (Array.isArray(response.data) ? response.data : []).map((row) => normalizeInterview(row as Row)), warnings: [] };
}

async function loadActivities(): Promise<{ rows: InterviewActivity[]; warnings: string[] }> {
  const supabase = await createClient();
  const response = await supabase.from(ACTIVITY_TABLE).select("*").order("created_at", { ascending: false }).limit(1200);
  if (response.error) return { rows: [], warnings: [`${ACTIVITY_TABLE}: ${response.error.message}`] };
  return { rows: (Array.isArray(response.data) ? response.data : []).map((row) => normalizeActivity(row as Row)), warnings: [] };
}

export async function getInterviewCommandSnapshot(): Promise<InterviewCommandSnapshot> {
  await actor();
  const [candidatesResult, staffResult, usersResult, openingsResult, interviewsResult, activitiesResult] = await Promise.all([
    selectFirstWorkingTable(CANDIDATE_TABLES, 1500),
    selectFirstWorkingTable(INTERVIEWER_TABLES.slice(0, 2), 800),
    selectFirstWorkingTable([INTERVIEWER_TABLES[2]], 800),
    selectFirstWorkingTable(OPENING_TABLES, 600),
    loadInterviews(),
    loadActivities(),
  ]);

  const candidateMap = new Map<string, InterviewCandidate>();
  for (const row of candidatesResult.rows) {
    const candidate = normalizeCandidate(row);
    if (candidate.id) candidateMap.set(candidate.id, candidate);
  }

  const interviewerMap = new Map<string, InterviewerOption>();
  for (const row of [...staffResult.rows, ...usersResult.rows]) {
    const option = normalizeInterviewer(row);
    if (!option.active || !option.fullName) continue;
    const key = (option.email || option.id || option.fullName).toLowerCase();
    if (!interviewerMap.has(key)) interviewerMap.set(key, option);
  }

  return {
    generatedAt: new Date().toISOString(),
    timezone: TIMEZONE,
    candidates: [...candidateMap.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, "fr")),
    interviewers: [...interviewerMap.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, "fr")),
    openings: openingsResult.rows.map(normalizeOpening).filter((opening) => opening.id).sort((a, b) => a.title.localeCompare(b.title, "fr")),
    interviews: interviewsResult.rows,
    activities: activitiesResult.rows,
    warnings: [
      ...candidatesResult.warnings,
      ...staffResult.warnings,
      ...usersResult.warnings,
      ...openingsResult.warnings,
      ...interviewsResult.warnings,
      ...activitiesResult.warnings,
    ],
  };
}

async function resolveCandidate(input: InterviewInput): Promise<{ candidate: InterviewCandidate; table: string }> {
  const supabase = await createClient();
  if (input.candidateId) {
    for (const table of CANDIDATE_TABLES) {
      const response = await supabase.from(table).select("*").eq("id", input.candidateId).maybeSingle();
      if (!response.error && response.data) return { candidate: normalizeCandidate(response.data as Row), table };
    }
    throw new Error("Le candidat sélectionné est introuvable.");
  }

  const candidate = input.newCandidate;
  if (!candidate?.fullName.trim()) throw new Error("Le nom du nouveau candidat est obligatoire.");
  const payload = {
    full_name: candidate.fullName.trim(),
    email: nullableString(candidate.email),
    phone: nullableString(candidate.phone),
    city: nullableString(candidate.city),
    desired_position: candidate.positionTitle.trim(),
    opening_id: nullableString(candidate.openingId),
    pipeline_stage: "interview",
    stage: "interview",
    status: "active",
    decision: "pending",
    source: "hr_interview_operations_command",
    updated_at: new Date().toISOString(),
  };

  const errors: string[] = [];
  for (const table of CANDIDATE_TABLES) {
    if (table === "hr_recruitment_candidates") {
      const response = await supabase
        .from("hr_recruitment_candidates")
        .insert({
          full_name: payload.full_name,
          email: payload.email,
          phone: payload.phone,
          city: payload.city,
          opening_id: payload.opening_id,
          pipeline_stage: payload.pipeline_stage,
          stage: payload.stage,
          status: payload.status,
          decision: payload.decision,
          source: payload.source,
          notes: input.newCandidate?.positionTitle
            ? `Poste visé: ${input.newCandidate.positionTitle}`
            : null,
          updated_at: payload.updated_at,
          created_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (!response.error && response.data) {
        return {
          candidate: normalizeCandidate(response.data as Row),
          table,
        };
      }

      errors.push(
        `${table}: ${response.error?.message || "échec de création"}`,
      );
      continue;
    }

    const response = await supabase
      .from("hr_candidates")
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (!response.error && response.data) {
      return {
        candidate: normalizeCandidate(response.data as Row),
        table,
      };
    }

    errors.push(
      `${table}: ${response.error?.message || "échec de création"}`,
    );
  }
  throw new Error(`Impossible de créer le candidat. ${errors.join(" | ")}`);
}

async function findConflicts(input: { interviewId?: string; scheduledAt: string; durationMinutes: number; leadInterviewer: string; leadInterviewerId?: string | null; panelMembers?: string[] }): Promise<InterviewRecord[]> {
  const supabase = await createClient();
  const start = new Date(input.scheduledAt);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const rangeStart = new Date(start.getTime() - 12 * 60 * 60_000).toISOString();
  const rangeEnd = new Date(end.getTime() + 12 * 60 * 60_000).toISOString();
  const response = await supabase
    .from(INTERVIEW_TABLE)
    .select("*")
    .gte("scheduled_at", rangeStart)
    .lte("scheduled_at", rangeEnd)
    .in("status", ["scheduled", "confirmed", "in_progress"])
    .limit(300);
  if (response.error) throw new Error(`Vérification des conflits impossible: ${response.error.message}`);

  const targetPeople = new Set([
    input.leadInterviewer.trim().toLowerCase(),
    nullableString(input.leadInterviewerId)?.toLowerCase() || "",
    ...(input.panelMembers || []).map((member) => member.trim().toLowerCase()),
  ].filter(Boolean));

  return (Array.isArray(response.data) ? response.data : [])
    .map((row) => normalizeInterview(row as Row))
    .filter((record) => record.id !== input.interviewId)
    .filter((record) => {
      const recordStart = new Date(record.scheduledAt);
      const recordEnd = new Date(recordStart.getTime() + record.durationMinutes * 60_000);
      if (!(start < recordEnd && end > recordStart)) return false;
      const recordPeople = new Set([
        record.leadInterviewer.toLowerCase(),
        record.leadInterviewerId?.toLowerCase() || "",
        ...record.panelMembers.map((member) => member.toLowerCase()),
      ].filter(Boolean));
      return [...targetPeople].some((person) => recordPeople.has(person));
    });
}

async function writeActivity(params: {
  interviewId: string;
  candidateId: string | null;
  activityType: string;
  actor: Actor;
  title: string;
  detail?: string | null;
  visibility?: string;
  metadata?: JsonObject;
}): Promise<void> {
  const supabase = await createClient();
  const response = await supabase.from(ACTIVITY_TABLE).insert({
    interview_id: params.interviewId,
    candidate_id: params.candidateId,
    activity_type: params.activityType,
    actor_id: params.actor.id || null,
    actor_label: params.actor.full_name || params.actor.email || params.actor.role || "Équipe RH",
    title: params.title,
    detail: nullableString(params.detail),
    visibility: params.visibility || "internal",
    metadata: params.metadata || {},
    created_at: new Date().toISOString(),
  });
  if (response.error) throw new Error(`Journalisation impossible: ${response.error.message}`);
}

async function synchronizeCandidateSnapshot(interview: InterviewRecord): Promise<void> {
  const supabase = await createClient();
  const snapshot = {
    pipeline_stage: interview.pipelineStageAfter || (interview.status === "cancelled" ? "screening" : "interview"),
    stage: interview.pipelineStageAfter || (interview.status === "cancelled" ? "screening" : "interview"),
    decision: interview.decision,
    score: interview.score,
    next_interview_id: ["cancelled", "completed", "no_show"].includes(interview.status) ? null : interview.id,
    interview_date: ["cancelled"].includes(interview.status) ? null : interview.scheduledLocal.slice(0, 10),
    interview_time: ["cancelled"].includes(interview.status) ? null : interview.scheduledLocal.slice(11, 16),
    interview_datetime: ["cancelled"].includes(interview.status) ? null : interview.scheduledAt,
    scheduled_at: ["cancelled"].includes(interview.status) ? null : interview.scheduledAt,
    interviewer: ["cancelled"].includes(interview.status) ? null : interview.leadInterviewer,
    meeting_url: ["cancelled"].includes(interview.status) ? null : interview.meetingUrl,
    interview_status: interview.status,
    interview_type: interview.interviewType,
    feedback_status: interview.feedbackStatus,
    updated_at: new Date().toISOString(),
  };

  const errors: string[] = [];
  let successfulWrites = 0;
  for (const table of CANDIDATE_TABLES) {
    const response = await supabase.from(table).update(snapshot).eq("id", interview.candidateId).select("id");
    if (!response.error && Array.isArray(response.data) && response.data.length > 0) successfulWrites += 1;
    else if (response.error && !/relation .* does not exist/i.test(response.error.message)) errors.push(`${table}: ${response.error.message}`);
  }
  if (successfulWrites === 0) throw new Error(`Synchronisation candidat impossible. ${errors.join(" | ")}`);
}

async function createPreparationTask(interview: InterviewRecord, input: InterviewInput): Promise<void> {
  if (!input.createPreparationTask) return;
  const supabase = await createClient();
  const title = nullableString(input.preparationTaskTitle) || `Préparer l’entretien de ${interview.candidateName}`;
  const dueDate = new Date(new Date(interview.scheduledAt).getTime() - 24 * 60 * 60_000).toISOString();
  const payload = {
    task_type: "interview_preparation",
    title,
    owner: interview.leadInterviewer,
    priority: interview.priority,
    status: "open",
    due_date: dueDate,
    related_module: "recruitment_interviews",
    related_record_id: interview.id,
    description: interview.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const errors: string[] = [];
  for (const table of TASK_TABLES) {
    const response = await supabase.from(table).insert(payload);
    if (!response.error) return;
    errors.push(`${table}: ${response.error.message}`);
  }
  throw new Error(`Entretien enregistré mais création de la tâche impossible: ${errors.join(" | ")}`);
}

function interviewPayload(input: InterviewInput, candidate: InterviewCandidate, scheduledAt: string, actorValue: Actor): Row {
  const feedbackDueAt = input.feedbackDueAt
    ? zonedLocalToIso(input.feedbackDueAt, input.timezone || TIMEZONE)
    : new Date(new Date(scheduledAt).getTime() + 24 * 60 * 60_000).toISOString();
  return {
    candidate_id: candidate.id,
    opening_id: nullableString(input.openingId ?? candidate.openingId),
    candidate_name: candidate.fullName,
    candidate_email: nullableString(input.candidateEmail ?? candidate.email),
    candidate_phone: nullableString(input.candidatePhone ?? candidate.phone),
    city: nullableString(input.city ?? candidate.city),
    position_title: nullableString(input.positionTitle ?? candidate.positionTitle),
    interview_type: input.interviewType,
    status: input.status || "scheduled",
    scheduled_at: scheduledAt,
    duration_minutes: input.durationMinutes,
    timezone: input.timezone || TIMEZONE,
    mode: input.mode,
    location: nullableString(input.location),
    meeting_url: nullableString(input.meetingUrl),
    lead_interviewer: input.leadInterviewer.trim(),
    lead_interviewer_id: nullableString(input.leadInterviewerId),
    panel_members: input.panelMembers || [],
    coordinator: nullableString(input.coordinator),
    priority: input.priority || "normal",
    pipeline_stage_after: nullableString(input.pipelineStageAfter) || "interview",
    decision: input.decision || "pending",
    score: input.score ?? null,
    scorecard: input.scorecard || {},
    notes: nullableString(input.notes),
    feedback_status: "pending",
    feedback_due_at: feedbackDueAt,
    candidate_notification_status: "not_requested",
    updated_by: actorValue.id || null,
    updated_at: new Date().toISOString(),
  };
}

function revalidateInterviewEstate(candidateId?: string): void {
  [
    "/hr",
    "/hr/recruitment",
    "/hr/recruitment/interviews",
    "/hr/recruitment/candidates",
    "/hr/recruitment/kanban",
    "/hr/employees",
  ].forEach((path) => revalidatePath(path));
  if (candidateId) revalidatePath(`/hr/recruitment/candidates/${candidateId}`);
}

export async function createInterview(input: InterviewInput): Promise<InterviewMutationResult> {
  const actorValue = await actor();
  assertInterviewInput(input);
  const candidateResult = await resolveCandidate(input);
  const scheduledAt = zonedLocalToIso(input.scheduledLocal, input.timezone || TIMEZONE);
  const conflicts = await findConflicts({ scheduledAt, durationMinutes: input.durationMinutes, leadInterviewer: input.leadInterviewer, leadInterviewerId: input.leadInterviewerId, panelMembers: input.panelMembers });
  if (conflicts.length) throw new InterviewConflictError(conflicts);

  const supabase = await createClient();
  const payload = { ...interviewPayload(input, candidateResult.candidate, scheduledAt, actorValue), created_by: actorValue.id || null, version: 1, created_at: new Date().toISOString() };
  const response = await supabase.from(INTERVIEW_TABLE).insert(payload).select("*").single();
  if (response.error || !response.data) throw new Error(response.error?.message || "Création de l’entretien impossible.");
  const interview = normalizeInterview(response.data as Row);
  await synchronizeCandidateSnapshot(interview);
  await createPreparationTask(interview, input);
  await writeActivity({ interviewId: interview.id, candidateId: interview.candidateId, activityType: "created", actor: actorValue, title: "Entretien planifié", detail: `${interview.candidateName} · ${interview.leadInterviewer}`, metadata: { scheduledAt: interview.scheduledAt, interviewType: interview.interviewType } });
  revalidateInterviewEstate(interview.candidateId);
  return { ok: true, interview, checkpoints: ["candidate_validated", "conflicts_checked", "interview_created", "candidate_synchronized", ...(input.createPreparationTask ? ["task_created"] : []), "activity_recorded", "routes_revalidated"] };
}

export async function updateInterview(interviewId: string, input: InterviewInput): Promise<InterviewMutationResult> {
  const actorValue = await actor();
  assertUuid(interviewId, "Identifiant entretien");
  assertInterviewInput(input);
  if (!Number.isFinite(input.version)) throw new Error("Version de l’entretien manquante.");
  const candidateResult = await resolveCandidate(input);
  const scheduledAt = zonedLocalToIso(input.scheduledLocal, input.timezone || TIMEZONE);
  const conflicts = await findConflicts({ interviewId, scheduledAt, durationMinutes: input.durationMinutes, leadInterviewer: input.leadInterviewer, leadInterviewerId: input.leadInterviewerId, panelMembers: input.panelMembers });
  if (conflicts.length) throw new InterviewConflictError(conflicts);

  const supabase = await createClient();
  const payload = { ...interviewPayload(input, candidateResult.candidate, scheduledAt, actorValue), version: Number(input.version) + 1 };
  const response = await supabase.from(INTERVIEW_TABLE).update(payload).eq("id", interviewId).eq("version", input.version).select("*").maybeSingle();
  if (response.error) throw new Error(response.error.message);
  if (!response.data) throw new InterviewConcurrencyError();
  const interview = normalizeInterview(response.data as Row);
  await synchronizeCandidateSnapshot(interview);
  await createPreparationTask(interview, input);
  await writeActivity({ interviewId, candidateId: interview.candidateId, activityType: "updated", actor: actorValue, title: "Entretien mis à jour", detail: `${interview.candidateName} · version ${interview.version}`, metadata: { scheduledAt: interview.scheduledAt, status: interview.status } });
  revalidateInterviewEstate(interview.candidateId);
  return { ok: true, interview, checkpoints: ["candidate_validated", "conflicts_checked", "interview_updated", "candidate_synchronized", ...(input.createPreparationTask ? ["task_created"] : []), "activity_recorded", "routes_revalidated"] };
}

export async function cancelInterview(interviewId: string, params: { reason: string; pipelineStage?: string | null; notes?: string | null; version: number }): Promise<InterviewMutationResult> {
  const actorValue = await actor();
  assertUuid(interviewId, "Identifiant entretien");
  if (!params.reason.trim()) throw new Error("Le motif d’annulation est obligatoire.");
  const supabase = await createClient();
  const response = await supabase.from(INTERVIEW_TABLE).update({ status: "cancelled", cancellation_reason: params.reason.trim(), pipeline_stage_after: nullableString(params.pipelineStage) || "screening", notes: nullableString(params.notes), version: params.version + 1, updated_by: actorValue.id || null, updated_at: new Date().toISOString() }).eq("id", interviewId).eq("version", params.version).select("*").maybeSingle();
  if (response.error) throw new Error(response.error.message);
  if (!response.data) throw new InterviewConcurrencyError();
  const interview = normalizeInterview(response.data as Row);
  await synchronizeCandidateSnapshot(interview);
  await writeActivity({ interviewId, candidateId: interview.candidateId, activityType: "cancelled", actor: actorValue, title: "Entretien annulé", detail: params.reason, metadata: { pipelineStage: interview.pipelineStageAfter } });
  revalidateInterviewEstate(interview.candidateId);
  return { ok: true, interview, checkpoints: ["interview_cancelled", "candidate_synchronized", "activity_recorded", "routes_revalidated"] };
}

async function loadInterview(interviewId: string): Promise<InterviewRecord> {
  const supabase = await createClient();
  const response = await supabase.from(INTERVIEW_TABLE).select("*").eq("id", interviewId).maybeSingle();
  if (response.error) throw new Error(response.error.message);
  if (!response.data) throw new Error("Entretien introuvable.");
  return normalizeInterview(response.data as Row);
}

async function createLinkedTask(interview: InterviewRecord, input: Extract<InterviewActionInput, { action: "task" }>, actorValue: Actor): Promise<void> {
  const supabase = await createClient();
  const payload = {
    task_type: "recruitment_interview",
    title: input.title.trim(),
    owner: nullableString(input.owner) || interview.leadInterviewer,
    priority: nullableString(input.priority) || "medium",
    status: "open",
    due_date: nullableString(input.dueDate),
    related_module: "recruitment_interviews",
    related_record_id: interview.id,
    description: nullableString(input.description),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const errors: string[] = [];
  for (const table of TASK_TABLES) {
    const response = await supabase.from(table).insert(payload);
    if (!response.error) {
      await writeActivity({ interviewId: interview.id, candidateId: interview.candidateId, activityType: "task_created", actor: actorValue, title: "Tâche créée", detail: input.title, metadata: { owner: payload.owner, dueDate: payload.due_date } });
      return;
    }
    errors.push(`${table}: ${response.error.message}`);
  }
  throw new Error(`Création de la tâche impossible: ${errors.join(" | ")}`);
}

export async function runInterviewAction(interviewId: string, input: InterviewActionInput): Promise<{ ok: true; interview: InterviewRecord; checkpoints: string[] }> {
  const actorValue = await actor();
  assertUuid(interviewId, "Identifiant entretien");
  const current = await loadInterview(interviewId);

  if (input.action === "comment") {
    if (!input.comment.trim()) throw new Error("Le commentaire est vide.");
    await writeActivity({ interviewId, candidateId: current.candidateId, activityType: input.category || "comment", actor: actorValue, title: "Note interne ajoutée", detail: input.comment, visibility: input.visibility || "internal" });
    revalidateInterviewEstate(current.candidateId);
    return { ok: true, interview: current, checkpoints: ["comment_recorded", "routes_revalidated"] };
  }

  if (input.action === "task") {
    if (!input.title.trim()) throw new Error("Le titre de la tâche est obligatoire.");
    await createLinkedTask(current, input, actorValue);
    revalidateInterviewEstate(current.candidateId);
    return { ok: true, interview: current, checkpoints: ["task_created", "activity_recorded", "routes_revalidated"] };
  }

  const patch: Row = { version: input.version + 1, updated_by: actorValue.id || null, updated_at: new Date().toISOString() };
  let activityType = input.action;
  let title = "Entretien mis à jour";
  let detail: string | null = nullableString("notes" in input ? input.notes : null);

  if (input.action === "complete") {
    patch.status = "completed";
    patch.feedback_status = "pending";
    patch.score = input.score ?? current.score;
    patch.notes = nullableString(input.notes) ?? current.notes;
    title = "Entretien terminé";
  } else if (input.action === "no_show") {
    patch.status = "no_show";
    patch.notes = nullableString(input.notes) ?? current.notes;
    title = "Absence du candidat enregistrée";
  } else if (input.action === "decision") {
    patch.decision = input.decision;
    patch.pipeline_stage_after = nullableString(input.pipelineStage) || current.pipelineStageAfter;
    patch.notes = nullableString(input.notes) ?? current.notes;
    activityType = "decision";
    title = "Décision de recrutement mise à jour";
    detail = input.decision;
  } else if (input.action === "feedback") {
    if (!input.feedback.trim()) throw new Error("Le feedback est obligatoire.");
    patch.feedback_status = "submitted";
    patch.feedback_completed_at = new Date().toISOString();
    patch.score = input.score ?? current.score;
    patch.decision = input.decision || current.decision;
    patch.status = "completed";
    activityType = "feedback";
    title = "Feedback d’entretien soumis";
    detail = input.feedback;
  }

  const supabase = await createClient();
  const response = await supabase.from(INTERVIEW_TABLE).update(patch).eq("id", interviewId).eq("version", input.version).select("*").maybeSingle();
  if (response.error) throw new Error(response.error.message);
  if (!response.data) throw new InterviewConcurrencyError();
  const interview = normalizeInterview(response.data as Row);
  await synchronizeCandidateSnapshot(interview);
  await writeActivity({ interviewId, candidateId: interview.candidateId, activityType, actor: actorValue, title, detail, metadata: { status: interview.status, decision: interview.decision, score: interview.score } });
  revalidateInterviewEstate(interview.candidateId);
  return { ok: true, interview, checkpoints: ["interview_updated", "candidate_synchronized", "activity_recorded", "routes_revalidated"] };
}
